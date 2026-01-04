'use client';

import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'glass' | 'aurora' | 'success' | 'warning' | 'info';
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', hoverable = false, padding = 'md', variant = 'default', children, ...props }, ref) => {
    const paddingStyles = {
      none: '',
      sm: 'p-3',
      md: 'p-4',
      lg: 'p-6',
    };

    // 變體樣式 - 支援淺色和深色主題
    const variantStyles = {
      default: 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700 shadow-sm dark:shadow-lg',
      glass: 'bg-white/80 dark:bg-white/5 backdrop-blur-xl border-gray-200/50 dark:border-white/10 shadow-sm dark:shadow-xl',
      aurora: 'bg-gradient-to-br from-indigo-50/80 via-purple-50/80 to-pink-50/80 dark:from-cyan-500/10 dark:via-purple-500/10 dark:to-pink-500/10 backdrop-blur-xl border-indigo-200/50 dark:border-cyan-500/20 shadow-sm dark:shadow-xl',
      success: 'bg-emerald-50 dark:bg-emerald-500/10 backdrop-blur-xl border-emerald-200 dark:border-emerald-500/20',
      warning: 'bg-amber-50 dark:bg-amber-500/10 backdrop-blur-xl border-amber-200 dark:border-amber-500/20',
      info: 'bg-blue-50 dark:bg-blue-500/10 backdrop-blur-xl border-blue-200 dark:border-blue-500/20',
    };

    return (
      <div
        ref={ref}
        className={`
          rounded-xl border
          ${variantStyles[variant]}
          ${paddingStyles[padding]}
          ${hoverable ? 'transition-all duration-200 hover:shadow-md dark:hover:shadow-2xl hover:border-indigo-300 dark:hover:border-indigo-500/30 cursor-pointer' : ''}
          ${className}
        `}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

export default Card;
