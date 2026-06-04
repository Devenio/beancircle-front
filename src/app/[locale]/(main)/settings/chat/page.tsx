'use client';

import { useTranslations } from 'next-intl';
import { Download, Eye, FileText, Keyboard, Link2 } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsToggleRow } from '@/components/settings/settings-row';
import { useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

const DOWNLOAD_OPTIONS = ['wifi', 'always', 'never'] as const;
const QUALITY_OPTIONS = ['standard', 'high'] as const;

export default function SettingsChatPage() {
  const t = useTranslations('settings');
  const store = useSettingsStore();

  return (
    <SettingsPageWrap title={t('sections.chat')} description={t('sections.chatDesc')}>
      <SettingsGroup title={t('media')}>
        <p className="px-3 pt-3 text-xs text-muted-foreground">{t('items.autoDownload')}</p>
        <div className="flex flex-wrap gap-2 px-3 pb-3">
          {DOWNLOAD_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => store.set('autoDownloadMedia', opt)}
              className={cn(
                'min-h-10 rounded-full border px-4 text-sm font-medium',
                store.autoDownloadMedia === opt
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              {t(`autoDownload.${opt}`)}
            </button>
          ))}
        </div>
        <p className="px-3 text-xs text-muted-foreground">{t('items.mediaQuality')}</p>
        <div className="flex gap-2 px-3 pb-3">
          {QUALITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => store.set('mediaQuality', opt)}
              className={cn(
                'min-h-10 flex-1 rounded-xl border text-sm font-medium',
                store.mediaQuality === opt
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              <Download className="mx-auto mb-0.5 size-4" />
              {t(`mediaQuality.${opt}`)}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('composer')}>
        <SettingsToggleRow
          icon={<FileText className="size-5" />}
          label={t('items.saveDrafts')}
          description={t('items.saveDraftsDesc')}
          checked={store.saveDrafts}
          onCheckedChange={(v) => store.set('saveDrafts', v)}
        />
        <SettingsToggleRow
          icon={<Link2 className="size-5" />}
          label={t('items.linkPreviews')}
          description={t('items.linkPreviewsDesc')}
          checked={store.linkPreviews}
          onCheckedChange={(v) => store.set('linkPreviews', v)}
        />
        <SettingsToggleRow
          icon={<Keyboard className="size-5" />}
          label={t('items.typingIndicators')}
          description={t('items.typingIndicatorsDesc')}
          checked={store.typingIndicators}
          onCheckedChange={(v) => store.set('typingIndicators', v)}
        />
        <SettingsToggleRow
          icon={<Eye className="size-5" />}
          label={t('items.readReceipts')}
          description={t('items.readReceiptsDesc')}
          checked={store.readReceipts}
          onCheckedChange={(v) => store.set('readReceipts', v)}
        />
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
