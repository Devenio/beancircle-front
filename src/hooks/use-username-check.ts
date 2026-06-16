'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api/client';
import { isValidUsername } from '@/lib/username';

export type UsernameStatus = 'idle' | 'invalid' | 'checking' | 'available' | 'taken';

/**
 * Debounced username availability checker. Skips the check when the value
 * equals `ownUsername` (the user's current username) to avoid a false "taken"
 * on the edit-profile screen.
 */
export function useUsernameCheck(
  value: string,
  locale: string,
  ownUsername?: string,
): UsernameStatus {
  const [status, setStatus] = useState<UsernameStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (abortRef.current) abortRef.current.abort();

    if (!value) {
      setStatus('idle');
      return;
    }

    if (!isValidUsername(value)) {
      setStatus('invalid');
      return;
    }

    // Same as current username → always available for that user
    if (ownUsername && value === ownUsername) {
      setStatus('available');
      return;
    }

    setStatus('checking');

    timerRef.current = setTimeout(() => {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      api<{ available: boolean }>(`/users/check-username?username=${encodeURIComponent(value)}`, {
        locale,
      })
        .then(({ available }) => {
          if (!ctrl.signal.aborted) setStatus(available ? 'available' : 'taken');
        })
        .catch(() => {
          if (!ctrl.signal.aborted) setStatus('idle');
        });
    }, 500);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (abortRef.current) abortRef.current.abort();
    };
  }, [value, locale, ownUsername]);

  return status;
}
