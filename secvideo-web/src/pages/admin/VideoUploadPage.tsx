import React, { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import {
  Upload,
  Video,
  X,
  Plus,
  Clock,
  FileVideo,
  Check,
  AlertCircle,
  BookOpen,
  ChevronDown,
} from 'lucide-react';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input, Textarea } from '@/components/common/Input';
import { videosApi } from '@/services/api/videosApi';
import { coursesApi } from '@/services/api/coursesApi';
import type { Course } from '@/types';

interface UploadingVideo {
  id: string;
  file: File;
  title: string;
  description: string;
  progress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export const VideoUploadPage: React.FC = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [uploadQueue, setUploadQueue] = useState<UploadingVideo[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isLoadingCourses, setIsLoadingCourses] = useState(false);
  const [showCourseDropdown, setShowCourseDropdown] = useState(false);

  // Load courses on mount
  React.useEffect(() => {
    const loadCourses = async () => {
      setIsLoadingCourses(true);
      try {
        const response = await coursesApi.getCourses();
        setCourses(response.items || []);
      } catch (err) {
        console.error('Failed to load courses:', err);
        // Use mock courses for demo
        setCourses([
          { id: '1', title: 'Advanced React Patterns', description: '', instructorId: '1', videosCount: 5, isActive: true, createdAt: '' },
          { id: '2', title: 'Node.js Backend Development', description: '', instructorId: '1', videosCount: 8, isActive: true, createdAt: '' },
          { id: '3', title: 'TypeScript Masterclass', description: '', instructorId: '1', videosCount: 12, isActive: true, createdAt: '' },
        ]);
      } finally {
        setIsLoadingCourses(false);
      }
    };

    loadCourses();
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files).filter((file) =>
      file.type.startsWith('video/')
    );

    addFilesToQueue(files);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    addFilesToQueue(files);
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const addFilesToQueue = (files: File[]) => {
    const newVideos: UploadingVideo[] = files.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extension
      description: '',
      progress: 0,
      status: 'pending',
    }));

    setUploadQueue((prev) => [...prev, ...newVideos]);
  };

  const updateVideoInQueue = (id: string, updates: Partial<UploadingVideo>) => {
    setUploadQueue((prev) =>
      prev.map((video) => (video.id === id ? { ...video, ...updates } : video))
    );
  };

  const removeFromQueue = (id: string) => {
    setUploadQueue((prev) => prev.filter((video) => video.id !== id));
  };

  const uploadVideo = async (queueItem: UploadingVideo) => {
    if (!selectedCourseId) {
      updateVideoInQueue(queueItem.id, { status: 'error', error: 'Please select a course' });
      return;
    }

    updateVideoInQueue(queueItem.id, { status: 'uploading' });

    try {
      // First create video entry
      const videoEntry = await videosApi.createVideo({
        courseId: selectedCourseId,
        title: queueItem.title,
        description: queueItem.description,
      });

      // Then upload the actual file
      await videosApi.uploadVideo(videoEntry.id, queueItem.file, (progress) => {
        updateVideoInQueue(queueItem.id, { progress });
      });

      updateVideoInQueue(queueItem.id, { status: 'processing' });

      // Simulate processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      updateVideoInQueue(queueItem.id, { status: 'completed', progress: 100 });
    } catch (err: any) {
      console.error('Upload failed:', err);
      updateVideoInQueue(queueItem.id, {
        status: 'error',
        error: err?.response?.data?.message || 'Upload failed. Please try again.',
      });
    }
  };

  const startUploadAll = async () => {
    const pendingVideos = uploadQueue.filter((v) => v.status === 'pending');
    for (const video of pendingVideos) {
      await uploadVideo(video);
    }
  };

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const statusIcons = {
    pending: <Clock size={16} className="text-text-muted" />,
    uploading: <Upload size={16} className="text-primary-500 animate-pulse" />,
    processing: <Video size={16} className="text-accent-yellow animate-spin" />,
    completed: <Check size={16} className="text-accent-green" />,
    error: <AlertCircle size={16} className="text-accent-red" />,
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold text-text-primary">Upload Videos</h1>
        <p className="text-text-secondary mt-1">
          Upload video files to add to your courses. Videos will be processed and secured automatically.
        </p>
      </div>

      {/* Course Selection */}
      <Card variant="default">
        <h3 className="text-lg font-semibold text-text-primary mb-4">Select Course</h3>
        <div className="relative">
          <button
            onClick={() => setShowCourseDropdown(!showCourseDropdown)}
            className={clsx(
              'w-full flex items-center justify-between p-4 rounded-xl border transition-colors',
              'bg-surface-light border-surface-border hover:border-primary-500/30',
              showCourseDropdown && 'border-primary-500 ring-2 ring-primary-500/20'
            )}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-500/10">
                <BookOpen size={20} className="text-primary-400" />
              </div>
              <div className="text-left">
                {selectedCourse ? (
                  <>
                    <p className="font-medium text-text-primary">{selectedCourse.title}</p>
                    <p className="text-sm text-text-muted">{selectedCourse.videosCount} videos</p>
                  </>
                ) : (
                  <p className="text-text-muted">Select a course to upload videos to</p>
                )}
              </div>
            </div>
            <ChevronDown
              size={20}
              className={clsx(
                'text-text-muted transition-transform',
                showCourseDropdown && 'rotate-180'
              )}
            />
          </button>

          <AnimatePresence>
            {showCourseDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute z-10 w-full mt-2 py-2 bg-surface border border-surface-border rounded-xl shadow-xl"
              >
                {isLoadingCourses ? (
                  <div className="p-4 text-center text-text-muted">Loading courses...</div>
                ) : courses.length === 0 ? (
                  <div className="p-4 text-center text-text-muted">No courses available</div>
                ) : (
                  courses.map((course) => (
                    <button
                      key={course.id}
                      onClick={() => {
                        setSelectedCourseId(course.id);
                        setShowCourseDropdown(false);
                      }}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-surface-light transition-colors',
                        selectedCourseId === course.id && 'bg-primary-500/10'
                      )}
                    >
                      <BookOpen size={18} className="text-primary-400" />
                      <div>
                        <p className="font-medium text-text-primary">{course.title}</p>
                        <p className="text-sm text-text-muted">{course.videosCount} videos</p>
                      </div>
                      {selectedCourseId === course.id && (
                        <Check size={18} className="ml-auto text-primary-500" />
                      )}
                    </button>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>

      {/* Drop Zone */}
      <Card variant="default" padding="none">
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={clsx(
            'p-12 border-2 border-dashed rounded-xl transition-all cursor-pointer',
            isDragging
              ? 'border-primary-500 bg-primary-500/5'
              : 'border-surface-border hover:border-primary-500/50'
          )}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex flex-col items-center text-center">
            <div
              className={clsx(
                'p-4 rounded-2xl mb-4 transition-colors',
                isDragging ? 'bg-primary-500/20' : 'bg-surface-light'
              )}
            >
              <Upload
                size={32}
                className={clsx('transition-colors', isDragging ? 'text-primary-400' : 'text-text-muted')}
              />
            </div>
            <h3 className="text-lg font-semibold text-text-primary mb-2">
              {isDragging ? 'Drop files here' : 'Drag and drop video files'}
            </h3>
            <p className="text-text-secondary mb-4">
              or click to browse from your computer
            </p>
            <p className="text-xs text-text-muted">
              Supported formats: MP4, WebM, MOV, AVI • Max file size: 5GB
            </p>
          </div>
        </div>
      </Card>

      {/* Upload Queue */}
      {uploadQueue.length > 0 && (
        <Card variant="default" padding="none">
          <div className="flex items-center justify-between p-4 border-b border-surface-border">
            <div className="flex items-center gap-2">
              <FileVideo size={18} className="text-primary-400" />
              <h3 className="font-semibold text-text-primary">Upload Queue</h3>
              <span className="text-sm text-text-muted">({uploadQueue.length} videos)</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUploadQueue([])}
              >
                Clear All
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={startUploadAll}
                disabled={uploadQueue.every((v) => v.status !== 'pending') || !selectedCourseId}
              >
                Upload All
              </Button>
            </div>
          </div>

          <div className="divide-y divide-surface-border">
            {uploadQueue.map((video) => (
              <motion.div
                key={video.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4"
              >
                <div className="flex items-start gap-4">
                  {/* Video Preview/Icon */}
                  <div className="w-32 h-20 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                    <Video size={32} className="text-text-muted" />
                  </div>

                  {/* Video Details */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <Input
                      value={video.title}
                      onChange={(e) => updateVideoInQueue(video.id, { title: e.target.value })}
                      placeholder="Video title"
                      disabled={video.status !== 'pending'}
                      className="font-medium"
                    />
                    <Input
                      value={video.description}
                      onChange={(e) => updateVideoInQueue(video.id, { description: e.target.value })}
                      placeholder="Video description (optional)"
                      disabled={video.status !== 'pending'}
                    />
                    <div className="flex items-center gap-4 text-sm text-text-muted">
                      <span>{formatFileSize(video.file.size)}</span>
                      <span>{video.file.type}</span>
                    </div>

                    {/* Progress Bar */}
                    {(video.status === 'uploading' || video.status === 'processing') && (
                      <div className="space-y-1">
                        <div className="h-2 bg-surface-light rounded-full overflow-hidden">
                          <motion.div
                            className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${video.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-text-muted">
                          {video.status === 'uploading'
                            ? `Uploading... ${video.progress}%`
                            : 'Processing video...'}
                        </p>
                      </div>
                    )}

                    {/* Error Message */}
                    {video.status === 'error' && video.error && (
                      <p className="text-sm text-accent-red">{video.error}</p>
                    )}
                  </div>

                  {/* Status & Actions */}
                  <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg bg-surface-light">
                      {statusIcons[video.status]}
                    </div>
                    {video.status === 'pending' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromQueue(video.id)}
                      >
                        <X size={16} />
                      </Button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {/* Note */}
      <div className="p-4 bg-surface-light rounded-xl border border-surface-border">
        <div className="flex items-start gap-3">
          <AlertCircle size={20} className="text-primary-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-text-secondary">
            <p className="font-medium text-text-primary mb-1">Video Processing</p>
            <p>
              Uploaded videos will be automatically processed for secure streaming. This includes
              encryption, quality variants generation, and thumbnail extraction. Videos will be
              available in the course after processing is complete (usually 5-15 minutes).
            </p>
            <p className="mt-2 text-accent-yellow">
              Note: Videos are retained for 3 days according to the platform policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoUploadPage;

