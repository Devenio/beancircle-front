'use client';

import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';

function CallbackHandler() {
  const params = useSearchParams();
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');
    if (accessToken && refreshToken) {
      setTokens(accessToken, refreshToken);
      api<{
        id: string;
        username?: string;
        role?: string;
        needsOnboarding?: boolean;
      }>('/users/me')
        .then((user) => {
          setUser({
            id: user.id,
            username: user.username,
            role: user.role,
            needsOnboarding: !user.username,
          });
          router.replace(!user.username ? '/onboarding' : '/');
        })
        .catch(() => router.replace('/login'));
    }
  }, [params, setTokens, setUser, router]);

  return <p className="p-8 text-center">Signing in...</p>;
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={<p className="p-8 text-center">Signing in...</p>}>
      <CallbackHandler />
    </Suspense>
  );
}
