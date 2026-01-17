# SecVideo API - Secure Video Learning Platform Backend

ASP.NET Core 9 Web API for the SecVideo secure video learning platform.

## 🏗️ Architecture

This project follows **Clean Architecture** with the following layers:

- **SecVideo.API** - Web API controllers, SignalR hubs, middleware
- **SecVideo.Application** - Application services, DTOs, interfaces
- **SecVideo.Domain** - Domain entities, enums, value objects
- **SecVideo.Infrastructure** - Database context, external services, implementations

## 🚀 Quick Start

### Prerequisites

- .NET 9 SDK
- PostgreSQL 16+
- Docker & Docker Compose (optional)

### Using Docker (Recommended)

```bash
# Start all services (PostgreSQL, Redis, MinIO, API)
docker-compose up -d

# View logs
docker-compose logs -f api
```

The API will be available at `http://localhost:5000`

### Manual Setup

```bash
# 1. Start PostgreSQL
# Make sure PostgreSQL is running on localhost:5432

# 2. Update connection string in appsettings.json if needed

# 3. Run migrations
cd src/SecVideo.API
dotnet ef database update

# 4. Run the API
dotnet run
```

## 📚 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password |
| POST | `/api/auth/verify-device` | Verify new device with code |
| POST | `/api/auth/logout` | Logout current session |
| GET | `/api/auth/session` | Validate current session |
| GET | `/api/auth/profile` | Get user profile |

### Courses

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/courses` | Get all courses (paginated) |
| GET | `/api/courses/enrolled` | Get enrolled courses |
| GET | `/api/courses/{id}` | Get course details |
| GET | `/api/courses/{id}/full` | Get course with videos |
| POST | `/api/courses` | Create course (Instructor/Admin) |
| PATCH | `/api/courses/{id}` | Update course |
| POST | `/api/courses/{id}/enroll` | Enroll in course |

### Videos

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/videos/{id}` | Get video details |
| GET | `/api/videos/{id}/playback` | Get secure playback data |
| POST | `/api/videos/{id}/progress` | Update watch progress |
| POST | `/api/videos` | Create video (Instructor/Admin) |
| POST | `/api/videos/{id}/chapters` | Add chapter |
| POST | `/api/videos/{id}/quizzes` | Add quiz |

### WebSocket (SignalR)

Connect to `/hubs/session` with JWT token for:
- Session heartbeat
- Security event reporting
- Playback progress tracking
- Real-time session management

## 🔐 Security Features

### Device Binding
- Single device policy per user
- Device fingerprint verification
- Email verification for new devices

### Session Management
- JWT tokens with session binding
- Real-time heartbeat monitoring
- Automatic session termination on violations

### Video Protection
- Encrypted HLS streaming
- Dynamic watermarking data
- 3-day video retention policy
- Device verification before playback

## 🗄️ Database Schema

### Main Entities

- **User** - User accounts with roles
- **Device** - Verified devices (one per user)
- **Session** - Active login sessions
- **Course** - Learning courses
- **Video** - Course videos with chapters, subtitles, quizzes
- **WatchProgress** - User video progress
- **SecurityEvent** - Security audit log

## ⚙️ Configuration

### Environment Variables

```bash
# Database
ConnectionStrings__DefaultConnection="Host=localhost;Database=secvideo;Username=postgres;Password=postgres"

# JWT
Jwt__SecretKey="YourSuperSecretKeyThatIsAtLeast32Characters"
Jwt__Issuer="SecVideo"
Jwt__Audience="SecVideoApp"
Jwt__AccessTokenExpirationMinutes=60

# CORS
Cors__AllowedOrigins="http://localhost:3000"

# Video Storage
VideoStorage__BaseUrl="/api/stream"
VideoStorage__LocalPath="./videos"
```

### appsettings.json

See `appsettings.json` for full configuration options.

## 🧪 Testing

```bash
# Run unit tests
dotnet test

# With coverage
dotnet test --collect:"XPlat Code Coverage"
```

## 📦 Project Structure

```
secvideo-api/
├── src/
│   ├── SecVideo.API/
│   │   ├── Controllers/
│   │   ├── Hubs/
│   │   ├── Middleware/
│   │   └── Program.cs
│   ├── SecVideo.Application/
│   │   ├── Common/
│   │   ├── DTOs/
│   │   └── Services/
│   ├── SecVideo.Domain/
│   │   └── Entities/
│   └── SecVideo.Infrastructure/
│       ├── Data/
│       └── Services/
├── docker-compose.yml
├── Dockerfile
└── SecVideo.sln
```

## 🐳 Docker Services

- **postgres** - PostgreSQL 16 database
- **redis** - Redis for caching
- **minio** - S3-compatible storage for videos
- **api** - ASP.NET Core API

## 📄 License

Proprietary - All rights reserved

