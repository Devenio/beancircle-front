'use client';

import { useQuery } from '@tanstack/react-query';
import { TrendingUp } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { getTrendingTopics } from '@/lib/api/beans';

export function TrendingTopics({ locale }: { locale: string }) {
  const { data } = useQuery({
    queryKey: ['beans', 'topics', locale],
    queryFn: () => getTrendingTopics(locale),
    staleTime: 60_000,
  });

  if (!data?.length) return null;

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto px-4 py-2 scrollbar-none">
      <TrendingUp className="size-4 shrink-0 text-muted-foreground" />
      {data.map((topic) => (
        <Link
          key={topic.tag}
          href={`/hashtag/${encodeURIComponent(topic.tag)}`}
          className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
        >
          #{topic.tag}
          <span className="ms-1 text-muted-foreground">{topic.recentCount}</span>
        </Link>
      ))}
    </div>
  );
}
