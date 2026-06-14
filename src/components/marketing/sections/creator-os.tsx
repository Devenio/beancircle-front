'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, QrCode, TrendingUp, Store, BadgeCheck } from 'lucide-react';
import { Section, Container, Eyebrow } from '../primitives/section';
import { Reveal } from '../primitives/reveal';
import { CtaButton } from '../primitives/cta-button';

const BARS = [42, 58, 47, 71, 63, 88, 79];

export function CreatorOs() {
  const t = useTranslations('marketing.creators');
  const points = t.raw('points') as string[];

  return (
    <Section id="creators" className="py-24 sm:py-32">
      <Container size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* copy */}
          <Reveal direction="right" className="flex flex-col gap-6">
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">
              {t('title')}
            </h2>
            <p className="max-w-md text-pretty text-lg text-[var(--bc-muted)]">{t('body')}</p>
            <ul className="flex flex-col gap-3">
              {points.map((p) => (
                <li key={p} className="flex items-center gap-3 text-[var(--bc-cream-dim)]">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-[var(--bc-crema)]/15 text-[var(--bc-amber)]">
                    <Check className="size-3.5" />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
            <div className="pt-2">
              <CtaButton href="/login" variant="glass">
                <Store className="size-4" />
                {t('cta')}
              </CtaButton>
            </div>
          </Reveal>

          {/* dashboard mock */}
          <Reveal direction="left">
            <div className="rounded-[2rem] border border-[var(--bc-line)] bg-[var(--bc-espresso-2)]/80 p-5 shadow-2xl backdrop-blur">
              {/* identity bar */}
              <div className="flex items-center gap-2.5 rounded-2xl bc-glass px-3 py-2.5">
                <span className="grid size-9 place-items-center rounded-xl bg-gradient-to-br from-[var(--bc-amber)] to-[var(--bc-crema)] text-sm font-bold text-[#1a0e06]">
                  R
                </span>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-sm font-semibold text-[var(--bc-cream)]">
                    Rumi Café <BadgeCheck className="size-3.5 text-[var(--bc-amber)]" />
                  </p>
                  <p className="text-[11px] text-[var(--bc-faint)]">Posting as café</p>
                </div>
                <span className="ms-auto rounded-full bg-[var(--bc-mint)]/15 px-2.5 py-1 text-[10px] font-bold text-[var(--bc-mint)]">
                  Live
                </span>
              </div>

              {/* stat tiles */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { label: 'Check-ins', value: '1,204' },
                  { label: 'Followers', value: '3,418' },
                  { label: 'Reviews', value: '4.8★' },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl bc-glass p-3">
                    <p className="text-lg font-bold text-[var(--bc-cream)]">{s.value}</p>
                    <p className="text-[10px] text-[var(--bc-faint)]">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* chart + qr */}
              <div className="mt-3 grid grid-cols-[1.5fr_1fr] gap-3">
                <div className="rounded-2xl bc-glass p-4">
                  <p className="flex items-center gap-1.5 text-xs font-medium text-[var(--bc-cream-dim)]">
                    <TrendingUp className="size-3.5 text-[var(--bc-amber)]" /> 30-day visits
                  </p>
                  <div className="mt-3 flex h-20 items-end gap-1.5">
                    {BARS.map((h, i) => (
                      <motion.span
                        key={i}
                        initial={{ height: 0 }}
                        whileInView={{ height: `${h}%` }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.06, type: 'spring', stiffness: 120, damping: 16 }}
                        className="flex-1 rounded-t bg-gradient-to-t from-[var(--bc-crema)] to-[var(--bc-amber)]"
                      />
                    ))}
                  </div>
                </div>
                <div className="grid place-items-center rounded-2xl bc-glass p-4">
                  <QrCode className="size-14 text-[var(--bc-cream)]" />
                  <p className="mt-2 text-center text-[10px] text-[var(--bc-faint)]">QR menu</p>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
