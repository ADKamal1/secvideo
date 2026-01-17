using SecVideo.Application.DTOs;

namespace SecVideo.Application.Common.Interfaces;

public interface IAuthService
{
    Task<LoginResponse> LoginAsync(LoginRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<LoginResponse> VerifyDeviceAsync(string tempToken, DeviceVerificationRequest request, string? ipAddress, CancellationToken cancellationToken);
    Task<SessionValidationResponse> ValidateSessionAsync(Guid userId, Guid sessionId, string deviceHash, CancellationToken cancellationToken);
    Task LogoutAsync(Guid userId, Guid sessionId, CancellationToken cancellationToken);
    Task TerminateSessionAsync(Guid sessionId, string reason, CancellationToken cancellationToken);
    Task UpdateHeartbeatAsync(Guid sessionId, CancellationToken cancellationToken);
    Task<UserDto?> GetUserByIdAsync(Guid userId, CancellationToken cancellationToken);
    Task ResendVerificationCodeAsync(Guid userId, CancellationToken cancellationToken);
}

