'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { WorldCounts, WorldLayer } from './types';

type Props = {
  layer: WorldLayer;
  counts: WorldCounts;
  radiusKm: number;
  onSwitchLayer: (layer: WorldLayer) => void;
  onExpand: () => void;
};

/** Cascade order: people -> cafes -> communities -> events. */
const CASCADE: { layer: WorldLayer; key: keyof WorldCounts }[] = [
  { layer: 'people', key: 'people' },
  { layer: 'cafes', key: 'cafes' },
  { layer: 'communities', key: 'communities' },
  { layer: 'events', key: 'events' },
];

export function WorldEmptyState({
  layer,
  counts,
  radiusKm,
  onSwitchLayer,
  onExpand,
}: Props) {
  const t = useTranslations('discover.world.empty');

  // Next non-empty layer in the cascade, skipping the current one.
  const fallback = CASCADE.find(
    (c) => c.layer !== layer && counts[c.key] > 0,
  );

  return (
    <motion.div
      className="absolute inset-0 z-30 flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="mb-6 size-24 rounded-full border border-dashed border-white/20"
        animate={{ rotate: 360 }}
        transition={{ repeat: Infinity, duration: 24, ease: 'linear' }}
      />
      <p className="text-lg font-semibold text-white/90">
        {t(`title.${layer === 'all' ? 'all' : layer}`)}
      </p>
      {fallback ? (
        <>
          <p className="mt-2 max-w-xs text-sm text-white/50">
            {t(`fallbackHint.${fallback.layer}`, { count: counts[fallback.key] })}
          </p>
          <button
            type="button"
            onClick={() => onSwitchLayer(fallback.layer)}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            {t(`fallbackCta.${fallback.layer}`)}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 max-w-xs text-sm text-white/50">{t('quietHint')}</p>
          <button
            type="button"
            onClick={onExpand}
            className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
          >
            {t('expandCta', { km: Math.min(radiusKm * 2, 50) })}
          </button>
        </>
      )}
    </motion.div>
  );
}
