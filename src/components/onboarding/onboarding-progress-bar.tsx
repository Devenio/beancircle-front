'use client';

import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';

/** Segmented "coffee fill" progress across the activation steps. */
export function OnboardingProgressBar({
  total,
  current,
}: {
  total: number;
  current: number;
}) {
  const reduce = useReducedMotion();
  return (
    <LazyMotion features={domAnimation} strict>
      <div className="flex items-center gap-1.5" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={current + 1}>
        {Array.from({ length: total }).map((_, i) => {
          const filled = i <= current;
          return (
            <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/12">
              <m.div
                className="h-full rounded-full"
                style={{ background: 'linear-gradient(90deg,#f5b878,#c87f43)' }}
                initial={false}
                animate={{ width: filled ? '100%' : '0%' }}
                transition={reduce ? { duration: 0 } : { duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              />
            </div>
          );
        })}
      </div>
    </LazyMotion>
  );
}
