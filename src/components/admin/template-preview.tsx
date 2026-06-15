'use client';

import {
  FONT_STACKS,
  resolveTheme,
  type MenuThemeConfig,
} from '@/components/cafe-menu/themes';
import type { MenuTheme } from '@/components/cafe-menu/types';

/**
 * Faithful mini-preview of a menu template, rendered with the same theme
 * engine the public menu uses — so the admin sees exactly how a cafe's menu
 * will look once the template is applied.
 */
export function TemplatePreview({
  theme,
  themeConfig,
  accentColor,
  welcomeTitle,
  className,
}: {
  theme?: MenuTheme;
  themeConfig?: Record<string, unknown> | null;
  accentColor?: string;
  welcomeTitle?: string;
  className?: string;
}) {
  const t: MenuThemeConfig = resolveTheme(theme, themeConfig, accentColor);
  const headingFont = FONT_STACKS[t.headingFont];

  const card = (name: string, price: string) => (
    <div
      className="flex items-center justify-between px-3 py-2"
      style={{
        backgroundColor: t.surface,
        borderRadius: t.radius,
        border:
          t.cardStyle === 'outline' ? `1px solid ${t.border}` : '1px solid transparent',
        boxShadow:
          t.cardStyle === 'elevated' ? '0 1px 3px rgba(0,0,0,0.12)' : 'none',
      }}
    >
      <span className="text-[13px] font-medium" style={{ color: t.text }}>
        {name}
      </span>
      <span className="text-[13px] font-bold" style={{ color: t.accent }}>
        {price}
      </span>
    </div>
  );

  return (
    <div
      className={className}
      style={{ backgroundColor: t.bg, borderRadius: '0.75rem' }}
    >
      {/* hero */}
      <div
        className="px-4 pb-4 pt-5"
        style={{
          background: `linear-gradient(135deg, ${t.heroTint ?? t.accent}, ${t.surface})`,
        }}
      >
        <div
          className="text-[11px] font-medium uppercase tracking-[0.3em]"
          style={{ color: t.onAccent, opacity: 0.7 }}
        >
          Menu
        </div>
        <div
          className="mt-1 text-lg font-bold"
          style={{ color: t.onAccent, fontFamily: headingFont }}
        >
          {welcomeTitle || 'Your Cafe'}
        </div>
      </div>
      {/* category */}
      <div className="space-y-2 p-4">
        <div
          className="text-sm font-semibold"
          style={{ color: t.accent, fontFamily: headingFont }}
        >
          Coffee
        </div>
        {card('Espresso', '۴۵')}
        {card('Cappuccino', '۶۵')}
        <div className="flex gap-1.5 pt-1">
          {['Hot', 'Iced', 'Decaf'].map((chip, i) => (
            <span
              key={chip}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium"
              style={
                i === 0
                  ? { backgroundColor: t.accent, color: t.onAccent }
                  : { backgroundColor: t.chip, color: t.muted }
              }
            >
              {chip}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
