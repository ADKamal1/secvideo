namespace SecVideo.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public string? Avatar { get; set; }
    public UserRole Role { get; set; } = UserRole.Student;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public Device? Device { get; set; }
    public ICollection<Session> Sessions { get; set; } = new List<Session>();
    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
    public ICollection<Course> CreatedCourses { get; set; } = new List<Course>();
    public ICollection<WatchProgress> WatchProgress { get; set; } = new List<WatchProgress>();
    public ICollection<SecurityEvent> SecurityEvents { get; set; } = new List<SecurityEvent>();
}

public enum UserRole
{
    Student,
    Instructor,
    Admin
}

