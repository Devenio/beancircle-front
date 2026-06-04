'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Input } from '@/components/ui/input';
import { filterSettingsSearch } from '@/components/settings/settings-registry';
import { cn } from '@/lib/utils';

export function SettingsSearch({ className }: { className?: string }) {
  const t = useTranslations('settings');
  const [query, setQuery] = useState('');
  const results = useMemo(() => filterSettingsSearch(query, 'en'), [query]);

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t('searchPlaceholder')}
        className="min-h-12 rounded-xl ps-10 pe-10 text-base"
        aria-label={t('searchPlaceholder')}
      />
      {query ? (
        <button
          type="button"
          onClick={() => setQuery('')}
          className="absolute end-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-muted"
          aria-label={t('clearSearch')}
        >
          <X className="size-4" />
        </button>
      ) : null}
      {query && results.length > 0 ? (
        <ul
          className="absolute z-20 mt-2 max-h-72 w-full overflow-auto rounded-xl border border-border bg-popover p-1 shadow-lg"
          role="listbox"
        >
          {results.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-12 flex-col justify-center rounded-lg px-3 py-2 hover:bg-muted"
                onClick={() => setQuery('')}
              >
                <span className="text-sm font-medium">{t(item.labelKey)}</span>
                <span className="text-xs text-muted-foreground">{t(item.descriptionKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {query && results.length === 0 ? (
        <p className="absolute z-20 mt-2 w-full rounded-xl border border-border bg-popover px-3 py-4 text-center text-sm text-muted-foreground shadow-lg">
          {t('searchEmpty')}
        </p>
      ) : null}
    </div>
  );
}
