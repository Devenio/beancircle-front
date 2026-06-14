'use client';

import { useTranslations } from 'next-intl';
import { ShieldCheck, Flag, Lock } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal, RevealGroup } from '../primitives/reveal';

const ICONS = [Lock, Flag, ShieldCheck];

export function SafetyTrust() {
  const t = useTranslations('marketing.safety');
  const points = t.raw('points') as { title: string; body: string }[];

  return (
    <Section id="safety" className="py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />
        <RevealGroup className="mt-14 grid gap-5 md:grid-cols-3">
          {points.map((p, i) => {
            const Icon = ICONS[i] ?? ShieldCheck;
            return (
              <Reveal key={p.title} className="rounded-3xl bc-glass p-7">
                <span className="grid size-12 place-items-center rounded-2xl bg-[var(--bc-crema)]/15 text-[var(--bc-amber)]">
                  <Icon className="size-6" />
                </span>
                <h3 className="mt-5 text-lg font-bold text-[var(--bc-cream)]">{p.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--bc-muted)]">{p.body}</p>
              </Reveal>
            );
          })}
        </RevealGroup>
      </Container>
    </Section>
  );
}
