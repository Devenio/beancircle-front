'use client';

import { resolveTheme, FONT_STACKS } from '@/components/cafe-menu/themes';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WelcomeDesignProps } from '../registry';
import { heroImageFor } from './shared';

/**
 * Alternative welcome screen: a full-bleed darkened hero with the title and
 * call-to-action centered — a bolder, more "landing page" feel.
 */
export function SpotlightWelcome({
  menu,
  labels,
  onViewMenu,
}: WelcomeDesignProps) {
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const heading = FONT_STACKS[theme.headingFont];
  const hero = heroImageFor(menu);

  return (
    <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden text-center">
      <div className="absolute inset-0">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt="" className="h-full w-full object-cover" />
        <div className="absolute inset-0 bg-black/55" />
      </div>

      <motion.div
        className="relative z-10 flex flex-col items-center px-6"
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {menu.cafe.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={menu.cafe.logoUrl}
            alt=""
            className="mb-6 h-20 w-20 rounded-full object-cover ring-2 ring-white/50"
          />
        ) : null}
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.5em] text-white/70">
          {menu.cafe.name}
        </p>
        <h1
          className="max-w-2xl text-5xl leading-[1.05] text-white sm:text-6xl"
          style={{ fontFamily: heading }}
        >
          {menu.welcomeTitle || menu.cafe.name}
        </h1>
        {menu.welcomeMessage ? (
          <p className="mt-6 max-w-md text-base leading-relaxed text-white/80">
            {menu.welcomeMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onViewMenu}
          className="mt-12 inline-flex items-center gap-2 rounded-full px-8 py-3.5 text-sm font-semibold shadow-xl transition hover:scale-[1.03]"
          style={{ backgroundColor: theme.accent, color: theme.onAccent }}
        >
          {labels.viewMenu}
          <ArrowDown className="h-4 w-4" />
        </button>
      </motion.div>

      <motion.div
        className="absolute bottom-8 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.8, repeat: Infinity }}
      >
        <ArrowDown className="h-5 w-5 text-white/50" />
      </motion.div>
    </section>
  );
}
