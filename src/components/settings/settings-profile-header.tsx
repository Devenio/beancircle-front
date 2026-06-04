'use client';

import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { BadgeCheck, Pencil, Share2, UserRound } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';

type MeProfile = {
  id: string;
  username?: string | null;
  name?: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
};

export function SettingsProfileHeader({ locale }: { locale: string }) {
  const t = useTranslations('settings');

  const { data: me, isLoading } = useQuery({
    queryKey: ['me', locale, 'settings'],
    queryFn: () => api<MeProfile>('/users/me', { locale }),
  });

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
        <Skeleton className="h-24 w-full rounded-none" />
        <div className="px-4 pb-4">
          <Skeleton className="-mt-10 size-20 rounded-full" />
          <Skeleton className="mt-3 h-5 w-40" />
          <Skeleton className="mt-2 h-4 w-28" />
        </div>
      </div>
    );
  }

  const memberSince = me?.createdAt
    ? new Date(me.createdAt).toLocaleDateString(locale, { month: 'long', year: 'numeric' })
    : null;

  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm">
      <div
        className="h-24 bg-gradient-to-br from-primary/30 via-accent to-muted"
        style={{ background: 'linear-gradient(135deg, color-mix(in oklch, var(--primary) 35%, transparent), var(--muted))' }}
      />
      <div className="relative px-4 pb-4">
        <div className="-mt-10 flex items-end justify-between gap-3">
          <ProfileAvatar
            src={me?.avatarUrl}
            name={me?.name ?? me?.username}
            className="size-20 ring-4 ring-card"
          />
          <span className="mb-1 inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
            <BadgeCheck className="size-3 opacity-40" />
            {t('verifiedSoon')}
          </span>
        </div>
        <h2 className="mt-3 text-lg font-bold leading-tight">{me?.name ?? t('addYourName')}</h2>
        {me?.username ? (
          <p className="text-sm text-muted-foreground">@{me.username}</p>
        ) : null}
        {me?.bio ? <p className="mt-2 text-sm leading-relaxed">{me.bio}</p> : null}
        {memberSince ? (
          <p className="mt-2 text-xs text-muted-foreground">{t('memberSince', { date: memberSince })}</p>
        ) : null}
        <div className="mt-4 flex flex-wrap gap-2">
          <Button size="sm" variant="default" className="min-h-10" render={<Link href="/settings/account" />}>
            <Pencil className="size-4" />
            {t('editProfile')}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="min-h-10"
            onClick={() => {
              if (me?.username && navigator.share) {
                void navigator.share({ title: me.name ?? me.username, url: `${window.location.origin}/profile/${me.username}` });
              }
            }}
          >
            <Share2 className="size-4" />
            {t('shareProfile')}
          </Button>
          {me?.username ? (
            <Button size="sm" variant="outline" className="min-h-10" render={<Link href={`/profile/${me.username}`} />}>
              <UserRound className="size-4" />
              {t('viewPublicProfile')}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function SettingsHubSkeleton() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-11 w-full rounded-xl" />
      <Skeleton className="h-44 w-full rounded-2xl" />
      <Skeleton className="h-64 w-full rounded-2xl" />
    </div>
  );
}
