'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { useRouter } from '@/i18n/navigation';

export default function LoginPage() {
  const t = useTranslations('auth');
  const { locale } = useParams<{ locale: string }>();
  const router = useRouter();
  const { setUser, setTokens } = useAuthStore();
  const [phone, setPhone] = useState('+98912');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [mockCode, setMockCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const apiBase = process.env.NEXT_PUBLIC_API_URL?.replace('/api/v1', '') ?? 'http://localhost:3001';

  async function sendOtp() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{ message: string; code?: string }>('/auth/otp/request', {
        method: 'POST',
        body: JSON.stringify({ phone }),
        locale,
      });
      if (res.code) setMockCode(res.code);
      setStep('code');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  async function verify() {
    setLoading(true);
    setError('');
    try {
      const res = await api<{
        accessToken: string;
        refreshToken: string;
        user: { id: string; username?: string; needsOnboarding?: boolean; role?: string };
      }>('/auth/otp/verify', {
        method: 'POST',
        body: JSON.stringify({ phone, code }),
        locale,
      });
      setTokens(res.accessToken, res.refreshToken);
      setUser(res.user);
      router.replace(res.user.needsOnboarding ? '/onboarding' : '/');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t('login')}</h1>
      {step === 'phone' ? (
        <>
          <Input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('phone')}
          />
          <Button onClick={sendOtp} disabled={loading} className="w-full">
            {t('sendOtp')}
          </Button>
        </>
      ) : (
        <>
          <Input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={t('otpCode')}
          />
          {mockCode && (
            <p className="text-xs text-neutral-500">Mock code: {mockCode}</p>
          )}
          <Button onClick={verify} disabled={loading} className="w-full">
            {t('verifyOtp')}
          </Button>
        </>
      )}
      <a href={`${apiBase}/api/v1/auth/google`} className="block w-full">
        <Button variant="outline" className="w-full" type="button">
          {t('google')}
        </Button>
      </a>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
