'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ChevronLeft, Check, ArrowDown, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useRouter } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { BeanLogo } from '@/components/auth/bean-logo';
import { InstallButton } from '@/components/pwa/install-button';
import { InstallBenefits } from '@/components/pwa/install-benefits';
import { PlatformInstructions } from '@/components/pwa/platform-instructions';
import { useInstallState } from '@/hooks/use-pwa';
import { trackPwaEvent } from '@/lib/pwa/analytics';

const SCREENSHOTS = [
  { src: '/screenshots/mobile-1.jpg', key: 'shot1' },
  { src: '/screenshots/mobile-2.jpg', key: 'shot2' },
];

export default function InstallPage() {
  const t = useTranslations('install');
  const router = useRouter();
  const { isInstalled, mounted } = useInstallState();

  useEffect(() => {
    trackPwaEvent('install_page_view');
  }, []);

  function goBack() {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/');
  }

  return (
    <div className="flex min-h-dvh flex-col bg-background pb-[calc(2rem+env(safe-area-inset-bottom))]">
      {/* App bar */}
      <header className="sticky top-0 z-20 grid h-12 shrink-0 grid-cols-[3rem_1fr_3rem] items-center border-b border-border/80 bg-background/95 backdrop-blur-md">
        <button
          type="button"
          onClick={goBack}
          className="flex size-12 items-center justify-center text-foreground active:opacity-60"
          aria-label={t('back')}
        >
          <ChevronLeft className="size-6 rtl:rotate-180" strokeWidth={1.75} />
        </button>
        <h1 className="truncate text-center text-[16px] font-semibold tracking-tight">{t('meta.title')}</h1>
        <span aria-hidden className="size-12" />
      </header>

      {/* Hero */}
      <section className="px-4 pt-6">
        <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-gradient-to-b from-[#2a1a12] to-[#140b07] p-6 text-center text-white">
          <motion.span
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="mx-auto flex size-20 items-center justify-center rounded-[1.4rem] bg-white/5 shadow-lg ring-1 ring-white/10"
          >
            <BeanLogo className="size-12" />
          </motion.span>
          <div className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-amber-200/90">
            {t('hero.badge')}
          </div>
          <h2 className="mt-3 text-xl font-bold tracking-tight">{t('hero.title')}</h2>
          <p className="mx-auto mt-2 max-w-[18rem] text-sm leading-relaxed text-white/70">{t('hero.subtitle')}</p>
        </div>

        {/* Screenshots strip */}
        <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {SCREENSHOTS.map((shot) => (
            <div
              key={shot.key}
              className="relative aspect-[9/16] w-[44%] shrink-0 snap-center overflow-hidden rounded-2xl border border-border/70 bg-muted"
            >
              <Image src={shot.src} alt={t(`hero.${shot.key}` as 'hero.shot1')} fill sizes="200px" className="object-cover" />
            </div>
          ))}
        </div>

        {/* Primary CTA */}
        <div className="mt-5">
          <PrimaryCta isInstalled={isInstalled} mounted={mounted} />
        </div>
      </section>

      {/* Benefits */}
      <section className="px-4 pt-8">
        <h2 className="px-1 text-[15px] font-semibold">{t('benefits.title')}</h2>
        <div className="mt-3">
          <InstallBenefits />
        </div>
      </section>

      {/* Platform instructions */}
      <section className="px-4 pt-8">
        <PlatformInstructions />
      </section>
    </div>
  );
}

function PrimaryCta({ isInstalled, mounted }: { isInstalled: boolean; mounted: boolean }) {
  const t = useTranslations('install');
  const { canPrompt } = useInstallState();

  if (!mounted) {
    return <div className="h-11 w-full animate-pulse rounded-lg bg-muted" aria-hidden />;
  }

  if (isInstalled) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700 dark:text-emerald-400">
          <Check className="size-4" />
          {t('hero.installedTitle')}
        </div>
        <Button size="lg" variant="outline" className="w-full" render={<Link href="/" />}>
          {t('hero.openApp')}
          <ExternalLink />
        </Button>
      </div>
    );
  }

  if (canPrompt) {
    return <InstallButton source="install_hero" className="w-full" size="lg" label={t('hero.installCta')} />;
  }

  // iOS / desktop-menu / unsupported → guide them to the steps below.
  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => document.getElementById('instructions')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
    >
      {t('hero.seeSteps')}
      <ArrowDown />
    </Button>
  );
}
