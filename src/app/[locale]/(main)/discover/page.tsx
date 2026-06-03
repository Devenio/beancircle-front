'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api/client';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/navigation';
import { ProfileAvatar as Avatar } from '@/components/chat/user-avatar';
import { CafeCard, type DiscoverCafe } from '@/components/discover/cafe-card';
import { DiscoverExtras } from '@/components/discover/discover-extras';
import { FilterChips, type DiscoverFilter } from '@/components/discover/filter-chips';

type DiscoverSections = {
  trending: DiscoverCafe[];
  new: DiscoverCafe[];
  hiddenGems: DiscoverCafe[];
  recommended: DiscoverCafe[];
};

function SectionRow({ title, cafes }: { title: string; cafes: DiscoverCafe[] }) {
  if (!cafes?.length) return null;
  return (
    <section className="mt-6">
      <h2 className="mb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="flex gap-3 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {cafes.map((cafe) => (
          <CafeCard key={cafe.id} cafe={cafe} compact />
        ))}
      </div>
    </section>
  );
}

export default function DiscoverPage() {
  const t = useTranslations('discover');
  const tSearch = useTranslations('search');
  const { locale } = useParams<{ locale: string }>();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<DiscoverFilter[]>([]);

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () => api<{ cityId?: string }>('/users/me', { locale }),
  });

  const filterQuery = useMemo(
    () => (filters.length ? `&filter=${filters.join(',')}` : ''),
    [filters],
  );

  const { data: sections, isLoading: sectionsLoading } = useQuery({
    queryKey: ['discover', 'sections', me?.cityId, locale],
    queryFn: () =>
      api<DiscoverSections>(
        `/discover/sections${me?.cityId ? `?cityId=${me.cityId}` : ''}`,
        { locale },
      ),
    enabled: q.length < 2,
  });

  const { data: filtered, isLoading: filterLoading } = useQuery({
    queryKey: ['discover', 'list', me?.cityId, q, filters, locale],
    queryFn: () =>
      api<DiscoverCafe[]>(
        `/discover?${me?.cityId ? `cityId=${me.cityId}&` : ''}q=${encodeURIComponent(q)}${filterQuery}`,
        { locale },
      ),
    enabled: q.length >= 2 || filters.length > 0 || !!me?.cityId,
  });

  const { data: searchUsers } = useQuery({
    queryKey: ['discover', 'search', q, locale],
    queryFn: () =>
      api<{ users: unknown[]; cafes: unknown[] }>(
        `/search?q=${encodeURIComponent(q)}`,
        { locale },
      ),
    enabled: q.length >= 2,
  });

  const showSections = q.length < 2 && filters.length === 0;

  return (
    <div className="p-4 pb-24">
      <h1 className="mb-1 text-lg font-bold">{t('title')}</h1>
      <p className="mb-4 text-sm text-muted-foreground">{t('subtitle')}</p>
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder={tSearch('placeholder')}
        className="mb-3"
      />
      <FilterChips active={filters} onChange={setFilters} />

      {(filterLoading || sectionsLoading) && (
        <p className="mt-4 text-sm text-muted-foreground">{t('loading')}</p>
      )}

      {!showSections && filtered && (
        <section className="mt-6 grid gap-3">
          {filtered.map((cafe) => (
            <CafeCard key={cafe.id} cafe={cafe} />
          ))}
        </section>
      )}

      {showSections && sections && (
        <>
          <SectionRow title={t('sections.trending')} cafes={sections.trending} />
          <DiscoverExtras locale={locale} cityId={me?.cityId} />
          <SectionRow title={t('sections.recommended')} cafes={sections.recommended} />
          <SectionRow title={t('sections.new')} cafes={sections.new} />
          <SectionRow title={t('sections.hiddenGems')} cafes={sections.hiddenGems} />
        </>
      )}

      {q.length >= 2 && searchUsers?.users && searchUsers.users.length > 0 && (
        <section className="mt-6">
          <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
            {tSearch('users')}
          </h2>
          {(searchUsers.users as { id: string; username?: string; name?: string; avatarUrl?: string }[]).map(
            (u) => (
              <Link
                key={u.id}
                href={u.username ? `/profile/${u.username}` : '/profile'}
                className="flex items-center gap-3 py-2"
              >
                <Avatar src={u.avatarUrl} name={u.name} />
                <span className="font-medium">{u.username ?? u.name}</span>
              </Link>
            ),
          )}
        </section>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        <Link href="/cafes" className="rounded-full border border-border px-3 py-1.5 text-sm">
          {t('browseCafes')}
        </Link>
        <Link href="/passport" className="rounded-full border border-border px-3 py-1.5 text-sm">
          {t('openPassport')}
        </Link>
      </div>
    </div>
  );
}
