'use client';

import { useTranslations } from 'next-intl';
import { Archive, Download, Film, FileText, Link2, Keyboard } from 'lucide-react';
import { useChatArchiveStore, type ArchivePlacement } from '@/stores/chat-archive-store';
import { SettingsScreen } from '@/components/settings/settings-shell';
import {
  SettingsFieldHeader,
  SettingsLearnMore,
  SettingsList,
  SettingsOptionRow,
  SettingsSectionLabel,
  SettingsToggleRow,
} from '@/components/settings/settings-row';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { readReceiptsHint, typingIndicatorsHint } from '@/lib/settings-hints';
import { Skeleton } from '@/components/ui/skeleton';

const DOWNLOAD_OPTIONS = ['wifi', 'always', 'never'] as const;
const QUALITY_OPTIONS = ['standard', 'high'] as const;

export default function SettingsChatPage() {
  const t = useTranslations('settings');
  const tMessages = useTranslations('messages');
  const { settings, isLoading, update } = useSettingsApi();
  const autoUnarchive = useChatArchiveStore((s) => s.autoUnarchiveOnMessage);
  const placement = useChatArchiveStore((s) => s.placement);
  const setAutoUnarchive = useChatArchiveStore((s) => s.setAutoUnarchiveOnMessage);
  const setPlacement = useChatArchiveStore((s) => s.setPlacement);

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
      <SettingsFieldHeader
        icon={<Download className="size-5" />}
        label={t('items.autoDownload')}
        description={t(`autoDownloadHints.${settings.autoDownloadMedia}`)}
        learnMore={
          <SettingsLearnMore label={t('learnMore')}>{t('learnMoreCopy.autoDownload')}</SettingsLearnMore>
        }
      />
      <SettingsList>
        {DOWNLOAD_OPTIONS.map((opt) => (
          <SettingsOptionRow
            key={opt}
            label={t(`autoDownload.${opt}`)}
            description={t(`autoDownloadHints.${opt}`)}
            selected={settings.autoDownloadMedia === opt}
            onClick={() => update({ autoDownloadMedia: opt })}
          />
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.mediaQuality')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('items.mediaQualityDesc')}</p>
      <SettingsList>
        {QUALITY_OPTIONS.map((opt) => (
          <SettingsOptionRow
            key={opt}
            label={t(`mediaQuality.${opt}`)}
            description={t(`mediaQualityHints.${opt}`)}
            selected={settings.mediaQuality === opt}
            onClick={() => update({ mediaQuality: opt })}
          />
        ))}
      </SettingsList>

      <SettingsSectionLabel>{tMessages('archivedTitle')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          icon={<Archive className="size-5" />}
          label={tMessages('archiveAutoUnarchive')}
          description={tMessages('archiveAutoUnarchiveDesc')}
          checked={autoUnarchive}
          onCheckedChange={setAutoUnarchive}
        />
      </SettingsList>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{tMessages('archivePlacement')}</p>
      <SettingsList>
        {(['top', 'bottom'] as ArchivePlacement[]).map((opt) => (
          <SettingsOptionRow
            key={opt}
            label={opt === 'top' ? tMessages('archivePlacementTop') : tMessages('archivePlacementBottom')}
            description={
              opt === 'top' ? tMessages('archivedEntryHint') : tMessages('archivePlacementBottomDesc')
            }
            selected={placement === opt}
            onClick={() => setPlacement(opt)}
          />
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('composer')}</SettingsSectionLabel>
      <SettingsList>
        <SettingsToggleRow
          icon={<FileText className="size-5" />}
          label={t('items.saveDrafts')}
          description={
            settings.saveDrafts ? t('items.saveDraftsDesc') : t('hints.saveDraftsOff')
          }
          checked={settings.saveDrafts}
          onCheckedChange={(v) => update({ saveDrafts: v })}
        />
        <SettingsToggleRow
          icon={<Link2 className="size-5" />}
          label={t('items.linkPreviews')}
          description={
            settings.linkPreviews ? t('items.linkPreviewsDesc') : t('hints.linkPreviewsOff')
          }
          checked={settings.linkPreviews}
          onCheckedChange={(v) => update({ linkPreviews: v })}
        />
        <SettingsToggleRow
          icon={<Keyboard className="size-5" />}
          label={t('items.typingIndicators')}
          description={typingIndicatorsHint(t, settings.typingIndicators)}
          checked={settings.typingIndicators}
          onCheckedChange={(v) => update({ typingIndicators: v })}
        />
        <SettingsToggleRow
          icon={<Film className="size-5" />}
          label={t('items.readReceipts')}
          description={readReceiptsHint(t, settings.readReceipts)}
          checked={settings.readReceipts}
          onCheckedChange={(v) => update({ readReceipts: v })}
          learnMore={
            <SettingsLearnMore label={t('learnMore')}>{t('learnMoreCopy.readReceipts')}</SettingsLearnMore>
          }
        />
      </SettingsList>
    </SettingsScreen>
  );
}
