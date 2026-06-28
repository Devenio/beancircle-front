'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { ChevronLeft, ChevronRight, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  adminAuditLog,
  type AuditEntry,
} from '@/lib/api/admin';
import {
  Card,
  EmptyState,
  PageHeader,
  Select,
  SelectOption,
  Table,
  Td,
  Th,
} from '@/components/admin/primitives';

const ACTION_GROUPS = [
  { label: 'All actions', value: '' },
  { label: 'Feature flags', value: 'flag' },
  { label: 'Onboarding flow', value: 'flow' },
  { label: 'User actions', value: 'user' },
  { label: 'Cafe actions', value: 'cafe' },
  { label: 'Menu actions', value: 'menu' },
];

function matchesFilter(entry: AuditEntry, filter: string, search: string): boolean {
  if (filter && !entry.action.startsWith(filter)) return false;
  if (search) {
    const term = search.toLowerCase();
    const actorMatch = entry.actor?.username?.toLowerCase().includes(term) ||
      entry.actor?.name?.toLowerCase().includes(term);
    const actionMatch = entry.action.toLowerCase().includes(term);
    const entityMatch = entry.entity?.toLowerCase().includes(term) ||
      entry.entityId?.toLowerCase().includes(term);
    if (!actorMatch && !actionMatch && !entityMatch) return false;
  }
  return true;
}

function formatAction(action: string): string {
  return action
    .replace(/\./g, ' · ')
    .replace(/_/g, ' ');
}

function formatEntity(entry: AuditEntry): string {
  if (!entry.entity) return '—';
  const meta = entry.meta as Record<string, unknown> | null;
  const parts = [entry.entity];
  if (entry.entityId) parts.push(entry.entityId);
  if (meta && typeof meta === 'object') {
    if ('enabled' in meta) parts.push(meta.enabled ? 'ON' : 'OFF');
    if ('cafeId' in meta) parts.push(`cafe:${String(meta.cafeId).slice(0, 8)}`);
  }
  return parts.join(' : ');
}

export default function AuditPage() {
  const { locale } = useParams<{ locale: string }>();
  const [actionFilter, setActionFilter] = useState('');
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit', cursor, locale],
    queryFn: () => adminAuditLog(cursor, locale),
  });

  const rows = data?.data ?? [];
  const filtered = rows.filter((e) => matchesFilter(e, actionFilter, search));
  const totalCount = filtered.length;

  return (
    <div>
      <PageHeader
        title="Audit Log"
        subtitle="Every super-admin action, newest first."
      />

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by actor, action, or entity…"
              className="h-8 pl-9"
            />
          </div>
          <Select
            value={actionFilter}
            onValueChange={(v) => setActionFilter(v)}
            className="w-44"
          >
            {ACTION_GROUPS.map((g) => (
              <SelectOption key={g.value} value={g.value}>
                {g.label}
              </SelectOption>
            ))}
          </Select>
          {(search || actionFilter) && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch('');
                setActionFilter('');
              }}
            >
              Reset
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Table>
          <thead className="bg-muted/40">
            <tr>
              <Th>When</Th>
              <Th>Actor</Th>
              <Th>Action</Th>
              <Th>Entity</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 10 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <Td><div className="h-3 w-28 rounded bg-muted" /></Td>
                <Td><div className="h-3 w-20 rounded bg-muted" /></Td>
                <Td><div className="h-5 w-32 rounded bg-muted" /></Td>
                <Td><div className="h-3 w-36 rounded bg-muted" /></Td>
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <>
          <Table>
            <thead className="bg-muted/40">
              <tr>
                <Th>When</Th>
                <Th>Actor</Th>
                <Th>Action</Th>
                <Th>Entity</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((e) => (
                <tr key={e.id} className="transition-colors hover:bg-muted/30">
                  <Td className="whitespace-nowrap text-xs text-muted-foreground">
                    {new Date(e.createdAt).toLocaleString()}
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">
                        {e.actor?.username ?? e.actor?.name ?? '—'}
                      </span>
                    </div>
                  </Td>
                  <Td>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {formatAction(e.action)}
                    </code>
                  </Td>
                  <Td className="text-xs text-muted-foreground max-w-[300px] truncate">
                    {formatEntity(e)}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {totalCount} entr{totalCount !== 1 ? 'ies' : 'y'} shown
              {(search || actionFilter) ? ' (filtered)' : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCursor(undefined)}
                disabled={!cursor}
              >
                <ChevronLeft className="size-3.5" /> First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data?.nextCursor) setCursor(data.nextCursor);
                }}
                disabled={!data?.nextCursor}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {filtered.length === 0 ? (
            <EmptyState>
              {search || actionFilter ? (
                <>
                  No audit entries match your filters.
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => {
                      setSearch('');
                      setActionFilter('');
                    }}
                    className="mt-1"
                  >
                    Reset filters
                  </Button>
                </>
              ) : (
                'No audit entries yet.'
              )}
            </EmptyState>
          ) : null}
        </>
      )}
    </div>
  );
}
