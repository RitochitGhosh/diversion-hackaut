import { cn } from '@/lib/utils';
import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block font-display font-bold text-sm mb-1.5 text-neo-black">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'neo-input',
            error && 'border-red-600 shadow-[4px_4px_0px_0px_rgb(220,38,38)]',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm font-bold text-red-600">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
