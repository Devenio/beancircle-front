'use client';

import { Card, PageHeader, StatusPill } from '@/components/admin/primitives';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  adminDesignAccess,
  adminGrantDesignAccess,
  adminListDesigns,
  adminRevokeDesignAccess,
  type RegisteredDesign,
} from '@/lib/api/designs';
import { adminListCafes } from '@/lib/api/admin';
import { cn } from '@/lib/utils';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ImageOff, Plus, Search, Trash2, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';

export default function AdminDesignsPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [selected, setSelected] = useState<RegisteredDesign | null>(null);

  const { data: designs } = useQuery({
    queryKey: ['admin-designs', locale],
    queryFn: () => adminListDesigns(undefined, locale),
  });

  const menuDesigns = useMemo(
    () => (designs ?? []).filter((d) => d.type === 'menu'),
    [designs],
  );
  const welcomeDesigns = useMemo(
    () => (designs ?? []).filter((d) => d.type === 'welcome'),
    [designs],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Designs"
        subtitle="Coded menu & welcome designs. Whitelist which cafes may use each one."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_minmax(320px,400px)]">
        <div className="space-y-8">
          <DesignGroup
            title="Menu designs"
            designs={menuDesigns}
            selectedKey={selected?.key}
            onSelect={setSelected}
          />
          <DesignGroup
            title="Welcome designs"
            designs={welcomeDesigns}
            selectedKey={selected?.key}
            onSelect={setSelected}
          />
        </div>

        <div className="lg:sticky lg:top-4 lg:self-start">
          {selected ? (
            <AccessPanel
              key={selected.key}
              design={selected}
              locale={locale}
              qc={qc}
            />
          ) : (
            <Card className="p-6 text-sm text-muted-foreground">
              Select a design to manage which cafes can use it.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function DesignGroup({
  title,
  designs,
  selectedKey,
  onSelect,
}: {
  title: string;
  designs: RegisteredDesign[];
  selectedKey?: string;
  onSelect: (d: RegisteredDesign) => void;
}) {
  return (
    <section>
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {designs.map((d) => (
          <button
            key={d.key}
            type="button"
            onClick={() => onSelect(d)}
            className={cn(
              'overflow-hidden rounded-xl border bg-card text-left transition hover:border-foreground/40',
              selectedKey === d.key
                ? 'border-foreground ring-1 ring-foreground'
                : 'border-border',
            )}
          >
            <div className="flex aspect-video items-center justify-center bg-muted">
              {d.previewImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.previewImageUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
              ) : (
                <ImageOff className="h-6 w-6 text-muted-foreground" />
              )}
            </div>
            <div className="space-y-1 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{d.name}</span>
                <StatusPill tone={d.enabled ? 'green' : 'muted'}>
                  {d.enabled ? 'Enabled' : 'Disabled'}
                </StatusPill>
              </div>
              <p className="font-mono text-xs text-muted-foreground">{d.key}</p>
              {d.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">
                  {d.description}
                </p>
              ) : null}
            </div>
          </button>
        ))}
        {designs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No designs registered.</p>
        ) : null}
      </div>
    </section>
  );
}

function AccessPanel({
  design,
  locale,
  qc,
}: {
  design: RegisteredDesign;
  locale: string;
  qc: ReturnType<typeof useQueryClient>;
}) {
  const [q, setQ] = useState('');

  const { data: access } = useQuery({
    queryKey: ['design-access', design.key],
    queryFn: () => adminDesignAccess(design.key, locale),
  });

  const { data: cafes } = useQuery({
    queryKey: ['admin-cafes-search', q, locale],
    queryFn: () => adminListCafes({ q: q || undefined, locale }),
  });

  const grantedIds = new Set((access ?? []).map((a) => a.cafeId));

  const grant = useMutation({
    mutationFn: (cafeId: string) =>
      adminGrantDesignAccess(design.key, [cafeId]),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['design-access', design.key] }),
  });

  const revoke = useMutation({
    mutationFn: (cafeId: string) =>
      adminRevokeDesignAccess(design.key, cafeId),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ['design-access', design.key] }),
  });

  return (
    <Card className="space-y-4 p-5">
      <div>
        <h3 className="font-semibold">{design.name}</h3>
        <p className="text-xs text-muted-foreground">
          Cafes whitelisted for this design.
        </p>
      </div>

      <div className="space-y-2">
        {(access ?? []).map((a) => (
          <div
            key={a.cafeId}
            className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span className="truncate">{a.name}</span>
            <button
              type="button"
              onClick={() => revoke.mutate(a.cafeId)}
              className="text-muted-foreground transition hover:text-destructive"
              aria-label="Revoke access"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {(access ?? []).length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No cafes yet — add one below.
          </p>
        ) : null}
      </div>

      <div className="border-t border-border pt-4">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search cafes to grant…"
            className="pl-8"
          />
        </div>
        <div className="max-h-64 space-y-1 overflow-y-auto">
          {(cafes?.data ?? []).map((c) => {
            const has = grantedIds.has(c.id);
            return (
              <div
                key={c.id}
                className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-muted"
              >
                <span className="truncate">{c.name}</span>
                {has ? (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => revoke.mutate(c.id)}
                  >
                    <X className="mr-1 h-3 w-3" /> Remove
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => grant.mutate(c.id)}
                  >
                    <Plus className="mr-1 h-3 w-3" /> Add
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}
