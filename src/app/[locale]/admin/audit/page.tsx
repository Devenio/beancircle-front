'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { adminAuditLog } from '@/lib/api/admin';
import {
  EmptyState,
  PageHeader,
  Table,
  Td,
  Th,
} from '@/components/admin/primitives';

export default function AuditPage() {
  const { locale } = useParams<{ locale: string }>();
  const { data } = useQuery({
    queryKey: ['admin-audit', locale],
    queryFn: () => adminAuditLog(undefined, locale),
  });

  const rows = data?.data ?? [];

  return (
    <div>
      <PageHeader title="Audit Log" subtitle="Every super-admin action, newest first." />

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
          {rows.map((e) => (
            <tr key={e.id} className="transition-colors hover:bg-muted/30">
              <Td className="whitespace-nowrap text-xs text-muted-foreground">
                {new Date(e.createdAt).toLocaleString()}
              </Td>
              <Td>{e.actor?.username ?? e.actor?.name ?? '—'}</Td>
              <Td>
                <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                  {e.action}
                </code>
              </Td>
              <Td className="text-xs text-muted-foreground">
                {e.entity ? `${e.entity}:${e.entityId ?? ''}` : '—'}
              </Td>
            </tr>
          ))}
        </tbody>
      </Table>
      {data && rows.length === 0 ? (
        <EmptyState>No audit entries yet.</EmptyState>
      ) : null}
    </div>
  );
}
