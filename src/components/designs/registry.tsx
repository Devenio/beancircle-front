'use client';

/**
 * Frontend half of the coded-design registry.
 *
 * The API owns the *metadata* registry (design-registry.ts) and decides access.
 * This file owns the *implementation* registry: it maps each design `key` to
 * the React component that renders it.
 *
 * To ship a new design:
 *   1. Write the component below (or in its own file) and add it to
 *      MENU_DESIGNS or WELCOME_DESIGNS under its key.
 *   2. Register the same key + metadata in the API's design-registry.ts.
 *
 * Keys here MUST match the API registry. The resolver always falls back to the
 * default design, so an unknown/unmapped key can never break the page.
 */

import type { PublicMenuLabels } from '@/components/cafe-menu/public-menu-view';
import type { CafeMenuData } from '@/components/cafe-menu/types';
import { ClassicMenuBody } from './slots/classic-menu';
import { ClassicWelcome } from './slots/classic-welcome';
import { EditorialMenu } from './slots/editorial-menu';
import { SpotlightWelcome } from './slots/spotlight-welcome';
import { SplashWelcome } from './slots/splash-welcome';

export const DEFAULT_MENU_DESIGN = 'classic-menu';
export const DEFAULT_WELCOME_DESIGN = 'classic-welcome';

export type MenuDesignProps = {
  menu: CafeMenuData;
  locale: string;
  labels: PublicMenuLabels;
  onItemView?: (itemId: string) => void;
};

export type WelcomeDesignProps = {
  menu: CafeMenuData;
  locale: string;
  labels: PublicMenuLabels;
  /** Smooth-scroll down to the menu body. */
  onViewMenu: () => void;
};

export const MENU_DESIGNS: Record<
  string,
  React.ComponentType<MenuDesignProps>
> = {
  'classic-menu': ClassicMenuBody,
  'editorial-menu': EditorialMenu,
};

export const WELCOME_DESIGNS: Record<
  string,
  React.ComponentType<WelcomeDesignProps>
> = {
  'classic-welcome': ClassicWelcome,
  'spotlight-welcome': SpotlightWelcome,
  'splash-welcome': SplashWelcome,
};

/** Resolve a menu design component, falling back to the default. */
export function resolveMenuDesign(key: string | null | undefined) {
  return (key && MENU_DESIGNS[key]) || MENU_DESIGNS[DEFAULT_MENU_DESIGN];
}

/** Resolve a welcome design component, falling back to the default. */
export function resolveWelcomeDesign(key: string | null | undefined) {
  return (
    (key && WELCOME_DESIGNS[key]) || WELCOME_DESIGNS[DEFAULT_WELCOME_DESIGN]
  );
}
