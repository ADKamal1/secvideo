namespace SecVideo.Application.DTOs;

public record VideoDto(
    Guid Id,
    Guid CourseId,
    string Title,
    string? Description,
    string? Thumbnail,
    int DurationSeconds,
    int Order,
    bool IsActive,
    bool HasChapters,
    bool HasSubtitles,
    bool HasQuiz,
    int? WatchProgress,
    DateTime? LastWatchedAt,
    DateTime CreatedAt,
    DateTime ExpiresAt
);

public record VideoPlaybackDto(
    Guid VideoId,
    string StreamUrl,
    string EncryptionKeyUrl,
    List<ChapterDto> Chapters,
    List<SubtitleDto> Subtitles,
    List<QuizDto> Quizzes,
    WatermarkDataDto WatermarkData
);

public record ChapterDto(
    Guid Id,
    string Title,
    int StartTimeSeconds,
    int? EndTimeSeconds
);

public record SubtitleDto(
    Guid Id,
    string Language,
    string Label,
    string Url
);

public record QuizDto(
    Guid Id,
    int TriggerTimeSeconds,
    string Question,
    string[] Options,
    int CorrectIndex,
    string? Explanation
);

public record WatermarkDataDto(
    string UserId,
    string UserEmail,
    string SessionId,
    string Timestamp
);

public record CreateVideoRequest(
    Guid CourseId,
    string Title,
    string? Description
);

public record UpdateVideoRequest(
    string? Title,
    string? Description,
    int? Order,
    bool? IsActive
);

public record UpdateProgressRequest(
    int Position,
    int Duration,
    int CompletionPercentage
);

public record AddChapterRequest(
    string Title,
    int StartTimeSeconds,
    int? EndTimeSeconds
);

public record AddQuizRequest(
    int TriggerTimeSeconds,
    string Question,
    string[] Options,
    int CorrectIndex,
    string? Explanation
);

public record QuizAnswerRequest(
    int AnswerIndex
);

public record QuizAnswerResponse(
    bool Correct,
    string? Explanation
);

