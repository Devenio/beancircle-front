'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type SkeletonRow = {
  side: 'incoming' | 'outgoing';
  bubbleWidth: string;
  bubbleHeight: string;
  lines?: number;
};

const INITIAL_ROWS: SkeletonRow[] = [
  { side: 'incoming', bubbleWidth: 'w-[min(68%,17rem)]', bubbleHeight: 'h-12' },
  { side: 'incoming', bubbleWidth: 'w-[min(52%,13rem)]', bubbleHeight: 'h-10' },
  { side: 'outgoing', bubbleWidth: 'w-[min(58%,15rem)]', bubbleHeight: 'h-11' },
  { side: 'outgoing', bubbleWidth: 'w-[min(44%,11rem)]', bubbleHeight: 'h-9' },
  { side: 'incoming', bubbleWidth: 'w-[min(72%,18rem)]', bubbleHeight: 'h-14', lines: 2 },
  { side: 'outgoing', bubbleWidth: 'w-[min(64%,16rem)]', bubbleHeight: 'h-12' },
  { side: 'incoming', bubbleWidth: 'w-[min(46%,12rem)]', bubbleHeight: 'h-10' },
  { side: 'outgoing', bubbleWidth: 'w-[min(50%,13rem)]', bubbleHeight: 'h-10' },
];

const OLDER_ROWS: SkeletonRow[] = [
  { side: 'incoming', bubbleWidth: 'w-[min(60%,15rem)]', bubbleHeight: 'h-11' },
  { side: 'incoming', bubbleWidth: 'w-[min(48%,12rem)]', bubbleHeight: 'h-9' },
  { side: 'outgoing', bubbleWidth: 'w-[min(55%,14rem)]', bubbleHeight: 'h-10' },
];

function bubbleSkeletonTone(isMine: boolean) {
  return isMine
    ? 'bg-primary/30 dark:bg-primary/40'
    : 'bg-muted/90 dark:bg-muted/70';
}

function MessageSkeletonRow({ row }: { row: SkeletonRow }) {
  const isMine = row.side === 'outgoing';
  const tone = bubbleSkeletonTone(isMine);

  return (
    <div
      className={cn(
        'flex w-full max-w-[88%] gap-2 pb-1',
        isMine ? 'ms-auto justify-end' : 'me-auto justify-start',
      )}
    >
      {!isMine ? <Skeleton className={cn('size-7 shrink-0 self-end rounded-full', tone)} /> : null}
      <div className={cn('flex min-w-0 flex-col gap-1.5', isMine ? 'items-end' : 'items-start')}>
        <Skeleton
          className={cn(
            'shrink-0 rounded-[18px]',
            isMine ? 'rounded-br-[6px]' : 'rounded-bl-[6px]',
            row.bubbleWidth,
            row.bubbleHeight,
            tone,
          )}
        />
        {row.lines && row.lines > 1 ? (
          <Skeleton
            className={cn(
              'h-8 w-[min(72%,12rem)] shrink-0 rounded-[18px]',
              isMine ? 'rounded-tr-[6px]' : 'rounded-tl-[6px]',
              tone,
            )}
          />
        ) : null}
        <Skeleton className={cn('h-2.5 w-10 shrink-0 rounded-full opacity-80', tone)} />
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
              <Skeleton className="h-5 w-24 rounded-full bg-muted/90 dark:bg-muted/70" />
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
