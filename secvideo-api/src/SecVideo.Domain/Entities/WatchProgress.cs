namespace SecVideo.Domain.Entities;

public class WatchProgress
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public Guid VideoId { get; set; }
    public int LastPositionSeconds { get; set; }
    public int WatchDurationSeconds { get; set; }
    public int CompletionPercentage { get; set; }
    public DateTime LastWatchedAt { get; set; } = DateTime.UtcNow;
    public bool IsCompleted { get; set; } = false;

    // Navigation properties
    public User User { get; set; } = null!;
    public Video Video { get; set; } = null!;
}

