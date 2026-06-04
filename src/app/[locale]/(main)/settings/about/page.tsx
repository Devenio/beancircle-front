'use client';

import { useTranslations } from 'next-intl';
import { Coffee } from 'lucide-react';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow } from '@/components/settings/settings-row';

const APP_VERSION = '0.1.0';

export default function SettingsAboutPage() {
  const t = useTranslations('settings');

  return (
    <SettingsScreen title={t('sections.about')}>
      <div className="flex flex-col items-center bg-card py-10">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-muted">
          <Coffee className="size-8 text-foreground" />
        </span>
        <p className="mt-3 text-lg font-semibold">BeanCircle</p>
        <p className="text-sm text-muted-foreground">{t('version', { version: APP_VERSION })}</p>
      </div>

      <SettingsList className="mt-0 border-t-0">
        <SettingsRow label={t('items.releaseNotes')} href="https://beancircle.app/changelog" />
        <SettingsRow label={t('items.licenses')} href="https://beancircle.app/licenses" />
      </SettingsList>
    </SettingsScreen>
  );
}
