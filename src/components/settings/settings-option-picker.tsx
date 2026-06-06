'use client';

import { cn } from '@/lib/utils';

type Option = { value: string; label: string };

export function SettingsOptionPicker({
  options,
  value,
  onChange,
}: {
  options: Option[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2 px-4 pb-3">
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            'rounded-full border px-3 py-1.5 text-xs font-medium transition-colors',
            value === opt.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
