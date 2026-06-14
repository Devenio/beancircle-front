'use client';

import dynamic from 'next/dynamic';
import { useRef } from 'react';
import { useInView, useReducedMotion } from 'framer-motion';

// Heavy WebGL bundles load only on the client, only when needed.
const ConnectionUniverse = dynamic(() => import('./connection-universe'), { ssr: false });
const NearbyRadar = dynamic(() => import('./nearby-radar'), { ssr: false });

/** Static, dependency-free fallback shown under reduced-motion or before mount. */
function StaticGlow({ variant }: { variant: 'universe' | 'radar' }) {
  if (variant === 'radar') {
    return (
      <div className="absolute inset-0 grid place-items-center" aria-hidden>
        <div className="relative size-[78%] max-w-[420px] rounded-full">
          {[0.4, 0.62, 0.84, 1].map((s) => (
            <div
              key={s}
              className="absolute inset-0 m-auto rounded-full border border-[var(--bc-crema)]/30"
              style={{ width: `${s * 100}%`, height: `${s * 100}%` }}
            />
          ))}
          <div className="absolute inset-0 m-auto size-2 rounded-full bg-[var(--bc-amber)] shadow-[0_0_16px_var(--bc-amber)]" />
        </div>
      </div>
    );
  }
  return (
    <div className="absolute inset-0" aria-hidden>
      <div className="absolute left-1/2 top-1/2 size-[60vw] max-w-[640px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,var(--bc-crema)_0%,transparent_60%)] opacity-30 blur-2xl" />
    </div>
  );
}

export function HeroScene({ scrollRef }: { scrollRef: React.MutableRefObject<number> }) {
  const reduce = useReducedMotion();
  if (reduce) return <StaticGlow variant="universe" />;
  return (
    <div className="absolute inset-0">
      <ConnectionUniverse scrollRef={scrollRef} />
    </div>
  );
}

export function RadarScene() {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  // Mount the canvas only when the radar scrolls near view, then keep it.
  const inView = useInView(ref, { once: true, margin: '200px' });

  return (
    <div ref={ref} className="absolute inset-0">
      {reduce ? (
        <StaticGlow variant="radar" />
      ) : inView ? (
        <NearbyRadar />
      ) : (
        <StaticGlow variant="radar" />
      )}
    </div>
  );
}
