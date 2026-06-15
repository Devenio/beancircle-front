'use client';

import { useFeatureEnabled } from '@/providers/feature-flags-provider';

/**
 * Renders children only when the given feature flag is enabled. Use to gate
 * nav entries, buttons, and sections. For whole pages prefer a redirect via
 * useFeatureEnabled in the page component.
 */
export function FeatureGate({
  flag,
  fallback = null,
  children,
}: {
  flag: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  const enabled = useFeatureEnabled(flag);
  return <>{enabled ? children : fallback}</>;
}
