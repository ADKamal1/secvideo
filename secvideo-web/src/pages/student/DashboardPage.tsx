import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  PlayCircle,
  BookOpen,
  Clock,
  TrendingUp,
  ArrowRight,
  ChevronRight,
  Calendar,
} from 'lucide-react';
import { Card, StatCard, CourseCard } from '@/components/common/Card';
import { useAuthStore } from '@/store/authStore';

// Mock data - would come from API
const mockCourses = [
  {
    id: '1',
    title: 'Advanced React Patterns',
    description: 'Master advanced React concepts including hooks, context, and performance optimization.',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
    instructorName: 'Sarah Johnson',
    videosCount: 24,
    progress: 68,
  },
  {
    id: '2',
    title: 'Node.js Backend Development',
    description: 'Build scalable backend applications with Node.js, Express, and MongoDB.',
    thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
    instructorName: 'Mike Chen',
    videosCount: 32,
    progress: 45,
  },
  {
    id: '3',
    title: 'UI/UX Design Fundamentals',
    description: 'Learn the principles of great design and create stunning user interfaces.',
    thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
    instructorName: 'Emily Davis',
    videosCount: 18,
    progress: 12,
  },
];

const mockRecentVideos = [
  {
    id: '1',
    title: 'Custom Hooks Deep Dive',
    courseName: 'Advanced React Patterns',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    duration: '24:30',
    progress: 75,
  },
  {
    id: '2',
    title: 'REST API Design',
    courseName: 'Node.js Backend Development',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    duration: '32:15',
    progress: 100,
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
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
      className="space-y-8"
    >
      {/* Welcome Section */}
      <motion.div variants={itemVariants}>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">
              Welcome back, {user?.name?.split(' ')[0] || 'Student'}! 👋
            </h1>
            <p className="text-text-secondary mt-1">
              Continue your learning journey where you left off.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-text-muted">
              <Calendar size={14} className="inline mr-1" />
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Courses Enrolled"
            value="5"
            change={20}
            trend="up"
            icon={<BookOpen size={24} />}
          />
          <StatCard
            label="Videos Watched"
            value="48"
            change={12}
            trend="up"
            icon={<PlayCircle size={24} />}
          />
          <StatCard
            label="Watch Time"
            value="23h"
            change={8}
            trend="up"
            icon={<Clock size={24} />}
          />
          <StatCard
            label="Avg. Progress"
            value="42%"
            change={5}
            trend="up"
            icon={<TrendingUp size={24} />}
          />
        </div>
      </motion.div>

      {/* Continue Watching */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">Continue Watching</h2>
          <Link
            to="/history"
            className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {mockRecentVideos.map((video) => (
            <Link key={video.id} to={`/watch/${video.id}`}>
              <Card
                variant="default"
                padding="none"
                hoverable
                className="overflow-hidden group"
              >
                <div className="flex">
                  {/* Thumbnail */}
                  <div className="relative w-40 sm:w-48 flex-shrink-0">
                    <img
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full h-full object-cover aspect-video"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="w-12 h-12 rounded-full bg-primary-500/90 flex items-center justify-center">
                        <PlayCircle size={24} className="text-white" />
                      </div>
                    </div>
                    {/* Duration badge */}
                    <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/70 text-xs font-medium text-white">
                      {video.duration}
                    </div>
                    {/* Progress bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
                      <div
                        className="h-full bg-primary-500"
                        style={{ width: `${video.progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Info */}
                  <div className="flex-1 p-4">
                    <h3 className="font-medium text-text-primary line-clamp-1 group-hover:text-primary-400 transition-colors">
                      {video.title}
                    </h3>
                    <p className="text-sm text-text-muted mt-1">{video.courseName}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span
                        className={clsx(
                          'text-xs font-medium px-2 py-0.5 rounded-full',
                          video.progress === 100
                            ? 'bg-accent-emerald/20 text-accent-emerald'
                            : 'bg-primary-500/20 text-primary-400'
                        )}
                      >
                        {video.progress === 100 ? 'Completed' : `${video.progress}% complete`}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* My Courses */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-text-primary">My Courses</h2>
          <Link
            to="/courses"
            className="text-sm text-primary-500 hover:text-primary-400 flex items-center gap-1 transition-colors"
          >
            View All <ChevronRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {mockCourses.map((course) => (
            <CourseCard
              key={course.id}
              id={course.id}
              title={course.title}
              description={course.description}
              thumbnail={course.thumbnail}
              instructorName={course.instructorName}
              videosCount={course.videosCount}
              progress={course.progress}
              onClick={() => {}}
            />
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card variant="gradient" className="relative overflow-hidden">
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-text-primary">
                Ready to learn something new?
              </h3>
              <p className="text-text-secondary mt-1">
                Browse our course catalog and start a new learning journey today.
              </p>
            </div>
            <Link
              to="/courses"
              className={clsx(
                'inline-flex items-center gap-2 px-6 py-3 rounded-xl',
                'bg-primary-500 hover:bg-primary-400 text-white font-medium',
                'transition-colors'
              )}
            >
              Browse Courses <ArrowRight size={18} />
            </Link>
          </div>
          {/* Decorative */}
          <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary-500/10 rounded-full blur-2xl" />
        </Card>
      </motion.div>
    </motion.div>
  );
};

