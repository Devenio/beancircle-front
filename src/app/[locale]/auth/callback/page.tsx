'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';

function CallbackHandler() {
  const params = useSearchParams();
  const { setTokens, setUser } = useAuthStore();
  const router = useRouter();
  const t = useTranslations('auth');
  const [error, setError] = useState(false);

  useEffect(() => {
    const code = params.get('code');
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    async function finish(
      tokens: { accessToken: string; refreshToken: string },
      userHint?: { username?: string | null; needsOnboarding?: boolean },
    ) {
      setTokens(tokens.accessToken, tokens.refreshToken);
      try {
        const user = await api<{
          id: string;
          username?: string;
          role?: string;
          isCafeOwner?: boolean;
        }>('/users/me');
        setUser({
          id: user.id,
          username: user.username,
          role: user.role,
          isCafeOwner: user.isCafeOwner,
          needsOnboarding: !user.username,
        });
        const needsOnboarding =
          userHint?.needsOnboarding ?? !user.username;
        router.replace(needsOnboarding ? '/onboarding' : '/');
      } catch {
        setError(true);
      }
    }

    if (code) {
      api<{
        accessToken: string;
        refreshToken: string;
        user?: { needsOnboarding?: boolean; username?: string | null };
      }>('/auth/google/exchange', {
        method: 'POST',
        body: JSON.stringify({ code }),
      })
        .then((data) =>
          finish(
            {
              accessToken: data.accessToken,
              refreshToken: data.refreshToken,
            },
            data.user,
          ),
        )
        .catch(() => setError(true));
      return;
    }

    if (accessToken && refreshToken) {
      finish({ accessToken, refreshToken }).catch(() => setError(true));
      return;
    }

    setError(true);
  }, [params, setTokens, setUser, router]);

  if (error) {
    return (
      <p className="p-8 text-center text-destructive">{t('callbackError')}</p>
    );
  }

  return <p className="p-8 text-center">{t('signingIn')}</p>;
}

export default function AuthCallbackPage() {
  const t = useTranslations('auth');
  return (
    <Suspense fallback={<p className="p-8 text-center">{t('signingIn')}</p>}>
      <CallbackHandler />
    </Suspense>
  );
}
