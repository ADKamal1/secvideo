import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
} from 'lucide-react';
import { SecureVideoPlayer } from '@/components/player/SecureVideoPlayer';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { PageLoader } from '@/components/common/Loader';
import { useAuthStore } from '@/store/authStore';
import { usePlayerStore } from '@/store/playerStore';
import type { VideoPlaybackData, Video } from '@/types';

// Mock data
const mockVideoData: VideoPlaybackData = {
  videoId: '1',
  streamUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
  encryptionKeyUrl: '/api/keys/1',
  chapters: [
    { id: '1', title: 'Introduction', startTime: 0 },
    { id: '2', title: 'Getting Started', startTime: 60 },
    { id: '3', title: 'Core Concepts', startTime: 180 },
    { id: '4', title: 'Advanced Topics', startTime: 360 },
    { id: '5', title: 'Best Practices', startTime: 480 },
    { id: '6', title: 'Conclusion', startTime: 540 },
  ],
  subtitles: [
    { id: '1', language: 'en', label: 'English', url: '/subtitles/en.vtt' },
  ],
  quizzes: [
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
  ],
  watermarkData: {
    userId: 'user-123',
    userEmail: 'student@example.com',
    sessionId: 'session-abc',
    timestamp: new Date().toISOString(),
  },
};

const mockPlaylist: Video[] = [
  {
    id: '1',
    courseId: '1',
    title: 'Introduction to React Hooks',
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=225&fit=crop',
    duration: 600,
    order: 1,
    isActive: true,
    hasChapters: true,
    hasSubtitles: true,
    hasQuiz: true,
    watchProgress: 75,
    createdAt: '2024-01-01',
    expiresAt: '2024-01-04',
  },
  {
    id: '2',
    courseId: '1',
    title: 'useState and useEffect Deep Dive',
    thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=225&fit=crop',
    duration: 1800,
    order: 2,
    isActive: true,
    hasChapters: true,
    hasSubtitles: true,
    hasQuiz: false,
    watchProgress: 0,
    createdAt: '2024-01-01',
    expiresAt: '2024-01-04',
  },
  {
    id: '3',
    courseId: '1',
    title: 'Custom Hooks Masterclass',
    thumbnail: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=225&fit=crop',
    duration: 2400,
    order: 3,
    isActive: true,
    hasChapters: false,
    hasSubtitles: true,
    hasQuiz: true,
    watchProgress: 0,
    createdAt: '2024-01-01',
    expiresAt: '2024-01-04',
  },
];

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const VideoPlayerPage: React.FC = () => {
  const { videoId } = useParams<{ videoId: string }>();
  const { user } = useAuthStore();
  const { setVideoData, clearVideo } = usePlayerStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [videoData, setVideoDataState] = useState<VideoPlaybackData | null>(null);
  const [showPlaylist, setShowPlaylist] = useState(true);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    // Simulate API call
    const loadVideo = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      
      // Update watermark with real user data
      const data: VideoPlaybackData = {
        ...mockVideoData,
        videoId: videoId || '1',
        watermarkData: {
          userId: user?.id || 'unknown',
          userEmail: user?.email || 'unknown@example.com',
          sessionId: `session-${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
      };
      
      setVideoDataState(data);
      setVideoData(data);
      setIsLoading(false);
    };

    loadVideo();

    return () => {
      clearVideo();
    };
  }, [videoId, user, setVideoData, clearVideo]);

  const handleProgress = (currentTime: number, duration: number) => {
    // Report progress to backend
    console.log('Progress:', { currentTime, duration, percent: (currentTime / duration) * 100 });
  };

  const handleVideoEnd = () => {
    // Auto-play next video
    if (currentVideoIndex < mockPlaylist.length - 1) {
      // Would navigate to next video
      console.log('Video ended, next video available');
    }
  };

  if (isLoading || !videoData) {
    return <PageLoader message="Loading video..." />;
  }

  const currentVideo = mockPlaylist[currentVideoIndex];
  const prevVideo = mockPlaylist[currentVideoIndex - 1];
  const nextVideo = mockPlaylist[currentVideoIndex + 1];

  return (
    <div className="flex flex-col lg:flex-row gap-6">
      {/* Main Content */}
      <div className="flex-1 min-w-0">
        {/* Back button */}
        <Link
          to="/courses/1"
          className="inline-flex items-center gap-2 text-text-secondary hover:text-text-primary mb-4 transition-colors"
        >
          <ChevronLeft size={20} />
          Back to Course
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
                {currentVideo.title}
              </h1>
              <div className="flex items-center gap-4 mt-2 text-sm text-text-muted">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  {formatDuration(currentVideo.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <BookOpen size={14} />
                  Part {currentVideo.order} of {mockPlaylist.length}
                </span>
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!prevVideo}
                leftIcon={<ChevronLeft size={16} />}
              >
                Previous
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!nextVideo}
                rightIcon={<ChevronRight size={16} />}
              >
                Next
              </Button>
            </div>
          </div>

          {/* Tabs - would expand to notes, Q&A, etc. */}
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
              <p>
                In this video, you'll learn the fundamentals of React Hooks and how they
                revolutionize the way we write React components. We'll cover useState,
                useEffect, and best practices for managing state in functional components.
              </p>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Playlist Sidebar */}
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
          <div className="p-4 border-b border-surface-border">
            <div className="flex items-center justify-between text-sm mb-2">
              <span className="text-text-muted">Course Progress</span>
              <span className="font-medium text-primary-500">33%</span>
            </div>
            <div className="h-2 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                style={{ width: '33%' }}
              />
            </div>
          </div>

          {/* Video list */}
          <div className="max-h-[500px] overflow-y-auto no-scrollbar">
            {mockPlaylist.map((video, index) => {
              const isActive = index === currentVideoIndex;
              const isCompleted = video.watchProgress === 100;
              const isWatching = (video.watchProgress || 0) > 0 && !isCompleted;

              return (
                <button
                  key={video.id}
                  onClick={() => setCurrentVideoIndex(index)}
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
                      src={video.thumbnail}
                      alt={video.title}
                      className="w-full aspect-video object-cover rounded-lg"
                    />
                    {/* Status icon */}
                    <div
                      className={clsx(
                        'absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center',
                        isCompleted
                          ? 'bg-accent-emerald'
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
                      {formatDuration(video.duration)}
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
                      {video.hasQuiz && (
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

      {/* Mobile playlist toggle */}
      {!showPlaylist && (
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

