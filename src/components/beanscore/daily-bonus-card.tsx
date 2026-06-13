'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Coffee, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api/client';
import { claimDailyBonus } from '@/lib/api/gamification';

const STORAGE_PREFIX = 'beancircle:dailyBonus:';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Floating home-screen card that surfaces the daily BeanScore bonus.
 * Dismisses once claimed (or if already claimed today), persisting the
 * dismissal in localStorage so it doesn't reappear on remount.
 */
export function DailyBonusCard({ locale }: { locale: string }) {
  const t = useTranslations('beanscore');
  const qc = useQueryClient();
  // Start dismissed to avoid a flash before we've read localStorage on the client.
  const [dismissed, setDismissed] = useState(true);
  const [burstPoints, setBurstPoints] = useState<number | null>(null);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_PREFIX + todayKey()) === 'claimed');
  }, []);

  // Server-side claim state — keeps the card hidden across devices / refreshes.
  const { data: profile } = useQuery({
    queryKey: ['beanscore', locale],
    queryFn: () =>
      api<{ dailyClaimedAt?: string | null }>('/beanscore/me', { locale }),
  });
  const claimedServer =
    !!profile?.dailyClaimedAt &&
    profile.dailyClaimedAt.slice(0, 10) === todayKey();

  const visible = !dismissed && !claimedServer;

  const mutation = useMutation({
    mutationFn: () => claimDailyBonus(locale),
    onSuccess: (res) => {
      localStorage.setItem(STORAGE_PREFIX + todayKey(), 'claimed');
      qc.invalidateQueries({ queryKey: ['beanscore', locale] });
      if (res.claimed && res.points > 0) {
        // Play the burst, then collapse the card away.
        setBurstPoints(res.points);
        setTimeout(() => setDismissed(true), 1100);
      } else {
        // Server says already claimed — just dismiss quietly.
        setDismissed(true);
      }
    },
  });

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={{ type: 'spring', stiffness: 320, damping: 30 }}
          className="px-4 pt-3"
        >
          <button
            type="button"
            onClick={() => !mutation.isPending && mutation.mutate()}
            disabled={mutation.isPending}
            className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-4 py-3 text-start text-white shadow-lg shadow-orange-500/20 transition-transform active:scale-[0.98] disabled:opacity-90"
          >
            <motion.span
              animate={
                mutation.isPending
                  ? { rotate: [0, -12, 12, -8, 0] }
                  : { rotate: 0 }
              }
              transition={{
                repeat: mutation.isPending ? Infinity : 0,
                duration: 0.6,
              }}
              className="flex size-11 shrink-0 items-center justify-center rounded-full bg-white/20"
            >
              <Coffee className="size-6" />
            </motion.span>

            <span className="flex-1">
              <span className="block font-bold leading-tight">
                {t('dailyCardTitle')}
              </span>
              <span className="block text-sm text-white/85">
                {mutation.isPending
                  ? t('claiming')
                  : t('dailyCardSubtitle')}
              </span>
            </span>

            <span className="shrink-0 rounded-full bg-white/25 px-3 py-1.5 text-sm font-semibold">
              {t('claim')}
            </span>

            {/* Claim burst: points float up while sparkles pop. */}
            <AnimatePresence>
              {burstPoints !== null ? (
                <motion.span
                  key="burst"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center bg-gradient-to-r from-amber-400 to-orange-500"
                >
                  <motion.span
                    initial={{ y: 10, scale: 0.8 }}
                    animate={{ y: -6, scale: 1.15 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 18 }}
                    className="flex items-center gap-1.5 text-xl font-extrabold"
                  >
                    <Sparkles className="size-6" />
                    {t('plusPoints', { points: burstPoints })}
                  </motion.span>
                </motion.span>
              ) : null}
            </AnimatePresence>
          </button>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
