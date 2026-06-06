'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { OrbitPerson } from '../types';

const CLUSTERS = [
  { key: 'COFFEE', label: 'Coffee lovers', color: '#f59e0b' },
  { key: 'STARTUPS', label: 'Founders', color: '#8b5cf6' },
  { key: 'TECH', label: 'Developers', color: '#06b6d4' },
  { key: 'GAMING', label: 'Gamers', color: '#ec4899' },
] as const;

type Props = {
  orbits: OrbitPerson[];
  onSelect: (person: OrbitPerson | null) => void;
};

export function HeatmapMode({ orbits, onSelect }: Props) {
  const clusters = useMemo(() => {
    return CLUSTERS.map((c) => {
      const members = orbits.filter((p) => p.sharedInterests.includes(c.key));
      const intensity = members.length;
      const angle = (CLUSTERS.indexOf(c) / CLUSTERS.length) * Math.PI * 2;
      return { ...c, members, intensity, angle };
    });
  }, [orbits]);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#0f0720]">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(139,92,246,0.12),transparent_70%)]" />
      {clusters.map((c, i) => {
        const size = 60 + c.intensity * 28;
        const x = 50 + Math.cos(c.angle) * 28;
        const y = 50 + Math.sin(c.angle) * 22;
        return (
          <motion.button
            key={c.key}
            type="button"
            className="absolute rounded-full blur-xl"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              width: size,
              height: size,
              background: c.color,
              transform: 'translate(-50%, -50%)',
              opacity: 0.35 + c.intensity * 0.08,
            }}
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 + i * 0.3 }}
            onClick={() => {
              const pick = c.members[0];
              if (pick) onSelect(pick);
            }}
          />
        );
      })}
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap justify-center gap-2 p-4">
        {clusters.map((c) => (
          <span
            key={c.key}
            className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/80 backdrop-blur"
          >
            {c.label} · {c.intensity}
          </span>
        ))}
      </div>
    </div>
  );
}
