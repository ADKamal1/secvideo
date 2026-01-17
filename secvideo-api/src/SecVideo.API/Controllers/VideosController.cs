using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SecVideo.Application.DTOs;
using SecVideo.Domain.Entities;
using SecVideo.Infrastructure.Data;
using System.Security.Claims;

namespace SecVideo.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class VideosController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<VideosController> _logger;
    private readonly IConfiguration _configuration;

    public VideosController(AppDbContext context, ILogger<VideosController> logger, IConfiguration configuration)
    {
        _context = context;
        _logger = logger;
        _configuration = configuration;
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<VideoDto>> GetVideo(Guid id, CancellationToken cancellationToken)
    {
        var video = await _context.Videos
            .Include(v => v.Chapters)
            .Include(v => v.Subtitles)
            .Include(v => v.Quizzes)
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (video == null) return NotFound();

        var userId = GetUserId();
        var watchProgress = userId.HasValue
            ? await _context.WatchProgress
                .FirstOrDefaultAsync(wp => wp.UserId == userId.Value && wp.VideoId == id, cancellationToken)
            : null;

        return Ok(new VideoDto(
            video.Id,
            video.CourseId,
            video.Title,
            video.Description,
            video.Thumbnail,
            video.DurationSeconds,
            video.Order,
            video.IsActive,
            video.Chapters.Any(),
            video.Subtitles.Any(),
            video.Quizzes.Any(),
            watchProgress?.CompletionPercentage,
            watchProgress?.LastWatchedAt,
            video.CreatedAt,
            video.ExpiresAt
        ));
    }

    [HttpGet("{id}/playback")]
    public async Task<ActionResult<VideoPlaybackDto>> GetPlaybackData(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var sessionId = GetSessionId();
        var deviceHash = Request.Headers["X-Device-Hash"].FirstOrDefault();

        if (userId == null || sessionId == null)
        {
            return Unauthorized(new { message = "Invalid session" });
        }

        // Verify session and device
        var user = await _context.Users
            .Include(u => u.Device)
            .FirstOrDefaultAsync(u => u.Id == userId.Value, cancellationToken);

        if (user?.Device?.FingerprintHash != deviceHash || !user.Device.IsVerified)
        {
            return Unauthorized(new { message = "Device verification required", code = "DEVICE_MISMATCH" });
        }

        var session = await _context.Sessions
            .FirstOrDefaultAsync(s => s.Id == sessionId.Value && s.IsActive, cancellationToken);

        if (session == null)
        {
            return Unauthorized(new { message = "Session expired", code = "SESSION_EXPIRED" });
        }

        var video = await _context.Videos
            .Include(v => v.Chapters.OrderBy(c => c.StartTimeSeconds))
            .Include(v => v.Subtitles)
            .Include(v => v.Quizzes.OrderBy(q => q.TriggerTimeSeconds))
            .FirstOrDefaultAsync(v => v.Id == id, cancellationToken);

        if (video == null) return NotFound();

        // Check if video is expired (3-day retention)
        if (video.ExpiresAt < DateTime.UtcNow)
        {
            return Gone(new { message = "Video has expired and been removed" });
        }

        // Verify user is enrolled in the course
        var isEnrolled = await _context.CourseEnrollments
            .AnyAsync(e => e.CourseId == video.CourseId && e.UserId == userId.Value, cancellationToken);

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        var isInstructor = video.Course?.InstructorId == userId.Value;

        if (!isEnrolled && userRole != "Admin" && !isInstructor)
        {
            return Forbid();
        }

        var baseUrl = _configuration["VideoStorage:BaseUrl"] ?? "/api/stream";

        var playbackData = new VideoPlaybackDto(
            video.Id,
            $"{baseUrl}/{video.Id}/stream.m3u8", // HLS stream URL
            $"{baseUrl}/{video.Id}/key", // Encryption key URL
            video.Chapters.Select(c => new ChapterDto(c.Id, c.Title, c.StartTimeSeconds, c.EndTimeSeconds)).ToList(),
            video.Subtitles.Select(s => new SubtitleDto(s.Id, s.Language, s.Label, $"{baseUrl}/{video.Id}/subtitles/{s.Id}")).ToList(),
            video.Quizzes.Select(q => new QuizDto(q.Id, q.TriggerTimeSeconds, q.Question, q.Options, q.CorrectIndex, q.Explanation)).ToList(),
            new WatermarkDataDto(
                userId.Value.ToString(),
                user.Email,
                sessionId.Value.ToString(),
                DateTime.UtcNow.ToString("O")
            )
        );

        // Log video access for analytics
        _logger.LogInformation("User {UserId} accessed video {VideoId}", userId, id);

        return Ok(playbackData);
    }

    [HttpPost("{id}/progress")]
    public async Task<ActionResult> UpdateProgress(Guid id, [FromBody] UpdateProgressRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var progress = await _context.WatchProgress
            .FirstOrDefaultAsync(wp => wp.UserId == userId.Value && wp.VideoId == id, cancellationToken);

        if (progress == null)
        {
            progress = new WatchProgress
            {
                Id = Guid.NewGuid(),
                UserId = userId.Value,
                VideoId = id
            };
            _context.WatchProgress.Add(progress);
        }

        progress.LastPositionSeconds = request.Position;
        progress.CompletionPercentage = request.CompletionPercentage;
        progress.LastWatchedAt = DateTime.UtcNow;
        progress.IsCompleted = request.CompletionPercentage >= 90;

        await _context.SaveChangesAsync(cancellationToken);

        // Update course progress
        await UpdateCourseProgressAsync(userId.Value, id, cancellationToken);

        return Ok();
    }

    [HttpPost("{videoId}/quizzes/{quizId}/answer")]
    public async Task<ActionResult<QuizAnswerResponse>> SubmitQuizAnswer(
        Guid videoId, 
        Guid quizId, 
        [FromBody] QuizAnswerRequest request, 
        CancellationToken cancellationToken)
    {
        var quiz = await _context.VideoQuizzes
            .FirstOrDefaultAsync(q => q.Id == quizId && q.VideoId == videoId, cancellationToken);

        if (quiz == null) return NotFound();

        var isCorrect = request.AnswerIndex == quiz.CorrectIndex;

        return Ok(new QuizAnswerResponse(isCorrect, isCorrect ? null : quiz.Explanation));
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<VideoDto>> CreateVideo([FromBody] CreateVideoRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        // Verify user has permission to add video to this course
        var course = await _context.Courses.FindAsync(new object[] { request.CourseId }, cancellationToken);
        if (course == null) return NotFound(new { message = "Course not found" });

        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && course.InstructorId != userId)
        {
            return Forbid();
        }

        var maxOrder = await _context.Videos
            .Where(v => v.CourseId == request.CourseId)
            .MaxAsync(v => (int?)v.Order, cancellationToken) ?? 0;

        var video = new Video
        {
            Id = Guid.NewGuid(),
            CourseId = request.CourseId,
            Title = request.Title,
            Description = request.Description,
            Order = maxOrder + 1,
            ExpiresAt = DateTime.UtcNow.AddDays(3), // 3-day retention policy
            IsActive = true
        };

        _context.Videos.Add(video);
        await _context.SaveChangesAsync(cancellationToken);

        return CreatedAtAction(nameof(GetVideo), new { id = video.Id }, new VideoDto(
            video.Id,
            video.CourseId,
            video.Title,
            video.Description,
            video.Thumbnail,
            video.DurationSeconds,
            video.Order,
            video.IsActive,
            false, false, false, null, null,
            video.CreatedAt,
            video.ExpiresAt
        ));
    }

    [HttpPost("{id}/chapters")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<ChapterDto>> AddChapter(Guid id, [FromBody] AddChapterRequest request, CancellationToken cancellationToken)
    {
        var video = await _context.Videos.FindAsync(new object[] { id }, cancellationToken);
        if (video == null) return NotFound();

        var chapter = new VideoChapter
        {
            Id = Guid.NewGuid(),
            VideoId = id,
            Title = request.Title,
            StartTimeSeconds = request.StartTimeSeconds,
            EndTimeSeconds = request.EndTimeSeconds,
            Order = await _context.VideoChapters.Where(c => c.VideoId == id).CountAsync(cancellationToken) + 1
        };

        _context.VideoChapters.Add(chapter);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new ChapterDto(chapter.Id, chapter.Title, chapter.StartTimeSeconds, chapter.EndTimeSeconds));
    }

    [HttpPost("{id}/quizzes")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<QuizDto>> AddQuiz(Guid id, [FromBody] AddQuizRequest request, CancellationToken cancellationToken)
    {
        var video = await _context.Videos.FindAsync(new object[] { id }, cancellationToken);
        if (video == null) return NotFound();

        var quiz = new VideoQuiz
        {
            Id = Guid.NewGuid(),
            VideoId = id,
            TriggerTimeSeconds = request.TriggerTimeSeconds,
            Question = request.Question,
            Options = request.Options,
            CorrectIndex = request.CorrectIndex,
            Explanation = request.Explanation
        };

        _context.VideoQuizzes.Add(quiz);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new QuizDto(quiz.Id, quiz.TriggerTimeSeconds, quiz.Question, quiz.Options, quiz.CorrectIndex, quiz.Explanation));
    }

    private async Task UpdateCourseProgressAsync(Guid userId, Guid videoId, CancellationToken cancellationToken)
    {
        var video = await _context.Videos.FindAsync(new object[] { videoId }, cancellationToken);
        if (video == null) return;

        var courseVideos = await _context.Videos
            .Where(v => v.CourseId == video.CourseId)
            .Select(v => v.Id)
            .ToListAsync(cancellationToken);

        var completedCount = await _context.WatchProgress
            .Where(wp => wp.UserId == userId && courseVideos.Contains(wp.VideoId) && wp.IsCompleted)
            .CountAsync(cancellationToken);

        var progress = courseVideos.Count > 0 ? (int)((completedCount / (double)courseVideos.Count) * 100) : 0;

        var enrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.CourseId == video.CourseId && e.UserId == userId, cancellationToken);

        if (enrollment != null)
        {
            enrollment.ProgressPercentage = progress;
            if (progress >= 100) enrollment.CompletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);
        }
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private Guid? GetSessionId()
    {
        var sessionIdClaim = User.FindFirst("session_id")?.Value;
        return Guid.TryParse(sessionIdClaim, out var sessionId) ? sessionId : null;
    }

    private ObjectResult Gone(object value) => StatusCode(410, value);
}

