'use client';

import { useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useReducedMotion } from 'framer-motion';
import gsap from 'gsap';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

/**
 * Step 1 — Welcome. GSAP timeline: a bean falls into the cup, the cup fills
 * with coffee, steam rises, then the brand mark + copy reveal. ~3.5s, fully
 * skippable; reduced-motion jumps straight to the final frame.
 */
export function WelcomeStep({ onComplete, onSkip }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const root = useRef<HTMLDivElement>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!root.current) return;
    const ctx = gsap.context((self) => {
      const q = self.selector!;
      const fill = q('#coffee-fill')[0] as SVGRectElement;

      if (reduce) {
        gsap.set('#bean', { y: 86, opacity: 0 });
        gsap.set(fill, { attr: { y: 116, height: 52 } });
        gsap.set(['.steam', '#brand', '#copy'], { opacity: 1, y: 0 });
        setDone(true);
        return;
      }

      const tl = gsap.timeline({ onComplete: () => setDone(true) });
      tl.set('#bean', { y: -120, opacity: 1, rotate: -20 })
        .set(fill, { attr: { y: 168, height: 0 } })
        .set(['.steam', '#brand', '#copy'], { opacity: 0 })
        // bean falls + bounces in
        .to('#bean', { y: 86, rotate: 12, duration: 0.7, ease: 'bounce.out' })
        .to('#bean', { opacity: 0, duration: 0.25 }, '-=0.1')
        // cup fills
        .to(fill, { attr: { y: 116, height: 52 }, duration: 0.9, ease: 'power1.inOut' }, '-=0.15')
        // steam rises (looping)
        .to('.steam', { opacity: 0.6, duration: 0.5 }, '-=0.3')
        .fromTo(
          '.steam',
          { y: 6 },
          { y: -6, duration: 1.4, ease: 'sine.inOut', repeat: -1, yoyo: true, stagger: 0.2 },
          '-=0.4',
        )
        // brand + copy reveal
        .to('#brand', { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: 'back.out(1.7)' }, '-=0.8')
        .to('#copy', { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }, '-=0.25');
    }, root);

    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={root} className="mx-auto flex w-full max-w-md flex-col items-center text-center">
      <div className="relative mb-2 h-64 w-64">
        <svg viewBox="0 0 200 220" className="h-full w-full">
          <defs>
            <linearGradient id="cup-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="100%" stopColor="#e8ddd0" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="coffee-g" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c8853c" />
              <stop offset="100%" stopColor="#5a3418" />
            </linearGradient>
            <linearGradient id="bean-g" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#f5b878" />
              <stop offset="100%" stopColor="#7a4a25" />
            </linearGradient>
            <clipPath id="cup-clip">
              <path d="M56 112 L144 112 L134 188 a14 14 0 0 1 -14 12 L84 200 a14 14 0 0 1 -14 -12 Z" />
            </clipPath>
          </defs>

          {/* steam */}
          <g className="steam" stroke="#ffffff" strokeOpacity="0.5" strokeWidth="4" fill="none" strokeLinecap="round">
            <path className="steam" d="M86 96 q-8 -14 0 -28 q8 -14 0 -28" />
            <path className="steam" d="M114 96 q8 -14 0 -28 q-8 -14 0 -28" />
          </g>

          {/* cup body */}
          <path
            d="M56 112 L144 112 L134 188 a14 14 0 0 1 -14 12 L84 200 a14 14 0 0 1 -14 -12 Z"
            fill="url(#cup-g)"
          />
          {/* coffee fill (animated) */}
          <g clipPath="url(#cup-clip)">
            <rect id="coffee-fill" x="56" y="168" width="88" height="0" fill="url(#coffee-g)" />
          </g>
          {/* cup rim + handle */}
          <ellipse cx="100" cy="112" rx="46" ry="9" fill="#ffffff" fillOpacity="0.95" />
          <ellipse cx="100" cy="112" rx="38" ry="6" fill="#3a2418" fillOpacity="0.25" />
          <path d="M144 124 a26 22 0 0 1 0 44" fill="none" stroke="url(#cup-g)" strokeWidth="10" />

          {/* falling bean */}
          <g id="bean" transform="translate(100 0)">
            <ellipse cx="0" cy="0" rx="13" ry="18" fill="url(#bean-g)" transform="rotate(32)" />
            <path
              d="M0 -14 C-6 -6, 6 8, 0 16"
              fill="none"
              stroke="#160d08"
              strokeWidth="3"
              strokeLinecap="round"
              transform="rotate(32)"
            />
          </g>
        </svg>
      </div>

      <div id="brand" style={{ opacity: 0, transform: 'translateY(12px) scale(0.9)' }}>
        <h1 className="bc-gradient-text text-3xl font-black tracking-tight">{t('welcomeTitle')}</h1>
      </div>
      <p id="copy" className="mt-3 max-w-xs text-base text-white/70" style={{ opacity: 0, transform: 'translateY(10px)' }}>
        {t('welcomeSubtitle')}
      </p>

      <div className="mt-6 w-full">
        <OnboardingNav
          showBack={false}
          onSkip={onSkip}
          onContinue={onComplete}
          continueDisabled={!done && !reduce}
        />
      </div>
    </div>
  );
}
