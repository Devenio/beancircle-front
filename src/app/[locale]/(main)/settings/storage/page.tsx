'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { HardDrive, Trash2 } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';
import { estimateStorageUsage, useSettingsStore } from '@/stores/settings-store';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function StorageBar({
  label,
  value,
  total,
  color,
}: {
  label: string;
  value: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {formatBytes(value)} · {pct}%
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

export default function SettingsStoragePage() {
  const t = useTranslations('settings');
  const store = useSettingsStore();
  const usage = useMemo(() => estimateStorageUsage(), []);

  return (
    <SettingsPageWrap title={t('sections.storage')} description={t('sections.storageDesc')}>
      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-xl bg-primary/10">
            <HardDrive className="size-6 text-primary" />
          </span>
          <div>
            <p className="text-sm text-muted-foreground">{t('totalStorage')}</p>
            <p className="text-2xl font-bold">{formatBytes(usage.total)}</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <StorageBar label={t('storageImages')} value={usage.images} total={usage.total} color="bg-chart-1" />
          <StorageBar label={t('storageVideos')} value={usage.videos} total={usage.total} color="bg-chart-2" />
          <StorageBar label={t('storageFiles')} value={usage.files} total={usage.total} color="bg-chart-3" />
          <StorageBar label={t('storageCache')} value={usage.cache} total={usage.total} color="bg-chart-4" />
        </div>
      </div>

      <SettingsGroup title={t('actions')}>
        <div className="p-3">
          <Button
            variant="outline"
            className="min-h-12 w-full"
            onClick={() => store.clearCache()}
          >
            <Trash2 className="size-4" />
            {t('clearCache')}
          </Button>
        </div>
        <SettingsRow
          icon={<Trash2 className="size-5" />}
          label={t('removeDownloads')}
          description={t('removeDownloadsDesc')}
          onClick={() => store.clearCache()}
        />
      </SettingsGroup>

      <SettingsGroup title={t('autoCleanup')}>
        <p className="px-3 pt-3 text-xs text-muted-foreground">{t('autoCleanupDesc')}</p>
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {[7, 30, 90].map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => store.set('autoCleanupDays', days)}
              className={cn(
                'min-h-10 rounded-full border px-4 text-sm font-medium',
                store.autoCleanupDays === days
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {t('autoCleanupDays', { days })}
            </button>
          ))}
        </div>
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
