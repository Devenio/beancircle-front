'use client';

import { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';

const ROW_HEIGHT = 60;
const ROW_GAP = 4;

export function VirtualConversationList({
  count,
  className,
  renderRow,
}: {
  count: number;
  className?: string;
  renderRow: (index: number) => React.ReactNode;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count,
    getScrollElement: () => parentRef.current,
    estimateSize: () => ROW_HEIGHT + ROW_GAP,
    overscan: 8,
  });

  return (
    <div ref={parentRef} className={cn('flex-1 overflow-y-auto chat-scrollbar', className)}>
      <div
        className="relative w-full p-2 pb-24"
        style={{ height: `${virtualizer.getTotalSize()}px` }}
      >
        {virtualizer.getVirtualItems().map((virtualRow) => (
          <div
            key={virtualRow.key}
            className="absolute start-0 end-0 px-0"
            style={{
              height: virtualRow.size,
              transform: `translateY(${virtualRow.start}px)`,
            }}
          >
            {renderRow(virtualRow.index)}
          </div>
        ))}
      </div>
    </div>
  );
}
