'use client';

import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { useRouter, Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Settings } from 'lucide-react';

export default function ProfileRedirectPage() {
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const t = useTranslations('settings');

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ username?: string }>('/users/me', { locale }),
  });

  useEffect(() => {
    if (me?.username) router.replace(`/profile/${me.username}`);
  }, [me, router]);

  return (
    <div className="p-4">
      <Link href="/settings" className="flex items-center gap-2 text-sm">
        <Settings className="h-4 w-4" />
        {t('title')}
      </Link>
    </div>
  );
}
