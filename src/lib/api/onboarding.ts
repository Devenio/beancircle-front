import type { AvatarConfig } from '@/stores/onboarding-store';
import { api } from './client';

export type OnboardingProgress = {
  userId: string;
  currentStep: string;
  completedSteps: string[];
  skippedSteps: string[];
  stepTimings: Record<string, number>;
  startedAt: string;
  lastActiveAt: string;
  completedAt: string | null;
};

export type OnboardingCompletion = {
  filled: number;
  total: number;
  percent: number;
};

export type OnboardingState = {
  progress: OnboardingProgress;
  avatar: (AvatarConfig & { isDefault: boolean }) | null;
  interests: string[];
  /** Active, ordered activation-step keys (admin-managed). */
  flow: string[];
  completion: OnboardingCompletion;
};

export function getOnboarding(locale: string): Promise<OnboardingState> {
  return api<OnboardingState>('/onboarding/me', { locale });
}

/** Public: active, ordered activation-step keys. */
export function getOnboardingFlow(locale: string): Promise<string[]> {
  return api<string[]>('/onboarding/flow', { locale });
}

/** Autosave: advance the current step and/or mark one complete/skipped. */
export function patchOnboarding(
  body: {
    currentStep?: string;
    completeStep?: string;
    skipStep?: string;
    stepTimings?: Record<string, number>;
  },
  locale: string,
): Promise<OnboardingProgress> {
  return api<OnboardingProgress>('/onboarding/me', {
    method: 'PATCH',
    body: JSON.stringify(body),
    locale,
  });
}

export function completeOnboarding(
  locale: string,
): Promise<{ completed: boolean; badge: string }> {
  return api('/onboarding/complete', { method: 'POST', locale });
}

export function saveInterests(
  interests: string[],
  locale: string,
): Promise<{ interests: string[] }> {
  return api('/onboarding/interests', {
    method: 'PUT',
    body: JSON.stringify({ interests }),
    locale,
  });
}

export function getAvatar(
  locale: string,
): Promise<(AvatarConfig & { isDefault: boolean }) | null> {
  return api('/onboarding/avatar', { locale });
}

export function saveAvatar(
  config: AvatarConfig & { isDefault?: boolean },
  locale: string,
): Promise<AvatarConfig & { isDefault: boolean }> {
  return api('/onboarding/avatar', {
    method: 'PUT',
    body: JSON.stringify(config),
    locale,
  });
}

/** Fire-and-forget funnel event mirror (also dispatched on the client bus). */
export function trackOnboardingServerEvent(
  body: { step: string; type: 'viewed' | 'skipped' | 'completed'; timeSpentMs?: number },
  locale: string,
): Promise<unknown> {
  return api('/onboarding/events', {
    method: 'POST',
    body: JSON.stringify(body),
    locale,
  }).catch(() => null);
}
