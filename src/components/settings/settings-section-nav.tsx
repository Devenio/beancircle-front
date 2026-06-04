'use client';

import { useTranslations } from 'next-intl';
import {
  Bell,
  Database,
  Info,
  Lock,
  MessageCircle,
  Palette,
  Shield,
  User,
  LifeBuoy,
  ChevronRight,
} from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { SETTINGS_SECTIONS } from '@/components/settings/settings-registry';
import { cn } from '@/lib/utils';

const ICONS = {
  user: User,
  shield: Shield,
  bell: Bell,
  palette: Palette,
  message: MessageCircle,
  lock: Lock,
  database: Database,
  'life-buoy': LifeBuoy,
  info: Info,
} as const;

export function SettingsSectionNav({ className }: { className?: string }) {
  const t = useTranslations('settings');

  return (
    <nav className={cn('space-y-2', className)} aria-label={t('browseSections')}>
      {SETTINGS_SECTIONS.map((section) => {
        const Icon = ICONS[section.icon as keyof typeof ICONS] ?? Info;
        return (
          <Link
            key={section.id}
            href={section.href}
            className="flex min-h-14 items-center gap-3 rounded-2xl border border-border/60 bg-card/50 px-3 py-3 transition-colors hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Icon className="size-5" />
            </span>
            <span className="min-w-0 flex-1 text-start">
              <span className="block text-sm font-semibold">{t(section.labelKey)}</span>
              <span className="block text-xs text-muted-foreground">{t(section.descriptionKey)}</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground rtl:rotate-180" />
          </Link>
        );
      })}
    </nav>
  );
}
