using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using SecVideo.Domain.Entities;
using SecVideo.Infrastructure.Data;
using System.Security.Claims;

namespace SecVideo.API.Hubs;

[Authorize]
public class SessionHub : Hub
{
    private readonly AppDbContext _context;
    private readonly ILogger<SessionHub> _logger;
    private static readonly Dictionary<string, string> _userConnections = new();

    public SessionHub(AppDbContext context, ILogger<SessionHub> logger)
    {
        _context = context;
        _logger = logger;
    }

    public override async Task OnConnectedAsync()
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();

        if (userId != null && sessionId != null)
        {
            var userIdStr = userId.Value.ToString();

            // Check if user already has an active connection (another tab/window)
            if (_userConnections.TryGetValue(userIdStr, out var existingConnectionId) && 
                existingConnectionId != Context.ConnectionId)
            {
                // Notify the other connection that it's being terminated
                await Clients.Client(existingConnectionId).SendAsync("session:another_login");
                _logger.LogInformation("User {UserId} has multiple connections, terminating old one", userId);
            }

            _userConnections[userIdStr] = Context.ConnectionId;
            _logger.LogInformation("User {UserId} connected with session {SessionId}", userId, sessionId);
        }

        await base.OnConnectedAsync();
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        var userId = GetUserId();

        if (userId != null)
        {
            var userIdStr = userId.Value.ToString();
            if (_userConnections.TryGetValue(userIdStr, out var connId) && connId == Context.ConnectionId)
            {
                _userConnections.Remove(userIdStr);
            }
            _logger.LogInformation("User {UserId} disconnected", userId);
        }

        await base.OnDisconnectedAsync(exception);
    }

    public async Task Heartbeat(HeartbeatMessage message)
    {
        var sessionId = GetSessionId();
        if (sessionId == null) return;

        var session = await _context.Sessions.FindAsync(sessionId.Value);
        if (session != null && session.IsActive)
        {
            session.LastHeartbeat = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await Clients.Caller.SendAsync("heartbeat:ack", new { serverTime = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds() });
        }
        else
        {
            // Session no longer valid
            await Clients.Caller.SendAsync("session:killed", new { reason = "Session expired or invalidated" });
        }
    }

    public async Task ReportSecurityEvent(SecurityEventMessage message)
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();

        if (userId == null) return;

        _logger.LogWarning("Security event from user {UserId}: {EventType}", userId, message.Type);

        var securityEvent = new SecurityEvent
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            SessionId = sessionId,
            VideoId = message.VideoId,
            EventType = message.Type,
            Details = System.Text.Json.JsonSerializer.Serialize(message.Details),
            Severity = DetermineSeverity(message.Type),
            CreatedAt = DateTime.UtcNow
        };

        _context.SecurityEvents.Add(securityEvent);
        await _context.SaveChangesAsync();

        // If critical security event, notify admins (could be implemented)
        if (securityEvent.Severity == SecuritySeverity.Critical)
        {
            _logger.LogCritical("Critical security event from user {UserId}: {EventType}", userId, message.Type);
        }
    }

    public async Task RequestPlayback(PlaybackRequestMessage message)
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();

        if (userId == null || sessionId == null)
        {
            await Clients.Caller.SendAsync("playback:response", new { allowed = false });
            return;
        }

        // Verify session is still valid
        var session = await _context.Sessions.FindAsync(sessionId.Value);
        if (session == null || !session.IsActive)
        {
            await Clients.Caller.SendAsync("playback:response", new { allowed = false });
            return;
        }

        await Clients.Caller.SendAsync("playback:response", new { allowed = true });
    }

    public async Task ReportPlaybackProgress(PlaybackProgressMessage message)
    {
        var userId = GetUserId();
        if (userId == null) return;

        var progress = await _context.WatchProgress
            .FirstOrDefaultAsync(wp => wp.UserId == userId.Value && wp.VideoId == message.VideoId);

        if (progress == null)
        {
            progress = new WatchProgress
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                VideoId = message.VideoId
            };
            _context.WatchProgress.Add(progress);
        }

        progress.LastPositionSeconds = message.Position;
        progress.WatchDurationSeconds += 5; // Assuming 5-second heartbeat interval
        progress.CompletionPercentage = message.Duration > 0 
            ? (int)((message.Position / (double)message.Duration) * 100) 
            : 0;
        progress.LastWatchedAt = DateTime.UtcNow;
        progress.IsCompleted = progress.CompletionPercentage >= 90;

        await _context.SaveChangesAsync();
    }

    public async Task KillSession(Guid targetSessionId, string reason)
    {
        // Only admins can kill sessions
        var userRole = Context.User?.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin") return;

        var session = await _context.Sessions.FindAsync(targetSessionId);
        if (session != null)
        {
            session.IsActive = false;
            session.TerminatedAt = DateTime.UtcNow;
            session.TerminationReason = reason;
            await _context.SaveChangesAsync();

            // Find connection and notify
            var targetUserId = session.UserId.ToString();
            if (_userConnections.TryGetValue(targetUserId, out var connectionId))
            {
                await Clients.Client(connectionId).SendAsync("session:killed", new { reason });
            }
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private Guid? GetSessionId()
    {
        var sessionIdClaim = Context.User?.FindFirst("session_id")?.Value;
        return Guid.TryParse(sessionIdClaim, out var sessionId) ? sessionId : null;
    }

    private static SecuritySeverity DetermineSeverity(string eventType)
    {
        return eventType.ToLower() switch
        {
            "devtools_opened" => SecuritySeverity.Warning,
            "devtools_console_detected" => SecuritySeverity.Warning,
            "screenshot_attempt" => SecuritySeverity.Warning,
            "screen_capture_attempted" => SecuritySeverity.Critical,
            "debugger_detected" => SecuritySeverity.Critical,
            "print_screen_attempt" => SecuritySeverity.Warning,
            _ => SecuritySeverity.Info
        };
    }

}

public record HeartbeatMessage(long Timestamp, bool TabVisible);
public record SecurityEventMessage(string Type, Guid? VideoId, Dictionary<string, object>? Details);
public record PlaybackRequestMessage(Guid VideoId);
public record PlaybackProgressMessage(Guid VideoId, int Position, int Duration);

