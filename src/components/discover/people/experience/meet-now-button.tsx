'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

type Props = {
  onClick: () => void;
  disabled?: boolean;
};

export function MeetNowButton({ onClick, disabled }: Props) {
  const t = useTranslations('discover.people.meetNow');

  return (
    <motion.button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="relative flex items-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 px-6 py-3.5 text-sm font-semibold text-white shadow-[0_4px_32px_rgba(52,211,153,0.45)] disabled:opacity-50"
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      animate={{
        boxShadow: [
          '0 4px 24px rgba(52,211,153,0.35)',
          '0 8px 40px rgba(52,211,153,0.55)',
          '0 4px 24px rgba(52,211,153,0.35)',
        ],
      }}
      transition={{ repeat: Infinity, duration: 2.5 }}
    >
      <span className="relative flex size-2.5">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-white opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-white" />
      </span>
      {t('cta')}
      <motion.span
        className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
      />
    </motion.button>
  );
}
