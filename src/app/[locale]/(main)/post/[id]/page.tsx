'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FeedCard } from '@/components/feed/feed-card';

export default function PostDetailPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const [comment, setComment] = useState('');
  const qc = useQueryClient();

  const { data: post } = useQuery({
    queryKey: ['post', id, locale],
    queryFn: () =>
      api<{
        id: string;
        type: string;
        caption?: string | null;
        photos?: { url: string }[];
        author: {
          id: string;
          username?: string | null;
          name?: string | null;
          avatarUrl?: string | null;
        };
        cafe?: { id: string; name: string } | null;
        _count?: { likes: number; comments: number };
        liked?: boolean;
        saved?: boolean;
      }>(`/posts/${id}`, { locale }),
  });

  const { data: comments } = useQuery({
    queryKey: ['comments', id, locale],
    queryFn: () =>
      api<{ id: string; body: string; author: { username?: string } }[]>(
        `/posts/${id}/comments`,
        { locale },
      ),
  });

  const addComment = useMutation({
    mutationFn: () =>
      api(`/posts/${id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: comment }),
        locale,
      }),
    onSuccess: () => {
      setComment('');
      qc.invalidateQueries({ queryKey: ['comments', id] });
    },
  });

  return (
    <div>
      {post ? <FeedCard post={post} locale={locale} /> : null}
      <div className="border-t p-4">
        <h2 className="mb-2 font-semibold">Comments</h2>
        {comments?.map((c) => (
          <p key={c.id} className="mb-2 text-sm">
            <span className="font-medium">{c.author?.username}: </span>
            {c.body}
          </p>
        ))}
        <div className="mt-4 flex gap-2">
          <Input value={comment} onChange={(e) => setComment(e.target.value)} />
          <Button onClick={() => addComment.mutate()} disabled={!comment}>
            Post
          </Button>
        </div>
      </div>
    </div>
  );
}
