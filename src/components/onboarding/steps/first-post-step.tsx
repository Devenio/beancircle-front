'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m } from 'framer-motion';
import { BeanComposer } from '@/components/beans/bean-composer';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { Confetti } from '../confetti';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

export function FirstPostStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const { setPosted } = useOnboardingStore();
  const [celebrating, setCelebrating] = useState(false);

  // Rotating prompt hint (the composer has its own input placeholder).
  const prompts = useMemo(
    () => [t('postPlaceholder1'), t('postPlaceholder2'), t('postPlaceholder3')],
    [t],
  );
  const [pi, setPi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPi((n) => (n + 1) % prompts.length), 2800);
    return () => clearInterval(id);
  }, [prompts.length]);

  function handlePosted() {
    setPosted(true);
    setCelebrating(true);
    setTimeout(() => onComplete(), 1700);
  }

  return (
    <StepFrame
      title={t('postTitle')}
      subtitle={t('postSubtitle')}
      nav={<OnboardingNav onBack={onBack} onSkip={onSkip} skipLabel={t('skipForNow')} hideContinue />}
    >
      <LazyMotion features={domAnimation} strict>
        <div className="relative">
          {celebrating && (
            <>
              <Confetti />
              <m.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-x-0 top-0 z-10 text-center text-sm font-bold text-amber-300"
              >
                {t('postSuccess')}
              </m.div>
            </>
          )}

          <m.p
            key={pi}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-2 text-center text-xs text-white/45"
          >
            {prompts[pi]}
          </m.p>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-1">
            <BeanComposer locale={locale} onPosted={handlePosted} />
          </div>
        </div>
      </LazyMotion>
    </StepFrame>
  );
}
