'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { QRCodeSVG } from 'qrcode.react';
import { Check, Copy, Gift, Share2, Sparkles, Star } from 'lucide-react';
import { api } from '@/lib/api/client';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

export function InviteStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const [code, setCode] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<{ code: string }>('/growth/referrals/me', { locale })
      .then((r) => setCode(r.code))
      .catch(() => {});
  }, [locale]);

  const url =
    typeof window !== 'undefined' && code
      ? `${window.location.origin}/?ref=${code}`
      : '';

  async function copy() {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked */
    }
  }

  async function share() {
    if (!url) return;
    if (navigator.share) {
      await navigator.share({ title: 'BeanCircle', text: t('inviteSubtitle'), url }).catch(() => {});
    } else {
      void copy();
    }
  }

  const rewards = [
    { icon: Star, label: t('inviteRewardPoints') },
    { icon: Gift, label: t('inviteRewardBadge') },
    { icon: Sparkles, label: t('inviteRewardDecoration') },
  ];

  return (
    <StepFrame
      title={t('inviteTitle')}
      subtitle={t('inviteSubtitle')}
      nav={
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          onContinue={onComplete}
          continueLabel={t('done')}
        />
      }
    >
      <div className="flex flex-col items-center">
        <div className="rounded-2xl bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.4)]">
          {url ? (
            <QRCodeSVG value={url} size={128} bgColor="#ffffff" fgColor="#1a0f0a" level="M" />
          ) : (
            <div className="h-32 w-32 animate-pulse rounded bg-black/10" />
          )}
        </div>
        <p className="mt-2 text-xs text-white/45">{t('inviteQr')}</p>

        <div className="mt-4 flex w-full items-center gap-2">
          <code className="min-w-0 flex-1 truncate rounded-xl border border-white/12 bg-white/5 px-3 py-2.5 text-center font-mono text-sm text-white/85">
            {code || '········'}
          </code>
          <button
            type="button"
            onClick={copy}
            aria-label={t('inviteCopy')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-white/80 transition hover:bg-white/10 active:scale-95"
          >
            {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>

        <button
          type="button"
          onClick={share}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-[#1a0f0a] shadow-[0_8px_30px_rgba(240,184,96,0.35)] transition hover:brightness-105 active:scale-95"
        >
          <Share2 className="h-4 w-4" />
          {t('inviteShare')}
        </button>

        <div className="mt-4 grid w-full grid-cols-3 gap-2">
          {rewards.map(({ icon: Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1 rounded-xl border border-white/10 bg-white/5 p-2 text-center"
            >
              <Icon className="h-4 w-4 text-amber-400" />
              <span className="text-[10px] leading-tight text-white/70">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </StepFrame>
  );
}
