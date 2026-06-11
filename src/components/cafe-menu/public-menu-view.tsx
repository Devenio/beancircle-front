'use client';

import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { CafeMenuData } from './types';

function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0,
  }).format(price);
}

type Props = {
  menu: CafeMenuData;
  locale: string;
  labels: {
    viewMenu: string;
    scrollHint: string;
    unavailable: string;
    poweredBy: string;
  };
};

export function PublicMenuView({ menu, locale, labels }: Props) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const accent = menu.accentColor || '#2C1810';
  const heroImage =
    menu.welcomeImageUrl ||
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

  return (
    <div className="min-h-dvh bg-[#FAF7F2] text-[#1A1410]">
      {/* Welcome splash */}
      <section className="relative flex min-h-dvh flex-col justify-end overflow-hidden">
        <motion.div
          className="absolute inset-0"
          initial={{ scale: 1.08 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={heroImage}
            alt=""
            className="h-full w-full object-cover"
          />
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(to top, ${accent}ee 0%, ${accent}99 35%, transparent 70%)`,
            }}
          />
        </motion.div>

        <div className="relative z-10 px-6 pb-16 pt-32">
          <motion.p
            className="mb-3 text-xs font-medium uppercase tracking-[0.35em] text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7 }}
          >
            {menu.cafe.name}
          </motion.p>
          <motion.h1
            className="max-w-lg font-serif text-4xl leading-[1.1] text-white sm:text-5xl"
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
            className="mt-10 inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold shadow-lg transition hover:bg-white/95"
            style={{ color: accent }}
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
      <div ref={menuRef} className="relative -mt-6 rounded-t-[2rem] bg-[#FAF7F2] px-4 pb-20 pt-8">
        {menu.categories.length > 0 ? (
          <>
            <div className="sticky top-0 z-20 -mx-4 bg-[#FAF7F2]/95 px-4 pb-3 pt-2 backdrop-blur-md">
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
                        ? { backgroundColor: accent, color: '#fff' }
                        : { backgroundColor: '#EDE6DC', color: accent }
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
                    className="mb-5 font-serif text-2xl"
                    style={{ color: accent }}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{ duration: 0.5, delay: catIndex * 0.05 }}
                  >
                    {cat.name}
                  </motion.h2>
                  <div className="grid gap-4 sm:grid-cols-2">
                    {cat.items.map((item, itemIndex) => (
                      <motion.article
                        key={item.id}
                        className="group overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5"
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: '-20px' }}
                        transition={{
                          duration: 0.45,
                          delay: itemIndex * 0.06,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        {item.imageUrl ? (
                          <div className="aspect-[4/3] overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                          </div>
                        ) : (
                          <div
                            className="aspect-[4/3]"
                            style={{
                              background: `linear-gradient(135deg, ${accent}22, ${accent}08)`,
                            }}
                          />
                        )}
                        <div className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <h3 className="font-semibold leading-snug">{item.name}</h3>
                            <span
                              className="shrink-0 text-sm font-bold"
                              style={{ color: accent }}
                            >
                              {formatPrice(item.price, locale)}
                            </span>
                          </div>
                          {item.description ? (
                            <p className="mt-1.5 text-sm leading-relaxed text-[#6B5E54]">
                              {item.description}
                            </p>
                          ) : null}
                          {!item.isAvailable ? (
                            <p className="mt-2 text-xs font-medium text-red-600/80">
                              {labels.unavailable}
                            </p>
                          ) : null}
                        </div>
                      </motion.article>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </>
        ) : (
          <p className="py-12 text-center text-muted-foreground">
            Menu coming soon…
          </p>
        )}

        <footer className="mt-16 border-t border-[#E8DFD4] pt-8 text-center">
          <p className="text-xs text-[#9A8E84]">{labels.poweredBy}</p>
        </footer>
      </div>

    </div>
  );
}
