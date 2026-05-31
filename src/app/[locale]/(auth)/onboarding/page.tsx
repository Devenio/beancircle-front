'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: cities } = useQuery({
    queryKey: ['cities'],
    queryFn: () => api<{ id: string; name: string; slug: string }[]>('/users/cities', { locale }),
  });

  const normalized = normalizeUsername(username);
  const usernameOk = isValidUsername(normalized);

  function handleUsernameChange(value: string) {
    setUsername(value);
    setError('');
  }

  function handleUsernameBlur() {
    const next = normalizeUsername(username);
    if (next !== username) setUsername(next);
  }

  async function submit() {
    const finalUsername = normalizeUsername(username);
    if (!isValidUsername(finalUsername)) {
      setError(t('usernameInvalid'));
      return;
    }
    if (!cityId) return;

    setLoading(true);
    setError('');
    try {
      const user = await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: finalUsername, name, cityId }),
        locale,
      });
      setUser({ ...(user as object), needsOnboarding: false } as never);
      router.replace('/');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('usernameInvalid'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t('onboarding')}</h1>
      <div>
        <Input
          value={username}
          onChange={(e) => handleUsernameChange(e.target.value)}
          onBlur={handleUsernameBlur}
          placeholder={t('username')}
          autoComplete="username"
          dir="ltr"
          className="text-start"
        />
        <p className="mt-1 text-xs text-neutral-500">{t('usernameHint')}</p>
        {username && !usernameOk && (
          <p className="mt-1 text-xs text-amber-600">{t('usernameInvalid')}</p>
        )}
      </div>
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={t('name')} />
      <select
        className="w-full rounded-lg border border-neutral-300 px-3 py-2"
        value={cityId}
        onChange={(e) => setCityId(e.target.value)}
      >
        <option value="">{t('city')}</option>
        {cities?.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button
        onClick={submit}
        disabled={loading || !usernameOk || !cityId}
        className="w-full"
      >
        {t('save')}
      </Button>
    </div>
  );
}
