import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Users,
  Video,
  BookOpen,
  Shield,
  AlertTriangle,
  Activity,
  TrendingUp,
  Eye,
  Clock,
  ChevronRight,
  RefreshCw,
  UserPlus,
  Play,
  Lock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { Card, StatCard } from '@/components/common/Card';
import { Button } from '@/components/common/Button';

interface DashboardStats {
  totalUsers: number;
  totalCourses: number;
  totalVideos: number;
  totalViews: number;
  activeSessionsCount: number;
  blockedDevicesCount: number;
  recentSecurityEvents: number;
  storageUsedGB: number;
}

interface SecurityEvent {
  id: string;
  type: 'login' | 'device_mismatch' | 'multiple_sessions' | 'suspicious_activity';
  userId: string;
  userEmail: string;
  message: string;
  ipAddress: string;
  timestamp: string;
  severity: 'low' | 'medium' | 'high';
}

interface ActiveSession {
  id: string;
  userId: string;
  userEmail: string;
  deviceInfo: string;
  ipAddress: string;
  startedAt: string;
  lastHeartbeat: string;
  isActive: boolean;
}

const mockStats: DashboardStats = {
  totalUsers: 1247,
  totalCourses: 32,
  totalVideos: 486,
  totalViews: 28453,
  activeSessionsCount: 89,
  blockedDevicesCount: 12,
  recentSecurityEvents: 23,
  storageUsedGB: 234.5,
};

const mockSecurityEvents: SecurityEvent[] = [
  {
    id: '1',
    type: 'multiple_sessions',
    userId: 'user-1',
    userEmail: 'john@example.com',
    message: 'Multiple login attempts detected from different devices',
    ipAddress: '192.168.1.100',
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    severity: 'high',
  },
  {
    id: '2',
    type: 'device_mismatch',
    userId: 'user-2',
    userEmail: 'jane@example.com',
    message: 'Device fingerprint changed during session',
    ipAddress: '192.168.1.101',
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    severity: 'medium',
  },
  {
    id: '3',
    type: 'suspicious_activity',
    userId: 'user-3',
    userEmail: 'bob@example.com',
    message: 'Possible screen recording software detected',
    ipAddress: '192.168.1.102',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    severity: 'high',
  },
  {
    id: '4',
    type: 'login',
    userId: 'user-4',
    userEmail: 'alice@example.com',
    message: 'Successful login from new device',
    ipAddress: '192.168.1.103',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    severity: 'low',
  },
];

const mockActiveSessions: ActiveSession[] = [
  {
    id: 'session-1',
    userId: 'user-1',
    userEmail: 'student1@example.com',
    deviceInfo: 'Chrome 120 on Windows 11',
    ipAddress: '192.168.1.50',
    startedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    lastHeartbeat: new Date(Date.now() - 1000 * 30).toISOString(),
    isActive: true,
  },
  {
    id: 'session-2',
    userId: 'user-2',
    userEmail: 'student2@example.com',
    deviceInfo: 'Safari 17 on macOS Sonoma',
    ipAddress: '192.168.1.51',
    startedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    lastHeartbeat: new Date(Date.now() - 1000 * 15).toISOString(),
    isActive: true,
  },
  {
    id: 'session-3',
    userId: 'user-3',
    userEmail: 'student3@example.com',
    deviceInfo: 'Firefox 121 on Ubuntu',
    ipAddress: '192.168.1.52',
    startedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    lastHeartbeat: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    isActive: false,
  },
];

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
};

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats>(mockStats);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>(mockSecurityEvents);
  const [activeSessions, setActiveSessions] = useState<ActiveSession[]>(mockActiveSessions);
  const [isLoading, setIsLoading] = useState(false);

  const handleRefresh = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsLoading(false);
  };

  const handleKillSession = async (sessionId: string) => {
    setActiveSessions((sessions) =>
      sessions.map((s) =>
        s.id === sessionId ? { ...s, isActive: false } : s
      )
    );
  };

  const severityColors = {
    low: 'text-accent-green bg-accent-green/10',
    medium: 'text-accent-yellow bg-accent-yellow/10',
    high: 'text-accent-red bg-accent-red/10',
  };

  const eventTypeIcons = {
    login: CheckCircle,
    device_mismatch: AlertTriangle,
    multiple_sessions: Users,
    suspicious_activity: Shield,
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Admin Dashboard</h1>
          <p className="text-text-secondary mt-1">
            Monitor system health, security events, and user activity
          </p>
        </div>
        <Button
          variant="secondary"
          leftIcon={<RefreshCw size={16} />}
          onClick={handleRefresh}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <StatCard
          title="Total Users"
          value={stats.totalUsers.toLocaleString()}
          icon={<Users size={20} />}
          trend={{ value: 12, isPositive: true }}
          iconColor="bg-primary-500/10 text-primary-400"
        />
        <StatCard
          title="Total Courses"
          value={stats.totalCourses}
          icon={<BookOpen size={20} />}
          iconColor="bg-accent-blue/10 text-accent-blue"
        />
        <StatCard
          title="Total Videos"
          value={stats.totalVideos}
          icon={<Video size={20} />}
          iconColor="bg-accent-purple/10 text-accent-purple"
        />
        <StatCard
          title="Total Views"
          value={stats.totalViews.toLocaleString()}
          icon={<Eye size={20} />}
          trend={{ value: 8, isPositive: true }}
          iconColor="bg-accent-green/10 text-accent-green"
        />
      </motion.div>

      {/* Security Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <Card variant="default" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-green/10">
            <Activity size={24} className="text-accent-green" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Active Sessions</p>
            <p className="text-2xl font-bold text-text-primary">{stats.activeSessionsCount}</p>
          </div>
        </Card>
        <Card variant="default" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-red/10">
            <Lock size={24} className="text-accent-red" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Blocked Devices</p>
            <p className="text-2xl font-bold text-text-primary">{stats.blockedDevicesCount}</p>
          </div>
        </Card>
        <Card variant="default" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-yellow/10">
            <AlertTriangle size={24} className="text-accent-yellow" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Security Events (24h)</p>
            <p className="text-2xl font-bold text-text-primary">{stats.recentSecurityEvents}</p>
          </div>
        </Card>
        <Card variant="default" className="flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary-500/10">
            <TrendingUp size={24} className="text-primary-400" />
          </div>
          <div>
            <p className="text-sm text-text-muted">Storage Used</p>
            <p className="text-2xl font-bold text-text-primary">{stats.storageUsedGB} GB</p>
          </div>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Security Events */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card variant="default" padding="none">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Shield size={18} className="text-accent-yellow" />
                <h3 className="font-semibold text-text-primary">Security Events</h3>
              </div>
              <button className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-surface-border">
              {securityEvents.map((event) => {
                const Icon = eventTypeIcons[event.type];
                return (
                  <div key={event.id} className="p-4 hover:bg-surface-light transition-colors">
                    <div className="flex items-start gap-3">
                      <div className={clsx('p-2 rounded-lg', severityColors[event.severity])}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium text-text-primary truncate">
                            {event.userEmail}
                          </p>
                          <span className={clsx('text-xs px-2 py-0.5 rounded-full', severityColors[event.severity])}>
                            {event.severity}
                          </span>
                        </div>
                        <p className="text-sm text-text-secondary mt-1">{event.message}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                          <span>{event.ipAddress}</span>
                          <span>{formatTimeAgo(event.timestamp)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </motion.div>

        {/* Active Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card variant="default" padding="none">
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <Activity size={18} className="text-accent-green" />
                <h3 className="font-semibold text-text-primary">Active Sessions</h3>
              </div>
              <button className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1">
                View All <ChevronRight size={16} />
              </button>
            </div>
            <div className="divide-y divide-surface-border">
              {activeSessions.map((session) => (
                <div key={session.id} className="p-4 hover:bg-surface-light transition-colors">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <div
                          className={clsx(
                            'w-2 h-2 rounded-full',
                            session.isActive ? 'bg-accent-green' : 'bg-text-muted'
                          )}
                        />
                        <p className="text-sm font-medium text-text-primary truncate">
                          {session.userEmail}
                        </p>
                      </div>
                      <p className="text-xs text-text-secondary mt-1">{session.deviceInfo}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-text-muted">
                        <span>{session.ipAddress}</span>
                        <span className="flex items-center gap-1">
                          <Clock size={12} />
                          {formatTimeAgo(session.startedAt)}
                        </span>
                      </div>
                    </div>
                    {session.isActive && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleKillSession(session.id)}
                      >
                        Kill
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <button className="flex flex-col items-center gap-3 p-6 bg-surface border border-surface-border rounded-xl hover:border-primary-500/30 transition-colors group">
            <div className="p-3 rounded-xl bg-primary-500/10 group-hover:bg-primary-500/20 transition-colors">
              <UserPlus size={24} className="text-primary-400" />
            </div>
            <span className="text-sm font-medium text-text-primary">Add User</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-surface border border-surface-border rounded-xl hover:border-primary-500/30 transition-colors group">
            <div className="p-3 rounded-xl bg-accent-blue/10 group-hover:bg-accent-blue/20 transition-colors">
              <Video size={24} className="text-accent-blue" />
            </div>
            <span className="text-sm font-medium text-text-primary">Upload Video</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-surface border border-surface-border rounded-xl hover:border-primary-500/30 transition-colors group">
            <div className="p-3 rounded-xl bg-accent-purple/10 group-hover:bg-accent-purple/20 transition-colors">
              <BookOpen size={24} className="text-accent-purple" />
            </div>
            <span className="text-sm font-medium text-text-primary">Create Course</span>
          </button>
          <button className="flex flex-col items-center gap-3 p-6 bg-surface border border-surface-border rounded-xl hover:border-primary-500/30 transition-colors group">
            <div className="p-3 rounded-xl bg-accent-yellow/10 group-hover:bg-accent-yellow/20 transition-colors">
              <Shield size={24} className="text-accent-yellow" />
            </div>
            <span className="text-sm font-medium text-text-primary">Security Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;
