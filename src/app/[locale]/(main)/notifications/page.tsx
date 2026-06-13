'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { CheckCheck } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type Notification = {
  id: string;
  type: string;
  read: boolean;
  actor?: { username?: string; avatarUrl?: string };
  createdAt: string;
};

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();

  const { data } = useQuery({
    queryKey: ['notifications', locale],
    queryFn: () => api<{ data: Notification[] }>('/notifications', { locale }),
  });

  const markOne = useMutation({
    mutationFn: (id: string) =>
      api(`/notifications/${id}/read`, { method: 'PATCH', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const markAll = useMutation({
    mutationFn: () => api('/notifications/read-all', { method: 'POST', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });

  const notifications = data?.data ?? [];
  const hasUnread = notifications.some((n) => !n.read);

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-bold">{t('title')}</h1>
        {hasUnread && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => markAll.mutate()}
            disabled={markAll.isPending}
            className="gap-1.5 text-xs text-muted-foreground"
          >
            <CheckCheck className="h-3.5 w-3.5" />
            Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 && (
        <p className="text-center text-neutral-500">{t('empty')}</p>
      )}

      {notifications.map((n) => (
        <button
          key={n.id}
          type="button"
          onClick={() => { if (!n.read) markOne.mutate(n.id); }}
          className={cn(
            'flex w-full items-center gap-3 border-b py-3 text-left transition',
            !n.read && 'bg-primary/5',
          )}
        >
          <div className="relative shrink-0">
            <Avatar src={n.actor?.avatarUrl} name={n.actor?.username} />
            {!n.read && (
              <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-background" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className={cn('text-sm', !n.read ? 'font-semibold' : 'font-medium')}>
              {n.type.replace(/_/g, ' ').toLowerCase()}
            </p>
            <p className="text-xs text-neutral-500">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        </button>
      ))}
    </div>
  );
}
