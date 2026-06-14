'use client';

import { useTranslations } from 'next-intl';
import { Coffee } from 'lucide-react';
import { Section, Container } from '../primitives/section';
import { Reveal } from '../primitives/reveal';

export function SocialProof() {
  const t = useTranslations('marketing.proof');
  const tags = t.raw('tags') as string[];
  const loop = [...tags, ...tags];

  return (
    <Section id="proof" className="py-16">
      <Container className="text-center">
        <Reveal>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--bc-faint)]">
            {t('title')}
          </p>
          <p className="mx-auto mt-2 max-w-xl text-pretty text-[var(--bc-muted)]">{t('subtitle')}</p>
        </Reveal>
      </Container>

      <div className="relative mt-10 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
        <div className="bc-marquee flex w-max gap-3" style={{ ['--bc-marquee-dur' as string]: '38s' }}>
          {loop.map((tag, i) => (
            <span
              key={`${tag}-${i}`}
              className="inline-flex items-center gap-2 whitespace-nowrap rounded-full border border-[var(--bc-line)] bg-[var(--bc-glass)] px-5 py-2.5 text-sm font-medium text-[var(--bc-cream-dim)]"
            >
              <Coffee className="size-3.5 text-[var(--bc-crema)]" />
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Section>
  );
}
