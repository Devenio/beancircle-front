'use client';

import { resolveTheme, FONT_STACKS } from '@/components/cafe-menu/themes';
import type { MenuDesignProps } from '../registry';
import { discountPercent, formatPrice } from './shared';

/**
 * Editorial menu body: a magazine-style layout with full-width imagery,
 * large serif category headings, and a two-line item row. A visually distinct
 * alternative to the classic card list.
 */
export function EditorialMenu({
  menu,
  locale,
  labels,
  onItemView,
}: MenuDesignProps) {
  const theme = resolveTheme(menu.theme, menu.themeConfig, menu.accentColor);
  const heading = FONT_STACKS[theme.headingFont];

  return (
    <div
      className="relative -mt-6 rounded-t-[2rem] px-5 pb-24 pt-10"
      style={{ backgroundColor: theme.bg, color: theme.text }}
    >
      {menu.categories.length === 0 ? (
        <p className="py-20 text-center text-sm" style={{ color: theme.muted }}>
          {labels.unavailable}
        </p>
      ) : (
        menu.categories.map((cat, idx) => (
          <section key={cat.id} className="mb-14">
            <div className="mb-6 flex items-center gap-4">
              <span
                className="text-xs font-semibold tabular-nums"
                style={{ color: theme.accent }}
              >
                {String(idx + 1).padStart(2, '0')}
              </span>
              <h2
                className="text-3xl tracking-tight"
                style={{ fontFamily: heading }}
              >
                {cat.name}
              </h2>
              <span
                className="h-px flex-1"
                style={{ backgroundColor: theme.border }}
              />
            </div>

            <div className="divide-y" style={{ borderColor: theme.border }}>
              {cat.items.map((item) => {
                const off = discountPercent(item);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => onItemView?.(item.id)}
                    disabled={!item.isAvailable}
                    className="flex w-full items-start gap-4 py-5 text-left transition disabled:opacity-50"
                  >
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                      />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3
                          className="text-lg"
                          style={{ fontFamily: heading }}
                        >
                          {item.name}
                        </h3>
                        <span
                          className="flex items-baseline gap-2 whitespace-nowrap font-semibold"
                          style={{ color: theme.accent }}
                        >
                          {off ? (
                            <span
                              className="text-xs line-through"
                              style={{ color: theme.muted }}
                            >
                              {formatPrice(item.price, locale)}
                            </span>
                          ) : null}
                          {formatPrice(item.discountPrice ?? item.price, locale)}
                        </span>
                      </div>
                      {item.description ? (
                        <p
                          className="mt-1.5 text-sm leading-relaxed"
                          style={{ color: theme.muted }}
                        >
                          {item.description}
                        </p>
                      ) : null}
                      {off ? (
                        <span
                          className="mt-2 inline-block rounded-full px-2 py-0.5 text-[11px] font-medium"
                          style={{
                            backgroundColor: theme.accent,
                            color: theme.onAccent,
                          }}
                        >
                          {off}% {labels.off ?? 'off'}
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        ))
      )}
      <p className="mt-8 text-center text-xs" style={{ color: theme.muted }}>
        {labels.poweredBy}
      </p>
    </div>
  );
}
