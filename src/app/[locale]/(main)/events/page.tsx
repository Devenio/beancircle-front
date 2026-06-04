'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { CalendarDays, MapPin, Users } from 'lucide-react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { listEvents, type EventType } from '@/lib/api/events';

const TYPES: EventType[] = [
  'OPEN_MIC',
  'GAME_NIGHT',
  'STUDY_GROUP',
  'STARTUP_MEETUP',
  'MUSIC_NIGHT',
  'COFFEE_WORKSHOP',
  'BOOK_CLUB',
];

export default function EventsPage() {
  const t = useTranslations('eventsPage');
  const { locale } = useParams<{ locale: string }>();
  const [type, setType] = useState<EventType | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['events', locale, type],
    queryFn: () => listEvents(locale, type ? { type } : {}),
  });

  return (
    <div className="min-h-dvh">
      <header className="sticky top-0 z-10 border-b border-border bg-background/95 px-4 py-3 backdrop-blur-md">
        <h1 className="text-lg font-bold leading-none">{t('title')}</h1>
        <p className="text-xs text-muted-foreground">{t('subtitle')}</p>
      </header>

      <div className="no-scrollbar flex gap-2 overflow-x-auto border-b border-border px-4 py-3">
        <Chip active={type === null} onClick={() => setType(null)}>
          {t('all')}
        </Chip>
        {TYPES.map((ty) => (
          <Chip key={ty} active={type === ty} onClick={() => setType(ty)}>
            {t(`types.${ty}`)}
          </Chip>
        ))}
      </div>

      <div className="space-y-3 p-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))
        ) : !data?.length ? (
          <Empty className="mt-16 border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays />
              </EmptyMedia>
              <EmptyTitle>{t('emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('emptyBody')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          data.map((ev) => (
            <motion.div
              key={ev.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Link
                href={`/events/${ev.id}`}
                className="block overflow-hidden rounded-2xl border border-border bg-card shadow-sm"
              >
                <div className="relative h-28 bg-gradient-to-br from-primary/30 to-violet-500/30">
                  {ev.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={ev.coverUrl}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : null}
                  <span className="absolute left-3 top-3 rounded-full bg-background/90 px-2.5 py-1 text-xs font-medium">
                    {t(`types.${ev.type}`)}
                  </span>
                </div>
                <div className="p-3.5">
                  <p className="font-semibold leading-snug">{ev.title}</p>
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {ev.description}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarDays className="size-3.5" />
                      {new Date(ev.startsAt).toLocaleString(locale, {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </span>
                    {ev.locationLabel || ev.cafe ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {ev.cafe?.name ?? ev.locationLabel}
                      </span>
                    ) : null}
                    {ev._count?.rsvps ? (
                      <span className="inline-flex items-center gap-1">
                        <Users className="size-3.5" />
                        {t('rsvpCount', { count: ev._count.rsvps })}
                      </span>
                    ) : null}
                  </div>
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
        active
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:bg-muted',
      )}
    >
      {children}
    </button>
  );
}
