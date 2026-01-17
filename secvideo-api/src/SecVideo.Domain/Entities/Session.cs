namespace SecVideo.Domain.Entities;

public class Session
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid DeviceId { get; set; }
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime LastHeartbeat { get; set; } = DateTime.UtcNow;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }
    public string? IpAddress { get; set; }
    public string? TerminationReason { get; set; }
    public DateTime? TerminatedAt { get; set; }

    // Navigation property
    public User User { get; set; } = null!;
}

