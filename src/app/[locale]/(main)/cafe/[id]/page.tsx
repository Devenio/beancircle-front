'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { WorkReportSection } from '@/components/cafe/work-report-section';
import { ReportDialog } from '@/components/report/report-dialog';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';

export default function CafePage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('cafe');
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');

  const { data: cafe } = useQuery({
    queryKey: ['cafe', id, locale],
    queryFn: () =>
      api<{
        id: string;
        name: string;
        address: string;
        avgRating: number;
        isFollowing?: boolean;
        checkinCode?: string | null;
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe', id, locale] }),
  });

  const checkinMutation = useMutation({
    mutationFn: () =>
      api<{ newStamp: boolean; earnedBadges?: unknown[] }>('/passport/checkin', {
        method: 'POST',
        body: JSON.stringify({ cafeId: id }),
        locale,
      }),
    onSuccess: (res) => {
      const extra = res.newStamp ? ` ${t('newStamp')}` : '';
      setCheckinMessage(`${t('checkinSuccess')}${extra}`);
      qc.invalidateQueries({ queryKey: ['passport', locale] });
      setTimeout(() => setCheckinMessage(''), 3000);
    },
    onError: (e: Error) => {
      setCheckinMessage(e.message);
      setTimeout(() => setCheckinMessage(''), 4000);
    },
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
      qc.invalidateQueries({ queryKey: ['cafe', id, locale] });
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
        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={cafe.isFollowing ? 'outline' : 'default'}
            onClick={() => followMutation.mutate()}
          >
            {cafe.isFollowing ? t('unfollow') : t('follow')}
          </Button>
          <Button variant="outline" onClick={() => checkinMutation.mutate()}>
            {t('checkin')}
          </Button>
          <ReportDialog
            targetType="CAFE"
            targetId={id}
            locale={locale}
            trigger={
              <Button type="button" variant="ghost" className="text-destructive">
                {t('report')}
              </Button>
            }
          />
        </div>
        {checkinMessage ? (
          <p className="mt-2 text-sm text-green-600" role="status">
            {checkinMessage}
          </p>
        ) : null}
        {cafe.checkinCode ? (
          <p className="mt-3 rounded-lg bg-muted px-3 py-2 font-mono text-xs">
            {t('checkinCode')}: {cafe.checkinCode}
            <Link href={`/passport?code=${cafe.checkinCode}`} className="ms-2 text-primary">
              {t('useInPassport')}
            </Link>
          </p>
        ) : null}
        <WorkReportSection cafeId={id} locale={locale} />
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
