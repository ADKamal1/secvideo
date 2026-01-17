import { api } from './apiClient';
import type { Course, CourseWithVideos, PaginatedResponse } from '@/types';

export interface CourseFilters {
  search?: string;
  instructorId?: string;
  isActive?: boolean;
  page?: number;
  pageSize?: number;
}

export interface CreateCourseRequest {
  title: string;
  description: string;
  thumbnail?: string;
}

export interface UpdateCourseRequest {
  title?: string;
  description?: string;
  thumbnail?: string;
  isActive?: boolean;
}

export const coursesApi = {
  /**
   * Get all courses with optional filters
   */
  async getCourses(filters?: CourseFilters): Promise<PaginatedResponse<Course>> {
    const params = new URLSearchParams();
    
    if (filters?.search) params.append('search', filters.search);
    if (filters?.instructorId) params.append('instructorId', filters.instructorId);
    if (filters?.isActive !== undefined) params.append('isActive', String(filters.isActive));
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.pageSize) params.append('pageSize', String(filters.pageSize));

    return api.get<PaginatedResponse<Course>>(`/courses?${params.toString()}`);
  },

  /**
   * Get enrolled courses for current user (students)
   */
  async getEnrolledCourses(): Promise<Course[]> {
    return api.get<Course[]>('/courses/enrolled');
  },

  /**
   * Get courses created by current user (instructors)
   */
  async getMyCourses(): Promise<Course[]> {
    return api.get<Course[]>('/courses/my-courses');
  },

  /**
   * Get a single course by ID
   */
  async getCourse(courseId: string): Promise<Course> {
    return api.get<Course>(`/courses/${courseId}`);
  },

  /**
   * Get a course with all its videos
   */
  async getCourseWithVideos(courseId: string): Promise<CourseWithVideos> {
    return api.get<CourseWithVideos>(`/courses/${courseId}/full`);
  },

  /**
   * Create a new course (instructor/admin)
   */
  async createCourse(data: CreateCourseRequest): Promise<Course> {
    return api.post<Course>('/courses', data);
  },

  /**
   * Update a course
   */
  async updateCourse(courseId: string, data: UpdateCourseRequest): Promise<Course> {
    return api.patch<Course>(`/courses/${courseId}`, data);
  },

  /**
   * Delete a course
   */
  async deleteCourse(courseId: string): Promise<void> {
    return api.delete(`/courses/${courseId}`);
  },

  /**
   * Upload course thumbnail
   */
  async uploadThumbnail(courseId: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('thumbnail', file);

    return api.post<{ url: string }>(`/courses/${courseId}/thumbnail`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  /**
   * Enroll a student in a course
   */
  async enrollStudent(courseId: string, studentId?: string): Promise<void> {
    return api.post(`/courses/${courseId}/enroll`, { studentId });
  },

  /**
   * Unenroll a student from a course
   */
  async unenrollStudent(courseId: string, studentId?: string): Promise<void> {
    return api.post(`/courses/${courseId}/unenroll`, { studentId });
  },

  /**
   * Get enrolled students for a course
   */
  async getEnrolledStudents(courseId: string): Promise<Array<{
    id: string;
    name: string;
    email: string;
    progress: number;
    enrolledAt: string;
  }>> {
    return api.get(`/courses/${courseId}/students`);
  },

  /**
   * Get course statistics
   */
  async getCourseStats(courseId: string): Promise<{
    totalViews: number;
    avgCompletionRate: number;
    enrolledCount: number;
    avgWatchTime: number;
  }> {
    return api.get(`/courses/${courseId}/stats`);
  },
};

