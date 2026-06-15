'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams, useSearchParams } from 'next/navigation';
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'framer-motion';
import { LogIn } from 'lucide-react';
import { AuthBackground } from '@/components/auth/auth-background';
import { useRouter } from '@/i18n/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useOnboardingStore, ACTIVATION_STEPS, type StepKey } from '@/stores/onboarding-store';
import { completeOnboarding, getOnboarding, patchOnboarding } from '@/lib/api/onboarding';
import { mirrorStepEvent, trackOnboarding } from '@/lib/onboarding/analytics';
import { OnboardingProgressBar } from './onboarding-progress-bar';
import type { StepProps } from './types';

import { WelcomeStep } from './steps/welcome-step';
import { IdentityStep } from './steps/identity-step';
import { InterestsStep } from './steps/interests-step';
import { AvatarStep } from './steps/avatar-step';
import { CircleStep } from './steps/circle-step';
import { FirstPostStep } from './steps/first-post-step';
import { CafeStep } from './steps/cafe-step';
import { AchievementStep } from './steps/achievement-step';
import { ProfileStep } from './steps/profile-step';
import { InviteStep } from './steps/invite-step';

/** Full step sequence: welcome → identity gate → 9 activation steps. */
const SEQUENCE: { key: string; Component: (p: StepProps) => React.ReactNode }[] = [
  { key: 'welcome', Component: WelcomeStep },
  { key: 'identity', Component: IdentityStep },
  { key: 'interests', Component: InterestsStep },
  { key: 'avatar', Component: AvatarStep },
  { key: 'circle', Component: CircleStep },
  { key: 'firstPost', Component: FirstPostStep },
  { key: 'cafe', Component: CafeStep },
  { key: 'achievement', Component: AchievementStep },
  { key: 'profile', Component: ProfileStep },
  { key: 'invite', Component: InviteStep },
];

export function OnboardingShell() {
  const t = useTranslations('onboarding');
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();

  const user = useAuthStore((s) => s.user);
  const { identityDone, setIdentityDone, setLastStep } = useOnboardingStore();

  // Start at the right step synchronously so we never mount welcome and then
  // auto-advance (which fights AnimatePresence mode="wait" and wedges it).
  const [index, setIndex] = useState(() => {
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const i = SEQUENCE.findIndex((s) => s.key === stepParam);
      if (i >= 0) return i;
    }
    if (user?.username) return SEQUENCE.findIndex((s) => s.key === 'interests');
    return 0;
  });
  const [direction, setDirection] = useState(1);
  const stepStart = useRef<number>(0);
  const liveRef = useRef<HTMLDivElement>(null);

  const step = SEQUENCE[index];
  const isLastActivation = index === SEQUENCE.length - 1;

  // One-time: announce start, sync identity flag, and (optionally) resume from
  // the server's saved step. The resume jump fires after a network round-trip,
  // long after AnimatePresence has settled, so it animates as a single hop.
  useEffect(() => {
    trackOnboarding('onboarding_started');
    if (user?.username) setIdentityDone(true);
    if (searchParams.get('resume') === '1') {
      getOnboarding(locale)
        .then((s) => {
          if (!s.progress.completedAt && s.progress.currentStep) {
            const i = SEQUENCE.findIndex((st) => st.key === s.progress.currentStep);
            if (i >= 0) setIndex(i);
          }
        })
        .catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Per-step lifecycle: announce, track viewed, reset timer, persist currentStep.
  useEffect(() => {
    stepStart.current = Date.now();
    setLastStep(step.key as StepKey);
    trackOnboarding('onboarding_step_viewed', { step: step.key, index });
    mirrorStepEvent(step.key, 'viewed', locale);
    void patchOnboarding({ currentStep: step.key }, locale).catch(() => {});
    if (liveRef.current) liveRef.current.textContent = step.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const elapsed = useCallback(() => Math.max(0, Date.now() - stepStart.current), []);

  const finish = useCallback(() => {
    trackOnboarding('onboarding_completed');
    void completeOnboarding(locale).catch(() => {});
    router.replace('/feed');
  }, [locale, router]);

  const advance = useCallback(
    (kind: 'completed' | 'skipped') => {
      const ms = elapsed();
      trackOnboarding(`onboarding_step_${kind}`, { step: step.key, index, time_spent_ms: ms });
      mirrorStepEvent(step.key, kind, locale, ms);
      void patchOnboarding(
        {
          [kind === 'completed' ? 'completeStep' : 'skipStep']: step.key,
          stepTimings: { [step.key]: ms },
        },
        locale,
      ).catch(() => {});
      if (isLastActivation) {
        finish();
        return;
      }
      setDirection(1);
      setIndex((i) => Math.min(i + 1, SEQUENCE.length - 1));
    },
    [elapsed, step.key, index, locale, isLastActivation, finish],
  );

  const onBack = useCallback(() => {
    setDirection(-1);
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const onEnter = useCallback(() => {
    trackOnboarding('onboarding_abandoned', { step: step.key, index });
    void completeOnboarding(locale).catch(() => {});
    router.replace('/feed');
  }, [step.key, index, locale, router]);

  const stepProps: StepProps = useMemo(
    () => ({
      onComplete: () => advance('completed'),
      onSkip: () => advance('skipped'),
      onBack,
      onEnter,
      onIdentityDone: () => {
        setIdentityDone(true);
        setDirection(1);
        setIndex((i) => Math.min(i + 1, SEQUENCE.length - 1));
      },
      locale,
      identityDone,
      isFirst: index <= 1,
      isLast: isLastActivation,
    }),
    [advance, onBack, onEnter, setIdentityDone, locale, identityDone, index, isLastActivation],
  );

  const variants = reduce
    ? { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
      };

  // Progress reflects activation steps (exclude welcome+identity from the count).
  const progressTotal = ACTIVATION_STEPS.length;
  const progressCurrent = Math.max(0, index - 1);

  return (
    <div className="relative flex min-h-dvh min-h-[100dvh] flex-col overflow-hidden text-white">
      <AuthBackground />

      <LazyMotion features={domAnimation} strict>
        {/* Top bar: progress + persistent escape hatch */}
        <div className="relative z-20 flex items-center gap-3 px-5 pt-[max(0.85rem,env(safe-area-inset-top))]">
          {index > 0 && (
            <div className="flex-1">
              <OnboardingProgressBar total={progressTotal} current={progressCurrent} />
            </div>
          )}
          <div className="ms-auto">
            {identityDone && !isLastActivation && (
              <button
                type="button"
                onClick={onEnter}
                className="flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 text-xs font-semibold text-white/80 backdrop-blur transition hover:bg-white/10 active:scale-95"
              >
                <LogIn className="h-3.5 w-3.5 rtl:rotate-180" />
                {t('enterApp')}
              </button>
            )}
          </div>
        </div>

        <div
          ref={liveRef}
          aria-live="polite"
          className="sr-only"
        />

        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
          <AnimatePresence mode="wait" custom={direction} initial={false}>
            <m.div
              key={step.key}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={reduce ? { duration: 0 } : { duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-0 flex-1 flex-col justify-center py-4"
            >
              <step.Component {...stepProps} />
            </m.div>
          </AnimatePresence>
        </div>
      </LazyMotion>
    </div>
  );
}
