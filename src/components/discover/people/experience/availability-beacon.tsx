'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Sparkles } from 'lucide-react';
import {
  AVAILABILITY_DURATIONS,
  AVAILABILITY_INTENTS,
  type AvailabilityIntent,
} from '../types';

type Props = {
  onSet: (intent: AvailabilityIntent, minutes: number) => void;
};

export function AvailabilityBeacon({ onSet }: Props) {
  const t = useTranslations('discover.people');
  const [open, setOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        className="absolute end-3 bottom-28 z-20 flex size-12 items-center justify-center rounded-full border border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-[0_0_24px_rgba(251,191,36,0.35)] backdrop-blur-md"
        whileTap={{ scale: 0.92 }}
        animate={{ boxShadow: ['0 0 20px rgba(251,191,36,0.3)', '0 0 32px rgba(251,191,36,0.5)', '0 0 20px rgba(251,191,36,0.3)'] }}
        transition={{ repeat: Infinity, duration: 2.5 }}
        onClick={() => setOpen(true)}
      >
        <Sparkles className="size-5" />
      </motion.button>
      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-4 bottom-28 z-50 mx-auto max-w-sm rounded-2xl border border-white/10 bg-background/95 p-4 backdrop-blur-xl"
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
            >
              <p className="mb-3 text-sm font-semibold">{t('availability.title')}</p>
              <div className="mb-3 flex flex-wrap gap-2">
                {AVAILABILITY_INTENTS.map((intent) => (
                  <button
                    key={intent}
                    type="button"
                    className="rounded-full border border-border px-3 py-1.5 text-xs hover:border-primary hover:bg-primary/10"
                    onClick={() => {
                      onSet(intent, 30);
                      setOpen(false);
                    }}
                  >
                    {t(`availability.${intent}`)}
                  </button>
                ))}
              </div>
              <p className="mb-2 text-xs text-muted-foreground">{t('availability.duration')}</p>
              <div className="flex gap-2">
                {AVAILABILITY_DURATIONS.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className="flex-1 rounded-lg bg-muted py-2 text-xs font-medium"
                    onClick={() => {
                      onSet('coffee', m);
                      setOpen(false);
                    }}
                  >
                    {m}m
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
