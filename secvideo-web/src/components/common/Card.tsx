import React from 'react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'glass' | 'gradient' | 'bordered';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'default',
  padding = 'md',
  hoverable = false,
  onClick,
}) => {
  const variants = {
    default: 'bg-surface border border-surface-border',
    glass: 'bg-surface/50 backdrop-blur-xl border border-white/5',
    gradient: 'bg-gradient-to-br from-surface via-surface to-surface-light border border-surface-border',
    bordered: 'bg-transparent border-2 border-surface-border',
  };

  const paddings = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  };

  const Component = onClick ? motion.button : motion.div;

  return (
    <Component
      onClick={onClick}
      whileHover={hoverable ? { scale: 1.02, y: -4 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      transition={{ duration: 0.2 }}
      className={clsx(
        'rounded-2xl',
        'transition-shadow duration-300',
        variants[variant],
        paddings[padding],
        hoverable && 'cursor-pointer hover:shadow-card-hover hover:border-primary-500/30',
        onClick && 'text-left w-full',
        className
      )}
    >
      {children}
    </Component>
  );
};

// Stat Card
export interface StatCardProps {
  label: string;
  value: string | number;
  change?: number;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  change,
  icon,
  trend = 'neutral',
}) => {
  const trendColors = {
    up: 'text-accent-emerald',
    down: 'text-accent-red',
    neutral: 'text-text-muted',
  };

  return (
    <Card variant="glass" className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-text-muted">{label}</p>
          <p className="mt-2 text-3xl font-bold text-text-primary">{value}</p>
          {change !== undefined && (
            <p className={clsx('mt-2 text-sm font-medium', trendColors[trend])}>
              {trend === 'up' && '+'}
              {change}%
              <span className="text-text-muted ml-1">vs last week</span>
            </p>
          )}
        </div>
        {icon && (
          <div className="p-3 rounded-xl bg-primary-500/10 text-primary-500">
            {icon}
          </div>
        )}
      </div>
      {/* Decorative gradient */}
      <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-primary-500/5 rounded-full blur-2xl" />
    </Card>
  );
};

// Course Card
export interface CourseCardProps {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  instructorName: string;
  instructorAvatar?: string;
  videosCount: number;
  progress?: number;
  onClick?: () => void;
}

export const CourseCard: React.FC<CourseCardProps> = ({
  title,
  description,
  thumbnail,
  instructorName,
  instructorAvatar,
  videosCount,
  progress,
  onClick,
}) => {
  return (
    <Card
      variant="default"
      padding="none"
      hoverable
      onClick={onClick}
      className="overflow-hidden group"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        
        {/* Video count badge */}
        <div className="absolute bottom-3 right-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-sm text-xs font-medium text-white">
          {videosCount} videos
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        <h3 className="text-lg font-semibold text-text-primary line-clamp-1 group-hover:text-primary-400 transition-colors">
          {title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary line-clamp-2">
          {description}
        </p>

        {/* Instructor */}
        <div className="mt-4 flex items-center gap-3">
          {instructorAvatar ? (
            <img
              src={instructorAvatar}
              alt={instructorName}
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-500 text-sm font-medium">
              {instructorName.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm text-text-muted">{instructorName}</span>
        </div>

        {/* Progress bar */}
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-text-muted">Progress</span>
              <span className="text-primary-400 font-medium">{progress}%</span>
            </div>
            <div className="h-1.5 bg-surface-light rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

