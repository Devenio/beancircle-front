'use client';

import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

type MessageSelectionHeaderProps = {
  count: number;
  totalSelectable: number;
  onCancel: () => void;
  onSelectAll: () => void;
  onClearAll: () => void;
};

export function MessageSelectionHeader({
  count,
  totalSelectable,
  onCancel,
  onSelectAll,
  onClearAll,
}: MessageSelectionHeaderProps) {
  const t = useTranslations('messages');
  const allSelected = totalSelectable > 0 && count === totalSelectable;

  return (
    <header className="sticky top-0 z-30 border-b border-border/60 bg-background/95 backdrop-blur-md">
      <div className="flex items-center gap-2 px-2 py-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-foreground active:bg-muted"
          aria-label={t('cancelSelection')}
        >
          <X className="size-5" />
        </button>
        <p className="min-w-0 flex-1 text-[15px] font-semibold">
          {count > 0 ? t('selectedCount', { count }) : t('selectMessages')}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="shrink-0 text-primary"
          disabled={totalSelectable === 0}
          onClick={allSelected ? onClearAll : onSelectAll}
        >
          {allSelected ? t('deselectAll') : t('selectAll')}
        </Button>
      </div>
    </header>
  );
}
