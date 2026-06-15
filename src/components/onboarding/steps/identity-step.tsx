'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import { useAuthStore } from '@/stores/auth-store';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { StepFrame } from '../step-frame';
import type { StepProps } from '../types';

/**
 * The mandatory username gate. Setting a username flips needsOnboarding=false
 * so the user is never trapped; from here every step is skippable. This is the
 * one required field — kept to a single input on purpose.
 */
export function IdentityStep({ locale, onIdentityDone, onBack }: StepProps) {
  const t = useTranslations('auth');
  const to = useTranslations('onboarding');
  const { user, setUser } = useAuthStore();

  const [username, setUsername] = useState(user?.username ?? '');
  const [name, setName] = useState(user?.name ?? '');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizeUsername(username);
  const usernameOk = isValidUsername(normalized);

  async function submit() {
    const finalUsername = normalizeUsername(username);
    if (!isValidUsername(finalUsername)) {
      setError(t('usernameInvalid'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const updated = await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: finalUsername, name: name || undefined }),
        locale,
      });
      setUser({ ...(updated as object), needsOnboarding: false } as never);
      if (referralCode.trim().length >= 4) {
        await api('/growth/referrals/apply', {
          method: 'POST',
          body: JSON.stringify({ code: referralCode.trim() }),
          locale,
        }).catch(() => {});
      }
      onIdentityDone?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : t('usernameInvalid'));
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'h-14 w-full rounded-2xl border border-white/12 bg-white/5 px-4 text-base text-white placeholder:text-white/40 outline-none transition-all focus:border-amber-400/80 focus:ring-4 focus:ring-amber-400/10';

  return (
    <StepFrame title={t('onboarding')}>
      <div className="space-y-4">
        <div>
          <input
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            onBlur={() => setUsername(normalizeUsername(username))}
            placeholder={t('username')}
            autoComplete="username"
            dir="ltr"
            className={inputCls}
          />
          <p className="mt-1.5 px-1 text-xs text-white/50">{t('usernameHint')}</p>
          {username && !usernameOk && (
            <p className="mt-1 px-1 text-xs text-red-400">{t('usernameInvalid')}</p>
          )}
        </div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={t('name')}
          className={inputCls}
        />
        <input
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder={t('referralCode')}
          dir="ltr"
          className={`${inputCls} font-mono`}
        />
        {error && <p className="text-center text-sm text-red-400">{error}</p>}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onBack}
            className="h-12 rounded-full px-4 text-sm font-medium text-white/55 transition hover:bg-white/10 hover:text-white active:scale-95"
          >
            {to('back')}
          </button>
          <div className="flex-1">
            <AuthPrimaryButton onClick={submit} disabled={loading || !usernameOk} loading={loading}>
              {t('save')}
            </AuthPrimaryButton>
          </div>
        </div>
      </div>
    </StepFrame>
  );
}
