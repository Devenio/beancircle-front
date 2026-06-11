'use client';

import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'framer-motion';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useRouter } from '@/i18n/navigation';
import { api, getGoogleAuthUrl } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { AuthBackground } from './auth-background';
import { AuthPrimaryButton } from './auth-primary-button';
import { GoogleAuthButton } from './google-auth-button';
import { LoginHero } from './login-hero';
import { OtpInput } from './otp-input';
import {
  COUNTRIES,
  PhoneField,
  formatNational,
  type Country,
} from './phone-field';

type Phase = 'phone' | 'otp';
type PhoneStatus = 'idle' | 'error' | 'loading' | 'success';

const RESEND_SECONDS = 60;

const fadeSlide = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
  transition: { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const },
};

const staggerFooter = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.32 },
  },
};

const footerItem = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function LoginScreen() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>('phone');
  const [country, setCountry] = useState<Country>(
    () => COUNTRIES.find((c) => c.code === 'IR') ?? COUNTRIES[0],
  );
  const [national, setNational] = useState('912');
  const [otp, setOtp] = useState('');
  const [phoneStatus, setPhoneStatus] = useState<PhoneStatus>('idle');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpError, setOtpError] = useState(false);
  const [mockCode, setMockCode] = useState('');
  const [resendIn, setResendIn] = useState(0);

  const e164 = useMemo(
    () => `${country.dial}${national.replace(/\D/g, '')}`,
    [country.dial, national],
  );

  const displayPhone = useMemo(
    () => `${country.dial} ${formatNational(national, country.groups)}`.trim(),
    [country, national],
  );

  const expectedDigits = useMemo(
    () => country.groups.reduce((sum, g) => sum + g, 0),
    [country.groups],
  );

  const canContinue = national.replace(/\D/g, '').length === expectedDigits;

  useEffect(() => {
    if (resendIn <= 0) return;
    const id = window.setInterval(() => {
      setResendIn((s) => (s <= 1 ? 0 : s - 1));
    }, 1000);
    return () => window.clearInterval(id);
  }, [resendIn]);

  const sendOtp = useCallback(async () => {
    if (!canContinue) return;
    setLoading(true);
    setError('');
    setPhoneStatus('loading');
    try {
      const res = await api<{ message: string; code?: string }>(
        '/auth/otp/request',
        {
          method: 'POST',
          body: JSON.stringify({ phone: e164 }),
          locale,
        },
      );
      if (res.code) setMockCode(res.code);
      setPhoneStatus('success');
      setResendIn(RESEND_SECONDS);
      window.setTimeout(() => {
        setPhase('otp');
        setOtp('');
        setPhoneStatus('idle');
      }, 420);
    } catch (e) {
      setPhoneStatus('error');
      setError(e instanceof Error ? e.message : t('callbackError'));
    } finally {
      setLoading(false);
    }
  }, [canContinue, e164, locale, t]);

  const verify = useCallback(
    async (code: string) => {
      if (code.length !== 6) return;
      setLoading(true);
      setError('');
      setOtpError(false);
      try {
        const res = await api<{
          accessToken: string;
          refreshToken: string;
          user: {
            id: string;
            username?: string;
            needsOnboarding?: boolean;
            role?: string;
          };
        }>('/auth/otp/verify', {
          method: 'POST',
          body: JSON.stringify({ phone: e164, code }),
          locale,
        });
        setTokens(res.accessToken, res.refreshToken);
        setUser(res.user);
        router.replace(res.user.needsOnboarding ? '/onboarding' : '/');
      } catch (e) {
        setOtpError(true);
        setOtp('');
        setError(e instanceof Error ? e.message : t('invalidCode'));
      } finally {
        setLoading(false);
      }
    },
    [e164, locale, router, setTokens, setUser, t],
  );

  function backToPhone() {
    setPhase('phone');
    setOtp('');
    setError('');
    setOtpError(false);
    setPhoneStatus('idle');
  }

  const phoneFieldStatus =
    phoneStatus === 'loading'
      ? 'loading'
      : phoneStatus === 'success'
        ? 'success'
        : phoneStatus === 'error'
          ? 'error'
          : 'idle';

  const motionProps = reduceMotion
    ? { initial: false, animate: { opacity: 1, y: 0 }, exit: { opacity: 1, y: 0 } }
    : fadeSlide;

  return (
    <div className="relative flex min-h-dvh min-h-[100dvh] flex-col overflow-hidden text-white">
      <AuthBackground />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-[max(0.75rem,env(safe-area-inset-top))]">
        <LoginHero />

        <LazyMotion features={domAnimation} strict>
          <div className="flex flex-1 flex-col justify-center py-6">
            <AnimatePresence mode="wait" initial={false}>
              {phase === 'phone' ? (
                <m.div
                  key="phone"
                  layoutId={reduceMotion ? undefined : 'auth-card'}
                  {...motionProps}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <m.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.12, duration: 0.28 }}
                  >
                    <PhoneField
                      country={country}
                      onCountryChange={(c) => {
                        setCountry(c);
                        setError('');
                        setPhoneStatus('idle');
                      }}
                      value={national}
                      onChange={(d) => {
                        setNational(d);
                        setError('');
                        if (phoneStatus === 'error') setPhoneStatus('idle');
                      }}
                      onEnter={() => canContinue && !loading && sendOtp()}
                      status={phoneFieldStatus}
                      label={t('phoneLabel')}
                      selectLabel={t('selectCountry')}
                    />
                  </m.div>

                  <m.div
                    className="mt-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18, duration: 0.28 }}
                  >
                    <AuthPrimaryButton
                      loading={loading && phase === 'phone'}
                      disabled={!canContinue}
                      onClick={sendOtp}
                    >
                      {t('continue')}
                    </AuthPrimaryButton>
                  </m.div>

                  {error && phase === 'phone' ? (
                    <p
                      role="alert"
                      className="mt-3 text-center text-sm text-red-400"
                    >
                      {error}
                    </p>
                  ) : null}
                </m.div>
              ) : (
                <m.div
                  key="otp"
                  layoutId={reduceMotion ? undefined : 'auth-card'}
                  {...motionProps}
                  className="rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl"
                >
                  <button
                    type="button"
                    onClick={backToPhone}
                    className="mb-4 text-sm font-medium text-amber-200/90 transition-colors hover:text-amber-100"
                  >
                    ← {t('changeNumber')}
                  </button>
                  <h2 className="text-xl font-bold tracking-tight">
                    {t('otpTitle')}
                  </h2>
                  <p className="mt-1.5 text-sm text-white/55">
                    {t('otpSubtitle', { phone: displayPhone })}
                  </p>

                  <div className="mt-6" aria-live="polite">
                    <OtpInput
                      value={otp}
                      onChange={(v) => {
                        setOtp(v);
                        setOtpError(false);
                        setError('');
                      }}
                      onComplete={verify}
                      error={otpError}
                      disabled={loading}
                      autoFocus
                    />
                  </div>

                  {mockCode ? (
                    <p className="mt-3 text-center text-xs text-white/40">
                      {t('mockCode')}:{' '}
                      <span className="font-mono text-amber-200/80">
                        {mockCode}
                      </span>
                    </p>
                  ) : null}

                  <div className="mt-5">
                    <AuthPrimaryButton
                      loading={loading}
                      disabled={otp.length < 6}
                      onClick={() => verify(otp)}
                    >
                      {loading ? t('verifying') : t('verify')}
                    </AuthPrimaryButton>
                  </div>

                  <div className="mt-4 text-center">
                    {resendIn > 0 ? (
                      <p className="text-sm text-white/45">
                        {t('resendIn', { seconds: resendIn })}
                      </p>
                    ) : (
                      <button
                        type="button"
                        disabled={loading}
                        onClick={sendOtp}
                        className="text-sm font-medium text-amber-200/90 hover:text-amber-100 disabled:opacity-50"
                      >
                        {t('resend')}
                      </button>
                    )}
                  </div>

                  {error && phase === 'otp' ? (
                    <p
                      role="alert"
                      className="mt-3 text-center text-sm text-red-400"
                    >
                      {error}
                    </p>
                  ) : null}
                </m.div>
              )}
            </AnimatePresence>
          </div>

          <m.footer
            variants={reduceMotion ? undefined : staggerFooter}
            initial={reduceMotion ? false : 'hidden'}
            animate={reduceMotion ? undefined : 'show'}
            className="shrink-0 space-y-4"
          >
            <m.div variants={footerItem} className="flex items-center gap-3">
              <span className="h-px flex-1 bg-white/10" />
              <span className="text-xs font-medium uppercase tracking-wider text-white/35">
                {t('orDivider')}
              </span>
              <span className="h-px flex-1 bg-white/10" />
            </m.div>

            <m.div variants={footerItem}>
              <GoogleAuthButton
                href={getGoogleAuthUrl()}
                loading={googleLoading}
                disabled={loading}
                onNavigate={() => setGoogleLoading(true)}
              >
                {t('continueGoogle')}
              </GoogleAuthButton>
            </m.div>

            <m.p
              variants={footerItem}
              className="px-2 text-center text-[11px] leading-relaxed text-white/40"
            >
              {t('termsPrefix')}{' '}
              <Link
                href="/settings"
                className="text-white/55 underline underline-offset-2 hover:text-white/75"
              >
                {t('terms')}
              </Link>{' '}
              {t('and')}{' '}
              <Link
                href="/settings"
                className="text-white/55 underline underline-offset-2 hover:text-white/75"
              >
                {t('privacy')}
              </Link>
            </m.p>
          </m.footer>
        </LazyMotion>
      </div>
    </div>
  );
}
