import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type BadgeVariant = 'yellow' | 'blue' | 'green' | 'pink' | 'orange' | 'purple' | 'white' | 'black';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variantClasses: Record<BadgeVariant, string> = {
  yellow: 'bg-neo-yellow text-neo-black',
  blue: 'bg-neo-blue text-neo-black',
  green: 'bg-neo-green text-neo-black',
  pink: 'bg-neo-pink text-neo-black',
  orange: 'bg-neo-orange text-neo-black',
  purple: 'bg-neo-purple text-neo-black',
  white: 'bg-white text-neo-black',
  black: 'bg-neo-black text-white',
};

export function Badge({ variant = 'yellow', className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn('neo-badge', variantClasses[variant], className)}
      {...props}
    >
      {children}
    </span>
  );
}
