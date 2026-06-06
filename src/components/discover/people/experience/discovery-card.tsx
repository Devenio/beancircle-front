'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { FriendActionButton } from '../friend-action-button';
import { useDeviceTilt } from '../hooks/use-device-tilt';
import type { OrbitPerson } from '../types';

type Props = {
  person: OrbitPerson | null;
  onClose: () => void;
  onFriendAction?: () => void;
};

export function DiscoveryCard({ person, onClose, onFriendAction }: Props) {
  const t = useTranslations('discover.people');
  const tilt = useDeviceTilt(!!person);

  return (
    <AnimatePresence>
      {person ? (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md"
            initial={{ opacity: 0, y: 80, scale: 0.88 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              rotateX: tilt.y * 4,
              rotateY: tilt.x * -4,
            }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            style={{ perspective: 900, transformStyle: 'preserve-3d' }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/5 to-transparent p-[1px] shadow-[0_0_60px_rgba(99,102,241,0.35)] backdrop-blur-xl dark:from-white/10">
              <div className="relative rounded-[22px] bg-background/80 p-5 backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute end-3 top-3 rounded-full p-1.5 text-muted-foreground hover:bg-muted/50"
                >
                  <X className="size-4" />
                </button>
                <div className="flex items-start gap-4">
                  <motion.div
                    initial={{ scale: 0.6 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  >
                    <ProfileAvatar
                      src={person.avatarUrl}
                      name={person.name}
                      className="size-16 ring-2 ring-primary/40 ring-offset-2 ring-offset-background"
                    />
                  </motion.div>
                  <div className="min-w-0 flex-1 pe-6">
                    <h3 className="text-lg font-bold">{person.name ?? person.username}</h3>
                    {person.distanceLabel ? (
                      <p className="text-sm font-medium text-primary">{person.distanceLabel}</p>
                    ) : null}
                    {person.availability ? (
                      <p className="mt-1 text-xs text-amber-500">
                        {t(`availability.${person.availability.intent}`)} ·{' '}
                        {person.availability.minutesLeft}m
                      </p>
                    ) : null}
                  </div>
                </div>
                {person.matchReasons && person.matchReasons.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {person.matchReasons.map((r) => (
                      <li key={r} className="text-xs text-muted-foreground">
                        ✦ {r}
                      </li>
                    ))}
                  </ul>
                ) : null}
                {person.sharedInterests.length > 0 ? (
                  <p className="mt-2 text-xs text-muted-foreground">
                    {person.sharedInterests.map((i) => t(`interests.${i}`)).join(' · ')}
                  </p>
                ) : null}
                {person.mutualFriendsCount > 0 ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    {t('mutualFriends', { count: person.mutualFriendsCount })}
                  </p>
                ) : null}
                <FriendActionButton person={person} onSuccess={onFriendAction} />
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}
