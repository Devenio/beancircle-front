'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Activity, ChevronDown } from 'lucide-react';
import { getActivityFeed, type ActivityItem } from '@/lib/api/activity';
import { getSocket } from '@/lib/realtime/socket';
import { cn } from '@/lib/utils';

const MAX_ITEMS = 30;

function actorName(item: ActivityItem) {
  return item.actor?.name ?? item.actor?.username ?? '·';
}

function targetName(item: ActivityItem) {
  return item.cafe?.name ?? item.event?.title ?? item.squad?.name ?? '';
}

function FeedLine({ item }: { item: ActivityItem }) {
  const t = useTranslations('discover.world.feed');
  const target = targetName(item);
  // Broadcast types like CAFE_TRENDING read as standalone statements.
  const showActor = item.type !== 'CAFE_TRENDING';
  return (
    <p className="truncate text-xs text-white/75">
      {showActor ? (
        <>
          <span className="font-semibold text-white/90">{actorName(item)}</span>{' '}
        </>
      ) : null}
      {t(`verbs.${item.type}`, { target })}
    </p>
  );
}

export function LiveWorldFeed() {
  const t = useTranslations('discover.world.feed');
  const { locale } = useParams<{ locale: string }>();
  const [open, setOpen] = useState(false);
  const [live, setLive] = useState<ActivityItem[]>([]);

  const { data: seeded } = useQuery({
    queryKey: ['world-feed', locale],
    queryFn: () => getActivityFeed(locale, 0, 15),
    staleTime: 60_000,
  });

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onActivity = (item: ActivityItem) => {
      setLive((prev) => {
        if (prev.some((p) => p.id === item.id)) return prev;
        return [item, ...prev].slice(0, MAX_ITEMS);
      });
    };
    socket.on('world:activity', onActivity);
    return () => {
      socket.off('world:activity', onActivity);
    };
  }, []);

  const items = [
    ...live,
    ...(seeded?.data ?? []).filter((s) => !live.some((l) => l.id === s.id)),
  ].slice(0, MAX_ITEMS);

  const latest = items[0];

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="pointer-events-auto flex w-full max-w-[280px] items-center gap-2 rounded-full border border-white/10 bg-black/45 px-3 py-1.5 backdrop-blur-md"
      >
        <Activity className="size-3.5 shrink-0 text-emerald-400" />
        <div className="min-w-0 flex-1 text-start">
          {latest ? (
            <AnimatePresence mode="wait">
              <motion.div
                key={latest.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <FeedLine item={latest} />
              </motion.div>
            </AnimatePresence>
          ) : (
            <p className="truncate text-xs text-white/50">{t('empty')}</p>
          )}
        </div>
      </button>

      <AnimatePresence>
        {open ? (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl border border-white/10 bg-[#0b1120]/95 pb-[max(1rem,env(safe-area-inset-bottom))] backdrop-blur-xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 32 }}
            >
              <div className="flex items-center justify-between px-5 pt-4">
                <h3 className="text-sm font-semibold text-white/90">{t('title')}</h3>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full p-1.5 text-white/60 hover:bg-white/10"
                >
                  <ChevronDown className="size-4" />
                </button>
              </div>
              <div className="mt-2 max-h-[45dvh] space-y-1 overflow-y-auto px-5 pb-4">
                {items.length === 0 ? (
                  <p className="py-6 text-center text-xs text-white/45">{t('empty')}</p>
                ) : (
                  items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: Math.min(i * 0.03, 0.3) }}
                      className={cn(
                        'rounded-xl px-3 py-2',
                        i === 0 && live.some((l) => l.id === item.id)
                          ? 'bg-emerald-500/10'
                          : 'bg-white/5',
                      )}
                    >
                      <FeedLine item={item} />
                    </motion.div>
                  ))
                )}
              </div>
            </motion.div>
          </>
        ) : null}
      </AnimatePresence>
    </>
  );
}
