'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';

export default function ExplorePage() {
  const t = useTranslations('search');
  const { locale } = useParams<{ locale: string }>();
  const [q, setQ] = useState('');

  const { data } = useQuery({
    queryKey: ['search', q, locale],
    queryFn: () => api<{ users: unknown[]; cafes: unknown[] }>(`/search?q=${encodeURIComponent(q)}`, { locale }),
    enabled: q.length >= 2,
  });

  return (
    <div className="p-4">
      <h1 className="mb-4 text-lg font-bold">{t('placeholder')}</h1>
      <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={t('placeholder')} />
      {data?.users && data.users.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">{t('users')}</h2>
          {(data.users as { id: string; username?: string; name?: string; avatarUrl?: string }[]).map((u) => (
            <Link key={u.id} href={`/profile/${u.username}`} className="flex items-center gap-3 py-2">
              <Avatar src={u.avatarUrl} name={u.name} />
              <span className="font-medium">{u.username ?? u.name}</span>
            </Link>
          ))}
        </section>
      )}
      {data?.cafes && data.cafes.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-neutral-500">{t('cafes')}</h2>
          {(data.cafes as { id: string; name: string }[]).map((c) => (
            <Link key={c.id} href={`/cafe/${c.id}`} className="block py-2 font-medium">
              {c.name}
            </Link>
          ))}
        </section>
      )}
    </div>
  );
}
