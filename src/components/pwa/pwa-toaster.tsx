'use client';

import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { RefreshCw, WifiOff, Wifi, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOnlineStatus, usePwaUpdate } from '@/hooks/use-pwa';
import { haptic } from '@/lib/mobile/haptics';
import { cn } from '@/lib/utils';

/**
 * Global, fixed top-anchored toasts for the two PWA system events:
 *   • a new app version is ready (Update now / Later)
 *   • connectivity changed (offline / back online)
 * Rendered once via PwaProvider. Anchored at the top to stay clear of the
 * bottom navigation and the bug-report FAB.
 */
export function PwaToaster() {
  const reduce = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] flex justify-center pt-2.5">
      <div className="w-full max-w-[430px] space-y-2 px-3">
        <AnimatePresence initial={false}>
          <OfflineToast key="net" reduce={!!reduce} />
          <UpdateToast key="update" reduce={!!reduce} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function ToastCard({
  children,
  reduce,
  tone = 'default',
}: {
  children: React.ReactNode;
  reduce: boolean;
  tone?: 'default' | 'warning' | 'success';
}) {
  return (
    <motion.div
      layout
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
      exit={reduce ? { opacity: 0 } : { opacity: 0, y: -16, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      role="status"
      aria-live="polite"
      className={cn(
        'pointer-events-auto flex items-center gap-3 rounded-2xl border px-3.5 py-3 shadow-lg backdrop-blur-md',
        tone === 'warning'
          ? 'border-amber-500/20 bg-amber-500/10 text-foreground'
          : tone === 'success'
            ? 'border-emerald-500/20 bg-emerald-500/10 text-foreground'
            : 'border-border/70 bg-card/95 text-foreground',
      )}
    >
      {children}
    </motion.div>
  );
}

function UpdateToast({ reduce }: { reduce: boolean }) {
  const t = useTranslations('pwa');
  const { updateReady, applyUpdate, dismiss } = usePwaUpdate();
  if (!updateReady) return null;

  return (
    <ToastCard reduce={reduce}>
      <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <RefreshCw className="size-[18px]" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold leading-tight">{t('update.title')}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">{t('update.subtitle')}</p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <Button size="sm" variant="ghost" onClick={dismiss}>
          {t('update.later')}
        </Button>
        <Button
          size="sm"
          onClick={() => {
            haptic('medium');
            applyUpdate();
          }}
        >
          {t('update.now')}
        </Button>
      </div>
    </ToastCard>
  );
}

function OfflineToast({ reduce }: { reduce: boolean }) {
  const t = useTranslations('pwa');
  const online = useOnlineStatus();
  const wasOnline = useRef(online);
  const [backOnline, setBackOnline] = useState(false);

  // Flash a brief "back online" confirmation when connectivity returns.
  useEffect(() => {
    if (online && !wasOnline.current) {
      setBackOnline(true);
      const id = setTimeout(() => setBackOnline(false), 3000);
      wasOnline.current = online;
      return () => clearTimeout(id);
    }
    wasOnline.current = online;
  }, [online]);

  if (!online) {
    return (
      <ToastCard reduce={reduce} tone="warning">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-amber-600 dark:text-amber-400">
          <WifiOff className="size-[18px]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-semibold leading-tight">{t('offline.title')}</p>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{t('offline.subtitle')}</p>
        </div>
        <Button size="sm" variant="outline" className="shrink-0" onClick={() => window.location.reload()}>
          {t('offline.retry')}
        </Button>
      </ToastCard>
    );
  }

  if (backOnline) {
    return (
      <ToastCard reduce={reduce} tone="success">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
          <Wifi className="size-[18px]" />
        </span>
        <p className="flex-1 text-[13px] font-semibold leading-tight">{t('online.back')}</p>
        <button
          type="button"
          aria-label={t('offline.dismiss')}
          onClick={() => setBackOnline(false)}
          className="shrink-0 rounded-full p-1 text-muted-foreground active:opacity-60"
        >
          <X className="size-4" />
        </button>
      </ToastCard>
    );
  }

  return null;
}
