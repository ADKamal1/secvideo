using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using SecVideo.Application.Common.Interfaces;

namespace SecVideo.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task SendDeviceVerificationEmailAsync(string email, string code, CancellationToken cancellationToken = default)
    {
        // In production, integrate with a real email service (SendGrid, AWS SES, etc.)
        // For now, we'll just log the code
        _logger.LogInformation("Device verification code for {Email}: {Code}", email, code);

        // TODO: Implement actual email sending
        // var smtpHost = _configuration["Email:SmtpHost"];
        // var smtpPort = int.Parse(_configuration["Email:SmtpPort"] ?? "587");
        // var smtpUser = _configuration["Email:SmtpUser"];
        // var smtpPass = _configuration["Email:SmtpPassword"];

        await Task.CompletedTask;
    }

    public async Task SendPasswordResetEmailAsync(string email, string token, CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Password reset token for {Email}: {Token}", email, token);
        await Task.CompletedTask;
    }

    public async Task SendSecurityAlertEmailAsync(string email, string alertMessage, CancellationToken cancellationToken = default)
    {
        _logger.LogWarning("Security alert for {Email}: {Message}", email, alertMessage);
        await Task.CompletedTask;
    }
}

