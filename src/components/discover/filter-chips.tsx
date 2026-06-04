'use client';

import { useTranslations } from 'next-intl';

export const DISCOVER_FILTERS = [
  'bestCoffee',
  'bestWorkspace',
  'quiet',
  'studyFriendly',
  'fastWifi',
  'outdoorSeating',
  'dateFriendly',
  'petFriendly',
] as const;

export type DiscoverFilter = (typeof DISCOVER_FILTERS)[number];

type FilterChipsProps = {
  active: DiscoverFilter[];
  onChange: (filters: DiscoverFilter[]) => void;
};

export function FilterChips({ active, onChange }: FilterChipsProps) {
  const t = useTranslations('discover.filters');

  function toggle(key: DiscoverFilter) {
    if (active.includes(key)) {
      onChange(active.filter((f) => f !== key));
    } else {
      onChange([...active, key]);
    }
  }

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {DISCOVER_FILTERS.map((key) => {
        const selected = active.includes(key);
        return (
          <button
            key={key}
            type="button"
            onClick={() => toggle(key)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              selected
                ? 'border-primary bg-primary text-primary-foreground'
                : 'border-border bg-background text-muted-foreground'
            }`}
          >
            {t(key)}
          </button>
        );
      })}
    </div>
  );
}
