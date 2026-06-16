'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { useFormatter, useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { cafeConsumerApi } from '@/lib/api/cafe-os';
import { claimCafe } from '@/lib/api/owner';
import { getBeansForCafe } from '@/lib/api/beans';
import { VerifiedBadge } from '@/components/cafe/verified-badge';
import { BeanComposer } from '@/components/beans/bean-composer';
import { BeanFeed } from '@/components/beans/bean-feed';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConsumerLoyaltyCards } from '@/components/cafe-os/consumer-loyalty';
import { WorkReportSection } from '@/components/cafe/work-report-section';
import { CheckinSheet } from '@/components/checkin/checkin-sheet';
import { ReportDialog } from '@/components/report/report-dialog';
import { Link } from '@/i18n/navigation';
import {
  BadgePercent,
  CalendarDays,
  Heart,
  Megaphone,
  Tag,
  UtensilsCrossed,
  Users,
} from 'lucide-react';
import { useState } from 'react';

type CafeDetail = {
  id: string;
  name: string;
  address: string;
  description?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  avgRating: number;
  followerCount?: number;
  isFollowing?: boolean;
  isVerified?: boolean;
  hasOwner?: boolean;
  myClaimStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  checkinCode?: string | null;
  photos?: { url: string }[];
  reviews?: { body?: string; rating: number; author?: { username?: string } }[];
  menu?: { slug: string; isPublished: boolean } | null;
  squads?: {
    id: string;
    name: string;
    slug: string;
    emoji?: string | null;
    memberCount: number;
    description?: string | null;
  }[];
};

type CafeEventRow = {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  locationLabel?: string | null;
  _count?: { rsvps: number };
};

const TABS = ['overview', 'beans', 'menu', 'events', 'updates', 'community'] as const;
type Tab = (typeof TABS)[number];

const ANNOUNCEMENT_ICONS = {
  ANNOUNCEMENT: Megaphone,
  PROMOTION: BadgePercent,
  DISCOUNT: Tag,
} as const;

export default function CafePage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const t = useTranslations('cafe');
  const tBeans = useTranslations('beans');
  const format = useFormatter();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('overview');
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const [checkinMessage, setCheckinMessage] = useState('');

  const { data: cafe } = useQuery({
    queryKey: ['cafe', id, locale],
    queryFn: () => api<CafeDetail>(`/cafes/${id}`, { locale }),
  });

  const { data: announcements } = useQuery({
    queryKey: ['cafe-updates', id],
    queryFn: () => cafeConsumerApi.announcements(id),
    enabled: tab === 'updates',
  });

  const { data: events } = useQuery({
    queryKey: ['cafe-public-events', id],
    queryFn: () => api<CafeEventRow[]>(`/events?cafeId=${id}`, { locale }),
    enabled: tab === 'events',
  });

  const { data: favoriteCafes } = useQuery({
    queryKey: ['favorite-cafes', locale],
    queryFn: () => api<{ id: string }[]>('/users/me/favorite-cafes', { locale }),
  });
  const isFavorite = favoriteCafes?.some((c) => c.id === id) ?? false;

  const favoriteMutation = useMutation({
    mutationFn: () =>
      api(`/users/me/favorite-cafes/${id}`, {
        method: isFavorite ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['favorite-cafes', locale] }),
  });

  const followMutation = useMutation({
    mutationFn: () =>
      api(`/cafes/${id}/follow`, {
        method: cafe?.isFollowing ? 'DELETE' : 'POST',
        locale,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe', id, locale] }),
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

  const claimMutation = useMutation({
    mutationFn: () => claimCafe(id, {}, locale),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe', id, locale] }),
  });

  if (!cafe) return null;

  const cover = cafe.coverUrl || cafe.photos?.[0]?.url;
  const hasMenu = !!cafe.menu?.isPublished && !!cafe.menu?.slug;

  return (
    <div className="pb-8">
      <div className="relative">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="aspect-[2/1] w-full object-cover" />
        ) : (
          <div className="aspect-[2/1] w-full bg-muted" />
        )}
        {cafe.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafe.logoUrl}
            alt=""
            className="absolute -bottom-7 start-4 h-16 w-16 rounded-2xl border-2 border-background object-cover shadow"
          />
        ) : null}
      </div>

      <div className={`p-4 ${cafe.logoUrl ? 'pt-9' : ''}`}>
        <h1 className="flex items-center gap-1.5 text-xl font-bold">
          {cafe.name}
          {cafe.isVerified ? <VerifiedBadge label={t('verified')} /> : null}
        </h1>
        <p className="text-sm text-muted-foreground">{cafe.address}</p>
        <p className="mt-1 flex items-center gap-3 text-sm">
          <span>★ {cafe.avgRating.toFixed(1)}</span>
          {typeof cafe.followerCount === 'number' ? (
            <span className="text-muted-foreground">
              {t('followers', { count: cafe.followerCount })}
            </span>
          ) : null}
        </p>
        {cafe.description ? <p className="mt-2 text-sm">{cafe.description}</p> : null}

        {!cafe.hasOwner ? (
          <div className="mt-3 rounded-xl border border-dashed p-3">
            {cafe.myClaimStatus === 'PENDING' ? (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('ownershipPending')}
              </p>
            ) : (
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-muted-foreground">{t('ownerPrompt')}</p>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => claimMutation.mutate()}
                  disabled={claimMutation.isPending}
                >
                  {t('imOwner')}
                </Button>
              </div>
            )}
            {claimMutation.isSuccess && cafe.myClaimStatus !== 'PENDING' ? (
              <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">
                {t('ownerClaimSubmitted')}
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-2">
          <Button
            variant={cafe.isFollowing ? 'outline' : 'default'}
            onClick={() => followMutation.mutate()}
          >
            {cafe.isFollowing ? t('unfollow') : t('follow')}
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => favoriteMutation.mutate()}
            disabled={favoriteMutation.isPending}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart
              className="h-4 w-4"
              fill={isFavorite ? 'currentColor' : 'none'}
              strokeWidth={isFavorite ? 0 : 2}
              style={{ color: isFavorite ? '#ef4444' : undefined }}
            />
          </Button>
          <CheckinSheet
            cafeId={id}
            locale={locale}
            onDone={() => setCheckinMessage(t('checkinSuccess'))}
            trigger={
              <Button variant="default" type="button">
                {t('checkin')}
              </Button>
            }
          />
          {hasMenu ? (
            <Button variant="outline" render={<Link href={`/m/${cafe.menu!.slug}`} />}>
              <UtensilsCrossed className="h-4 w-4" />
              {t('viewMenu')}
            </Button>
          ) : null}
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

        <div className="-mx-4 mt-4 flex gap-1 overflow-x-auto border-b border-border px-4 scrollbar-none">
          {TABS.map((tb) => (
            <button
              key={tb}
              type="button"
              onClick={() => setTab(tb)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium transition ${
                tab === tb
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              {t(`tabs.${tb}`)}
            </button>
          ))}
        </div>

        {tab === 'overview' ? (
          <div className="mt-4 space-y-6">
            <ConsumerLoyaltyCards cafeId={id} />
            <WorkReportSection cafeId={id} locale={locale} />
            <section>
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
                {t('submitReview')}
              </Button>
            </section>
            <section>
              <h2 className="font-semibold">{t('reviews')}</h2>
              {cafe.reviews?.map((r, i) => (
                <div key={i} className="border-b py-3">
                  <p className="font-medium">{r.author?.username}</p>
                  <p className="text-sm">★ {r.rating}</p>
                  <p className="text-sm">{r.body}</p>
                </div>
              ))}
            </section>
          </div>
        ) : null}

        {tab === 'beans' ? (
          <div className="-mx-4 mt-2">
            <div className="border-b border-border px-4 py-3">
              <BeanComposer locale={locale} context={{ cafeId: id, label: cafe.name }} compact />
            </div>
            <BeanFeed
              queryKey={['beans', 'cafe', id, locale]}
              fetchPage={(cursor) => getBeansForCafe(id, locale, cursor)}
              locale={locale}
              emptyTitle={tBeans('cafeEmptyTitle')}
              emptyBody={tBeans('cafeEmptyBody')}
              composerContext={{ cafeId: id, label: cafe.name }}
            />
          </div>
        ) : null}

        {tab === 'menu' ? (
          <div className="mt-4">
            {hasMenu ? (
              <div className="rounded-2xl border border-border p-6 text-center">
                <UtensilsCrossed className="mx-auto h-8 w-8 text-primary" />
                <p className="mt-2 text-sm text-muted-foreground">{t('menuHint')}</p>
                <Button className="mt-4" render={<Link href={`/m/${cafe.menu!.slug}`} />}>
                  {t('openMenu')}
                </Button>
              </div>
            ) : (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t('noMenu')}
              </p>
            )}
          </div>
        ) : null}

        {tab === 'events' ? (
          <div className="mt-4 space-y-2">
            {!events?.length ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t('noEvents')}
              </p>
            ) : (
              events.map((event) => (
                <Link
                  key={event.id}
                  href={`/events/${event.id}`}
                  className="block rounded-2xl border border-border bg-card p-3 transition hover:bg-accent"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <CalendarDays className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(event.startsAt), {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {t('rsvps', { count: event._count?.rsvps ?? 0 })}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : null}

        {tab === 'updates' ? (
          <div className="mt-4 space-y-2">
            {!announcements?.length ? (
              <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {t('noUpdates')}
              </p>
            ) : (
              announcements.map((a) => {
                const Icon = ANNOUNCEMENT_ICONS[a.kind] ?? Megaphone;
                return (
                  <article
                    key={a.id}
                    className="overflow-hidden rounded-2xl border border-border bg-card"
                  >
                    {a.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.imageUrl} alt="" className="aspect-[3/1] w-full object-cover" />
                    ) : null}
                    <div className="p-3">
                      <div className="flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0 text-primary" />
                        <h3 className="text-sm font-semibold">{a.title}</h3>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{a.body}</p>
                      {a.publishedAt ? (
                        <p className="mt-1.5 text-[10px] text-muted-foreground">
                          {format.relativeTime(new Date(a.publishedAt))}
                        </p>
                      ) : null}
                    </div>
                  </article>
                );
              })
            )}
          </div>
        ) : null}

        {tab === 'community' ? (
          <div className="mt-4 space-y-2">
            {!cafe.squads?.length ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <Users className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">{t('noCommunity')}</p>
                {!cafe.isFollowing ? (
                  <Button className="mt-4" onClick={() => followMutation.mutate()}>
                    {t('follow')}
                  </Button>
                ) : null}
              </div>
            ) : (
              cafe.squads.map((squad) => (
                <Link
                  key={squad.id}
                  href={`/squads/${squad.id}`}
                  className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 transition hover:bg-accent"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-lg">
                    {squad.emoji || '☕'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{squad.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {t('members', { count: squad.memberCount })}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
