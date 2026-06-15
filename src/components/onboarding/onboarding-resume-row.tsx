'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Coffee } from 'lucide-react';
import { SettingsList, SettingsRow } from '@/components/settings/settings-row';
import { getOnboarding } from '@/lib/api/onboarding';

/**
 * "Finish setting up your circle" entry for the Settings hub. Renders only when
 * onboarding isn't complete yet, so users can resume the skippable activation
 * flow at any time (deep-links to /onboarding?resume=1).
 */
export function OnboardingResumeRow({ locale }: { locale: string }) {
  const t = useTranslations('onboarding');
  const [show, setShow] = useState(false);
  const [percent, setPercent] = useState<number | null>(null);

  useEffect(() => {
    getOnboarding(locale)
      .then((s) => {
        if (!s.progress.completedAt) {
          setShow(true);
          setPercent(s.completion.percent);
        }
      })
      .catch(() => {});
  }, [locale]);

  if (!show) return null;

  const description =
    percent !== null ? `${t('profileCompletion', { percent })} · ${t('settingsDesc')}` : t('settingsDesc');

  return (
    <SettingsList className="mt-2">
      <SettingsRow
        label={t('settingsTitle')}
        description={description}
        href="/onboarding?resume=1"
        icon={<Coffee className="size-5" />}
      />
    </SettingsList>
  );
}
