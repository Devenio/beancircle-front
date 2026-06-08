'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Bell, MapPin, Users } from 'lucide-react';

type Props = {
  radiusKm: number;
  onExpand: () => void;
  onInvite: () => void;
  onNotify: () => void;
};

export function MeetNowEmptyState({ radiusKm, onExpand, onInvite, onNotify }: Props) {
  const t = useTranslations('discover.people.meetNow');

  return (
    <motion.div
      className="absolute inset-0 z-40 flex flex-col items-center justify-center px-8 text-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.3 }}
    >
      <motion.div
        className="mb-6 size-20 rounded-full border border-emerald-500/30 bg-emerald-500/10"
        animate={{
          boxShadow: [
            '0 0 20px rgba(52,211,153,0.2)',
            '0 0 40px rgba(52,211,153,0.35)',
            '0 0 20px rgba(52,211,153,0.2)',
          ],
        }}
        transition={{ repeat: Infinity, duration: 3 }}
      />
      <h3 className="text-xl font-bold text-white">{t('emptyTitle')}</h3>
      <p className="mt-2 max-w-xs text-sm text-white/55">{t('emptySubtitle')}</p>

      <div className="mt-8 flex w-full max-w-xs flex-col gap-2.5">
        <ActionButton icon={MapPin} onClick={onExpand}>
          {t('expandRadius', { km: Math.min(radiusKm * 2, 50) })}
        </ActionButton>
        <ActionButton icon={Users} onClick={onInvite} variant="secondary">
          {t('inviteFriends')}
        </ActionButton>
        <ActionButton icon={Bell} onClick={onNotify} variant="secondary">
          {t('notifyNearby')}
        </ActionButton>
      </div>
    </motion.div>
  );
}

function ActionButton({
  children,
  icon: Icon,
  onClick,
  variant = 'primary',
}: {
  children: React.ReactNode;
  icon: typeof MapPin;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={`flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-medium transition-colors ${
        variant === 'primary'
          ? 'bg-emerald-500 text-white shadow-[0_4px_24px_rgba(52,211,153,0.35)]'
          : 'border border-white/15 bg-white/5 text-white/85 backdrop-blur-md hover:bg-white/10'
      }`}
      whileTap={{ scale: 0.97 }}
    >
      <Icon className="size-4" />
      {children}
    </motion.button>
  );
}
