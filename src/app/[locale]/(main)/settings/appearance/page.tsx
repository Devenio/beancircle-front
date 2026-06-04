'use client';

import { useTranslations } from 'next-intl';
import { AlignJustify, Image, Paintbrush, Type } from 'lucide-react';
import { SettingsPageWrap } from '@/components/settings/settings-shell';
import { SettingsGroup, SettingsRow } from '@/components/settings/settings-row';
import { ThemeToggle } from '@/components/theme-toggle';
import { ACCENT_PRESETS, useSettingsStore } from '@/stores/settings-store';
import { cn } from '@/lib/utils';

const FONT_OPTIONS = ['small', 'medium', 'large'] as const;
const DENSITY_OPTIONS = ['compact', 'comfortable', 'spacious'] as const;
const WALLPAPERS = ['default', 'warm', 'cool', 'minimal'] as const;

export default function SettingsAppearancePage() {
  const t = useTranslations('settings');
  const store = useSettingsStore();

  return (
    <SettingsPageWrap title={t('sections.appearance')} description={t('sections.appearanceDesc')}>
      <SettingsGroup title={t('theme')}>
        <div className="p-3">
          <ThemeToggle />
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('items.accent')}>
        <div className="flex flex-wrap gap-3 p-3">
          {ACCENT_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              aria-label={t(preset.labelKey)}
              onClick={() => store.set('accentColor', preset.value)}
              className={cn(
                'size-12 rounded-full border-2 transition-transform hover:scale-105',
                store.accentColor === preset.value ? 'border-foreground scale-105' : 'border-transparent',
              )}
              style={{ background: preset.value }}
            />
          ))}
        </div>
        <SettingsRow icon={<Paintbrush className="size-5" />} label={t('items.accent')} description={t('items.accentDesc')} />
      </SettingsGroup>

      <SettingsGroup title={t('items.fontSize')}>
        <div className="flex gap-2 p-3">
          {FONT_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => store.set('fontSize', opt)}
              className={cn(
                'min-h-12 flex-1 rounded-xl border text-sm font-medium',
                store.fontSize === opt
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              <Type className="mx-auto mb-1 size-4" />
              {t(`fontSize.${opt}`)}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('items.messageDensity')}>
        <div className="flex gap-2 p-3">
          {DENSITY_OPTIONS.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => store.set('messageDensity', opt)}
              className={cn(
                'min-h-12 flex-1 rounded-xl border text-xs font-medium',
                store.messageDensity === opt
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted',
              )}
            >
              <AlignJustify className="mx-auto mb-1 size-4" />
              {t(`density.${opt}`)}
            </button>
          ))}
        </div>
      </SettingsGroup>

      <SettingsGroup title={t('items.wallpaper')}>
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-4">
          {WALLPAPERS.map((wp) => (
            <button
              key={wp}
              type="button"
              onClick={() => store.set('chatWallpaper', wp)}
              className={cn(
                'flex min-h-20 flex-col items-center justify-end rounded-xl border-2 p-2 text-[10px] font-medium',
                store.chatWallpaper === wp ? 'border-primary' : 'border-border',
                wp === 'default' && 'bg-muted',
                wp === 'warm' && 'bg-gradient-to-br from-amber-100 to-orange-200 dark:from-amber-900/40 dark:to-orange-900/30',
                wp === 'cool' && 'bg-gradient-to-br from-sky-100 to-indigo-200 dark:from-sky-900/40 dark:to-indigo-900/30',
                wp === 'minimal' && 'bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-800 dark:to-neutral-900',
              )}
            >
              <Image className="mb-1 size-4 opacity-60" />
              {t(`wallpaper.${wp}`)}
            </button>
          ))}
        </div>
      </SettingsGroup>
    </SettingsPageWrap>
  );
}
