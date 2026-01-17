namespace SecVideo.Domain.Entities;

public class SecurityEvent
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid? SessionId { get; set; }
    public Guid? VideoId { get; set; }
    public string EventType { get; set; } = string.Empty;
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
    public SecuritySeverity Severity { get; set; } = SecuritySeverity.Info;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public User User { get; set; } = null!;
}

public enum SecuritySeverity
{
    Info,
    Warning,
    Critical
}

