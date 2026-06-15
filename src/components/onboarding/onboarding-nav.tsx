'use client';

import { useTranslations } from 'next-intl';
import { ArrowLeft, ArrowRight } from 'lucide-react';

type Props = {
  onBack?: () => void;
  onSkip?: () => void;
  onContinue?: () => void;
  /** Label for the primary action; defaults to "Continue". */
  continueLabel?: string;
  /** Label for the skip action; defaults to "Skip". */
  skipLabel?: string;
  continueDisabled?: boolean;
  continueLoading?: boolean;
  showBack?: boolean;
  showSkip?: boolean;
  /** Hide the primary button entirely (e.g. when a step has its own CTA). */
  hideContinue?: boolean;
};

/**
 * Shared Back / Skip / Continue control row. Every activation step renders this
 * so the escape hatches are always present and consistent. RTL-safe (uses
 * logical properties + lucide icons that the app mirrors via dir).
 */
export function OnboardingNav({
  onBack,
  onSkip,
  onContinue,
  continueLabel,
  skipLabel,
  continueDisabled,
  continueLoading,
  showBack = true,
  showSkip = true,
  hideContinue = false,
}: Props) {
  const t = useTranslations('onboarding');

  return (
    <div className="flex items-center justify-between gap-3 pt-5">
      <div className="flex items-center gap-2">
        {showBack && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="flex h-11 items-center gap-1.5 rounded-full px-4 text-sm font-medium text-white/60 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" />
            {t('back')}
          </button>
        )}
        {showSkip && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            className="h-11 rounded-full px-4 text-sm font-medium text-white/50 transition hover:bg-white/10 hover:text-white/80 active:scale-95"
          >
            {skipLabel ?? t('skip')}
          </button>
        )}
      </div>

      {!hideContinue && onContinue && (
        <button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || continueLoading}
          className="flex h-12 min-w-[7.5rem] items-center justify-center gap-2 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-6 text-sm font-bold text-[#1a0f0a] shadow-[0_8px_30px_rgba(240,184,96,0.35)] transition hover:brightness-105 active:scale-95 disabled:opacity-40 disabled:saturate-50"
        >
          {continueLoading ? (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#1a0f0a]/30 border-t-[#1a0f0a]" />
          ) : (
            <>
              {continueLabel ?? t('continue')}
              <ArrowRight className="h-4 w-4 rtl:rotate-180" />
            </>
          )}
        </button>
      )}
    </div>
  );
}
