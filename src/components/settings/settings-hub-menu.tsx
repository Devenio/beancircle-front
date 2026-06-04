'use client';

import { useTranslations } from 'next-intl';
import { SETTINGS_HUB_GROUPS } from '@/components/settings/settings-registry';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';

export function SettingsHubMenu() {
  const t = useTranslations('settings');

  return (
    <div className="pb-6">
      {SETTINGS_HUB_GROUPS.map((group) => (
        <section key={group.id}>
          <SettingsSectionLabel>{t(group.labelKey)}</SettingsSectionLabel>
          <SettingsList>
            {group.items.map((item) => (
              <SettingsRow key={item.id} href={item.href} label={t(item.labelKey)} />
            ))}
          </SettingsList>
        </section>
      ))}
    </div>
  );
}
