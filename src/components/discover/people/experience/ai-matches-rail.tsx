'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import type { DiscoverPerson } from '../types';

type Props = {
  matches: DiscoverPerson[];
  onSelect: (person: DiscoverPerson) => void;
};

export function AiMatchesRail({ matches, onSelect }: Props) {
  const t = useTranslations('discover.people');

  if (!matches.length) return null;

  return (
    <div className="absolute inset-x-0 top-2 z-20 px-3">
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-white/50">
        {t('aiMatches.title')}
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {matches.map((m, i) => (
          <motion.button
            key={m.id}
            type="button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.06 }}
            onClick={() => onSelect(m)}
            className="flex min-w-[140px] shrink-0 flex-col gap-1 rounded-2xl border border-white/10 bg-black/40 p-2.5 text-start backdrop-blur-md"
          >
            <div className="flex items-center gap-2">
              <ProfileAvatar src={m.avatarUrl} name={m.name} className="size-8" />
              <span className="truncate text-xs font-semibold text-white">
                {m.name ?? m.username}
              </span>
            </div>
            <span className="line-clamp-2 text-[10px] leading-tight text-white/55">
              {m.matchReasons?.[0] ?? t('aiMatches.fallback')}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
