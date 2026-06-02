'use client';

import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { CommunityFeed } from '@/components/community/community-feed';
import { ChallengesSection } from '@/components/community/challenges-section';
import { EventsSection } from '@/components/community/events-section';

export default function CommunityPage() {
  const { locale } = useParams<{ locale: string }>();
  const t = useTranslations('community');

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
  });

  return (
    <div>
      <header className="border-b px-4 py-3">
        <h1 className="text-lg font-bold">{t('title')}</h1>
        <p className="text-sm text-muted-foreground">{t('subtitle')}</p>
      </header>
      <ChallengesSection locale={locale} cityId={me?.cityId} />
      <EventsSection locale={locale} cityId={me?.cityId} />
      <CommunityFeed locale={locale} />
    </div>
  );
}
