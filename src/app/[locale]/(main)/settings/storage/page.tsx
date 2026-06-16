'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useQueryClient } from '@tanstack/react-query';
import { Database, HardDrive, ImageIcon, Trash2 } from 'lucide-react';
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
import {
  clearAppCache,
  formatBytes,
  getStorageEstimate,
  removeDownloads,
  type StorageEstimate,
} from '@/lib/storage-usage';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

function StorageBar({
  icon,
  label,
  hint,
  value,
  total,
}: {
  icon: React.ReactNode;
  label: string;
  hint: string;
  value: number;
  total: number;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div className="px-4 py-3">
      <div className="flex justify-between gap-2 text-sm">
        <div className="flex min-w-0 items-start gap-2">
          <span className="mt-0.5 text-muted-foreground">{icon}</span>
          <div className="min-w-0">
            <span className="block">{label}</span>
            <span className="text-xs text-muted-foreground">{hint}</span>
          </div>
        </div>
        <span className="shrink-0 text-muted-foreground">
          {formatBytes(value)}
          {total > 0 ? ` · ${pct}%` : ''}
        </span>
      </div>
      {total > 0 ? (
        <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      ) : null}
    </div>
  );
}

type PendingAction = 'cache' | 'downloads' | null;

export default function SettingsStoragePage() {
  const t = useTranslations('settings');
  const qc = useQueryClient();
  const { settings, isLoading, update } = useSettingsApi();
  const [usage, setUsage] = useState<StorageEstimate | null>(null);
  const [pending, setPending] = useState<PendingAction>(null);
  const [working, setWorking] = useState(false);

  const refreshUsage = useCallback(() => {
    void getStorageEstimate().then(setUsage);
  }, []);

  useEffect(() => {
    refreshUsage();
  }, [refreshUsage]);

  async function runPending() {
    if (!pending) return;
    setWorking(true);
    try {
      if (pending === 'cache') {
        clearAppCache();
        qc.clear();
      } else {
        await removeDownloads();
      }
    } finally {
      setWorking(false);
      setPending(null);
      refreshUsage();
    }
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
        {usage === null ? (
          <Skeleton className="mx-4 mb-4 h-8 w-32" />
        ) : !usage.supported ? (
          <p className="px-4 pb-4 text-sm text-muted-foreground">{t('storageUnavailable')}</p>
        ) : (
          <>
            <p className="px-4 text-2xl font-semibold">{formatBytes(usage.usage)}</p>
            {usage.quota > 0 ? (
              <p className="px-4 pb-4 text-xs text-muted-foreground">
                {t('storageOfQuota', {
                  used: formatBytes(usage.usage),
                  quota: formatBytes(usage.quota),
                })}
              </p>
            ) : (
              <div className="pb-2" />
            )}
            <StorageBar
              icon={<Database className="size-4" />}
              label={t('storageAppData')}
              hint={t('storageAppDataDesc')}
              value={usage.appData}
              total={usage.usage}
            />
            <StorageBar
              icon={<ImageIcon className="size-4" />}
              label={t('storageCachedMedia')}
              hint={t('storageCachedMediaDesc')}
              value={usage.cachedMedia}
              total={usage.usage}
            />
            {usage.quota > 0 ? (
              <StorageBar
                icon={<HardDrive className="size-4" />}
                label={t('storageAvailable')}
                hint={t('storageAvailableDesc')}
                value={usage.available}
                total={usage.quota}
              />
            ) : null}
          </>
        )}
      </div>

      <SettingsSectionLabel>{t('actions')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsRow
          icon={<Trash2 className="size-5" />}
          label={t('clearCache')}
          description={t('clearCacheDesc')}
          onClick={() => setPending('cache')}
        />
        <SettingsRow
          icon={<ImageIcon className="size-5" />}
          label={t('removeDownloads')}
          description={t('removeDownloadsDesc')}
          onClick={() => setPending('downloads')}
        />
      </SettingsList>

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

      <Dialog open={pending !== null} onOpenChange={(open) => (!open ? setPending(null) : null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pending === 'downloads' ? t('removeDownloadsTitle') : t('clearCacheTitle')}
            </DialogTitle>
            <DialogDescription>
              {pending === 'downloads' ? t('removeDownloadsBody') : t('clearCacheBody')}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setPending(null)} disabled={working}>
              {t('cancel')}
            </Button>
            <Button variant="destructive" onClick={() => void runPending()} disabled={working}>
              {t('confirmClear')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SettingsScreen>
  );
}
