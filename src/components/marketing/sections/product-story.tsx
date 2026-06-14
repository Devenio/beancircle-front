'use client';

import { useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';
import { Compass, Users, Heart } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal } from '../primitives/reveal';
import { ensureGsap } from '../lib/gsap';

const ICONS = [Compass, Users, Heart];

export function ProductStory() {
  const t = useTranslations('marketing.story');
  const steps = t.raw('steps') as { title: string; body: string }[];
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (reduce || !trackRef.current || !lineRef.current) return;
    const { gsap, ScrollTrigger } = ensureGsap();
    const ctx = gsap.context(() => {
      gsap.fromTo(
        lineRef.current,
        { scaleY: 0 },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: trackRef.current,
            start: 'top 65%',
            end: 'bottom 70%',
            scrub: true,
          },
        },
      );
    }, trackRef);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <Section id="product" className="py-24 sm:py-32">
      <Container>
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />

        <div ref={trackRef} className="relative mx-auto mt-16 max-w-3xl">
          {/* timeline rail */}
          <div className="absolute bottom-0 start-[27px] top-2 w-px bg-[var(--bc-line)] sm:start-1/2">
            <div
              ref={lineRef}
              className="absolute inset-0 origin-top bg-gradient-to-b from-[var(--bc-amber)] to-[var(--bc-crema)]"
            />
          </div>

          <div className="flex flex-col gap-12 sm:gap-20">
            {steps.map((step, i) => {
              const Icon = ICONS[i] ?? Compass;
              const right = i % 2 === 1;
              return (
                <Reveal
                  key={step.title}
                  direction={right ? 'left' : 'right'}
                  className={`relative flex items-start gap-6 sm:w-[calc(50%+1px)] ${
                    right ? 'sm:ms-auto sm:flex-row' : 'sm:flex-row-reverse sm:text-end'
                  }`}
                >
                  <div className="relative z-10 grid size-14 shrink-0 place-items-center rounded-2xl bc-glass bc-glow">
                    <Icon className="size-6 text-[var(--bc-amber)]" />
                    <span className="absolute -top-2 -end-2 grid size-6 place-items-center rounded-full bg-[var(--bc-amber)] text-xs font-bold text-[#1a0e06]">
                      {i + 1}
                    </span>
                  </div>
                  <div className="pt-1">
                    <h3 className="text-xl font-bold text-[var(--bc-cream)]">{step.title}</h3>
                    <p className="mt-2 text-[var(--bc-muted)]">{step.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </div>
        </div>
      </Container>
    </Section>
  );
}
