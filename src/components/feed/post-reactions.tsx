'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Flame, Heart, Smile, ThumbsUp, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api/client';

type ReactionDef = {
  key: string;
  label: string;
  Icon: LucideIcon;
  activeClass: string;
  iconClass: string;
};

const REACTIONS: ReactionDef[] = [
  {
    key: 'LIKE',
    label: 'Like',
    Icon: ThumbsUp,
    activeClass: 'bg-blue-500/10 ring-1 ring-blue-500/40 text-blue-500',
    iconClass: 'fill-blue-500 text-blue-500',
  },
  {
    key: 'HEART',
    label: 'Love',
    Icon: Heart,
    activeClass: 'bg-rose-500/10 ring-1 ring-rose-500/40 text-rose-500',
    iconClass: 'fill-rose-500 text-rose-500',
  },
  {
    key: 'FIRE',
    label: 'Fire',
    Icon: Flame,
    activeClass: 'bg-orange-500/10 ring-1 ring-orange-500/40 text-orange-500',
    iconClass: 'fill-orange-400 text-orange-500',
  },
  {
    key: 'CLAP',
    label: 'Amazing',
    Icon: Smile,
    activeClass: 'bg-violet-500/10 ring-1 ring-violet-500/40 text-violet-500',
    iconClass: 'fill-violet-200 text-violet-500',
  },
];

export function PostReactions({
  postId,
  locale,
  current,
  count,
}: {
  postId: string;
  locale: string;
  current?: string | null;
  count?: number;
}) {
  const qc = useQueryClient();

  const mutation = useMutation({
    mutationFn: (emoji: string) =>
      api(`/posts/${postId}/reactions`, {
        method: current === emoji ? 'DELETE' : 'POST',
        body: current === emoji ? undefined : JSON.stringify({ emoji }),
        locale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', locale] });
      qc.invalidateQueries({ queryKey: ['community', locale] });
    },
  });

  return (
    <div className="flex items-center gap-0.5 px-4 pb-2">
      {REACTIONS.map(({ key, label, Icon, activeClass, iconClass }) => {
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
              isActive
                ? activeClass
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )}
            onClick={() => mutation.mutate(key)}
          >
            <Icon
              className={cn('size-[15px] transition-all duration-150', isActive && iconClass)}
              strokeWidth={isActive ? 2 : 1.75}
            />
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
      {(count ?? 0) > 0 ? (
        <span className="ms-2 text-xs text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
}
