using Microsoft.EntityFrameworkCore;
using SecVideo.Application.Common.Interfaces;
using SecVideo.Application.DTOs;
using SecVideo.Domain.Entities;
using SecVideo.Infrastructure.Data;

namespace SecVideo.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IJwtService _jwtService;
    private readonly IEmailService _emailService;

    public AuthService(AppDbContext context, IJwtService jwtService, IEmailService emailService)
    {
        _context = context;
        _jwtService = jwtService;
        _emailService = emailService;
    }

    public async Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password");
        }

        if (!user.IsActive)
        {
            throw new UnauthorizedAccessException("Account is disabled");
        }

        // Check device
        if (user.Device == null)
        {
            // First time login - create device and require verification
            var verificationCode = GenerateVerificationCode();
            var device = new Device
            {
                Id = Guid.NewGuid(),
                UserId = user.Id,
                FingerprintHash = request.DeviceHash,
                IsVerified = false,
                VerificationCode = verificationCode,
                VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15)
            };

            _context.Devices.Add(device);
            await _context.SaveChangesAsync(cancellationToken);

            // Send verification email
            await _emailService.SendDeviceVerificationEmailAsync(user.Email, verificationCode, cancellationToken);

            var tempToken = _jwtService.GenerateTempToken(user.Id);
            return new LoginResponse(null, null, null, null, true, tempToken);
        }

        // Check if device hash matches
        if (user.Device.FingerprintHash != request.DeviceHash)
        {
            // Different device - require verification
            var verificationCode = GenerateVerificationCode();
            user.Device.FingerprintHash = request.DeviceHash;
            user.Device.IsVerified = false;
            user.Device.VerificationCode = verificationCode;
            user.Device.VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);
            user.Device.VerifiedAt = null;

            await _context.SaveChangesAsync(cancellationToken);

            await _emailService.SendDeviceVerificationEmailAsync(user.Email, verificationCode, cancellationToken);

            var tempToken = _jwtService.GenerateTempToken(user.Id);
            return new LoginResponse(null, null, null, null, true, tempToken);
        }

        if (!user.Device.IsVerified)
        {
            // Device not yet verified
            var tempToken = _jwtService.GenerateTempToken(user.Id);
            return new LoginResponse(null, null, null, null, true, tempToken);
        }

        // Device verified - create session and return tokens
        return await CreateSessionAndReturnResponse(user, user.Device, ipAddress, cancellationToken);
    }

    public async Task RegisterAsync(RegisterRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        // Check if email already exists
        var existingUser = await _context.Users
            .FirstOrDefaultAsync(u => u.Email.ToLower() == request.Email.ToLower(), cancellationToken);

        if (existingUser != null)
        {
            throw new InvalidOperationException("An account with this email already exists");
        }

        // Validate password
        if (string.IsNullOrEmpty(request.Password) || request.Password.Length < 8)
        {
            throw new InvalidOperationException("Password must be at least 8 characters long");
        }

        // Create user
        var user = new User
        {
            Id = Guid.NewGuid(),
            Email = request.Email.ToLower(),
            Name = request.Name,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            Role = UserRole.Student, // Default role for self-registration
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync(cancellationToken);
    }

    public async Task<LoginResponse> VerifyDeviceAsync(string tempToken, DeviceVerificationRequest request, string? ipAddress, CancellationToken cancellationToken)
    {
        var userId = _jwtService.ValidateTempToken(tempToken);
        if (userId == null)
        {
            throw new UnauthorizedAccessException("Invalid or expired verification token");
        }

        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

        if (user?.Device == null)
        {
            throw new UnauthorizedAccessException("User or device not found");
        }

        if (user.Device.VerificationCode != request.Code)
        {
            throw new UnauthorizedAccessException("Invalid verification code");
        }

        if (user.Device.VerificationCodeExpiry < DateTime.UtcNow)
        {
            throw new UnauthorizedAccessException("Verification code has expired");
        }

        // Verify device
        user.Device.IsVerified = true;
        user.Device.VerifiedAt = DateTime.UtcNow;
        user.Device.VerificationCode = null;
        user.Device.VerificationCodeExpiry = null;
        user.Device.FingerprintHash = request.DeviceHash;
        user.Device.UserAgent = request.DeviceInfo.UserAgent;
        user.Device.Platform = request.DeviceInfo.Platform;
        user.Device.ScreenResolution = request.DeviceInfo.ScreenResolution;
        user.Device.Timezone = request.DeviceInfo.Timezone;
        user.Device.LastSeenAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return await CreateSessionAndReturnResponse(user, user.Device, ipAddress, cancellationToken);
    }

    public async Task<SessionValidationResponse> ValidateSessionAsync(Guid userId, Guid sessionId, string deviceHash, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user == null || !user.IsActive)
        {
            return new SessionValidationResponse(false, null);
        }

        // Verify device hash
        if (user.Device?.FingerprintHash != deviceHash || !user.Device.IsVerified)
        {
            return new SessionValidationResponse(false, null);
        }

        // Verify session is active
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId && s.IsActive, cancellationToken);

        if (session == null || session.ExpiresAt < DateTime.UtcNow)
        {
            return new SessionValidationResponse(false, null);
        }

        // Update last heartbeat
        session.LastHeartbeat = DateTime.UtcNow;
        user.Device.LastSeenAt = DateTime.UtcNow;
        await _context.SaveChangesAsync(cancellationToken);

        return new SessionValidationResponse(true, MapToUserDto(user));
    }

    public async Task LogoutAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId && s.UserId == userId, cancellationToken);

        if (session != null)
        {
            session.IsActive = false;
            session.TerminatedAt = DateTime.UtcNow;
            session.TerminationReason = "User logout";
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task TerminateSessionAsync(Guid sessionId, string reason, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions.FindAsync(new object[] { sessionId }, cancellationToken);
        if (session != null)
        {
            session.IsActive = false;
            session.TerminatedAt = DateTime.UtcNow;
            session.TerminationReason = reason;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task UpdateHeartbeatAsync(Guid sessionId, CancellationToken cancellationToken)
    {
        var session = await _context.Sessions.FindAsync(new object[] { sessionId }, cancellationToken);
        if (session != null && session.IsActive)
        {
            session.LastHeartbeat = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    public async Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _context.Users.FindAsync(new object[] { userId }, cancellationToken);
        return user != null ? MapToUserDto(user) : null;
    }

    public async Task ResendVerificationCodeAsync(Guid userId, CancellationToken cancellationToken)
    {
        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Id == userId, cancellationToken);

        if (user?.Device == null)
        {
            throw new InvalidOperationException("User or device not found");
        }

        var verificationCode = GenerateVerificationCode();
        user.Device.VerificationCode = verificationCode;
        user.Device.VerificationCodeExpiry = DateTime.UtcNow.AddMinutes(15);

        await _context.SaveChangesAsync(cancellationToken);
        await _emailService.SendDeviceVerificationEmailAsync(user.Email, verificationCode, cancellationToken);
    }

    private async Task<LoginResponse> CreateSessionAndReturnResponse(User user, Device device, string? ipAddress, CancellationToken cancellationToken)
    {
        // Terminate any existing active sessions for this user (single session policy)
        var existingSessions = await _context.Sessions
            .Where(s => s.UserId == user.Id && s.IsActive)
            .ToListAsync(cancellationToken);

        foreach (var existingSession in existingSessions)
        {
            existingSession.IsActive = false;
            existingSession.TerminatedAt = DateTime.UtcNow;
            existingSession.TerminationReason = "New login from same device";
        }

        // Create new session
        var session = new Session
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            DeviceId = device.Id,
            Token = Guid.NewGuid().ToString("N"),
            RefreshToken = _jwtService.GenerateRefreshToken(),
            IsActive = true,
            LastHeartbeat = DateTime.UtcNow,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            IpAddress = ipAddress
        };

        _context.Sessions.Add(session);

        // Update user last login
        user.LastLoginAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        var accessToken = _jwtService.GenerateAccessToken(user, session.Id);

        return new LoginResponse(
            MapToUserDto(user),
            accessToken,
            device.Id.ToString(),
            session.Id.ToString(),
            false,
            null
        );
    }

    private static string GenerateVerificationCode()
    {
        var random = new Random();
        return random.Next(100000, 999999).ToString();
    }

    private static UserDto MapToUserDto(User user) => new(
        user.Id,
        user.Email,
        user.Name,
        user.Avatar,
        user.Role.ToString(),
        user.IsActive,
        user.CreatedAt
    );
}

