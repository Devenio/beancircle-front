'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { DiscoveryStats, MeetNowStage } from '@/stores/meet-now-store';

type Props = {
  stats: DiscoveryStats | null;
  stage: MeetNowStage;
  revealedCount: number;
};

export function DiscoveryScorePanel({ stats, stage, revealedCount }: Props) {
  const t = useTranslations('discover.people.meetNow');

  if (!stats || (stage !== 'revealing' && stage !== 'complete')) return null;

  const matchKey =
    stats.matchPotential === 'high'
      ? 'matchHigh'
      : stats.matchPotential === 'medium'
        ? 'matchMedium'
        : 'matchLow';

  return (
    <motion.div
      className="absolute start-3 top-3 z-30 space-y-1.5 rounded-2xl border border-white/10 bg-black/45 px-3 py-2.5 backdrop-blur-xl"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
    >
      <ScoreRow
        label={t('scoreNearby', { count: stats.nearbyCount })}
        active={revealedCount > 0}
      />
      {stats.sharedInterestsCount > 0 ? (
        <ScoreRow
          label={t('scoreInterests', { count: stats.sharedInterestsCount })}
          active={revealedCount >= 2}
        />
      ) : null}
      <ScoreRow label={t(matchKey)} active={stage === 'complete'} highlight />
    </motion.div>
  );
}

function ScoreRow({
  label,
  active,
  highlight,
}: {
  label: string;
  active: boolean;
  highlight?: boolean;
}) {
  return (
    <motion.p
      className={`text-[11px] font-medium transition-colors ${
        active
          ? highlight
            ? 'text-emerald-300'
            : 'text-white/85'
          : 'text-white/35'
      }`}
      animate={active ? { x: [0, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
    >
      {active ? '✦ ' : '○ '}
      {label}
    </motion.p>
  );
}
