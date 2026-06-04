'use client';

import { useTranslations } from 'next-intl';
import { Coffee, FileText, Scale } from 'lucide-react';
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
        <p className="mt-2 max-w-xs px-6 text-center text-xs text-muted-foreground">{t('sections.aboutDesc')}</p>
      </div>

      <SettingsList className="mt-0 border-t-0">
        <SettingsRow
          icon={<FileText className="size-5" />}
          label={t('items.releaseNotes')}
          description={t('items.releaseNotesDesc')}
          href="https://beancircle.app/changelog"
        />
        <SettingsRow
          icon={<Scale className="size-5" />}
          label={t('items.licenses')}
          description={t('items.licensesDesc')}
          href="https://beancircle.app/licenses"
        />
      </SettingsList>
    </SettingsScreen>
  );
}
