'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { animate, useMotionValue, type PanInfo } from 'framer-motion';
import { cn } from '@/lib/utils';

export const SWIPE_ACTION_WIDTH = 68;

type SnapSide = 'left' | 'right' | null;

export type SwipeActionTone =
  | 'read'
  | 'readDisabled'
  | 'mute'
  | 'unmute'
  | 'archive'
  | 'unarchive'
  | 'delete';

const toneStyles: Record<SwipeActionTone, { button: string; icon: string }> = {
  read: {
    button: 'bg-emerald-600 text-white',
    icon: 'bg-white/20 text-white',
  },
  readDisabled: {
    button: 'bg-zinc-700/90 text-zinc-400',
    icon: 'bg-white/10 text-zinc-500',
  },
  mute: {
    button: 'bg-amber-600 text-white',
    icon: 'bg-white/20 text-white',
  },
  unmute: {
    button: 'bg-sky-600 text-white',
    icon: 'bg-white/20 text-white',
  },
  archive: {
    button: 'bg-violet-600 text-white',
    icon: 'bg-white/20 text-white',
  },
  unarchive: {
    button: 'bg-blue-600 text-white',
    icon: 'bg-white/20 text-white',
  },
  delete: {
    button: 'bg-red-600 text-white',
    icon: 'bg-white/20 text-white',
  },
};

type UseSnapSwipeRowOptions = {
  rightWidth?: number;
  leftWidth?: number;
  enableRight?: boolean;
};

export function useSnapSwipeRow({
  rightWidth = SWIPE_ACTION_WIDTH,
  leftWidth = SWIPE_ACTION_WIDTH * 2,
  enableRight = true,
}: UseSnapSwipeRowOptions = {}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragOriginX = useRef(0);
  const x = useMotionValue(0);
  const [revealed, setRevealed] = useState<SnapSide>(null);
  const [dragging, setDragging] = useState(false);

  const reset = useCallback(() => {
    animate(x, 0, { type: 'spring', stiffness: 480, damping: 32 });
    setRevealed(null);
  }, [x]);

  useEffect(() => {
    if (!revealed || dragging) return;

    const closeFromOutside = (event: PointerEvent) => {
      const root = containerRef.current;
      if (!root || root.contains(event.target as Node)) return;
      reset();
    };

    const closeOnScroll = () => reset();

    const timer = window.setTimeout(() => {
      document.addEventListener('pointerdown', closeFromOutside, true);
      window.addEventListener('scroll', closeOnScroll, true);
    }, 0);

    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', closeFromOutside, true);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [dragging, revealed, reset]);

  const snapTo = useCallback(
    (target: number, side: SnapSide) => {
      setRevealed(side);
      animate(x, target, { type: 'spring', stiffness: 480, damping: 32 });
    },
    [x],
  );

  const handleDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      setDragging(false);
      const ox = info.offset.x;
      const vx = info.velocity.x;
      const threshold = 32;
      const origin = dragOriginX.current;
      const end = x.get();

      const openedRight = origin >= rightWidth * 0.4;
      const openedLeft = leftWidth > 0 && origin <= -leftWidth * 0.4;

      if (openedRight) {
        const closing =
          ox < -8 || vx < -220 || end < rightWidth * 0.55 || (leftWidth > 0 && ox < -threshold);
        if (closing) {
          snapTo(0, null);
          return;
        }
        snapTo(rightWidth, 'right');
        return;
      }

      if (openedLeft) {
        const closing =
          ox > 8 || vx > 220 || end > -leftWidth * 0.55 || (enableRight && ox > threshold);
        if (closing) {
          snapTo(0, null);
          return;
        }
        snapTo(-leftWidth, 'left');
        return;
      }

      const swipeLeft = leftWidth > 0 && (ox < -threshold || vx < -450);
      const swipeRight =
        enableRight && rightWidth > 0 && (ox > threshold || vx > 450);

      if (swipeLeft && swipeRight) {
        snapTo(ox < 0 ? -leftWidth : rightWidth, ox < 0 ? 'left' : 'right');
      } else if (swipeLeft) {
        snapTo(-leftWidth, 'left');
      } else if (swipeRight) {
        snapTo(rightWidth, 'right');
      } else {
        snapTo(0, null);
      }
    },
    [enableRight, leftWidth, rightWidth, snapTo],
  );

  const handleDragStart = useCallback(() => {
    setDragging(true);
    dragOriginX.current = x.get();
  }, [x]);

  const runAction = useCallback(
    (action: () => void) => {
      action();
      reset();
    },
    [reset],
  );

  return {
    containerRef,
    x,
    dragging,
    revealed,
    reset,
    handleDragStart,
    handleDragEnd,
    runAction,
    dragConstraints: {
      left: -leftWidth,
      right: enableRight ? rightWidth : 0,
    },
  };
}

export function SwipeActionButton({
  icon,
  label,
  onClick,
  tone,
  disabled,
  className,
  'aria-label': ariaLabel,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
  tone: SwipeActionTone;
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
}) {
  const styles = toneStyles[tone];

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) onClick();
      }}
      aria-label={ariaLabel ?? label}
      className={cn(
        'flex h-full min-w-[var(--swipe-action-width,68px)] flex-col items-center justify-center gap-1 px-1.5 py-2 text-center transition-opacity',
        styles.button,
        disabled ? 'cursor-default opacity-55' : 'active:opacity-85',
        className,
      )}
    >
      <span
        className={cn(
          'flex size-9 shrink-0 items-center justify-center rounded-full [&_svg]:size-5',
          styles.icon,
        )}
      >
        {icon}
      </span>
      <span className="max-w-[64px] text-[10px] font-semibold leading-tight">{label}</span>
    </button>
  );
}
