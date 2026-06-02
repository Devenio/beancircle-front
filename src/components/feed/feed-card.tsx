'use client';

import { Heart, MessageCircle, Bookmark } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { api } from '@/lib/api/client';
import { PostReactions } from '@/components/feed/post-reactions';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type FeedPost = {
  id: string;
  type: string;
  caption?: string | null;
  photos?: { url: string }[];
  author: { id: string; username?: string | null; name?: string | null; avatarUrl?: string | null };
  cafe?: { id: string; name: string } | null;
  _count?: { likes: number; comments: number; reactions?: number };
  liked?: boolean;
  saved?: boolean;
  reaction?: string | null;
  reactionCount?: number;
};

export function FeedCard({ post, locale }: { post: FeedPost; locale: string }) {
  const t = useTranslations('feed');
  const qc = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () =>
      api(`/likes/posts/${post.id}`, {
        method: post.liked ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['feed', locale] });
      qc.invalidateQueries({ queryKey: ['community', locale] });
    },
  });

  const saveMutation = useMutation({
    mutationFn: () =>
      api(`/posts/${post.id}/save`, {
        method: post.saved ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed', locale] }),
  });

  const image = post.photos?.[0]?.url;

  return (
    <article className="border-b border-neutral-200 pb-4">
      <div className="flex items-center gap-2 px-4 py-3">
        <Link href={post.author.username ? `/profile/${post.author.username}` : '#'}>
          <Avatar src={post.author.avatarUrl} name={post.author.name} />
        </Link>
        <div className="min-w-0 flex-1">
          <Link
            href={post.author.username ? `/profile/${post.author.username}` : '#'}
            className="text-sm font-semibold"
          >
            {post.author.username ?? post.author.name}
          </Link>
          {post.cafe && (
            <p className="truncate text-xs text-neutral-500">@ {post.cafe.name}</p>
          )}
        </div>
      </div>
      {image && (
        <Link href={`/post/${post.id}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="aspect-square w-full object-cover" />
        </Link>
      )}
      <div className="flex gap-4 px-4 py-2">
        <button type="button" onClick={() => likeMutation.mutate()} className="flex items-center gap-1">
          <Heart className={`h-6 w-6 ${post.liked ? 'fill-red-500 text-red-500' : ''}`} />
          <span className="text-sm">{post._count?.likes ?? 0}</span>
        </button>
        <Link href={`/post/${post.id}`} className="flex items-center gap-1">
          <MessageCircle className="h-6 w-6" />
          <span className="text-sm">{post._count?.comments ?? 0}</span>
        </Link>
        <button type="button" onClick={() => saveMutation.mutate()} className="ms-auto">
          <Bookmark className={`h-6 w-6 ${post.saved ? 'fill-neutral-900' : ''}`} />
        </button>
      </div>
      <PostReactions
        postId={post.id}
        locale={locale}
        current={post.reaction}
        count={post.reactionCount ?? post._count?.reactions}
      />
      {post.caption && (
        <p className="px-4 text-sm">
          <span className="font-semibold">{post.author.username} </span>
          {post.caption}
        </p>
      )}
    </article>
  );
}
