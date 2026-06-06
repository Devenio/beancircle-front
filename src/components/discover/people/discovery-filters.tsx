'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { INTEREST_OPTIONS, RADIUS_OPTIONS, type DiscoverFiltersState } from './types';

type Props = {
  filters: DiscoverFiltersState;
  onChange: (next: DiscoverFiltersState) => void;
};

export function DiscoveryFilters({ filters, onChange }: Props) {
  const t = useTranslations('discover.people');

  return (
    <div className="space-y-3">
      <FilterRow label={t('filters.distance')}>
        {RADIUS_OPTIONS.map((km) => (
          <Chip
            key={km}
            active={filters.radiusKm === km}
            onClick={() => onChange({ ...filters, radiusKm: km })}
          >
            {t('filters.km', { count: km })}
          </Chip>
        ))}
      </FilterRow>
      <FilterRow label={t('filters.interests')}>
        {INTEREST_OPTIONS.map((interest) => {
          const active = filters.interests.includes(interest);
          return (
            <Chip
              key={interest}
              active={active}
              onClick={() =>
                onChange({
                  ...filters,
                  interests: active
                    ? filters.interests.filter((i) => i !== interest)
                    : [...filters.interests, interest],
                })
              }
            >
              {t(`interests.${interest}`)}
            </Chip>
          );
        })}
      </FilterRow>
      <FilterRow label={t('filters.activity')}>
        {(['online', 'today', 'week'] as const).map((a) => (
          <Chip
            key={a}
            active={filters.activity === a}
            onClick={() =>
              onChange({
                ...filters,
                activity: filters.activity === a ? undefined : a,
              })
            }
          >
            {t(`filters.activity_${a}`)}
          </Chip>
        ))}
      </FilterRow>
      <FilterRow label={t('filters.relationship')}>
        {(['not_friends', 'friends_only', 'suggested'] as const).map((r) => (
          <Chip
            key={r}
            active={filters.relationship === r}
            onClick={() =>
              onChange({
                ...filters,
                relationship: filters.relationship === r ? undefined : r,
              })
            }
          >
            {t(`filters.relationship_${r}`)}
          </Chip>
        ))}
      </FilterRow>
    </div>
  );
}

function FilterRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</p>
      <div className="flex flex-wrap gap-2">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        active
          ? 'border-primary bg-primary/10 text-primary'
          : 'border-border text-muted-foreground hover:bg-muted/50',
      )}
    >
      {children}
    </button>
  );
}
