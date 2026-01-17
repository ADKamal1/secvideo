import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ArrowLeft,
  Play,
  Clock,
  Users,
  BookOpen,
  CheckCircle,
  Lock,
  ChevronRight,
  Award,
  BarChart3,
} from 'lucide-react';
import { Button } from '@/components/common/Button';
import { Skeleton } from '@/components/common/Loader';
import { coursesApi } from '@/services/api/coursesApi';
import type { CourseWithVideos, Video } from '@/types';

const formatDuration = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

export const CourseDetailPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  useEffect(() => {
    const fetchCourse = async () => {
      if (!courseId) return;
      setIsLoading(true);
      setError(null);
      try {
        const data = await coursesApi.getCourseWithVideos(courseId);
        setCourse(data);
      } catch (err) {
        console.error('Failed to fetch course:', err);
        setError('Failed to load course details');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCourse();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!courseId) return;
    setIsEnrolling(true);
    try {
      await coursesApi.enrollStudent(courseId);
      // Refresh course data to get updated enrollment status
      const data = await coursesApi.getCourseWithVideos(courseId);
      setCourse(data);
    } catch (err) {
      console.error('Failed to enroll:', err);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleWatchVideo = (video: Video) => {
    navigate(`/watch/${video.id}`);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" height={300} className="rounded-2xl" />
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={80} className="rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="text-red-400 mb-4">❌</div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Course Not Found</h3>
        <p className="text-text-secondary mb-6">{error || 'The course you are looking for does not exist.'}</p>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const isEnrolled = course.progress !== undefined && course.progress !== null;
  const completedVideos = course.videos?.filter((v) => (v.watchProgress ?? 0) >= 90).length || 0;
  const totalVideos = course.videos?.length || 0;

  return (
    <div className="space-y-8">
      {/* Back Button */}
      <Button
        variant="ghost"
        leftIcon={<ArrowLeft size={18} />}
        onClick={() => navigate('/courses')}
        className="text-text-secondary hover:text-text-primary"
      >
        Back to Courses
      </Button>

      {/* Hero Section */}
      <div className="relative rounded-2xl overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img
            src={course.thumbnail || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=1200&h=400&fit=crop'}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-8 pt-32 md:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <h1 className="text-3xl md:text-4xl font-bold text-text-primary mb-4">
              {course.title}
            </h1>
            <p className="text-text-secondary text-lg mb-6 line-clamp-3">
              {course.description}
            </p>

            {/* Stats */}
            <div className="flex flex-wrap gap-6 mb-6">
              <div className="flex items-center gap-2 text-text-secondary">
                <BookOpen size={18} className="text-primary-400" />
                <span>{totalVideos} videos</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Clock size={18} className="text-primary-400" />
                <span>{formatDuration(course.totalDuration || 0)}</span>
              </div>
              <div className="flex items-center gap-2 text-text-secondary">
                <Users size={18} className="text-primary-400" />
                <span>{course.enrolledCount || 0} enrolled</span>
              </div>
              {isEnrolled && (
                <div className="flex items-center gap-2 text-accent-green">
                  <CheckCircle size={18} />
                  <span>Enrolled</span>
                </div>
              )}
            </div>

            {/* Instructor */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white font-semibold">
                {course.instructorName?.charAt(0) || 'I'}
              </div>
              <div>
                <p className="text-text-primary font-medium">{course.instructorName}</p>
                <p className="text-text-muted text-sm">Instructor</p>
              </div>
            </div>

            {/* CTA Button */}
            {!isEnrolled ? (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Play size={20} />}
                onClick={handleEnroll}
                isLoading={isEnrolling}
              >
                Enroll Now
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Play size={20} />}
                onClick={() => {
                  const firstVideo = course.videos?.[0];
                  if (firstVideo) handleWatchVideo(firstVideo);
                }}
              >
                Continue Learning
              </Button>
            )}
          </motion.div>
        </div>
      </div>

      {/* Progress Card (if enrolled) */}
      {isEnrolled && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface border border-surface-border rounded-2xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-primary-500/10">
                <BarChart3 size={20} className="text-primary-400" />
              </div>
              <div>
                <h3 className="font-semibold text-text-primary">Your Progress</h3>
                <p className="text-sm text-text-muted">
                  {completedVideos} of {totalVideos} videos completed
                </p>
              </div>
            </div>
            {course.progress === 100 && (
              <div className="flex items-center gap-2 text-accent-green">
                <Award size={20} />
                <span className="font-medium">Completed</span>
              </div>
            )}
          </div>
          <div className="h-3 bg-surface-light rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${course.progress || 0}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
            />
          </div>
          <p className="text-right text-sm text-primary-400 font-medium mt-2">
            {course.progress || 0}% complete
          </p>
        </motion.div>
      )}

      {/* Videos List */}
      <div>
        <h2 className="text-xl font-bold text-text-primary mb-4">Course Content</h2>
        <div className="space-y-3">
          <AnimatePresence>
            {course.videos?.map((video, index) => {
              const isCompleted = (video.watchProgress ?? 0) >= 90;
              const isLocked = !isEnrolled;

              return (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <button
                    onClick={() => !isLocked && handleWatchVideo(video)}
                    disabled={isLocked}
                    className={clsx(
                      'w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left',
                      isLocked
                        ? 'bg-surface/50 border-surface-border cursor-not-allowed opacity-60'
                        : 'bg-surface border-surface-border hover:border-primary-500/30 hover:bg-surface-light cursor-pointer'
                    )}
                  >
                    {/* Video Number / Status */}
                    <div
                      className={clsx(
                        'w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0',
                        isCompleted
                          ? 'bg-accent-green/10 text-accent-green'
                          : isLocked
                          ? 'bg-surface-light text-text-muted'
                          : 'bg-primary-500/10 text-primary-400'
                      )}
                    >
                      {isLocked ? (
                        <Lock size={18} />
                      ) : isCompleted ? (
                        <CheckCircle size={18} />
                      ) : (
                        <span className="font-semibold">{index + 1}</span>
                      )}
                    </div>

                    {/* Video Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-text-primary truncate">{video.title}</h3>
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-text-muted">
                          {formatDuration(video.duration || 0)}
                        </span>
                        {video.hasChapters && (
                          <span className="text-xs px-2 py-0.5 rounded bg-surface-light text-text-muted">
                            Chapters
                          </span>
                        )}
                        {video.hasQuizzes && (
                          <span className="text-xs px-2 py-0.5 rounded bg-accent-yellow/10 text-accent-yellow">
                            Quiz
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress / Arrow */}
                    <div className="flex items-center gap-3">
                      {!isLocked && video.watchProgress !== undefined && video.watchProgress > 0 && !isCompleted && (
                        <div className="w-20">
                          <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary-500 rounded-full"
                              style={{ width: `${video.watchProgress}%` }}
                            />
                          </div>
                        </div>
                      )}
                      <ChevronRight
                        size={18}
                        className={clsx(
                          'transition-transform',
                          isLocked ? 'text-text-muted' : 'text-text-secondary group-hover:translate-x-1'
                        )}
                      />
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CourseDetailPage;

