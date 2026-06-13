'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Bell, Mail, Megaphone, MessageSquare, AtSign, Users, Volume2, Smartphone } from 'lucide-react';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsSectionLabel, SettingsToggleRow } from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { pushNotificationsHint, marketingHint } from '@/lib/settings-hints';
import { subscribeToPush, unsubscribeFromPush } from '@/lib/push';
import { Skeleton } from '@/components/ui/skeleton';

function NotificationPreview({ sound, vibration }: { sound: boolean; vibration: boolean }) {
  const t = useTranslations('settings');
  return (
    <div className="border-b border-border/80 bg-card px-4 py-4">
      <p className="text-xs font-medium uppercase text-muted-foreground">{t('preview')}</p>
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
  const { locale } = useParams<{ locale: string }>();
  const { settings, isLoading, update } = useSettingsApi();

  // Drive the real browser push subscription from the toggle. On enable we
  // request permission + register the device; the saved preference only flips
  // on once a subscription actually exists.
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const subscribed = await subscribeToPush(locale);
      update({ pushNotifications: subscribed });
    } else {
      await unsubscribeFromPush(locale);
      update({ pushNotifications: false });
    }
  };

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
          icon={<Bell className="size-5" />}
          label={t('items.push')}
          description={pushNotificationsHint(t, settings.pushNotifications)}
          checked={settings.pushNotifications}
          onCheckedChange={(v) => handlePushToggle(v)}
        />
        <SettingsToggleRow
          icon={<Mail className="size-5" />}
          label={t('items.emailNotifications')}
          description={t('items.emailNotificationsDesc')}
          checked={settings.emailNotifications}
          onCheckedChange={(v) => update({ emailNotifications: v })}
        />
        <SettingsToggleRow
          icon={<Megaphone className="size-5" />}
          label={t('items.marketing')}
          description={marketingHint(t, settings.marketingNotifications)}
          checked={settings.marketingNotifications}
          onCheckedChange={(v) => update({ marketingNotifications: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('activity')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          icon={<MessageSquare className="size-5" />}
          label={t('items.messageNotifications')}
          description={
            settings.messageNotifications
              ? t('items.messageNotificationsDesc')
              : t('hints.messageNotificationsOff')
          }
          checked={settings.messageNotifications}
          onCheckedChange={(v) => update({ messageNotifications: v })}
        />
        <SettingsToggleRow
          icon={<AtSign className="size-5" />}
          label={t('items.mentionNotifications')}
          description={
            settings.mentionNotifications
              ? t('items.mentionNotificationsDesc')
              : t('hints.mentionNotificationsOff')
          }
          checked={settings.mentionNotifications}
          onCheckedChange={(v) => update({ mentionNotifications: v })}
        />
        <SettingsToggleRow
          icon={<Users className="size-5" />}
          label={t('items.groupNotifications')}
          description={
            settings.groupNotifications ? t('items.groupNotificationsDesc') : t('hints.groupNotificationsOff')
          }
          checked={settings.groupNotifications}
          onCheckedChange={(v) => update({ groupNotifications: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('alerts')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          icon={<Volume2 className="size-5" />}
          label={t('items.sound')}
          description={settings.notificationSound ? t('items.soundDesc') : t('hints.soundOff')}
          checked={settings.notificationSound}
          onCheckedChange={(v) => update({ notificationSound: v })}
        />
        <SettingsToggleRow
          icon={<Smartphone className="size-5" />}
          label={t('items.vibration')}
          description={settings.notificationVibration ? t('items.vibrationDesc') : t('hints.vibrationOff')}
          checked={settings.notificationVibration}
          onCheckedChange={(v) => update({ notificationVibration: v })}
        />
      </SettingsList>
    </SettingsScreen>
  );
}
