'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { ExternalLink, FileText, Play, Users } from 'lucide-react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { formatFileSize } from '@/components/chat/utils';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type SharedKind = 'media' | 'files' | 'links' | 'groups';

type MediaItem = {
  messageId: string;
  createdAt: string;
  type: string;
  url: string;
  thumbnailUrl?: string;
  name?: string;
};

type FileItem = {
  messageId: string;
  createdAt: string;
  url: string;
  name: string;
  mimeType?: string;
  size?: number;
};

type LinkItem = {
  messageId: string;
  createdAt: string;
  url: string;
  label: string;
};

type GroupItem = {
  id: string;
  name: string;
  slug: string;
  emoji?: string | null;
  memberCount: number;
  coverUrl?: string | null;
};

type SharedResponse<T> = {
  data: T[];
  nextCursor?: string | null;
};

type ChatProfileSharedTabProps = {
  conversationId: string;
  locale: string;
  kind: SharedKind;
  enabled: boolean;
};

function hostname(url: string) {
  try {
    return new URL(url).hostname.replace('www.', '');
  } catch {
    return url;
  }
}

export function ChatProfileSharedTab({
  conversationId,
  locale,
  kind,
  enabled,
}: ChatProfileSharedTabProps) {
  const t = useTranslations('messages');

  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useInfiniteQuery({
      queryKey: ['chat-shared', conversationId, kind, locale],
      queryFn: ({ pageParam }) =>
        api<SharedResponse<MediaItem | FileItem | LinkItem | GroupItem>>(
          `/conversations/${conversationId}/shared?type=${kind}${pageParam ? `&cursor=${pageParam}` : ''}`,
          { locale },
        ),
      initialPageParam: undefined as string | undefined,
      getNextPageParam: (last) => last.nextCursor ?? undefined,
      enabled: enabled && Boolean(conversationId),
    });

  const items = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-xl" />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-muted-foreground">
        {t('profileTabEmpty', {
          tab:
            kind === 'media'
              ? t('profileMedia')
              : kind === 'files'
                ? t('profileFiles')
                : kind === 'links'
                  ? t('profileLinks')
                  : t('profileGroups'),
        })}
      </p>
    );
  }

  if (kind === 'media') {
    const media = items as MediaItem[];
    return (
      <>
        <div className="grid grid-cols-3 gap-1.5">
          {media.map((item) => (
            <a
              key={item.messageId}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
            >
              {item.type === 'video' ? (
                <div className="flex h-full items-center justify-center bg-black/80">
                  <Play className="size-8 text-white/90" />
                </div>
              ) : (
                <Image
                  src={item.thumbnailUrl ?? item.url}
                  alt=""
                  fill
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                  sizes="120px"
                  unoptimized
                />
              )}
            </a>
          ))}
        </div>
        {hasNextPage ? (
          <LoadMoreButton loading={isFetchingNextPage} onClick={() => void fetchNextPage()} />
        ) : null}
      </>
    );
  }

  if (kind === 'files') {
    const files = items as FileItem[];
    return (
      <>
        <div className="flex flex-col gap-2">
          {files.map((item) => (
            <a
              key={item.messageId}
              href={item.url}
              download={item.name}
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                <FileText className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(item.size) || new Date(item.createdAt).toLocaleDateString()}
                </p>
              </div>
            </a>
          ))}
        </div>
        {hasNextPage ? (
          <LoadMoreButton loading={isFetchingNextPage} onClick={() => void fetchNextPage()} />
        ) : null}
      </>
    );
  }

  if (kind === 'links') {
    const links = items as LinkItem[];
    return (
      <>
        <div className="flex flex-col gap-2">
          {links.map((item) => (
            <a
              key={`${item.messageId}-${item.url}`}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
            >
              <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background">
                <ExternalLink className="size-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{hostname(item.url)}</p>
                <p className="truncate text-xs text-muted-foreground">{item.url}</p>
              </div>
            </a>
          ))}
        </div>
        {hasNextPage ? (
          <LoadMoreButton loading={isFetchingNextPage} onClick={() => void fetchNextPage()} />
        ) : null}
      </>
    );
  }

  const groups = items as GroupItem[];
  return (
    <>
      <div className="flex flex-col gap-2">
        {groups.map((item) => (
          <Link
            key={item.id}
            href={`/squads/${item.slug}`}
            className="flex items-center gap-3 rounded-xl border border-border bg-muted/30 p-3 transition-colors hover:bg-muted/60"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-background text-lg">
              {item.emoji ?? <Users className="size-5 text-primary" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{item.name}</p>
              <p className="text-xs text-muted-foreground">
                {t('groupMemberCount', { count: item.memberCount })}
              </p>
            </div>
          </Link>
        ))}
      </div>
      {hasNextPage ? (
        <LoadMoreButton loading={isFetchingNextPage} onClick={() => void fetchNextPage()} />
      ) : null}
    </>
  );
}

function LoadMoreButton({ loading, onClick }: { loading: boolean; onClick: () => void }) {
  const t = useTranslations('messages');
  return (
    <button
      type="button"
      disabled={loading}
      onClick={onClick}
      className={cn(
        'mt-4 w-full rounded-full py-2 text-sm font-medium text-primary transition-opacity',
        loading && 'opacity-60',
      )}
    >
      {loading ? t('loading') : t('loadMore')}
    </button>
  );
}
