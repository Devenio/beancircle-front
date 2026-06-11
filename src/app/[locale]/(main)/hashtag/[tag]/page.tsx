'use client';

import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { BeanFeed } from '@/components/beans/bean-feed';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/i18n/navigation';
import { getBeansForHashtag } from '@/lib/api/beans';

export default function HashtagPage() {
  const t = useTranslations('beans');
  const { tag, locale } = useParams<{ tag: string; locale: string }>();
  const router = useRouter();
  const decoded = decodeURIComponent(tag);

  return (
    <div className="min-h-dvh pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-2 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <div>
          <h1 className="font-bold leading-none">#{decoded}</h1>
          <p className="text-xs text-muted-foreground">{t('hashtagSubtitle')}</p>
        </div>
      </header>
      <BeanFeed
        queryKey={['beans', 'hashtag', decoded, locale]}
        fetchPage={(cursor) => getBeansForHashtag(decoded, locale, cursor)}
        locale={locale}
      />
    </div>
  );
}
