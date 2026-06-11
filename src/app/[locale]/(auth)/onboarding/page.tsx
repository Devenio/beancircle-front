'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Coffee, UserRound } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { useQuery } from '@tanstack/react-query';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const tOs = useTranslations('cafeOs');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { setUser } = useAuthStore();
  const [step, setStep] = useState<'profile' | 'identity'>('profile');
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [cityId, setCityId] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { data: cities, isError: citiesError } = useQuery({
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
      if (referralCode.trim().length >= 4) {
        try {
          await api('/growth/referrals/apply', {
            method: 'POST',
            body: JSON.stringify({ code: referralCode.trim() }),
            locale,
          });
        } catch {
          /* optional */
        }
      }
      setStep('identity');
    } catch (e) {
      setError(e instanceof Error ? e.message : t('usernameInvalid'));
    } finally {
      setLoading(false);
    }
  }

  if (step === 'identity') {
    return (
      <motion.div
        className="space-y-5"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <h1 className="text-2xl font-bold">{tOs('onboardingTitle')}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {tOs('onboardingSubtitle')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => router.replace('/')}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <UserRound className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">{tOs('optionPersonal')}</span>
            <span className="block text-sm text-muted-foreground">
              {tOs('optionPersonalHint')}
            </span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => router.replace('/cafe-os/new')}
          className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-start shadow-sm transition active:scale-[0.98]"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-600">
            <Coffee className="h-6 w-6" />
          </span>
          <span>
            <span className="block font-semibold">{tOs('optionCafe')}</span>
            <span className="block text-sm text-muted-foreground">
              {tOs('optionCafeHint')}
            </span>
          </span>
        </button>

        <p className="text-center text-xs text-muted-foreground">
          {tOs('onboardingBothHint')}
        </p>
      </motion.div>
    );
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
      {citiesError && (
        <p className="text-sm text-red-600">
          Could not load cities. Is the API running on port 3001?
        </p>
      )}
      <Input
        value={referralCode}
        onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
        placeholder={t('referralCode')}
        dir="ltr"
        className="font-mono text-start"
      />
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
