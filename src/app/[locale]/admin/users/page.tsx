'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Ban, ChevronLeft, ChevronRight, Search, Shield, ShieldOff, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Card,
  EmptyState,
  PageHeader,
  Select,
  SelectOption,
  StatusPill,
  Table,
  Td,
  Th,
} from '@/components/admin/primitives';
import {
  adminDeleteUser,
  adminListUsers,
  adminSetUserRole,
  adminSetUserStatus,
  type AdminUser,
  type UserRole,
  type UserStatus,
} from '@/lib/api/admin';

const ROLES: UserRole[] = ['USER', 'ADMIN', 'SUPER_ADMIN'];
const STATUSES: UserStatus[] = ['ACTIVE', 'SUSPENDED', 'BANNED'];

const statusTone: Record<UserStatus, 'green' | 'amber' | 'red'> = {
  ACTIVE: 'green',
  SUSPENDED: 'amber',
  BANNED: 'red',
};

const roleTone: Record<UserRole, 'green' | 'amber' | 'muted'> = {
  SUPER_ADMIN: 'amber',
  ADMIN: 'green',
  USER: 'muted',
};

function initials(u: AdminUser) {
  const s = u.name || u.username || '?';
  return s.trim().slice(0, 2).toUpperCase();
}

export default function UsersPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | ''>('');
  const [statusFilter, setStatusFilter] = useState<UserStatus | ''>('');
  const [cursor, setCursor] = useState<string | undefined>(undefined);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter || undefined, statusFilter || undefined, cursor, locale],
    queryFn: () =>
      adminListUsers({
        q: search || undefined,
        role: (roleFilter as UserRole) || undefined,
        status: (statusFilter as UserStatus) || undefined,
        cursor,
        locale,
      }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-users'] });

  const setRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: UserRole }) =>
      adminSetUserRole(id, role),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: (payload: {
      id: string;
      status: UserStatus;
      suspendedUntil?: string;
    }) => adminSetUserStatus(payload.id, payload),
    onSuccess: invalidate,
  });
  const del = useMutation({
    mutationFn: (id: string) => adminDeleteUser(id),
    onSuccess: invalidate,
  });

  const bulkStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: UserStatus }) => {
      for (const id of ids) {
        await adminSetUserStatus(id, { status });
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
        await adminDeleteUser(id);
      }
    },
    onSuccess: () => {
      invalidate();
      setSelected(new Set());
    },
  });

  const handleStatus = (u: AdminUser, status: UserStatus) => {
    if (status === 'SUSPENDED') {
      const days = prompt('Suspend for how many days?', '7');
      if (!days) return;
      const until = new Date(
        Date.now() + Number(days) * 86_400_000,
      ).toISOString();
      setStatus.mutate({ id: u.id, status, suspendedUntil: until });
    } else {
      setStatus.mutate({ id: u.id, status });
    }
  };

  const users = data?.data ?? [];
  const allSelected = users.length > 0 && users.every((u) => selected.has(u.id));

  const resetFilters = () => {
    setQ('');
    setSearch('');
    setRoleFilter('');
    setStatusFilter('');
    setCursor(undefined);
    setSelected(new Set());
  };

  const hasFilters = search || roleFilter || statusFilter;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle={`${data?.nextCursor || users.length > 0 ? `${users.length} users` : 'Manage roles and moderation status.'}`}
        actions={
          selected.size > 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{selected.size} selected</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (confirm(`Suspend ${selected.size} users for 7 days?`))
                    bulkStatus.mutate({ ids: Array.from(selected), status: 'SUSPENDED' });
                }}
                disabled={bulkStatus.isPending}
              >
                <ShieldOff className="size-3.5" /> Suspend
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Ban ${selected.size} users? This cannot be undone.`))
                    bulkStatus.mutate({ ids: Array.from(selected), status: 'BANNED' });
                }}
                disabled={bulkStatus.isPending}
              >
                <Ban className="size-3.5" /> Ban
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  if (confirm(`Delete ${selected.size} users? This cannot be undone.`))
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
            }}
            className="flex flex-1 items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search by name, username, phone, email…"
                className="h-8 pl-9"
              />
            </div>
            <Button type="submit" size="sm" variant="outline">
              Search
            </Button>
          </form>
          <Select
            value={roleFilter}
            onValueChange={(v) => {
              setRoleFilter(v as UserRole | '');
              setCursor(undefined);
            }}
            className="w-36"
          >
            <SelectOption value="">All roles</SelectOption>
            {ROLES.map((r) => (
              <SelectOption key={r} value={r}>
                {r}
              </SelectOption>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(v) => {
              setStatusFilter(v as UserStatus | '');
              setCursor(undefined);
            }}
            className="w-36"
          >
            <SelectOption value="">All statuses</SelectOption>
            {STATUSES.map((s) => (
              <SelectOption key={s} value={s}>
                {s}
              </SelectOption>
            ))}
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
              <Th>User</Th>
              <Th>Contact</Th>
              <Th>Role</Th>
              <Th>Status</Th>
              <Th className="text-right">Joined</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 8 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <Td><div className="h-4 w-4 rounded bg-muted" /></Td>
                <Td>
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-24 rounded bg-muted" />
                      <div className="h-2.5 w-16 rounded bg-muted" />
                    </div>
                  </div>
                </Td>
                <Td><div className="h-3 w-20 rounded bg-muted" /></Td>
                <Td><div className="h-6 w-24 rounded bg-muted" /></Td>
                <Td><div className="h-5 w-20 rounded-full bg-muted" /></Td>
                <Td><div className="h-3 w-16 rounded bg-muted ml-auto" /></Td>
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
                        setSelected(new Set(users.map((u) => u.id)));
                      } else {
                        setSelected(new Set());
                      }
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                </Th>
                <Th>User</Th>
                <Th>Contact</Th>
                <Th>Role</Th>
                <Th>Status</Th>
                <Th className="text-right">Joined</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((u) => (
                <tr key={u.id} className="transition-colors hover:bg-muted/30">
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(u.id)}
                      onChange={(e) => {
                        const next = new Set(selected);
                        if (e.target.checked) next.add(u.id);
                        else next.delete(u.id);
                        setSelected(next);
                      }}
                      className="h-4 w-4 rounded border-border"
                    />
                  </Td>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar size="sm">
                        {u.avatarUrl ? <AvatarImage src={u.avatarUrl} /> : null}
                        <AvatarFallback>{initials(u)}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="truncate font-medium">{u.name ?? '—'}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          @{u.username ?? '—'}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td className="text-xs text-muted-foreground">
                    <div>{u.phone ?? ''}</div>
                    <div className="truncate">{u.email ?? ''}</div>
                  </Td>
                  <Td>
                    <Select
                      value={u.role}
                      onValueChange={(v) =>
                        setRole.mutate({ id: u.id, role: v as UserRole })
                      }
                    >
                      {ROLES.map((r) => (
                        <SelectOption key={r} value={r}>
                          {r}
                        </SelectOption>
                      ))}
                    </Select>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <StatusPill tone={statusTone[u.status]}>{u.status}</StatusPill>
                      <Select
                        value={u.status}
                        onValueChange={(v) => handleStatus(u, v as UserStatus)}
                        className="h-7 text-xs"
                      >
                        {STATUSES.map((s) => (
                          <SelectOption key={s} value={s}>
                            {s}
                          </SelectOption>
                        ))}
                      </Select>
                    </div>
                  </Td>
                  <Td className="text-right text-xs text-muted-foreground">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </Td>
                  <Td className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        if (confirm(`Delete ${u.username ?? u.id}?`))
                          del.mutate(u.id);
                      }}
                      title="Delete user"
                    >
                      <Trash2 className="size-4 text-muted-foreground" />
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {users.length} user{users.length !== 1 ? 's' : ''} shown
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

          {data && users.length === 0 ? (
            <EmptyState>
              {hasFilters ? (
                <>
                  No users match your filters.
                  <Button variant="link" size="sm" onClick={resetFilters} className="mt-1">
                    Reset filters
                  </Button>
                </>
              ) : (
                'No users found.'
              )}
            </EmptyState>
          ) : null}
        </>
      )}
    </div>
  );
}
