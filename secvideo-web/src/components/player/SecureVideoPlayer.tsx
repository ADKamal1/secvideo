import React, { useEffect, useRef, useCallback, useState } from 'react';
import { clsx } from 'clsx';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  List,
  Subtitles,
  SkipBack,
  SkipForward,
  AlertTriangle,
} from 'lucide-react';
import { WatermarkOverlay } from './WatermarkOverlay';
import { ChaptersList } from './ChaptersList';
import { QuizOverlay } from './QuizOverlay';
import { usePlayerStore } from '@/store/playerStore';
import { antiRecordingService } from '@/services/security/antiRecording';
import { sessionManager } from '@/services/security/sessionManager';
import type { VideoPlaybackData, Chapter, Quiz } from '@/types';

interface SecureVideoPlayerProps {
  videoData: VideoPlaybackData;
  onProgress?: (currentTime: number, duration: number) => void;
  onEnded?: () => void;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const SecureVideoPlayer: React.FC<SecureVideoPlayerProps> = ({
  videoData,
  onProgress,
  onEnded,
  className,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  
  const [showControls, setShowControls] = useState(true);
  const [showChapters, setShowChapters] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  const {
    isPlaying,
    setIsPlaying,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    volume,
    setVolume,
    isMuted,
    setIsMuted,
    playbackRate,
    setPlaybackRate,
    isFullscreen,
    setIsFullscreen,
    activeQuiz,
    markQuizAnswered,
    isBlurred,
    setIsBlurred,
  } = usePlayerStore();

  // Initialize anti-recording protection
  useEffect(() => {
    antiRecordingService.start((event, details) => {
      console.warn('[SecurePlayer] Security event:', event, details);
      sessionManager.reportSecurityEvent(event, {
        videoId: videoData.videoId,
        ...details,
      });

      // Show warning for certain events
      if (['devtools_opened', 'screenshot_attempt', 'print_screen_attempt'].includes(event)) {
        setSecurityWarning('Security alert detected. This has been logged.');
        setIsBlurred(true);
        
        setTimeout(() => {
          setSecurityWarning(null);
          setIsBlurred(false);
        }, 3000);
      }
    });

    return () => {
      antiRecordingService.stop();
    };
  }, [videoData.videoId, setIsBlurred]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime);
      onProgress?.(video.currentTime, video.duration);
    };

    const handleDurationChange = () => {
      setDuration(video.duration);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('durationchange', handleDurationChange);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('canplay', handleCanPlay);

    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('durationchange', handleDurationChange);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, [setCurrentTime, setDuration, setIsPlaying, onProgress, onEnded]);

  // Sync video playback state
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying && video.paused) {
      video.play().catch(console.error);
    } else if (!isPlaying && !video.paused) {
      video.pause();
    }
  }, [isPlaying]);

  // Sync volume
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = volume;
    video.muted = isMuted;
  }, [volume, isMuted]);

  // Sync playback rate
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = playbackRate;
  }, [playbackRate]);

  // Controls visibility
  const handleMouseMove = useCallback(() => {
    setShowControls(true);
    
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowControls(false);
      }, 3000);
    }
  }, [isPlaying]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (activeQuiz) return; // Disable during quiz

      switch (e.key) {
        case ' ':
        case 'k':
          e.preventDefault();
          setIsPlaying(!isPlaying);
          break;
        case 'ArrowLeft':
          e.preventDefault();
          seekTo(currentTime - 10);
          break;
        case 'ArrowRight':
          e.preventDefault();
          seekTo(currentTime + 10);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, volume + 0.1));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, volume - 0.1));
          break;
        case 'm':
          setIsMuted(!isMuted);
          break;
        case 'f':
          toggleFullscreen();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isPlaying, currentTime, volume, isMuted, activeQuiz, setIsPlaying, setVolume, setIsMuted]);

  const seekTo = (time: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(time, duration));
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    try {
      if (!document.fullscreenElement) {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    seekTo(percent * duration);
  };

  const handleChapterClick = (chapter: Chapter) => {
    seekTo(chapter.startTime);
    setShowChapters(false);
  };

  const handleQuizAnswer = (isCorrect: boolean) => {
    if (activeQuiz) {
      markQuizAnswered(activeQuiz.id);
      // Resume playback
      setIsPlaying(true);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      id="secure-video-container"
      className={clsx(
        'relative aspect-video bg-black rounded-2xl overflow-hidden',
        'select-none',
        isBlurred && 'video-blurred',
        className
      )}
      style={{
        userSelect: 'none',
        WebkitUserSelect: 'none',
      }}
      onContextMenu={(e) => e.preventDefault()}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={videoData.streamUrl}
        className="w-full h-full object-contain"
        playsInline
        disablePictureInPicture
        controlsList="nodownload nofullscreen noremoteplayback"
        onDoubleClick={toggleFullscreen}
        style={{
          filter: isBlurred ? 'blur(30px)' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />

      {/* Watermark Overlay */}
      <WatermarkOverlay
        userId={videoData.watermarkData.userId}
        userEmail={videoData.watermarkData.userEmail}
        sessionId={videoData.watermarkData.sessionId}
      />

      {/* Buffering Indicator */}
      <AnimatePresence>
        {isBuffering && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center bg-black/30"
          >
            <div className="w-12 h-12 border-4 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Security Warning */}
      <AnimatePresence>
        {securityWarning && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-accent-red/90 backdrop-blur-sm"
          >
            <AlertTriangle size={18} className="text-white" />
            <span className="text-sm font-medium text-white">{securityWarning}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Play/Pause Center Button (on click) */}
      {!isPlaying && !activeQuiz && (
        <button
          onClick={() => setIsPlaying(true)}
          className="absolute inset-0 flex items-center justify-center z-10"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-20 h-20 rounded-full bg-primary-500/90 flex items-center justify-center hover:bg-primary-500 transition-colors"
          >
            <Play size={36} fill="white" className="text-white ml-1" />
          </motion.div>
        </button>
      )}

      {/* Controls Overlay */}
      <AnimatePresence>
        {showControls && !activeQuiz && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 z-20"
          >
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
              <h2 className="text-white font-medium text-lg truncate">
                {/* Video title would go here */}
              </h2>
            </div>

            {/* Bottom controls */}
            <div className="absolute bottom-0 left-0 right-0 p-4 space-y-3">
              {/* Progress bar */}
              <div
                className="relative h-1.5 bg-white/20 rounded-full cursor-pointer group"
                onClick={handleProgressClick}
              >
                {/* Buffered */}
                <div
                  className="absolute h-full bg-white/30 rounded-full"
                  style={{ width: '60%' }} // Would be actual buffered amount
                />
                {/* Progress */}
                <div
                  className="absolute h-full bg-primary-500 rounded-full"
                  style={{ width: `${progress}%` }}
                />
                {/* Scrubber */}
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-primary-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ left: `calc(${progress}% - 8px)` }}
                />
              </div>

              {/* Control buttons */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {/* Play/Pause */}
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isPlaying ? (
                      <Pause size={24} className="text-white" />
                    ) : (
                      <Play size={24} className="text-white" />
                    )}
                  </button>

                  {/* Skip back */}
                  <button
                    onClick={() => seekTo(currentTime - 10)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <SkipBack size={20} className="text-white" />
                  </button>

                  {/* Skip forward */}
                  <button
                    onClick={() => seekTo(currentTime + 10)}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <SkipForward size={20} className="text-white" />
                  </button>

                  {/* Volume */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX size={20} className="text-white" />
                      ) : (
                        <Volume2 size={20} className="text-white" />
                      )}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(parseFloat(e.target.value));
                        setIsMuted(false);
                      }}
                      className="w-20 accent-primary-500"
                    />
                  </div>

                  {/* Time */}
                  <span className="text-white text-sm font-mono ml-2">
                    {formatTime(currentTime)} / {formatTime(duration)}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Chapters */}
                  {videoData.chapters.length > 0 && (
                    <button
                      onClick={() => setShowChapters(!showChapters)}
                      className={clsx(
                        'p-2 rounded-lg transition-colors',
                        showChapters ? 'bg-white/20' : 'hover:bg-white/10'
                      )}
                    >
                      <List size={20} className="text-white" />
                    </button>
                  )}

                  {/* Subtitles */}
                  {videoData.subtitles.length > 0 && (
                    <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                      <Subtitles size={20} className="text-white" />
                    </button>
                  )}

                  {/* Settings */}
                  <div className="relative">
                    <button
                      onClick={() => setShowSettings(!showSettings)}
                      className={clsx(
                        'p-2 rounded-lg transition-colors',
                        showSettings ? 'bg-white/20' : 'hover:bg-white/10'
                      )}
                    >
                      <Settings size={20} className="text-white" />
                    </button>

                    {/* Settings dropdown */}
                    <AnimatePresence>
                      {showSettings && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          className="absolute bottom-full right-0 mb-2 w-48 p-2 bg-surface rounded-xl shadow-xl border border-surface-border"
                        >
                          <p className="text-xs text-text-muted px-2 mb-2">Playback Speed</p>
                          {[0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                            <button
                              key={rate}
                              onClick={() => {
                                setPlaybackRate(rate);
                                setShowSettings(false);
                              }}
                              className={clsx(
                                'w-full text-left px-3 py-1.5 rounded-lg text-sm',
                                playbackRate === rate
                                  ? 'bg-primary-500/20 text-primary-500'
                                  : 'text-text-secondary hover:bg-surface-light'
                              )}
                            >
                              {rate === 1 ? 'Normal' : `${rate}x`}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 rounded-lg hover:bg-white/10 transition-colors"
                  >
                    {isFullscreen ? (
                      <Minimize size={20} className="text-white" />
                    ) : (
                      <Maximize size={20} className="text-white" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chapters Panel */}
      <AnimatePresence>
        {showChapters && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="absolute top-4 right-4 bottom-20 w-72 p-4 bg-surface/95 backdrop-blur-xl rounded-xl border border-surface-border z-30 overflow-hidden"
          >
            <ChaptersList
              chapters={videoData.chapters}
              currentTime={currentTime}
              onChapterClick={handleChapterClick}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Overlay */}
      <AnimatePresence>
        {activeQuiz && (
          <QuizOverlay
            quiz={activeQuiz}
            onAnswer={handleQuizAnswer}
          />
        )}
      </AnimatePresence>

      {/* Anti-recording protective overlay (invisible but blocks certain interactions) */}
      <div className="absolute inset-0 z-10 pointer-events-none" />
    </div>
  );
};

