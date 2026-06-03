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

  const checkin = useMutation({
    mutationFn: () =>
      api<{ newStamp: boolean; collectible?: unknown }>('/passport/checkin', {
        method: 'POST',
        body: JSON.stringify({
          cafeId,
          mood: mood ?? undefined,
          status: status.trim() || undefined,
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
      onDone?.();
    },
  });

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
          <Button
            className="mt-5 w-full"
            size="lg"
            disabled={checkin.isPending}
            onClick={() => checkin.mutate()}
          >
            {t('submit')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
