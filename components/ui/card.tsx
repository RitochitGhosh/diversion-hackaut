import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type CardVariant = 'white' | 'yellow' | 'blue' | 'pink' | 'green' | 'purple' | 'orange' | 'cream';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  shadow?: 'sm' | 'md' | 'lg' | 'none';
}

const variantClasses: Record<CardVariant, string> = {
  white: 'bg-white',
  yellow: 'bg-neo-yellow',
  blue: 'bg-neo-blue',
  pink: 'bg-neo-pink',
  green: 'bg-neo-green',
  purple: 'bg-neo-purple',
  orange: 'bg-neo-orange',
  cream: 'bg-neo-cream',
};

const shadowClasses = {
  sm: 'shadow-brutal-sm',
  md: 'shadow-brutal',
  lg: 'shadow-brutal-lg',
  none: '',
};

export function Card({ variant = 'white', shadow = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'border-3 border-neo-black',
        variantClasses[variant],
        shadowClasses[shadow],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-b-3 border-neo-black', className)} {...props}>
      {children}
    </div>
  );
}

export function CardContent({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn('p-5 border-t-3 border-neo-black', className)} {...props}>
      {children}
    </div>
  );
}
