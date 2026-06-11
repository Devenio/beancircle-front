'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Clock3, Flame, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { FONT_STACKS, resolveTheme, type MenuThemeConfig } from './themes';
import type { CafeMenuData, MenuItem } from './types';

function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0,
  }).format(price);
}

export type PublicMenuLabels = {
  viewMenu: string;
  scrollHint: string;
  unavailable: string;
  poweredBy: string;
  off?: string;
  calories?: string;
  prepTime?: string;
  ingredients?: string;
  allergens?: string;
};

type Props = {
  menu: CafeMenuData;
  locale: string;
  labels: PublicMenuLabels;
  /** Called when a visitor opens an item detail sheet (view tracking). */
  onItemView?: (itemId: string) => void;
  /** Disable splash scroll behavior — used by the designer preview. */
  preview?: boolean;
};

function discountPercent(item: MenuItem) {
  if (!item.discountPrice || item.discountPrice >= item.price) return null;
  return Math.round((1 - item.discountPrice / item.price) * 100);
}

export function PublicMenuView({ menu, locale, labels, onItemView, preview }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const headingFont = FONT_STACKS[theme.headingFont];
  const heroTint = theme.heroTint ?? theme.accent;
  const heroImage =
    menu.welcomeImageUrl ||
    menu.cafe.coverUrl ||
    menu.cafe.photos?.[0]?.url ||
    'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80';

  useEffect(() => {
    if (menu.categories.length) {
      setActiveCategory(menu.categories[0].id);
    }
  }, [menu.categories]);

  function scrollToMenu() {
    requestAnimationFrame(() => {
      menuRef.current?.scrollIntoView({ behavior: 'smooth' });
    });
  }

  function openItemSheet(item: MenuItem) {
    setOpenItem(item);
    onItemView?.(item.id);
  }

  const cardClass =
    theme.cardStyle === 'elevated'
      ? 'shadow-sm'
      : theme.cardStyle === 'outline'
        ? 'border'
        : '';

  return (
    <div
      className="min-h-dvh"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {/* Welcome splash */}
      <section
        className={`relative flex flex-col justify-end overflow-hidden ${
          preview ? 'min-h-[70%]' : 'min-h-dvh'
        }`}
      >
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImage} alt="" className="h-full w-full object-cover" />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${heroTint}ee 0%, ${heroTint}99 35%, transparent 70%)`,
            }}
          />
        </motion.div>

        <div className="relative z-10 px-6 pb-16 pt-32">
          {menu.cafe.logoUrl ? (
            <motion.img
              src={menu.cafe.logoUrl}
              alt=""
              className="mb-4 h-14 w-14 rounded-2xl object-cover ring-2 ring-white/40"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
            />
          ) : null}
          <motion.p
            className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {menu.cafe.name}
          </motion.p>
          <motion.h1
            className="max-w-lg text-4xl leading-[1.1] text-white sm:text-5xl"
            style={{ fontFamily: headingFont }}
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45, duration: 0.8 }}
          >
            {menu.welcomeTitle || menu.cafe.name}
          </motion.h1>
          {menu.welcomeMessage ? (
            <motion.p
              className="mt-4 max-w-md text-base leading-relaxed text-white/85"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.7 }}
            >
              {menu.welcomeMessage}
            </motion.p>
          ) : null}

          <motion.button
            type="button"
            onClick={scrollToMenu}
            className="mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold shadow-lg transition"
            style={{ backgroundColor: theme.surface, color: theme.accent }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.75, duration: 0.6 }}
            whileTap={{ scale: 0.97 }}
          >
            {labels.viewMenu}
            <ChevronDown className="h-4 w-4" />
          </motion.button>

          <motion.p
            className="mt-8 text-xs text-white/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
          >
            {labels.scrollHint}
          </motion.p>
        </div>
      </section>

      {/* Menu body */}
      <div
        ref={menuRef}
        className="relative -mt-6 rounded-t-[2rem] px-4 pb-20 pt-8"
        style={{ backgroundColor: theme.bg }}
      >
        {menu.categories.length > 0 ? (
          <>
            <div
              className="sticky top-0 z-20 -mx-4 px-4 pb-3 pt-2 backdrop-blur-md"
              style={{ backgroundColor: `${theme.bg}F2` }}
            >
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
                {menu.categories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat.id);
                      document
                        .getElementById(`cat-${cat.id}`)
                        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }}
                    className="shrink-0 rounded-full px-4 py-2 text-sm font-medium transition"
                    style={
                      activeCategory === cat.id
                        ? { backgroundColor: theme.accent, color: theme.onAccent }
                        : { backgroundColor: theme.chip, color: theme.text }
                    }
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 space-y-12">
              {menu.categories.map((cat, catIndex) => (
                <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-24">
                  <motion.h2
                    className="mb-5 text-2xl"
                    style={{ color: theme.accent, fontFamily: headingFont }}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: catIndex * 0.05 }}
                  >
                    {cat.name}
                  </motion.h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cat.items.map((item, itemIndex) => (
                      <MenuItemCard
                        key={item.id}
                        item={item}
                        index={itemIndex}
                        theme={theme}
                        cardClass={cardClass}
                        locale={locale}
                        labels={labels}
                        onOpen={() => openItemSheet(item)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="py-12 text-center" style={{ color: theme.muted }}>
            Menu coming soon…
          </p>
        )}

        <footer
          className="mt-16 border-t pt-8 text-center"
          style={{ borderColor: theme.border }}
        >
          <p className="text-xs" style={{ color: theme.muted }}>
            {labels.poweredBy}
          </p>
        </footer>
      </div>

      {/* Item detail sheet */}
      <AnimatePresence>
        {openItem ? (
          <ItemDetailSheet
            item={openItem}
            theme={theme}
            locale={locale}
            labels={labels}
            headingFont={headingFont}
            onClose={() => setOpenItem(null)}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function MenuItemCard({
  item,
  index,
  theme,
  cardClass,
  locale,
  labels,
  onOpen,
}: {
  item: MenuItem;
  index: number;
  theme: MenuThemeConfig;
  cardClass: string;
  locale: string;
  labels: PublicMenuLabels;
  onOpen: () => void;
}) {
  const pct = discountPercent(item);
  const image = item.imageUrl || item.images?.[0];

  return (
    <motion.article
      className={`group cursor-pointer overflow-hidden ${cardClass}`}
      style={{
        backgroundColor: theme.surface,
        borderRadius: theme.radius,
        borderColor: theme.border,
        opacity: item.isAvailable ? 1 : 0.55,
      }}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: item.isAvailable ? 1 : 0.55, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      onClick={onOpen}
    >
      <div className="relative">
        {image ? (
          <div className="aspect-[4/3] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image}
              alt={item.name}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          </div>
        ) : (
          <div
            className="aspect-[4/3]"
            style={{
              background: `linear-gradient(135deg, ${theme.accent}22, ${theme.accent}08)`,
            }}
          />
        )}
        {pct ? (
          <span
            className="absolute start-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow"
            style={{ backgroundColor: theme.accent, color: theme.onAccent }}
          >
            {pct}% {labels.off ?? 'OFF'}
          </span>
        ) : null}
        {!item.isAvailable ? (
          <span className="absolute end-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-xs font-medium text-white">
            {labels.unavailable}
          </span>
        ) : null}
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-semibold leading-snug">{item.name}</h3>
          <span className="shrink-0 text-end">
            {item.discountPrice && item.discountPrice < item.price ? (
              <>
                <span className="block text-xs line-through" style={{ color: theme.muted }}>
                  {formatPrice(item.price, locale)}
                </span>
                <span className="text-sm font-bold" style={{ color: theme.accent }}>
                  {formatPrice(item.discountPrice, locale)}
                </span>
              </>
            ) : (
              <span className="text-sm font-bold" style={{ color: theme.accent }}>
                {formatPrice(item.price, locale)}
              </span>
            )}
          </span>
        </div>
        {item.description ? (
          <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed" style={{ color: theme.muted }}>
            {item.description}
          </p>
        ) : null}
        {(item.calories || item.prepTimeMin || item.allergens?.length) ? (
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs" style={{ color: theme.muted }}>
            {item.calories ? (
              <span className="inline-flex items-center gap-1">
                <Flame className="h-3 w-3" />
                {item.calories} {labels.calories ?? 'kcal'}
              </span>
            ) : null}
            {item.prepTimeMin ? (
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {item.prepTimeMin} {labels.prepTime ?? 'min'}
              </span>
            ) : null}
            {item.allergens?.slice(0, 2).map((a) => (
              <span
                key={a}
                className="rounded-full px-2 py-0.5"
                style={{ backgroundColor: theme.chip }}
              >
                {a}
              </span>
            ))}
          </div>
        ) : null}
      </div>
    </motion.article>
  );
}

function ItemDetailSheet({
  item,
  theme,
  locale,
  labels,
  headingFont,
  onClose,
}: {
  item: MenuItem;
  theme: MenuThemeConfig;
  locale: string;
  labels: PublicMenuLabels;
  headingFont: string;
  onClose: () => void;
}) {
  const gallery = [
    ...(item.imageUrl ? [item.imageUrl] : []),
    ...(item.images ?? []).filter((u) => u !== item.imageUrl),
  ];
  const pct = discountPercent(item);

  return (
    <>
      <motion.div
        className="fixed inset-0 z-40 bg-black/60"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85dvh] w-full max-w-[430px] overflow-y-auto rounded-t-[1.75rem]"
        style={{ backgroundColor: theme.surface, color: theme.text }}
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute end-3 top-3 z-10 rounded-full bg-black/40 p-2 text-white"
          aria-label="Close"
        >
          <X className="h-4 w-4" />
        </button>

        {item.videoUrl ? (
          <video
            src={item.videoUrl}
            className="aspect-video w-full object-cover"
            autoPlay
            loop
            muted
            playsInline
          />
        ) : gallery.length ? (
          <div className="flex snap-x snap-mandatory overflow-x-auto">
            {gallery.map((url) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={url}
                src={url}
                alt={item.name}
                className="aspect-[4/3] w-full shrink-0 snap-center object-cover"
              />
            ))}
          </div>
        ) : null}

        <div className="space-y-4 p-5 pb-10">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl" style={{ fontFamily: headingFont }}>
              {item.name}
            </h2>
            <div className="shrink-0 text-end">
              {item.discountPrice && item.discountPrice < item.price ? (
                <>
                  <p className="text-sm line-through" style={{ color: theme.muted }}>
                    {formatPrice(item.price, locale)}
                  </p>
                  <p className="text-lg font-bold" style={{ color: theme.accent }}>
                    {formatPrice(item.discountPrice, locale)}
                  </p>
                  {pct ? (
                    <span
                      className="mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-bold"
                      style={{ backgroundColor: theme.accent, color: theme.onAccent }}
                    >
                      {pct}% {labels.off ?? 'OFF'}
                    </span>
                  ) : null}
                </>
              ) : (
                <p className="text-lg font-bold" style={{ color: theme.accent }}>
                  {formatPrice(item.price, locale)}
                </p>
              )}
            </div>
          </div>

          {!item.isAvailable ? (
            <p
              className="rounded-lg px-3 py-2 text-sm font-medium"
              style={{ backgroundColor: theme.chip }}
            >
              {labels.unavailable}
            </p>
          ) : null}

          {item.description ? (
            <p className="text-sm leading-relaxed" style={{ color: theme.muted }}>
              {item.description}
            </p>
          ) : null}

          <div className="flex flex-wrap gap-3 text-sm" style={{ color: theme.muted }}>
            {item.calories ? (
              <span className="inline-flex items-center gap-1.5">
                <Flame className="h-4 w-4" />
                {item.calories} {labels.calories ?? 'kcal'}
              </span>
            ) : null}
            {item.prepTimeMin ? (
              <span className="inline-flex items-center gap-1.5">
                <Clock3 className="h-4 w-4" />
                {item.prepTimeMin} {labels.prepTime ?? 'min'}
              </span>
            ) : null}
          </div>

          {item.ingredients?.length ? (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
                {labels.ingredients ?? 'Ingredients'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.ingredients.map((ing) => (
                  <span
                    key={ing}
                    className="rounded-full px-2.5 py-1 text-xs"
                    style={{ backgroundColor: theme.chip }}
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          {item.allergens?.length ? (
            <div>
              <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
                {labels.allergens ?? 'Allergens'}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {item.allergens.map((a) => (
                  <span
                    key={a}
                    className="rounded-full border px-2.5 py-1 text-xs"
                    style={{ borderColor: theme.accent, color: theme.accent }}
                  >
                    {a}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </motion.div>
    </>
  );
}
