'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Flag, Headphones, Mail, Scale, Shield } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';

export default function SettingsSupportPage() {
  const t = useTranslations('settings');

  return (
    <SettingsPageWrap title={t('sections.support')} description={t('sections.supportDesc')}>
      <SettingsGroup>
        <SettingsRow
          icon={<BookOpen className="size-5" />}
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
          icon={<Headphones className="size-5" />}
          label={t('items.contactSupport')}
          description={t('items.contactSupportDesc')}
          href="mailto:support@beancircle.app"
        />
      </SettingsGroup>

      <SettingsGroup title={t('legal')}>
        <SettingsRow
          icon={<Shield className="size-5" />}
          label={t('items.privacyPolicy')}
          description={t('items.privacyPolicyDesc')}
          href="https://beancircle.app/privacy"
        />
        <SettingsRow
          icon={<Scale className="size-5" />}
          label={t('items.terms')}
          description={t('items.termsDesc')}
          href="https://beancircle.app/terms"
        />
        <SettingsRow
          icon={<Mail className="size-5" />}
          label={t('items.contactSupport')}
          description="support@beancircle.app"
          href="mailto:support@beancircle.app"
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
