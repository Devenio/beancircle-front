'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/i18n/navigation';
import { BeanScorePanel } from '@/components/beanscore/beanscore-panel';
import { useAuthStore } from '@/stores/auth-store';

export default function ProfilePage() {
  const { username, locale } = useParams<{ username: string; locale: string }>();
  const t = useTranslations('common');
  const router = useRouter();
  const qc = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);

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
    <div className="p-4">
      <div className="flex items-center gap-4">
        <Avatar src={profile.avatarUrl} name={profile.name} className="h-20 w-20" />
        <div className="flex flex-1 justify-around text-center">
          <div>
            <p className="font-bold">{profile.postsCount}</p>
            <p className="text-xs text-neutral-500">posts</p>
          </div>
          <div>
            <p className="font-bold">{profile.followersCount}</p>
            <p className="text-xs text-neutral-500">followers</p>
          </div>
          <div>
            <p className="font-bold">{profile.followingCount}</p>
            <p className="text-xs text-neutral-500">following</p>
          </div>
        </div>
      </div>
      <h1 className="mt-3 font-bold">{profile.name}</h1>
      <p className="text-sm text-neutral-500">@{profile.username}</p>
      {profile.bio && <p className="mt-2 text-sm">{profile.bio}</p>}
      {!profile.isSelf && (
        <div className="mt-4 flex gap-2">
          <Button
            variant={profile.isFollowing ? 'outline' : 'default'}
            onClick={() => followMutation.mutate()}
          >
            {profile.isFollowing ? t('unfollow') : t('follow')}
          </Button>
          <Button variant="outline" onClick={startChat}>
            {t('message')}
          </Button>
        </div>
      )}
      {profile.isSelf && (
        <div className="mt-4 space-y-4">
          <BeanScorePanel locale={locale} cityId={me?.cityId} />
          <Link href="/settings" className="inline-block text-sm text-blue-600">
            Settings
          </Link>
        </div>
      )}
    </div>
  );
}
