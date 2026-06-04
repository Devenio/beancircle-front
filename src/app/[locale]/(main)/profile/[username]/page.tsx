'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, ChevronRight, Settings, Stamp, Users } from 'lucide-react';
import { api } from '@/lib/api/client';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { BeanScorePanel } from '@/components/beanscore/beanscore-panel';
import { CollectionCard, StreakCard } from '@/components/profile/profile-stats';

export default function ProfilePage() {
  const { username, locale } = useParams<{ username: string; locale: string }>();
  const t = useTranslations('common');
  const tp = useTranslations('profile');
  const router = useRouter();
  const qc = useQueryClient();

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
        isFollowing?: boolean;
        isSelf?: boolean;
      }>(`/users/${username}`, { locale }),
  });

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
    enabled: !!profile?.isSelf,
  });

  const followMutation = useMutation({
    mutationFn: () =>
      api(`/users/${profile?.id}/follow`, {
        method: profile?.isFollowing ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile', username] }),
  });

  async function startChat() {
    if (!profile) return;
    const conv = await api<{ id: string }>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ participantId: profile.id }),
      locale,
    });
    router.push(`/messages/${conv.id}`);
  }

  if (!profile) return null;

  return (
    <div className="min-h-dvh pb-4">
      <div className="flex items-center justify-between px-4 pt-4">
        <h1 className="text-lg font-bold">@{profile.username}</h1>
        {profile.isSelf ? (
          <Button variant="ghost" size="icon" render={<Link href="/settings" />}>
            <Settings className="size-5" />
          </Button>
        ) : null}
      </div>

      <div className="flex items-center gap-4 px-4 pt-3">
        <Avatar src={profile.avatarUrl} name={profile.name} className="h-20 w-20" />
        <div className="flex flex-1 justify-around text-center">
          <Stat value={profile.postsCount} label={tp('posts')} />
          <Stat value={profile.followersCount} label={tp('followers')} />
          <Stat value={profile.followingCount} label={tp('following')} />
        </div>
      </div>
      <div className="px-4">
        <h2 className="mt-3 font-bold">{profile.name}</h2>
        {profile.bio ? <p className="mt-1 text-sm">{profile.bio}</p> : null}
      </div>

      {!profile.isSelf ? (
        <div className="mt-4 flex gap-2 px-4">
          <Button
            className="flex-1"
            variant={profile.isFollowing ? 'outline' : 'default'}
            onClick={() => followMutation.mutate()}
          >
            {profile.isFollowing ? t('unfollow') : t('follow')}
          </Button>
          <Button className="flex-1" variant="outline" onClick={startChat}>
            {t('message')}
          </Button>
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
      className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-b-0 hover:bg-muted/50"
    >
      <span className="text-muted-foreground">{icon}</span>
      <span className="flex-1 text-sm font-medium">{label}</span>
      <ChevronRight className="size-4 text-muted-foreground rtl:rotate-180" />
    </Link>
  );
}
