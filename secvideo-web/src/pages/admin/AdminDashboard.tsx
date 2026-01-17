import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Users,
  BookOpen,
  PlayCircle,
  TrendingUp,
  Activity,
  Clock,
  Shield,
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
} from 'lucide-react';
import { Card, StatCard } from '@/components/common/Card';

// Mock data
const mockStats = {
  totalUsers: 847,
  totalCourses: 24,
  totalVideos: 186,
  activeStreams: 3,
  todayViews: 1247,
  weeklyGrowth: 12.5,
};

const mockRecentActivity = [
  {
    id: '1',
    type: 'user_login',
    user: 'John Doe',
    message: 'Logged in from Chrome on Windows',
    time: '2 minutes ago',
    status: 'success',
  },
  {
    id: '2',
    type: 'security',
    user: 'Jane Smith',
    message: 'DevTools detection triggered',
    time: '15 minutes ago',
    status: 'warning',
  },
  {
    id: '3',
    type: 'video_watch',
    user: 'Mike Chen',
    message: 'Completed "React Hooks Deep Dive"',
    time: '32 minutes ago',
    status: 'success',
  },
  {
    id: '4',
    type: 'device_verify',
    user: 'Emily Davis',
    message: 'Verified new device',
    time: '1 hour ago',
    status: 'info',
  },
  {
    id: '5',
    type: 'security',
    user: 'Alex Turner',
    message: 'Multiple login attempt blocked',
    time: '2 hours ago',
    status: 'danger',
  },
];

const mockSecurityAlerts = [
  {
    id: '1',
    title: 'High DevTools Detection Rate',
    description: '23 users triggered DevTools detection in the last hour',
    severity: 'warning',
  },
  {
    id: '2',
    title: 'Unusual Login Pattern',
    description: 'User "alex@example.com" attempted login from 3 different countries',
    severity: 'danger',
  },
];

const mockTopCourses = [
  { name: 'Advanced React Patterns', views: 3420, growth: 15 },
  { name: 'Node.js Backend', views: 2890, growth: 8 },
  { name: 'UI/UX Fundamentals', views: 2340, growth: 22 },
  { name: 'TypeScript Masterclass', views: 1980, growth: -3 },
];

export const AdminDashboard: React.FC = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Admin Dashboard</h1>
        <p className="text-text-secondary mt-1">Overview of your learning platform</p>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Users"
            value={mockStats.totalUsers}
            change={mockStats.weeklyGrowth}
            trend="up"
            icon={<Users size={24} />}
          />
          <StatCard
            label="Total Courses"
            value={mockStats.totalCourses}
            change={8}
            trend="up"
            icon={<BookOpen size={24} />}
          />
          <StatCard
            label="Total Videos"
            value={mockStats.totalVideos}
            change={15}
            trend="up"
            icon={<PlayCircle size={24} />}
          />
          <StatCard
            label="Today's Views"
            value={mockStats.todayViews}
            change={23}
            trend="up"
            icon={<TrendingUp size={24} />}
          />
        </div>
      </motion.div>

      {/* Security Alerts */}
      {mockSecurityAlerts.length > 0 && (
        <motion.div variants={itemVariants}>
          <Card variant="default" className="border-accent-amber/30">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent-amber/10">
                <AlertTriangle size={20} className="text-accent-amber" />
              </div>
              <h2 className="text-lg font-semibold text-text-primary">Security Alerts</h2>
              <span className="ml-auto px-2 py-1 text-xs font-medium rounded-full bg-accent-amber/20 text-accent-amber">
                {mockSecurityAlerts.length} active
              </span>
            </div>
            <div className="space-y-3">
              {mockSecurityAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className={clsx(
                    'flex items-start gap-3 p-3 rounded-xl',
                    alert.severity === 'danger' ? 'bg-accent-red/10' : 'bg-accent-amber/10'
                  )}
                >
                  <div
                    className={clsx(
                      'w-2 h-2 rounded-full mt-2',
                      alert.severity === 'danger' ? 'bg-accent-red' : 'bg-accent-amber'
                    )}
                  />
                  <div className="flex-1">
                    <p className="font-medium text-text-primary">{alert.title}</p>
                    <p className="text-sm text-text-muted mt-1">{alert.description}</p>
                  </div>
                  <button className="text-sm text-primary-500 hover:text-primary-400 font-medium">
                    View
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <motion.div variants={itemVariants} className="lg:col-span-2">
          <Card variant="default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Activity size={20} className="text-primary-500" />
                <h2 className="text-lg font-semibold text-text-primary">Recent Activity</h2>
              </div>
              <Link
                to="/activity"
                className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1"
              >
                View All <ChevronRight size={16} />
              </Link>
            </div>

            <div className="space-y-4">
              {mockRecentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-surface-border last:border-0 last:pb-0"
                >
                  <div
                    className={clsx(
                      'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                      activity.status === 'success' && 'bg-accent-emerald/10 text-accent-emerald',
                      activity.status === 'warning' && 'bg-accent-amber/10 text-accent-amber',
                      activity.status === 'danger' && 'bg-accent-red/10 text-accent-red',
                      activity.status === 'info' && 'bg-primary-500/10 text-primary-500'
                    )}
                  >
                    {activity.type === 'security' && <Shield size={18} />}
                    {activity.type === 'user_login' && <Users size={18} />}
                    {activity.type === 'video_watch' && <PlayCircle size={18} />}
                    {activity.type === 'device_verify' && <Shield size={18} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary">{activity.user}</p>
                    <p className="text-sm text-text-secondary">{activity.message}</p>
                  </div>
                  <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
                    <Clock size={12} />
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Top Courses */}
        <motion.div variants={itemVariants}>
          <Card variant="default">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <TrendingUp size={20} className="text-primary-500" />
                <h2 className="text-lg font-semibold text-text-primary">Top Courses</h2>
              </div>
            </div>

            <div className="space-y-4">
              {mockTopCourses.map((course, index) => (
                <div key={course.name} className="flex items-center gap-3">
                  <span
                    className={clsx(
                      'w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold flex-shrink-0',
                      index === 0 && 'bg-accent-amber/20 text-accent-amber',
                      index === 1 && 'bg-text-muted/20 text-text-muted',
                      index === 2 && 'bg-accent-orange/20 text-accent-orange',
                      index > 2 && 'bg-surface-light text-text-muted'
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-text-primary truncate">{course.name}</p>
                    <p className="text-sm text-text-muted">{course.views.toLocaleString()} views</p>
                  </div>
                  <span
                    className={clsx(
                      'text-xs font-medium flex items-center gap-0.5',
                      course.growth >= 0 ? 'text-accent-emerald' : 'text-accent-red'
                    )}
                  >
                    <ArrowUpRight
                      size={14}
                      className={course.growth < 0 ? 'rotate-90' : ''}
                    />
                    {Math.abs(course.growth)}%
                  </span>
                </div>
              ))}
            </div>

            <Link
              to="/analytics"
              className="mt-4 flex items-center justify-center gap-2 p-3 rounded-xl bg-surface-light hover:bg-background-hover text-sm font-medium text-text-secondary hover:text-text-primary transition-colors"
            >
              View Analytics <ArrowUpRight size={16} />
            </Link>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Add New Course', icon: BookOpen, path: '/manage/courses/new', color: 'primary' },
            { label: 'Upload Video', icon: PlayCircle, path: '/upload', color: 'purple' },
            { label: 'Manage Users', icon: Users, path: '/users', color: 'emerald' },
            { label: 'Security Settings', icon: Shield, path: '/security', color: 'amber' },
          ].map((action) => (
            <Link
              key={action.label}
              to={action.path}
              className={clsx(
                'flex items-center gap-4 p-4 rounded-xl border border-surface-border',
                'bg-surface hover:bg-surface-light transition-colors group'
              )}
            >
              <div
                className={clsx(
                  'p-3 rounded-xl',
                  action.color === 'primary' && 'bg-primary-500/10 text-primary-500',
                  action.color === 'purple' && 'bg-accent-purple/10 text-accent-purple',
                  action.color === 'emerald' && 'bg-accent-emerald/10 text-accent-emerald',
                  action.color === 'amber' && 'bg-accent-amber/10 text-accent-amber'
                )}
              >
                <action.icon size={24} />
              </div>
              <span className="font-medium text-text-primary group-hover:text-primary-400 transition-colors">
                {action.label}
              </span>
            </Link>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
};

