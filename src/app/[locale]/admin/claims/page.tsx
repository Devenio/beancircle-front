'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  BadgeCheck,
  Check,
  Coffee,
  ExternalLink,
  Phone,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
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
  adminListClaims,
  adminUpdateClaim,
  type ClaimStatus,
} from '@/lib/api/admin';

const STATUS_OPTS: ClaimStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const statusTone: Record<ClaimStatus, 'amber' | 'green' | 'red'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function ClaimsPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<ClaimStatus>('PENDING');
  const [search, setSearch] = useState('');
  const [selectedClaims, setSelectedClaims] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['admin-claims', statusFilter, locale],
    queryFn: () => adminListClaims({ status: statusFilter, locale }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-claims'] });

  const update = useMutation({
    mutationFn: ({
      id,
      status,
      adminNote,
    }: {
      id: string;
      status: ClaimStatus;
      adminNote?: string;
    }) => adminUpdateClaim(id, { status, adminNote }),
    onSuccess: invalidate,
    meta: {
      successMessage: (_data, variables) =>
        (variables as { status: ClaimStatus }).status === 'APPROVED'
          ? 'Cafe verified and owner attached.'
          : 'Ownership request rejected.',
    },
  });

  const bulkUpdate = useMutation({
    mutationFn: async ({
      ids,
      status,
    }: {
      ids: string[];
      status: ClaimStatus;
    }) => {
      for (const id of ids) {
        await adminUpdateClaim(id, { status });
      }
    },
    onSuccess: () => {
      invalidate();
      setSelectedClaims(new Set());
    },
  });

  const claims = data?.data ?? [];
  const filteredClaims = search
    ? claims.filter(
        (c) =>
          c.cafe.name.toLowerCase().includes(search.toLowerCase()) ||
          c.user.name?.toLowerCase().includes(search.toLowerCase()) ||
          c.user.username?.toLowerCase().includes(search.toLowerCase()),
      )
    : claims;

  const allSelected =
    filteredClaims.length > 0 &&
    filteredClaims.every((c) => selectedClaims.has(c.id));

  return (
    <div>
      <PageHeader
        title="Ownership Claims"
        subtitle="Owners claiming or creating cafes, awaiting verification."
        actions={
          <div className="flex items-center gap-2">
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v as ClaimStatus)}
              className="w-36"
            >
              {STATUS_OPTS.map((s) => (
                <SelectOption key={s} value={s}>
                  {s}
                </SelectOption>
              ))}
            </Select>
          </div>
        }
      />

      <div className="mb-4 flex items-center gap-3">
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search claims by cafe name, user name, or username..."
          className="max-w-sm"
        />
        {statusFilter === 'PENDING' && selectedClaims.size > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">
              {selectedClaims.size} selected
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                bulkUpdate.mutate({
                  ids: Array.from(selectedClaims),
                  status: 'APPROVED',
                })
              }
              disabled={bulkUpdate.isPending}
              className="gap-1 text-green-600 hover:text-green-700"
            >
              <Check className="size-3.5" />
              Approve All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedClaims(new Set())}
            >
              Clear
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Table>
          <thead className="bg-muted/40">
            <tr>
              <Th className="w-10" />
              <Th>Cafe</Th>
              <Th>Claimant</Th>
              <Th>Type</Th>
              <Th>Contact</Th>
              <Th>Status</Th>
              <Th className="text-right">Submitted</Th>
              <Th className="text-right">Actions</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i} className="animate-pulse">
                <Td><div className="h-4 w-4 rounded bg-muted" /></Td>
                <Td>
                  <div className="space-y-1">
                    <div className="h-3 w-24 rounded bg-muted" />
                    <div className="h-2.5 w-32 rounded bg-muted" />
                  </div>
                </Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <div className="size-8 rounded-full bg-muted" />
                    <div className="space-y-1">
                      <div className="h-3 w-20 rounded bg-muted" />
                      <div className="h-2.5 w-14 rounded bg-muted" />
                    </div>
                  </div>
                </Td>
                <Td><div className="h-3 w-20 rounded bg-muted" /></Td>
                <Td><div className="h-3 w-24 rounded bg-muted" /></Td>
                <Td><div className="h-5 w-16 rounded-full bg-muted" /></Td>
                <Td><div className="h-3 w-16 rounded bg-muted ml-auto" /></Td>
                <Td />
              </tr>
            ))}
          </tbody>
        </Table>
      ) : (
      <Table>
        <thead className="bg-muted/40">
          <tr>
            {statusFilter === 'PENDING' && (
              <Th className="w-10">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedClaims(
                        new Set(filteredClaims.map((c) => c.id)),
                      );
                    } else {
                      setSelectedClaims(new Set());
                    }
                  }}
                  className="h-4 w-4 rounded border-border"
                />
              </Th>
            )}
            <Th>Cafe</Th>
            <Th>Claimant</Th>
            <Th>Type</Th>
            <Th>Contact</Th>
            <Th>Status</Th>
            <Th className="text-right">Submitted</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {filteredClaims.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-muted/30">
              {statusFilter === 'PENDING' && (
                <Td>
                  <input
                    type="checkbox"
                    checked={selectedClaims.has(c.id)}
                    onChange={(e) => {
                      const next = new Set(selectedClaims);
                      if (e.target.checked) next.add(c.id);
                      else next.delete(c.id);
                      setSelectedClaims(next);
                    }}
                    className="h-4 w-4 rounded border-border"
                  />
                </Td>
              )}
              <Td>
                <div className="flex items-center gap-1.5 font-medium">
                  {c.cafe.name}
                  {c.cafe.isVerified ? (
                    <BadgeCheck className="size-4 text-emerald-500" />
                  ) : null}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {c.cafe.address}
                </div>
                <a
                  href={`/admin/cafes?q=${encodeURIComponent(c.cafe.name)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-0.5 inline-flex items-center gap-1 text-[10px] text-primary hover:underline"
                >
                  View cafe <ExternalLink className="size-2.5" />
                </a>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {c.user.avatarUrl ? (
                      <AvatarImage src={c.user.avatarUrl} />
                    ) : null}
                    <AvatarFallback>
                      {(c.user.name ?? c.user.username ?? '?')
                        .slice(0, 2)
                        .toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">
                      {c.user.name ?? '—'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      @{c.user.username ?? '—'}
                    </div>
                  </div>
                </div>
              </Td>
              <Td>
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Coffee className="size-3" />
                  {c.kind === 'NEW_CAFE' ? 'New cafe' : 'Claim existing'}
                </span>
              </Td>
              <Td>
                {c.phone ? (
                  <div className="flex items-center gap-1 text-xs">
                    <Phone className="size-3 text-muted-foreground" />
                    <span className="font-mono">{c.phone}</span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">—</span>
                )}
                {c.message ? (
                  <p className="mt-1 max-w-[180px] truncate text-[11px] text-muted-foreground">
                    "{c.message}"
                  </p>
                ) : null}
              </Td>
              <Td>
                <StatusPill tone={statusTone[c.status]}>{c.status}</StatusPill>
              </Td>
              <Td className="text-right text-xs text-muted-foreground">
                {new Date(c.createdAt).toLocaleDateString()}
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {c.status !== 'APPROVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        update.mutate({ id: c.id, status: 'APPROVED' })
                      }
                      title="Approve"
                      className="gap-1 text-green-600 hover:text-green-700"
                    >
                      <Check className="size-3.5" />
                      Verify
                    </Button>
                  )}
                  {c.status !== 'REJECTED' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const adminNote =
                          window.prompt(
                            'Reason for rejection (optional):',
                          ) ?? undefined;
                        update.mutate({
                          id: c.id,
                          status: 'REJECTED',
                          adminNote,
                        });
                      }}
                      title="Reject"
                    >
                      <X className="size-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      )}

      {data && filteredClaims.length === 0 ? (
        <EmptyState>
          {search
            ? `No claims matching "${search}"`
            : `No ${statusFilter.toLowerCase()} claims.`}
        </EmptyState>
      ) : null}
    </div>
  );
}
