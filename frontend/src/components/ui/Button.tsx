import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    return (
      <button
        className={clsx(
          'inline-flex items-center justify-center rounded-md font-medium transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
          'disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-primary text-white hover:bg-primary/90 shadow-sm hover:shadow-md': variant === 'primary',
            'bg-dark-navy text-white hover:bg-dark-navy/90 shadow-sm': variant === 'secondary',
            'border-2 border-primary text-primary bg-white hover:bg-light-lavender': variant === 'outline',
            'hover:bg-light-lavender text-dark-navy': variant === 'ghost',
            'bg-accent-red text-white hover:bg-accent-red/90 shadow-sm': variant === 'destructive',
            'h-9 px-4 py-2 text-sm': size === 'sm',
            'h-10 px-4 py-2 text-base': size === 'md',
            'h-11 px-8 text-base': size === 'lg',
          },
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Button.displayName = 'Button';

export default Button;

