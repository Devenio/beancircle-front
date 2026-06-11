'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi, type QrCodeRow, type QrKind } from '@/lib/api/cafe-os';
import { apiBlob } from '@/lib/api/client';
import { Link } from '@/i18n/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Download,
  DoorOpen,
  Plus,
  Printer,
  QrCode as QrIcon,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useState } from 'react';

const KIND_ICONS: Record<QrKind, typeof QrIcon> = {
  MENU: UtensilsCrossed,
  TABLE: QrIcon,
  ENTRANCE: DoorOpen,
  EVENT: CalendarDays,
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function QrPage() {
  const t = useTranslations('cafeOs.qr');
  const { cafeId } = useParams<{ cafeId: string }>();
  const qc = useQueryClient();
  const [downloading, setDownloading] = useState<string | null>(null);

  const { data: codes, isLoading } = useQuery({
    queryKey: ['cafe-qr', cafeId],
    queryFn: () => cafeOsApi.qrCodes(cafeId),
  });

  const createMutation = useMutation({
    mutationFn: (kind: QrKind) => cafeOsApi.createQr(cafeId, { kind }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe-qr', cafeId] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (qrId: string) => cafeOsApi.deleteQr(cafeId, qrId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe-qr', cafeId] }),
  });

  async function download(qr: QrCodeRow, format: 'png' | 'svg') {
    setDownloading(`${qr.id}-${format}`);
    try {
      const blob = await apiBlob(`/cafe-os/cafes/${cafeId}/qr/${qr.id}/${format}`);
      downloadBlob(blob, `qr-${qr.kind.toLowerCase()}-${qr.code}.${format}`);
    } finally {
      setDownloading(null);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{t('title')}</h1>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate('ENTRANCE')}
          >
            <Plus className="h-4 w-4" />
            {t('newEntrance')}
          </Button>
        </div>
      </div>

      <p className="text-sm text-muted-foreground">{t('hint')}</p>

      {!codes?.length ? (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center">
          <QrIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">{t('empty')}</p>
          <Button
            className="mt-4"
            disabled={createMutation.isPending}
            onClick={() => createMutation.mutate('MENU')}
          >
            <Plus className="h-4 w-4" />
            {t('createMenuQr')}
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {codes.map((qr) => {
            const Icon = KIND_ICONS[qr.kind] ?? QrIcon;
            return (
              <div
                key={qr.id}
                className="rounded-2xl border border-border bg-card p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {qr.table?.name || qr.label || t(`kinds.${qr.kind}`)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t('scans', { count: qr.scanCount })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="text-destructive"
                    disabled={deleteMutation.isPending}
                    onClick={() => {
                      if (window.confirm(t('deleteConfirm'))) deleteMutation.mutate(qr.id);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="mt-2.5 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={downloading === `${qr.id}-png`}
                    onClick={() => download(qr, 'png')}
                  >
                    <Download className="h-3.5 w-3.5" />
                    PNG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    disabled={downloading === `${qr.id}-svg`}
                    onClick={() => download(qr, 'svg')}
                  >
                    <Download className="h-3.5 w-3.5" />
                    SVG
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1"
                    render={<Link href={`/cafe-os/${cafeId}/qr/poster/${qr.id}`} />}
                  >
                    <Printer className="h-3.5 w-3.5" />
                    {t('poster')}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
