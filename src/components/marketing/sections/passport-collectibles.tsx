'use client';

import { useRef } from 'react';
import { useTranslations } from 'next-intl';
import { motion, useMotionValue, useSpring, useReducedMotion } from 'framer-motion';
import { Check, Coffee, Stamp } from 'lucide-react';
import { Section, Container, SectionHeading } from '../primitives/section';
import { Reveal } from '../primitives/reveal';

const RARITY_STYLE = [
  'from-[#6b6b6b] to-[#3a3a3a]',
  'from-[#3f8f6b] to-[#235740]',
  'from-[#3a6fd8] to-[#23407f]',
  'from-[#9a4fd8] to-[#5a2a7f]',
  'from-[var(--bc-amber)] to-[#b8651f]',
];

function CollectibleCard({
  rarity,
  index,
  cafe,
}: {
  rarity: string;
  index: number;
  cafe: string;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 200, damping: 18 });
  const sry = useSpring(ry, { stiffness: 200, damping: 18 });
  const legendary = index === 4;

  function move(e: React.PointerEvent) {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    ry.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 22);
    rx.set((-(e.clientY - (r.top + r.height / 2)) / r.height) * 22);
  }
  function reset() {
    rx.set(0);
    ry.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onPointerMove={move}
      onPointerLeave={reset}
      style={{ rotateX: srx, rotateY: sry, transformStyle: 'preserve-3d' }}
      className="relative aspect-[3/4.3] w-[150px] shrink-0 sm:w-[170px]"
    >
      <div
        className={`relative flex h-full flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br ${RARITY_STYLE[index]} p-4 shadow-xl ${
          legendary ? 'bc-glow' : ''
        }`}
      >
        {legendary && !reduce ? (
          <span
            aria-hidden
            className="absolute -inset-x-10 -top-10 h-24 rotate-12 bg-white/25 blur-xl bc-float"
          />
        ) : null}
        <div className="flex items-center justify-between">
          <Coffee className="size-5 text-white/90" style={{ transform: 'translateZ(30px)' }} />
          <span className="rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/90">
            {rarity}
          </span>
        </div>
        <div style={{ transform: 'translateZ(24px)' }}>
          <div className="mb-2 size-12 rounded-xl bg-white/15 backdrop-blur" />
          <p className="text-sm font-bold text-white">{cafe}</p>
          <p className="text-[10px] text-white/70">Bean Circle · No. {String(index * 37 + 4).padStart(3, '0')}</p>
        </div>
      </div>
    </motion.div>
  );
}

export function PassportCollectibles() {
  const t = useTranslations('marketing.passport');
  const rarities = t.raw('rarities') as string[];
  const points = t.raw('points') as string[];
  const cafes = ['Rumi', 'Crema', 'Lumen', 'Velvet', 'Aurora'];

  return (
    <Section id="passport" className="py-24 sm:py-32">
      <Container size="wide">
        <SectionHeading eyebrow={t('eyebrow')} title={t('title')} body={t('body')} />

        <Reveal className="mt-14 flex justify-center gap-4 overflow-x-auto pb-6 [perspective:1200px] no-scrollbar sm:gap-5">
          {rarities.map((r, i) => (
            <CollectibleCard key={r} rarity={r} index={i} cafe={cafes[i]} />
          ))}
        </Reveal>

        <Reveal className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-8 gap-y-3">
          {points.map((p) => (
            <span key={p} className="flex items-center gap-2 text-sm text-[var(--bc-cream-dim)]">
              <span className="grid size-6 place-items-center rounded-full bg-[var(--bc-crema)]/15 text-[var(--bc-amber)]">
                {p === points[2] ? <Stamp className="size-3.5" /> : <Check className="size-3.5" />}
              </span>
              {p}
            </span>
          ))}
        </Reveal>
      </Container>
    </Section>
  );
}
