'use client';

import { useTranslations } from 'next-intl';
import { Download } from 'lucide-react';
import { SettingsRow } from '@/components/settings/settings-row';
import { useRouter } from '@/i18n/navigation';
import { useInstallState } from '@/hooks/use-pwa';
import { trackPwaEvent } from '@/lib/pwa/analytics';
import { haptic } from '@/lib/mobile/haptics';

/**
 * Settings/profile list row that promotes installing the app. Triggers the
 * native prompt where available, otherwise opens the /install instructions.
 * Renders nothing once the app is installed.
 */
export function InstallCtaRow({ source }: { source: string }) {
  const t = useTranslations('pwa');
  const router = useRouter();
  const { canPrompt, isInstalled, mounted, promptInstall } = useInstallState();

  if (!mounted || isInstalled) return null;

  async function handleClick() {
    haptic('light');
    trackPwaEvent('install_button_click', { source });
    if (canPrompt) {
      const outcome = await promptInstall();
      if (outcome !== 'unavailable') return;
    }
    router.push('/install');
  }

  return (
    <SettingsRow
      icon={<Download className="size-5" />}
      label={t('cta.title')}
      description={t('cta.subtitle')}
      onClick={handleClick}
    />
  );
}
