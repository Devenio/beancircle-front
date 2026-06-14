'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Play } from 'lucide-react';
import { Section } from '../primitives/section';
import { CtaButton } from '../primitives/cta-button';
import { CountUp } from '../primitives/count-up';
import { HeroScene } from '../three/scenes';
import { scrollToId } from '../lib/scroll-to';

export function Hero() {
  const t = useTranslations('marketing.hero');
  const reduce = useReducedMotion();
  const scrollRef = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const h = window.innerHeight || 1;
      scrollRef.current = Math.min(1, Math.max(0, window.scrollY / h));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const lines = [t('titleLine1'), t('titleLine2'), t('titleLine3')];

  const stats = [
    { to: 1200, suffix: '+', label: t('stats.cafes') },
    { to: 48000, suffix: '+', label: t('stats.members') },
    { to: 320000, suffix: '+', label: t('stats.checkins') },
  ];

  return (
    <Section id="top" className="bc-grain relative flex min-h-[100svh] items-center justify-center pt-28">
      {/* 3D connection universe */}
      <div className="absolute inset-0 -z-10">
        <HeroScene scrollRef={scrollRef} />
      </div>
      {/* depth + readability overlays */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,var(--bc-espresso)_85%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-48 bg-gradient-to-t from-[var(--bc-espresso)] to-transparent"
      />

      <div className="relative mx-auto flex max-w-4xl flex-col items-center px-5 text-center">
        <motion.span
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-7 inline-flex items-center gap-2 rounded-full border border-[var(--bc-line)] bg-[var(--bc-glass)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bc-crema-soft)] backdrop-blur"
        >
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-[var(--bc-amber)] opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-[var(--bc-amber)]" />
          </span>
          {t('badge')}
        </motion.span>

        <h1 className="text-balance text-5xl font-black leading-[0.98] tracking-tight sm:text-6xl md:text-7xl lg:text-8xl">
          {lines.map((line, i) => (
            <span key={i} className="block overflow-hidden py-0.5">
              <motion.span
                className={i === 1 ? 'bc-gradient-text inline-block' : 'inline-block'}
                initial={reduce ? { opacity: 0 } : { y: '110%' }}
                animate={reduce ? { opacity: 1 } : { y: 0 }}
                transition={{ duration: 0.9, delay: 0.15 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.span>
            </span>
          ))}
        </h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="mt-7 max-w-xl text-pretty text-base leading-relaxed text-[var(--bc-muted)] sm:text-lg"
        >
          {t('subtitle')}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.75 }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <CtaButton href="/login">
            {t('ctaPrimary')}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
          </CtaButton>
          <CtaButton variant="glass" onClick={() => scrollToId('product')}>
            <Play className="size-3.5 fill-current" />
            {t('ctaSecondary')}
          </CtaButton>
        </motion.div>

        <motion.dl
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.95 }}
          className="mt-14 grid w-full max-w-lg grid-cols-3 gap-4"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center">
              <dd className="text-2xl font-bold text-[var(--bc-cream)] sm:text-3xl">
                <CountUp to={s.to} suffix={s.suffix} />
              </dd>
              <dt className="mt-1 text-[11px] uppercase tracking-wider text-[var(--bc-faint)]">{s.label}</dt>
            </div>
          ))}
        </motion.dl>
      </div>

      {!reduce ? (
        <motion.div
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.4 }}
          className="absolute bottom-7 left-1/2 -translate-x-1/2 text-[var(--bc-faint)]"
        >
          <span className="text-[10px] uppercase tracking-[0.3em]">{t('scroll')}</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity }}
            className="mx-auto mt-2 h-9 w-5 rounded-full border border-[var(--bc-line)]"
          >
            <span className="mx-auto mt-1.5 block size-1 rounded-full bg-[var(--bc-amber)]" />
          </motion.div>
        </motion.div>
      ) : null}
    </Section>
  );
}
