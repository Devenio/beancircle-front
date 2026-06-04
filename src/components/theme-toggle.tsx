'use client';

import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <div className="flex gap-2">
        <Button variant="outline" disabled className="flex-1">
          …
        </Button>
      </div>
    );
  }

  const options = [
    { value: 'light', label: t('themeLight'), hint: t('themeLightDesc'), icon: Sun },
    { value: 'dark', label: t('themeDark'), hint: t('themeDarkDesc'), icon: Moon },
    { value: 'system', label: t('themeSystem'), hint: t('themeSystemDesc'), icon: Monitor },
  ] as const;

  return (
    <div className="flex w-full">
      {options.map(({ value, label, hint, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          title={hint}
          aria-label={`${label}. ${hint}`}
          className={`flex min-h-[52px] flex-1 flex-col items-center justify-center gap-0.5 px-1 text-xs font-medium transition-colors ${
            theme === value ? 'text-primary' : 'text-muted-foreground active:bg-muted/60'
          }`}
        >
          <Icon className="size-5" strokeWidth={1.75} />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}
