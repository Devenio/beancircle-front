'use client';

import { useTranslations } from 'next-intl';
import { Coffee, FileCode, Sparkles } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';

const APP_VERSION = '0.1.0';

export default function SettingsAboutPage() {
  const t = useTranslations('settings');

  return (
    <SettingsPageWrap title={t('sections.about')} description={t('sections.aboutDesc')}>
      <div className="flex flex-col items-center rounded-2xl border border-border/60 bg-card py-10 text-center">
        <span className="flex size-16 items-center justify-center rounded-2xl bg-primary/15">
          <Coffee className="size-8 text-primary" />
        </span>
        <h2 className="mt-4 text-lg font-bold">BeanCircle</h2>
        <p className="text-sm text-muted-foreground">
          {t('version', { version: APP_VERSION })}
        </p>
      </div>

      <SettingsGroup>
        <SettingsRow
          icon={<Sparkles className="size-5" />}
          label={t('items.releaseNotes')}
          description={t('items.releaseNotesDesc')}
          href="https://beancircle.app/changelog"
        />
        <SettingsRow
          icon={<FileCode className="size-5" />}
          label={t('items.licenses')}
          description={t('items.licensesDesc')}
          href="https://beancircle.app/licenses"
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
