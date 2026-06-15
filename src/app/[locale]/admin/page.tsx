'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  Coffee,
  FileText,
  Gift,
  MapPin,
  MessageSquare,
  Star,
  Users,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  adminAnalyticsOverview,
  adminTimeseries,
  adminTopCafes,
  adminUsersByRole,
} from '@/lib/api/admin';
import { Card, PageHeader, StatCard } from '@/components/admin/primitives';

const METRICS = ['users', 'cafes', 'posts', 'reviews', 'checkins', 'gifts'];

export default function AdminOverviewPage() {
  const { locale } = useParams<{ locale: string }>();
  const [metric, setMetric] = useState('users');

  const { data: overview } = useQuery({
    queryKey: ['admin-overview', locale],
    queryFn: () => adminAnalyticsOverview(30, locale),
  });
  const { data: series } = useQuery({
    queryKey: ['admin-series', metric, locale],
    queryFn: () => adminTimeseries(metric, 30, locale),
  });
  const { data: topCafes } = useQuery({
    queryKey: ['admin-top-cafes', locale],
    queryFn: () => adminTopCafes(8, locale),
  });
  const { data: byRole } = useQuery({
    queryKey: ['admin-by-role', locale],
    queryFn: () => adminUsersByRole(locale),
  });

  const totalRoles = (byRole ?? []).reduce((s, r) => s + r.count, 0) || 1;
  const dash = (v?: number) => v ?? '—';

  return (
    <div>
      <PageHeader
        title="Overview"
        subtitle="Platform health at a glance — last 30 days."
      />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Users" value={dash(overview?.totals.users)} icon={Users} />
        <StatCard label="Cafes" value={dash(overview?.totals.cafes)} icon={Coffee} />
        <StatCard label="Posts" value={dash(overview?.totals.posts)} icon={FileText} />
        <StatCard label="Reviews" value={dash(overview?.totals.reviews)} icon={Star} />
        <StatCard label="Check-ins" value={dash(overview?.totals.checkins)} icon={MapPin} />
        <StatCard label="Gifts" value={dash(overview?.totals.gifts)} icon={Gift} />
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="New users"
          value={dash(overview?.period.newUsers)}
          hint="last 30 days"
        />
        <StatCard
          label="New cafes"
          value={dash(overview?.period.newCafes)}
          hint="last 30 days"
        />
        <StatCard
          label="Active today"
          value={dash(overview?.activity.dau)}
          icon={MessageSquare}
          hint="seen in 24h"
        />
        <StatCard
          label="Moderated"
          value={dash(overview?.activity.moderatedUsers)}
          hint="suspended / banned"
        />
      </div>

      {/* Chart */}
      <Card className="mt-6 p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold">Growth</h3>
            <p className="text-xs text-muted-foreground">New {metric} per day</p>
          </div>
          <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted p-1">
            {METRICS.map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={
                  m === metric
                    ? 'rounded-md bg-background px-2.5 py-1 text-xs font-medium capitalize shadow-sm'
                    : 'rounded-md px-2.5 py-1 text-xs font-medium capitalize text-muted-foreground hover:text-foreground'
                }
              >
                {m}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series ?? []} margin={{ left: -16, right: 8, top: 4 }}>
              <defs>
                <linearGradient id="adminArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--foreground)" stopOpacity={0.18} />
                  <stop offset="100%" stopColor="var(--foreground)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                vertical={false}
                stroke="var(--border)"
                strokeDasharray="3 3"
              />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={11}
                tickMargin={10}
                stroke="var(--muted-foreground)"
                tickFormatter={(d: string) => d.slice(5)}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                width={36}
                fontSize={11}
                stroke="var(--muted-foreground)"
              />
              <Tooltip
                contentStyle={{
                  background: 'var(--popover, var(--card))',
                  border: '1px solid var(--border)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--foreground)',
                }}
                labelStyle={{ color: 'var(--muted-foreground)' }}
              />
              <Area
                type="monotone"
                dataKey="count"
                stroke="var(--foreground)"
                strokeWidth={2}
                fill="url(#adminArea)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Top cafes</h3>
          <div className="space-y-3">
            {(topCafes ?? []).map((c, i) => (
              <div key={c.id} className="flex items-center gap-3">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold text-muted-foreground">
                  {i + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium">{c.name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {c.city?.name ?? '—'} · ★ {c.avgRating.toFixed(1)}
                  </div>
                </div>
                <span className="text-sm tabular-nums text-muted-foreground">
                  {c.followerCount}
                </span>
              </div>
            ))}
            {topCafes && topCafes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cafes yet.</p>
            ) : null}
          </div>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 text-sm font-semibold">Users by role</h3>
          <div className="space-y-4">
            {(byRole ?? []).map((r) => (
              <div key={r.role}>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">{r.role}</span>
                  <span className="tabular-nums text-muted-foreground">
                    {r.count}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-foreground/80"
                    style={{ width: `${(r.count / totalRoles) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
