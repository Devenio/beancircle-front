'use client';

import type { PublicMenuLabels } from '@/components/cafe-menu/public-menu-view';
import { resolveTheme } from '@/components/cafe-menu/themes';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { AnimatePresence, motion } from 'framer-motion';
import { useRef, useState } from 'react';
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
 * Public render entry point for the coded-design system.
 *
 * The menu is always rendered. The welcome screen sits on top as a fixed
 * full-viewport overlay. After the welcome entrance animations finish,
 * the overlay fades out and unmounts, revealing the menu underneath.
 */
export function PublicDesignedView({ menu, locale, labels, onItemView }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [showWelcome, setShowWelcome] = useState(true);
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
      <div ref={menuRef}>
        <MenuDesign
          menu={menu}
          locale={locale}
          labels={labels}
          onItemView={onItemView}
        />
      </div>

      <AnimatePresence>
        {showWelcome && (
          <motion.div
            key="welcome-overlay"
            className="fixed inset-0 z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
          >
            <WelcomeDesign
              menu={menu}
              locale={locale}
              labels={labels}
              onViewMenu={scrollToMenu}
              onAnimationEnd={() => setShowWelcome(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
