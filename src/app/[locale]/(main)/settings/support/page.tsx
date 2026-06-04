'use client';

import { useTranslations } from 'next-intl';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';

export default function SettingsSupportPage() {
  const t = useTranslations('settings');

  return (
    <SettingsScreen title={t('sections.help')}>
      <SettingsList>
        <SettingsRow label={t('items.helpCenter')} href="https://beancircle.app/help" />
        <SettingsRow label={t('items.reportIssue')} href="/settings/support" />
        <SettingsRow label={t('items.contactSupport')} href="mailto:support@beancircle.app" />
      </SettingsList>

      <SettingsSectionLabel>{t('legal')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow label={t('items.privacyPolicy')} href="https://beancircle.app/privacy" />
        <SettingsRow label={t('items.terms')} href="https://beancircle.app/terms" />
      </SettingsList>
    </SettingsScreen>
  );
}
