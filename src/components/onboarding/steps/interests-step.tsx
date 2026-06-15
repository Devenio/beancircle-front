'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { saveInterests } from '@/lib/api/onboarding';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

const INTERESTS: { slug: string; emoji: string }[] = [
  { slug: 'COFFEE', emoji: '☕' },
  { slug: 'STARTUPS', emoji: '🚀' },
  { slug: 'PROGRAMMING', emoji: '💻' },
  { slug: 'DESIGN', emoji: '🎨' },
  { slug: 'AI', emoji: '🤖' },
  { slug: 'BOOKS', emoji: '📚' },
  { slug: 'GAMING', emoji: '🎮' },
  { slug: 'CRYPTO', emoji: '🪙' },
  { slug: 'TRADING', emoji: '📈' },
  { slug: 'FITNESS', emoji: '🏋️' },
  { slug: 'PHOTOGRAPHY', emoji: '📷' },
  { slug: 'TRAVEL', emoji: '✈️' },
];

export function InterestsStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const { interests, toggleInterest } = useOnboardingStore();
  const [saving, setSaving] = useState(false);

  async function persistAndContinue() {
    setSaving(true);
    await saveInterests(interests, locale).catch(() => {});
    setSaving(false);
    onComplete();
  }

  const count = interests.length;

  return (
    <StepFrame
      title={t('interestsTitle')}
      subtitle={t('interestsSubtitle')}
      nav={
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          skipLabel={t('skipForNow')}
          onContinue={persistAndContinue}
          continueLoading={saving}
        />
      }
    >
      <p className="mb-3 text-xs font-medium text-amber-300/80">
        {count >= 3 ? t('interestsSelected', { count }) : t('interestsRecommend')}
      </p>
      <LazyMotion features={domAnimation} strict>
        <div className="grid grid-cols-3 gap-2.5">
          {INTERESTS.map(({ slug, emoji }) => {
            const selected = interests.includes(slug);
            return (
              <m.button
                key={slug}
                type="button"
                onClick={() => toggleInterest(slug)}
                aria-pressed={selected}
                whileTap={reduce ? undefined : { scale: 0.92 }}
                className={`relative flex aspect-square flex-col items-center justify-center gap-1.5 rounded-2xl border p-2 text-center transition-colors ${
                  selected
                    ? 'border-amber-400/70 bg-amber-400/15 shadow-[0_0_24px_rgba(240,184,96,0.25)]'
                    : 'border-white/10 bg-white/5 hover:bg-white/10'
                }`}
              >
                <span className="text-2xl leading-none">{emoji}</span>
                <span className="text-[11px] font-medium leading-tight text-white/85">
                  {t(`interest_${slug}`)}
                </span>
                {selected && (
                  <m.span
                    initial={reduce ? false : { scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute end-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[#1a0f0a]"
                  >
                    <Check className="h-3 w-3" strokeWidth={3} />
                  </m.span>
                )}
              </m.button>
            );
          })}
        </div>
      </LazyMotion>
    </StepFrame>
  );
}
