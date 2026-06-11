'use client';

import { PublicMenuView } from '@/components/cafe-menu/public-menu-view';
import {
  MENU_THEME_PRESETS,
  type MenuThemeConfig,
} from '@/components/cafe-menu/themes';
import type { CafeMenuData, MenuTheme } from '@/components/cafe-menu/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cafeOsApi } from '@/lib/api/cafe-os';
import { presignAndUpload } from '@/lib/api/uploads';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, ImagePlus, Loader2 } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useMemo, useRef, useState } from 'react';

const THEMES: { id: MenuTheme; preset: MenuThemeConfig | null }[] = [
  { id: 'MINIMAL', preset: MENU_THEME_PRESETS.MINIMAL },
  { id: 'MODERN', preset: MENU_THEME_PRESETS.MODERN },
  { id: 'LUXURY', preset: MENU_THEME_PRESETS.LUXURY },
  { id: 'DARK', preset: MENU_THEME_PRESETS.DARK },
  { id: 'VINTAGE', preset: MENU_THEME_PRESETS.VINTAGE },
  { id: 'NEON', preset: MENU_THEME_PRESETS.NEON },
  { id: 'CUSTOM', preset: null },
];

const FONTS: MenuThemeConfig['headingFont'][] = ['serif', 'sans', 'mono'];

export function MenuDesigner({ menu, cafeId }: { menu: CafeMenuData; cafeId: string }) {
  const t = useTranslations('cafeOs.menu');
  const tm = useTranslations('cafeMenu');
  const locale = useLocale();
  const qc = useQueryClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [theme, setTheme] = useState<MenuTheme>(menu.theme ?? 'MINIMAL');
  const [custom, setCustom] = useState<Partial<MenuThemeConfig>>(() => ({
    ...MENU_THEME_PRESETS.MINIMAL,
    accent: menu.accentColor || MENU_THEME_PRESETS.MINIMAL.accent,
    ...((menu.themeConfig ?? {}) as Partial<MenuThemeConfig>),
  }));
  const [welcomeTitle, setWelcomeTitle] = useState(menu.welcomeTitle ?? '');
  const [welcomeMessage, setWelcomeMessage] = useState(menu.welcomeMessage ?? '');
  const [welcomeImageUrl, setWelcomeImageUrl] = useState(menu.welcomeImageUrl ?? '');

  const previewMenu = useMemo<CafeMenuData>(
    () => ({
      ...menu,
      theme,
      themeConfig: theme === 'CUSTOM' ? (custom as Record<string, unknown>) : null,
      welcomeTitle: welcomeTitle || null,
      welcomeMessage: welcomeMessage || null,
      welcomeImageUrl: welcomeImageUrl || null,
    }),
    [menu, theme, custom, welcomeTitle, welcomeMessage, welcomeImageUrl],
  );

  const saveMutation = useMutation({
    mutationFn: () =>
      cafeOsApi.updateMenuSettings(cafeId, {
        theme,
        themeConfig: theme === 'CUSTOM' ? custom : null,
        accentColor:
          theme === 'CUSTOM'
            ? (custom.accent ?? menu.accentColor)
            : MENU_THEME_PRESETS[theme as Exclude<MenuTheme, 'CUSTOM'>].accent,
        welcomeTitle: welcomeTitle || null,
        welcomeMessage: welcomeMessage || null,
        welcomeImageUrl: welcomeImageUrl || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cafe-menu', cafeId] }),
  });

  async function handleWelcomeImage(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      setWelcomeImageUrl(await presignAndUpload(files[0], 'menus'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-5">
      {/* Theme presets */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('theme')}</h3>
        <div className="grid grid-cols-4 gap-2">
          {THEMES.map(({ id, preset }) => {
            const swatch = preset ?? {
              ...MENU_THEME_PRESETS.MINIMAL,
              ...custom,
            };
            return (
              <button
                key={id}
                type="button"
                onClick={() => setTheme(id)}
                className={`relative overflow-hidden rounded-xl border-2 p-0.5 transition ${
                  theme === id ? 'border-primary' : 'border-transparent'
                }`}
              >
                <div
                  className="flex h-16 flex-col justify-between rounded-[10px] p-2"
                  style={{ backgroundColor: swatch.bg }}
                >
                  <span
                    className="h-1.5 w-8 rounded-full"
                    style={{ backgroundColor: swatch.accent }}
                  />
                  <span
                    className="h-4 w-full rounded-md"
                    style={{ backgroundColor: swatch.surface }}
                  />
                </div>
                <span className="mt-1 block text-center text-[10px] font-medium">
                  {t(`themes.${id}`)}
                </span>
                {theme === id ? (
                  <span className="absolute end-1.5 top-1.5 rounded-full bg-primary p-0.5 text-primary-foreground">
                    <Check className="h-2.5 w-2.5" />
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>

      {/* Custom theme controls */}
      {theme === 'CUSTOM' ? (
        <div className="space-y-3 rounded-2xl border border-border p-3">
          <h3 className="text-sm font-semibold">{t('customTheme')}</h3>
          <div className="grid grid-cols-2 gap-3">
            <ColorField
              label={t('accentColor')}
              value={custom.accent ?? '#2C1810'}
              onChange={(v) => setCustom((c) => ({ ...c, accent: v }))}
            />
            <ColorField
              label={t('backgroundColor')}
              value={custom.bg ?? '#FAF7F2'}
              onChange={(v) => setCustom((c) => ({ ...c, bg: v }))}
            />
            <ColorField
              label={t('surfaceColor')}
              value={custom.surface ?? '#FFFFFF'}
              onChange={(v) => setCustom((c) => ({ ...c, surface: v }))}
            />
            <ColorField
              label={t('textColor')}
              value={custom.text ?? '#1A1410'}
              onChange={(v) => setCustom((c) => ({ ...c, text: v }))}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-xs font-medium text-muted-foreground">
              {t('font')}
            </span>
            <div className="flex gap-2">
              {FONTS.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => setCustom((c) => ({ ...c, headingFont: f }))}
                  className={`flex-1 rounded-lg border py-2 text-sm transition ${
                    (custom.headingFont ?? 'serif') === f
                      ? 'border-primary bg-primary/5 font-semibold'
                      : 'border-border'
                  }`}
                  style={{
                    fontFamily:
                      f === 'serif' ? 'Georgia, serif' : f === 'mono' ? 'monospace' : undefined,
                  }}
                >
                  Aa
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {/* Welcome section */}
      <div className="space-y-3 rounded-2xl border border-border p-3">
        <h3 className="text-sm font-semibold">{t('welcome')}</h3>
        <Input
          value={welcomeTitle}
          placeholder={t('welcomeTitle')}
          onChange={(e) => setWelcomeTitle(e.target.value)}
        />
        <Textarea
          value={welcomeMessage}
          placeholder={t('welcomeMessage')}
          rows={2}
          onChange={(e) => setWelcomeMessage(e.target.value)}
        />
        <button
          type="button"
          onClick={() => fileInput.current?.click()}
          disabled={uploading}
          className="flex h-24 w-full items-center justify-center overflow-hidden rounded-xl border border-dashed border-border text-muted-foreground"
        >
          {welcomeImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={welcomeImageUrl} alt="" className="h-full w-full object-cover" />
          ) : uploading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <span className="flex items-center gap-2 text-sm">
              <ImagePlus className="h-4 w-4" />
              {t('welcomeImage')}
            </span>
          )}
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => handleWelcomeImage(e.target.files)}
        />
      </div>

      {/* Live phone preview */}
      <div>
        <h3 className="mb-2 text-sm font-semibold">{t('livePreview')}</h3>
        <div className="mx-auto w-[280px] overflow-hidden rounded-[2rem] border-[6px] border-foreground/80 shadow-xl">
          <div className="h-[520px] overflow-y-auto">
            <div className="origin-top-left scale-[0.651]" style={{ width: 430 }}>
              <PublicMenuView
                menu={previewMenu}
                locale={locale}
                preview
                labels={{
                  viewMenu: tm('viewMenu'),
                  scrollHint: tm('scrollHint'),
                  unavailable: tm('unavailable'),
                  poweredBy: tm('poweredBy'),
                  off: tm('off'),
                  calories: tm('calories'),
                  prepTime: tm('prepTime'),
                  ingredients: tm('ingredients'),
                  allergens: tm('allergens'),
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <Button
        className="w-full"
        disabled={saveMutation.isPending || uploading}
        onClick={() => saveMutation.mutate()}
      >
        {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t('saveDesign')}
      </Button>
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <span className="flex items-center gap-2 rounded-lg border border-border p-1.5">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-7 w-9 cursor-pointer rounded border-0 bg-transparent p-0"
        />
        <span className="font-mono text-xs uppercase">{value}</span>
      </span>
    </label>
  );
}
