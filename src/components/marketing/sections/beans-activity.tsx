'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Heart, Repeat2, MessageCircle, Coffee, Flame, Award, Zap, CreditCard } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal, RevealGroup } from '../primitives/reveal';

type Bean = { user: string; handle: string; text: string; meta: string };

const ACTIVITY_ICONS = [Coffee, Award, Flame, CreditCard];

export function BeansActivity() {
  const t = useTranslations('marketing.beans');
  const beans = t.raw('sampleBeans') as Bean[];
  const tabs = t.raw('feedTabs') as string[];
  const activity = t.raw('activity') as string[];

  return (
    <Section id="beans" className="py-24 sm:py-32">
      <Container size="wide">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />

        <div className="mt-16 grid items-start gap-10 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Phone mock: Beans feed */}
          <Reveal direction="right" className="mx-auto w-full max-w-md">
            <div className="overflow-hidden rounded-[2.2rem] border border-[var(--bc-line)] bg-[var(--bc-bean)]/40 p-3 shadow-2xl backdrop-blur">
              <div className="rounded-[1.7rem] bg-[var(--bc-espresso-2)] p-4">
                {/* tabs */}
                <div className="flex gap-1.5 pb-3">
                  {tabs.map((tab, i) => (
                    <span
                      key={tab}
                      className={`rounded-full px-3 py-1 text-xs font-medium ${
                        i === 0
                          ? 'bg-[var(--bc-amber)] text-[#1a0e06]'
                          : 'text-[var(--bc-faint)]'
                      }`}
                    >
                      {tab}
                    </span>
                  ))}
                </div>

                <RevealGroup className="flex flex-col gap-3">
                  {beans.map((b) => (
                    <Reveal
                      key={b.handle}
                      className="rounded-2xl border border-[var(--bc-line)] bg-[var(--bc-glass)] p-3.5"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-[var(--bc-amber)] to-[var(--bc-crema)] text-sm font-bold text-[#1a0e06]">
                          {b.user[0]}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--bc-cream)]">{b.user}</p>
                          <p className="truncate text-xs text-[var(--bc-faint)]">{b.handle}</p>
                        </div>
                      </div>
                      <p className="mt-2.5 text-sm leading-relaxed text-[var(--bc-cream-dim)]">{b.text}</p>
                      <div className="mt-3 flex items-center gap-5 text-[var(--bc-faint)]">
                        <Heart className="size-4" />
                        <Repeat2 className="size-4" />
                        <MessageCircle className="size-4" />
                        <span className="ms-auto text-[10px]">{b.meta}</span>
                      </div>
                    </Reveal>
                  ))}
                </RevealGroup>
              </div>
            </div>
          </Reveal>

          {/* Activity ticker */}
          <Reveal direction="left" className="flex flex-col gap-3 lg:pt-8">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-[var(--bc-crema-soft)]">
              <Zap className="size-4" /> Live activity
            </p>
            {activity.map((a, i) => {
              const Icon = ACTIVITY_ICONS[i % ACTIVITY_ICONS.length];
              return (
                <motion.div
                  key={a}
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.18, type: 'spring', stiffness: 120, damping: 16 }}
                  className="flex items-center gap-3 rounded-2xl bc-glass px-4 py-3"
                >
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[var(--bc-crema)]/15 text-[var(--bc-amber)]">
                    <Icon className="size-4" />
                  </span>
                  <span className="text-sm text-[var(--bc-cream-dim)]">{a}</span>
                </motion.div>
              );
            })}
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
