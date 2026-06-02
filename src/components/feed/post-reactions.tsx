'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';

const EMOJIS = [
  { key: 'LIKE', symbol: '👍' },
  { key: 'HEART', symbol: '❤️' },
  { key: 'FIRE', symbol: '🔥' },
  { key: 'CLAP', symbol: '👏' },
] as const;

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
    <div className="flex items-center gap-1 px-4 pb-2">
      {EMOJIS.map(({ key, symbol }) => (
        <button
          key={key}
          type="button"
          className={`rounded-full px-2 py-0.5 text-sm ${
            current === key ? 'bg-primary/15 ring-1 ring-primary' : 'hover:bg-muted'
          }`}
          onClick={() => mutation.mutate(key)}
        >
          {symbol}
        </button>
      ))}
      {(count ?? 0) > 0 ? (
        <span className="ms-1 text-xs text-muted-foreground">{count}</span>
      ) : null}
    </div>
  );
}
