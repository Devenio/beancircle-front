'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';
import {
  reactToBean,
  unreactBean,
  type BeanReactionType,
} from '@/lib/api/beans';

export const BEAN_REACTIONS: { key: BeanReactionType; symbol: string }[] = [
  { key: 'LOVE', symbol: '❤️' },
  { key: 'BREWED', symbol: '☕' },
  { key: 'HOT', symbol: '🔥' },
  { key: 'NICE', symbol: '👏' },
  { key: 'INSIGHTFUL', symbol: '💡' },
  { key: 'FUNNY', symbol: '🤣' },
];

export function reactionSymbol(key?: BeanReactionType | null) {
  return BEAN_REACTIONS.find((r) => r.key === key)?.symbol;
}

export function BeanReactionsBar({
  beanId,
  locale,
  current,
  count,
  breakdown,
}: {
  beanId: string;
  locale: string;
  current?: BeanReactionType | null;
  count?: number;
  breakdown?: Partial<Record<BeanReactionType, number>>;
}) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (type: BeanReactionType): Promise<unknown> =>
      current === type
        ? unreactBean(beanId, locale)
        : reactToBean(beanId, type, locale),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['beans'] });
      qc.invalidateQueries({ queryKey: ['bean', beanId] });
    },
  });

  return (
    <div className="flex items-center gap-0.5">
      {BEAN_REACTIONS.map(({ key, symbol }) => {
        const n = breakdown?.[key];
        return (
          <button
            key={key}
            type="button"
            className={cn(
              'flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-sm transition-colors',
              current === key
                ? 'bg-primary/15 ring-1 ring-primary'
                : 'hover:bg-muted',
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mutation.mutate(key);
            }}
          >
            <span>{symbol}</span>
            {n ? <span className="text-xs text-muted-foreground">{n}</span> : null}
          </button>
        );
      })}
      {(count ?? 0) > 0 && !breakdown ? (
        <span className="ms-1 text-xs text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
}
