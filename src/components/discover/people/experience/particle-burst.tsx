'use client';

import { motion } from 'framer-motion';

export function ParticleBurst({ active }: { active: boolean }) {
  if (!active) return null;
  const particles = Array.from({ length: 16 });
  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center">
      {particles.map((_, i) => {
        const angle = (i / particles.length) * Math.PI * 2;
        const dist = 40 + (i % 4) * 18;
        return (
          <motion.span
            key={i}
            className="absolute size-2 rounded-full bg-emerald-400"
            initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
            animate={{
              x: Math.cos(angle) * dist,
              y: Math.sin(angle) * dist,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        );
      })}
    </div>
  );
}
