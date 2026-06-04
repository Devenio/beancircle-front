'use client';

import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsFieldHeader, SettingsList, SettingsOptionRow, SettingsSectionLabel } from '@/components/settings/settings-row';
import { ThemeToggle } from '@/components/theme-toggle';
import { useSettingsApi } from '@/hooks/use-settings-api';
import { ACCENT_PRESETS } from '@/stores/settings-store';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const FONT_OPTIONS = ['small', 'medium', 'large'] as const;
const DENSITY_OPTIONS = ['compact', 'comfortable', 'spacious'] as const;
const WALLPAPERS = ['default', 'warm', 'cool', 'minimal'] as const;

export default function SettingsAppearancePage() {
  const t = useTranslations('settings');
  const { theme } = useTheme();
  const { settings, isLoading, update } = useSettingsApi();

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.appearance')}>
        <Skeleton className="h-64 w-full" />
      </SettingsScreen>
    );
  }

  const themeHint =
    theme === 'light' ? t('themeLightDesc') : theme === 'dark' ? t('themeDarkDesc') : t('themeSystemDesc');

  return (
    <SettingsScreen title={t('sections.appearance')}>
      <SettingsSectionLabel>{t('theme')}</SettingsSectionLabel>
      <div className="border-y border-border/80 bg-card">
        <SettingsFieldHeader label={t('theme')} description={themeHint || t('themeDesc')} className="pb-0" />
        <div className="px-4 pb-4">
          <ThemeToggle />
        </div>
      </div>

      <SettingsSectionLabel>{t('items.accent')}</SettingsSectionLabel>
      <p className="px-4 pb-2 text-xs text-muted-foreground">{t('items.accentDesc')}</p>
      <div className="flex flex-wrap gap-3 border-y border-border/80 bg-card px-4 py-4">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={t(preset.labelKey)}
            title={t(preset.labelKey)}
            onClick={() => update({ accentColor: preset.value })}
            className={cn(
              'size-11 rounded-full border-2',
              settings.accentColor === preset.value ? 'scale-105 border-foreground' : 'border-transparent',
            )}
            style={{ background: preset.value }}
          />
        ))}
      </div>

      <SettingsSectionLabel>{t('items.fontSize')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('items.fontSizeDesc')}</p>
      <SettingsList>
        {FONT_OPTIONS.map((opt) => (
          <SettingsOptionRow
            key={opt}
            label={t(`fontSize.${opt}`)}
            description={t(`fontSizeHints.${opt}`)}
            selected={settings.fontSize === opt}
            onClick={() => update({ fontSize: opt })}
          />
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.messageDensity')}</SettingsSectionLabel>
      <p className="px-4 pb-1 text-xs text-muted-foreground">{t('items.messageDensityDesc')}</p>
      <SettingsList>
        {DENSITY_OPTIONS.map((opt) => (
          <SettingsOptionRow
            key={opt}
            label={t(`density.${opt}`)}
            description={t(`densityHints.${opt}`)}
            selected={settings.messageDensity === opt}
            onClick={() => update({ messageDensity: opt })}
          />
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.wallpaper')}</SettingsSectionLabel>
      <SettingsList>
        {WALLPAPERS.map((wp) => (
          <SettingsOptionRow
            key={wp}
            label={t(`wallpaper.${wp}`)}
            description={t(`wallpaperHints.${wp}`)}
            selected={settings.chatWallpaper === wp}
            onClick={() => update({ chatWallpaper: wp })}
          />
        ))}
      </SettingsList>
    </SettingsScreen>
  );
}
