'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import {
  initMixpanel,
  mixpanelIdentify,
  mixpanelPeopleSet,
  mixpanelReset,
} from '@/lib/analytics/mixpanel';

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    initMixpanel();
  }, []);

  useEffect(() => {
    if (user?.id) {
      mixpanelIdentify(user.id);
      mixpanelPeopleSet({
        username: user.username ?? undefined,
        name: user.name ?? undefined,
        role: user.role ?? undefined,
        is_cafe_owner: user.isCafeOwner ?? false,
      });
    } else {
      mixpanelReset();
    }
  }, [user]);

  return <>{children}</>;
}
