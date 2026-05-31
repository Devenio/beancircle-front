'use client';

import { useEffect } from 'react';
import { isMockMode } from '@/lib/api/mock';
import { MOCK_CURRENT_USER } from '@/lib/api/mock-data';
import { useAuthStore } from '@/stores/auth-store';

export function MockAuthInit() {
  const setUser = useAuthStore((s) => s.setUser);
  const setTokens = useAuthStore((s) => s.setTokens);

  useEffect(() => {
    if (!isMockMode()) return;
    if (localStorage.getItem('accessToken')) return;
    setTokens('mock-access-token', 'mock-refresh-token');
    setUser(MOCK_CURRENT_USER);
  }, [setUser, setTokens]);

  return null;
}
