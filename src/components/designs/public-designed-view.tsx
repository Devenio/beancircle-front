'use client';

import type { PublicMenuLabels } from '@/components/cafe-menu/public-menu-view';
import { resolveTheme } from '@/components/cafe-menu/themes';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { useRef } from 'react';
import {
  resolveMenuDesign,
  resolveWelcomeDesign,
} from './registry';

type Props = {
  menu: CafeMenuData;
  locale: string;
  labels: PublicMenuLabels;
  onItemView?: (itemId: string) => void;
};

/**
 * Public render entry point for the coded-design system. Composes the cafe's
 * selected welcome design (top) with its selected menu design (body). The
 * design keys come pre-resolved from the API (access-checked, with default
 * fallback), so this component never decides access — it only renders.
 */
export function PublicDesignedView({ menu, locale, labels, onItemView }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);

  const WelcomeDesign = resolveWelcomeDesign(menu.welcomeDesignKey);
  const MenuDesign = resolveMenuDesign(menu.menuDesignKey);

  function scrollToMenu() {
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  return (
    <div className="min-h-dvh" style={{ backgroundColor: theme.bg, color: theme.text }}>
      <WelcomeDesign
        menu={menu}
        locale={locale}
        labels={labels}
        onViewMenu={scrollToMenu}
      />
      <div ref={menuRef}>
        <MenuDesign
          menu={menu}
          locale={locale}
          labels={labels}
          onItemView={onItemView}
        />
      </div>
    </div>
  );
}
