'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { Check, ExternalLink, MapPin, X } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
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
  adminListSuggestions,
  adminUpdateSuggestion,
  type SuggestionStatus,
} from '@/lib/api/admin';

const STATUS_OPTS: SuggestionStatus[] = ['PENDING', 'APPROVED', 'REJECTED'];

const statusTone: Record<SuggestionStatus, 'amber' | 'green' | 'red'> = {
  PENDING: 'amber',
  APPROVED: 'green',
  REJECTED: 'red',
};

export default function SuggestionsPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<SuggestionStatus>('PENDING');

  const { data } = useQuery({
    queryKey: ['admin-suggestions', statusFilter, locale],
    queryFn: () => adminListSuggestions({ status: statusFilter, locale }),
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['admin-suggestions'] });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: SuggestionStatus }) =>
      adminUpdateSuggestion(id, { status }),
    onSuccess: invalidate,
  });

  const suggestions = data?.data ?? [];

  return (
    <div>
      <PageHeader
        title="Cafe Suggestions"
        subtitle="User-submitted cafe suggestions awaiting review."
        actions={
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as SuggestionStatus)}
            className="w-36"
          >
            {STATUS_OPTS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        }
      />

      <Table>
        <thead className="bg-muted/40">
          <tr>
            <Th>Cafe</Th>
            <Th>Suggested by</Th>
            <Th>Location</Th>
            <Th>Notes</Th>
            <Th>Status</Th>
            <Th className="text-right">Submitted</Th>
            <Th className="text-right">Actions</Th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {suggestions.map((s) => (
            <tr key={s.id} className="transition-colors hover:bg-muted/30">
              <Td>
                <div className="font-medium">{s.name}</div>
                <div className="truncate text-xs text-muted-foreground">{s.address}</div>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <Avatar size="sm">
                    {s.user.avatarUrl ? <AvatarImage src={s.user.avatarUrl} /> : null}
                    <AvatarFallback>
                      {(s.user.name ?? s.user.username ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{s.user.name ?? '—'}</div>
                    <div className="text-xs text-muted-foreground">@{s.user.username ?? '—'}</div>
                  </div>
                </div>
              </Td>
              <Td>
                {s.lat != null ? (
                  <a
                    href={`https://www.google.com/maps?q=${s.lat},${s.lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                  >
                    <MapPin className="size-3" />
                    View on map
                    <ExternalLink className="size-3" />
                  </a>
                ) : (
                  <span className="text-xs text-muted-foreground">No pin</span>
                )}
              </Td>
              <Td>
                <p className="max-w-[200px] truncate text-xs text-muted-foreground">
                  {s.notes ?? '—'}
                </p>
              </Td>
              <Td>
                <StatusPill tone={statusTone[s.status]}>{s.status}</StatusPill>
              </Td>
              <Td className="text-right text-xs text-muted-foreground">
                {new Date(s.createdAt).toLocaleDateString()}
              </Td>
              <Td className="text-right">
                <div className="flex items-center justify-end gap-1">
                  {s.status !== 'APPROVED' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => update.mutate({ id: s.id, status: 'APPROVED' })}
                      title="Approve"
                      className="gap-1 text-green-600 hover:text-green-700"
                    >
                      <Check className="size-3.5" />
                      Approve
                    </Button>
                  )}
                  {s.status !== 'REJECTED' && (
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => update.mutate({ id: s.id, status: 'REJECTED' })}
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
      {data && suggestions.length === 0 ? (
        <EmptyState>No {statusFilter.toLowerCase()} suggestions.</EmptyState>
      ) : null}
    </div>
  );
}
