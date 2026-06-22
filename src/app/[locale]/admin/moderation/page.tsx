'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  Ban,
  Check,
  ChevronRight,
  Eye,
  MessageSquare,
  Shield,
  Trash2,
  UserX,
  X,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  EmptyState,
  PageHeader,
  StatCard,
  StatusPill,
  Table,
  Td,
  Th,
} from '@/components/admin/primitives';
import {
  adminDismissReport,
  adminGetReport,
  adminListReports,
  adminRemoveReportedContent,
  adminResolveReport,
  adminWarnUser,
  type AdminReport,
  type ReportStatus,
  type ReportTargetType,
} from '@/lib/api/admin';

type Tab = 'all' | 'PENDING' | 'RESOLVED' | 'DISMISSED';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'PENDING', label: 'Pending' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'DISMISSED', label: 'Dismissed' },
];

const statusTone: Record<ReportStatus, 'red' | 'green' | 'muted'> = {
  PENDING: 'red',
  RESOLVED: 'green',
  DISMISSED: 'muted',
};

const targetTypeLabels: Record<ReportTargetType, string> = {
  USER: 'User',
  POST: 'Post',
  REVIEW: 'Review',
  CAFE: 'Cafe',
  MESSAGE: 'Message',
};

const targetTypeIcons: Record<ReportTargetType, React.ComponentType<{ className?: string }>> = {
  USER: UserX,
  POST: MessageSquare,
  REVIEW: MessageSquare,
  CAFE: Shield,
  MESSAGE: MessageSquare,
};

function targetPreviewText(report: AdminReport): string {
  const p = report.targetPreview;
  if (!p) return 'Content not found';
  switch (report.targetType) {
    case 'USER':
      return `@${(p as { username?: string }).username ?? 'unknown'} — ${(p as { name?: string }).name ?? 'No name'}`;
    case 'POST':
      return (p as { caption?: string }).caption ?? '(no caption)';
    case 'REVIEW':
      return (p as { body?: string }).body ?? '(no text)';
    case 'MESSAGE':
      return (p as { body?: string }).body ?? '(no content)';
    case 'CAFE':
      return `${(p as { name?: string }).name ?? 'Unknown'} — ${(p as { address?: string }).address ?? ''}`;
    default:
      return '';
  }
}

function initials(name?: string | null, username?: string | null) {
  const s = name || username || '?';
  return s.trim().slice(0, 2).toUpperCase();
}

export default function ModerationPage() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const statusFilter = tab === 'all' ? undefined : (tab as ReportStatus);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-reports', statusFilter, locale],
    queryFn: () => adminListReports({ status: statusFilter, locale }),
  });

  const { data: detail } = useQuery({
    queryKey: ['admin-report-detail', selectedId, locale],
    queryFn: () => adminGetReport(selectedId!, locale),
    enabled: !!selectedId,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['admin-reports'] });
    qc.invalidateQueries({ queryKey: ['admin-report-detail'] });
  };

  const resolveMut = useMutation({
    mutationFn: () => adminResolveReport(selectedId!, actionNote || undefined),
    onSuccess: () => { invalidate(); setSelectedId(null); setActionNote(''); },
  });

  const dismissMut = useMutation({
    mutationFn: () => adminDismissReport(selectedId!, actionNote || undefined),
    onSuccess: () => { invalidate(); setSelectedId(null); setActionNote(''); },
  });

  const removeContentMut = useMutation({
    mutationFn: () => adminRemoveReportedContent(selectedId!),
    onSuccess: () => { invalidate(); setSelectedId(null); },
  });

  const warnMut = useMutation({
    mutationFn: (userId: string) => adminWarnUser(userId, 'Content moderation warning'),
    onSuccess: () => { invalidate(); },
  });

  const suspendMut = useMutation({
    mutationFn: (userId: string) => {
      const until = new Date(Date.now() + 7 * 86_400_000).toISOString();
      return import('@/lib/api/admin').then((m) =>
        m.adminSetUserStatus(userId, { status: 'SUSPENDED', suspendedUntil: until, note: 'Suspended via moderation' }),
      );
    },
    onSuccess: invalidate,
  });

  const banMut = useMutation({
    mutationFn: (userId: string) =>
      import('@/lib/api/admin').then((m) =>
        m.adminSetUserStatus(userId, { status: 'BANNED', note: 'Banned via moderation' }),
      ),
    onSuccess: invalidate,
  });

  const reports = data?.data ?? [];
  const pendingCount = reports.filter((r) => r.status === 'PENDING').length;

  return (
    <div>
      <PageHeader
        title="Moderation"
        subtitle="Review reported content and take action."
        actions={
          <StatusPill tone="red">
            {pendingCount} pending
          </StatusPill>
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Reports" value={reports.length} icon={Eye} />
        <StatCard
          label="Pending"
          value={reports.filter((r) => r.status === 'PENDING').length}
          icon={AlertTriangle}
          hint="Needs review"
        />
        <StatCard
          label="Resolved"
          value={reports.filter((r) => r.status === 'RESOLVED').length}
          icon={Check}
        />
        <StatCard
          label="Dismissed"
          value={reports.filter((r) => r.status === 'DISMISSED').length}
          icon={X}
        />
      </div>

      <div className="mb-4 inline-flex gap-1 rounded-lg bg-muted p-1">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors data-[active]:bg-background data-[active]:shadow-sm text-muted-foreground hover:text-foreground"
            data-active={tab === t.key ? '' : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Card className="p-8 text-center text-sm text-muted-foreground">Loading reports…</Card>
      ) : reports.length === 0 ? (
        <EmptyState>No reports found.</EmptyState>
      ) : (
        <Table>
          <thead className="bg-muted/40">
            <tr>
              <Th>Target</Th>
              <Th>Reported by</Th>
              <Th>Reason</Th>
              <Th>Status</Th>
              <Th className="text-right">Date</Th>
              <Th />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {reports.map((r) => {
              const Icon = targetTypeIcons[r.targetType];
              return (
                <tr
                  key={r.id}
                  className="cursor-pointer transition-colors hover:bg-muted/30"
                  onClick={() => { setSelectedId(r.id); setActionNote(''); }}
                >
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
                        <Icon className="size-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-muted-foreground">
                            {targetTypeLabels[r.targetType]}
                          </span>
                        </div>
                        <div className="max-w-[280px] truncate text-sm text-foreground">
                          {targetPreviewText(r)}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <Avatar size="sm">
                        {r.reporter.avatarUrl ? <AvatarImage src={r.reporter.avatarUrl} /> : null}
                        <AvatarFallback>{initials(r.reporter.name, r.reporter.username)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">@{r.reporter.username ?? '—'}</span>
                    </div>
                  </Td>
                  <Td>
                    <div className="max-w-[200px] truncate text-sm text-muted-foreground">
                      {r.reason}
                    </div>
                  </Td>
                  <Td>
                    <StatusPill tone={statusTone[r.status]}>{r.status}</StatusPill>
                  </Td>
                  <Td className="text-right text-xs text-muted-foreground">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </Td>
                  <Td className="text-right">
                    <ChevronRight className="inline size-4 text-muted-foreground" />
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </Table>
      )}

      {/* Report Detail Dialog */}
      <Dialog open={!!selectedId} onOpenChange={(o) => { if (!o) setSelectedId(null); }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Report Details</DialogTitle>
          </DialogHeader>

          {detail && (
            <div className="space-y-4">
              {/* Target Content */}
              <Card className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Badge variant="secondary">{targetTypeLabels[detail.targetType]}</Badge>
                  <StatusPill tone={statusTone[detail.status]}>{detail.status}</StatusPill>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap break-words">
                  {targetPreviewText(detail)}
                </p>
                {detail.targetPreview && 'username' in (detail.targetPreview as Record<string, unknown>) && (
                  <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Status: {(detail.targetPreview as { status?: string }).status}</span>
                    <span>Warnings: {(detail.targetPreview as { warningCount?: number }).warningCount ?? 0}</span>
                    <span>Reports: {(detail.targetPreview as { reports?: { _count?: number } }).reports?._count ?? 0}</span>
                  </div>
                )}
              </Card>

              {/* Report Info */}
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-muted-foreground">Reported by: </span>
                  <span className="font-medium">@{detail.reporter.username ?? '—'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Reason: </span>
                  <span>{detail.reason}</span>
                </div>
                {detail.adminNote && (
                  <div>
                    <span className="text-muted-foreground">Admin note: </span>
                    <span>{detail.adminNote}</span>
                  </div>
                )}
              </div>

              {/* Action Note */}
              <Textarea
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                placeholder="Add a note (optional)…"
                rows={2}
                className="resize-none"
              />

              {/* Actions */}
              {detail.status === 'PENDING' && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="default"
                    size="sm"
                    disabled={actionLoading || resolveMut.isPending}
                    onClick={async () => {
                      setActionLoading(true);
                      await resolveMut.mutateAsync();
                      setActionLoading(false);
                    }}
                  >
                    <Check className="size-3.5" />
                    Resolve
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={actionLoading || dismissMut.isPending}
                    onClick={async () => {
                      setActionLoading(true);
                      await dismissMut.mutateAsync();
                      setActionLoading(false);
                    }}
                  >
                    <X className="size-3.5" />
                    Dismiss
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    disabled={actionLoading || removeContentMut.isPending}
                    onClick={async () => {
                      if (!confirm('Remove the reported content? This cannot be undone.')) return;
                      setActionLoading(true);
                      await removeContentMut.mutateAsync();
                      setActionLoading(false);
                    }}
                  >
                    <Trash2 className="size-3.5" />
                    Remove Content
                  </Button>

                  {detail.targetType === 'USER' && detail.targetPreview && 'username' in (detail.targetPreview as Record<string, unknown>) && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={warnMut.isPending}
                        onClick={() => warnMut.mutate(detail.targetId)}
                      >
                        <AlertTriangle className="size-3.5" />
                        Warn User
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={suspendMut.isPending}
                        onClick={() => {
                          if (!confirm('Suspend this user for 7 days?')) return;
                          suspendMut.mutate(detail.targetId);
                        }}
                      >
                        <Ban className="size-3.5" />
                        Suspend 7d
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={banMut.isPending}
                        onClick={() => {
                          if (!confirm('Ban this user permanently?')) return;
                          banMut.mutate(detail.targetId);
                        }}
                      >
                        <Ban className="size-3.5" />
                        Ban
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
