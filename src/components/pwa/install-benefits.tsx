'use client';

import { useTranslations } from 'next-intl';
import { Zap, Maximize2, Bell, CloudOff, Gauge, Heart, type LucideIcon } from 'lucide-react';

const BENEFITS: { key: string; Icon: LucideIcon }[] = [
  { key: 'fast', Icon: Zap },
  { key: 'fullscreen', Icon: Maximize2 },
  { key: 'notifications', Icon: Bell },
  { key: 'offline', Icon: CloudOff },
  { key: 'performance', Icon: Gauge },
  { key: 'native', Icon: Heart },
];

/** Grid of "why install" benefit cards used on the install page. */
export function InstallBenefits() {
  const t = useTranslations('install');

  return (
    <ul className="grid grid-cols-2 gap-2.5">
      {BENEFITS.map(({ key, Icon }) => (
        <li
          key={key}
          className="rounded-2xl border border-border/70 bg-card p-3.5"
        >
          <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-[18px]" />
          </span>
          <p className="mt-2.5 text-[13.5px] font-semibold leading-tight">{t(`benefits.${key}.title`)}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{t(`benefits.${key}.desc`)}</p>
        </li>
      ))}
    </ul>
  );
}
