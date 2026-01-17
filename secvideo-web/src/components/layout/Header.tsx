import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import {
  Menu,
  Bell,
  Search,
  LogOut,
  User,
  Settings,
  ChevronDown,
  Shield,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { toggleSidebar, toggleMobileMenu } = useUIStore();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const [showSearch, setShowSearch] = React.useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-background/80 backdrop-blur-xl border-b border-surface-border">
      <div className="flex items-center justify-between h-full px-4 lg:px-6">
        {/* Left section */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleMobileMenu}
            className="lg:hidden p-2 rounded-xl hover:bg-surface-light transition-colors"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>

          {/* Desktop sidebar toggle */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-2 rounded-xl hover:bg-surface-light transition-colors"
          >
            <Menu size={20} className="text-text-secondary" />
          </button>

          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
              <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="hidden sm:block text-xl font-bold text-text-primary">
              Sec<span className="text-primary-500">Video</span>
            </span>
          </Link>
        </div>

        {/* Center - Search */}
        <div className="hidden md:flex flex-1 max-w-xl mx-8">
          <div className="relative w-full">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search courses, videos..."
              className={clsx(
                'w-full h-10 pl-11 pr-4 rounded-xl',
                'bg-surface border border-surface-border',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
                'transition-all duration-200'
              )}
            />
          </div>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mobile search */}
          <button
            onClick={() => setShowSearch(!showSearch)}
            className="md:hidden p-2 rounded-xl hover:bg-surface-light transition-colors"
          >
            <Search size={20} className="text-text-secondary" />
          </button>

          {/* Security indicator */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent-emerald/10 border border-accent-emerald/20">
            <Shield size={14} className="text-accent-emerald" />
            <span className="text-xs font-medium text-accent-emerald">Secure</span>
          </div>

          {/* Notifications */}
          <button className="relative p-2 rounded-xl hover:bg-surface-light transition-colors">
            <Bell size={20} className="text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-accent-red rounded-full" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className={clsx(
                'flex items-center gap-3 p-1.5 pr-3 rounded-xl',
                'hover:bg-surface-light transition-colors',
                showUserMenu && 'bg-surface-light'
              )}
            >
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-8 h-8 rounded-lg object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center text-white font-medium text-sm">
                  {user?.name?.charAt(0).toUpperCase() || 'U'}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-sm font-medium text-text-primary">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-text-muted capitalize">
                  {user?.role || 'Student'}
                </p>
              </div>
              <ChevronDown
                size={16}
                className={clsx(
                  'hidden lg:block text-text-muted transition-transform',
                  showUserMenu && 'rotate-180'
                )}
              />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className={clsx(
                    'absolute right-0 top-full mt-2 z-50',
                    'w-56 py-2',
                    'bg-surface border border-surface-border rounded-xl',
                    'shadow-xl'
                  )}
                >
                  <div className="px-4 py-2 border-b border-surface-border mb-2">
                    <p className="text-sm font-medium text-text-primary">
                      {user?.name}
                    </p>
                    <p className="text-xs text-text-muted">{user?.email}</p>
                  </div>

                  <Link
                    to="/profile"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                  >
                    <User size={16} />
                    Profile
                  </Link>

                  <Link
                    to="/settings"
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-3 px-4 py-2 text-sm text-text-secondary hover:text-text-primary hover:bg-surface-light transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </Link>

                  <div className="border-t border-surface-border mt-2 pt-2">
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full px-4 py-2 text-sm text-accent-red hover:bg-accent-red/10 transition-colors"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search overlay */}
      {showSearch && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute top-full left-0 right-0 p-4 bg-background border-b border-surface-border md:hidden"
        >
          <div className="relative">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
            />
            <input
              type="text"
              placeholder="Search courses, videos..."
              autoFocus
              className={clsx(
                'w-full h-10 pl-11 pr-4 rounded-xl',
                'bg-surface border border-surface-border',
                'text-text-primary placeholder:text-text-muted',
                'focus:outline-none focus:border-primary-500'
              )}
            />
          </div>
        </motion.div>
      )}
    </header>
  );
};

