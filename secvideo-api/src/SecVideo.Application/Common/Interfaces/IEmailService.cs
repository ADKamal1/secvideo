namespace SecVideo.Application.Common.Interfaces;

public interface IEmailService
{
    Task SendDeviceVerificationEmailAsync(string email, string code, CancellationToken cancellationToken = default);
    Task SendPasswordResetEmailAsync(string email, string token, CancellationToken cancellationToken = default);
    Task SendSecurityAlertEmailAsync(string email, string alertMessage, CancellationToken cancellationToken = default);
}

