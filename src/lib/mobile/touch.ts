import { cn } from '@/lib/utils';

/** Mobile touch-target tokens aligned with iOS HIG / Material (44–56px). */
export const touch = {
  /** 44×44 minimum */
  min: 'min-h-11 min-w-11',
  /** 48×48 preferred icon button */
  icon: 'size-12 shrink-0',
  /** 56×56 primary actions (send, etc.) */
  iconPrimary: 'size-14 shrink-0',
  /** Sheet / list action rows */
  actionRow: 'min-h-[52px]',
  /** Reaction chips in sheets */
  reaction: 'size-12',
  /** Standard motion */
  motion: 'transition-all duration-200 ease-out',
  /** Interactive press feedback */
  press: 'active:scale-[0.97] active:opacity-90',
} as const;

export function touchIconButton(className?: string) {
  return cn(
    touch.icon,
    touch.motion,
    touch.press,
    'inline-flex items-center justify-center rounded-full',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-40',
    className,
  );
}

export function touchPrimaryButton(className?: string) {
  return cn(
    touch.iconPrimary,
    touch.motion,
    touch.press,
    'inline-flex items-center justify-center rounded-full',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'disabled:pointer-events-none disabled:opacity-40',
    className,
  );
}
