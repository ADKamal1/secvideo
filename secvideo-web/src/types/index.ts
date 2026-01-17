// ============================================================
// User & Authentication Types
// ============================================================

export type UserRole = 'admin' | 'instructor' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  deviceId: string | null;
  sessionId: string | null;
  isAuthenticated: boolean;
  isDeviceVerified: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  deviceId: string;
  sessionId: string;
  requiresDeviceVerification?: boolean;
  tempToken?: string;
}

export interface DeviceInfo {
  visitorId: string;
  components: {
    userAgent: string;
    language: string;
    colorDepth: number;
    screenResolution: string;
    timezone: string;
    platform: string;
    hardwareConcurrency: number;
    deviceMemory?: number;
  };
}

// ============================================================
// Course Types
// ============================================================

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructorId: string;
  instructorName: string;
  instructorAvatar?: string;
  videosCount: number;
  totalDuration: number; // in seconds
  enrolledCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  progress?: number; // 0-100 for enrolled students
}

export interface CourseWithVideos extends Course {
  videos: Video[];
}

// ============================================================
// Video Types
// ============================================================

export interface Video {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  thumbnail: string;
  duration: number; // in seconds
  order: number;
  isActive: boolean;
  hasChapters: boolean;
  hasSubtitles: boolean;
  hasQuiz: boolean;
  watchProgress?: number; // 0-100
  lastWatchedAt?: string;
  createdAt: string;
  expiresAt: string; // 3-day expiry
}

export interface VideoPlaybackData {
  videoId: string;
  streamUrl: string;
  encryptionKeyUrl: string;
  chapters: Chapter[];
  subtitles: Subtitle[];
  quizzes: Quiz[];
  watermarkData: WatermarkData;
}

export interface Chapter {
  id: string;
  title: string;
  startTime: number; // in seconds
  endTime?: number;
}

export interface Subtitle {
  id: string;
  language: string;
  label: string;
  url: string;
}

export interface Quiz {
  id: string;
  triggerTime: number; // in seconds
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

export interface WatermarkData {
  userId: string;
  userEmail: string;
  sessionId: string;
  timestamp: string;
}

// ============================================================
// Analytics Types
// ============================================================

export interface WatchAnalytics {
  id: string;
  userId: string;
  videoId: string;
  watchDuration: number;
  completionPercentage: number;
  lastPosition: number;
  watchedAt: string;
}

export interface CourseAnalytics {
  courseId: string;
  totalViews: number;
  uniqueViewers: number;
  avgCompletionRate: number;
  avgWatchTime: number;
  engagementScore: number;
}

export interface UserAnalytics {
  userId: string;
  totalWatchTime: number;
  coursesEnrolled: number;
  coursesCompleted: number;
  videosWatched: number;
  avgCompletionRate: number;
  lastActiveAt: string;
}

export interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalVideos: number;
  activeStreams: number;
  todayViews: number;
  weeklyGrowth: number;
}

// ============================================================
// Session & Security Types
// ============================================================

export interface Session {
  id: string;
  userId: string;
  deviceId: string;
  token: string;
  isActive: boolean;
  lastHeartbeat: string;
  createdAt: string;
}

export interface SecurityEvent {
  type: string;
  details: Record<string, unknown>;
  timestamp: number;
  videoId?: string;
  sessionId?: string;
}

// ============================================================
// Device Types
// ============================================================

export interface Device {
  id: string;
  userId: string;
  fingerprintHash: string;
  deviceInfo: DeviceInfo;
  isVerified: boolean;
  verifiedAt?: string;
  createdAt: string;
}

export interface DeviceVerificationRequest {
  code: string;
  deviceHash: string;
  deviceInfo: DeviceInfo;
}

// ============================================================
// API Response Types
// ============================================================

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  details?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================================
// UI Types
// ============================================================

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

// ============================================================
// Form Types
// ============================================================

export interface VideoUploadForm {
  title: string;
  description: string;
  courseId: string;
  file: File | null;
  thumbnail: File | null;
}

export interface CourseForm {
  title: string;
  description: string;
  thumbnail: File | null;
}

export interface ChapterForm {
  title: string;
  startTime: number;
}

export interface SubtitleForm {
  language: string;
  label: string;
  file: File | null;
}

export interface QuizForm {
  triggerTime: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
}

