'use client';

import { Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { UserAvatar } from '@/components/chat/user-avatar';
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
  onStartChat: (user: SearchUser) => void;
  className?: string;
};

export function UserSearchResults({
  users,
  startingUserId,
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
      <ul className="flex flex-col gap-0.5">
        {users.map((user) => {
          const displayName = user.name ?? user.username ?? t('unknownUser');
          const starting = startingUserId === user.id;
          return (
            <li key={user.id}>
              <button
                type="button"
                disabled={starting}
                onClick={() => onStartChat(user)}
                className="flex w-full min-h-[56px] items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors active:bg-muted/60 disabled:opacity-60"
              >
                <UserAvatar src={user.avatarUrl} name={displayName} size="lg" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[15px] font-semibold">{displayName}</p>
                  {user.username ? (
                    <p className="truncate text-xs text-muted-foreground">@{user.username}</p>
                  ) : null}
                </div>
                {starting ? (
                  <Loader2 className="size-4 shrink-0 animate-spin text-muted-foreground" />
                ) : (
                  <span className="shrink-0 text-xs font-semibold text-primary">{t('messageUser')}</span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
