'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { FriendActionButton } from './friend-action-button';
import type { DiscoverPerson } from './types';

export function PersonCard({ person, index = 0 }: { person: DiscoverPerson; index?: number }) {
  const t = useTranslations('discover.people');
  const href = person.username ? `/profile/${person.username}` : '/profile';

  return (
    <motion.article
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3) }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <Link href={href} className="flex items-start gap-3">
        <ProfileAvatar src={person.avatarUrl} name={person.name} className="size-14 shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2">
            <h3 className="truncate font-semibold">{person.name ?? person.username}</h3>
            {person.age ? (
              <span className="text-sm text-muted-foreground">{person.age}</span>
            ) : null}
          </div>
          {person.distanceLabel ? (
            <p className="text-sm text-primary">{person.distanceLabel}</p>
          ) : null}
          {person.mutualFriendsCount > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {t('mutualFriends', { count: person.mutualFriendsCount })}
            </p>
          ) : null}
          {person.sharedInterests.length > 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">
              {person.sharedInterests.map((i) => t(`interests.${i}`)).join(' · ')}
            </p>
          ) : null}
          <p className="mt-1 text-xs capitalize text-muted-foreground">
            {t(`activity.${person.lastActive}`)}
          </p>
        </div>
      </Link>
      <FriendActionButton person={person} compact />
    </motion.article>
  );
}

export function PersonCardSkeleton() {
  return (
    <div className="animate-pulse rounded-2xl border border-border p-4">
      <div className="flex gap-3">
        <div className="size-14 rounded-full bg-muted" />
        <div className="flex-1 space-y-2">
          <div className="h-4 w-2/3 rounded bg-muted" />
          <div className="h-3 w-1/3 rounded bg-muted" />
          <div className="h-3 w-full rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
