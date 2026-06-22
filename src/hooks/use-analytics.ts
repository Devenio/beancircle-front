import { useCallback } from 'react';
import { mixpanelTrack } from '@/lib/analytics/mixpanel';

export function useAnalytics() {
  const track = useCallback(
    (event: string, props?: Record<string, string | number | boolean | undefined>) => {
      mixpanelTrack(event, props);
    },
    [],
  );

  return { track };
}
