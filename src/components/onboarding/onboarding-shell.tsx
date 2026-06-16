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
import {
  completeOnboarding,
  getOnboarding,
  getOnboardingFlow,
  patchOnboarding,
} from '@/lib/api/onboarding';
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

type StepDef = { key: string; Component: (p: StepProps) => React.ReactNode };

/** Activation steps by key. The mandatory `identity` username gate is inserted
 *  separately (right after welcome) and is never admin-toggleable. */
const STEP_COMPONENTS: Record<string, (p: StepProps) => React.ReactNode> = {
  welcome: WelcomeStep,
  interests: InterestsStep,
  avatar: AvatarStep,
  circle: CircleStep,
  firstPost: FirstPostStep,
  cafe: CafeStep,
  achievement: AchievementStep,
  profile: ProfileStep,
  invite: InviteStep,
};

/** Build the full screen sequence from the admin-managed activation flow:
 *  welcome (if enabled) → identity gate → remaining enabled steps, in order. */
function buildSequence(flow: string[]): StepDef[] {
  const known = flow.filter((k) => k in STEP_COMPONENTS);
  const seq: StepDef[] = [];
  if (known.includes('welcome')) {
    seq.push({ key: 'welcome', Component: STEP_COMPONENTS.welcome });
  }
  seq.push({ key: 'identity', Component: IdentityStep });
  for (const key of known) {
    if (key !== 'welcome') seq.push({ key, Component: STEP_COMPONENTS[key] });
  }
  return seq;
}

/** Default flow used until the server config loads (and as a failure fallback). */
const FALLBACK_FLOW = [...ACTIVATION_STEPS];

export function OnboardingShell() {
  const t = useTranslations('onboarding');
  const { locale } = useParams<{ locale: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const reduce = useReducedMotion();

  const user = useAuthStore((s) => s.user);
  const { identityDone, setIdentityDone, setLastStep } = useOnboardingStore();

  // Admin-managed activation flow. Defaults to the static fallback until the
  // server config loads (and stays on the fallback if that request fails).
  const [flow, setFlow] = useState<string[]>(FALLBACK_FLOW);
  const SEQUENCE = useMemo(() => buildSequence(flow), [flow]);

  // Start at the right step synchronously so we never mount welcome and then
  // auto-advance (which fights AnimatePresence mode="wait" and wedges it).
  const [index, setIndex] = useState(() => {
    const seq = buildSequence(FALLBACK_FLOW);
    const stepParam = searchParams.get('step');
    if (stepParam) {
      const i = seq.findIndex((s) => s.key === stepParam);
      if (i >= 0) return i;
    }
    // Username already set → identity gate is cleared; start just after it.
    if (user?.username) {
      const gate = seq.findIndex((s) => s.key === 'identity');
      return Math.min(gate + 1, seq.length - 1);
    }
    return 0;
  });
  const [direction, setDirection] = useState(1);
  const stepStart = useRef<number>(0);
  const liveRef = useRef<HTMLDivElement>(null);

  const step = SEQUENCE[index] ?? SEQUENCE[SEQUENCE.length - 1];
  const isLastActivation = index >= SEQUENCE.length - 1;

  // Latest step key, so an async flow swap can keep the user in place by key.
  // Updated in the per-step effect below (refs must not be set during render).
  const currentKeyRef = useRef<string | undefined>(undefined);

  // Adopt a new flow and remap the cursor: stay on the same step by key, or
  // clamp into range if that step was disabled. Called from async callbacks.
  const applyFlow = useCallback((f: string[]) => {
    setFlow(f);
    setIndex((cur) => {
      const seq = buildSequence(f);
      const key = currentKeyRef.current;
      const i = key ? seq.findIndex((s) => s.key === key) : -1;
      return i >= 0 ? i : Math.min(cur, seq.length - 1);
    });
  }, []);

  // One-time: announce start, sync identity flag, load the active flow config,
  // and (optionally) resume from the server's saved step. The resume jump fires
  // after a network round-trip, long after AnimatePresence has settled.
  useEffect(() => {
    trackOnboarding('onboarding_started');
    if (user?.username) setIdentityDone(true);
    getOnboardingFlow(locale)
      .then((f) => {
        if (Array.isArray(f) && f.length) applyFlow(f);
      })
      .catch(() => {});
    if (searchParams.get('resume') === '1') {
      getOnboarding(locale)
        .then((s) => {
          if (s.flow?.length) applyFlow(s.flow);
          if (!s.progress.completedAt && s.progress.currentStep) {
            const i = buildSequence(s.flow ?? flow).findIndex(
              (st) => st.key === s.progress.currentStep,
            );
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
    currentKeyRef.current = step.key;
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
    [elapsed, step.key, index, locale, isLastActivation, finish, SEQUENCE.length],
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
    [advance, onBack, onEnter, setIdentityDone, locale, identityDone, index, isLastActivation, SEQUENCE.length],
  );

  const variants = reduce
    ? { enter: { opacity: 1 }, center: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
        center: { opacity: 1, x: 0 },
        exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
      };

  // Progress reflects the active activation steps (exclude the identity gate).
  const progressTotal = flow.length;
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
