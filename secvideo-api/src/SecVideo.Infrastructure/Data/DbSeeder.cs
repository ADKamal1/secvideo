using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using SecVideo.Domain.Entities;

namespace SecVideo.Infrastructure.Data;

public class DbSeeder
{
    private readonly AppDbContext _context;
    private readonly ILogger<DbSeeder> _logger;

    public DbSeeder(AppDbContext context, ILogger<DbSeeder> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task SeedAsync()
    {
        try
        {
            // Create admin user if not exists
            if (!await _context.Users.AnyAsync(u => u.Role == UserRole.Admin))
            {
                var admin = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "admin@secvideo.com",
                    Name = "Administrator",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin123!"),
                    Role = UserRole.Admin,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(admin);
                _logger.LogInformation("Created admin user: admin@secvideo.com / Admin123!");
            }

            // Create instructor user
            if (!await _context.Users.AnyAsync(u => u.Role == UserRole.Instructor))
            {
                var instructor = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "instructor@secvideo.com",
                    Name = "Demo Instructor",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Instructor123!"),
                    Role = UserRole.Instructor,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(instructor);
                _logger.LogInformation("Created instructor user: instructor@secvideo.com / Instructor123!");

                // Create sample course
                var course = new Course
                {
                    Id = Guid.NewGuid(),
                    Title = "Introduction to Secure Programming",
                    Description = "Learn the fundamentals of writing secure code and protecting your applications from common vulnerabilities.",
                    InstructorId = instructor.Id,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Courses.Add(course);

                // Create sample videos
                var videos = new[]
                {
                    new Video
                    {
                        Id = Guid.NewGuid(),
                        CourseId = course.Id,
                        Title = "Course Introduction",
                        Description = "Welcome to the course! In this video, we'll cover what you'll learn.",
                        DurationSeconds = 300,
                        Order = 1,
                        StoragePath = "courses/intro/video1",
                        ExpiresAt = DateTime.UtcNow.AddDays(3),
                        IsActive = true
                    },
                    new Video
                    {
                        Id = Guid.NewGuid(),
                        CourseId = course.Id,
                        Title = "Understanding Security Threats",
                        Description = "Learn about common security threats and how to identify them.",
                        DurationSeconds = 900,
                        Order = 2,
                        StoragePath = "courses/intro/video2",
                        ExpiresAt = DateTime.UtcNow.AddDays(3),
                        IsActive = true
                    },
                    new Video
                    {
                        Id = Guid.NewGuid(),
                        CourseId = course.Id,
                        Title = "Input Validation Best Practices",
                        Description = "Deep dive into input validation and sanitization techniques.",
                        DurationSeconds = 1200,
                        Order = 3,
                        StoragePath = "courses/intro/video3",
                        ExpiresAt = DateTime.UtcNow.AddDays(3),
                        IsActive = true
                    }
                };

                _context.Videos.AddRange(videos);

                // Add chapters to first video
                var chapters = new[]
                {
                    new VideoChapter { Id = Guid.NewGuid(), VideoId = videos[0].Id, Title = "Welcome", StartTimeSeconds = 0, Order = 1 },
                    new VideoChapter { Id = Guid.NewGuid(), VideoId = videos[0].Id, Title = "Course Overview", StartTimeSeconds = 60, Order = 2 },
                    new VideoChapter { Id = Guid.NewGuid(), VideoId = videos[0].Id, Title = "Prerequisites", StartTimeSeconds = 180, Order = 3 }
                };

                _context.VideoChapters.AddRange(chapters);

                // Add quiz to second video
                var quiz = new VideoQuiz
                {
                    Id = Guid.NewGuid(),
                    VideoId = videos[1].Id,
                    TriggerTimeSeconds = 600,
                    Question = "What is the most common type of web security vulnerability?",
                    Options = new[] { "SQL Injection", "Cross-Site Scripting", "Broken Authentication", "All of the above" },
                    CorrectIndex = 3,
                    Explanation = "All mentioned vulnerabilities are common. The OWASP Top 10 lists them all as critical risks."
                };

                _context.VideoQuizzes.Add(quiz);

                _logger.LogInformation("Created sample course with 3 videos");
            }

            // Create student user
            if (!await _context.Users.AnyAsync(u => u.Role == UserRole.Student))
            {
                var student = new User
                {
                    Id = Guid.NewGuid(),
                    Email = "student@secvideo.com",
                    Name = "Demo Student",
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword("Student123!"),
                    Role = UserRole.Student,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow
                };

                _context.Users.Add(student);
                _logger.LogInformation("Created student user: student@secvideo.com / Student123!");
            }

            await _context.SaveChangesAsync();
            _logger.LogInformation("Database seeding completed successfully");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error seeding database");
            throw;
        }
    }
}

