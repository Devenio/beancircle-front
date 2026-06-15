'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Card, PageHeader } from '@/components/admin/primitives';
import { cn } from '@/lib/utils';

type Tab = 'reports' | 'reviews' | 'checkins' | 'gifts';

const TABS: { key: Tab; label: string; path: string }[] = [
  { key: 'reports', label: 'Reports', path: '/admin/reports' },
  { key: 'reviews', label: 'Reviews', path: '/admin/reviews' },
  { key: 'checkins', label: 'Check-ins', path: '/admin/checkins' },
  { key: 'gifts', label: 'Gifts', path: '/admin/gifts' },
];

export default function ModerationPage() {
  const { locale } = useParams<{ locale: string }>();
  const [tab, setTab] = useState<Tab>('reports');
  const active = TABS.find((t) => t.key === tab)!;

  const { data } = useQuery({
    queryKey: ['admin-moderation', tab, locale],
    queryFn: () => api<unknown>(active.path, { locale }),
  });

  const rows = ((data as { data?: unknown })?.data ?? data ?? []) as unknown[];

  return (
    <div>
      <PageHeader title="Moderation" subtitle="Review reported content and activity." />

      <div className="mb-4 inline-flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
              tab === t.key
                ? 'bg-background shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <Card className="p-0">
        <pre className="max-h-[70vh] overflow-auto p-4 text-xs leading-relaxed">
          {JSON.stringify(rows, null, 2)}
        </pre>
      </Card>
    </div>
  );
}
