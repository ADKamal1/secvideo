import React, { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '@/components/common/Toast';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { sessionManager } from '@/services/security/sessionManager';
import { PageLoader } from '@/components/common/Loader';

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isDeviceVerified, token, checkSession } = useAuthStore();
  const { isSidebarOpen, isSidebarCollapsed, globalLoading, loadingMessage } = useUIStore();
  const [isChecking, setIsChecking] = React.useState(true);

  // Check session on mount
  useEffect(() => {
    const validateSession = async () => {
      if (!isAuthenticated || !token) {
        navigate('/login');
        setIsChecking(false);
        return;
      }

      if (!isDeviceVerified) {
        navigate('/device-verify');
        setIsChecking(false);
        return;
      }

      const isValid = await checkSession();
      if (!isValid) {
        navigate('/login');
      }
      setIsChecking(false);
    };

    validateSession();
  }, [isAuthenticated, isDeviceVerified, token, checkSession, navigate]);

  // Set up session event listeners
  useEffect(() => {
    const handleSessionKilled = (_event: string, data?: unknown) => {
      const { reason } = data as { reason?: string } || {};
      navigate(`/session-blocked?reason=${encodeURIComponent(reason || 'Session terminated')}`);
    };

    const handleDeviceMismatch = () => {
      navigate('/device-verify');
    };

    sessionManager.on('session_killed', handleSessionKilled);
    sessionManager.on('device_mismatch', handleDeviceMismatch);

    return () => {
      sessionManager.off('session_killed', handleSessionKilled);
      sessionManager.off('device_mismatch', handleDeviceMismatch);
    };
  }, [navigate]);

  if (isChecking) {
    return <PageLoader message="Verifying session..." />;
  }

  // Calculate main content margin based on sidebar state
  const mainMarginLeft = isSidebarOpen
    ? isSidebarCollapsed
      ? 'lg:ml-20'
      : 'lg:ml-[260px]'
    : 'lg:ml-0';

  return (
    <div className="min-h-screen bg-background">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      <Header />
      <Sidebar />

      <main
        className={clsx(
          'relative min-h-screen pt-16',
          'transition-all duration-300 ease-in-out',
          mainMarginLeft
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>

      {/* Global loading overlay */}
      {globalLoading && <PageLoader message={loadingMessage || 'Loading...'} />}

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
};

