'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthPrimaryButton({
  children,
  loading = false,
  disabled = false,
  type = 'button',
  onClick,
  className,
}: {
  children: React.ReactNode;
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  onClick?: () => void;
  className?: string;
}) {
  const isDisabled = disabled || loading;

  return (
    <LazyMotion features={domAnimation}>
      <m.button
        type={type}
        disabled={isDisabled}
        onClick={onClick}
        whileHover={isDisabled ? undefined : { scale: 1.01 }}
        whileTap={isDisabled ? undefined : { scale: 0.98 }}
        transition={{ type: 'spring', stiffness: 520, damping: 28 }}
        className={cn(
          'relative flex h-14 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl text-base font-semibold text-[#1a0f0a]',
          'bg-gradient-to-r from-[#f5c882] via-[#e8a85c] to-[#c87f43]',
          'shadow-[0_8px_32px_rgba(200,127,67,0.35)]',
          'focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-amber-400/30',
          'disabled:pointer-events-none disabled:opacity-60',
          className,
        )}
      >
        {loading ? (
          <>
            <Loader2 className="size-5 animate-spin" aria-hidden />
            <span className="sr-only">{children}</span>
          </>
        ) : (
          children
        )}
      </m.button>
    </LazyMotion>
  );
}
