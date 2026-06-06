'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type Props = {
  radiusKm: number;
  onExpand: () => void;
  onTryInterest: (interest: string) => void;
};

export function SmartEmptyState({ radiusKm, onExpand, onTryInterest }: Props) {
  const t = useTranslations('discover.people');
  const hour = new Date().getHours();
  const peakHint = hour >= 17 && hour <= 20 ? t('empty.peakEvening') : t('empty.peakGeneric');

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
      <p className="text-lg font-semibold text-white/90">{t('empty.expandTitle')}</p>
      <p className="mt-2 max-w-xs text-sm text-white/50">{peakHint}</p>
      <button
        type="button"
        onClick={onExpand}
        className="mt-4 rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
      >
        {t('empty.expandCta', { km: Math.min(radiusKm * 2, 50) })}
      </button>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {['COFFEE', 'STARTUPS'].map((interest) => (
          <button
            key={interest}
            type="button"
            onClick={() => onTryInterest(interest)}
            className="rounded-full border border-white/15 px-3 py-1 text-xs text-white/70"
          >
            {t('empty.tryInterest', { interest: t(`interests.${interest}`) })}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
