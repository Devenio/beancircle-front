'use client';

import { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type MessageSearchBarProps = {
  query: string;
  onQueryChange: (value: string) => void;
  onClose: () => void;
  matchCount?: number;
  activeIndex?: number;
  onNext?: () => void;
  onPrev?: () => void;
  className?: string;
};

export function MessageSearchBar({
  query,
  onQueryChange,
  onClose,
  matchCount = 0,
  activeIndex = 0,
  onNext,
  onPrev,
  className,
}: MessageSearchBarProps) {
  const t = useTranslations('messages');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 border-b border-border/60 bg-background/95 px-2 py-2 backdrop-blur-md',
        className,
      )}
      role="search"
    >
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-9 shrink-0 px-2 text-primary hover:text-primary"
        onClick={onClose}
      >
        {t('cancel')}
      </Button>

      <div className="relative min-w-0 flex-1">
        <Input
          ref={inputRef}
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder={t('searchInChat')}
          className="h-9 border-0 bg-muted/60 pr-9 shadow-none focus-visible:ring-1"
          aria-label={t('searchInChat')}
        />
        {query ? (
          <Button
            type="button"
            size="icon-sm"
            variant="ghost"
            className="absolute top-1/2 right-1 -translate-y-1/2"
            onClick={() => onQueryChange('')}
            aria-label={t('clearSearch')}
          >
            <X className="size-4" />
          </Button>
        ) : null}
      </div>

      {query ? (
        <>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
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
