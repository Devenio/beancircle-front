'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { ChevronRight } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { Link } from '@/i18n/navigation';
import { Skeleton } from '@/components/ui/skeleton';

type MeProfile = {
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

export function SettingsAccountRow({ locale }: { locale: string }) {
  const t = useTranslations('settings');
  const { data: me, isLoading } = useQuery({
    queryKey: ['me', locale, 'settings-hub'],
    queryFn: () => api<MeProfile>('/users/me', { locale }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[72px] items-center gap-3 border-b border-border/80 bg-card px-4 py-3">
        <Skeleton className="size-14 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
    );
  }

  return (
    <Link
      href="/settings/account"
      className="flex min-h-[72px] items-center gap-3 border-b border-border/80 bg-card px-4 py-3 active:bg-muted/80"
    >
      <ProfileAvatar src={me?.avatarUrl} name={me?.name ?? me?.username} className="size-14" />
      <span className="min-w-0 flex-1 text-start">
        <span className="block text-[15px] font-semibold">{me?.name ?? t('addYourName')}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
          {me?.username ? `@${me.username}` : t('accountsCenterHint')}
        </span>
        {!me?.username ? (
          <span className="mt-0.5 block text-xs text-muted-foreground/90">{t('sections.accountDesc')}</span>
        ) : null}
      </span>
      <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/80 rtl:rotate-180" strokeWidth={2} />
    </Link>
  );
}
