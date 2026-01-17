import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Search, Filter, Grid, List, SlidersHorizontal, RefreshCw } from 'lucide-react';
import { CourseCard } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Loader';
import { coursesApi } from '@/services/api/coursesApi';
import type { Course } from '@/types';

type FilterType = 'all' | 'in-progress' | 'completed' | 'not-started';
type ViewMode = 'grid' | 'list';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses from API
  const fetchCourses = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await coursesApi.getCourses({ search: searchQuery || undefined });
      setCourses(response.items || []);
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again.');
      // Fallback to mock data for demo
      setCourses([
        {
          id: '1',
          title: 'Advanced React Patterns',
          description: 'Master advanced React concepts including hooks, context, and performance optimization techniques.',
          thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&h=450&fit=crop',
          instructorId: '1',
          instructorName: 'Sarah Johnson',
          videosCount: 24,
          totalDuration: 43200,
          enrolledCount: 156,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 68,
        },
        {
          id: '2',
          title: 'Node.js Backend Development',
          description: 'Build scalable backend applications with Node.js, Express, and MongoDB from scratch.',
          thumbnail: 'https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=800&h=450&fit=crop',
          instructorId: '2',
          instructorName: 'Mike Chen',
          videosCount: 32,
          totalDuration: 57600,
          enrolledCount: 234,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 45,
        },
        {
          id: '3',
          title: 'UI/UX Design Fundamentals',
          description: 'Learn the principles of great design and create stunning user interfaces.',
          thumbnail: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&h=450&fit=crop',
          instructorId: '3',
          instructorName: 'Emily Davis',
          videosCount: 18,
          totalDuration: 32400,
          enrolledCount: 89,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          progress: 12,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== '') {
        fetchCourses();
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const filteredCourses = courses.filter((course) => {
    // Status filter
    const progress = course.progress ?? 0;
    switch (filter) {
      case 'in-progress':
        return progress > 0 && progress < 100;
      case 'completed':
        return progress === 100;
      case 'not-started':
        return progress === 0;
      default:
        return true;
    }
  });

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">My Courses</h1>
          <p className="text-text-secondary mt-1">
            {courses.length} courses enrolled
          </p>
        </div>
        <Button 
          variant="secondary" 
          leftIcon={<RefreshCw size={16} />}
          onClick={fetchCourses}
          isLoading={isLoading}
        >
          Refresh
        </Button>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-4 rounded-xl bg-accent-red/10 border border-accent-red/20 text-accent-red">
          {error}
        </div>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted"
          />
          <input
            type="text"
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={clsx(
              'w-full h-11 pl-11 pr-4 rounded-xl',
              'bg-surface border border-surface-border',
              'text-text-primary placeholder:text-text-muted',
              'focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20',
              'transition-all duration-200'
            )}
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-surface border border-surface-border rounded-xl p-1">
            {(['all', 'in-progress', 'completed', 'not-started'] as FilterType[]).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors',
                  filter === f
                    ? 'bg-primary-500 text-white'
                    : 'text-text-secondary hover:text-text-primary'
                )}
              >
                {f === 'all' && 'All'}
                {f === 'in-progress' && 'In Progress'}
                {f === 'completed' && 'Completed'}
                {f === 'not-started' && 'Not Started'}
              </button>
            ))}
          </div>

          {/* View mode toggle */}
          <div className="flex items-center bg-surface border border-surface-border rounded-xl p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'grid'
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <Grid size={18} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'p-2 rounded-lg transition-colors',
                viewMode === 'list'
                  ? 'bg-primary-500/20 text-primary-500'
                  : 'text-text-muted hover:text-text-secondary'
              )}
            >
              <List size={18} />
            </button>
          </div>

          <Button variant="secondary" leftIcon={<SlidersHorizontal size={16} />}>
            Filters
          </Button>
        </div>
      </div>

      {/* Courses Grid/List */}
      {isLoading ? (
        <div className={clsx(
          'grid gap-6',
          viewMode === 'grid'
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            : 'grid-cols-1'
        )}>
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-2xl overflow-hidden bg-surface">
              <Skeleton variant="rectangular" height={180} />
              <div className="p-5 space-y-3">
                <Skeleton variant="text" />
                <Skeleton variant="text" width="60%" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="p-4 rounded-2xl bg-surface-light mb-4">
            <Filter size={40} className="text-text-muted" />
          </div>
          <h3 className="text-lg font-semibold text-text-primary mb-2">No courses found</h3>
          <p className="text-text-secondary text-center max-w-md">
            {searchQuery
              ? `No courses match "${searchQuery}". Try a different search term.`
              : 'No courses match the selected filter.'}
          </p>
        </div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className={clsx(
            'grid gap-6',
            viewMode === 'grid'
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
              : 'grid-cols-1'
          )}
        >
          {filteredCourses.map((course) => (
            <motion.div key={course.id} variants={itemVariants}>
              {viewMode === 'grid' ? (
                <CourseCard
                  id={course.id}
                  title={course.title}
                  description={course.description}
                  thumbnail={course.thumbnail || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop'}
                  instructorName={course.instructorName || 'Unknown Instructor'}
                  videosCount={course.videosCount || 0}
                  progress={course.progress}
                  onClick={() => navigate(`/courses/${course.id}`)}
                />
              ) : (
                <button
                  onClick={() => navigate(`/courses/${course.id}`)}
                  className="w-full flex gap-4 p-4 bg-surface border border-surface-border rounded-2xl hover:border-primary-500/30 transition-colors group text-left"
                >
                  <img
                    src={course.thumbnail || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=800&h=450&fit=crop'}
                    alt={course.title}
                    className="w-48 h-28 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-text-primary group-hover:text-primary-400 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-sm text-text-secondary mt-1 line-clamp-2">
                      {course.description}
                    </p>
                    <div className="flex items-center gap-4 mt-3">
                      <span className="text-sm text-text-muted">
                        {course.videosCount || 0} videos
                      </span>
                      <span className="text-sm text-text-muted">
                        by {course.instructorName || 'Unknown'}
                      </span>
                    </div>
                    {course.progress !== undefined && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-text-muted">Progress</span>
                          <span className="text-primary-400 font-medium">{course.progress}%</span>
                        </div>
                        <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            style={{ width: `${course.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              )}
            </motion.div>
          ))}
        </motion.div>
      )}
    </div>
  );
};
