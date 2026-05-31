import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes, forwardRef } from 'react';

export const Button = forwardRef<
  HTMLButtonElement,
  ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'default' | 'outline' | 'ghost' }
>(({ className, variant = 'default', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50',
      variant === 'default' && 'bg-neutral-900 text-white hover:bg-neutral-800',
      variant === 'outline' && 'border border-neutral-300 bg-transparent hover:bg-neutral-100',
      variant === 'ghost' && 'bg-transparent hover:bg-neutral-100',
      className,
    )}
    {...props}
  />
));
Button.displayName = 'Button';
