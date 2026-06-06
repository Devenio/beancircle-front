'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { Clock, Eye, ShieldBan, UserCircle } from 'lucide-react';
import { api } from '@/lib/api/client';
import { SettingsScreen } from '@/components/settings/settings-shell';
import {
  SettingsFieldHeader,
  SettingsLearnMore,
  SettingsList,
  SettingsRow,
  SettingsSectionLabel,
  SettingsToggleRow,
} from '@/components/settings/settings-row';
import { SettingsVisibilityPicker } from '@/components/settings/settings-visibility-picker';
import { SettingsOptionPicker } from '@/components/settings/settings-option-picker';
import { useBlockedUsers, useMutedUsers, useSettingsApi, type SettingsApiData } from '@/hooks/use-settings-api';
import { visibilityActiveHint, readReceiptsHint } from '@/lib/settings-hints';
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
          <SettingsFieldHeader
            icon={<Clock className="size-5" />}
            label={t('items.lastSeen')}
            description={visibilityActiveHint(t, 'lastSeen', settings.lastSeenVisibility)}
            learnMore={
              <SettingsLearnMore label={t('learnMore')}>{t('learnMoreCopy.visibility')}</SettingsLearnMore>
            }
          />
          <SettingsVisibilityPicker
            value={settings.lastSeenVisibility}
            onChange={(v) => setVisibility('lastSeenVisibility', v)}
          />
        </div>
        <div>
          <SettingsFieldHeader
            icon={<Eye className="size-5" />}
            label={t('items.onlineStatus')}
            description={visibilityActiveHint(t, 'onlineStatus', settings.onlineStatusVisibility)}
          />
          <SettingsVisibilityPicker
            value={settings.onlineStatusVisibility}
            onChange={(v) => setVisibility('onlineStatusVisibility', v)}
          />
        </div>
        <div>
          <SettingsFieldHeader
            icon={<UserCircle className="size-5" />}
            label={t('items.profileVisibility')}
            description={visibilityActiveHint(t, 'profileVisibility', settings.profileVisibility)}
          />
          <SettingsVisibilityPicker
            value={settings.profileVisibility}
            onChange={(v) => setVisibility('profileVisibility', v)}
          />
        </div>
      </SettingsList>

      <SettingsSectionLabel>{t('discoverPrivacy')}</SettingsSectionLabel>
      <SettingsList>
        <div>
          <SettingsFieldHeader
            icon={<Eye className="size-5" />}
            label={t('items.locationVisibility')}
            description={t('items.locationVisibilityDesc')}
          />
          <SettingsOptionPicker
            value={settings.locationVisibility}
            onChange={(v) =>
              update({
                locationVisibility: v as SettingsApiData['locationVisibility'],
              })
            }
            options={[
              { value: 'exact', label: t('location.exact') },
              { value: 'approximate', label: t('location.approximate') },
              { value: 'city', label: t('location.city') },
              { value: 'hidden', label: t('location.hidden') },
            ]}
          />
        </div>
        <div>
          <SettingsFieldHeader
            icon={<UserCircle className="size-5" />}
            label={t('items.discoveryVisibility')}
            description={t('items.discoveryVisibilityDesc')}
          />
          <SettingsOptionPicker
            value={settings.discoveryVisibility}
            onChange={(v) =>
              update({
                discoveryVisibility: v as SettingsApiData['discoveryVisibility'],
              })
            }
            options={[
              { value: 'everyone', label: t('discovery.everyone') },
              { value: 'friends_of_friends', label: t('discovery.friendsOfFriends') },
              { value: 'hidden', label: t('discovery.hidden') },
            ]}
          />
        </div>
        <SettingsToggleRow
          label={t('items.showOnlineStatus')}
          description={t('items.showOnlineStatusDesc')}
          checked={settings.showOnlineStatus}
          onCheckedChange={(v) => update({ showOnlineStatus: v })}
        />
      </SettingsList>

      <SettingsSectionLabel>{t('messaging')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.readReceipts')}
          description={readReceiptsHint(t, settings.readReceipts)}
          checked={settings.readReceipts}
          onCheckedChange={(v) => update({ readReceipts: v })}
          learnMore={
            <SettingsLearnMore label={t('learnMore')}>{t('learnMoreCopy.readReceipts')}</SettingsLearnMore>
          }
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
                className="text-end text-sm font-medium text-primary"
                onClick={() => unblock.mutate(u.id)}
                title={t('unblockHint')}
              >
                {t('unblock')}
              </button>
            </div>
          ))
        ) : (
          <SettingsRow
            label={t('empty.blockedTitle')}
            description={t('empty.blockedBody')}
            showChevron={false}
          />
        )}
      </SettingsList>

      <SettingsSectionLabel>{t('items.muted')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('items.mutedDesc')}</p>
      <SettingsList>
        {muted.isLoading ? (
          <Skeleton className="m-4 h-12 rounded-lg" />
        ) : muted.data?.length ? (
          muted.data.map((u) => (
            <SettingsRow
              key={u.id}
              href={`/messages/${u.conversationId}`}
              label={u.name ?? u.username ?? ''}
              description={u.username ? `@${u.username}` : undefined}
            />
          ))
        ) : (
          <SettingsRow label={t('empty.mutedTitle')} description={t('empty.mutedBody')} showChevron={false} />
        )}
        <SettingsRow
          label={t('items.reporting')}
          description={t('items.reportingDesc')}
          href="/settings/support"
          icon={<ShieldBan className="size-5" />}
        />
      </SettingsList>
    </SettingsScreen>
  );
}
