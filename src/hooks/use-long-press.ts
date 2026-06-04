'use client';

import { useCallback, useRef } from 'react';
import { haptic } from '@/lib/mobile/haptics';

type UseLongPressOptions = {
  delay?: number;
  moveThreshold?: number;
  onStart?: () => void;
  hapticOnTrigger?: boolean;
};

export function useLongPress(
  onLongPress: () => void,
  { delay = 420, moveThreshold = 12, onStart, hapticOnTrigger = true }: UseLongPressOptions = {},
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const originRef = useRef<{ x: number; y: number } | null>(null);
  const firedRef = useRef(false);

  const clear = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    originRef.current = null;
    firedRef.current = false;
  }, []);

  const start = useCallback(
    (x: number, y: number) => {
      clear();
      originRef.current = { x, y };
      onStart?.();
      timerRef.current = setTimeout(() => {
        firedRef.current = true;
        if (hapticOnTrigger) haptic('medium');
        onLongPress();
      }, delay);
    },
    [clear, delay, hapticOnTrigger, onLongPress, onStart],
  );

  const move = useCallback(
    (x: number, y: number) => {
      if (!originRef.current || firedRef.current) return;
      const dx = Math.abs(x - originRef.current.x);
      const dy = Math.abs(y - originRef.current.y);
      if (dx > moveThreshold || dy > moveThreshold) clear();
    },
    [clear, moveThreshold],
  );

  const end = useCallback(() => {
    clear();
  }, [clear]);

  const bind = useCallback(
    () => ({
      onTouchStart: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (t) start(t.clientX, t.clientY);
      },
      onTouchMove: (e: React.TouchEvent) => {
        const t = e.touches[0];
        if (t) move(t.clientX, t.clientY);
      },
      onTouchEnd: end,
      onTouchCancel: end,
      onMouseDown: (e: React.MouseEvent) => {
        if (e.button !== 0) return;
        start(e.clientX, e.clientY);
      },
      onMouseMove: (e: React.MouseEvent) => {
        if (e.buttons !== 1) return;
        move(e.clientX, e.clientY);
      },
      onMouseUp: end,
      onMouseLeave: end,
      onContextMenu: (e: React.MouseEvent) => {
        e.preventDefault();
        if (hapticOnTrigger) haptic('medium');
        onLongPress();
      },
    }),
    [end, hapticOnTrigger, move, onLongPress, start],
  );

  return { bind, clear };
}
