'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Users, Coffee, CalendarClock, Sparkles } from 'lucide-react';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import type { WorldCounts, WorldLayer } from './types';

type Props = {
  counts: WorldCounts;
  radiusKm: number;
  layer: WorldLayer;
  onSelectLayer: (layer: WorldLayer) => void;
};

function greetingKey(hour: number) {
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
}

function AnimatedCount({ value }: { value: number }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={value}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="inline-block font-bold tabular-nums"
      >
        {value}
      </motion.span>
    </AnimatePresence>
  );
}

const COUNT_CHIPS: {
  key: keyof WorldCounts;
  layer: WorldLayer;
  Icon: typeof Users;
  color: string;
}[] = [
  { key: 'people', layer: 'people', Icon: Users, color: 'text-blue-400' },
  { key: 'cafes', layer: 'cafes', Icon: Coffee, color: 'text-amber-400' },
  { key: 'events', layer: 'events', Icon: CalendarClock, color: 'text-pink-400' },
  { key: 'communities', layer: 'communities', Icon: Sparkles, color: 'text-violet-400' },
];

export function WorldHeader({ counts, radiusKm, layer, onSelectLayer }: Props) {
  const t = useTranslations('discover.world');
  const user = useAuthStore((s) => s.user);
  const name = user?.name ?? user?.username ?? '';

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0 z-20 px-3 pt-3"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <p className="text-sm font-semibold text-white/90">
        {t(`greeting.${greetingKey(new Date().getHours())}`, { name })} 👋
      </p>
      <p className="mt-0.5 text-[11px] text-white/45">
        {t('aroundYou', { km: radiusKm })}
      </p>
      <div className="pointer-events-auto mt-2 flex gap-1.5 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {COUNT_CHIPS.map(({ key, layer: chipLayer, Icon, color }) => (
          <button
            key={key}
            type="button"
            onClick={() => onSelectLayer(layer === chipLayer ? 'all' : chipLayer)}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] backdrop-blur-md transition-colors',
              layer === chipLayer
                ? 'border-white/30 bg-white/15 text-white'
                : 'border-white/10 bg-black/35 text-white/70',
            )}
          >
            <Icon className={cn('size-3', color)} />
            <AnimatedCount value={counts[key]} />
            <span>{t(`counts.${key}`)}</span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
