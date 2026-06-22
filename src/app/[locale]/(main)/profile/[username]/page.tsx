'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  CalendarDays,
  ChevronRight,
  Settings,
  ShieldCheck,
  Stamp,
  Users,
} from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { IdentityPill } from '@/components/cafe-os/identity-switcher';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
import { OnboardingChecklist } from '@/components/profile/onboarding-checklist';

export default function ProfilePage() {
  const { username, locale } = useParams<{ username: string; locale: string }>();
  const tp = useTranslations('profile');
  const tb = useTranslations('beans');
  const [shareOpen, setShareOpen] = useState(false);
  const isSuperAdmin = useAuthStore((s) => s.user?.role === 'SUPER_ADMIN');

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

  const isProfileIncomplete =
    profile.isSelf && (!profile.avatarUrl || !profile.name || !profile.bio);

  return (
    <div className="min-h-dvh pb-4">
      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold">@{profile.username}</h1>
        {profile.isSelf ? (
          <div className="flex items-center gap-1.5">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <IdentityPill />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  Switch between your personal profile and your café(s)
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button variant="ghost" size="icon" render={<Link href="/settings" />}>
              <Settings className="size-5" />
            </Button>
          </div>
        ) : null}
      </div>

      {/* ── Hero ── */}
      <div className="flex flex-col items-center px-4 pt-2 text-center">
        <Avatar src={profile.avatarUrl} name={profile.name} className="h-20 w-20" />
        <h2 className="mt-3 text-lg font-bold">{profile.name || `@${profile.username}`}</h2>
        {profile.bio ? (
          <p className="mt-1 max-w-[280px] text-sm text-muted-foreground">{profile.bio}</p>
        ) : null}

        {/* Stats */}
        <div className="mt-4 flex w-full max-w-xs items-center justify-around">
          <Stat value={profile.postsCount} label={tp('posts')} />
          <div className="h-8 w-px bg-border" />
          <Stat
            value={profile.followersCount}
            label={tp('friends')}
            tooltip="People who mutually follow each other"
          />
          <div className="h-8 w-px bg-border" />
          <Stat
            value={profile.followingCount}
            label={tp('connections')}
            tooltip="People you follow"
          />
        </div>

        {/* Actions */}
        {profile.isSelf ? (
          <div className="mt-4 flex w-full max-w-xs gap-2">
            <Button
              variant="outline"
              className="flex-1"
              render={<Link href="/settings/account" />}
            >
              {tp('editProfile')}
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

        {profile.isSelf && isSuperAdmin ? (
          <Button className="mt-2 w-full max-w-xs" render={<Link href="/admin" />}>
            <ShieldCheck className="size-4" />
            Admin Panel
          </Button>
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

      {/* ── Onboarding checklist (self only, when profile incomplete) ── */}
      {isProfileIncomplete ? (
        <div className="mt-5">
          <OnboardingChecklist profileData={profile} locale={locale} />
        </div>
      ) : null}

      {/* ── Other user actions ── */}
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

      {/* ── Badges ── */}
      <div className="mt-4">
        <CollectiblesBadges
          userId={profile.id}
          isSelf={!!profile.isSelf}
          locale={locale}
        />
      </div>

      {/* ── Self sections ── */}
      {profile.isSelf ? (
        <div className="mt-4 space-y-3 px-4">
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

      {/* ── Bean feed ── */}
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
      <div className="flex flex-col items-center px-4 pt-2">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="mt-3 h-5 w-40" />
        <Skeleton className="mt-2 h-4 w-56" />
        <div className="mt-4 flex w-full max-w-xs justify-around">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <Skeleton className="h-5 w-8" />
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        <div className="mt-4 flex w-full max-w-xs gap-2">
          <Skeleton className="h-10 flex-1 rounded-xl" />
          <Skeleton className="h-10 flex-1 rounded-xl" />
        </div>
      </div>
      <div className="mt-6 space-y-3 px-4">
        <Skeleton className="h-24 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
      </div>
    </div>
  );
}

function Stat({ value, label, tooltip }: { value: number; label: string; tooltip?: string }) {
  const inner = (
    <div className={tooltip ? 'cursor-help' : ''}>
      <p className="font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );

  if (!tooltip) return inner;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>{inner}</TooltipTrigger>
        <TooltipContent>{tooltip}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
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
