'use client';

import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { BeanCard } from '@/components/beans/bean-card';
import { BeanComposer } from '@/components/beans/bean-composer';
import { BeanComposerSheet } from '@/components/beans/bean-composer-sheet';
import { BeanCardSkeleton, BeanFeed } from '@/components/beans/bean-feed';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { getBean, getBeanReplies, type Bean } from '@/lib/api/beans';

export default function BeanDetailPage() {
  const t = useTranslations('beans');
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();
  const [quoting, setQuoting] = useState<Bean | null>(null);

  const { data: bean, isLoading } = useQuery({
    queryKey: ['bean', id, locale],
    queryFn: () => getBean(id, locale),
  });

  return (
    <div className="min-h-dvh pb-36">
      <header className="sticky top-0 z-10 flex items-center gap-2 border-b border-border bg-background/95 px-2 py-3 backdrop-blur-md">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()}>
          <ArrowLeft className="size-5 rtl:rotate-180" />
        </Button>
        <h1 className="font-bold leading-none">{t('detailTitle')}</h1>
      </header>

      {isLoading || !bean ? (
        <BeanCardSkeleton />
      ) : (
        <>
          {bean.parent ? (
            <p className="px-4 pt-3 text-xs text-muted-foreground">
              {t('replyingTo', {
                name:
                  bean.parent.author.name || bean.parent.author.username || '',
              })}{' '}
              ·{' '}
              <Link href={`/bean/${bean.parent.id}`} className="text-primary">
                {t('viewConversation')}
              </Link>
            </p>
          ) : null}
          <BeanCard bean={bean} locale={locale} detail onQuote={setQuoting} />
        </>
      )}

      <h2 className="px-4 pt-4 pb-1 text-sm font-semibold text-muted-foreground">
        {t('replies')}
      </h2>
      <BeanFeed
        queryKey={['beans', 'replies', id, locale]}
        fetchPage={(cursor) => getBeanReplies(id, locale, cursor)}
        locale={locale}
        emptyTitle={t('noRepliesTitle')}
        emptyBody={t('noRepliesBody')}
      />

      <div className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-border bg-background/95 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md">
        <BeanComposer locale={locale} parentId={id} compact />
      </div>

      <BeanComposerSheet
        open={!!quoting}
        onOpenChange={(open) => !open && setQuoting(null)}
        locale={locale}
        quotedBean={quoting}
      />
    </div>
  );
}
