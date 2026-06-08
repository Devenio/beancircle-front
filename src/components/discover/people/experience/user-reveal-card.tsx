'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import type { DiscoverPerson } from '../types';

type Props = {
  person: DiscoverPerson | null;
};

export function UserRevealCard({ person }: Props) {
  const t = useTranslations('discover.people');

  return (
    <AnimatePresence>
      {person ? (
        <motion.div
          key={person.id}
          className="absolute inset-x-4 bottom-36 z-30 mx-auto max-w-sm"
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 340, damping: 28 }}
        >
          <div className="overflow-hidden rounded-2xl border border-white/15 bg-gradient-to-br from-white/12 via-white/5 to-transparent p-[1px] shadow-[0_8px_40px_rgba(52,211,153,0.25)] backdrop-blur-xl">
            <div className="flex items-center gap-3 rounded-[14px] bg-black/60 p-3 backdrop-blur-2xl">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 18, delay: 0.1 }}
              >
                <ProfileAvatar
                  src={person.avatarUrl}
                  name={person.name}
                  className="size-12 ring-2 ring-emerald-400/50"
                />
              </motion.div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-white">
                  {person.name ?? person.username}
                </p>
                {person.distanceLabel ? (
                  <p className="text-xs text-emerald-400">{person.distanceLabel}</p>
                ) : null}
                {person.sharedInterests.length > 0 ? (
                  <p className="mt-0.5 truncate text-[10px] text-white/50">
                    {person.sharedInterests
                      .slice(0, 3)
                      .map((i) => t(`interests.${i}`))
                      .join(' · ')}
                  </p>
                ) : null}
                <p className="mt-0.5 text-[10px] text-sky-400/80">
                  {t(`activity.${person.lastActive}`)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
