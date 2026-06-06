'use client';

import { useEffect, useState } from 'react';

export function useDeviceTilt(enabled = true) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const onOrient = (e: DeviceOrientationEvent) => {
      const beta = e.beta ?? 0;
      const gamma = e.gamma ?? 0;
      setTilt({
        x: Math.max(-1, Math.min(1, gamma / 30)),
        y: Math.max(-1, Math.min(1, (beta - 45) / 30)),
      });
    };

    window.addEventListener('deviceorientation', onOrient);
    return () => window.removeEventListener('deviceorientation', onOrient);
  }, [enabled]);

  return tilt;
}
