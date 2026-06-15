'use client';

import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

const CafeScene = dynamic(() => import('./cafe-scene').then((m) => m.CafeScene), {
  ssr: false,
  loading: () => <CafeLoading />,
});

function CafeLoading() {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />
    </div>
  );
}

export function CafeStep({ onComplete, onSkip, onBack }: StepProps) {
  const t = useTranslations('onboarding');
  return (
    <StepFrame
      title={t('cafeTitle')}
      subtitle={t('cafeSubtitle')}
      nav={
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          onContinue={onComplete}
          continueLabel={t('cafeExplore')}
        />
      }
    >
      <div className="h-64 w-full overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#160d08] to-[#0c0805]">
        <CafeScene />
      </div>
    </StepFrame>
  );
}
