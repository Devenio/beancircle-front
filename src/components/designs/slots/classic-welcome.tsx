'use client';

import { resolveTheme, FONT_STACKS } from '@/components/cafe-menu/themes';
import { ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import type { WelcomeDesignProps } from '../registry';
import { heroImageFor } from './shared';

/** Default welcome screen: full-height hero photo with title + view button. */
export function ClassicWelcome({ menu, labels, onViewMenu, onAnimationEnd }: WelcomeDesignProps) {
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const heading = FONT_STACKS[theme.headingFont];
  const heroTint = theme.heroTint ?? theme.accent;
  const hero = heroImageFor(menu);

  return (
    <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
      <motion.div
        className="absolute inset-0"
        initial={{ scale: 1.08 }}
        animate={{ scale: 1 }}
        transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        onAnimationComplete={onAnimationEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero} alt="" className="h-full w-full object-cover" />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${heroTint}ee 0%, ${heroTint}99 35%, transparent 70%)`,
          }}
        />
      </motion.div>

      <div className="relative z-10 px-6 pb-16 pt-32">
        {menu.cafe.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={menu.cafe.logoUrl}
            alt=""
            className="mb-4 h-14 w-14 rounded-2xl object-cover ring-2 ring-white/40"
          />
        ) : null}
        <p className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-white/70">
          {menu.cafe.name}
        </p>
        <h1
          className="max-w-lg text-4xl leading-[1.1] text-white sm:text-5xl"
          style={{ fontFamily: heading }}
        >
          {menu.welcomeTitle || menu.cafe.name}
        </h1>
        {menu.welcomeMessage ? (
          <p className="mt-4 max-w-md text-base leading-relaxed text-white/85">
            {menu.welcomeMessage}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onViewMenu}
          className="mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition"
          style={{ backgroundColor: theme.surface, color: theme.accent }}
        >
          {labels.viewMenu}
          <ChevronDown className="h-4 w-4" />
        </button>
        <p className="mt-8 text-xs text-white/50">{labels.scrollHint}</p>
      </div>
    </section>
  );
}
