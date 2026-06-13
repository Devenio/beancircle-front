'use client';

import { useEffect, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { Share, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Animated, accessible "Add to Home Screen" walkthrough for iOS Safari. Three
 * steps auto-advance (unless the user prefers reduced motion) and can be
 * stepped manually via the indicators.
 */
export function IosInstallGuide() {
  const t = useTranslations('install');
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);

  const steps = [
    { title: t('ios.step1'), hint: t('ios.step1hint') },
    { title: t('ios.step2'), hint: t('ios.step2hint') },
    { title: t('ios.step3'), hint: t('ios.step3hint') },
  ];

  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setStep((s) => (s + 1) % steps.length), 3000);
    return () => clearInterval(id);
  }, [reduce, steps.length]);

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      {/* Illustration stage */}
      <div className="relative flex h-52 items-center justify-center overflow-hidden bg-gradient-to-b from-muted/60 to-muted/20">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduce ? { opacity: 0 } : { opacity: 0, y: -12 }}
            transition={{ duration: 0.4, ease: [0.32, 0.72, 0, 1] }}
            className="flex flex-col items-center"
          >
            <StepIllustration step={step} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Step text */}
      <div className="px-5 py-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="flex items-baseline gap-2">
              <span className="text-xs font-bold text-primary">{step + 1}</span>
              <h3 className="text-[15px] font-semibold leading-snug">{steps[step]!.title}</h3>
            </div>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{steps[step]!.hint}</p>
          </motion.div>
        </AnimatePresence>

        {/* Indicators */}
        <div className="mt-4 flex items-center justify-center gap-2" role="tablist" aria-label={t('ios.stepsLabel')}>
          {steps.map((s, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === step}
              aria-label={s.title}
              onClick={() => setStep(i)}
              className={cn(
                'h-1.5 rounded-full transition-all',
                i === step ? 'w-6 bg-primary' : 'w-1.5 bg-border',
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/** Schematic phone showing the relevant UI for each step. */
function StepIllustration({ step }: { step: number }) {
  return (
    <div className="relative h-40 w-[104px] rounded-[1.6rem] border-4 border-foreground/85 bg-background shadow-xl">
      {/* notch */}
      <div className="absolute left-1/2 top-1.5 h-1.5 w-10 -translate-x-1/2 rounded-full bg-foreground/30" />

      {step === 0 && (
        <>
          {/* content lines */}
          <div className="absolute inset-x-3 top-7 space-y-1.5">
            <div className="h-1.5 w-3/4 rounded bg-muted" />
            <div className="h-1.5 w-full rounded bg-muted" />
            <div className="h-1.5 w-2/3 rounded bg-muted" />
          </div>
          {/* bottom Safari bar with highlighted share button */}
          <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-around rounded-xl bg-muted/70 py-1.5">
            <span className="h-3 w-3 rounded-sm bg-muted-foreground/30" />
            <motion.span
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ repeat: Infinity, duration: 1.6 }}
              className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground"
            >
              <Share className="size-3.5" />
            </motion.span>
            <span className="h-3 w-3 rounded-sm bg-muted-foreground/30" />
          </div>
        </>
      )}

      {step === 1 && (
        // share sheet sliding up with "Add to Home Screen" highlighted
        <motion.div
          initial={{ y: 30 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 26 }}
          className="absolute inset-x-1 bottom-1 space-y-1 rounded-xl bg-muted/80 p-1.5"
        >
          <div className="h-1 w-8 mx-auto rounded-full bg-muted-foreground/40" />
          <div className="flex items-center gap-1.5 rounded-md bg-muted/60 px-1.5 py-1">
            <span className="h-2.5 w-2.5 rounded bg-muted-foreground/30" />
            <span className="h-1.5 flex-1 rounded bg-muted-foreground/20" />
          </div>
          <motion.div
            animate={{ backgroundColor: ['rgba(0,0,0,0)', 'rgba(200,127,67,0.18)', 'rgba(0,0,0,0)'] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 ring-1 ring-primary/40"
          >
            <span className="flex size-4 items-center justify-center rounded bg-foreground/80 text-background">
              <Plus className="size-3" />
            </span>
            <span className="h-1.5 flex-1 rounded bg-foreground/40" />
          </motion.div>
        </motion.div>
      )}

      {step === 2 && (
        <>
          {/* "Add" confirm dialog top-right */}
          <div className="absolute inset-x-3 top-7 space-y-1.5 opacity-40">
            <div className="h-1.5 w-3/4 rounded bg-muted" />
            <div className="h-1.5 w-full rounded bg-muted" />
          </div>
          <motion.span
            animate={{ scale: [1, 1.18, 1] }}
            transition={{ repeat: Infinity, duration: 1.6 }}
            className="absolute right-2 top-2 flex items-center gap-1 rounded-md bg-primary px-1.5 py-1 text-[8px] font-bold text-primary-foreground"
          >
            <Check className="size-2.5" /> Add
          </motion.span>
          {/* new home-screen icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 300, damping: 18 }}
            className="absolute bottom-3 left-1/2 size-7 -translate-x-1/2 rounded-lg bg-gradient-to-br from-[#2a1a12] to-[#140b07] shadow-md"
          />
        </>
      )}
    </div>
  );
}
