'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  AnimatePresence,
  LazyMotion,
  domAnimation,
  m,
  useReducedMotion,
} from 'framer-motion';
import { Check, UserPlus, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useOnboardingStore } from '@/stores/onboarding-store';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';

type Suggestion = {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string | null;
  sharedInterests?: string[];
  reason?: string;
  lastActive?: string;
};

export function CircleStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const { markFollowed, followedIds } = useOnboardingStore();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [i, setI] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ items: Suggestion[] }>('/discover/suggestions', { locale })
      .then((r) => setItems(r.items ?? []))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [locale]);

  const current = items[i];
  const remaining = items.length - i;

  function decide(follow: boolean) {
    if (current && follow) {
      markFollowed(current.id);
      void api(`/users/${current.id}/follow`, { method: 'POST', locale }).catch(() => {});
    }
    setI((n) => n + 1);
  }

  const exhausted = !loading && (items.length === 0 || remaining <= 0);

  return (
    <StepFrame
      title={t('circleTitle')}
      subtitle={t('circleSubtitle')}
      nav={
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          onContinue={onComplete}
          continueLabel={followedIds.length ? t('continue') : t('skip')}
        />
      }
    >
      <LazyMotion features={domAnimation} strict>
        <div className="relative flex h-[19rem] items-center justify-center">
          {loading && <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-amber-400" />}

          {exhausted && (
            <p className="px-6 text-center text-sm text-white/55">
              {items.length === 0 ? t('circleEmpty') : t('circleSwipeHint')}
            </p>
          )}

          <AnimatePresence>
            {current && (
              <m.div
                key={current.id}
                drag={reduce ? false : 'x'}
                dragConstraints={{ left: 0, right: 0 }}
                onDragEnd={(_, info) => {
                  if (info.offset.x > 90) decide(true);
                  else if (info.offset.x < -90) decide(false);
                }}
                initial={reduce ? false : { scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{
                  x: followedIds.includes(current.id) ? 240 : -240,
                  opacity: 0,
                  rotate: followedIds.includes(current.id) ? 12 : -12,
                }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                className="absolute w-64 cursor-grab overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-br from-white/15 to-white/5 p-5 text-center shadow-[0_20px_60px_rgba(0,0,0,0.45)] backdrop-blur-xl active:cursor-grabbing"
              >
                <div className="mx-auto mb-3 w-fit">
                  <ProfileAvatar src={current.avatarUrl} name={current.name} className="size-[72px]" />
                </div>
                <p className="text-lg font-bold">{current.name}</p>
                <p className="text-sm text-white/50">@{current.username}</p>
                {current.lastActive && (
                  <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2 py-0.5 text-[11px] font-medium text-emerald-300">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    {t('circleActive')}
                  </span>
                )}
                {!!current.sharedInterests?.length && (
                  <p className="mt-2 text-xs text-amber-300/80">
                    {t('circleShared', { count: current.sharedInterests.length })}
                  </p>
                )}
              </m.div>
            )}
          </AnimatePresence>
        </div>

        {current && (
          <div className="mt-1 flex items-center justify-center gap-5">
            <button
              type="button"
              aria-label={t('circleIgnore')}
              onClick={() => decide(false)}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition hover:bg-white/10 active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              aria-label={t('circleFollow')}
              onClick={() => decide(true)}
              className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-[#1a0f0a] shadow-[0_8px_30px_rgba(240,184,96,0.4)] transition hover:brightness-105 active:scale-90"
            >
              <UserPlus className="h-6 w-6" />
            </button>
          </div>
        )}

        {followedIds.length > 0 && (
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-300">
            <Check className="h-3.5 w-3.5" /> {t('circleFollowing')} · {followedIds.length}
          </p>
        )}
      </LazyMotion>
    </StepFrame>
  );
}
