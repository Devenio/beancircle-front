import type { MenuTheme } from './types';

export type MenuThemeConfig = {
  /** page background */
  bg: string;
  /** card background */
  surface: string;
  /** primary text */
  text: string;
  /** secondary text */
  muted: string;
  /** accent (prices, active chips, buttons) */
  accent: string;
  /** text rendered on top of the accent color */
  onAccent: string;
  /** inactive chip background */
  chip: string;
  /** card border/ring color */
  border: string;
  headingFont: 'serif' | 'sans' | 'mono';
  /** card corner radius css value */
  radius: string;
  cardStyle: 'elevated' | 'outline' | 'flat';
  /** hero gradient base color (defaults to accent) */
  heroTint?: string;
};

export const MENU_THEME_PRESETS: Record<Exclude<MenuTheme, 'CUSTOM'>, MenuThemeConfig> = {
  MINIMAL: {
    bg: '#FAF7F2',
    surface: '#FFFFFF',
    text: '#1A1410',
    muted: '#6B5E54',
    accent: '#2C1810',
    onAccent: '#FFFFFF',
    chip: '#EDE6DC',
    border: 'rgba(0,0,0,0.05)',
    headingFont: 'serif',
    radius: '1rem',
    cardStyle: 'elevated',
  },
  MODERN: {
    bg: '#F4F6F8',
    surface: '#FFFFFF',
    text: '#0F172A',
    muted: '#64748B',
    accent: '#2563EB',
    onAccent: '#FFFFFF',
    chip: '#E2E8F0',
    border: 'rgba(15,23,42,0.06)',
    headingFont: 'sans',
    radius: '1.25rem',
    cardStyle: 'elevated',
  },
  LUXURY: {
    bg: '#101010',
    surface: '#1B1812',
    text: '#F5EFE2',
    muted: '#A89B85',
    accent: '#C8A24B',
    onAccent: '#181206',
    chip: '#2A2418',
    border: 'rgba(200,162,75,0.25)',
    headingFont: 'serif',
    radius: '0.5rem',
    cardStyle: 'outline',
    heroTint: '#0A0805',
  },
  DARK: {
    bg: '#0B0F14',
    surface: '#151B23',
    text: '#E7EDF4',
    muted: '#8A97A5',
    accent: '#4FA3FF',
    onAccent: '#06121F',
    chip: '#1E2630',
    border: 'rgba(255,255,255,0.07)',
    headingFont: 'sans',
    radius: '1rem',
    cardStyle: 'flat',
    heroTint: '#05070A',
  },
  VINTAGE: {
    bg: '#F3E9D8',
    surface: '#FBF4E6',
    text: '#3B2A1A',
    muted: '#7E6A52',
    accent: '#8C3B22',
    onAccent: '#FBF4E6',
    chip: '#E5D6BC',
    border: 'rgba(60,42,26,0.18)',
    headingFont: 'serif',
    radius: '0.375rem',
    cardStyle: 'outline',
  },
  NEON: {
    bg: '#07020F',
    surface: '#120A22',
    text: '#F2EBFF',
    muted: '#9D8FC0',
    accent: '#E935C1',
    onAccent: '#FFFFFF',
    chip: '#1D1233',
    border: 'rgba(233,53,193,0.35)',
    headingFont: 'mono',
    radius: '1.25rem',
    cardStyle: 'outline',
    heroTint: '#0B0418',
  },
};

export const FONT_STACKS: Record<MenuThemeConfig['headingFont'], string> = {
  serif: 'var(--font-serif, Georgia, "Times New Roman", serif)',
  sans: 'var(--font-sans, ui-sans-serif, system-ui, sans-serif)',
  mono: 'ui-monospace, "SF Mono", Menlo, monospace',
};

/** Resolve the effective theme config for a menu. */
export function resolveTheme(
  theme: MenuTheme | undefined,
  themeConfig: Record<string, unknown> | null | undefined,
  accentColor?: string,
): MenuThemeConfig {
  if (theme === 'CUSTOM') {
    const base = MENU_THEME_PRESETS.MINIMAL;
    const cfg = (themeConfig ?? {}) as Partial<MenuThemeConfig>;
    return { ...base, accent: accentColor || base.accent, ...cfg };
  }
  const preset = MENU_THEME_PRESETS[theme ?? 'MINIMAL'] ?? MENU_THEME_PRESETS.MINIMAL;
  // Legacy menus configured only an accent color on the MINIMAL theme.
  if ((theme === undefined || theme === 'MINIMAL') && accentColor) {
    return { ...preset, accent: accentColor };
  }
  return preset;
}
