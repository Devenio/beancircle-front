'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import type { PassportStamp } from '@/lib/api/passport';

export function StampGrid({ stamps }: { stamps: PassportStamp[] }) {
  const t = useTranslations('passport');

  if (!stamps.length) {
    return (
      <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t('emptyStamps')}
      </p>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
      {stamps.map((stamp) => (
        <Link
          key={stamp.id}
          href={`/cafe/${stamp.cafe.id}`}
          className="flex flex-col items-center gap-1 rounded-xl border border-border bg-card p-2 text-center"
        >
          <div className="relative h-14 w-14 overflow-hidden rounded-full bg-muted">
            {stamp.cafe.photos?.[0]?.url ? (
              <Image
                src={stamp.cafe.photos[0].url}
                alt={stamp.cafe.name}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <span className="flex h-full items-center justify-center text-lg">☕</span>
            )}
          </div>
          <span className="line-clamp-2 text-[10px] font-medium leading-tight">
            {stamp.cafe.name}
          </span>
        </Link>
      ))}
    </div>
  );
}
