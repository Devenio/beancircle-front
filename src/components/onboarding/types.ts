import type { StepKey } from '@/stores/onboarding-store';

/** Contract every onboarding step receives from the shell. */
export type StepProps = {
  /** Advance to the next step, marking the current one completed. */
  onComplete: () => void;
  /** Advance to the next step, marking the current one skipped. */
  onSkip: () => void;
  /** Go to the previous step. */
  onBack: () => void;
  /** Leave onboarding and enter the app now (only meaningful post-identity). */
  onEnter: () => void;
  /** Called by the identity gate once a username is saved. */
  onIdentityDone?: () => void;
  locale: string;
  /** True if the username gate is cleared (escape hatch available). */
  identityDone: boolean;
  /** Whether this is the first/last activation step (controls Back visibility). */
  isFirst: boolean;
  isLast: boolean;
};

export type { StepKey };
