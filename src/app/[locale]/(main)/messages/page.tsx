'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { Avatar } from '@/components/ui/avatar';

export default function MessagesPage() {
  const t = useTranslations('messages');
  const { locale } = useParams<{ locale: string }>();

  const { data } = useQuery({
    queryKey: ['conversations', locale],
    queryFn: () =>
      api<
        {
          id: string;
          otherMember?: { username?: string; name?: string; avatarUrl?: string };
          lastMessage?: { body?: string };
        }[]
      >('/conversations', { locale }),
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('title')}</h1>
      {data?.map((c) => (
        <Link
          key={c.id}
          href={`/messages/${c.id}`}
          className="flex items-center gap-3 border-b border-neutral-100 py-3"
        >
          <Avatar src={c.otherMember?.avatarUrl} name={c.otherMember?.name} />
          <div className="min-w-0 flex-1">
            <p className="font-medium">{c.otherMember?.username ?? c.otherMember?.name}</p>
            <p className="truncate text-sm text-neutral-500">{c.lastMessage?.body}</p>
          </div>
        </Link>
      ))}
    </div>
  );
}
