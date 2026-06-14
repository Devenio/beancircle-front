'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Coffee, Flame, Heart, Lightbulb, Smile, ThumbsUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  reactToBean,
  unreactBean,
  type BeanReactionType,
} from '@/lib/api/beans';

type ReactionDef = {
  key: BeanReactionType;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
  iconClass: string;
};

export const BEAN_REACTIONS: ReactionDef[] = [
  {
    key: 'LOVE',
    label: 'Love',
    Icon: Heart,
    activeClass: 'bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-500',
    iconClass: 'fill-rose-500 text-rose-500',
  },
  {
    key: 'BREWED',
    label: 'Brewed it',
    Icon: Coffee,
    activeClass: 'bg-amber-500/10 ring-1 ring-amber-500/40 text-amber-600',
    iconClass: 'text-amber-600',
  },
  {
    key: 'HOT',
    label: 'Hot',
    Icon: Flame,
    activeClass: 'bg-orange-500/10 ring-1 ring-orange-500/40 text-orange-500',
    iconClass: 'fill-orange-400 text-orange-500',
  },
  {
    key: 'NICE',
    label: 'Nice',
    Icon: ThumbsUp,
    activeClass: 'bg-blue-500/10 ring-1 ring-blue-500/40 text-blue-500',
    iconClass: 'fill-blue-500 text-blue-500',
  },
  {
    key: 'INSIGHTFUL',
    label: 'Insightful',
    Icon: Lightbulb,
    activeClass: 'bg-yellow-400/10 ring-1 ring-yellow-400/40 text-yellow-500',
    iconClass: 'fill-yellow-400 text-yellow-500',
  },
  {
    key: 'FUNNY',
    label: 'Funny',
    Icon: Smile,
    activeClass: 'bg-violet-500/10 ring-1 ring-violet-500/40 text-violet-500',
    iconClass: 'fill-violet-200 text-violet-500',
  },
];

export function reactionSymbol(key?: BeanReactionType | null) {
  const def = BEAN_REACTIONS.find((r) => r.key === key);
  return def ? def.label : undefined;
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
      {BEAN_REACTIONS.map(({ key, label, Icon, activeClass, iconClass }) => {
        const n = breakdown?.[key];
        const isActive = current === key;
        return (
          <button
            key={key}
            type="button"
            title={label}
            aria-label={label}
            aria-pressed={isActive}
            className={cn(
              'flex items-center gap-1 rounded-full px-2 py-1 transition-all duration-150 active:scale-90',
              isActive ? activeClass : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              mutation.mutate(key);
            }}
          >
            <Icon
              className={cn('size-[15px] transition-all duration-150', isActive && iconClass)}
              strokeWidth={isActive ? 2 : 1.75}
            />
            {n ? (
              <span className="text-[11px] font-medium tabular-nums leading-none">{n}</span>
            ) : null}
          </button>
        );
      })}
      {(count ?? 0) > 0 && !breakdown ? (
        <span className="ms-1 text-xs text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
}
