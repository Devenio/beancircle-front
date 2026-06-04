'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { estimateStorageUsage } from '@/stores/settings-store';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StorageBar({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="text-muted-foreground">
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
        <div className="px-4 py-4">
          <p className="text-sm text-muted-foreground">{t('totalStorage')}</p>
          <p className="text-2xl font-semibold">{formatBytes(usage.total)}</p>
        </div>
        <StorageBar label={t('storageImages')} value={usage.images} total={usage.total} />
        <StorageBar label={t('storageVideos')} value={usage.videos} total={usage.total} />
        <StorageBar label={t('storageFiles')} value={usage.files} total={usage.total} />
        <StorageBar label={t('storageCache')} value={usage.cache} total={usage.total} />
      </div>

      <SettingsSectionLabel>{t('actions')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow label={t('clearCache')} onClick={clearLocalCache} />
        <SettingsRow label={t('removeDownloads')} onClick={clearLocalCache} />
      </SettingsList>

      <SettingsSectionLabel>{t('autoCleanup')}</SettingsSectionLabel>
      <SettingsList>
        {[7, 30, 90].map((days) => (
          <button
            key={days}
            type="button"
            onClick={() => update({ autoCleanupDays: days })}
            className={cn(
              'flex min-h-[52px] w-full items-center px-4 text-[15px] active:bg-muted/80',
              settings.autoCleanupDays === days && 'font-semibold text-primary',
            )}
          >
            {t('autoCleanupDays', { days })}
          </button>
        ))}
      </SettingsList>
    </SettingsScreen>
  );
}
