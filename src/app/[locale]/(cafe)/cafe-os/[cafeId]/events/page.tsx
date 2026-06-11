'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { cafeOsApi, type CafeEvent } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  ImagePlus,
  Loader2,
  Plus,
  Users,
  X,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useRef, useState } from 'react';

const EVENT_TYPES = [
  'MUSIC_NIGHT',
  'OPEN_MIC',
  'GAME_NIGHT',
  'STUDY_GROUP',
  'STARTUP_MEETUP',
  'COFFEE_WORKSHOP',
  'BOOK_CLUB',
  'OTHER',
] as const;

type FormState = {
  title: string;
  description: string;
  type: (typeof EVENT_TYPES)[number];
  startsAt: string;
  endsAt: string;
  capacity: string;
  locationLabel: string;
  coverUrl: string;
};

const EMPTY: FormState = {
  title: '',
  description: '',
  type: 'MUSIC_NIGHT',
  startsAt: '',
  endsAt: '',
  capacity: '',
  locationLabel: '',
  coverUrl: '',
};

export default function CafeEventsPage() {
  const t = useTranslations('cafeOs.events');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [rsvpEvent, setRsvpEvent] = useState<CafeEvent | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const listKey = ['cafe-events', cafeId];
  const { data: events, isLoading } = useQuery({
    queryKey: listKey,
    queryFn: () => cafeOsApi.events(cafeId),
  });

  const { data: rsvps } = useQuery({
    queryKey: ['cafe-event-rsvps', cafeId, rsvpEvent?.id],
    queryFn: () => cafeOsApi.eventRsvps(cafeId, rsvpEvent!.id),
    enabled: !!rsvpEvent,
  });

  const createMutation = useMutation({
    mutationFn: () =>
      cafeOsApi.createEvent(cafeId, {
        title: form.title.trim(),
        description: form.description.trim(),
        type: form.type,
        startsAt: new Date(form.startsAt).toISOString(),
        endsAt: new Date(form.endsAt).toISOString(),
        capacity: form.capacity ? Number(form.capacity) : undefined,
        locationLabel: form.locationLabel.trim() || undefined,
        coverUrl: form.coverUrl || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: listKey });
      setCreating(false);
      setForm(EMPTY);
    },
  });

  async function handleCover(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      const url = await presignAndUpload(files[0], 'cafes');
      setForm((f) => ({ ...f, coverUrl: url }));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          {t('newEvent')}
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : !events?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <CalendarDays className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t('empty')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => setRsvpEvent(event)}
              className="w-full overflow-hidden rounded-2xl border border-border bg-card text-start transition hover:bg-accent"
            >
              {event.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.coverUrl} alt="" className="aspect-[3/1] w-full object-cover" />
              ) : null}
              <div className="p-3">
                <p className="text-sm font-semibold">{event.title}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {format.dateTime(new Date(event.startsAt), {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </p>
                <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-primary">
                  <Users className="h-3.5 w-3.5" />
                  {t('rsvpCount', { count: event._count?.rsvps ?? 0 })}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Create event sheet */}
      <Sheet open={creating} onOpenChange={(o) => !o && setCreating(false)}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[92dvh] max-w-[430px] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>{t('newEvent')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 px-4 pb-8">
            <Input
              value={form.title}
              placeholder={t('titlePlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            />
            <Textarea
              value={form.description}
              rows={3}
              placeholder={t('descriptionPlaceholder')}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            />

            <div className="flex flex-wrap gap-1.5">
              {EVENT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, type }))}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${
                    form.type === type ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  {t(`types.${type}`)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t('startsAt')}</span>
                <Input
                  type="datetime-local"
                  value={form.startsAt}
                  onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t('endsAt')}</span>
                <Input
                  type="datetime-local"
                  value={form.endsAt}
                  onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t('capacity')}</span>
                <Input
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={form.capacity}
                  onChange={(e) => setForm((f) => ({ ...f, capacity: e.target.value }))}
                />
              </label>
              <label className="block space-y-1">
                <span className="text-xs text-muted-foreground">{t('location')}</span>
                <Input
                  value={form.locationLabel}
                  onChange={(e) => setForm((f) => ({ ...f, locationLabel: e.target.value }))}
                />
              </label>
            </div>

            {form.coverUrl ? (
              <div className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={form.coverUrl}
                  alt=""
                  className="aspect-[3/1] w-full rounded-xl object-cover"
                />
                <button
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, coverUrl: '' }))}
                  className="absolute end-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileInput.current?.click()}
                className="flex h-20 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border text-sm text-muted-foreground"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="h-4 w-4" />
                    {t('addCover')}
                  </>
                )}
              </button>
            )}
            <input
              ref={fileInput}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => handleCover(e.target.files)}
            />

            <Button
              className="w-full"
              disabled={
                !form.title.trim() ||
                !form.description.trim() ||
                !form.startsAt ||
                !form.endsAt ||
                createMutation.isPending ||
                uploading
              }
              onClick={() => createMutation.mutate()}
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                t('create')
              )}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* RSVP list sheet */}
      <Sheet open={!!rsvpEvent} onOpenChange={(o) => !o && setRsvpEvent(null)}>
        <SheetContent
          side="bottom"
          className="mx-auto max-h-[80dvh] max-w-[430px] overflow-y-auto rounded-t-2xl"
        >
          <SheetHeader>
            <SheetTitle>{rsvpEvent?.title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-4 pb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t('rsvpList')}
            </p>
            {!rsvps?.length ? (
              <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                {t('noRsvps')}
              </p>
            ) : (
              rsvps.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className="flex items-center gap-3 rounded-xl border border-border p-2.5"
                >
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={rsvp.user.avatarUrl ?? undefined} />
                    <AvatarFallback>
                      {(rsvp.user.name ?? rsvp.user.username ?? '?')[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">
                      {rsvp.user.name || rsvp.user.username}
                    </p>
                  </div>
                  <span className="rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium">
                    {rsvp.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
