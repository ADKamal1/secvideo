using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecVideo.Application.DTOs;
using SecVideo.Domain.Entities;
using SecVideo.Infrastructure.Data;
using BCrypt.Net;

namespace SecVideo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<AdminController> _logger;

    public AdminController(AppDbContext context, ILogger<AdminController> logger)
    {
        _context = context;
        _logger = logger;
    }

    // User Management
    [HttpGet("users")]
    public async Task<ActionResult> GetUsers(
        [FromQuery] string? search,
        [FromQuery] string? role,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var query = _context.Users
            .Include(u => u.Device)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(u => u.Name.ToLower().Contains(search.ToLower()) ||
                                     u.Email.ToLower().Contains(search.ToLower()));
        }

        if (!string.IsNullOrEmpty(role) && Enum.TryParse<UserRole>(role, out var userRole))
        {
            query = query.Where(u => u.Role == userRole);
        }

        if (isActive.HasValue)
        {
            query = query.Where(u => u.IsActive == isActive.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var users = await query
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new
            {
                u.Id,
                u.Email,
                u.Name,
                u.Avatar,
                Role = u.Role.ToString(),
                u.IsActive,
                u.CreatedAt,
                u.LastLoginAt,
                Device = u.Device != null ? new
                {
                    u.Device.Id,
                    u.Device.Platform,
                    u.Device.IsVerified,
                    u.Device.LastSeenAt
                } : null
            })
            .ToListAsync(cancellationToken);

        return Ok(new { items = users, total, page, pageSize });
    }

    [HttpPost("users")]
    public async Task<ActionResult> CreateUser([FromBody] CreateUserRequest request, CancellationToken cancellationToken)
    {
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (existingUser != null)
        {
            return BadRequest(new { message = "Email already exists" });
        }

        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email,
            Name = request.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = Enum.TryParse<UserRole>(request.Role, out var role) ? role : UserRole.Student,
            IsActive = true
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new
        {
            user.Id,
            user.Email,
            user.Name,
            Role = user.Role.ToString(),
            user.CreatedAt
        });
    }

    [HttpPatch("users/{id}")]
    public async Task<ActionResult> UpdateUser(Guid id, [FromBody] UpdateUserRequest request, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user == null) return NotFound();

        if (request.Name != null) user.Name = request.Name;
        if (request.Role != null && Enum.TryParse<UserRole>(request.Role, out var role)) user.Role = role;
        if (request.IsActive.HasValue) user.IsActive = request.IsActive.Value;
        if (!string.IsNullOrEmpty(request.Password))
        {
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "User updated" });
    }

    [HttpDelete("users/{id}")]
    public async Task<ActionResult> DeleteUser(Guid id, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { id }, cancellationToken);
        if (user == null) return NotFound();

        _context.Users.Remove(user);
        await _context.SaveChangesAsync(cancellationToken);
        return NoContent();
    }

    // Session Management
    [HttpGet("sessions")]
    public async Task<ActionResult> GetActiveSessions(CancellationToken cancellationToken)
    {
        var sessions = await _context.Sessions
            .Where(s => s.IsActive)
            .Include(s => s.User)
            .OrderByDescending(s => s.LastHeartbeat)
            .Select(s => new
            {
                s.Id,
                s.UserId,
                UserEmail = s.User.Email,
                UserName = s.User.Name,
                s.IpAddress,
                s.CreatedAt,
                s.LastHeartbeat,
                s.ExpiresAt
            })
            .ToListAsync(cancellationToken);

        return Ok(sessions);
    }

    [HttpDelete("sessions/{id}")]
    public async Task<ActionResult> TerminateSession(Guid id, [FromBody] TerminateSessionRequest? request, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions.FindAsync(new object[] { id }, cancellationToken);
        if (session == null) return NotFound();

        session.IsActive = false;
        session.TerminatedAt = DateTime.UtcNow;
        session.TerminationReason = request?.Reason ?? "Terminated by admin";

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Session terminated" });
    }

    // Security Events
    [HttpGet("security-events")]
    public async Task<ActionResult> GetSecurityEvents(
        [FromQuery] Guid? userId,
        [FromQuery] string? eventType,
        [FromQuery] string? severity,
        [FromQuery] DateTime? from,
        [FromQuery] DateTime? to,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 50,
        CancellationToken cancellationToken = default)
    {
        var query = _context.SecurityEvents
            .Include(e => e.User)
            .AsQueryable();

        if (userId.HasValue) query = query.Where(e => e.UserId == userId.Value);
        if (!string.IsNullOrEmpty(eventType)) query = query.Where(e => e.EventType == eventType);
        if (!string.IsNullOrEmpty(severity) && Enum.TryParse<SecuritySeverity>(severity, out var sev))
            query = query.Where(e => e.Severity == sev);
        if (from.HasValue) query = query.Where(e => e.CreatedAt >= from.Value);
        if (to.HasValue) query = query.Where(e => e.CreatedAt <= to.Value);

        var total = await query.CountAsync(cancellationToken);
        var events = await query
            .OrderByDescending(e => e.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(e => new
            {
                e.Id,
                e.UserId,
                UserEmail = e.User.Email,
                e.SessionId,
                e.VideoId,
                e.EventType,
                e.Details,
                e.IpAddress,
                Severity = e.Severity.ToString(),
                e.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return Ok(new { items = events, total, page, pageSize });
    }

    // Analytics Dashboard
    [HttpGet("dashboard")]
    public async Task<ActionResult> GetDashboard(CancellationToken cancellationToken)
    {
        var now = DateTime.UtcNow;
        var last24Hours = now.AddHours(-24);
        var last7Days = now.AddDays(-7);

        var stats = new
        {
            Users = new
            {
                Total = await _context.Users.CountAsync(cancellationToken),
                Active = await _context.Users.CountAsync(u => u.IsActive, cancellationToken),
                NewLast24Hours = await _context.Users.CountAsync(u => u.CreatedAt >= last24Hours, cancellationToken),
                NewLast7Days = await _context.Users.CountAsync(u => u.CreatedAt >= last7Days, cancellationToken)
            },
            Courses = new
            {
                Total = await _context.Courses.CountAsync(cancellationToken),
                Active = await _context.Courses.CountAsync(c => c.IsActive, cancellationToken)
            },
            Videos = new
            {
                Total = await _context.Videos.CountAsync(cancellationToken),
                Active = await _context.Videos.CountAsync(v => v.IsActive, cancellationToken),
                ExpiringSoon = await _context.Videos.CountAsync(v => v.ExpiresAt <= now.AddHours(24), cancellationToken)
            },
            Sessions = new
            {
                Active = await _context.Sessions.CountAsync(s => s.IsActive, cancellationToken),
                Last24Hours = await _context.Sessions.CountAsync(s => s.CreatedAt >= last24Hours, cancellationToken)
            },
            SecurityEvents = new
            {
                Last24Hours = await _context.SecurityEvents.CountAsync(e => e.CreatedAt >= last24Hours, cancellationToken),
                Critical = await _context.SecurityEvents.CountAsync(e => e.Severity == SecuritySeverity.Critical && e.CreatedAt >= last7Days, cancellationToken),
                Warnings = await _context.SecurityEvents.CountAsync(e => e.Severity == SecuritySeverity.Warning && e.CreatedAt >= last7Days, cancellationToken)
            },
            Enrollments = new
            {
                Total = await _context.CourseEnrollments.CountAsync(cancellationToken),
                Last7Days = await _context.CourseEnrollments.CountAsync(e => e.EnrolledAt >= last7Days, cancellationToken)
            }
        };

        return Ok(stats);
    }

    // Reset user device (allow re-registration)
    [HttpPost("users/{id}/reset-device")]
    public async Task<ActionResult> ResetUserDevice(Guid id, CancellationToken cancellationToken)
    {
        var device = await _context.Devices.FirstOrDefaultAsync(d => d.UserId == id, cancellationToken);
        if (device != null)
        {
            _context.Devices.Remove(device);
        }

        // Also terminate all sessions
        var sessions = await _context.Sessions
            .Where(s => s.UserId == id && s.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var session in sessions)
        {
            session.IsActive = false;
            session.TerminatedAt = DateTime.UtcNow;
            session.TerminationReason = "Device reset by admin";
        }

        await _context.SaveChangesAsync(cancellationToken);
        return Ok(new { message = "Device reset. User can register a new device." });
    }
}

public record CreateUserRequest(string Email, string Name, string Password, string? Role);
public record UpdateUserRequest(string? Name, string? Role, bool? IsActive, string? Password);
public record TerminateSessionRequest(string? Reason);

