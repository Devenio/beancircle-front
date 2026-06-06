'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { X } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { FriendActionButton } from './friend-action-button';
import type { DiscoverPerson, FriendRequestItem } from './types';

type Props = {
  open: boolean;
  onClose: () => void;
};

export function FriendRequestsSheet({ open, onClose }: Props) {
  const t = useTranslations('discover.people');
  const { locale } = useParams<{ locale: string }>();

  const { data } = useQuery({
    queryKey: ['friends', 'requests', locale],
    queryFn: () =>
      api<{ incoming: FriendRequestItem[]; outgoing: FriendRequestItem[] }>(
        '/friends/requests',
        { locale },
      ),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40">
      <button type="button" className="flex-1" aria-label="Close" onClick={onClose} />
      <div className="max-h-[70dvh] overflow-y-auto rounded-t-2xl bg-background p-4 pb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold">{t('friendRequests')}</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="size-5" />
          </Button>
        </div>
        <section>
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t('incoming')}</h3>
          {data?.incoming.length ? (
            data.incoming.map((req) => {
              const sender = req.sender!;
              const person: DiscoverPerson = {
                id: sender.id,
                name: sender.name,
                username: sender.username,
                avatarUrl: sender.avatarUrl,
                mutualFriendsCount: 0,
                sharedInterests: [],
                sharedGroupsCount: 0,
                lastActive: 'offline',
                relationship: 'pending_in',
              };
              return (
                <div key={req.id} className="mb-3 flex items-center gap-3 rounded-xl border p-3">
                  <ProfileAvatar src={sender.avatarUrl} name={sender.name} className="size-12" />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{sender.name ?? sender.username}</p>
                    <FriendActionButton person={person} requestId={req.id} compact />
                  </div>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{t('noIncoming')}</p>
          )}
        </section>
        <section className="mt-6">
          <h3 className="mb-2 text-sm font-semibold text-muted-foreground">{t('outgoing')}</h3>
          {data?.outgoing.length ? (
            data.outgoing.map((req) => {
              const receiver = req.receiver!;
              return (
                <div key={req.id} className="mb-2 flex items-center gap-3 py-2">
                  <ProfileAvatar
                    src={receiver.avatarUrl}
                    name={receiver.name}
                    className="size-10"
                  />
                  <span className="flex-1 text-sm">{receiver.name ?? receiver.username}</span>
                  <span className="text-xs text-muted-foreground">{t('pending')}</span>
                </div>
              );
            })
          ) : (
            <p className="text-sm text-muted-foreground">{t('noOutgoing')}</p>
          )}
        </section>
      </div>
    </div>
  );
}
