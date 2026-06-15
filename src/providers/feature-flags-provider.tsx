'use client';

import { useQuery } from '@tanstack/react-query';
import { createContext, useContext, useMemo } from 'react';
import { getFeatureFlags, type FlagMap } from '@/lib/api/feature-flags';

type FeatureFlagsContextValue = {
  flags: FlagMap;
  isEnabled: (key: string) => boolean;
  isLoading: boolean;
};

const FeatureFlagsContext = createContext<FeatureFlagsContextValue>({
  flags: {},
  // Default to enabled until flags load so UI doesn't flash hidden.
  isEnabled: () => true,
  isLoading: true,
});

export function FeatureFlagsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['feature-flags'],
    queryFn: () => getFeatureFlags(),
    staleTime: 60_000,
  });

  const value = useMemo<FeatureFlagsContextValue>(() => {
    const flags = data ?? {};
    return {
      flags,
      // Unknown/not-yet-loaded keys default to enabled.
      isEnabled: (key: string) => flags[key] ?? true,
      isLoading,
    };
  }, [data, isLoading]);

  return (
    <FeatureFlagsContext.Provider value={value}>
      {children}
    </FeatureFlagsContext.Provider>
  );
}

export function useFeatureFlags() {
  return useContext(FeatureFlagsContext);
}

export function useFeatureEnabled(key: string) {
  return useContext(FeatureFlagsContext).isEnabled(key);
}
