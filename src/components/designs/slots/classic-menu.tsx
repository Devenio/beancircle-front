'use client';

import { resolveTheme, FONT_STACKS } from '@/components/cafe-menu/themes';
import { Flame } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { MenuDesignProps } from '../registry';
import { discountPercent, formatPrice } from './shared';

/**
 * Default menu body: a sticky category rail with a stacked card list.
 * Rendered below whichever welcome design the cafe selected.
 */
export function ClassicMenuBody({
  menu,
  locale,
  labels,
  onItemView,
}: MenuDesignProps) {
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const heading = FONT_STACKS[theme.headingFont];
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    if (menu.categories.length) setActive(menu.categories[0].id);
  }, [menu.categories]);

  const cardClass =
    theme.cardStyle === 'elevated'
      ? 'shadow-sm'
      : theme.cardStyle === 'outline'
        ? 'border'
        : '';

  return (
    <div
      className="relative -mt-6 rounded-t-[2rem] px-4 pb-20 pt-8"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {menu.categories.length === 0 ? (
        <p className="py-20 text-center text-sm" style={{ color: theme.muted }}>
          {labels.unavailable}
        </p>
      ) : (
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
                    setActive(cat.id);
                    document
                      .getElementById(`cat-${cat.id}`)
                      ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }}
                  className="whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition"
                  style={{
                    backgroundColor:
                      active === cat.id ? theme.accent : theme.chip,
                    color: active === cat.id ? theme.onAccent : theme.text,
                  }}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {menu.categories.map((cat) => (
            <section key={cat.id} id={`cat-${cat.id}`} className="scroll-mt-20 pt-8">
              <h2
                className="mb-4 text-2xl"
                style={{ fontFamily: heading, color: theme.text }}
              >
                {cat.name}
              </h2>
              <div className="space-y-3">
                {cat.items.map((item) => {
                  const off = discountPercent(item);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onItemView?.(item.id)}
                      disabled={!item.isAvailable}
                      className={`flex w-full gap-3 rounded-2xl p-3 text-left transition disabled:opacity-50 ${cardClass}`}
                      style={{
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      }}
                    >
                      {item.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.imageUrl}
                          alt=""
                          className="h-20 w-20 flex-shrink-0 rounded-xl object-cover"
                        />
                      ) : null}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="font-medium">{item.name}</span>
                          <span
                            className="flex-shrink-0 font-semibold"
                            style={{ color: theme.accent }}
                          >
                            {formatPrice(
                              item.discountPrice ?? item.price,
                              locale,
                            )}
                          </span>
                        </div>
                        {item.description ? (
                          <p
                            className="mt-1 line-clamp-2 text-sm"
                            style={{ color: theme.muted }}
                          >
                            {item.description}
                          </p>
                        ) : null}
                        <div
                          className="mt-1 flex items-center gap-3 text-xs"
                          style={{ color: theme.muted }}
                        >
                          {off ? (
                            <span style={{ color: theme.accent }}>
                              {off}% {labels.off ?? 'off'}
                            </span>
                          ) : null}
                          {item.calories ? (
                            <span className="inline-flex items-center gap-1">
                              <Flame className="h-3 w-3" />
                              {item.calories}
                            </span>
                          ) : null}
                        </div>
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
