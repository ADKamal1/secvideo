import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  BookOpen,
  Clock,
  CheckCircle,
  List,
  X,
  AlertTriangle,
} from 'lucide-react';
import { SecureVideoPlayer } from '@/components/player/SecureVideoPlayer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageLoader } from '@/components/common/Loader';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import { videosApi } from '@/services/api/videosApi';
import { coursesApi } from '@/services/api/coursesApi';
import type { VideoPlaybackData, Video, CourseWithVideos } from '@/types';

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setVideoData, clearVideo } = usePlayerStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videoData, setVideoDataState] = useState<VideoPlaybackData | null>(null);
  const [videoInfo, setVideoInfo] = useState<Video | null>(null);
  const [course, setCourse] = useState<CourseWithVideos | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const loadVideo = async () => {
      if (!videoId) return;

      setIsLoading(true);
      setError(null);

      try {
        // First get video info
        const video = await videosApi.getVideo(videoId);
        setVideoInfo(video);

        // Load course data for playlist
        if (video.courseId) {
          try {
            const courseData = await coursesApi.getCourseWithVideos(video.courseId);
            setCourse(courseData);
            // Find current video index in playlist
            const idx = courseData.videos?.findIndex((v) => v.id === videoId) ?? 0;
            setCurrentVideoIndex(idx >= 0 ? idx : 0);
          } catch (err) {
            console.error('Failed to load course data:', err);
          }
        }

        // Get playback data with watermark and security info
        try {
          const playback = await videosApi.getPlaybackData(videoId);
          setVideoDataState(playback);
          setVideoData(playback);
        } catch (playbackErr: any) {
          // Handle specific playback errors
          if (playbackErr?.response?.data?.code === 'DEVICE_MISMATCH') {
            setError('Device verification required. Please verify your device first.');
            navigate('/device-verify');
            return;
          } else if (playbackErr?.response?.data?.code === 'SESSION_EXPIRED') {
            setError('Your session has expired. Please log in again.');
            navigate('/login');
            return;
          }

          // Fallback: use demo video for testing purposes
          console.warn('Using demo video for testing');
          const demoPlayback: VideoPlaybackData = {
            videoId,
            streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
            encryptionKeyUrl: '/api/keys/' + videoId,
            chapters: video.hasChapters ? [
              { id: '1', title: 'Introduction', startTime: 0 },
              { id: '2', title: 'Getting Started', startTime: 60 },
              { id: '3', title: 'Core Concepts', startTime: 180 },
            ] : [],
            subtitles: [],
            quizzes: video.hasQuizzes ? [
              {
                id: '1',
                triggerTime: 120,
                question: 'What is the main benefit of using React hooks?',
                options: [
                  'They make code faster',
                  'They allow using state in functional components',
                  'They replace all class components',
                  'They are only for animations',
                ],
                correctIndex: 1,
                explanation: 'Hooks allow you to use state and other React features in functional components.',
              },
            ] : [],
            watermarkData: {
              userId: user?.id || 'demo-user',
              userEmail: user?.email || 'demo@example.com',
              sessionId: `session-${Date.now()}`,
              timestamp: new Date().toISOString(),
            },
          };
          setVideoDataState(demoPlayback);
          setVideoData(demoPlayback);
        }
      } catch (err: any) {
        console.error('Failed to load video:', err);
        setError(err?.response?.data?.message || 'Failed to load video. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    loadVideo();

    return () => {
      clearVideo();
    };
  }, [videoId, user, setVideoData, clearVideo, navigate]);

  const handleProgress = useCallback(async (currentTime: number, duration: number) => {
    if (!videoId || duration <= 0) return;
    
    // Debounce: only update progress every 10 seconds
    const completionPercentage = Math.round((currentTime / duration) * 100);
    
    try {
      await videosApi.updateWatchProgress(videoId, currentTime, duration);
    } catch (err) {
      console.error('Failed to update progress:', err);
    }
  }, [videoId]);

  const handleVideoEnd = useCallback(() => {
    // Auto-play next video
    const playlist = course?.videos || [];
    if (currentVideoIndex < playlist.length - 1) {
      const nextVideo = playlist[currentVideoIndex + 1];
      if (nextVideo) {
        navigate(`/watch/${nextVideo.id}`);
      }
    }
  }, [currentVideoIndex, course?.videos, navigate]);

  const navigateToVideo = (index: number) => {
    const playlist = course?.videos || [];
    const video = playlist[index];
    if (video) {
      navigate(`/watch/${video.id}`);
    }
  };

  if (isLoading) {
    return <PageLoader message="Loading video..." />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <div className="p-4 rounded-2xl bg-accent-red/10 mb-4">
          <AlertTriangle size={40} className="text-accent-red" />
        </div>
        <h3 className="text-lg font-semibold text-text-primary mb-2">Unable to Play Video</h3>
        <p className="text-text-secondary text-center max-w-md mb-6">{error}</p>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => navigate(-1)}>
            Go Back
          </Button>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  if (!videoData || !videoInfo) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h3 className="text-lg font-semibold text-text-primary mb-2">Video Not Found</h3>
        <Button variant="primary" onClick={() => navigate('/courses')}>
          Back to Courses
        </Button>
      </div>
    );
  }

  const playlist = course?.videos || [];
  const prevVideo = playlist[currentVideoIndex - 1];
  const nextVideo = playlist[currentVideoIndex + 1];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Back button */}
        <Link
          to={course ? `/courses/${course.id}` : '/courses'}
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to {course?.title || 'Courses'}
        </Link>

        {/* Video Player */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <SecureVideoPlayer
            videoData={videoData}
            onProgress={handleProgress}
            onEnded={handleVideoEnd}
          />
        </motion.div>

        {/* Video Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-text-primary">
                {videoInfo.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(videoInfo.duration || 0)}
                </span>
                {playlist.length > 0 && (
                  <span className="flex items-center gap-1">
                    <BookOpen size={14} />
                    Part {currentVideoIndex + 1} of {playlist.length}
                  </span>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            {playlist.length > 1 && (
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={!prevVideo}
                  leftIcon={<ChevronLeft size={16} />}
                  onClick={() => prevVideo && navigate(`/watch/${prevVideo.id}`)}
                >
                  Previous
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  disabled={!nextVideo}
                  rightIcon={<ChevronRight size={16} />}
                  onClick={() => nextVideo && navigate(`/watch/${nextVideo.id}`)}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          {/* Description */}
          <Card variant="default" className="mb-6">
            <div className="flex items-center gap-4 border-b border-surface-border pb-4 mb-4">
              <button className="text-sm font-medium text-primary-500 border-b-2 border-primary-500 pb-2">
                Overview
              </button>
              <button className="text-sm font-medium text-text-muted hover:text-text-secondary pb-2">
                <span className="flex items-center gap-1">
                  <MessageCircle size={14} />
                  Q&A
                </span>
              </button>
              <button className="text-sm font-medium text-text-muted hover:text-text-secondary pb-2">
                Notes
              </button>
            </div>

            <div className="text-text-secondary">
              <p>{videoInfo.description || 'No description available for this video.'}</p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Playlist Sidebar */}
      {playlist.length > 0 && (
        <motion.aside
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className={clsx(
            'lg:w-80 xl:w-96 flex-shrink-0',
            !showPlaylist && 'hidden lg:block'
          )}
        >
          <Card variant="default" padding="none" className="sticky top-20">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-surface-border">
              <div className="flex items-center gap-2">
                <List size={18} className="text-primary-500" />
                <h3 className="font-semibold text-text-primary">Course Content</h3>
              </div>
              <button
                onClick={() => setShowPlaylist(false)}
                className="lg:hidden p-1 rounded-lg hover:bg-surface-light"
              >
                <X size={18} className="text-text-muted" />
              </button>
            </div>

            {/* Progress */}
            {course?.progress !== undefined && (
              <div className="p-4 border-b border-surface-border">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-text-muted">Course Progress</span>
                  <span className="font-medium text-primary-500">{course.progress}%</span>
                </div>
                <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Video list */}
            <div className="max-h-[500px] overflow-y-auto no-scrollbar">
              {playlist.map((video, index) => {
                const isActive = video.id === videoId;
                const isCompleted = (video.watchProgress ?? 0) >= 90;
                const isWatching = (video.watchProgress ?? 0) > 0 && !isCompleted;

                return (
                  <button
                    key={video.id}
                    onClick={() => navigateToVideo(index)}
                    className={clsx(
                      'w-full flex gap-3 p-4 text-left transition-colors',
                      'hover:bg-surface-light',
                      isActive && 'bg-primary-500/10 border-l-2 border-primary-500',
                      !isActive && 'border-l-2 border-transparent'
                    )}
                  >
                    {/* Thumbnail */}
                    <div className="relative w-24 flex-shrink-0">
                      <img
                        src={video.thumbnail || 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=200&h=112&fit=crop'}
                        alt={video.title}
                        className="w-full aspect-video object-cover rounded-lg"
                      />
                      {/* Status icon */}
                      <div
                        className={clsx(
                          'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
                          isCompleted
                            ? 'bg-accent-green'
                            : isWatching
                            ? 'bg-primary-500'
                            : 'bg-black/50'
                        )}
                      >
                        {isCompleted ? (
                          <CheckCircle size={12} className="text-white" />
                        ) : (
                          <span className="text-2xs font-medium text-white">{index + 1}</span>
                        )}
                      </div>
                      {/* Duration */}
                      <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-2xs font-medium text-white">
                        {formatDuration(video.duration || 0)}
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4
                        className={clsx(
                          'text-sm font-medium line-clamp-2',
                          isActive ? 'text-primary-400' : 'text-text-primary'
                        )}
                      >
                        {video.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1">
                        {video.hasChapters && (
                          <span className="text-2xs text-text-muted">Chapters</span>
                        )}
                        {video.hasQuizzes && (
                          <span className="text-2xs text-accent-purple">Quiz</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {isWatching && (
                        <div className="mt-2 h-1 bg-surface-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-500 rounded-full"
                            style={{ width: `${video.watchProgress}%` }}
                          />
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>
        </motion.aside>
      )}

      {/* Mobile playlist toggle */}
      {playlist.length > 0 && !showPlaylist && (
        <button
          onClick={() => setShowPlaylist(true)}
          className="lg:hidden fixed bottom-6 right-6 p-4 bg-primary-500 text-white rounded-full shadow-lg shadow-primary-500/30"
        >
          <List size={24} />
        </button>
      )}
    </div>
  );
};
