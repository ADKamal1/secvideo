import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';
import { Clock, ChevronRight } from 'lucide-react';
import type { Chapter } from '@/types';

interface ChaptersListProps {
  chapters: Chapter[];
  currentTime: number;
  onChapterClick: (chapter: Chapter) => void;
  className?: string;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const ChaptersList: React.FC<ChaptersListProps> = ({
  chapters,
  currentTime,
  onChapterClick,
  className,
}) => {
  // Find current chapter
  const currentChapter = React.useMemo(() => {
    const sortedChapters = [...chapters].sort((a, b) => a.startTime - b.startTime);
    for (let i = sortedChapters.length - 1; i >= 0; i--) {
      if (currentTime >= sortedChapters[i].startTime) {
        return sortedChapters[i];
      }
    }
    return sortedChapters[0];
  }, [chapters, currentTime]);

  if (!chapters.length) return null;

  return (
    <div className={clsx('w-full', className)}>
      <div className="flex items-center gap-2 mb-3 px-1">
        <Clock size={16} className="text-primary-500" />
        <h3 className="text-sm font-semibold text-text-primary">Chapters</h3>
        <span className="text-xs text-text-muted">({chapters.length})</span>
      </div>

      <div className="space-y-1 max-h-[300px] overflow-y-auto no-scrollbar pr-1">
        {chapters.map((chapter, index) => {
          const isActive = currentChapter?.id === chapter.id;
          const isPast = currentTime > chapter.startTime && !isActive;

          return (
            <motion.button
              key={chapter.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onChapterClick(chapter)}
              className={clsx(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl',
                'text-left transition-all duration-200',
                'group',
                isActive
                  ? 'bg-primary-500/20 border border-primary-500/30'
                  : 'hover:bg-surface-light border border-transparent'
              )}
            >
              {/* Chapter number */}
              <div
                className={clsx(
                  'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0',
                  isActive
                    ? 'bg-primary-500 text-white'
                    : isPast
                    ? 'bg-accent-emerald/20 text-accent-emerald'
                    : 'bg-surface-light text-text-muted'
                )}
              >
                {index + 1}
              </div>

              {/* Chapter info */}
              <div className="flex-1 min-w-0">
                <p
                  className={clsx(
                    'text-sm font-medium truncate',
                    isActive ? 'text-primary-400' : 'text-text-primary'
                  )}
                >
                  {chapter.title}
                </p>
                <p className="text-xs text-text-muted mt-0.5">
                  {formatTime(chapter.startTime)}
                </p>
              </div>

              {/* Arrow indicator */}
              <ChevronRight
                size={16}
                className={clsx(
                  'flex-shrink-0 transition-transform',
                  isActive ? 'text-primary-500' : 'text-text-muted',
                  'group-hover:translate-x-1'
                )}
              />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

// Mini chapters bar for player controls
interface ChaptersBarProps {
  chapters: Chapter[];
  currentTime: number;
  duration: number;
  onChapterClick: (chapter: Chapter) => void;
}

export const ChaptersBar: React.FC<ChaptersBarProps> = ({
  chapters,
  currentTime,
  duration,
  onChapterClick,
}) => {
  if (!chapters.length || duration === 0) return null;

  return (
    <div className="absolute bottom-0 left-0 right-0 h-1 flex">
      {chapters.map((chapter, index) => {
        const startPercent = (chapter.startTime / duration) * 100;
        const nextChapter = chapters[index + 1];
        const endPercent = nextChapter
          ? (nextChapter.startTime / duration) * 100
          : 100;
        const width = endPercent - startPercent;
        const isActive =
          currentTime >= chapter.startTime &&
          (nextChapter ? currentTime < nextChapter.startTime : true);

        return (
          <button
            key={chapter.id}
            onClick={() => onChapterClick(chapter)}
            className={clsx(
              'h-full transition-colors',
              isActive ? 'bg-primary-500' : 'bg-white/20 hover:bg-white/30',
              index > 0 && 'border-l border-black/50'
            )}
            style={{ width: `${width}%` }}
            title={chapter.title}
          />
        );
      })}
    </div>
  );
};

