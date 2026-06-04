'use client';

import { Loader2, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { touch, touchIconButton, touchPrimaryButton } from '@/lib/mobile/touch';

type ChatIconButtonProps = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary' | 'destructive' | 'muted';
  size?: 'default' | 'primary';
  loading?: boolean;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit';
};

const variantClass = {
  default: 'text-muted-foreground hover:bg-muted',
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  muted: 'bg-muted text-foreground hover:bg-muted/80',
} as const;

export function ChatIconButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  size = 'default',
  loading,
  disabled,
  className,
  type = 'button',
}: ChatIconButtonProps) {
  const base = size === 'primary' ? touchPrimaryButton() : touchIconButton();
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      onClick={onClick}
      className={cn(base, variantClass[variant], className)}
    >
      {loading ? (
        <Loader2 className={cn('animate-spin', size === 'primary' ? 'size-6' : 'size-5')} aria-hidden />
      ) : (
        <Icon className={size === 'primary' ? 'size-6' : 'size-5'} aria-hidden />
      )}
    </button>
  );
}
