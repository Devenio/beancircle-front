'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import type { VisibilityOption } from '@/stores/settings-store';

const OPTIONS: VisibilityOption[] = ['everyone', 'contacts', 'nobody'];

export function SettingsVisibilityPicker({
  value,
  onChange,
}: {
  value: VisibilityOption;
  onChange: (v: VisibilityOption) => void;
}) {
  const t = useTranslations('settings');

  return (
    <div className="flex flex-wrap gap-2 px-3 pb-3">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'min-h-10 rounded-full border px-4 text-sm font-medium transition-colors',
            value === opt
              ? 'border-primary bg-primary text-primary-foreground'
              : 'border-border bg-background hover:bg-muted',
          )}
        >
          {t(`visibility.${opt}`)}
        </button>
      ))}
    </div>
  );
}
