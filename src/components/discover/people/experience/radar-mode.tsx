'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';
import type { OrbitPerson } from '../types';

type Props = {
  orbits: OrbitPerson[];
  selectedId: string | null;
  onSelect: (person: OrbitPerson | null) => void;
};

export function RadarMode({ orbits, selectedId, onSelect }: Props) {
  const sweepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame: number;
    let angle = 0;
    const tick = () => {
      angle = (angle + 1.2) % 360;
      if (sweepRef.current) {
        sweepRef.current.style.transform = `rotate(${angle}deg)`;
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, []);

  const maxR = 140;

  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden bg-[#020617]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(16,185,129,0.08),transparent_55%)]" />
      {[0.25, 0.5, 0.75, 1].map((s) => (
        <div
          key={s}
          className="absolute rounded-full border border-emerald-500/20"
          style={{ width: maxR * 2 * s, height: maxR * 2 * s }}
        />
      ))}
      <div
        ref={sweepRef}
        className="absolute h-[280px] w-[280px] origin-center"
        style={{
          background:
            'conic-gradient(from 0deg, transparent 0deg, rgba(52,211,153,0.45) 28deg, transparent 56deg)',
        }}
      />
      <div className="absolute size-3 rounded-full bg-emerald-400 shadow-[0_0_20px_#34d399]" />
      {orbits.map((p) => {
        const t = Math.min(1, (p.distanceM ?? 1000) / 5000);
        const r = t * maxR;
        const x = Math.cos(p.orbitAngle) * r;
        const y = Math.sin(p.orbitAngle) * r;
        const active = p.lastActive === 'online';
        const selected = selectedId === p.id;
        return (
          <motion.button
            key={p.id}
            type="button"
            className="absolute z-10"
            style={{ left: `calc(50% + ${x}px)`, top: `calc(50% + ${y}px)` }}
            animate={{
              scale: selected ? 1.6 : active ? [1, 1.25, 1] : 1,
              opacity: 1,
            }}
            transition={{
              scale: active ? { repeat: Infinity, duration: 2 } : { type: 'spring', stiffness: 300 },
            }}
            onClick={() => onSelect(selected ? null : p)}
          >
            <span
              className={`block size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
                p.availability
                  ? 'bg-amber-400 shadow-[0_0_12px_#fbbf24]'
                  : active
                    ? 'bg-sky-400 shadow-[0_0_10px_#38bdf8]'
                    : 'bg-violet-400 shadow-[0_0_8px_#a78bfa]'
              }`}
            />
          </motion.button>
        );
      })}
      <p className="absolute bottom-4 text-[10px] uppercase tracking-[0.2em] text-emerald-500/60">
        Live scan
      </p>
    </div>
  );
}
