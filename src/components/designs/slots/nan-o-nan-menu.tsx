'use client';

import { FONT_STACKS, resolveTheme } from '@/components/cafe-menu/themes';
import { Clock3, Flame } from 'lucide-react';
import { useState } from 'react';
import type { MenuDesignProps } from '../registry';
import { discountPercent, formatPrice } from './shared';

/**
 * "Nan o Nan" menu body — a warm Persian bakery & coffee layout.
 *
 * Glassy category pills with live item counts, serif section headings, and
 * tall rounded cards. Items without a photo get a soft saffron gradient tile
 * derived from the cafe's accent color, so the signature look holds up across
 * every theme while still respecting the cafe's palette via `resolveTheme`.
 *
 * Renders the menu body only; the welcome screen is a separate coded design
 * layered on top by `PublicDesignedView`. Tapping a card opens the platform's
 * shared item sheet through `onItemView`.
 */

/** A 3-stop warm gradient derived from the theme accent, varied per card. */
function accentTile(accent: string, i: number) {
  const at = ['26% 16%', '72% 20%', '24% 78%', '78% 72%'][i % 4];
  return (
    `radial-gradient(130% 125% at ${at},` +
    ` color-mix(in srgb, ${accent} 42%, #ffffff) 0%,` +
    ` ${accent} 50%,` +
    ` color-mix(in srgb, ${accent} 58%, #000000) 100%)`
  );
}

export function NanONanMenu({
  menu,
  locale,
  labels,
  onItemView,
}: MenuDesignProps) {
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const heading = FONT_STACKS[theme.headingFont];
  // Highlighted pill: the user's choice, otherwise the first category.
  // Derived at render so we never need a state-syncing effect.
  const [active, setActive] = useState<string | null>(null);
  const activeId = active ?? menu.categories[0]?.id ?? null;

  const cardShadow =
    theme.cardStyle === 'elevated'
      ? '0 18px 44px -26px rgba(60,40,18,0.55)'
      : 'none';
  const cardBorder = theme.cardStyle === 'flat' ? 'transparent' : theme.border;

  return (
    <div
      className="relative -mt-6 rounded-t-[2rem] px-4 pb-24 pt-9"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {menu.categories.length === 0 ? (
        <p className="py-20 text-center text-sm" style={{ color: theme.muted }}>
          {labels.unavailable}
        </p>
      ) : (
        <>
          {/* sticky glass category rail */}
          <div
            className="sticky top-0 z-20 -mx-4 px-4 pb-3 pt-2 backdrop-blur-md"
            style={{ backgroundColor: `${theme.bg}F2` }}
          >
            <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
              {menu.categories.map((cat) => {
                const on = activeId === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setActive(cat.id);
                      document.getElementById(`cat-${cat.id}`)?.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start',
                      });
                    }}
                    className="flex flex-shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition active:scale-95"
                    style={{
                      backgroundColor: on ? theme.accent : theme.chip,
                      color: on ? theme.onAccent : theme.text,
                      border: `1px solid ${on ? 'transparent' : theme.border}`,
                      boxShadow: on
                        ? '0 12px 26px -12px color-mix(in srgb, ' +
                          theme.accent +
                          ' 70%, transparent)'
                        : 'none',
                    }}
                  >
                    {cat.name}
                    <span className="text-[11px] font-semibold opacity-60">
                      {cat.items.length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {menu.categories.map((cat) => (
            <section
              key={cat.id}
              id={`cat-${cat.id}`}
              className="scroll-mt-24 pt-9"
            >
              <div className="mb-4 flex items-baseline justify-between gap-3 px-0.5">
                <h2
                  className="text-2xl tracking-tight"
                  style={{ fontFamily: heading, color: theme.text }}
                >
                  {cat.name}
                </h2>
                <span
                  className="flex-shrink-0 text-[13px] font-medium"
                  style={{ color: theme.muted }}
                >
                  {cat.items.length}
                </span>
              </div>

              <div className="space-y-3.5">
                {cat.items.map((item, i) => {
                  const off = discountPercent(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemView?.(item.id)}
                      disabled={!item.isAvailable}
                      className="group flex w-full gap-3.5 rounded-[1.5rem] p-3.5 text-left transition active:scale-[0.99] disabled:opacity-50"
                      style={{
                        backgroundColor: theme.surface,
                        border: `1px solid ${cardBorder}`,
                        boxShadow: cardShadow,
                      }}
                    >
                      {/* image / saffron tile */}
                      <div
                        className="relative h-[88px] w-[88px] flex-shrink-0 overflow-hidden rounded-[1.1rem]"
                        style={{
                          background: item.imageUrl
                            ? undefined
                            : accentTile(theme.accent, i),
                        }}
                      >
                        {item.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={item.imageUrl}
                            alt=""
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <span
                            className="absolute inset-0"
                            style={{
                              background:
                                'radial-gradient(58% 46% at 68% 22%, rgba(255,240,210,0.5), transparent 62%)',
                            }}
                          />
                        )}
                        {off ? (
                          <span
                            className="absolute bottom-1.5 left-1.5 rounded-full px-2 py-0.5 text-[9.5px] font-bold tracking-wide"
                            style={{
                              backgroundColor: theme.accent,
                              color: theme.onAccent,
                            }}
                          >
                            {off}% {labels.off ?? 'OFF'}
                          </span>
                        ) : null}
                      </div>

                      {/* details */}
                      <div className="min-w-0 flex-1 pt-0.5">
                        <div className="flex items-start justify-between gap-3">
                          <h3
                            className="min-w-0 text-[17px] leading-tight"
                            style={{ fontFamily: heading }}
                          >
                            {item.name}
                          </h3>
                          <span className="flex flex-shrink-0 items-baseline gap-1.5 whitespace-nowrap">
                            {off ? (
                              <span
                                className="text-[11px] line-through"
                                style={{ color: theme.muted }}
                              >
                                {formatPrice(item.price, locale)}
                              </span>
                            ) : null}
                            <span
                              className="text-[15px] font-semibold"
                              style={{ color: theme.accent }}
                            >
                              {formatPrice(
                                item.discountPrice ?? item.price,
                                locale,
                              )}
                            </span>
                          </span>
                        </div>

                        {item.description ? (
                          <p
                            className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed"
                            style={{ color: theme.muted }}
                          >
                            {item.description}
                          </p>
                        ) : null}

                        {(item.prepTimeMin || item.calories) && (
                          <div
                            className="mt-2 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[11.5px] font-medium"
                            style={{ color: theme.muted }}
                          >
                            {item.prepTimeMin ? (
                              <span className="inline-flex items-center gap-1">
                                <Clock3 className="h-3 w-3" />
                                {item.prepTimeMin} {labels.prepTime ?? 'min'}
                              </span>
                            ) : null}
                            {item.calories ? (
                              <span className="inline-flex items-center gap-1">
                                <Flame className="h-3 w-3" />
                                {item.calories} {labels.calories ?? 'kcal'}
                              </span>
                            ) : null}
                          </div>
                        )}

                        {item.allergens && item.allergens.length > 0 ? (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {item.allergens.slice(0, 4).map((a) => (
                              <span
                                key={a}
                                className="rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize"
                                style={{ backgroundColor: theme.chip, color: theme.muted }}
                              >
                                {a}
                              </span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      <p className="mt-12 text-center text-xs" style={{ color: theme.muted }}>
        {labels.poweredBy}
      </p>
    </div>
  );
}
