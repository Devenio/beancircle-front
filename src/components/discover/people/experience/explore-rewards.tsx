'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type Props = {
  discoveredCount: number;
  streakDays?: number;
};

export function ExploreRewards({ discoveredCount, streakDays = 1 }: Props) {
  const t = useTranslations('discover.people');
  const level = discoveredCount >= 10 ? 3 : discoveredCount >= 5 ? 2 : 1;

  return (
    <motion.div
      className="absolute start-3 top-2 z-20 rounded-2xl border border-white/10 bg-black/35 px-3 py-2 backdrop-blur-md"
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <p className="text-[10px] uppercase tracking-wider text-white/45">
        {t('rewards.explorerLevel', { level })}
      </p>
      <p className="text-xs font-medium text-white/90">
        {t('rewards.streak', { days: streakDays })}
      </p>
    </motion.div>
  );
}
