'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { LazyMotion, domAnimation, m, useReducedMotion } from 'framer-motion';
import { Check } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useAuthStore } from '@/stores/auth-store';
import { StepFrame } from '../step-frame';
import { OnboardingNav } from '../onboarding-nav';
import type { StepProps } from '../types';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type City = { id: string; name: string };

export function ProfileStep({ onComplete, onSkip, onBack, locale }: StepProps) {
  const t = useTranslations('onboarding');
  const reduce = useReducedMotion();
  const { user, setUser } = useAuthStore();

  const [bio, setBio] = useState('');
  const [favoriteCoffee, setFavoriteCoffee] = useState('');
  const [website, setWebsite] = useState('');
  const [social, setSocial] = useState('');
  const [cityId, setCityId] = useState('');
  const [cities, setCities] = useState<City[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<City[]>('/users/cities', { locale })
      .then((c) => setCities(Array.isArray(c) ? c : []))
      .catch(() => setCities([]));
  }, [locale]);

  const fields = [bio, favoriteCoffee, website || social, cityId];
  const percent = useMemo(
    () => Math.round((fields.filter(Boolean).length / fields.length) * 100),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [bio, favoriteCoffee, website, social, cityId],
  );

  async function save() {
    setSaving(true);
    const body: Record<string, unknown> = {};
    if (bio) body.bio = bio;
    if (favoriteCoffee) body.favoriteCoffee = favoriteCoffee;
    if (website) body.website = website;
    if (social) body.socialLinks = { primary: social };
    if (cityId) body.cityId = cityId;
    try {
      const updated = await api('/users/me', {
        method: 'PATCH',
        body: JSON.stringify(body),
        locale,
      });
      if (user) setUser({ ...user, ...(updated as object) } as never);
    } catch {
      /* non-blocking */
    }
    setSaving(false);
    onComplete();
  }

  const inputCls =
    'h-12 w-full rounded-xl border border-white/12 bg-white/5 px-3.5 text-sm text-white placeholder:text-white/40 outline-none transition focus:border-amber-400/70 focus:ring-2 focus:ring-amber-400/10';

  const benefits = [t('profileBenefit1'), t('profileBenefit2'), t('profileBenefit3')];

  return (
    <StepFrame
      title={t('profileTitle')}
      subtitle={t('profileSubtitle')}
      nav={
        <OnboardingNav
          onBack={onBack}
          onSkip={onSkip}
          onContinue={save}
          continueLabel={t('profileSave')}
          continueLoading={saving}
        />
      }
    >
      <LazyMotion features={domAnimation} strict>
        {/* completion bar */}
        <div className="mb-4">
          <div className="mb-1 flex items-center justify-between text-xs text-white/55">
            <span>{t('profileCompletion', { percent })}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <m.div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500"
              initial={false}
              animate={{ width: `${percent}%` }}
              transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 200, damping: 26 }}
            />
          </div>
        </div>

        <div className="space-y-2.5">
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={t('profileBioPlaceholder')}
            rows={2}
            maxLength={300}
            className={`${inputCls} h-auto resize-none py-2.5`}
          />
          <input
            value={favoriteCoffee}
            onChange={(e) => setFavoriteCoffee(e.target.value)}
            placeholder={t('profileFavoriteCoffeePlaceholder')}
            className={inputCls}
          />
          {cities.length > 0 && (
            <Select value={cityId || undefined} onValueChange={(v) => v && setCityId(v)}>
              <SelectTrigger className="h-12 w-full rounded-xl border border-white/12 bg-white/5 px-3.5 text-sm text-white focus-visible:border-amber-400/70 focus-visible:ring-2 focus-visible:ring-amber-400/10 data-popup-open:border-amber-400/70 data-popup-open:ring-2 data-popup-open:ring-amber-400/10">
                <SelectValue placeholder={t('profileLocation')} />
              </SelectTrigger>
              <SelectContent>
                {cities.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <input
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder={t('profileWebsite')}
            dir="ltr"
            className={inputCls}
          />
          <input
            value={social}
            onChange={(e) => setSocial(e.target.value)}
            placeholder={t('profileSocial')}
            dir="ltr"
            className={inputCls}
          />
        </div>

        <ul className="mt-3 space-y-1.5">
          {benefits.map((b) => (
            <li key={b} className="flex items-center gap-2 text-xs text-white/60">
              <Check className="h-3.5 w-3.5 text-amber-400" strokeWidth={3} />
              {b}
            </li>
          ))}
        </ul>
      </LazyMotion>
    </StepFrame>
  );
}
