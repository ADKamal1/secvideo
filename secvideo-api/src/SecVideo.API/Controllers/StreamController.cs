using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecVideo.Infrastructure.Data;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace SecVideo.API.Controllers;

/// <summary>
/// Controller for secure video streaming with encryption key delivery
/// </summary>
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class StreamController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<StreamController> _logger;
    private readonly IConfiguration _configuration;

    public StreamController(AppDbContext context, ILogger<StreamController> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    /// <summary>
    /// Get HLS stream manifest for a video
    /// </summary>
    [HttpGet("{videoId}/stream.m3u8")]
    public async Task<ActionResult> GetStreamManifest(Guid videoId, CancellationToken cancellationToken)
    {
        var validation = await ValidateStreamAccess(videoId, cancellationToken);
        if (!validation.IsValid)
        {
            return Unauthorized(new { message = validation.Error });
        }

        var video = await _context.Videos.FindAsync(new object[] { videoId }, cancellationToken);
        if (video == null) return NotFound();

        // In production, this would return the actual HLS manifest from storage
        // For now, return a sample manifest structure
        var baseUrl = $"{Request.Scheme}://{Request.Host}/api/stream/{videoId}";
        
        var manifest = $@"#EXTM3U
#EXT-X-VERSION:3
#EXT-X-TARGETDURATION:10
#EXT-X-MEDIA-SEQUENCE:0
#EXT-X-KEY:METHOD=AES-128,URI=""{baseUrl}/key""
#EXTINF:10.0,
{baseUrl}/segment_0.ts
#EXTINF:10.0,
{baseUrl}/segment_1.ts
#EXTINF:10.0,
{baseUrl}/segment_2.ts
#EXT-X-ENDLIST";

        return Content(manifest, "application/vnd.apple.mpegurl");
    }

    /// <summary>
    /// Get encryption key for a video (user-specific)
    /// </summary>
    [HttpGet("{videoId}/key")]
    public async Task<ActionResult> GetEncryptionKey(Guid videoId, CancellationToken cancellationToken)
    {
        var validation = await ValidateStreamAccess(videoId, cancellationToken);
        if (!validation.IsValid)
        {
            return Unauthorized(new { message = validation.Error });
        }

        var userId = GetUserId();
        var sessionId = GetSessionId();

        // Generate a user-session-specific key
        // In production, retrieve the actual video encryption key
        var keyMaterial = $"{videoId}-{userId}-{sessionId}-{_configuration["Jwt:SecretKey"]}";
        using var sha = SHA256.Create();
        var hash = sha.ComputeHash(Encoding.UTF8.GetBytes(keyMaterial));
        var key = new byte[16]; // AES-128 key
        Array.Copy(hash, key, 16);

        _logger.LogInformation("Encryption key requested for video {VideoId} by user {UserId}", videoId, userId);

        return File(key, "application/octet-stream");
    }

    /// <summary>
    /// Get video segment (proxied from storage)
    /// </summary>
    [HttpGet("{videoId}/segment_{index}.ts")]
    public async Task<ActionResult> GetSegment(Guid videoId, int index, CancellationToken cancellationToken)
    {
        var validation = await ValidateStreamAccess(videoId, cancellationToken);
        if (!validation.IsValid)
        {
            return Unauthorized(new { message = validation.Error });
        }

        var video = await _context.Videos.FindAsync(new object[] { videoId }, cancellationToken);
        if (video == null) return NotFound();

        // In production, retrieve the segment from MinIO/S3 storage
        // For now, return a placeholder response
        var storagePath = _configuration["VideoStorage:LocalPath"] ?? "./videos";
        var segmentPath = Path.Combine(storagePath, video.StoragePath, $"segment_{index}.ts");

        if (!System.IO.File.Exists(segmentPath))
        {
            // Return empty segment for demo
            return File(Array.Empty<byte>(), "video/mp2t");
        }

        return PhysicalFile(segmentPath, "video/mp2t");
    }

    /// <summary>
    /// Get subtitle file
    /// </summary>
    [HttpGet("{videoId}/subtitles/{subtitleId}")]
    public async Task<ActionResult> GetSubtitle(Guid videoId, Guid subtitleId, CancellationToken cancellationToken)
    {
        var validation = await ValidateStreamAccess(videoId, cancellationToken);
        if (!validation.IsValid)
        {
            return Unauthorized(new { message = validation.Error });
        }

        var subtitle = await _context.VideoSubtitles
            .FirstOrDefaultAsync(s => s.Id == subtitleId && s.VideoId == videoId, cancellationToken);

        if (subtitle == null) return NotFound();

        var storagePath = _configuration["VideoStorage:LocalPath"] ?? "./videos";
        var subtitlePath = Path.Combine(storagePath, subtitle.FilePath);

        if (!System.IO.File.Exists(subtitlePath))
        {
            // Return sample VTT content for demo
            var sampleVtt = @"WEBVTT

00:00:00.000 --> 00:00:05.000
Welcome to this course!

00:00:05.000 --> 00:00:10.000
Let's begin our learning journey.";
            return Content(sampleVtt, "text/vtt");
        }

        return PhysicalFile(subtitlePath, "text/vtt");
    }

    private async Task<(bool IsValid, string? Error)> ValidateStreamAccess(Guid videoId, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();
        var deviceHash = Request.Headers["X-Device-Hash"].FirstOrDefault();

        if (userId == null || sessionId == null)
        {
            return (false, "Invalid token");
        }

        // Verify session
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId.Value && s.IsActive, cancellationToken);

        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            return (false, "Session expired");
        }

        // Verify device
        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

        if (user?.Device?.FingerprintHash != deviceHash || !user.Device.IsVerified)
        {
            _logger.LogWarning("Device mismatch for user {UserId} accessing video {VideoId}", userId, videoId);
            return (false, "Device verification required");
        }

        // Verify video access
        var video = await _context.Videos.FindAsync(new object[] { videoId }, cancellationToken);
        if (video == null)
        {
            return (false, "Video not found");
        }

        if (video.ExpiresAt < DateTime.UtcNow)
        {
            return (false, "Video has expired");
        }

        // Check enrollment
        var isEnrolled = await _context.CourseEnrollments
            .AnyAsync(e => e.CourseId == video.CourseId && e.UserId == userId.Value, cancellationToken);

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var course = await _context.Courses.FindAsync(new object[] { video.CourseId }, cancellationToken);

        if (!isEnrolled && userRole != "Admin" && course?.InstructorId != userId)
        {
            return (false, "Not enrolled in this course");
        }

        // Update heartbeat
        session.LastHeartbeat = DateTime.UtcNow;
        user.Device.LastSeenAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return (true, null);
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private Guid? GetSessionId()
    {
        var sessionIdClaim = User.FindFirst("session_id")?.Value;
        return Guid.TryParse(sessionIdClaim, out var sessionId) ? sessionId : null;
    }
}

