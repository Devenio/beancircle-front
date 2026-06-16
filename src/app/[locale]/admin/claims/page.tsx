'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { BadgeCheck, Check, Coffee, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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

  const { data } = useQuery({
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

  const claims = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Ownership Claims"
        subtitle="Owners claiming or creating cafes, awaiting verification."
        actions={
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
        }
      />

      <Table>
        <thead className="bg-muted/40">
          <tr>
            <Th>Cafe</Th>
            <Th>Claimant</Th>
            <Th>Type</Th>
            <Th>Message / Phone</Th>
            <Th>Status</Th>
            <Th className="text-right">Submitted</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {claims.map((c) => (
            <tr key={c.id} className="transition-colors hover:bg-muted/30">
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
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {c.user.avatarUrl ? <AvatarImage src={c.user.avatarUrl} /> : null}
                    <AvatarFallback>
                      {(c.user.name ?? c.user.username ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{c.user.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">@{c.user.username ?? '—'}</div>
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
                <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {c.message ?? '—'}
                </p>
                {c.phone ? (
                  <p className="text-xs text-muted-foreground">{c.phone}</p>
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
                      onClick={() => update.mutate({ id: c.id, status: 'APPROVED' })}
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
                          window.prompt('Reason for rejection (optional):') ?? undefined;
                        update.mutate({ id: c.id, status: 'REJECTED', adminNote });
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
      {data && claims.length === 0 ? (
        <EmptyState>No {statusFilter.toLowerCase()} claims.</EmptyState>
      ) : null}
    </div>
  );
}
