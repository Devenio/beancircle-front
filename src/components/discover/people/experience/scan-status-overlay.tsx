'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import type { MeetNowStage } from '@/stores/meet-now-store';
import type { ScanSignal } from '@/stores/meet-now-store';

const MESSAGE_KEYS = ['scanMsg1', 'scanMsg2', 'scanMsg3'] as const;

type Props = {
  stage: MeetNowStage;
  messageIndex: number;
  latestSignal: ScanSignal | null;
};

export function ScanStatusOverlay({ stage, messageIndex, latestSignal }: Props) {
  const t = useTranslations('discover.people.meetNow');

  const showScan = stage === 'scanning';
  const showSignal = stage === 'signals' && latestSignal;

  return (
    <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex flex-col items-center gap-3 px-6">
      <AnimatePresence mode="wait">
        {showScan ? (
          <motion.div
            key={`msg-${messageIndex}`}
            className="rounded-2xl border border-white/10 bg-black/50 px-5 py-3 backdrop-blur-xl"
            initial={{ opacity: 0, y: 12, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <p className="text-center text-sm font-medium tracking-wide text-white/90">
              {t(MESSAGE_KEYS[messageIndex % MESSAGE_KEYS.length])}
            </p>
            <motion.div
              className="mx-auto mt-2 h-0.5 w-24 overflow-hidden rounded-full bg-white/10"
            >
              <motion.div
                className="h-full bg-emerald-400"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
              />
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <AnimatePresence>
        {showSignal ? (
          <motion.div
            key={`signal-${latestSignal.index}`}
            className="flex flex-col items-center gap-1"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 380, damping: 24 }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
              {latestSignal.index === 0 ? t('signalDetected') : t('anotherSignal')}
            </p>
            <p className="text-lg font-bold text-white">{latestSignal.distanceLabel}</p>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
