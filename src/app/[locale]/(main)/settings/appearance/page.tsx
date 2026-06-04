'use client';

import { useTranslations } from 'next-intl';
import { SettingsScreen } from '@/components/settings/settings-shell';
import { SettingsList, SettingsSectionLabel } from '@/components/settings/settings-row';
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
  const { settings, isLoading, update } = useSettingsApi();

  if (isLoading || !settings) {
    return (
      <SettingsScreen title={t('sections.appearance')}>
        <Skeleton className="h-64 w-full" />
      </SettingsScreen>
    );
  }

  return (
    <SettingsScreen title={t('sections.appearance')}>
      <SettingsSectionLabel>{t('theme')}</SettingsSectionLabel>
      <div className="border-y border-border/80 bg-card px-4 py-4">
        <ThemeToggle />
      </div>

      <SettingsSectionLabel>{t('items.accent')}</SettingsSectionLabel>
      <div className="flex flex-wrap gap-3 border-y border-border/80 bg-card px-4 py-4">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            aria-label={t(preset.labelKey)}
            onClick={() => update({ accentColor: preset.value })}
            className={cn(
              'size-11 rounded-full border-2',
              settings.accentColor === preset.value ? 'border-foreground scale-105' : 'border-transparent',
            )}
            style={{ background: preset.value }}
          />
        ))}
      </div>

      <SettingsSectionLabel>{t('items.fontSize')}</SettingsSectionLabel>
      <SettingsList>
        {FONT_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update({ fontSize: opt })}
            className={cn(
              'flex min-h-[52px] w-full items-center px-4 text-[15px] active:bg-muted/80',
              settings.fontSize === opt && 'font-semibold text-primary',
            )}
          >
            {t(`fontSize.${opt}`)}
          </button>
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.messageDensity')}</SettingsSectionLabel>
      <SettingsList>
        {DENSITY_OPTIONS.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => update({ messageDensity: opt })}
            className={cn(
              'flex min-h-[52px] w-full items-center px-4 text-[15px] active:bg-muted/80',
              settings.messageDensity === opt && 'font-semibold text-primary',
            )}
          >
            {t(`density.${opt}`)}
          </button>
        ))}
      </SettingsList>

      <SettingsSectionLabel>{t('items.wallpaper')}</SettingsSectionLabel>
      <SettingsList>
        {WALLPAPERS.map((wp) => (
          <button
            key={wp}
            type="button"
            onClick={() => update({ chatWallpaper: wp })}
            className={cn(
              'flex min-h-[52px] w-full items-center justify-between px-4 text-[15px] active:bg-muted/80',
              settings.chatWallpaper === wp && 'font-semibold text-primary',
            )}
          >
            {t(`wallpaper.${wp}`)}
          </button>
        ))}
      </SettingsList>
    </SettingsScreen>
  );
}
