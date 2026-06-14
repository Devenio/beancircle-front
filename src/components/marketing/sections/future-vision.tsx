'use client';

import { useTranslations } from 'next-intl';
import { CalendarHeart, Sparkles, Globe2 } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal, RevealGroup } from '../primitives/reveal';

const ICONS = [CalendarHeart, Sparkles, Globe2];

export function FutureVision() {
  const t = useTranslations('marketing.future');
  const items = t.raw('items') as { title: string; body: string }[];

  return (
    <Section id="future" className="py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {items.map((item, i) => {
            const Icon = ICONS[i] ?? Sparkles;
            return (
              <Reveal
                key={item.title}
                className="relative overflow-hidden rounded-3xl border border-[var(--bc-line)] bg-gradient-to-b from-[var(--bc-glass-strong)] to-transparent p-7"
              >
                <span aria-hidden className="absolute -right-6 -top-6 text-7xl font-black text-[var(--bc-cream)]/5">
                  0{i + 1}
                </span>
                <span className="grid size-12 place-items-center rounded-2xl bc-glass text-[var(--bc-amber)]">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-[var(--bc-cream)]">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--bc-muted)]">{item.body}</p>
              </Reveal>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
