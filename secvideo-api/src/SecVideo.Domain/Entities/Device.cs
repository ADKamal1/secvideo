namespace SecVideo.Domain.Entities;

public class Device
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string FingerprintHash { get; set; } = string.Empty;
    public string? UserAgent { get; set; }
    public string? Platform { get; set; }
    public string? ScreenResolution { get; set; }
    public string? Timezone { get; set; }
    public bool IsVerified { get; set; } = false;
    public string? VerificationCode { get; set; }
    public DateTime? VerificationCodeExpiry { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime LastSeenAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;
}

