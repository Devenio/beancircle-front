'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarClock,
  Coffee,
  MapPin,
  Star,
  Users,
  X,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { CheckinSheet } from '@/components/checkin/checkin-sheet';
import { rsvpEvent } from '@/lib/api/events';
import { joinSquad } from '@/lib/api/squads';
import { cn } from '@/lib/utils';
import {
  eventTiming,
  type WorldCafe,
  type WorldCommunity,
  type WorldEvent,
} from './types';

function CardShell({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open ? (
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
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
          >
            <div className="relative overflow-hidden rounded-3xl border border-white/20 bg-gradient-to-br from-white/15 via-white/5 to-transparent p-[1px] shadow-[0_0_60px_rgba(99,102,241,0.35)] backdrop-blur-xl dark:from-white/10">
              <div className="relative rounded-[22px] bg-background/85 p-5 backdrop-blur-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute end-3 top-3 z-10 rounded-full p-1.5 text-muted-foreground hover:bg-muted/50"
                >
                  <X className="size-4" />
                </button>
                {children}
              </div>
            </div>
          </motion.div>
        </>
      ) : null}
    </AnimatePresence>
  );
}

const HEAT_STYLES: Record<string, string> = {
  TRENDING: 'bg-orange-500/15 text-orange-500',
  BUSY: 'bg-amber-500/15 text-amber-500',
  POPULAR: 'bg-yellow-500/15 text-yellow-600',
  NEW: 'bg-cyan-500/15 text-cyan-500',
};

export function CafeWorldCard({
  cafe,
  onClose,
}: {
  cafe: WorldCafe | null;
  onClose: () => void;
}) {
  const t = useTranslations('discover.world');
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  return (
    <CardShell open={!!cafe} onClose={onClose}>
      {cafe ? (
        <>
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-amber-500/15">
              {cafe.logoUrl || cafe.photoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={cafe.logoUrl ?? cafe.photoUrl ?? ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <Coffee className="size-7 text-amber-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 pe-6">
              <div className="flex flex-wrap items-center gap-1.5">
                <h3 className="text-lg font-bold">{cafe.name}</h3>
                {cafe.heat ? (
                  <span
                    className={cn(
                      'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                      HEAT_STYLES[cafe.heat],
                    )}
                  >
                    {t(`heat.${cafe.heat}`)}
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-medium text-primary">
                {cafe.distanceLabel}
                {cafe.isOpen != null
                  ? ` · ${cafe.isOpen ? t('cafe.open') : t('cafe.closed')}`
                  : ''}
              </p>
              {cafe.vibe ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {t(`vibes.${cafe.vibe}`)}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {cafe.presentCount > 0 ? (
              <span className="flex items-center gap-1 font-medium text-amber-500">
                <Users className="size-3.5" />
                {t('cafe.inside', { count: cafe.presentCount })}
                {cafe.friendsPresent > 0
                  ? ` · ${t('cafe.friendsHere', { count: cafe.friendsPresent })}`
                  : ''}
              </span>
            ) : null}
            {cafe.avgRating > 0 ? (
              <span className="flex items-center gap-1">
                <Star className="size-3.5" />
                {cafe.avgRating.toFixed(1)}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <MapPin className="size-3.5" />
              {cafe.address}
            </span>
          </div>

          <div className="mt-4 flex gap-2">
            <CheckinSheet
              cafeId={cafe.id}
              locale={locale}
              onDone={() => {
                void qc.invalidateQueries({ queryKey: ['discover', 'world'] });
                onClose();
              }}
              trigger={<Button className="flex-1">{t('cafe.checkin')}</Button>}
            />
            <Button
              variant="secondary"
              className="flex-1"
              render={<Link href={`/cafe/${cafe.id}`} />}
            >
              {t('cafe.view')}
            </Button>
          </div>
        </>
      ) : null}
    </CardShell>
  );
}

export function EventWorldCard({
  event,
  onClose,
}: {
  event: WorldEvent | null;
  onClose: () => void;
}) {
  const t = useTranslations('discover.world');
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const rsvp = useMutation({
    mutationFn: (id: string) => rsvpEvent(id, 'GOING', locale),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['discover', 'world'] });
      void qc.invalidateQueries({ queryKey: ['events'] });
    },
  });

  const timing = event ? eventTiming(event.startsAt, event.endsAt) : null;

  return (
    <CardShell open={!!event} onClose={onClose}>
      {event && timing ? (
        <>
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-pink-500/15">
              {event.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <CalendarClock className="size-7 text-pink-500" />
              )}
            </div>
            <div className="min-w-0 flex-1 pe-6">
              <h3 className="text-lg font-bold">{event.title}</h3>
              <p
                className={cn(
                  'text-sm font-semibold',
                  timing.state === 'now' ? 'text-rose-500' : 'text-primary',
                )}
              >
                {timing.state === 'now'
                  ? t('event.happeningNow')
                  : timing.state === 'soon'
                    ? t('event.startsInMinutes', { minutes: timing.minutes })
                    : timing.state === 'upcoming'
                      ? t('event.startsInHours', { hours: timing.hours })
                      : t('event.ended')}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {event.cafe?.name ?? event.locationLabel ?? ''}
              </p>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="size-3.5" />
              {t('event.attendees', { count: event.rsvpCount })}
              {event.capacity ? ` / ${event.capacity}` : ''}
            </span>
            {event.distanceM != null ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5" />
                {event.distanceM < 1000
                  ? `${event.distanceM}m`
                  : `${(event.distanceM / 1000).toFixed(1)}km`}
              </span>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              disabled={rsvp.isPending || timing.state === 'ended'}
              onClick={() => rsvp.mutate(event.id)}
            >
              {t('event.rsvp')}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              render={<Link href={`/events/${event.id}`} />}
            >
              {t('event.view')}
            </Button>
          </div>
        </>
      ) : null}
    </CardShell>
  );
}

export function CommunityWorldCard({
  community,
  onClose,
}: {
  community: WorldCommunity | null;
  onClose: () => void;
}) {
  const t = useTranslations('discover.world');
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const join = useMutation({
    mutationFn: (id: string) => joinSquad(id, locale),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['discover', 'world'] });
      void qc.invalidateQueries({ queryKey: ['squads'] });
    },
  });

  return (
    <CardShell open={!!community} onClose={onClose}>
      {community ? (
        <>
          <div className="flex items-start gap-4">
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-violet-500/15 text-3xl">
              {community.emoji ?? '👥'}
            </div>
            <div className="min-w-0 flex-1 pe-6">
              <h3 className="text-lg font-bold">{community.name}</h3>
              <p className="text-sm font-medium text-primary">
                {t('community.members', { count: community.memberCount })}
              </p>
              {community.cafe ? (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {community.cafe.name}
                </p>
              ) : null}
            </div>
          </div>

          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
            {community.activeNow > 0 ? (
              <span className="font-medium text-emerald-500">
                {t('community.activeNow', { count: community.activeNow })}
              </span>
            ) : null}
            {community.nearbyMembers > 0 ? (
              <span>{t('community.nearbyMembers', { count: community.nearbyMembers })}</span>
            ) : null}
            {community.upcomingEvents > 0 ? (
              <span>{t('community.upcomingEvents', { count: community.upcomingEvents })}</span>
            ) : null}
          </div>

          <div className="mt-4 flex gap-2">
            <Button
              className="flex-1"
              disabled={join.isPending || community.isMember}
              onClick={() => join.mutate(community.id)}
            >
              {community.isMember ? t('community.joined') : t('community.join')}
            </Button>
            <Button
              variant="secondary"
              className="flex-1"
              render={<Link href={`/squads/${community.id}`} />}
            >
              {t('community.view')}
            </Button>
          </div>
        </>
      ) : null}
    </CardShell>
  );
}
