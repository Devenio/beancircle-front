'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

const MOODS: { emoji: string; key: string }[] = [
  { emoji: '📚', key: 'studying' },
  { emoji: '🎮', key: 'gaming' },
  { emoji: '💻', key: 'working' },
  { emoji: '😎', key: 'chilling' },
  { emoji: '🗣️', key: 'social' },
  { emoji: '📖', key: 'reading' },
];

function getPosition(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('unavailable'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      timeout: 10000,
      maximumAge: 30000,
    });
  });
}

export function CheckinSheet({
  cafeId,
  locale,
  trigger,
  onDone,
}: {
  cafeId: string;
  locale: string;
  trigger: React.ReactNode;
  onDone?: () => void;
}) {
  const t = useTranslations('checkin');
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mood, setMood] = useState<string | null>(null);
  const [status, setStatus] = useState('');
  const [locationError, setLocationError] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const checkin = useMutation({
    mutationFn: (coords: { lat: number; lng: number }) =>
      api<{ newStamp: boolean; collectible?: unknown }>('/passport/checkin', {
        method: 'POST',
        body: JSON.stringify({
          cafeId,
          mood: mood ?? undefined,
          status: status.trim() || undefined,
          lat: coords.lat,
          lng: coords.lng,
        }),
        locale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['passport', locale] });
      qc.invalidateQueries({ queryKey: ['activity', locale] });
      qc.invalidateQueries({ queryKey: ['collectibles', locale] });
      setOpen(false);
      setMood(null);
      setStatus('');
      setLocationError(null);
      onDone?.();
    },
    onError: (err: Error) => {
      const msg = err.message ?? '';
      if (msg.toLowerCase().includes('near') || msg.toLowerCase().includes('far')) {
        setLocationError(t('tooFar'));
      }
    },
  });

  async function handleSubmit() {
    setLocationError(null);
    setGettingLocation(true);
    try {
      const pos = await getPosition();
      setGettingLocation(false);
      checkin.mutate({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch (err) {
      setGettingLocation(false);
      const code = (err as GeolocationPositionError)?.code;
      if (code === GeolocationPositionError.PERMISSION_DENIED) {
        setLocationError(t('locationDenied'));
      } else {
        setLocationError(t('locationError'));
      }
    }
  }

  const busy = gettingLocation || checkin.isPending;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={trigger as React.ReactElement} />
      <SheetContent side="bottom" className="rounded-t-3xl pb-8">
        <SheetHeader>
          <SheetTitle>{t('title')}</SheetTitle>
          <SheetDescription>{t('mood')}</SheetDescription>
        </SheetHeader>
        <div className="px-4">
          <div className="grid grid-cols-3 gap-2">
            {MOODS.map((m) => (
              <button
                key={m.key}
                type="button"
                onClick={() => setMood(m.emoji)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl border py-3 transition-colors',
                  mood === m.emoji
                    ? 'border-primary bg-primary/10'
                    : 'border-border hover:bg-muted',
                )}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs">{t(`moods.${m.key}`)}</span>
              </button>
            ))}
          </div>
          <label className="mt-4 block text-sm font-medium">{t('status')}</label>
          <input
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            maxLength={60}
            placeholder={t('statusPlaceholder')}
            className="mt-1.5 w-full rounded-xl border border-border bg-muted px-4 py-2.5 text-sm outline-none focus:border-primary"
          />
          {locationError && (
            <p className="mt-3 text-sm text-destructive">{locationError}</p>
          )}
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={busy}
            onClick={handleSubmit}
          >
            {gettingLocation ? t('gettingLocation') : t('submit')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
