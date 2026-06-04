'use client';

import { useTranslations } from 'next-intl';
import { ChevronLeft } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePathname, useRouter } from '@/i18n/navigation';
import { isSettingsHubPath, settingsPathDepth } from '@/components/settings/settings-registry';
import { cn } from '@/lib/utils';

const slideVariants = {
  enter: (depth: number) => ({
    x: depth > 0 ? '100%' : 0,
    opacity: depth > 0 ? 0.92 : 1,
  }),
  center: { x: 0, opacity: 1 },
  exit: (depth: number) => ({
    x: depth > 0 ? '-28%' : 0,
    opacity: depth > 0 ? 0.85 : 1,
  }),
};

export function useSettingsBack(fallback = '/settings') {
  const router = useRouter();
  return () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }
    router.push(fallback);
  };
}

export function SettingsHeader({
  title,
  onBack,
  className,
}: {
  title: string;
  onBack?: () => void;
  className?: string;
}) {
  const t = useTranslations('settings');
  const goBack = useSettingsBack();

  return (
    <header
      className={cn(
        'sticky top-0 z-20 grid h-12 shrink-0 grid-cols-[3rem_1fr_3rem] items-center border-b border-border/80 bg-background/95 backdrop-blur-md',
        className,
      )}
    >
      <button
        type="button"
        onClick={onBack ?? goBack}
        className="flex size-12 items-center justify-center text-foreground active:opacity-60"
        aria-label={t('back')}
      >
        <ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.75} />
      </button>
      <h1 className="truncate text-center text-[16px] font-semibold tracking-tight">{title}</h1>
      <span aria-hidden className="size-12" />
    </header>
  );
}

export function SettingsHubHeader({ children }: { children?: React.ReactNode }) {
  const t = useTranslations('settings');
  const goBack = useSettingsBack('/profile');

  return (
    <header className="sticky top-0 z-20 shrink-0 border-b border-border/80 bg-background/95 backdrop-blur-md">
      <div className="grid h-12 grid-cols-[3rem_1fr_3rem] items-center">
        <button
          type="button"
          onClick={goBack}
          className="flex size-12 items-center justify-center active:opacity-60"
          aria-label={t('back')}
        >
          <ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.75} />
        </button>
        <h1 className="text-center text-[16px] font-semibold">{t('title')}</h1>
        <span aria-hidden className="size-12" />
      </div>
      {children ? <div className="px-4 pb-3">{children}</div> : null}
    </header>
  );
}

export function SettingsScreen({
  title,
  children,
  hideHeader,
}: {
  title: string;
  children: React.ReactNode;
  hideHeader?: boolean;
}) {
  const pathname = usePathname();
  const isHub = isSettingsHubPath(pathname);

  return (
    <div className="flex min-h-dvh flex-col bg-background">
      {!hideHeader && !isHub ? <SettingsHeader title={title} /> : null}
      <div className="flex-1 pb-[env(safe-area-inset-bottom)]">{children}</div>
    </div>
  );
}

/** @deprecated Use SettingsScreen */
export function SettingsPageWrap({
  title,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return <SettingsScreen title={title}>{children}</SettingsScreen>;
}

export function SettingsShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const depth = settingsPathDepth(pathname);

  return (
    <div className="relative mx-auto min-h-dvh w-full max-w-[430px] overflow-x-hidden bg-background touch-pan-y">
      <AnimatePresence mode="popLayout" custom={depth}>
        <motion.div
          key={pathname}
          custom={depth}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: 'tween', duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="min-h-dvh"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
