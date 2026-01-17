import { api, apiClient } from './apiClient';
import type { Video, VideoPlaybackData, Chapter, Subtitle, Quiz, PaginatedResponse } from '@/types';

export interface VideoFilters {
  courseId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface CreateVideoRequest {
  courseId: string;
  title: string;
  description?: string;
}

export interface UpdateVideoRequest {
  title?: string;
  description?: string;
  order?: number;
  isActive?: boolean;
}

export const videosApi = {
  /**
   * Get videos with optional filters
   */
  async getVideos(filters?: VideoFilters): Promise<PaginatedResponse<Video>> {
    const params = new URLSearchParams();
    
    if (filters?.courseId) params.append('courseId', filters.courseId);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    return api.get<PaginatedResponse<Video>>(`/videos?${params.toString()}`);
  },

  /**
   * Get a single video by ID
   */
  async getVideo(videoId: string): Promise<Video> {
    return api.get<Video>(`/videos/${videoId}`);
  },

  /**
   * Get video playback data (stream URL, encryption keys, etc.)
   * This requires session validation and device verification
   */
  async getPlaybackData(videoId: string): Promise<VideoPlaybackData> {
    return api.get<VideoPlaybackData>(`/videos/${videoId}/playback`);
  },

  /**
   * Create a new video entry
   */
  async createVideo(data: CreateVideoRequest): Promise<Video> {
    return api.post<Video>('/videos', data);
  },

  /**
   * Upload video file
   * Returns upload progress via callback
   */
  async uploadVideo(
    videoId: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<Video> {
    const formData = new FormData();
    formData.append('video', file);

    const response = await apiClient.post<Video>(`/videos/${videoId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total && onProgress) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(progress);
        }
      },
    });

    return response.data;
  },

  /**
   * Update video details
   */
  async updateVideo(videoId: string, data: UpdateVideoRequest): Promise<Video> {
    return api.patch<Video>(`/videos/${videoId}`, data);
  },

  /**
   * Delete a video
   */
  async deleteVideo(videoId: string): Promise<void> {
    return api.delete(`/videos/${videoId}`);
  },

  /**
   * Upload video thumbnail
   */
  async uploadThumbnail(videoId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    return api.post<{ url: string }>(`/videos/${videoId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  // ==================== Chapters ====================

  /**
   * Get chapters for a video
   */
  async getChapters(videoId: string): Promise<Chapter[]> {
    return api.get<Chapter[]>(`/videos/${videoId}/chapters`);
  },

  /**
   * Add a chapter to a video
   */
  async addChapter(videoId: string, data: Omit<Chapter, 'id'>): Promise<Chapter> {
    return api.post<Chapter>(`/videos/${videoId}/chapters`, data);
  },

  /**
   * Update a chapter
   */
  async updateChapter(videoId: string, chapterId: string, data: Partial<Chapter>): Promise<Chapter> {
    return api.patch<Chapter>(`/videos/${videoId}/chapters/${chapterId}`, data);
  },

  /**
   * Delete a chapter
   */
  async deleteChapter(videoId: string, chapterId: string): Promise<void> {
    return api.delete(`/videos/${videoId}/chapters/${chapterId}`);
  },

  /**
   * Bulk update chapters (reorder)
   */
  async updateChapters(videoId: string, chapters: Chapter[]): Promise<Chapter[]> {
    return api.put<Chapter[]>(`/videos/${videoId}/chapters`, { chapters });
  },

  // ==================== Subtitles ====================

  /**
   * Get subtitles for a video
   */
  async getSubtitles(videoId: string): Promise<Subtitle[]> {
    return api.get<Subtitle[]>(`/videos/${videoId}/subtitles`);
  },

  /**
   * Upload subtitle file
   */
  async uploadSubtitle(
    videoId: string,
    file: File,
    language: string,
    label: string
  ): Promise<Subtitle> {
    const formData = new FormData();
    formData.append('subtitle', file);
    formData.append('language', language);
    formData.append('label', label);

    return api.post<Subtitle>(`/videos/${videoId}/subtitles`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Delete a subtitle
   */
  async deleteSubtitle(videoId: string, subtitleId: string): Promise<void> {
    return api.delete(`/videos/${videoId}/subtitles/${subtitleId}`);
  },

  // ==================== Quizzes ====================

  /**
   * Get quizzes for a video
   */
  async getQuizzes(videoId: string): Promise<Quiz[]> {
    return api.get<Quiz[]>(`/videos/${videoId}/quizzes`);
  },

  /**
   * Add a quiz to a video
   */
  async addQuiz(videoId: string, data: Omit<Quiz, 'id'>): Promise<Quiz> {
    return api.post<Quiz>(`/videos/${videoId}/quizzes`, data);
  },

  /**
   * Update a quiz
   */
  async updateQuiz(videoId: string, quizId: string, data: Partial<Quiz>): Promise<Quiz> {
    return api.patch<Quiz>(`/videos/${videoId}/quizzes/${quizId}`, data);
  },

  /**
   * Delete a quiz
   */
  async deleteQuiz(videoId: string, quizId: string): Promise<void> {
    return api.delete(`/videos/${videoId}/quizzes/${quizId}`);
  },

  // ==================== Watch Progress ====================

  /**
   * Update watch progress
   */
  async updateWatchProgress(videoId: string, position: number, duration: number): Promise<void> {
    return api.post(`/videos/${videoId}/progress`, {
      position,
      duration,
      completionPercentage: Math.round((position / duration) * 100),
    });
  },

  /**
   * Get watch progress for a video
   */
  async getWatchProgress(videoId: string): Promise<{
    position: number;
    completionPercentage: number;
    lastWatchedAt: string;
  }> {
    return api.get(`/videos/${videoId}/progress`);
  },

  /**
   * Submit quiz answer
   */
  async submitQuizAnswer(
    videoId: string,
    quizId: string,
    answerIndex: number
  ): Promise<{ correct: boolean; explanation?: string }> {
    return api.post(`/videos/${videoId}/quizzes/${quizId}/answer`, {
      answerIndex,
    });
  },
};

