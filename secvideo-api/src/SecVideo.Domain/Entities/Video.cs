namespace SecVideo.Domain.Entities;

public class Video
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string? Thumbnail { get; set; }
    public string StoragePath { get; set; } = string.Empty;
    public string? EncryptionKeyId { get; set; }
    public int DurationSeconds { get; set; }
    public int Order { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime ExpiresAt { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public ICollection<VideoChapter> Chapters { get; set; } = new List<VideoChapter>();
    public ICollection<VideoSubtitle> Subtitles { get; set; } = new List<VideoSubtitle>();
    public ICollection<VideoQuiz> Quizzes { get; set; } = new List<VideoQuiz>();
    public ICollection<WatchProgress> WatchProgress { get; set; } = new List<WatchProgress>();
}

public class VideoChapter
{
    public Guid Id { get; set; }
    public Guid VideoId { get; set; }
    public string Title { get; set; } = string.Empty;
    public int StartTimeSeconds { get; set; }
    public int? EndTimeSeconds { get; set; }
    public int Order { get; set; }

    public Video Video { get; set; } = null!;
}

public class VideoSubtitle
{
    public Guid Id { get; set; }
    public Guid VideoId { get; set; }
    public string Language { get; set; } = string.Empty;
    public string Label { get; set; } = string.Empty;
    public string FilePath { get; set; } = string.Empty;

    public Video Video { get; set; } = null!;
}

public class VideoQuiz
{
    public Guid Id { get; set; }
    public Guid VideoId { get; set; }
    public int TriggerTimeSeconds { get; set; }
    public string Question { get; set; } = string.Empty;
    public string[] Options { get; set; } = Array.Empty<string>();
    public int CorrectIndex { get; set; }
    public string? Explanation { get; set; }

    public Video Video { get; set; } = null!;
}

