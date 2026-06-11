'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { useQuery } from '@tanstack/react-query';
import { useFormatter, useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const RANGES = ['7d', '30d', '90d'] as const;

export default function AnalyticsPage() {
  const t = useTranslations('cafeOs.analytics');
  const format = useFormatter();
  const { cafeId } = useParams<{ cafeId: string }>();
  const [range, setRange] = useState<(typeof RANGES)[number]>('7d');

  const { data, isLoading } = useQuery({
    queryKey: ['cafe-analytics', cafeId, range],
    queryFn: () => cafeOsApi.analytics(cafeId, range),
  });

  const series =
    data?.series.map((row) => ({
      ...row,
      label: format.dateTime(new Date(row.date), { month: 'short', day: 'numeric' }),
    })) ?? [];

  return (
    <div className="space-y-5 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <div className="flex rounded-lg bg-accent p-0.5">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRange(r)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                range === r ? 'bg-background shadow-sm' : 'text-muted-foreground'
              }`}
            >
              {t(`ranges.${r}`)}
            </button>
          ))}
        </div>
      </div>

      {isLoading || !data ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-20 rounded-2xl" />
            ))}
          </div>
          <Skeleton className="h-56 rounded-2xl" />
          <Skeleton className="h-56 rounded-2xl" />
        </div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-2 gap-3">
            <TotalCard value={data.totals.visitors} label={t('visitors')} />
            <TotalCard value={data.totals.qrScans} label={t('qrScans')} />
            <TotalCard
              value={`${Math.round(data.totals.returningRate * 100)}%`}
              label={t('returningRate')}
            />
            <TotalCard value={data.totals.newFollowers} label={t('newFollowers')} />
          </div>

          {/* Visitors area chart */}
          <ChartCard title={t('visitorsOverTime')}>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="visitorsFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="visitors"
                  name={t('visitors')}
                  stroke="var(--primary)"
                  strokeWidth={2}
                  fill="url(#visitorsFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* QR scans line chart */}
          <ChartCard title={t('scansOverTime')}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="qrScans"
                  name={t('qrScans')}
                  stroke="#2563EB"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Follower growth */}
          <ChartCard title={t('communityGrowth')}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={series} margin={{ top: 8, right: 8, left: -22, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="followers"
                  name={t('newFollowers')}
                  stroke="#16A34A"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* Top items bar chart */}
          {data.topItems.length ? (
            <ChartCard title={t('topItems')}>
              <ResponsiveContainer
                width="100%"
                height={Math.max(140, data.topItems.length * 36)}
              >
                <BarChart
                  data={data.topItems}
                  layout="vertical"
                  margin={{ top: 0, right: 16, left: 8, bottom: 0 }}
                >
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={110}
                    tick={{ fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid var(--border)',
                      fontSize: 12,
                    }}
                  />
                  <Bar
                    dataKey="viewCount"
                    name={t('views')}
                    fill="var(--primary)"
                    radius={[0, 6, 6, 0]}
                    barSize={18}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          ) : null}

          {/* Event attendance */}
          {data.events.length ? (
            <div className="rounded-2xl border border-border bg-card p-4">
              <h2 className="mb-3 text-sm font-semibold">{t('eventAttendance')}</h2>
              <div className="space-y-2">
                {data.events.map((event) => (
                  <div key={event.id} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{event.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {format.dateTime(new Date(event.startsAt), { dateStyle: 'medium' })}
                      </p>
                    </div>
                    <span className="shrink-0 text-sm font-bold text-primary">
                      {t('attendees', { count: event.attendance })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

function TotalCard({ value, label }: { value: React.ReactNode; label: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}
