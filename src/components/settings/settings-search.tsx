'use client';

import { useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { filterSettingsSearch } from '@/components/settings/settings-registry';
import { cn } from '@/lib/utils';

export function SettingsSearch({ className }: { className?: string }) {
  const t = useTranslations('settings');
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const results = useMemo(() => filterSettingsSearch(query), [query]);

  return (
    <div className={cn('relative', className)}>
      <div
        className={cn(
          'flex min-h-9 items-center gap-2 rounded-[10px] bg-muted/80 px-3 transition-shadow',
          focused && 'ring-2 ring-ring/30',
        )}
      >
        <Search className="size-4 shrink-0 text-muted-foreground" strokeWidth={2} />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          placeholder={t('searchPlaceholder')}
          aria-label={t('searchPlaceholder')}
          className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-muted-foreground"
        />
        {query ? (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="flex size-6 items-center justify-center rounded-full bg-muted-foreground/20"
            aria-label={t('clearSearch')}
          >
            <X className="size-3.5" />
          </button>
        ) : null}
      </div>

      {query && results.length > 0 ? (
        <ul
          className="absolute z-30 mt-2 max-h-64 w-full overflow-auto rounded-xl border border-border bg-popover py-1 shadow-lg"
          role="listbox"
        >
          {results.map((item) => (
            <li key={item.id}>
              <Link
                href={item.href}
                className="flex min-h-11 flex-col justify-center px-4 py-2 active:bg-muted"
                onClick={() => setQuery('')}
              >
                <span className="text-[15px]">{t(item.labelKey)}</span>
                <span className="text-xs text-muted-foreground">{t(item.descriptionKey)}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {query && results.length === 0 ? (
        <p className="absolute z-30 mt-2 w-full rounded-xl border border-border bg-popover px-4 py-3 text-center text-sm text-muted-foreground shadow-lg">
          {t('searchEmpty')}
        </p>
      ) : null}
    </div>
  );
}
