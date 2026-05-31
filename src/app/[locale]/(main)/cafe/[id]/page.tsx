'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';

export default function CafePage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('cafe');
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');

  const { data: cafe } = useQuery({
    queryKey: ['cafe', id, locale],
    queryFn: () =>
      api<{
        id: string;
        name: string;
        address: string;
        avgRating: number;
        isFollowing?: boolean;
        photos?: { url: string }[];
        reviews?: unknown[];
      }>(`/cafes/${id}`, { locale }),
  });

  const followMutation = useMutation({
    mutationFn: () =>
      api(`/cafes/${id}/follow`, {
        method: cafe?.isFollowing ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe', id] }),
  });

  const checkinMutation = useMutation({
    mutationFn: () => api(`/cafes/${id}/checkins`, { method: 'POST', locale }),
    onSuccess: () => alert('Checked in!'),
  });

  const reviewMutation = useMutation({
    mutationFn: () =>
      api(`/reviews/cafes/${id}`, {
        method: 'POST',
        body: JSON.stringify({ rating, body: reviewBody }),
        locale,
      }),
    onSuccess: () => {
      setReviewBody('');
      qc.invalidateQueries({ queryKey: ['cafe', id] });
    },
  });

  if (!cafe) return null;

  return (
    <div>
      {cafe.photos?.[0] && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cafe.photos[0].url} alt="" className="aspect-video w-full object-cover" />
      )}
      <div className="p-4">
        <h1 className="text-xl font-bold">{cafe.name}</h1>
        <p className="text-sm text-neutral-500">{cafe.address}</p>
        <p className="mt-1 text-sm">★ {cafe.avgRating.toFixed(1)}</p>
        <div className="mt-4 flex gap-2">
          <Button
            variant={cafe.isFollowing ? 'outline' : 'default'}
            onClick={() => followMutation.mutate()}
          >
            {cafe.isFollowing ? t('unfollow') : t('follow')}
          </Button>
          <Button variant="outline" onClick={() => checkinMutation.mutate()}>
            {t('checkin')}
          </Button>
        </div>
        <section className="mt-6">
          <h2 className="font-semibold">{t('writeReview')}</h2>
          <Input
            type="number"
            min={1}
            max={5}
            value={rating}
            onChange={(e) => setRating(parseInt(e.target.value, 10))}
            className="mt-2"
          />
          <textarea
            className="mt-2 w-full rounded-lg border p-2 text-sm"
            value={reviewBody}
            onChange={(e) => setReviewBody(e.target.value)}
            rows={3}
          />
          <Button className="mt-2" onClick={() => reviewMutation.mutate()}>
            Submit
          </Button>
        </section>
        <section className="mt-6">
          <h2 className="font-semibold">{t('reviews')}</h2>
          {(cafe.reviews as { body?: string; rating: number; author?: { username?: string } }[])?.map(
            (r, i) => (
              <div key={i} className="border-b py-3">
                <p className="font-medium">{r.author?.username}</p>
                <p className="text-sm">★ {r.rating}</p>
                <p className="text-sm">{r.body}</p>
              </div>
            ),
          )}
        </section>
      </div>
    </div>
  );
}
