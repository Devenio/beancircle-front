'use client';

import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Pin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

type PinnedMessageBannerProps = {
  preview: string;
  onScroll?: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
};

export function PinnedMessageBanner({
  preview,
  scrollContainerRef,
}: PinnedMessageBannerProps) {
  const t = useTranslations('messages');
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    const node = scrollContainerRef?.current;
    if (!node || !expanded) return;

    const collapse = () => setExpanded(false);
    node.addEventListener('scroll', collapse, { once: true, passive: true });
    return () => node.removeEventListener('scroll', collapse);
  }, [scrollContainerRef, expanded]);

  return (
    <div
      className={cn(
        'border-b border-border/40 bg-muted/30 transition-all duration-200',
        expanded ? 'py-2' : 'py-1.5',
      )}
    >
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="flex min-h-11 w-full items-center gap-2 px-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-expanded={expanded}
      >
        <Pin className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        {expanded ? (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">{preview}</span>
        ) : (
          <span className="text-xs text-muted-foreground">{t('pinnedMessage')}</span>
        )}
        {expanded ? (
          <ChevronUp className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <ChevronDown className="size-3.5 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>
    </div>
  );
}
