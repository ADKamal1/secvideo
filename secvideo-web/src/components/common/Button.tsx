import React from 'react';
import { clsx } from 'clsx';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      disabled,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = clsx(
      'relative inline-flex items-center justify-center font-medium',
      'transition-all duration-200 ease-out',
      'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
      'select-none'
    );

    const variants = {
      primary: clsx(
        'bg-gradient-to-r from-primary-500 to-primary-600',
        'hover:from-primary-400 hover:to-primary-500',
        'text-white shadow-lg shadow-primary-500/25',
        'hover:shadow-xl hover:shadow-primary-500/30',
        'focus-visible:ring-primary-500',
        'active:scale-[0.98]'
      ),
      secondary: clsx(
        'bg-surface-light hover:bg-background-hover',
        'text-text-primary border border-surface-border',
        'hover:border-primary-500/50',
        'focus-visible:ring-primary-500',
        'active:scale-[0.98]'
      ),
      ghost: clsx(
        'bg-transparent hover:bg-surface-light',
        'text-text-secondary hover:text-text-primary',
        'focus-visible:ring-primary-500',
        'active:scale-[0.98]'
      ),
      danger: clsx(
        'bg-gradient-to-r from-accent-red to-red-600',
        'hover:from-red-500 hover:to-red-600',
        'text-white shadow-lg shadow-accent-red/25',
        'hover:shadow-xl hover:shadow-accent-red/30',
        'focus-visible:ring-accent-red',
        'active:scale-[0.98]'
      ),
      success: clsx(
        'bg-gradient-to-r from-accent-emerald to-emerald-600',
        'hover:from-emerald-500 hover:to-emerald-600',
        'text-white shadow-lg shadow-accent-emerald/25',
        'hover:shadow-xl hover:shadow-accent-emerald/30',
        'focus-visible:ring-accent-emerald',
        'active:scale-[0.98]'
      ),
      outline: clsx(
        'bg-transparent border-2 border-primary-500',
        'text-primary-500 hover:bg-primary-500/10',
        'focus-visible:ring-primary-500',
        'active:scale-[0.98]'
      ),
    };

    const sizes = {
      sm: 'h-8 px-3 text-sm rounded-lg gap-1.5',
      md: 'h-10 px-4 text-sm rounded-xl gap-2',
      lg: 'h-12 px-6 text-base rounded-xl gap-2',
      xl: 'h-14 px-8 text-lg rounded-2xl gap-3',
    };

    return (
      <button
        ref={ref}
        className={clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <Loader2 className="absolute animate-spin" size={size === 'sm' ? 14 : size === 'xl' ? 22 : 18} />
        )}
        <span className={clsx('inline-flex items-center gap-2', isLoading && 'opacity-0')}>
          {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
        </span>
      </button>
    );
  }
);

Button.displayName = 'Button';

