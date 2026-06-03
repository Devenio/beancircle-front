'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, Bell, BellRing, CalendarDays, MapPin } from 'lucide-react';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link, useRouter } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import {
  clearEventReminder,
  getEvent,
  getEventParticipants,
  rsvpEvent,
  setEventReminder,
  type RsvpStatus,
} from '@/lib/api/events';

export default function EventDetailPage() {
  const t = useTranslations('eventsPage');
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const { data: event, isLoading } = useQuery({
    queryKey: ['event', id, locale],
    queryFn: () => getEvent(id, locale),
  });

  const { data: participants } = useQuery({
    queryKey: ['event-participants', id, locale],
    queryFn: () => getEventParticipants(id, locale),
  });

  const rsvpMutation = useMutation({
    mutationFn: (status: RsvpStatus) => rsvpEvent(id, status, locale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['event-participants', id] });
    },
  });

  const reminderMutation = useMutation({
    mutationFn: (on: boolean) =>
      on ? setEventReminder(id, locale) : clearEventReminder(id, locale),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['event', id] }),
  });

  if (isLoading || !event) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-44 w-full rounded-2xl" />
        <Skeleton className="h-6 w-2/3" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const reminderOn = !!event.myReminder;

  return (
    <div className="min-h-dvh pb-28">
      <div className="relative h-52 bg-gradient-to-br from-primary/40 to-violet-500/40">
        {event.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={event.coverUrl} alt="" className="h-full w-full object-cover" />
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-3 top-3 bg-background/80 backdrop-blur"
          onClick={() => router.back()}
        >
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <span className="absolute bottom-3 left-3 rounded-full bg-background/90 px-3 py-1 text-xs font-medium">
          {t(`types.${event.type}`)}
        </span>
      </div>

      <div className="space-y-4 p-4">
        <div>
          <h1 className="text-xl font-bold leading-tight">{event.title}</h1>
          <div className="mt-2 space-y-1.5 text-sm text-muted-foreground">
            <p className="inline-flex items-center gap-2">
              <CalendarDays className="size-4" />
              {new Date(event.startsAt).toLocaleString(locale, {
                dateStyle: 'full',
                timeStyle: 'short',
              })}
            </p>
            {event.cafe || event.locationLabel ? (
              <p className="inline-flex items-center gap-2">
                <MapPin className="size-4" />
                {event.cafe ? (
                  <Link href={`/cafe/${event.cafe.id}`} className="text-primary">
                    {event.cafe.name}
                  </Link>
                ) : (
                  event.locationLabel
                )}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-sm leading-relaxed">{event.description}</p>

        {event.host ? (
          <div className="flex items-center gap-3 rounded-2xl border border-border p-3">
            <UserAvatar src={event.host.avatarUrl} name={event.host.name} />
            <div>
              <p className="text-xs text-muted-foreground">{t('host')}</p>
              <p className="text-sm font-medium">
                {event.host.name || event.host.username}
              </p>
            </div>
          </div>
        ) : null}

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold">{t('participants')}</h2>
            <span className="text-xs text-muted-foreground">
              {t('rsvpCount', { count: event._count?.rsvps ?? 0 })}
            </span>
          </div>
          <div className="flex flex-wrap gap-3">
            {(participants ?? []).slice(0, 18).map((p) => (
              <div key={p.id} className="flex w-14 flex-col items-center gap-1">
                <UserAvatar src={p.user.avatarUrl} name={p.user.name} />
                <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                  {p.user.username}
                </span>
              </div>
            ))}
            {!participants?.length ? (
              <p className="text-sm text-muted-foreground">—</p>
            ) : null}
          </div>
        </div>

        <button
          type="button"
          onClick={() => reminderMutation.mutate(!reminderOn)}
          className={cn(
            'flex w-full items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition-colors',
            reminderOn
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:bg-muted',
          )}
        >
          {reminderOn ? (
            <BellRing className="size-4" />
          ) : (
            <Bell className="size-4" />
          )}
          {reminderOn ? t('reminderOn') : t('remindMe')}
        </button>
      </div>

      <div className="fixed bottom-0 left-1/2 z-40 flex w-full max-w-[430px] -translate-x-1/2 gap-2 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <Button
          className="flex-1"
          variant={event.myRsvp === 'GOING' ? 'default' : 'outline'}
          disabled={rsvpMutation.isPending}
          onClick={() => rsvpMutation.mutate('GOING')}
        >
          {t('going')}
        </Button>
        <Button
          className="flex-1"
          variant={event.myRsvp === 'INTERESTED' ? 'default' : 'outline'}
          disabled={rsvpMutation.isPending}
          onClick={() => rsvpMutation.mutate('INTERESTED')}
        >
          {t('interested')}
        </Button>
      </div>
    </div>
  );
}
