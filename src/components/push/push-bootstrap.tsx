'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ensurePushSubscribed } from '@/lib/push';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Registers the service worker and refreshes the push subscription when the
 * signed-in user has already granted notification permission. Never prompts —
 * the opt-in prompt lives behind the Settings → Notifications toggle.
 */
export function PushBootstrap() {
  const { locale } = useParams<{ locale: string }>();
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!user) return;
    void ensurePushSubscribed(locale);
  }, [user, locale]);

  return null;
}
