'use client';

import { useTranslations } from 'next-intl';
import { Bell, BellRing, Mail, Megaphone, MessageSquare, Users, Volume2, Vibrate } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsToggleRow } from '@/components/settings/settings-row';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

function NotificationPreview({ sound, vibration }: { sound: boolean; vibration: boolean }) {
  const t = useTranslations('settings');
  return (
    <div
      className={cn(
        'rounded-2xl border border-border/60 bg-card p-4 transition-all',
        sound && 'ring-2 ring-primary/30',
      )}
      aria-live="polite"
    >
      <p className="text-xs font-medium text-muted-foreground uppercase">{t('preview')}</p>
      <div className="mt-2 flex items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-full bg-primary/15">
          <BellRing className="size-5 text-primary" />
        </span>
        <div>
          <p className="text-sm font-semibold">{t('previewTitle')}</p>
          <p className="text-xs text-muted-foreground">{t('previewBody')}</p>
          <p className="mt-2 text-[10px] text-muted-foreground">
            {sound ? t('soundOn') : t('soundOff')} · {vibration ? t('vibrationOn') : t('vibrationOff')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function SettingsNotificationsPage() {
  const t = useTranslations('settings');
  const store = useSettingsStore();

  return (
    <SettingsPageWrap title={t('sections.notifications')} description={t('sections.notificationsDesc')}>
      <NotificationPreview sound={store.notificationSound} vibration={store.notificationVibration} />

      <SettingsGroup title={t('channels')}>
        <SettingsToggleRow
          icon={<Bell className="size-5" />}
          label={t('items.push')}
          description={t('items.pushDesc')}
          checked={store.pushNotifications}
          onCheckedChange={(v) => store.set('pushNotifications', v)}
        />
        <SettingsToggleRow
          icon={<Mail className="size-5" />}
          label={t('items.emailNotifications')}
          description={t('items.emailNotificationsDesc')}
          checked={store.emailNotifications}
          onCheckedChange={(v) => store.set('emailNotifications', v)}
        />
        <SettingsToggleRow
          icon={<Megaphone className="size-5" />}
          label={t('items.marketing')}
          description={t('items.marketingDesc')}
          checked={store.marketingNotifications}
          onCheckedChange={(v) => store.set('marketingNotifications', v)}
        />
      </SettingsGroup>

      <SettingsGroup title={t('activity')}>
        <SettingsToggleRow
          icon={<MessageSquare className="size-5" />}
          label={t('items.messageNotifications')}
          description={t('items.messageNotificationsDesc')}
          checked={store.messageNotifications}
          onCheckedChange={(v) => store.set('messageNotifications', v)}
        />
        <SettingsToggleRow
          icon={<Bell className="size-5" />}
          label={t('items.mentionNotifications')}
          description={t('items.mentionNotificationsDesc')}
          checked={store.mentionNotifications}
          onCheckedChange={(v) => store.set('mentionNotifications', v)}
        />
        <SettingsToggleRow
          icon={<Users className="size-5" />}
          label={t('items.groupNotifications')}
          description={t('items.groupNotificationsDesc')}
          checked={store.groupNotifications}
          onCheckedChange={(v) => store.set('groupNotifications', v)}
        />
      </SettingsGroup>

      <SettingsGroup title={t('alerts')}>
        <SettingsToggleRow
          icon={<Volume2 className="size-5" />}
          label={t('items.sound')}
          description={t('items.soundDesc')}
          checked={store.notificationSound}
          onCheckedChange={(v) => store.set('notificationSound', v)}
        />
        <SettingsToggleRow
          icon={<Vibrate className="size-5" />}
          label={t('items.vibration')}
          description={t('items.vibrationDesc')}
          checked={store.notificationVibration}
          onCheckedChange={(v) => store.set('notificationVibration', v)}
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
