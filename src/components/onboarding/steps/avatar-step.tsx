'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Shuffle } from 'lucide-react';
import { DEFAULT_AVATAR, useOnboardingStore, type AvatarConfig } from '@/stores/onboarding-store';
import { saveAvatar } from '@/lib/api/onboarding';
import { BeanAvatar, AVATAR_OPTIONS } from '../bean-avatar';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

const PARTS = Object.keys(AVATAR_OPTIONS) as (keyof AvatarConfig)[];

export function AvatarStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const { avatar, setAvatar, replaceAvatar } = useOnboardingStore();
  const [saving, setSaving] = useState<'save' | 'default' | null>(null);

  function cycle(part: keyof AvatarConfig, dir: number) {
    const opts = AVATAR_OPTIONS[part] as readonly string[];
    const i = opts.indexOf(avatar[part]);
    const next = opts[(i + dir + opts.length) % opts.length];
    setAvatar({ [part]: next } as Partial<AvatarConfig>);
  }

  function randomize() {
    const next = {} as AvatarConfig;
    for (const part of PARTS) {
      const opts = AVATAR_OPTIONS[part] as readonly string[];
      next[part] = opts[(Math.random() * opts.length) | 0];
    }
    replaceAvatar(next);
  }

  async function persist(cfg: AvatarConfig, isDefault: boolean, then: () => void) {
    setSaving(isDefault ? 'default' : 'save');
    await saveAvatar({ ...cfg, isDefault }, locale).catch(() => {});
    setSaving(null);
    then();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <h2 className="text-2xl font-bold tracking-tight">{t('avatarTitle')}</h2>
      <p className="mt-1.5 text-sm text-white/55">{t('avatarSubtitle')}</p>

      <LazyMotion features={domAnimation} strict>
        <div className="mt-4 flex flex-col items-center">
          <m.div
            key={JSON.stringify(avatar)}
            initial={reduce ? false : { scale: 0.94, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <BeanAvatar config={avatar} className="h-36 w-36 drop-shadow-[0_12px_30px_rgba(0,0,0,0.4)]" />
          </m.div>

          <button
            type="button"
            onClick={randomize}
            className="mt-3 flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/85 transition hover:bg-white/10 active:scale-95"
          >
            <Shuffle className="h-3.5 w-3.5" />
            {t('avatarRandomize')}
          </button>
        </div>
      </LazyMotion>

      <div className="mt-4 grid grid-cols-2 gap-2">
        {PARTS.map((part) => (
          <div
            key={part}
            className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-2 py-1.5"
          >
            <button
              type="button"
              aria-label={`previous ${part}`}
              onClick={() => cycle(part, -1)}
              className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"
            >
              <ChevronLeft className="h-4 w-4 rtl:rotate-180" />
            </button>
            <div className="min-w-0 text-center">
              <p className="text-[10px] uppercase tracking-wide text-white/40">{t(`part_${part}`)}</p>
              <p className="truncate text-xs font-medium capitalize text-white/85">{avatar[part]}</p>
            </div>
            <button
              type="button"
              aria-label={`next ${part}`}
              onClick={() => cycle(part, 1)}
              className="rounded-full p-1 text-white/60 transition hover:bg-white/10 hover:text-white active:scale-90"
            >
              <ChevronRight className="h-4 w-4 rtl:rotate-180" />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => persist(avatar, false, onComplete)}
          disabled={saving !== null}
          className="flex h-12 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-sm font-bold text-[#1a0f0a] shadow-[0_8px_30px_rgba(240,184,96,0.35)] transition hover:brightness-105 active:scale-95 disabled:opacity-50"
        >
          {saving === 'save' ? '…' : t('avatarSave')}
        </button>
        <button
          type="button"
          onClick={() => persist(DEFAULT_AVATAR, true, onComplete)}
          disabled={saving !== null}
          className="h-11 rounded-full border border-white/12 bg-white/5 text-sm font-medium text-white/80 transition hover:bg-white/10 active:scale-95 disabled:opacity-50"
        >
          {saving === 'default' ? '…' : t('avatarUseDefault')}
        </button>
      </div>

      <OnboardingNav onBack={onBack} onSkip={onSkip} hideContinue />
    </div>
  );
}
