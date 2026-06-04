'use client';

import { useTranslations } from 'next-intl';
import { Ban, Eye, EyeOff, ShieldAlert, UserX, VolumeX } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow, SettingsToggleRow } from '@/components/settings/settings-row';
import { SettingsVisibilityPicker } from '@/components/settings/settings-visibility-picker';
import { useSettingsStore } from '@/stores/settings-store';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';

export default function SettingsPrivacyPage() {
  const t = useTranslations('settings');
  const store = useSettingsStore();

  return (
    <SettingsPageWrap title={t('sections.privacy')} description={t('privacyCenterDesc')}>
      <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
        <p className="text-sm leading-relaxed text-muted-foreground">{t('privacyCenterHint')}</p>
      </div>

      <SettingsGroup title={t('whoCanSee')}>
        <SettingsRow
          icon={<Eye className="size-5" />}
          label={t('items.lastSeen')}
          description={t('items.lastSeenDesc')}
        />
        <SettingsVisibilityPicker
          value={store.lastSeenVisibility}
          onChange={(v) => store.set('lastSeenVisibility', v)}
        />
        <SettingsRow
          icon={<EyeOff className="size-5" />}
          label={t('items.onlineStatus')}
          description={t('items.onlineStatusDesc')}
        />
        <SettingsVisibilityPicker
          value={store.onlineStatusVisibility}
          onChange={(v) => store.set('onlineStatusVisibility', v)}
        />
        <SettingsRow
          icon={<ShieldAlert className="size-5" />}
          label={t('items.profileVisibility')}
          description={t('items.profileVisibilityDesc')}
        />
        <SettingsVisibilityPicker
          value={store.profileVisibility}
          onChange={(v) => store.set('profileVisibility', v)}
        />
      </SettingsGroup>

      <SettingsGroup title={t('messaging')}>
        <SettingsToggleRow
          icon={<Eye className="size-5" />}
          label={t('items.readReceipts')}
          description={t('items.readReceiptsDesc')}
          checked={store.readReceipts}
          onCheckedChange={(v) => store.set('readReceipts', v)}
        />
      </SettingsGroup>

      <SettingsGroup title={t('people')}>
        <SettingsRow
          icon={<Ban className="size-5" />}
          label={t('items.blocked')}
          description={t('items.blockedDesc')}
        />
        <Empty className="border-0 py-8">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <UserX className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t('empty.blockedTitle')}</EmptyTitle>
            <EmptyDescription>{t('empty.blockedBody')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <SettingsRow
          icon={<VolumeX className="size-5" />}
          label={t('items.muted')}
          description={t('items.mutedDesc')}
        />
        <Empty className="border-0 py-6">
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <VolumeX className="size-5" />
            </EmptyMedia>
            <EmptyTitle>{t('empty.mutedTitle')}</EmptyTitle>
            <EmptyDescription>{t('empty.mutedBody')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
        <SettingsRow
          icon={<ShieldAlert className="size-5" />}
          label={t('items.reporting')}
          description={t('items.reportingDesc')}
          href="/settings/support"
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
