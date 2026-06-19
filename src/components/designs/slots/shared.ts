import type { MenuItem } from '@/components/cafe-menu/types';

export function formatPrice(price: number, locale: string) {
  return new Intl.NumberFormat(locale === 'fa' ? 'fa-IR' : 'en-US', {
    style: 'currency',
    currency: 'IRR',
    maximumFractionDigits: 0,
  }).format(price);
}

export function discountPercent(item: MenuItem) {
  if (!item.discountPrice || item.discountPrice >= item.price) return null;
  return Math.round((1 - item.discountPrice / item.price) * 100);
}

export const FALLBACK_HERO =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&q=80';

export function heroImageFor(menu: {
  welcomeImageUrl?: string | null;
  cafe: { coverUrl?: string | null; photos?: { url: string }[] };
}) {
  return (
    menu.welcomeImageUrl ||
    menu.cafe.coverUrl ||
    menu.cafe.photos?.[0]?.url ||
    FALLBACK_HERO
  );
}
