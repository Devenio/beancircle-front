'use client';

import { useTranslations } from 'next-intl';
import { motion } from 'framer-motion';
import { Check, Trophy, Gamepad2, Coffee, Laptop, BookOpen, Flame } from 'lucide-react';
import { Section, Container, Eyebrow } from '../primitives/section';
import { Reveal } from '../primitives/reveal';

const SQUAD_META = [
  { Icon: Gamepad2, members: 1284, pts: 9820, tint: 'from-[#7c5cff] to-[#b18cff]' },
  { Icon: Coffee, members: 842, pts: 7410, tint: 'from-[var(--bc-amber)] to-[var(--bc-crema)]' },
  { Icon: Laptop, members: 2150, pts: 15300, tint: 'from-[#37c6a8] to-[#7fcf9f]' },
  { Icon: BookOpen, members: 619, pts: 5230, tint: 'from-[#d98a6a] to-[#f0b860]' },
  { Icon: Flame, members: 977, pts: 8120, tint: 'from-[#ff7a59] to-[#ffb259]' },
];

export function CommunitiesSquads() {
  const t = useTranslations('marketing.communities');
  const names = t.raw('squadNames') as string[];
  const points = t.raw('points') as string[];
  const membersLabel = t('members');

  return (
    <Section id="communities" className="py-24 sm:py-32">
      <Container size="wide">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          {/* squad cluster */}
          <Reveal direction="right" className="order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              {names.map((name, i) => {
                const meta = SQUAD_META[i % SQUAD_META.length];
                const Icon = meta.Icon;
                const featured = i === 2;
                return (
                  <motion.div
                    key={name}
                    initial={{ opacity: 0, scale: 0.85, y: 20 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1, type: 'spring', stiffness: 140, damping: 16 }}
                    className={`rounded-3xl bc-glass p-5 ${featured ? 'col-span-2 bc-glow' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`grid size-11 place-items-center rounded-2xl bg-gradient-to-br ${meta.tint} text-[#1a0e06]`}>
                        <Icon className="size-5" />
                      </span>
                      <div>
                        <p className="font-bold text-[var(--bc-cream)]">{name}</p>
                        <p className="text-xs text-[var(--bc-faint)]">
                          {meta.members.toLocaleString()} {membersLabel}
                        </p>
                      </div>
                      <span className="ms-auto inline-flex items-center gap-1 rounded-full bg-[var(--bc-crema)]/15 px-2.5 py-1 text-xs font-semibold text-[var(--bc-amber)]">
                        <Trophy className="size-3" />
                        {meta.pts.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-4 flex -space-x-2">
                      {Array.from({ length: featured ? 7 : 4 }).map((_, k) => (
                        <span
                          key={k}
                          className="size-7 rounded-full border-2 border-[var(--bc-espresso)] bg-gradient-to-br from-[var(--bc-mocha)] to-[var(--bc-bean)]"
                        />
                      ))}
                      <span className="grid size-7 place-items-center rounded-full border-2 border-[var(--bc-espresso)] bg-[var(--bc-glass-strong)] text-[10px] font-bold text-[var(--bc-cream-dim)]">
                        +{featured ? 99 : 12}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </Reveal>

          {/* copy */}
          <Reveal direction="left" className="order-1 flex flex-col gap-6 lg:order-2">
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
          </Reveal>
        </div>
      </Container>
    </Section>
  );
}
