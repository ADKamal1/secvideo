namespace SecVideo.Domain.Entities;

public class Course
{
    public Guid Id { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? Thumbnail { get; set; }
    public Guid InstructorId { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public User Instructor { get; set; } = null!;
    public ICollection<Video> Videos { get; set; } = new List<Video>();
    public ICollection<CourseEnrollment> Enrollments { get; set; } = new List<CourseEnrollment>();
}

public class CourseEnrollment
{
    public Guid Id { get; set; }
    public Guid CourseId { get; set; }
    public Guid UserId { get; set; }
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;
    public int ProgressPercentage { get; set; } = 0;
    public DateTime? CompletedAt { get; set; }

    // Navigation properties
    public Course Course { get; set; } = null!;
    public User User { get; set; } = null!;
}

