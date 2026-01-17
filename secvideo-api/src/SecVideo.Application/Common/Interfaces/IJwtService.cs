using SecVideo.Domain.Entities;

namespace SecVideo.Application.Common.Interfaces;

public interface IJwtService
{
    string GenerateAccessToken(User user, Guid sessionId);
    string GenerateRefreshToken();
    string GenerateTempToken(Guid userId);
    (bool IsValid, Guid UserId, Guid SessionId) ValidateToken(string token);
    Guid? ValidateTempToken(string token);
}

