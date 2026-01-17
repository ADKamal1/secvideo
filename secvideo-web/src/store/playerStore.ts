import { create } from 'zustand';
import type { VideoPlaybackData, Chapter, Quiz } from '@/types';

interface PlayerState {
  // Current video data
  currentVideo: VideoPlaybackData | null;
  isLoading: boolean;
  error: string | null;

  // Playback state
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isFullscreen: boolean;

  // UI state
  showControls: boolean;
  showChapters: boolean;
  showSubtitles: boolean;
  selectedSubtitleId: string | null;

  // Quiz state
  activeQuiz: Quiz | null;
  answeredQuizIds: Set<string>;

  // Security state
  isBlurred: boolean;
  securityWarning: string | null;
}

interface PlayerActions {
  // Video loading
  setVideoData: (data: VideoPlaybackData) => void;
  clearVideo: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Playback controls
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  setVolume: (volume: number) => void;
  setIsMuted: (muted: boolean) => void;
  setPlaybackRate: (rate: number) => void;
  setIsFullscreen: (fullscreen: boolean) => void;
  seekTo: (time: number) => void;

  // UI controls
  setShowControls: (show: boolean) => void;
  setShowChapters: (show: boolean) => void;
  setShowSubtitles: (show: boolean) => void;
  setSelectedSubtitle: (subtitleId: string | null) => void;

  // Quiz
  triggerQuiz: (quiz: Quiz) => void;
  dismissQuiz: () => void;
  markQuizAnswered: (quizId: string) => void;

  // Security
  setIsBlurred: (blurred: boolean) => void;
  setSecurityWarning: (warning: string | null) => void;

  // Chapter navigation
  jumpToChapter: (chapter: Chapter) => void;
  getCurrentChapter: () => Chapter | null;
}

type PlayerStore = PlayerState & PlayerActions;

const initialState: PlayerState = {
  currentVideo: null,
  isLoading: false,
  error: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  playbackRate: 1,
  isFullscreen: false,
  showControls: true,
  showChapters: false,
  showSubtitles: false,
  selectedSubtitleId: null,
  activeQuiz: null,
  answeredQuizIds: new Set(),
  isBlurred: false,
  securityWarning: null,
};

export const usePlayerStore = create<PlayerStore>((set, get) => ({
  ...initialState,

  // Video loading
  setVideoData: (data: VideoPlaybackData) => {
    set({
      currentVideo: data,
      isLoading: false,
      error: null,
      answeredQuizIds: new Set(),
      currentTime: 0,
      isPlaying: false,
    });
  },

  clearVideo: () => {
    set(initialState);
  },

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  setError: (error: string | null) => set({ error, isLoading: false }),

  // Playback controls
  setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

  setCurrentTime: (time: number) => {
    const { currentVideo, answeredQuizIds, activeQuiz } = get();
    set({ currentTime: time });

    // Check for quiz triggers
    if (currentVideo?.quizzes && !activeQuiz) {
      const triggerQuiz = currentVideo.quizzes.find(
        (q) => 
          Math.floor(time) === q.triggerTime && 
          !answeredQuizIds.has(q.id)
      );
      if (triggerQuiz) {
        set({ activeQuiz: triggerQuiz, isPlaying: false });
      }
    }
  },

  setDuration: (duration: number) => set({ duration }),

  setVolume: (volume: number) => set({ volume: Math.max(0, Math.min(1, volume)) }),

  setIsMuted: (muted: boolean) => set({ isMuted: muted }),

  setPlaybackRate: (rate: number) => set({ playbackRate: rate }),

  setIsFullscreen: (fullscreen: boolean) => set({ isFullscreen: fullscreen }),

  seekTo: (time: number) => {
    const { duration } = get();
    const clampedTime = Math.max(0, Math.min(time, duration));
    set({ currentTime: clampedTime });
  },

  // UI controls
  setShowControls: (show: boolean) => set({ showControls: show }),

  setShowChapters: (show: boolean) => set({ showChapters: show, showSubtitles: false }),

  setShowSubtitles: (show: boolean) => set({ showSubtitles: show, showChapters: false }),

  setSelectedSubtitle: (subtitleId: string | null) => set({ selectedSubtitleId: subtitleId }),

  // Quiz
  triggerQuiz: (quiz: Quiz) => {
    set({ activeQuiz: quiz, isPlaying: false });
  },

  dismissQuiz: () => {
    set({ activeQuiz: null });
  },

  markQuizAnswered: (quizId: string) => {
    const { answeredQuizIds } = get();
    const newSet = new Set(answeredQuizIds);
    newSet.add(quizId);
    set({ answeredQuizIds: newSet, activeQuiz: null });
  },

  // Security
  setIsBlurred: (blurred: boolean) => set({ isBlurred: blurred }),

  setSecurityWarning: (warning: string | null) => set({ securityWarning: warning }),

  // Chapter navigation
  jumpToChapter: (chapter: Chapter) => {
    set({ currentTime: chapter.startTime });
  },

  getCurrentChapter: (): Chapter | null => {
    const { currentVideo, currentTime } = get();
    if (!currentVideo?.chapters?.length) return null;

    // Find the chapter that contains the current time
    const sortedChapters = [...currentVideo.chapters].sort((a, b) => a.startTime - b.startTime);
    
    for (let i = sortedChapters.length - 1; i >= 0; i--) {
      if (currentTime >= sortedChapters[i].startTime) {
        return sortedChapters[i];
      }
    }
    
    return sortedChapters[0] || null;
  },
}));

// Selectors
export const selectCurrentVideo = (state: PlayerStore) => state.currentVideo;
export const selectIsPlaying = (state: PlayerStore) => state.isPlaying;
export const selectProgress = (state: PlayerStore) => 
  state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0;
export const selectActiveQuiz = (state: PlayerStore) => state.activeQuiz;

