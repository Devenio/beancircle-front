'use client';

import { useTranslations } from 'next-intl';
import { Quote } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal, RevealGroup } from '../primitives/reveal';

type Item = { quote: string; name: string; role: string };

export function Testimonials() {
  const t = useTranslations('marketing.testimonials');
  const items = t.raw('items') as Item[];

  return (
    <Section id="testimonials" className="py-24 sm:py-32">
      <Container size="wide">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} />
        <RevealGroup className="mt-14 grid gap-5 sm:grid-cols-2">
          {items.map((item, i) => (
            <Reveal
              key={item.name}
              className={`flex flex-col gap-5 rounded-3xl bc-glass p-7 ${i % 3 === 0 ? 'sm:bc-glow' : ''}`}
            >
              <Quote className="size-7 text-[var(--bc-crema)]" />
              <p className="text-pretty text-lg leading-relaxed text-[var(--bc-cream-dim)]">
                “{item.quote}”
              </p>
              <div className="mt-auto flex items-center gap-3">
                <span className="grid size-10 place-items-center rounded-full bg-gradient-to-br from-[var(--bc-amber)] to-[var(--bc-crema)] text-sm font-bold text-[#1a0e06]">
                  {item.name[0]}
                </span>
                <div>
                  <p className="text-sm font-semibold text-[var(--bc-cream)]">{item.name}</p>
                  <p className="text-xs text-[var(--bc-faint)]">{item.role}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </RevealGroup>
      </Container>
    </Section>
  );
}
