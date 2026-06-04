'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Ban, Bell, BellOff, Flag, MessageCircle, Phone } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { UserAvatar } from '@/components/chat/user-avatar';
import { api } from '@/lib/api/client';
import { formatLastSeen } from '@/components/chat/utils';
import { useChatStore } from '@/stores/chat-store';
import { cn } from '@/lib/utils';
import { ChatProfileSharedTab } from '@/components/chat/chat-profile-shared-tab';
import type { ChatMember } from '@/components/chat/types';

type ChatProfileData = {
  user: ChatMember & {
    bio?: string | null;
    createdAt?: string;
    lastSeenAt?: string | null;
    showLastSeen?: boolean;
  };
  mutualFriendsCount: number;
  sharedGroupsCount: number;
  sharedMediaCount: number;
  sharedFilesCount: number;
  sharedLinksCount: number;
  muted: boolean;
};

type ChatProfileSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  locale: string;
  peer?: ChatMember;
  onMute: () => void;
  onBlock: () => void;
  onReport: () => void;
};

type Tab = 'overview' | 'media' | 'files' | 'links' | 'groups';

export function ChatProfileSheet({
  open,
  onOpenChange,
  conversationId,
  locale,
  peer,
  onMute,
  onBlock,
  onReport,
}: ChatProfileSheetProps) {
  const t = useTranslations('messages');
  const [tab, setTab] = useState<Tab>('overview');
  const onlineUserIds = useChatStore((s) => s.onlineUserIds);
  const getLastSeen = useChatStore((s) => s.getLastSeen);

  const { data, isLoading } = useQuery({
    queryKey: ['chat-profile', conversationId, locale],
    queryFn: () => api<ChatProfileData>(`/conversations/${conversationId}/profile`, { locale }),
    enabled: open && Boolean(conversationId),
  });

  const user = data?.user ?? peer;
  const online = user?.id ? onlineUserIds.has(user.id) : false;
  const lastSeenInfo = user?.id ? getLastSeen(user.id) : null;
  const lastSeenKey = online
    ? null
    : formatLastSeen(
        lastSeenInfo?.lastSeenAt ?? data?.user?.lastSeenAt ?? null,
        lastSeenInfo?.hidden ?? (data?.user?.showLastSeen === false),
      );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'overview', label: t('profileOverview') },
    { id: 'media', label: t('profileMedia'), count: data?.sharedMediaCount },
    { id: 'files', label: t('profileFiles'), count: data?.sharedFilesCount },
    { id: 'links', label: t('profileLinks'), count: data?.sharedLinksCount },
    { id: 'groups', label: t('profileGroups'), count: data?.sharedGroupsCount },
  ];

  const statusLabel = online
    ? t('online')
    : lastSeenKey === 'recently'
      ? t('lastSeenRecently')
      : lastSeenKey === 'just_now'
        ? t('lastSeenJustNow')
        : lastSeenKey === 'yesterday'
          ? t('lastSeenYesterday')
          : lastSeenKey?.startsWith('today:')
            ? t('lastSeenToday', { time: lastSeenKey.split(':')[1] ?? '' })
            : lastSeenKey?.endsWith('m')
              ? t('lastSeenMinutes', { count: parseInt(lastSeenKey, 10) || 0 })
              : lastSeenKey
                ? t('lastSeenDate', { date: lastSeenKey })
                : null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-3xl px-0 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <SheetHeader className="px-4 text-center">
          <div className="mx-auto mb-2">
            <UserAvatar
              src={user?.avatarUrl}
              name={user?.name ?? user?.username}
              online={online}
              size="lg"
              className="size-20"
            />
          </div>
          <SheetTitle className="text-xl">{user?.name ?? user?.username ?? '…'}</SheetTitle>
          {user?.username ? (
            <SheetDescription>@{user.username}</SheetDescription>
          ) : null}
          {statusLabel ? (
            <p className={cn('text-sm', online ? 'text-emerald-500' : 'text-muted-foreground')}>
              {statusLabel}
            </p>
          ) : null}
        </SheetHeader>

        <div className="mt-4 flex justify-center gap-2 px-4">
          <Button variant="secondary" className="rounded-full" onClick={() => onOpenChange(false)}>
            <MessageCircle className="size-4" />
            {t('message')}
          </Button>
          <Button variant="outline" className="rounded-full" disabled title={t('callComingSoon')}>
            <Phone className="size-4" />
            {t('call')}
          </Button>
        </div>

        <div className="mt-4 flex gap-1 overflow-x-auto px-4 no-scrollbar">
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
                tab === item.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground',
              )}
            >
              {item.label}
              {item.count != null && item.count > 0 ? ` (${item.count})` : ''}
            </button>
          ))}
        </div>

        <Separator className="my-4" />

        <div className="space-y-4 px-4">
          {isLoading ? (
            <p className="text-center text-sm text-muted-foreground">{t('loading')}</p>
          ) : tab === 'overview' ? (
            <>
              {data?.user?.bio ? (
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t('bio')}</p>
                  <p className="text-sm">{data.user.bio}</p>
                </div>
              ) : null}
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-lg font-semibold">{data?.mutualFriendsCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('mutualFriends')}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-lg font-semibold">{data?.sharedGroupsCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('sharedGroups')}</p>
                </div>
                <div className="rounded-xl bg-muted/50 p-3">
                  <p className="text-lg font-semibold">{data?.sharedMediaCount ?? 0}</p>
                  <p className="text-xs text-muted-foreground">{t('sharedMedia')}</p>
                </div>
              </div>
              {data?.user?.createdAt ? (
                <p className="text-xs text-muted-foreground">
                  {t('memberSince', {
                    date: new Date(data.user.createdAt).toLocaleDateString(undefined, {
                      month: 'long',
                      year: 'numeric',
                    }),
                  })}
                </p>
              ) : null}
            </>
          ) : tab === 'media' || tab === 'files' || tab === 'links' || tab === 'groups' ? (
            <ChatProfileSharedTab
              conversationId={conversationId}
              locale={locale}
              kind={tab}
              enabled={open}
            />
          ) : null}
        </div>

        <Separator className="my-4" />

        <div className="flex flex-col gap-1 px-2">
          <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={onMute}>
            {data?.muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            {data?.muted ? t('unmute') : t('muteNotifications')}
          </Button>
          <Button variant="ghost" className="justify-start gap-3 rounded-xl text-destructive" onClick={onBlock}>
            <Ban className="size-4" />
            {t('blockUser')}
          </Button>
          <Button variant="ghost" className="justify-start gap-3 rounded-xl" onClick={onReport}>
            <Flag className="size-4" />
            {t('reportUser')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
