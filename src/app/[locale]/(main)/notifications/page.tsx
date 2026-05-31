'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';

export default function NotificationsPage() {
  const t = useTranslations('notifications');
  const { locale } = useParams<{ locale: string }>();

  const { data } = useQuery({
    queryKey: ['notifications', locale],
    queryFn: () =>
      api<{
        data: {
          id: string;
          type: string;
          actor?: { username?: string; avatarUrl?: string };
          createdAt: string;
        }[];
      }>('/notifications', { locale }),
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('title')}</h1>
      {!data?.data?.length && (
        <p className="text-center text-neutral-500">{t('empty')}</p>
      )}
      {data?.data?.map((n) => (
        <div key={n.id} className="flex items-center gap-3 border-b py-3">
          <Avatar src={n.actor?.avatarUrl} name={n.actor?.username} />
          <div>
            <p className="text-sm font-medium">{n.type.replace(/_/g, ' ')}</p>
            <p className="text-xs text-neutral-500">
              {new Date(n.createdAt).toLocaleString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
