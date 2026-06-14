'use client';

import { useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';
import { BrandMark } from './brand-mark';
import { CtaButton } from './primitives/cta-button';
import { scrollToId } from './lib/scroll-to';

const SECTIONS = [
  { id: 'product', key: 'product' as const },
  { id: 'nearby', key: 'nearby' as const },
  { id: 'communities', key: 'communities' as const },
  { id: 'creators', key: 'creators' as const },
];

export function MarketingNav() {
  const t = useTranslations('marketing.nav');
  const locale = useLocale();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const otherLocale = locale === 'fa' ? 'en' : 'fa';

  function go(id: string) {
    setOpen(false);
    scrollToId(id);
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
      <nav
        className={cn(
          'flex w-full max-w-6xl items-center justify-between rounded-full px-3 py-2.5 transition-all duration-300',
          scrolled ? 'bc-glass shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]' : 'bg-transparent',
        )}
      >
        <Link href="/" aria-label="Bean Circle home" className="pl-2">
          <BrandMark />
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {SECTIONS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(s.id)}
              className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-cream)]"
            >
              {t(s.key)}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5">
          <Link
            href="/"
            locale={otherLocale}
            className="hidden rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wider text-[var(--bc-muted)] transition-colors hover:text-[var(--bc-cream)] sm:block"
          >
            {otherLocale}
          </Link>
          <Link
            href="/login"
            className="hidden rounded-full px-3.5 py-2 text-sm font-medium text-[var(--bc-cream)] transition-colors hover:text-[var(--bc-amber)] sm:block"
          >
            {t('signin')}
          </Link>
          <CtaButton href="/login" className="hidden px-5 py-2.5 text-sm sm:inline-flex" magnetic={false}>
            {t('getStarted')}
          </CtaButton>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? t('closeMenu') : t('openMenu')}
            className="grid size-10 place-items-center rounded-full text-[var(--bc-cream)] md:hidden"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {open ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="absolute inset-x-4 top-[4.5rem] z-50 rounded-3xl bc-glass p-3 md:hidden"
          >
            <div className="flex flex-col">
              {SECTIONS.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(s.id)}
                  className="rounded-2xl px-4 py-3 text-start text-base font-medium text-[var(--bc-cream)] hover:bg-[var(--bc-glass-strong)]"
                >
                  {t(s.key)}
                </button>
              ))}
              <div className="mt-2 flex items-center gap-2 px-1">
                <CtaButton href="/login" className="flex-1" variant="primary" magnetic={false}>
                  {t('getStarted')}
                </CtaButton>
                <Link
                  href="/"
                  locale={otherLocale}
                  className="grid size-12 place-items-center rounded-full bc-glass text-xs font-bold uppercase text-[var(--bc-cream)]"
                >
                  {otherLocale}
                </Link>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
