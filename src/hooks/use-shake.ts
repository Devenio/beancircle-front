'use client';

import { useEffect, useLayoutEffect, useRef } from 'react';

type DeviceMotionEventStatic = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<'granted' | 'denied'>;
};

/** iOS 13+ gates motion events behind a permission prompt that needs a gesture. */
export async function requestShakePermission(): Promise<boolean> {
  if (typeof window === 'undefined' || typeof DeviceMotionEvent === 'undefined') {
    return false;
  }
  const dme = DeviceMotionEvent as DeviceMotionEventStatic;
  if (typeof dme.requestPermission !== 'function') return true; // not required
  try {
    return (await dme.requestPermission()) === 'granted';
  } catch {
    return false;
  }
}

export function isShakeSupported(): boolean {
  return typeof window !== 'undefined' && typeof DeviceMotionEvent !== 'undefined';
}

type UseShakeOptions = {
  enabled: boolean;
  /** Acceleration delta (m/s²) to count as a shake. Higher = harder shake. */
  threshold?: number;
  /** Minimum gap between triggers (ms) to avoid double-firing. */
  cooldownMs?: number;
  onShake: () => void;
};

/**
 * Detects a shake gesture via the DeviceMotion API. Computes the magnitude of
 * change in acceleration between samples and fires `onShake` when several
 * strong jolts occur in quick succession.
 */
export function useShake({
  enabled,
  threshold = 18,
  cooldownMs = 1500,
  onShake,
}: UseShakeOptions) {
  const onShakeRef = useRef(onShake);
  useLayoutEffect(() => {
    onShakeRef.current = onShake;
  }, [onShake]);

  useEffect(() => {
    if (!enabled || !isShakeSupported()) return;

    let last = { x: 0, y: 0, z: 0 };
    let lastTrigger = 0;
    let jolts = 0;
    let joltWindowStart = 0;
    let primed = false;

    const handler = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x == null || acc.y == null || acc.z == null) return;

      const cur = { x: acc.x, y: acc.y, z: acc.z };
      if (!primed) {
        last = cur;
        primed = true;
        return;
      }

      const delta =
        Math.abs(cur.x - last.x) +
        Math.abs(cur.y - last.y) +
        Math.abs(cur.z - last.z);
      last = cur;

      const now = Date.now();
      if (delta > threshold) {
        if (now - joltWindowStart > 700) {
          jolts = 0;
          joltWindowStart = now;
        }
        jolts += 1;
        if (jolts >= 3 && now - lastTrigger > cooldownMs) {
          lastTrigger = now;
          jolts = 0;
          onShakeRef.current();
        }
      }
    };

    window.addEventListener('devicemotion', handler);
    return () => window.removeEventListener('devicemotion', handler);
  }, [enabled, threshold, cooldownMs]);
}
