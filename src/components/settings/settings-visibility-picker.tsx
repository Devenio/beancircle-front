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
    <div className="flex gap-0 border-t border-border/80">
      {OPTIONS.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            'min-h-[44px] flex-1 text-sm font-medium transition-colors',
            value === opt ? 'text-primary' : 'text-muted-foreground active:bg-muted/60',
          )}
        >
          {t(`visibility.${opt}`)}
        </button>
      ))}
    </div>
  );
}
