'use client';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

/**
 * Immersive coffee-toned backdrop: a deep vertical gradient
 * (black -> charcoal -> dark espresso) plus a few softly drifting
 * blurred glows. Transform/opacity only, so it stays at 60fps.
 */
export function AuthBackground() {
  const reduce = useReducedMotion();

  const float = (dx: number, dy: number) =>
    reduce
      ? {}
      : {
          animate: { x: [0, dx, 0], y: [0, dy, 0] },
          transition: {
            duration: 14,
            repeat: Infinity,
            ease: 'easeInOut' as const,
          },
        };

  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #0a0705 0%, #15100c 45%, #271812 100%)',
        }}
      />
      <LazyMotion features={domAnimation}>
        <m.div
          {...float(24, 18)}
          className="absolute -left-16 -top-10 h-64 w-64 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(217,150,84,0.35), transparent 70%)' }}
        />
        <m.div
          {...float(-20, 26)}
          className="absolute -right-20 top-24 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(180,83,43,0.28), transparent 70%)' }}
        />
        <m.div
          {...float(16, -22)}
          className="absolute bottom-0 left-1/4 h-72 w-72 rounded-full blur-3xl"
          style={{ background: 'radial-gradient(circle, rgba(120,72,40,0.30), transparent 70%)' }}
        />
      </LazyMotion>
      {/* Subtle grain/vignette for depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(120% 80% at 50% 0%, transparent 40%, rgba(0,0,0,0.55) 100%)',
        }}
      />
    </div>
  );
}
