'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { Link, usePathname } from '@/i18n/navigation';
import { useInstallState, useOnlineStatus } from '@/hooks/use-pwa';
import { isBannerDismissed, usePwaStore } from '@/stores/pwa-store';
import { trackPwaEvent } from '@/lib/pwa/analytics';
import { haptic } from '@/lib/mobile/haptics';
import { BeanLogo } from '@/components/auth/bean-logo';
import { Button } from '@/components/ui/button';

// Routes where a promo banner would be noise or redundant.
const HIDDEN_PREFIXES = ['/install', '/login', '/onboarding', '/auth'];

/**
 * Floating, dismissible install prompt shown app-wide. Appears only when the
 * app is installable and not already installed, the user hasn't dismissed it
 * recently (persisted), and we're online. Triggers the native prompt on
 * Chromium, otherwise links to the instruction page.
 */
export function InstallBanner() {
  const t = useTranslations('pwa');
  const reduce = useReducedMotion();
  const pathname = usePathname();
  const online = useOnlineStatus();
  const { canPrompt, isInstalled, isStandalone, info, mounted, promptInstall } = useInstallState();

  const bannerDismissedAt = usePwaStore((s) => s.bannerDismissedAt);
  const dismissBanner = usePwaStore((s) => s.dismissBanner);

  // Small delay so the banner doesn't fight first paint / hydration.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1200);
    return () => clearTimeout(id);
  }, []);

  const hiddenRoute = HIDDEN_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  const installable = canPrompt || info.installMethod === 'ios-share' || info.installMethod === 'desktop-menu';
  const visible =
    mounted &&
    ready &&
    online &&
    installable &&
    !isInstalled &&
    !isStandalone &&
    !hiddenRoute &&
    !isBannerDismissed(bannerDismissedAt);

  useEffect(() => {
    if (visible) trackPwaEvent('banner_shown');
  }, [visible]);

  function handleDismiss() {
    haptic('light');
    trackPwaEvent('banner_dismissed');
    dismissBanner();
  }

  async function handleInstall() {
    haptic('light');
    trackPwaEvent('install_button_click', { source: 'smart_banner' });
    const outcome = await promptInstall();
    // Whatever the choice, respect the cooldown so we don't nag.
    if (outcome !== 'unavailable') dismissBanner();
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center pb-[calc(5.5rem+env(safe-area-inset-bottom))]">
      <div className="w-full max-w-[430px] px-3">
        <AnimatePresence>
          {visible && (
            <motion.div
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
              transition={{ type: 'spring', stiffness: 380, damping: 32 }}
              role="dialog"
              aria-label={t('banner.title')}
              className="pointer-events-auto flex items-center gap-3 rounded-2xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur-md"
            >
              <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#2a1a12] to-[#140b07]">
                <BeanLogo className="size-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[14px] font-semibold leading-tight">{t('banner.title')}</p>
                <p className="mt-0.5 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {t('banner.subtitle')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {canPrompt ? (
                  <Button size="sm" onClick={handleInstall}>
                    {t('banner.install')}
                  </Button>
                ) : (
                  <Button size="sm" render={<Link href="/install" />}>
                    {t('banner.howto')}
                  </Button>
                )}
                <button
                  type="button"
                  aria-label={t('banner.dismiss')}
                  onClick={handleDismiss}
                  className="flex size-7 items-center justify-center rounded-full text-muted-foreground active:opacity-60"
                >
                  <X className="size-4" />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
