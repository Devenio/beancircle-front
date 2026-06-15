'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { Coffee, Volume2, VolumeX } from 'lucide-react';
import { Confetti } from '../confetti';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

/** Plays a short celebratory arpeggio via WebAudio (no asset). */
function playChime() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + i * 0.1;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.45);
    });
    setTimeout(() => void ctx.close(), 800);
  } catch {
    /* audio not available */
  }
}

export function AchievementStep({ onComplete, onSkip, onBack }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const [soundOn, setSoundOn] = useState(false);
  const played = useRef(false);

  useEffect(() => {
    if (soundOn && !played.current) {
      played.current = true;
      playChime();
    }
  }, [soundOn]);

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col items-center rounded-3xl border border-white/10 bg-white/[0.06] p-6 text-center shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <Confetti />

      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-300/80">
        {t('achievementUnlocked')}
      </p>

      <LazyMotion features={domAnimation} strict>
        <m.div
          className="relative my-5"
          initial={reduce ? false : { scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.15 }}
        >
          <div className="absolute inset-0 -z-10 animate-pulse rounded-full bg-amber-400/30 blur-2xl" />
          <div className="flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-amber-300 via-orange-400 to-amber-600 shadow-[0_0_50px_rgba(240,184,96,0.6)]">
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-2 border-white/40 bg-[#1a0f0a]/30 backdrop-blur-sm">
              <Coffee className="h-12 w-12 text-white" strokeWidth={2} />
            </div>
          </div>
        </m.div>

        <m.h2
          className="text-2xl font-black"
          initial={reduce ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          {t('achievementBadge')}
        </m.h2>
        <m.p
          className="mt-2 max-w-xs text-sm text-white/65"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.65 }}
        >
          {t('achievementDesc')}
        </m.p>
      </LazyMotion>

      <button
        type="button"
        onClick={() => setSoundOn((v) => !v)}
        aria-pressed={soundOn}
        className="mt-4 flex items-center gap-1.5 rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 active:scale-95"
      >
        {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
        {t('achievementSound')}
      </button>

      <div className="w-full">
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          skipLabel={t('skip')}
          onContinue={onComplete}
          continueLabel={t('achievementView')}
        />
      </div>
    </div>
  );
}
