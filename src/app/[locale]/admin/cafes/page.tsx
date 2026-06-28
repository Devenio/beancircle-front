'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Ban, ChevronLeft, ChevronRight, Search, Star, Trash2, UserCog, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
import {
  adminDeleteCafe,
  adminListCafes,
  adminUpdateCafe,
  adminGetCafeStaff,
  adminSetCafeOwner,
  adminRemoveCafeStaff,
  type AdminCafe,
  type CafeStaffMember,
} from '@/lib/api/admin';

const ROLE_BADGE: Record<string, string> = {
  OWNER: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300',
  MANAGER: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  STAFF: 'bg-muted text-muted-foreground',
  MODERATOR: 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300',
};

// ─── Staff drawer ─────────────────────────────────────────────────────────────

function StaffDrawer({
  cafe,
  locale,
  onClose,
}: {
  cafe: AdminCafe;
  locale: string;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [newUserId, setNewUserId] = useState('');
  const key = ['admin-cafe-staff', cafe.id];

  const { data: staff = [] } = useQuery({
    queryKey: key,
    queryFn: () => adminGetCafeStaff(cafe.id, locale),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const setOwner = useMutation({
    mutationFn: (userId: string) => adminSetCafeOwner(cafe.id, userId),
    onSuccess: () => { setNewUserId(''); invalidate(); },
  });

  const removeStaff = useMutation({
    mutationFn: (userId: string) => adminRemoveCafeStaff(cafe.id, userId),
    onSuccess: invalidate,
  });

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={onClose} />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div>
            <p className="font-semibold">{cafe.name}</p>
            <p className="text-xs text-muted-foreground">Staff & ownership</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex size-8 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {/* Set owner */}
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Set owner by user ID
          </p>
          <div className="flex gap-2">
            <Input
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="User UUID…"
              className="flex-1 font-mono text-xs"
            />
            <Button
              size="sm"
              disabled={!newUserId.trim() || setOwner.isPending}
              onClick={() => setOwner.mutate(newUserId.trim())}
            >
              Set owner
            </Button>
          </div>
          {setOwner.isError && (
            <p className="mt-1 text-xs text-destructive">
              {(setOwner.error as Error).message}
            </p>
          )}

          {/* Staff list */}
          <p className="mb-2 mt-6 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Current staff ({staff.length})
          </p>
          {staff.length === 0 ? (
            <p className="text-sm text-muted-foreground">No staff assigned.</p>
          ) : (
            <ul className="space-y-2">
              {staff.map((m: CafeStaffMember) => (
                <li
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border px-3 py-2.5"
                >
                  <Avatar size="sm">
                    {m.user.avatarUrl ? <AvatarImage src={m.user.avatarUrl} /> : null}
                    <AvatarFallback>
                      {(m.user.name ?? m.user.username ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{m.user.name ?? '—'}</p>
                    <p className="text-xs text-muted-foreground">@{m.user.username ?? m.user.id}</p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold ${ROLE_BADGE[m.role] ?? ROLE_BADGE.STAFF}`}
                  >
                    {m.role}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Remove ${m.user.username ?? m.user.id} from staff?`))
                        removeStaff.mutate(m.user.id);
                    }}
                    className="ml-1 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Remove"
                  >
                    <X className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CafesPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<string>('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [staffCafe, setStaffCafe] = useState<AdminCafe | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-cafes', search, cursor, locale],
    queryFn: () => adminListCafes({ q: search || undefined, cursor, locale }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-cafes'] });
  const setPartner = useMutation({
    mutationFn: ({ id, isPartner }: { id: string; isPartner: boolean }) =>
      adminUpdateCafe(id, { isPartner }),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteCafe(id),
    onSuccess: invalidate,
  });

  const bulkPartner = useMutation({
    mutationFn: async ({ ids, isPartner }: { ids: string[]; isPartner: boolean }) => {
      for (const id of ids) {
        await adminUpdateCafe(id, { isPartner });
      }
    },
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
    },
  });

  const bulkDelete = useMutation({
    mutationFn: async (ids: string[]) => {
      for (const id of ids) {
        await adminDeleteCafe(id);
      }
    },
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
    },
  });

  const allCafes = data?.data ?? [];
  const cafes = partnerFilter
    ? allCafes.filter((c) =>
        partnerFilter === 'partner' ? c.isPartner : !c.isPartner,
      )
    : allCafes;
  const allSelected = cafes.length > 0 && cafes.every((c) => selected.has(c.id));

  const resetFilters = () => {
    setQ('');
    setSearch('');
    setPartnerFilter('');
    setCursor(undefined);
    setSelected(new Set());
  };

  const hasFilters = search || partnerFilter;

  return (
    <div>
      <PageHeader
        title="Cafes"
        subtitle="Partner status, ownership, menus, and removal."
        actions={
          selected.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() =>
                  bulkPartner.mutate({
                    ids: Array.from(selected),
                    isPartner: true,
                  })
                }
                disabled={bulkPartner.isPending}
              >
                Mark as Partner
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${selected.size} cafes? This cannot be undone.`))
                    bulkDelete.mutate(Array.from(selected));
                }}
                disabled={bulkDelete.isPending}
              >
                <Trash2 className="size-3.5" /> Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>
                Clear
              </Button>
            </div>
          ) : undefined
      }
      />

      {/* Filters */}
      <Card className="mb-4 p-3">
        <div className="flex flex-wrap items-center gap-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(q.trim());
              setCursor(undefined);
              setSelected(new Set());
            }}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search cafes…"
                className="h-8 pl-9"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
          <Select
            value={partnerFilter}
            onValueChange={(v) => {
              setPartnerFilter(v);
              setSelected(new Set());
            }}
            className="w-36"
          >
            <SelectOption value="">All cafes</SelectOption>
            <SelectOption value="partner">Partners only</SelectOption>
            <SelectOption value="non-partner">Non-partners</SelectOption>
          </Select>
          {hasFilters && (
            <Button size="sm" variant="ghost" onClick={resetFilters}>
              Reset
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <Table>
          <thead className="bg-muted/40">
            <tr>
              <Th className="w-10" />
              <Th>Cafe</Th>
              <Th>City</Th>
              <Th className="text-right">Rating</Th>
              <Th className="text-right">Followers</Th>
              <Th>Partner</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <Td><div className="h-4 w-4 rounded bg-muted" /></Td>
                <Td>
                  <div className="space-y-1">
                    <div className="h-3 w-28 rounded bg-muted" />
                    <div className="h-2.5 w-36 rounded bg-muted" />
                  </div>
                </Td>
                <Td><div className="h-3 w-20 rounded bg-muted" /></Td>
                <Td><div className="h-3 w-12 rounded bg-muted ml-auto" /></Td>
                <Td><div className="h-3 w-10 rounded bg-muted ml-auto" /></Td>
                <Td><div className="h-5 w-9 rounded-full bg-muted" /></Td>
                <Td />
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
        <>
          <Table>
            <thead className="bg-muted/40">
              <tr>
                <Th className="w-10">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelected(new Set(cafes.map((c) => c.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                </Th>
                <Th>Cafe</Th>
                <Th>City</Th>
                <Th className="text-right">Rating</Th>
                <Th className="text-right">Followers</Th>
                <Th>Partner</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {cafes.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-muted/30">
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(c.id);
                        else next.delete(c.id);
                        setSelected(next);
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                  </Td>
                  <Td>
                    <div className="font-medium">{c.name}</div>
                    <div className="truncate text-xs text-muted-foreground">{c.address}</div>
                  </Td>
                  <Td className="text-muted-foreground">{c.city?.name ?? '—'}</Td>
                  <Td className="text-right">
                    <span className="inline-flex items-center gap-1 tabular-nums">
                      <Star className="size-3.5 fill-current text-amber-500" />
                      {c.avgRating.toFixed(1)}
                    </span>
                  </Td>
                  <Td className="text-right tabular-nums">{c.followerCount}</Td>
                  <Td>
                    <Switch
                      checked={c.isPartner}
                      onCheckedChange={(isPartner) =>
                        setPartner.mutate({ id: c.id, isPartner })
                      }
                    />
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStaffCafe(c)}
                        title="Manage staff & owner"
                      >
                        <UserCog className="size-3.5" />
                        Owner
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        render={<Link href={`/admin/menus?cafeId=${c.id}`} />}
                      >
                        Menu
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => {
                          if (confirm(`Delete ${c.name}?`)) del.mutate(c.id);
                        }}
                        title="Delete cafe"
                      >
                        <Trash2 className="size-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {cafes.length} cafe{cafes.length !== 1 ? 's' : ''} shown
              {partnerFilter ? ` (filtered)` : ''}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setCursor(undefined);
                  setSelected(new Set());
                }}
                disabled={!cursor}
              >
                <ChevronLeft className="size-3.5" /> First
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (data?.nextCursor) {
                    setCursor(data.nextCursor);
                    setSelected(new Set());
                  }
                }}
                disabled={!data?.nextCursor}
              >
                Next <ChevronRight className="size-3.5" />
              </Button>
            </div>
          </div>

          {cafes.length === 0 ? (
            <EmptyState>
              {hasFilters ? (
                <>
                  No cafes match your filters.
                  <Button variant="link" size="sm" onClick={resetFilters} className="mt-1">
                    Reset filters
                  </Button>
                </>
              ) : (
                'No cafes found.'
              )}
            </EmptyState>
          ) : null}
        </>
      )}

      {staffCafe && (
        <StaffDrawer
          cafe={staffCafe}
          locale={locale}
          onClose={() => setStaffCafe(null)}
        />
      )}
    </div>
  );
}
