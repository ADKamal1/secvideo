import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  BookOpen,
  PlayCircle,
  Users,
  BarChart3,
  Settings,
  Upload,
  Shield,
  HelpCircle,
  X,
  Radio,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';

interface NavItem {
  label: string;
  path: string;
  icon: React.ElementType;
  roles?: ('admin' | 'instructor' | 'student')[];
  badge?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard },
  { label: 'My Courses', path: '/courses', icon: BookOpen },
  { label: 'Watch History', path: '/history', icon: PlayCircle, roles: ['student'] },
  { label: 'Live Streams', path: '/live', icon: Radio, badge: 'Soon' },
  { label: 'Upload Video', path: '/upload', icon: Upload, roles: ['admin', 'instructor'] },
  { label: 'Manage Courses', path: '/manage/courses', icon: BookOpen, roles: ['admin', 'instructor'] },
  { label: 'Users', path: '/users', icon: Users, roles: ['admin'] },
  { label: 'Analytics', path: '/analytics', icon: BarChart3, roles: ['admin', 'instructor'] },
  { label: 'Security', path: '/security', icon: Shield, roles: ['admin'] },
  { label: 'Settings', path: '/settings', icon: Settings },
];

const NavItemComponent: React.FC<{ item: NavItem; collapsed?: boolean }> = ({
  item,
  collapsed,
}) => {
  const location = useLocation();
  const isActive = location.pathname === item.path;

  return (
    <NavLink
      to={item.path}
      className={clsx(
        'relative flex items-center gap-3 px-3 py-2.5 rounded-xl',
        'transition-all duration-200',
        'group',
        isActive
          ? 'bg-primary-500/10 text-primary-500'
          : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeIndicator"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full"
        />
      )}

      <item.icon
        size={20}
        className={clsx(
          'flex-shrink-0 transition-colors',
          isActive ? 'text-primary-500' : 'text-text-muted group-hover:text-text-secondary'
        )}
      />

      {!collapsed && (
        <>
          <span className="flex-1 text-sm font-medium">{item.label}</span>
          {item.badge && (
            <span className="px-2 py-0.5 text-2xs font-medium rounded-full bg-accent-purple/20 text-accent-purple">
              {item.badge}
            </span>
          )}
        </>
      )}

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <div className="absolute left-full ml-2 px-3 py-1.5 bg-surface border border-surface-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
          <span className="text-sm font-medium text-text-primary">{item.label}</span>
        </div>
      )}
    </NavLink>
  );
};

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { isSidebarOpen, isSidebarCollapsed, isMobileMenuOpen, setMobileMenuOpen } = useUIStore();

  const filteredItems = navItems.filter(
    (item) => !item.roles || (user?.role && item.roles.includes(user.role))
  );

  // Desktop sidebar
  const DesktopSidebar = (
    <motion.aside
      initial={false}
      animate={{
        width: isSidebarOpen ? (isSidebarCollapsed ? 80 : 260) : 0,
        opacity: isSidebarOpen ? 1 : 0,
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className={clsx(
        'hidden lg:flex flex-col',
        'fixed left-0 top-16 bottom-0 z-30',
        'bg-background border-r border-surface-border',
        'overflow-hidden'
      )}
    >
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto no-scrollbar">
        {filteredItems.map((item) => (
          <NavItemComponent key={item.path} item={item} collapsed={isSidebarCollapsed} />
        ))}
      </nav>

      {/* Help section */}
      {!isSidebarCollapsed && (
        <div className="p-4 border-t border-surface-border">
          <div className="p-4 rounded-xl bg-gradient-to-br from-primary-500/10 to-accent-purple/10 border border-primary-500/20">
            <div className="flex items-center gap-2 mb-2">
              <HelpCircle size={18} className="text-primary-500" />
              <span className="text-sm font-medium text-text-primary">Need help?</span>
            </div>
            <p className="text-xs text-text-muted mb-3">
              Check our documentation or contact support.
            </p>
            <button className="w-full py-2 text-sm font-medium text-primary-500 hover:text-primary-400 transition-colors">
              View Docs
            </button>
          </div>
        </div>
      )}
    </motion.aside>
  );

  // Mobile sidebar
  const MobileSidebar = (
    <AnimatePresence>
      {isMobileMenuOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          />

          {/* Sidebar */}
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="fixed left-0 top-0 bottom-0 z-50 w-72 bg-background border-r border-surface-border lg:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between h-16 px-4 border-b border-surface-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-accent-purple flex items-center justify-center">
                  <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <span className="text-xl font-bold text-text-primary">
                  Sec<span className="text-primary-500">Video</span>
                </span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl hover:bg-surface-light transition-colors"
              >
                <X size={20} className="text-text-secondary" />
              </button>
            </div>

            {/* Nav items */}
            <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
              {filteredItems.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-4 py-3 rounded-xl',
                      'transition-all duration-200',
                      isActive
                        ? 'bg-primary-500/10 text-primary-500'
                        : 'text-text-secondary hover:text-text-primary hover:bg-surface-light'
                    )
                  }
                >
                  <item.icon size={20} />
                  <span className="flex-1 text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="px-2 py-0.5 text-2xs font-medium rounded-full bg-accent-purple/20 text-accent-purple">
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {DesktopSidebar}
      {MobileSidebar}
    </>
  );
};

