'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonRow = {
  side: 'incoming' | 'outgoing';
  width: string;
  height: string;
  lines?: number;
};

const INITIAL_ROWS: SkeletonRow[] = [
  { side: 'incoming', width: 'w-[68%]', height: 'h-12' },
  { side: 'incoming', width: 'w-[52%]', height: 'h-10' },
  { side: 'outgoing', width: 'w-[58%]', height: 'h-11' },
  { side: 'outgoing', width: 'w-[44%]', height: 'h-9' },
  { side: 'incoming', width: 'w-[72%]', height: 'h-14', lines: 2 },
  { side: 'outgoing', width: 'w-[64%]', height: 'h-12' },
  { side: 'incoming', width: 'w-[46%]', height: 'h-10' },
  { side: 'outgoing', width: 'w-[50%]', height: 'h-10' },
];

const OLDER_ROWS: SkeletonRow[] = [
  { side: 'incoming', width: 'w-[60%]', height: 'h-11' },
  { side: 'incoming', width: 'w-[48%]', height: 'h-9' },
  { side: 'outgoing', width: 'w-[55%]', height: 'h-10' },
];

function MessageSkeletonRow({ row }: { row: SkeletonRow }) {
  const isMine = row.side === 'outgoing';

  return (
    <div className={cn('flex w-full gap-2 pb-1', isMine ? 'justify-end' : 'justify-start')}>
      {!isMine ? <Skeleton className="size-7 shrink-0 self-end rounded-full" /> : null}
      <div className={cn('flex min-w-0 flex-col gap-1.5', isMine ? 'items-end' : 'items-start')}>
        <Skeleton
          className={cn(
            'rounded-[18px]',
            isMine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]',
            row.width,
            row.height,
          )}
        />
        {row.lines && row.lines > 1 ? (
          <Skeleton className={cn('rounded-[18px]', isMine ? 'rounded-tr-[6px]' : 'rounded-tl-[6px]', 'w-[38%] h-8')} />
        ) : null}
        <Skeleton className="h-2.5 w-10 rounded-full opacity-60" />
      </div>
    </div>
  );
}

type ChatMessagesSkeletonProps = {
  rows?: SkeletonRow[];
  showDateSeparator?: boolean;
  className?: string;
  label?: string;
};

export function ChatMessagesSkeleton({
  rows = INITIAL_ROWS,
  showDateSeparator = true,
  className,
  label = 'Loading messages',
}: ChatMessagesSkeletonProps) {
  const separatorIndex = Math.floor(rows.length / 2);

  return (
    <div
      className={cn('flex flex-col gap-3 pb-2', className)}
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      {rows.map((row, index) => (
        <div key={index}>
          {showDateSeparator && index === separatorIndex ? (
            <div className="mb-3 flex items-center justify-center">
              <Skeleton className="h-5 w-24 rounded-full" />
            </div>
          ) : null}
          <MessageSkeletonRow row={row} />
        </div>
      ))}
    </div>
  );
}

export function ChatOlderMessagesSkeleton({ label = 'Loading older messages' }: { label?: string }) {
  return (
    <div
      className="pointer-events-none w-full pb-3"
      role="status"
      aria-busy="true"
      aria-label={label}
    >
      <span className="sr-only">{label}</span>
      <div className="mb-3 flex flex-col gap-2.5">
        {OLDER_ROWS.map((row, index) => (
          <MessageSkeletonRow key={index} row={row} />
        ))}
      </div>
    </div>
  );
}
