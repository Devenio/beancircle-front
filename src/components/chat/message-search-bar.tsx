'use client';

import { Search, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MessageSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  matchCount?: number;
  activeIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
};

export function MessageSearchBar({
  query,
  onQueryChange,
  matchCount = 0,
  activeIndex = 0,
  onNext,
  onPrev,
  className,
}: MessageSearchBarProps) {
  const t = useTranslations('messages');

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-border/60 bg-background/95 px-3 py-2 backdrop-blur-md',
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden />
      <Input
        value={query}
        onChange={(e) => onQueryChange(e.target.value)}
        placeholder={t('searchInChat')}
        className="h-9 border-0 bg-muted/60 shadow-none focus-visible:ring-1"
        aria-label={t('searchInChat')}
      />
      {query ? (
        <>
          <span className="shrink-0 text-xs text-muted-foreground">
            {matchCount > 0 ? `${activeIndex + 1}/${matchCount}` : t('noSearchResults')}
          </span>
          {matchCount > 1 ? (
            <div className="flex shrink-0 gap-0.5">
              <Button type="button" size="icon-sm" variant="ghost" onClick={onPrev} aria-label={t('previousMatch')}>
                ↑
              </Button>
              <Button type="button" size="icon-sm" variant="ghost" onClick={onNext} aria-label={t('nextMatch')}>
                ↓
              </Button>
            </div>
          ) : null}
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            onClick={() => onQueryChange('')}
            aria-label={t('clearSearch')}
          >
            <X className="size-4" />
          </Button>
        </>
      ) : null}
    </div>
  );
}

export function highlightSearchText(text: string, query: string) {
  if (!query.trim()) return [{ text, match: false }];
  const parts = text.split(new RegExp(`(${escapeRegExp(query)})`, 'gi'));
  return parts.filter(Boolean).map((part) => ({
    text: part,
    match: part.toLowerCase() === query.toLowerCase(),
  }));
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
