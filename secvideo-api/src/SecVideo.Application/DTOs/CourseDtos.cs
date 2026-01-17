namespace SecVideo.Application.DTOs;

public record CourseDto(
    Guid Id,
    string Title,
    string Description,
    string? Thumbnail,
    Guid InstructorId,
    string InstructorName,
    string? InstructorAvatar,
    int VideosCount,
    int TotalDurationSeconds,
    int EnrolledCount,
    bool IsActive,
    DateTime CreatedAt,
    int? ProgressPercentage
);

public record CreateCourseRequest(
    string Title,
    string Description,
    string? Thumbnail
);

public record UpdateCourseRequest(
    string? Title,
    string? Description,
    string? Thumbnail,
    bool? IsActive
);

public record CourseWithVideosDto(
    Guid Id,
    string Title,
    string Description,
    string? Thumbnail,
    Guid InstructorId,
    string InstructorName,
    string? InstructorAvatar,
    int VideosCount,
    int TotalDurationSeconds,
    int EnrolledCount,
    bool IsActive,
    DateTime CreatedAt,
    int? ProgressPercentage,
    List<VideoDto> Videos
);

