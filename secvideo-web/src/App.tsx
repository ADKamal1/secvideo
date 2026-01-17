import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useAuthStore } from '@/store/authStore';

// Auth pages
import { LoginPage, DeviceVerifyPage, SessionBlockedPage } from '@/pages/auth';

// Student pages
import { DashboardPage, CoursesPage, VideoPlayerPage } from '@/pages/student';

// Admin pages
import { AdminDashboard } from '@/pages/admin';

// Protected route wrapper
interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: ('admin' | 'instructor' | 'student')[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isDeviceVerified, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isDeviceVerified) {
    return <Navigate to="/device-verify" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

// Public route wrapper (redirect if authenticated)
interface PublicRouteProps {
  children: React.ReactNode;
}

const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isDeviceVerified } = useAuthStore();

  if (isAuthenticated && isDeviceVerified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route path="/device-verify" element={<DeviceVerifyPage />} />
        <Route path="/session-blocked" element={<SessionBlockedPage />} />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          {/* Dashboard - different based on role */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* Student routes */}
          <Route path="/courses" element={<CoursesPage />} />
          <Route path="/courses/:courseId" element={<CoursesPage />} />
          <Route path="/watch/:videoId" element={<VideoPlayerPage />} />
          <Route path="/history" element={<CoursesPage />} />
          
          {/* Admin/Instructor routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <div className="text-text-primary">Upload Video Page - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage/courses"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <div className="text-text-primary">Manage Courses Page - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="text-text-primary">Users Management Page - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/analytics"
            element={
              <ProtectedRoute allowedRoles={['admin', 'instructor']}>
                <div className="text-text-primary">Analytics Page - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route
            path="/security"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <div className="text-text-primary">Security Settings Page - Coming Soon</div>
              </ProtectedRoute>
            }
          />
          <Route path="/settings" element={<div className="text-text-primary">Settings Page - Coming Soon</div>} />
          <Route path="/profile" element={<div className="text-text-primary">Profile Page - Coming Soon</div>} />
          <Route path="/live" element={<div className="text-text-primary">Live Streams - Coming Soon</div>} />
        </Route>

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="min-h-screen flex items-center justify-center bg-background">
              <div className="text-center">
                <h1 className="text-6xl font-bold text-primary-500">404</h1>
                <p className="text-xl text-text-secondary mt-4">Page not found</p>
                <a href="/" className="text-primary-500 hover:text-primary-400 mt-4 inline-block">
                  Go back home
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

