'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { voteBeanPoll, type BeanPoll } from '@/lib/api/beans';

export function BeanPollView({
  beanId,
  poll,
  myOptionId,
  locale,
}: {
  beanId: string;
  poll: BeanPoll;
  myOptionId?: string | null;
  locale: string;
}) {
  const t = useTranslations('beans');
  const qc = useQueryClient();
  const total = poll.options.reduce((s, o) => s + o.voteCount, 0);
  const ended = !!poll.endsAt && new Date(poll.endsAt) < new Date();

  const mutation = useMutation({
    mutationFn: (optionId: string) => voteBeanPoll(beanId, optionId, locale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beans'] });
      qc.invalidateQueries({ queryKey: ['bean', beanId] });
    },
  });

  return (
    <div className="space-y-1.5">
      {poll.options.map((option) => {
        const pct = total > 0 ? Math.round((option.voteCount / total) * 100) : 0;
        const mine = myOptionId === option.id;
        return (
          <button
            key={option.id}
            type="button"
            disabled={ended || mutation.isPending}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mutation.mutate(option.id);
            }}
            className={cn(
              'relative flex w-full items-center justify-between overflow-hidden rounded-xl border px-3 py-2 text-start text-sm transition-colors',
              mine ? 'border-primary' : 'border-border hover:bg-muted',
            )}
          >
            <span
              className={cn(
                'absolute inset-y-0 start-0 rounded-xl',
                mine ? 'bg-primary/20' : 'bg-muted',
              )}
              style={{ width: `${pct}%` }}
            />
            <span className="relative z-10 font-medium">{option.label}</span>
            {myOptionId || ended ? (
              <span className="relative z-10 text-xs text-muted-foreground">
                {pct}%
              </span>
            ) : null}
          </button>
        );
      })}
      <p className="text-xs text-muted-foreground">
        {t('poll.votes', { count: total })}
        {ended ? ` · ${t('poll.ended')}` : ''}
      </p>
    </div>
  );
}
