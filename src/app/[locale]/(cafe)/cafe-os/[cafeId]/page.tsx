'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { Link } from '@/i18n/navigation';
import { cafeOsApi, type DashboardData } from '@/lib/api/cafe-os';
import { getSocket } from '@/lib/realtime/socket';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  CalendarDays,
  Coins,
  Heart,
  QrCode,
  Repeat,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';

function StatCard({
  icon: Icon,
  label,
  value,
  tint,
  delay,
}: {
  icon: typeof Users;
  label: string;
  value: number | string;
  tint: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="rounded-2xl border border-border bg-card p-4 shadow-sm"
    >
      <span
        className="inline-flex h-9 w-9 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${tint}1a`, color: tint }}
      >
        <Icon className="h-4.5 w-4.5" />
      </span>
      <motion.p
        key={String(value)}
        initial={{ scale: 1.15, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        className="mt-3 text-2xl font-bold tabular-nums"
      >
        {value}
      </motion.p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </motion.div>
  );
}

export default function CafeDashboardPage() {
  const t = useTranslations('cafeOs');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['cafe-dashboard', cafeId],
    queryFn: () => cafeOsApi.dashboard(cafeId),
    refetchInterval: 60_000,
  });

  // Live updates: refetch dashboard numbers on every stats tick.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onStats = (payload: { cafeId: string }) => {
      if (payload.cafeId === cafeId) {
        void queryClient.invalidateQueries({
          queryKey: ['cafe-dashboard', cafeId],
        });
      }
    };
    socket.on('cafe:stats', onStats);
    return () => {
      socket.off('cafe:stats', onStats);
    };
  }, [cafeId, queryClient]);

  if (isLoading || !data) {
    return (
      <div className="space-y-4 p-4">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-40 w-full rounded-2xl" />
      </div>
    );
  }

  const d: DashboardData = data;

  return (
    <div className="space-y-6 p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-xl font-bold">{d.cafe.name}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.today')}</p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={Users}
          label={t('dashboard.visitors')}
          value={d.today.visitors}
          tint="#7c5cff"
          delay={0.05}
        />
        <StatCard
          icon={QrCode}
          label={t('dashboard.qrScans')}
          value={d.today.qrScans}
          tint="#0ea5e9"
          delay={0.1}
        />
        <StatCard
          icon={Repeat}
          label={t('dashboard.returning')}
          value={d.today.returningCustomers}
          tint="#f59e0b"
          delay={0.15}
        />
        <StatCard
          icon={Heart}
          label={t('dashboard.followers')}
          value={d.followers}
          tint="#ef4444"
          delay={0.2}
        />
      </div>

      {/* Revenue placeholder (future) */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="flex items-center gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-4"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600">
          <Coins className="h-4.5 w-4.5" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t('dashboard.revenue')}</p>
          <p className="text-xs text-muted-foreground">
            {t('dashboard.revenueSoon')}
          </p>
        </div>
      </motion.div>

      {/* Popular items */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-semibold">
            <TrendingUp className="h-4 w-4 text-primary" />
            {t('dashboard.popularItems')}
          </h2>
          <Link
            href={`/cafe-os/${cafeId}/analytics`}
            className="text-xs font-medium text-primary"
          >
            {t('dashboard.viewAnalytics')}
          </Link>
        </div>
        {d.popularItems.length ? (
          <div className="space-y-2">
            {d.popularItems.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
                className="flex items-center gap-3 rounded-xl border border-border bg-card p-3"
              >
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.imageUrl}
                    alt=""
                    className="h-10 w-10 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <Sparkles className="h-4 w-4" />
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.category.name}
                  </p>
                </div>
                <span className="text-xs font-semibold text-muted-foreground">
                  {t('dashboard.views', { count: item.viewCount })}
                </span>
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t('dashboard.noItems')}
          </p>
        )}
      </section>

      {/* Active promotions */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold">{t('dashboard.activePromos')}</h2>
          <Link
            href={`/cafe-os/${cafeId}/marketing`}
            className="text-xs font-medium text-primary"
          >
            {t('dashboard.manage')}
          </Link>
        </div>
        {d.activePromotions.length ? (
          <div className="space-y-2">
            {d.activePromotions.map((a) => (
              <div
                key={a.id}
                className="rounded-xl border border-border bg-card p-3"
              >
                <p className="text-sm font-medium">{a.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                  {a.body}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
            {t('dashboard.noPromos')}
          </p>
        )}
      </section>

      {/* Upcoming events */}
      {d.upcomingEvents.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <CalendarDays className="h-4 w-4 text-primary" />
            {t('dashboard.upcomingEvents')}
          </h2>
          <div className="space-y-2">
            {d.upcomingEvents.map((e) => (
              <div
                key={e.id}
                className="flex items-center justify-between rounded-xl border border-border bg-card p-3"
              >
                <div>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {format.dateTime(new Date(e.startsAt), {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </p>
                </div>
                <span className="text-xs font-semibold text-primary">
                  {t('dashboard.rsvps', { count: e._count.rsvps })}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
