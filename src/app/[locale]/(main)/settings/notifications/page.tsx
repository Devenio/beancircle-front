'use client';

import { useTranslations } from 'next-intl';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsSectionLabel, SettingsToggleRow } from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { Skeleton } from '@/components/ui/skeleton';
function NotificationPreview({ sound, vibration }: { sound: boolean; vibration: boolean }) {
  const t = useTranslations('settings');
  return (
    <div className="border-b border-border/80 bg-card px-4 py-4">
      <p className="text-xs font-medium text-muted-foreground uppercase">{t('preview')}</p>
      <p className="mt-2 text-[15px] font-medium">{t('previewTitle')}</p>
      <p className="text-sm text-muted-foreground">{t('previewBody')}</p>
      <p className="mt-2 text-xs text-muted-foreground">
        {sound ? t('soundOn') : t('soundOff')} · {vibration ? t('vibrationOn') : t('vibrationOff')}
      </p>
    </div>
  );
}

export default function SettingsNotificationsPage() {
  const t = useTranslations('settings');
  const { settings, isLoading, update } = useSettingsApi();

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.notifications')}>
        <Skeleton className="h-48 w-full" />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen title={t('sections.notifications')}>
      <NotificationPreview sound={settings.notificationSound} vibration={settings.notificationVibration} />

      <SettingsSectionLabel>{t('channels')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.push')}
          description={t('items.pushDesc')}
          checked={settings.pushNotifications}
          onCheckedChange={(v) => update({ pushNotifications: v })}
        />
        <SettingsToggleRow
          label={t('items.emailNotifications')}
          description={t('items.emailNotificationsDesc')}
          checked={settings.emailNotifications}
          onCheckedChange={(v) => update({ emailNotifications: v })}
        />
        <SettingsToggleRow
          label={t('items.marketing')}
          description={t('items.marketingDesc')}
          checked={settings.marketingNotifications}
          onCheckedChange={(v) => update({ marketingNotifications: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('activity')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.messageNotifications')}
          checked={settings.messageNotifications}
          onCheckedChange={(v) => update({ messageNotifications: v })}
        />
        <SettingsToggleRow
          label={t('items.mentionNotifications')}
          checked={settings.mentionNotifications}
          onCheckedChange={(v) => update({ mentionNotifications: v })}
        />
        <SettingsToggleRow
          label={t('items.groupNotifications')}
          checked={settings.groupNotifications}
          onCheckedChange={(v) => update({ groupNotifications: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('alerts')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.sound')}
          checked={settings.notificationSound}
          onCheckedChange={(v) => update({ notificationSound: v })}
        />
        <SettingsToggleRow
          label={t('items.vibration')}
          checked={settings.notificationVibration}
          onCheckedChange={(v) => update({ notificationVibration: v })}
        />
      </SettingsList>
    </SettingsScreen>
  );
}
