'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { HardDrive, Trash2 } from 'lucide-react';
import { SettingsScreen } from '@/components/settings/settings-shell';
import {
  SettingsFieldHeader,
  SettingsLearnMore,
  SettingsList,
  SettingsOptionRow,
  SettingsRow,
  SettingsSectionLabel,
} from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { estimateStorageUsage } from '@/stores/settings-store';
import { Skeleton } from '@/components/ui/skeleton';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StorageBar({ label, hint, value, total }: { label: string; hint: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <div className="min-w-0">
          <span className="block">{label}</span>
          <span className="text-xs text-muted-foreground">{hint}</span>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {formatBytes(value)} · {pct}%
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
        <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SettingsStoragePage() {
  const t = useTranslations('settings');
  const { settings, isLoading, update } = useSettingsApi();
  const usage = useMemo(() => estimateStorageUsage(), []);

  function clearLocalCache() {
    if (typeof window === 'undefined') return;
    const keysToKeep = ['accessToken', 'refreshToken', 'beancircle-auth'];
    Object.keys(localStorage).forEach((key) => {
      if (!keysToKeep.some((k) => key.startsWith(k))) localStorage.removeItem(key);
    });
  }

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.storage')}>
        <Skeleton className="h-48 w-full" />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen title={t('sections.storage')}>
      <div className="border-b border-border/80 bg-card">
        <SettingsFieldHeader
          icon={<HardDrive className="size-5" />}
          label={t('totalStorage')}
          description={t('totalStorageDesc')}
          className="pb-2"
        />
        <p className="px-4 pb-4 text-2xl font-semibold">{formatBytes(usage.total)}</p>
        <StorageBar label={t('storageImages')} hint={t('storageImagesDesc')} value={usage.images} total={usage.total} />
        <StorageBar label={t('storageVideos')} hint={t('storageVideosDesc')} value={usage.videos} total={usage.total} />
        <StorageBar label={t('storageFiles')} hint={t('storageFilesDesc')} value={usage.files} total={usage.total} />
        <StorageBar label={t('storageCache')} hint={t('storageCacheDesc')} value={usage.cache} total={usage.total} />
      </div>

      <SettingsSectionLabel>{t('actions')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow
          icon={<Trash2 className="size-5" />}
          label={t('clearCache')}
          description={t('clearCacheDesc')}
          onClick={clearLocalCache}
        />
        <SettingsRow
          label={t('removeDownloads')}
          description={t('removeDownloadsDesc')}
          onClick={clearLocalCache}
        />
      </SettingsList>
      <p className="px-4 pt-1 text-xs text-muted-foreground">{t('hints.clearCacheConfirm')}</p>

      <SettingsSectionLabel>{t('autoCleanup')}</SettingsSectionLabel>
      <SettingsFieldHeader
        label={t('autoCleanup')}
        description={t('autoCleanupDesc')}
        learnMore={
          <SettingsLearnMore label={t('learnMore')}>{t('learnMoreCopy.autoCleanup')}</SettingsLearnMore>
        }
        className="border-b border-border/80 bg-card"
      />
      <SettingsList>
        {([7, 30, 90] as const).map((days) => (
          <SettingsOptionRow
            key={days}
            label={t('autoCleanupDays', { days })}
            description={t(`autoCleanupHints.${days}`)}
            selected={settings.autoCleanupDays === days}
            onClick={() => update({ autoCleanupDays: days })}
          />
        ))}
      </SettingsList>
    </SettingsScreen>
  );
}
