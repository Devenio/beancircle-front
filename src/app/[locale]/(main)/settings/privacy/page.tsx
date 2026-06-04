'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel, SettingsToggleRow } from '@/components/settings/settings-row';
import { SettingsVisibilityPicker } from '@/components/settings/settings-visibility-picker';
import { useBlockedUsers, useMutedUsers, useSettingsApi } from '@/hooks/use-settings-api';
import { ProfileAvatar } from '@/components/chat/user-avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { VisibilityOption } from '@/stores/settings-store';

export default function SettingsPrivacyPage() {
  const t = useTranslations('settings');
  const { locale } = useParams<{ locale: string }>();
  const { settings, isLoading, update } = useSettingsApi();
  const blocked = useBlockedUsers();
  const muted = useMutedUsers();
  const qc = useQueryClient();

  const unblock = useMutation({
    mutationFn: (userId: string) => api(`/users/${userId}/block`, { method: 'DELETE', locale }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings-blocked'] }),
  });

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.privacy')}>
        <Skeleton className="h-40 w-full" />
      </SettingsScreen>
    );
  }

  const setVisibility = (
    key: 'lastSeenVisibility' | 'onlineStatusVisibility' | 'profileVisibility',
    v: VisibilityOption,
  ) => update({ [key]: v });

  return (
    <SettingsScreen title={t('sections.privacy')}>
      <p className="px-4 pt-3 pb-1 text-xs leading-relaxed text-muted-foreground">{t('privacyCenterHint')}</p>

      <SettingsSectionLabel>{t('whoCanSee')}</SettingsSectionLabel>
      <SettingsList>
        <div>
          <SettingsRow label={t('items.lastSeen')} showChevron={false} />
          <SettingsVisibilityPicker
            value={settings.lastSeenVisibility}
            onChange={(v) => setVisibility('lastSeenVisibility', v)}
          />
        </div>
        <div>
          <SettingsRow label={t('items.onlineStatus')} showChevron={false} />
          <SettingsVisibilityPicker
            value={settings.onlineStatusVisibility}
            onChange={(v) => setVisibility('onlineStatusVisibility', v)}
          />
        </div>
        <div>
          <SettingsRow label={t('items.profileVisibility')} showChevron={false} />
          <SettingsVisibilityPicker
            value={settings.profileVisibility}
            onChange={(v) => setVisibility('profileVisibility', v)}
          />
        </div>
      </SettingsList>

      <SettingsSectionLabel>{t('messaging')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.readReceipts')}
          description={t('items.readReceiptsDesc')}
          checked={settings.readReceipts}
          onCheckedChange={(v) => update({ readReceipts: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('people')}</SettingsSectionLabel>
      <SettingsList>
        {blocked.isLoading ? (
          <Skeleton className="m-4 h-12 rounded-lg" />
        ) : blocked.data?.length ? (
          blocked.data.map((u) => (
            <div key={u.id} className="flex min-h-[52px] items-center gap-3 px-4 py-2">
              <ProfileAvatar src={u.avatarUrl} name={u.name ?? u.username} className="size-10" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px]">{u.name ?? u.username}</p>
                {u.username ? <p className="text-xs text-muted-foreground">@{u.username}</p> : null}
              </div>
              <button
                type="button"
                className="text-sm font-medium text-primary"
                onClick={() => unblock.mutate(u.id)}
              >
                {t('unblock')}
              </button>
            </div>
          ))
        ) : (
          <SettingsRow label={t('empty.blockedTitle')} description={t('empty.blockedBody')} showChevron={false} />
        )}
      </SettingsList>

      <SettingsSectionLabel>{t('items.muted')}</SettingsSectionLabel>
      <SettingsList>
        {muted.isLoading ? (
          <Skeleton className="m-4 h-12 rounded-lg" />
        ) : muted.data?.length ? (
          muted.data.map((u) => (
            <SettingsRow
              key={u.id}
              href={`/messages/${u.conversationId}`}
              label={u.name ?? u.username ?? ''}
              value={u.username ? `@${u.username}` : undefined}
            />
          ))
        ) : (
          <SettingsRow label={t('empty.mutedTitle')} description={t('empty.mutedBody')} showChevron={false} />
        )}
        <SettingsRow label={t('items.reporting')} href="/settings/support" />
      </SettingsList>
    </SettingsScreen>
  );
}
