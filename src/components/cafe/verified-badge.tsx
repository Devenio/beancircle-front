import { BadgeCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

type VerifiedBadgeProps = {
  /** Show a text label next to the icon. */
  label?: string;
  className?: string;
};

/** Emerald check shown on cafes whose ownership has been verified. */
export function VerifiedBadge({ label, className }: VerifiedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400',
        className,
      )}
      title={label ?? 'Verified'}
    >
      <BadgeCheck className="size-4 shrink-0" aria-hidden />
      {label ? <span className="text-xs font-medium">{label}</span> : null}
      <span className="sr-only">Verified</span>
    </span>
  );
}

type UnverifiedBadgeProps = {
  label: string;
  className?: string;
};

/** Amber pill for owner cafes still awaiting verification. */
export function UnverifiedBadge({ label, className }: UnverifiedBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-700 dark:bg-amber-500/15 dark:text-amber-400',
        className,
      )}
    >
      {label}
    </span>
  );
}
