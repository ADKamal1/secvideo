# SecVideo - Secure Video Learning Platform

A secure video management and streaming platform for educational institutions with enterprise-grade protection against video piracy.

## 🔐 Security Features

- **Single Device Policy**: Users can only access from one verified device
- **Device Fingerprinting**: Unique device identification using FingerprintJS
- **Session Heartbeat**: Real-time session monitoring via WebSocket
- **Anti-Recording Protection**: Detection of screen capture attempts
- **Dynamic Watermarking**: User-identifying watermarks on all videos
- **DevTools Detection**: Alerts when developer tools are opened
- **Encrypted Streaming**: HLS with AES-128 encryption (backend required)

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS with dark cinematic theme
- **State Management**: Zustand
- **Animations**: Framer Motion
- **Video Player**: Custom secure player with Video.js integration
- **Real-time**: Socket.io for session management
- **Security**: FingerprintJS, custom anti-recording service

## 📦 Installation

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Setup

```bash
# Navigate to project directory
cd secvideo-web

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start development server
npm run dev
```

### Environment Variables

Create a `.env` file with:

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
VITE_APP_NAME=SecVideo
VITE_APP_VERSION=1.0.0
VITE_SESSION_TIMEOUT_MS=1800000
VITE_HEARTBEAT_INTERVAL_MS=5000
VITE_WATERMARK_INTERVAL_MS=30000
```

## 🏗️ Project Structure

```
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── layout/          # Header, Sidebar, MainLayout
│   └── player/          # Secure video player components
├── hooks/               # Custom React hooks
├── pages/
│   ├── auth/            # Login, Device Verify, Session Blocked
│   ├── student/         # Dashboard, Courses, Video Player
│   └── admin/           # Admin Dashboard, Users, Analytics
├── services/
│   ├── api/             # API client and endpoints
│   └── security/        # Device fingerprint, session, anti-recording
├── store/               # Zustand stores
├── styles/              # Global CSS and Tailwind
├── types/               # TypeScript type definitions
└── utils/               # Utility functions
```

## 🔒 Security Implementation

### Device Fingerprinting

Each user's device is uniquely identified using:
- Browser fingerprint (FingerprintJS)
- Hardware concurrency
- Screen resolution
- Timezone
- Platform info

### Session Management

- WebSocket heartbeat every 5 seconds
- Automatic session termination on:
  - New login from different device
  - Heartbeat timeout
  - Security violation detection

### Anti-Recording Measures

1. **DevTools Detection**: Window size and timing attacks
2. **Keyboard Shortcuts**: Blocked F12, Ctrl+Shift+I, PrintScreen
3. **Context Menu**: Disabled on video player
4. **Screen Capture API**: Overridden to detect attempts
5. **Visibility API**: Track tab/window focus

### Watermarking

- User email (masked)
- User ID
- Session ID  
- Timestamp
- Dynamic positioning (changes every 30 seconds)

## 🎨 UI/UX Features

- Dark cinematic theme optimized for video viewing
- Responsive design for all screen sizes
- Smooth animations with Framer Motion
- Accessible components
- Custom video player controls
- Chapter navigation
- In-video quizzes
- Progress tracking

## 📱 User Roles

### Student
- Browse enrolled courses
- Watch videos with full protection
- Track progress
- Take quizzes

### Instructor  
- Upload and manage videos
- View course analytics
- Manage course content

### Admin
- Full platform management
- User management
- Security monitoring
- System settings

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Docker (Coming Soon)

```bash
docker-compose up -d
```

## 🔧 Backend Requirements

This frontend requires a compatible backend API with:

- User authentication (JWT)
- Device registration and verification
- WebSocket server for session management
- Video encryption and streaming (HLS)
- Course and video CRUD operations

See the backend documentation for API specifications.

## 📋 API Endpoints Expected

```
POST   /api/auth/login
POST   /api/auth/verify-device
POST   /api/auth/logout
GET    /api/auth/session
GET    /api/courses
GET    /api/courses/:id
GET    /api/videos/:id/playback
POST   /api/videos/:id/progress
WebSocket /socket.io (heartbeat, session events)
```

## 🐛 Known Limitations

- Anti-recording cannot prevent hardware capture devices
- DevTools detection may have false positives
- Screen recording via external tools (OBS) cannot be blocked
- Watermarking is visible (forensic watermarking requires backend)

## 📄 License

Proprietary - All rights reserved

## 🤝 Contributing

Contact the development team for contribution guidelines.

