'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ChevronDown, Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  adminListFlags,
  adminSetFlag,
  adminSetCafeFlag,
  type AdminFlag,
} from '@/lib/api/admin';
import {
  Card,
  EmptyState,
  PageHeader,
  SectionTitle,
} from '@/components/admin/primitives';

export default function FeatureFlagsPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const { data: flags, isLoading } = useQuery({
    queryKey: ['admin-flags', locale],
    queryFn: () => adminListFlags(locale),
  });

  const toggleGlobal = useMutation({
    mutationFn: ({ key, enabled }: { key: string; enabled: boolean }) =>
      adminSetFlag(key, enabled),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-flags'] }),
  });

  const grouped = useMemo(() => {
    const term = q.trim().toLowerCase();
    const by: Record<string, AdminFlag[]> = {};
    for (const f of flags ?? []) {
      if (
        term &&
        !f.label.toLowerCase().includes(term) &&
        !f.key.toLowerCase().includes(term) &&
        !f.category.toLowerCase().includes(term)
      )
        continue;
      (by[f.category] ??= []).push(f);
    }
    return Object.entries(by).sort(([a], [b]) => a.localeCompare(b));
  }, [flags, q]);

  const enabledCount = (flags ?? []).filter((f) => f.enabledGlobal).length;

  return (
    <div>
      <PageHeader
        title="Feature Flags"
        subtitle={`Toggle any feature platform-wide, or override per cafe. ${enabledCount}/${flags?.length ?? 0} enabled.`}
        actions={
          <div className="relative w-56">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search flags…"
              className="pl-9"
            />
          </div>
        }
      />

      <div className="space-y-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, gi) => (
            <section key={gi}>
              <div className="h-3 w-24 rounded bg-muted mb-3" />
              <Card className="mt-2 divide-y divide-border">
                {Array.from({ length: 4 }).map((_, fi) => (
                  <div key={fi} className="flex items-center justify-between gap-4 p-4 animate-pulse">
                    <div className="space-y-1.5">
                      <div className="h-4 w-32 rounded bg-muted" />
                      <div className="h-3 w-48 rounded bg-muted" />
                    </div>
                    <div className="h-5 w-9 rounded-full bg-muted" />
                  </div>
                ))}
              </Card>
            </section>
          ))
        ) : (
          <>
            {grouped.map(([category, items]) => (
              <section key={category}>
            <SectionTitle>{category}</SectionTitle>
            <Card className="mt-2 divide-y divide-border">
              {items.map((flag) => {
                const open = openKey === flag.key;
                return (
                  <div key={flag.key} className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">{flag.label}</span>
                          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground">
                            {flag.key}
                          </code>
                        </div>
                        {flag.description ? (
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {flag.description}
                          </p>
                        ) : null}
                        {flag.overrides.length ? (
                          <button
                            onClick={() => setOpenKey(open ? null : flag.key)}
                            className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground"
                          >
                            <ChevronDown
                              className={cn(
                                'size-3.5 transition-transform',
                                open && 'rotate-180',
                              )}
                            />
                            {flag.overrides.length} cafe override
                            {flag.overrides.length > 1 ? 's' : ''}
                          </button>
                        ) : null}
                      </div>
                      <Switch
                        checked={flag.enabledGlobal}
                        onCheckedChange={(enabled) =>
                          toggleGlobal.mutate({ key: flag.key, enabled })
                        }
                      />
                    </div>

                    {open && flag.overrides.length ? (
                      <div className="mt-3 space-y-1.5 rounded-lg border border-border bg-muted/40 p-3">
                        {flag.overrides.map((o) => (
                          <CafeOverrideRow
                            key={o.cafeId}
                            flagKey={flag.key}
                            cafeId={o.cafeId}
                            cafeName={o.cafeName}
                            enabled={o.enabled}
                            onChanged={() =>
                              qc.invalidateQueries({ queryKey: ['admin-flags'] })
                            }
                          />
                        ))}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </Card>
          </section>
        ))}
        {flags && grouped.length === 0 ? (
          <Card>
            <EmptyState>No flags match "{q}".</EmptyState>
          </Card>
        ) : null}
        </>
        )}
      </div>
    </div>
  );
}

function CafeOverrideRow({
  flagKey,
  cafeId,
  cafeName,
  enabled,
  onChanged,
}: {
  flagKey: string;
  cafeId: string;
  cafeName: string;
  enabled: boolean;
  onChanged: () => void;
}) {
  const set = useMutation({
    mutationFn: (value: boolean | null) =>
      adminSetCafeFlag(flagKey, cafeId, value),
    onSuccess: onChanged,
  });
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className="truncate">{cafeName}</span>
      <div className="flex items-center gap-3">
        <Switch checked={enabled} onCheckedChange={(v) => set.mutate(v)} />
        <button
          onClick={() => set.mutate(null)}
          className="text-xs text-muted-foreground hover:text-destructive"
        >
          reset
        </button>
      </div>
    </div>
  );
}
