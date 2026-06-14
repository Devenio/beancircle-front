'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { AnimatePresence, LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { Coffee, UserRound } from 'lucide-react';
import { api } from '@/lib/api/client';
import { isValidUsername, normalizeUsername } from '@/lib/username';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';
import { AuthBackground } from '@/components/auth/auth-background';
import { AuthPrimaryButton } from '@/components/auth/auth-primary-button';
import { LoginHero } from '@/components/auth/login-hero';

export default function OnboardingPage() {
  const t = useTranslations('auth');
  const tOs = useTranslations('cafeOs');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { user, setUser } = useAuthStore();
  
  // Skip profile if user already has a username
  const [step, setStep] = useState<'profile' | 'identity'>(() => user?.username ? 'identity' : 'profile');
  
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [referralCode, setReferralCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const reduceMotion = useReducedMotion();

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

  async function submitProfile() {
    const finalUsername = normalizeUsername(username);
    if (!isValidUsername(finalUsername)) {
      setError(t('usernameInvalid'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const updatedUser = await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ username: finalUsername, name }),
        locale,
      });
      setUser({ ...(updatedUser as object), needsOnboarding: false } as never);
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

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 } }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -12 },
        transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <div className="relative flex min-h-dvh min-h-[100dvh] flex-col overflow-hidden text-white">
      <AuthBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <LoginHero />

        <LazyMotion features={domAnimation} strict>
          <div className="flex flex-1 flex-col justify-center py-6">
            <AnimatePresence mode="wait" initial={false}>
              {step === 'profile' ? (
                <m.div
                  key="profile"
                  layoutId={reduceMotion ? undefined : 'auth-card'}
                  {...motionProps}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <h2 className="mb-4 text-xl font-bold tracking-tight">{t('onboarding')}</h2>
                  
                  <div className="space-y-4">
                    <div>
                      <input
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        onBlur={handleUsernameBlur}
                        placeholder={t('username')}
                        autoComplete="username"
                        dir="ltr"
                        className="h-14 w-full rounded-2xl border border-white/12 bg-white/5 px-4 text-base text-white placeholder:text-white/40 outline-none focus:border-amber-400/80 focus:ring-4 focus:ring-amber-400/10 transition-all"
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
                      className="h-14 w-full rounded-2xl border border-white/12 bg-white/5 px-4 text-base text-white placeholder:text-white/40 outline-none focus:border-amber-400/80 focus:ring-4 focus:ring-amber-400/10 transition-all"
                    />
                    
                    <input
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                      placeholder={t('referralCode')}
                      dir="ltr"
                      className="h-14 w-full rounded-2xl border border-white/12 bg-white/5 px-4 font-mono text-base text-white placeholder:text-white/40 outline-none focus:border-amber-400/80 focus:ring-4 focus:ring-amber-400/10 transition-all"
                    />
                    
                    {error && <p className="text-sm text-red-400 text-center">{error}</p>}
                    
                    <div className="pt-2">
                      <AuthPrimaryButton
                        onClick={submitProfile}
                        disabled={loading || !usernameOk}
                        loading={loading}
                      >
                        {t('save')}
                      </AuthPrimaryButton>
                    </div>
                  </div>
                </m.div>
              ) : (
                <m.div
                  key="identity"
                  layoutId={reduceMotion ? undefined : 'auth-card'}
                  {...motionProps}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl space-y-5"
                >
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">{tOs('onboardingTitle')}</h2>
                    <p className="mt-1.5 text-sm text-white/55">
                      {tOs('onboardingSubtitle')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => router.replace('/feed')}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/12 bg-white/5 p-4 text-start transition hover:bg-white/10 active:scale-[0.98]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-400/10 text-amber-400">
                      <UserRound className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white/90">{tOs('optionPersonal')}</span>
                      <span className="block text-sm text-white/50">
                        {tOs('optionPersonalHint')}
                      </span>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => router.replace('/cafe-os/new')}
                    className="flex w-full items-center gap-4 rounded-2xl border border-white/12 bg-white/5 p-4 text-start transition hover:bg-white/10 active:scale-[0.98]"
                  >
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-400">
                      <Coffee className="h-6 w-6" />
                    </span>
                    <span>
                      <span className="block font-semibold text-white/90">{tOs('optionCafe')}</span>
                      <span className="block text-sm text-white/50">
                        {tOs('optionCafeHint')}
                      </span>
                    </span>
                  </button>

                  <p className="text-center text-xs text-white/40">
                    {tOs('onboardingBothHint')}
                  </p>
                </m.div>
              )}
            </AnimatePresence>
          </div>
        </LazyMotion>
      </div>
    </div>
  );
}
