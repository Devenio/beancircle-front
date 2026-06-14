'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronRight, Settings, Stamp, Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import { IdentityPill } from '@/components/cafe-os/identity-switcher';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Link } from '@/i18n/navigation';
import { BeanScorePanel } from '@/components/beanscore/beanscore-panel';
import { CollectionCard, StreakCard } from '@/components/profile/profile-stats';
import { FriendActionButton } from '@/components/discover/people/friend-action-button';
import type { DiscoverPerson } from '@/components/discover/people/types';
import { BeanFeed } from '@/components/beans/bean-feed';
import { getBeansForUser } from '@/lib/api/beans';
import { ReportDialog } from '@/components/report/report-dialog';
import { CollectiblesBadges } from '@/components/profile/collectibles-badges';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareProfileSheet } from '@/components/profile/share-profile-sheet';

export default function ProfilePage() {
  const { username, locale } = useParams<{ username: string; locale: string }>();
  const tp = useTranslations('profile');
  const tb = useTranslations('beans');
  const [shareOpen, setShareOpen] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ['profile', username, locale],
    queryFn: () =>
      api<{
        id: string;
        username?: string;
        name?: string;
        bio?: string;
        avatarUrl?: string;
        cityId?: string;
        followersCount: number;
        followingCount: number;
        postsCount: number;
        isSelf?: boolean;
      }>(`/users/${username}`, { locale }),
  });

  const { data: relationship } = useQuery({
    queryKey: ['friends', 'status', profile?.id, locale],
    queryFn: () =>
      api<'none' | 'pending_out' | 'pending_in' | 'friends' | 'self'>(
        `/friends/status?userId=${encodeURIComponent(profile!.id)}`,
        { locale },
      ),
    enabled: !!profile && !profile.isSelf,
  });

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
    enabled: !!profile?.isSelf,
  });

  if (!profile) return <ProfileSkeleton />;

  const person: DiscoverPerson | null =
    !profile.isSelf && relationship && relationship !== 'self'
      ? {
          id: profile.id,
          name: profile.name,
          username: profile.username,
          avatarUrl: profile.avatarUrl,
          mutualFriendsCount: 0,
          sharedInterests: [],
          sharedGroupsCount: 0,
          lastActive: 'offline',
          relationship:
            relationship === 'none' ||
            relationship === 'pending_out' ||
            relationship === 'pending_in' ||
            relationship === 'friends'
              ? relationship
              : 'none',
        }
      : null;

  return (
    <div className="min-h-dvh pb-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold">@{profile.username}</h1>
        {profile.isSelf ? (
          <div className="flex items-center gap-1.5">
            <IdentityPill />
            <Button variant="ghost" size="icon" render={<Link href="/settings" />}>
              <Settings className="size-5" />
            </Button>
          </div>
        ) : null}
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <Avatar src={profile.avatarUrl} name={profile.name} className="h-20 w-20" />
        <div className="flex flex-1 justify-around text-center">
          <Stat value={profile.postsCount} label={tp('posts')} />
          <Stat value={profile.followersCount} label={tp('friends')} />
          <Stat value={profile.followingCount} label={tp('connections')} />
        </div>
      </div>
      <div className="px-4">
        <h2 className="mt-3 font-bold">{profile.name}</h2>
        {profile.bio ? <p className="mt-1 text-sm">{profile.bio}</p> : null}

        {profile.isSelf ? (
          <div className="mt-3 flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              render={<Link href="/settings/account" />}
            >
              Edit Profile
            </Button>
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setShareOpen(true)}
            >
              Share Profile
            </Button>
          </div>
        ) : null}
      </div>

      {profile.isSelf ? (
        <ShareProfileSheet
          username={profile.username ?? username}
          locale={locale}
          open={shareOpen}
          onOpenChange={setShareOpen}
        />
      ) : null}

      <div className="mt-4">
        <CollectiblesBadges
          userId={profile.id}
          isSelf={!!profile.isSelf}
          locale={locale}
        />
      </div>

      {person ? (
        <div className="mt-4 flex items-center gap-2 px-4">
          <div className="flex-1">
            <FriendActionButton person={person} />
          </div>
          <ReportDialog
            targetType="USER"
            targetId={profile.id}
            locale={locale}
            trigger={
              <button
                type="button"
                className="rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground hover:text-destructive"
              >
                Report
              </button>
            }
          />
        </div>
      ) : null}

      {profile.isSelf ? (
        <div className="mt-4 space-y-4 px-4">
          <StreakCard locale={locale} />
          <CollectionCard locale={locale} />
          <BeanScorePanel locale={locale} cityId={me?.cityId} />

          <div className="overflow-hidden rounded-2xl border border-border">
            <NavRow href="/passport" icon={<Stamp className="size-4" />} label={tp('myPassport')} />
            <NavRow href="/squads" icon={<Users className="size-4" />} label={tp('mySquads')} />
            <NavRow href="/events" icon={<CalendarDays className="size-4" />} label={tp('upcomingEvents')} />
          </div>
        </div>
      ) : null}

      {profile.username ? (
        <div className="mt-6">
          <h2 className="border-b border-border px-4 pb-2 text-sm font-semibold text-muted-foreground">
            {profile.isSelf ? tb('myBeans') : tb('userBeans')}
          </h2>
          <BeanFeed
            queryKey={['beans', 'user', profile.username, locale]}
            fetchPage={(cursor) => getBeansForUser(profile.username!, locale, cursor)}
            locale={locale}
            emptyTitle={tb('profileEmptyTitle')}
            emptyBody={tb('profileEmptyBody')}
          />
        </div>
      ) : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="min-h-dvh pb-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <Skeleton className="h-6 w-32" />
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <Skeleton className="h-20 w-20 rounded-full" />
        <div className="flex flex-1 justify-around">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
      </div>

      <div className="px-4">
        <Skeleton className="mt-3 h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-3/4" />
      </div>

      <div className="mt-6 space-y-4 px-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function NavRow({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0 transition hover:bg-accent"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground" />
    </Link>
  );
}
