'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Search, Trash2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  EmptyState,
  PageHeader,
  Select,
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

function initials(u: AdminUser) {
  const s = u.name || u.username || '?';
  return s.trim().slice(0, 2).toUpperCase();
}

export default function UsersPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');

  const { data } = useQuery({
    queryKey: ['admin-users', search, locale],
    queryFn: () => adminListUsers({ q: search, locale }),
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

  return (
    <div>
      <PageHeader title="Users" subtitle="Manage roles and moderation status." />

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(q.trim());
        }}
        className="mb-4 flex items-center gap-2"
      >
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, username, phone, email…"
            className="pl-9"
          />
        </div>
        <Button type="submit">Search</Button>
      </form>

      <Table>
        <thead className="bg-muted/40">
          <tr>
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
                  onChange={(e) =>
                    setRole.mutate({ id: u.id, role: e.target.value as UserRole })
                  }
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <StatusPill tone={statusTone[u.status]}>{u.status}</StatusPill>
                  <Select
                    value={u.status}
                    onChange={(e) =>
                      handleStatus(u, e.target.value as UserStatus)
                    }
                    className="h-7 text-xs"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
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
      {data && users.length === 0 ? (
        <EmptyState>No users found.</EmptyState>
      ) : null}
    </div>
  );
}
