'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Radar, Sparkles } from 'lucide-react';
import { Section, Container, Eyebrow } from '../primitives/section';
import { Reveal } from '../primitives/reveal';
import { CtaButton } from '../primitives/cta-button';
import { RadarScene } from '../three/scenes';

const PINS = [
  { top: '18%', left: '22%', name: 'Mina', d: '120m', delay: 0.3 },
  { top: '32%', left: '74%', name: 'Arman', d: '340m', delay: 0.7 },
  { top: '68%', left: '30%', name: 'Sara', d: '510m', delay: 1.1 },
  { top: '74%', left: '66%', name: 'Reza', d: '720m', delay: 1.5 },
];

export function NearbyDiscovery() {
  const t = useTranslations('marketing.nearby');
  const points = t.raw('points') as string[];

  return (
    <Section id="nearby" className="py-24 sm:py-32">
      <Container size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* Copy */}
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
              <CtaButton href="/login">
                <Radar className="size-4" />
                {t('cta')}
              </CtaButton>
            </div>
          </Reveal>

          {/* Radar visual */}
          <Reveal direction="left" className="relative mx-auto aspect-square w-full max-w-[520px]">
            <div className="absolute inset-0 rounded-[2rem] bc-glass bc-grain" />
            <RadarScene />

            {PINS.map((pin) => (
              <motion.div
                key={pin.name}
                initial={{ opacity: 0, scale: 0.6 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: pin.delay, type: 'spring', stiffness: 180, damping: 14 }}
                style={{ top: pin.top, left: pin.left }}
                className="absolute -translate-x-1/2 -translate-y-1/2"
              >
                <div className="flex items-center gap-2 rounded-full bc-glass px-2.5 py-1.5 shadow-lg">
                  <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-[var(--bc-amber)] to-[var(--bc-crema)] text-[10px] font-bold text-[#1a0e06]">
                    {pin.name[0]}
                  </span>
                  <span className="text-xs font-medium text-[var(--bc-cream)]">{pin.name}</span>
                  <span className="text-[10px] text-[var(--bc-faint)]">{pin.d}</span>
                </div>
              </motion.div>
            ))}

            {/* match card */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1.8 }}
              className="absolute bottom-4 left-1/2 w-[78%] -translate-x-1/2 rounded-2xl bc-glass p-3"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[var(--bc-cream-dim)]">
                  <Sparkles className="size-3.5 text-[var(--bc-amber)]" />
                  {t('matchLabel')}
                </span>
                <span className="text-xs font-bold text-[var(--bc-mint)]">{t('matchHigh')}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--bc-line)]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: '88%' }}
                  viewport={{ once: true }}
                  transition={{ delay: 2, duration: 1.1 }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--bc-amber)] to-[var(--bc-mint)]"
                />
              </div>
            </motion.div>
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
