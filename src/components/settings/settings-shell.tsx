'use client';

import { useTranslations } from 'next-intl';
import {
  Bell,
  ChevronLeft,
  Database,
  Info,
  Lock,
  MessageCircle,
  Palette,
  Shield,
  User,
  LifeBuoy,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Link, usePathname } from '@/i18n/navigation';
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

function SettingsSidebar({ activePath }: { activePath: string }) {
  const t = useTranslations('settings');
  const isHub = activePath === '/settings' || activePath.endsWith('/settings');

  return (
    <aside className="hidden w-64 shrink-0 border-e border-border/60 bg-card/30 md:flex md:flex-col">
      <div className="sticky top-0 flex h-dvh flex-col gap-1 overflow-y-auto p-3">
        <Link
          href="/settings"
          className={cn(
            'mb-2 rounded-xl px-3 py-2.5 text-lg font-bold transition-colors hover:bg-muted',
            isHub && 'bg-muted',
          )}
        >
          {t('title')}
        </Link>
        <nav className="flex flex-1 flex-col gap-0.5" aria-label={t('title')}>
          {SETTINGS_SECTIONS.map((section) => {
            const Icon = ICONS[section.icon as keyof typeof ICONS] ?? Info;
            const active = activePath === section.href || activePath.endsWith(section.href);
            return (
              <Link
                key={section.id}
                href={section.href}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-muted',
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{t(section.labelKey)}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function SettingsSubpageHeader({ title }: { title: string }) {
  const t = useTranslations('settings');
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-2 backdrop-blur-md md:hidden">
      <Link
        href="/settings"
        className="flex size-11 items-center justify-center rounded-xl hover:bg-muted"
        aria-label={t('back')}
      >
        <ChevronLeft className="size-5 rtl:rotate-180" />
      </Link>
      <h1 className="flex-1 truncate text-base font-semibold">{title}</h1>
    </header>
  );
}

export function SettingsPageWrap({
  title,
  children,
  description,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-dvh md:min-h-0">
      <SettingsSubpageHeader title={title} />
      <div className="mx-auto max-w-2xl space-y-6 p-4 pb-24 md:pb-8">
        <div className="hidden md:block">
          <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
          {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const normalized = pathname.replace(/^\/(fa|en)/, '') || pathname;

  return (
    <div className="flex min-h-dvh bg-background">
      <SettingsSidebar activePath={normalized} />
      <div className="min-w-0 flex-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={normalized}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="h-full"
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
