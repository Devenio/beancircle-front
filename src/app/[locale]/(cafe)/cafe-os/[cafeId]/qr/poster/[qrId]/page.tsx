'use client';

import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';

export default function QrPosterPage() {
  const t = useTranslations('cafeOs.qr');
  const { cafeId, qrId } = useParams<{ cafeId: string; qrId: string }>();

  const { data: cafe } = useQuery({
    queryKey: ['cafe', cafeId],
    queryFn: () => cafeOsApi.getCafe(cafeId),
  });

  const { data } = useQuery({
    queryKey: ['cafe-qr-data', cafeId, qrId],
    queryFn: () => cafeOsApi.qrData(cafeId, qrId),
  });

  if (!data || !cafe) {
    return (
      <div className="space-y-4 p-6">
        <Skeleton className="mx-auto h-64 w-64 rounded-2xl" />
        <Skeleton className="mx-auto h-6 w-40" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white text-black print:bg-white">
      <div className="mx-auto flex min-h-dvh max-w-[430px] flex-col items-center justify-center gap-8 p-8 text-center">
        {cafe.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cafe.logoUrl}
            alt=""
            className="h-20 w-20 rounded-2xl object-cover"
          />
        ) : null}

        <div>
          <h1 className="text-3xl font-bold">{cafe.name}</h1>
          {data.qr.table ? (
            <p className="mt-1 text-xl text-neutral-600">{data.qr.table.name}</p>
          ) : null}
        </div>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={data.qrDataUrl} alt="QR code" className="h-72 w-72" />

        <div>
          <p className="text-lg font-semibold">{t('posterScanCta')}</p>
          <p className="mt-1 text-sm text-neutral-500">{data.url}</p>
        </div>

        <p className="text-xs text-neutral-400">BeanCircle</p>

        <Button className="print:hidden" onClick={() => window.print()}>
          <Printer className="h-4 w-4" />
          {t('print')}
        </Button>
      </div>
    </div>
  );
}
