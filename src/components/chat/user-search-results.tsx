'use client';

import { ChevronRight, Loader2, MessageCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/chat/user-avatar';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

export type SearchUser = {
  id: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

type UserSearchResultsProps = {
  users: SearchUser[];
  startingUserId?: string | null;
  existingChatUserIds?: Set<string>;
  errorMessage?: string | null;
  onStartChat: (user: SearchUser) => void;
  className?: string;
};

export function UserSearchResults({
  users,
  startingUserId,
  existingChatUserIds,
  errorMessage,
  onStartChat,
  className,
}: UserSearchResultsProps) {
  const t = useTranslations('messages');

  if (users.length === 0) return null;

  return (
    <section className={cn('px-2', className)}>
      <h2 className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {t('searchPeople')}
      </h2>
      {errorMessage ? (
        <p className="mx-3 mb-2 rounded-xl bg-destructive/10 px-3 py-2 text-xs text-destructive">
          {errorMessage}
        </p>
      ) : null}
      <ul className="flex flex-col gap-1">
        {users.map((user) => {
          const displayName = user.name ?? user.username ?? t('unknownUser');
          const starting = startingUserId === user.id;
          const hasChat = existingChatUserIds?.has(user.id);
          const profileHref = user.username ? `/profile/${user.username}` : null;

          return (
            <li key={user.id}>
              <div className="flex min-h-[60px] items-center gap-2 rounded-2xl border border-transparent bg-muted/20 px-2 py-1.5 transition-colors hover:border-border/60 hover:bg-muted/40">
                {profileHref ? (
                  <Link
                    href={profileHref}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 active:bg-muted/60"
                  >
                    <UserAvatar src={user.avatarUrl} name={displayName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{displayName}</p>
                      {user.username ? (
                        <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                      ) : null}
                    </div>
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground/70" />
                  </Link>
                ) : (
                  <div className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2">
                    <UserAvatar src={user.avatarUrl} name={displayName} size="lg" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[15px] font-semibold">{displayName}</p>
                    </div>
                  </div>
                )}
                <button
                  type="button"
                  disabled={starting}
                  onClick={() => onStartChat(user)}
                  className={cn(
                    'inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition-colors',
                    'bg-primary text-primary-foreground active:opacity-90 disabled:opacity-60',
                  )}
                >
                  {starting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <MessageCircle className="size-3.5" />
                  )}
                  {hasChat ? t('openChat') : t('messageUser')}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
