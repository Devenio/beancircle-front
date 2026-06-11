'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { cafeOsApi, type TimelineEntry } from '@/lib/api/cafe-os';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarCheck,
  Crown,
  Gift,
  MapPin,
  QrCode,
  Star,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

const TIMELINE_ICONS: Record<TimelineEntry['type'], typeof Star> = {
  checkin: MapPin,
  scan: QrCode,
  review: Star,
  rsvp: CalendarCheck,
  loyalty: Gift,
};

export default function CustomerDetailPage() {
  const t = useTranslations('cafeOs.customers');
  const format = useFormatter();
  const { cafeId, customerId } = useParams<{ cafeId: string; customerId: string }>();
  const qc = useQueryClient();
  const [notes, setNotes] = useState('');

  const detailKey = ['cafe-customer', cafeId, customerId];
  const { data, isLoading } = useQuery({
    queryKey: detailKey,
    queryFn: () => cafeOsApi.customerDetail(cafeId, customerId),
  });

  useEffect(() => {
    if (data) setNotes(data.customer.notes ?? '');
  }, [data]);

  const updateMutation = useMutation({
    mutationFn: (body: { notes?: string; isVip?: boolean }) =>
      cafeOsApi.updateCustomer(cafeId, customerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: detailKey }),
  });

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-16 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  const { customer, loyalty, timeline } = data;

  return (
    <div className="space-y-4 p-4">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
        <Avatar className="h-16 w-16">
          <AvatarImage src={customer.user.avatarUrl ?? undefined} />
          <AvatarFallback className="text-xl">
            {(customer.user.name ?? customer.user.username ?? '?')[0]}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1.5 text-base font-bold">
            <span className="truncate">{customer.user.name || customer.user.username}</span>
            {customer.isVip ? <Crown className="h-4 w-4 shrink-0 text-amber-500" /> : null}
          </p>
          {customer.user.username ? (
            <p className="text-xs text-muted-foreground">@{customer.user.username}</p>
          ) : null}
          <p className="mt-1 text-xs text-muted-foreground">
            {t('since', { date: format.dateTime(new Date(customer.firstVisitAt), { dateStyle: 'medium' }) })}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox value={customer.visitCount} label={t('visits')} />
        <StatBox value={customer.scanCount} label={t('scans')} />
        <StatBox
          value={format.relativeTime(new Date(customer.lastVisitAt))}
          label={t('lastVisit')}
        />
      </div>

      {/* VIP toggle */}
      <div className="flex items-center justify-between rounded-2xl border border-border bg-card p-3">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Crown className="h-4 w-4 text-amber-500" />
          {t('vipStatus')}
        </span>
        <Switch
          checked={customer.isVip}
          onCheckedChange={(isVip) => updateMutation.mutate({ isVip })}
        />
      </div>

      {/* Loyalty */}
      {loyalty.length ? (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold">{t('loyaltyTitle')}</h2>
          {loyalty.map((row) => (
            <div key={row.id} className="rounded-2xl border border-border bg-card p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{row.program.title}</p>
                <span className="text-xs font-semibold text-primary">
                  {row.progress}/{row.program.goal}
                </span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-accent">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${Math.min(100, (row.progress / row.program.goal) * 100)}%` }}
                />
              </div>
              {row.completedAt && !row.redeemedAt ? (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={() =>
                    cafeOsApi
                      .redeemLoyalty(cafeId, row.program.id, customer.user.id)
                      .then(() => qc.invalidateQueries({ queryKey: detailKey }))
                  }
                >
                  {t('redeemReward', { reward: row.program.rewardLabel })}
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Notes */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">{t('notes')}</h2>
        <Textarea
          value={notes}
          rows={3}
          placeholder={t('notesPlaceholder')}
          onChange={(e) => setNotes(e.target.value)}
        />
        {notes !== (customer.notes ?? '') ? (
          <Button
            size="sm"
            disabled={updateMutation.isPending}
            onClick={() => updateMutation.mutate({ notes })}
          >
            {t('saveNotes')}
          </Button>
        ) : null}
      </div>

      {/* Timeline */}
      <div className="space-y-2">
        <h2 className="text-sm font-semibold">{t('timeline')}</h2>
        {!timeline.length ? (
          <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
            {t('timelineEmpty')}
          </p>
        ) : (
          <div className="space-y-0">
            {timeline.map((entry, i) => {
              const Icon = TIMELINE_ICONS[entry.type] ?? Star;
              return (
                <div key={`${entry.type}-${entry.at}-${i}`} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    {i < timeline.length - 1 ? (
                      <div className="w-px flex-1 bg-border" />
                    ) : null}
                  </div>
                  <div className="pb-5">
                    <p className="text-sm">{entry.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {format.dateTime(new Date(entry.at), {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatBox({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-3 text-center">
      <p className="truncate text-base font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}
