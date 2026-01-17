using Microsoft.EntityFrameworkCore;
using SecVideo.Domain.Entities;

namespace SecVideo.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Device> Devices => Set<Device>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<Course> Courses => Set<Course>();
    public DbSet<CourseEnrollment> CourseEnrollments => Set<CourseEnrollment>();
    public DbSet<Video> Videos => Set<Video>();
    public DbSet<VideoChapter> VideoChapters => Set<VideoChapter>();
    public DbSet<VideoSubtitle> VideoSubtitles => Set<VideoSubtitle>();
    public DbSet<VideoQuiz> VideoQuizzes => Set<VideoQuiz>();
    public DbSet<WatchProgress> WatchProgress => Set<WatchProgress>();
    public DbSet<SecurityEvent> SecurityEvents => Set<SecurityEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User configuration
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Email).IsUnique();
            entity.Property(e => e.Email).HasMaxLength(255).IsRequired();
            entity.Property(e => e.PasswordHash).IsRequired();
            entity.Property(e => e.Name).HasMaxLength(255).IsRequired();
            entity.Property(e => e.Role).HasConversion<string>();

            // One-to-one with Device (single device policy)
            entity.HasOne(e => e.Device)
                .WithOne(d => d.User)
                .HasForeignKey<Device>(d => d.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Device configuration
        modelBuilder.Entity<Device>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.UserId).IsUnique(); // Only one device per user
            entity.Property(e => e.FingerprintHash).HasMaxLength(255).IsRequired();
        });

        // Session configuration
        modelBuilder.Entity<Session>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => e.Token).IsUnique();
            entity.Property(e => e.Token).IsRequired();

            entity.HasOne(e => e.User)
                .WithMany(u => u.Sessions)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Course configuration
        modelBuilder.Entity<Course>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();

            entity.HasOne(e => e.Instructor)
                .WithMany(u => u.CreatedCourses)
                .HasForeignKey(e => e.InstructorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // CourseEnrollment configuration
        modelBuilder.Entity<CourseEnrollment>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.CourseId, e.UserId }).IsUnique();

            entity.HasOne(e => e.Course)
                .WithMany(c => c.Enrollments)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.User)
                .WithMany(u => u.Enrollments)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // Video configuration
        modelBuilder.Entity<Video>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(500).IsRequired();

            entity.HasOne(e => e.Course)
                .WithMany(c => c.Videos)
                .HasForeignKey(e => e.CourseId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // VideoChapter configuration
        modelBuilder.Entity<VideoChapter>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Title).HasMaxLength(255).IsRequired();

            entity.HasOne(e => e.Video)
                .WithMany(v => v.Chapters)
                .HasForeignKey(e => e.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // VideoSubtitle configuration
        modelBuilder.Entity<VideoSubtitle>(entity =>
        {
            entity.HasKey(e => e.Id);

            entity.HasOne(e => e.Video)
                .WithMany(v => v.Subtitles)
                .HasForeignKey(e => e.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // VideoQuiz configuration
        modelBuilder.Entity<VideoQuiz>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Question).IsRequired();

            entity.HasOne(e => e.Video)
                .WithMany(v => v.Quizzes)
                .HasForeignKey(e => e.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // WatchProgress configuration
        modelBuilder.Entity<WatchProgress>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.HasIndex(e => new { e.UserId, e.VideoId }).IsUnique();

            entity.HasOne(e => e.User)
                .WithMany(u => u.WatchProgress)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Video)
                .WithMany(v => v.WatchProgress)
                .HasForeignKey(e => e.VideoId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // SecurityEvent configuration
        modelBuilder.Entity<SecurityEvent>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.EventType).HasMaxLength(100).IsRequired();
            entity.Property(e => e.Severity).HasConversion<string>();

            entity.HasOne(e => e.User)
                .WithMany(u => u.SecurityEvents)
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        });
    }
}

