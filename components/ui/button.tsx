'use client';

import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

type Variant = 'yellow' | 'black' | 'white' | 'green' | 'red' | 'blue' | 'pink' | 'purple';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  yellow: 'neo-btn-yellow',
  black: 'neo-btn-black',
  white: 'neo-btn-white',
  green: 'neo-btn-green',
  red: 'neo-btn-red',
  blue: 'neo-btn-blue',
  pink: 'neo-btn bg-neo-pink text-neo-black',
  purple: 'neo-btn bg-neo-purple text-neo-black',
};

const sizeClasses: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'black', size = 'md', loading, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          variantClasses[variant],
          sizeClasses[size],
          (disabled || loading) && 'opacity-50 cursor-not-allowed hover:translate-x-0 hover:translate-y-0 hover:shadow-brutal',
          className
        )}
        {...props}
      >
        {loading && (
          <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
