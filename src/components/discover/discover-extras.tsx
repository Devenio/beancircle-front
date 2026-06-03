'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { CalendarDays, Users } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { listEvents } from '@/lib/api/events';
import { listSquads } from '@/lib/api/squads';

export function DiscoverExtras({
  locale,
  cityId,
}: {
  locale: string;
  cityId?: string;
}) {
  const t = useTranslations('discover');
  const tEvents = useTranslations('eventsPage');
  const tSquads = useTranslations('squads');

  const { data: events } = useQuery({
    queryKey: ['events', 'discover', locale, cityId],
    queryFn: () => listEvents(locale, cityId ? { cityId } : {}),
  });
  const { data: squads } = useQuery({
    queryKey: ['squads', 'discover', locale, cityId],
    queryFn: () => listSquads(locale, cityId ? { cityId } : {}),
  });

  return (
    <>
      {events?.length ? (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('sections.events')}
            </h2>
            <Link href="/events" className="text-xs text-primary">
              {t('seeAll')}
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {events.slice(0, 8).map((ev) => (
              <Link
                key={ev.id}
                href={`/events/${ev.id}`}
                className="w-40 shrink-0 overflow-hidden rounded-2xl border border-border bg-card"
              >
                <div className="flex h-20 items-center justify-center bg-gradient-to-br from-primary/30 to-violet-500/30">
                  {ev.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={ev.coverUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <CalendarDays className="size-7 text-primary" />
                  )}
                </div>
                <div className="p-2.5">
                  <p className="truncate text-sm font-medium">{ev.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {tEvents(`types.${ev.type}`)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {squads?.length ? (
        <section className="mt-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {t('sections.squads')}
            </h2>
            <Link href="/squads" className="text-xs text-primary">
              {t('seeAll')}
            </Link>
          </div>
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            {squads.slice(0, 8).map((sq) => (
              <Link
                key={sq.id}
                href={`/squads/${sq.id}`}
                className="flex w-36 shrink-0 flex-col items-center gap-2 rounded-2xl border border-border bg-card p-3 text-center"
              >
                <div className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-violet-500/20 text-2xl">
                  {sq.emoji ?? '☕'}
                </div>
                <p className="truncate text-sm font-medium">{sq.name}</p>
                <p className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Users className="size-3" />
                  {tSquads('members', { count: sq.memberCount })}
                </p>
              </Link>
            ))}
          </div>
        </section>
      ) : null}
    </>
  );
}
