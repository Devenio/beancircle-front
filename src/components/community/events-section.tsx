'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';

type EventRow = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  locationLabel?: string | null;
  cafe?: { id: string; name: string } | null;
  _count?: { rsvps: number };
};

export function EventsSection({ locale, cityId }: { locale: string; cityId?: string }) {
  const t = useTranslations('events');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['events', locale, cityId],
    queryFn: () =>
      api<EventRow[]>(`/events${cityId ? `?cityId=${cityId}` : ''}`, { locale }),
  });

  const rsvpMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: string }) =>
      api(`/events/${eventId}/rsvp`, {
        method: 'POST',
        body: JSON.stringify({ status }),
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events', locale, cityId] }),
  });

  if (isLoading) {
    return <p className="px-4 py-2 text-sm text-muted-foreground">{t('loading')}</p>;
  }

  if (!data?.length) return null;

  return (
    <section className="border-b px-4 py-3">
      <h2 className="mb-2 text-sm font-semibold">{t('title')}</h2>
      <div className="space-y-2">
        {data.map((ev) => (
          <article key={ev.id} className="rounded-lg border p-3">
            <p className="font-medium">{ev.title}</p>
            <p className="text-xs text-muted-foreground">{ev.description}</p>
            <p className="mt-1 text-xs">
              {new Date(ev.startsAt).toLocaleString(locale)}
              {ev.locationLabel ? ` · ${ev.locationLabel}` : ''}
            </p>
            {ev.cafe ? (
              <Link href={`/cafe/${ev.cafe.id}`} className="text-xs text-primary">
                {ev.cafe.name}
              </Link>
            ) : null}
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                size="sm"
                variant="default"
                onClick={() =>
                  rsvpMutation.mutate({ eventId: ev.id, status: 'GOING' })
                }
              >
                {t('going')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() =>
                  rsvpMutation.mutate({ eventId: ev.id, status: 'INTERESTED' })
                }
              >
                {t('interested')}
              </Button>
            </div>
            {(ev._count?.rsvps ?? 0) > 0 ? (
              <p className="mt-1 text-xs text-muted-foreground">
                {t('rsvpCount', { count: ev._count?.rsvps ?? 0 })}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}
