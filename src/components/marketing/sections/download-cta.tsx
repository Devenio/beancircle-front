'use client';

import { useTranslations } from 'next-intl';
import { ArrowRight, Apple, Smartphone } from 'lucide-react';
import { Section, Container } from '../primitives/section';
import { Reveal } from '../primitives/reveal';
import { CtaButton } from '../primitives/cta-button';
import { Eyebrow } from '../primitives/section';

export function DownloadCta() {
  const t = useTranslations('marketing.cta');

  return (
    <Section id="download" className="py-20 sm:py-28">
      <Container>
        <Reveal className="bc-grain relative overflow-hidden rounded-[2.5rem] border border-[var(--bc-line)] px-6 py-16 text-center sm:px-12 sm:py-20">
          {/* glow backdrop */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,var(--bc-bean),var(--bc-espresso))]"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 size-[120%] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,var(--bc-crema)_0%,transparent_55%)] opacity-25 blur-2xl"
          />

          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <Eyebrow>{t('eyebrow')}</Eyebrow>
            <h2 className="text-balance text-4xl font-black leading-[1.02] tracking-tight sm:text-6xl">
              <span className="bc-gradient-text">{t('title')}</span>
            </h2>
            <p className="max-w-md text-pretty text-lg text-[var(--bc-muted)]">{t('body')}</p>

            <div className="mt-2 flex flex-col items-center gap-3 sm:flex-row">
              <CtaButton href="/login">
                {t('primary')}
                <ArrowRight className="size-4 rtl:rotate-180" />
              </CtaButton>
              <CtaButton href="/login" variant="glass">
                {t('secondary')}
              </CtaButton>
            </div>

            <div className="mt-4 flex items-center gap-4 text-[var(--bc-faint)]">
              <Apple className="size-5" />
              <Smartphone className="size-5" />
              <span className="text-xs">{t('note')}</span>
            </div>
          </div>
        </Reveal>
      </Container>
    </Section>
  );
}
