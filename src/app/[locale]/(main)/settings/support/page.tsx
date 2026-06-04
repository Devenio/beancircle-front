'use client';

import { useTranslations } from 'next-intl';
import { CircleHelp, Flag, Mail, Shield } from 'lucide-react';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';

export default function SettingsSupportPage() {
  const t = useTranslations('settings');

  return (
    <SettingsScreen title={t('sections.help')}>
      <p className="px-4 pt-3 pb-1 text-xs leading-relaxed text-muted-foreground">{t('sections.helpDesc')}</p>
      <SettingsList>
        <SettingsRow
          icon={<CircleHelp className="size-5" />}
          label={t('items.helpCenter')}
          description={t('items.helpCenterDesc')}
          href="https://beancircle.app/help"
        />
        <SettingsRow
          icon={<Flag className="size-5" />}
          label={t('items.reportIssue')}
          description={t('items.reportIssueDesc')}
          href="/settings/support"
        />
        <SettingsRow
          icon={<Mail className="size-5" />}
          label={t('items.contactSupport')}
          description={t('items.contactSupportDesc')}
          href="mailto:support@beancircle.app"
        />
      </SettingsList>

      <SettingsSectionLabel>{t('legal')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow
          icon={<Shield className="size-5" />}
          label={t('items.privacyPolicy')}
          description={t('items.privacyPolicyDesc')}
          href="https://beancircle.app/privacy"
        />
        <SettingsRow
          label={t('items.terms')}
          description={t('items.termsDesc')}
          href="https://beancircle.app/terms"
        />
      </SettingsList>
    </SettingsScreen>
  );
}
