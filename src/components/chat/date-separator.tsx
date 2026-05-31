'use client';

import { Separator } from '@/components/ui/separator';
import { formatDateLabel } from '@/components/chat/utils';

export function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 py-3" role="separator" aria-label={formatDateLabel(date)}>
      <Separator className="flex-1" />
      <span className="shrink-0 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {formatDateLabel(date)}
      </span>
      <Separator className="flex-1" />
    </div>
  );
}
