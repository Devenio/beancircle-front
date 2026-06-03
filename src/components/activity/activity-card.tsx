'use client';

import { motion } from 'framer-motion';
import {
  Award,
  CalendarDays,
  Coffee,
  Flame,
  MapPin,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { cheerActivity, type ActivityItem } from '@/lib/api/activity';

const ACCENT: Record<string, { icon: LucideIcon; className: string }> = {
  FRIEND_CHECKIN: { icon: MapPin, className: 'bg-amber-500/15 text-amber-600' },
  FRIEND_JOINED_EVENT: {
    icon: CalendarDays,
    className: 'bg-violet-500/15 text-violet-600',
  },
  FRIEND_EARNED_BADGE: {
    icon: Award,
    className: 'bg-yellow-500/15 text-yellow-600',
  },
  FRIEND_COMPLETED_CHALLENGE: {
    icon: Sparkles,
    className: 'bg-pink-500/15 text-pink-600',
  },
  FRIEND_JOINED_SQUAD: {
    icon: Users,
    className: 'bg-blue-500/15 text-blue-600',
  },
  FRIEND_STREAK_MILESTONE: {
    icon: Flame,
    className: 'bg-orange-500/15 text-orange-600',
  },
  FRIEND_COLLECTED_CARD: {
    icon: Coffee,
    className: 'bg-emerald-500/15 text-emerald-600',
  },
  CAFE_TRENDING: {
    icon: TrendingUp,
    className: 'bg-rose-500/15 text-rose-600',
  },
  EVENT_ANNOUNCED: {
    icon: CalendarDays,
    className: 'bg-violet-500/15 text-violet-600',
  },
  SQUAD_ACTIVITY: { icon: Users, className: 'bg-blue-500/15 text-blue-600' },
};

function timeAgo(iso: string, locale: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const mins = Math.round(diff / 60000);
  if (mins < 1) return rtf.format(0, 'minute');
  if (mins < 60) return rtf.format(-mins, 'minute');
  const hours = Math.round(mins / 60);
  if (hours < 24) return rtf.format(-hours, 'hour');
  return rtf.format(-Math.round(hours / 24), 'day');
}

export function ActivityCard({
  item,
  locale,
}: {
  item: ActivityItem;
  locale: string;
}) {
  const t = useTranslations('activity');
  const tEvents = useTranslations('eventsPage.types');
  const [cheers, setCheers] = useState(item.cheerCount);
  const [cheered, setCheered] = useState(false);

  const accent = ACCENT[item.type] ?? ACCENT.FRIEND_CHECKIN;
  const Icon = accent.icon;
  const actorName = item.actor.name || item.actor.username || 'Someone';

  function describe() {
    switch (item.type) {
      case 'FRIEND_CHECKIN':
        return t('checkedInAt', { cafe: item.cafe?.name ?? 'a cafe' });
      case 'FRIEND_JOINED_EVENT':
        return t('joinedEvent', { event: item.event?.title ?? 'an event' });
      case 'FRIEND_EARNED_BADGE':
        return t('earnedBadge', { badge: item.badgeCode ?? '' });
      case 'FRIEND_COMPLETED_CHALLENGE':
        return t('completedChallenge');
      case 'FRIEND_JOINED_SQUAD':
        return t('joinedSquad', { squad: item.squad?.name ?? 'a squad' });
      case 'FRIEND_STREAK_MILESTONE':
        return t('streakMilestone', { count: item.payload?.milestone ?? 0 });
      case 'FRIEND_COLLECTED_CARD':
        return t('collectedCard', { cafe: item.cafe?.name ?? 'a cafe' });
      case 'CAFE_TRENDING':
        return t('cafeTrending', { cafe: item.cafe?.name ?? 'A cafe' });
      case 'EVENT_ANNOUNCED':
        return t('eventAnnounced', {
          event: item.event
            ? `${item.event.title}${item.event.type ? ` · ${tEvents(item.event.type)}` : ''}`
            : 'an event',
        });
      case 'SQUAD_ACTIVITY':
        return t('squadActivity', { squad: item.squad?.name ?? 'a squad' });
      default:
        return '';
    }
  }

  function href(): string | null {
    if (item.cafe) return `/cafe/${item.cafe.id}`;
    if (item.event) return `/events/${item.event.id}`;
    if (item.squad) return `/squads/${item.squad.id}`;
    return null;
  }

  async function cheer() {
    if (cheered) return;
    setCheered(true);
    setCheers((c) => c + 1);
    try {
      const res = await cheerActivity(item.id, locale);
      setCheers(res.cheerCount);
    } catch {
      setCheered(false);
      setCheers((c) => Math.max(0, c - 1));
    }
  }

  const thumb =
    item.cafe?.photos?.[0]?.url || item.event?.coverUrl || undefined;
  const link = href();

  const body = (
    <div className="flex gap-3">
      <div className="relative shrink-0">
        <UserAvatar
          src={item.actor.avatarUrl}
          name={actorName}
          size="lg"
        />
        <span
          className={cn(
            'absolute -bottom-1 -right-1 flex size-5 items-center justify-center rounded-full ring-2 ring-background',
            accent.className,
          )}
        >
          <Icon className="size-3" />
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm leading-snug">
          <span className="font-semibold">{actorName}</span>{' '}
          <span className="text-muted-foreground">{describe()}</span>
        </p>
        {item.payload?.status ? (
          <p className="mt-0.5 text-sm">
            {item.payload.mood ? `${item.payload.mood} ` : ''}
            {item.payload.status}
          </p>
        ) : null}
        {item.payload?.withCount ? (
          <p className="text-xs text-muted-foreground">
            {t('withFriends', { count: item.payload.withCount })}
          </p>
        ) : null}
        <p className="mt-1 text-xs text-muted-foreground">
          {timeAgo(item.createdAt, locale)}
        </p>
      </div>
      {thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumb}
          alt=""
          className="size-14 shrink-0 rounded-xl object-cover"
        />
      ) : null}
    </div>
  );

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 28 }}
      className="rounded-2xl border border-border bg-card p-3.5 shadow-sm"
    >
      {link ? <Link href={link}>{body}</Link> : body}
      <div className="mt-2.5 flex items-center justify-end">
        <button
          type="button"
          onClick={cheer}
          className={cn(
            'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-colors',
            cheered
              ? 'bg-primary/10 text-primary'
              : 'bg-muted text-muted-foreground hover:bg-muted/70',
          )}
        >
          <motion.span animate={{ scale: cheered ? 1.2 : 1 }}>👏</motion.span>
          <span>{t('cheer')}</span>
          {cheers > 0 ? <span>· {cheers}</span> : null}
        </button>
      </div>
    </motion.article>
  );
}

export function ActivityCardSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card p-3.5">
      <div className="flex gap-3">
        <div className="size-11 shrink-0 animate-pulse rounded-full bg-muted" />
        <div className="flex-1 space-y-2 py-1">
          <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
          <div className="h-3 w-1/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="size-14 shrink-0 animate-pulse rounded-xl bg-muted" />
      </div>
    </div>
  );
}
