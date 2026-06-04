'use client';

import { useTranslations } from 'next-intl';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsSectionLabel, SettingsToggleRow } from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const DOWNLOAD_OPTIONS = ['wifi', 'always', 'never'] as const;
const QUALITY_OPTIONS = ['standard', 'high'] as const;

export default function SettingsChatPage() {
  const t = useTranslations('settings');
  const { settings, isLoading, update } = useSettingsApi();

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.chat')}>
        <Skeleton className="h-48 w-full" />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen title={t('sections.chat')}>
      <SettingsSectionLabel>{t('media')}</SettingsSectionLabel>
      <SettingsList>
        {DOWNLOAD_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update({ autoDownloadMedia: opt })}
            className={cn(
              'flex min-h-[52px] w-full items-center px-4 text-[15px] active:bg-muted/80',
              settings.autoDownloadMedia === opt && 'font-semibold text-primary',
            )}
          >
            {t(`autoDownload.${opt}`)}
          </button>
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.mediaQuality')}</SettingsSectionLabel>
      <SettingsList>
        {QUALITY_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update({ mediaQuality: opt })}
            className={cn(
              'flex min-h-[52px] w-full items-center px-4 text-[15px] active:bg-muted/80',
              settings.mediaQuality === opt && 'font-semibold text-primary',
            )}
          >
            {t(`mediaQuality.${opt}`)}
          </button>
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('composer')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          label={t('items.saveDrafts')}
          checked={settings.saveDrafts}
          onCheckedChange={(v) => update({ saveDrafts: v })}
        />
        <SettingsToggleRow
          label={t('items.linkPreviews')}
          checked={settings.linkPreviews}
          onCheckedChange={(v) => update({ linkPreviews: v })}
        />
        <SettingsToggleRow
          label={t('items.typingIndicators')}
          checked={settings.typingIndicators}
          onCheckedChange={(v) => update({ typingIndicators: v })}
        />
        <SettingsToggleRow
          label={t('items.readReceipts')}
          checked={settings.readReceipts}
          onCheckedChange={(v) => update({ readReceipts: v })}
        />
      </SettingsList>
    </SettingsScreen>
  );
}
