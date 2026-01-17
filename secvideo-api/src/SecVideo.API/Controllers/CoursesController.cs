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
public class CoursesController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<CoursesController> _logger;

    public CoursesController(AppDbContext context, ILogger<CoursesController> logger)
    {
        _context = context;
        _logger = logger;
    }

    [HttpGet]
    public async Task<ActionResult<List<CourseDto>>> GetCourses(
        [FromQuery] string? search,
        [FromQuery] Guid? instructorId,
        [FromQuery] bool? isActive,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        var userId = GetUserId();
        var query = _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Videos)
            .Include(c => c.Enrollments)
            .AsQueryable();

        if (!string.IsNullOrEmpty(search))
        {
            query = query.Where(c => c.Title.ToLower().Contains(search.ToLower()) ||
                                     c.Description.ToLower().Contains(search.ToLower()));
        }

        if (instructorId.HasValue)
        {
            query = query.Where(c => c.InstructorId == instructorId.Value);
        }

        if (isActive.HasValue)
        {
            query = query.Where(c => c.IsActive == isActive.Value);
        }

        var total = await query.CountAsync(cancellationToken);
        var courses = await query
            .OrderByDescending(c => c.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var courseDtos = courses.Select(c => MapToCourseDto(c, userId)).ToList();

        return Ok(new
        {
            items = courseDtos,
            total,
            page,
            pageSize,
            totalPages = (int)Math.Ceiling(total / (double)pageSize)
        });
    }

    [HttpGet("enrolled")]
    public async Task<ActionResult<List<CourseDto>>> GetEnrolledCourses(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var enrollments = await _context.CourseEnrollments
            .Where(e => e.UserId == userId.Value)
            .Include(e => e.Course)
                .ThenInclude(c => c.Instructor)
            .Include(e => e.Course)
                .ThenInclude(c => c.Videos)
            .Include(e => e.Course)
                .ThenInclude(c => c.Enrollments)
            .ToListAsync(cancellationToken);

        var courses = enrollments.Select(e => MapToCourseDto(e.Course, userId, e.ProgressPercentage)).ToList();
        return Ok(courses);
    }

    [HttpGet("my-courses")]
    public async Task<ActionResult<List<CourseDto>>> GetMyCourses(CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var courses = await _context.Courses
            .Where(c => c.InstructorId == userId.Value)
            .Include(c => c.Instructor)
            .Include(c => c.Videos)
            .Include(c => c.Enrollments)
            .ToListAsync(cancellationToken);

        return Ok(courses.Select(c => MapToCourseDto(c, userId)).ToList());
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<CourseDto>> GetCourse(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Videos)
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (course == null) return NotFound();

        return Ok(MapToCourseDto(course, userId));
    }

    [HttpGet("{id}/full")]
    public async Task<ActionResult<CourseWithVideosDto>> GetCourseWithVideos(Guid id, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Videos.OrderBy(v => v.Order))
                .ThenInclude(v => v.Chapters)
            .Include(c => c.Videos)
                .ThenInclude(v => v.Subtitles)
            .Include(c => c.Videos)
                .ThenInclude(v => v.Quizzes)
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (course == null) return NotFound();

        // Get user's watch progress for all videos in this course
        var videoIds = course.Videos.Select(v => v.Id).ToList();
        var watchProgress = userId.HasValue
            ? await _context.WatchProgress
                .Where(wp => wp.UserId == userId.Value && videoIds.Contains(wp.VideoId))
                .ToDictionaryAsync(wp => wp.VideoId, wp => wp, cancellationToken)
            : new Dictionary<Guid, WatchProgress>();

        var enrollment = userId.HasValue
            ? await _context.CourseEnrollments
                .FirstOrDefaultAsync(e => e.CourseId == id && e.UserId == userId.Value, cancellationToken)
            : null;

        var videos = course.Videos.Select(v => new VideoDto(
            v.Id,
            v.CourseId,
            v.Title,
            v.Description,
            v.Thumbnail,
            v.DurationSeconds,
            v.Order,
            v.IsActive,
            v.Chapters.Any(),
            v.Subtitles.Any(),
            v.Quizzes.Any(),
            watchProgress.TryGetValue(v.Id, out var wp) ? wp.CompletionPercentage : null,
            watchProgress.TryGetValue(v.Id, out var wp2) ? wp2.LastWatchedAt : null,
            v.CreatedAt,
            v.ExpiresAt
        )).ToList();

        var courseDto = new CourseWithVideosDto(
            course.Id,
            course.Title,
            course.Description,
            course.Thumbnail,
            course.InstructorId,
            course.Instructor.Name,
            course.Instructor.Avatar,
            course.Videos.Count,
            course.Videos.Sum(v => v.DurationSeconds),
            course.Enrollments.Count,
            course.IsActive,
            course.CreatedAt,
            enrollment?.ProgressPercentage,
            videos
        );

        return Ok(courseDto);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<CourseDto>> CreateCourse([FromBody] CreateCourseRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        if (userId == null) return Unauthorized();

        var course = new Course
        {
            Id = Guid.NewGuid(),
            Title = request.Title,
            Description = request.Description,
            Thumbnail = request.Thumbnail,
            InstructorId = userId.Value,
            IsActive = true
        };

        _context.Courses.Add(course);
        await _context.SaveChangesAsync(cancellationToken);

        var createdCourse = await _context.Courses
            .Include(c => c.Instructor)
            .FirstAsync(c => c.Id == course.Id, cancellationToken);

        return CreatedAtAction(nameof(GetCourse), new { id = course.Id }, MapToCourseDto(createdCourse, userId));
    }

    [HttpPatch("{id}")]
    [Authorize(Roles = "Admin,Instructor")]
    public async Task<ActionResult<CourseDto>> UpdateCourse(Guid id, [FromBody] UpdateCourseRequest request, CancellationToken cancellationToken)
    {
        var userId = GetUserId();
        var course = await _context.Courses
            .Include(c => c.Instructor)
            .Include(c => c.Videos)
            .Include(c => c.Enrollments)
            .FirstOrDefaultAsync(c => c.Id == id, cancellationToken);

        if (course == null) return NotFound();

        // Only admin or course owner can update
        var userRole = User.FindFirst(ClaimTypes.Role)?.Value;
        if (userRole != "Admin" && course.InstructorId != userId)
        {
            return Forbid();
        }

        if (request.Title != null) course.Title = request.Title;
        if (request.Description != null) course.Description = request.Description;
        if (request.Thumbnail != null) course.Thumbnail = request.Thumbnail;
        if (request.IsActive.HasValue) course.IsActive = request.IsActive.Value;
        course.UpdatedAt = DateTime.UtcNow;

        await _context.SaveChangesAsync(cancellationToken);

        return Ok(MapToCourseDto(course, userId));
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<ActionResult> DeleteCourse(Guid id, CancellationToken cancellationToken)
    {
        var course = await _context.Courses.FindAsync(new object[] { id }, cancellationToken);
        if (course == null) return NotFound();

        _context.Courses.Remove(course);
        await _context.SaveChangesAsync(cancellationToken);

        return NoContent();
    }

    [HttpPost("{id}/enroll")]
    public async Task<ActionResult> EnrollStudent(Guid id, [FromBody] EnrollRequest? request, CancellationToken cancellationToken)
    {
        var userId = request?.StudentId ?? GetUserId();
        if (userId == null) return Unauthorized();

        var course = await _context.Courses.FindAsync(new object[] { id }, cancellationToken);
        if (course == null) return NotFound();

        var existingEnrollment = await _context.CourseEnrollments
            .FirstOrDefaultAsync(e => e.CourseId == id && e.UserId == userId.Value, cancellationToken);

        if (existingEnrollment != null)
        {
            return BadRequest(new { message = "Already enrolled in this course" });
        }

        var enrollment = new CourseEnrollment
        {
            Id = Guid.NewGuid(),
            CourseId = id,
            UserId = userId.Value,
            EnrolledAt = DateTime.UtcNow
        };

        _context.CourseEnrollments.Add(enrollment);
        await _context.SaveChangesAsync(cancellationToken);

        return Ok(new { message = "Enrolled successfully" });
    }

    private Guid? GetUserId()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.TryParse(userIdClaim, out var userId) ? userId : null;
    }

    private CourseDto MapToCourseDto(Course course, Guid? userId, int? progressOverride = null)
    {
        var enrollment = userId.HasValue
            ? course.Enrollments.FirstOrDefault(e => e.UserId == userId.Value)
            : null;

        return new CourseDto(
            course.Id,
            course.Title,
            course.Description,
            course.Thumbnail,
            course.InstructorId,
            course.Instructor.Name,
            course.Instructor.Avatar,
            course.Videos.Count,
            course.Videos.Sum(v => v.DurationSeconds),
            course.Enrollments.Count,
            course.IsActive,
            course.CreatedAt,
            progressOverride ?? enrollment?.ProgressPercentage
        );
    }
}

public record EnrollRequest(Guid? StudentId);

