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
    { value: 'light', label: t('themeLight'), icon: Sun },
    { value: 'dark', label: t('themeDark'), icon: Moon },
    { value: 'system', label: t('themeSystem'), icon: Monitor },
  ] as const;

  return (
    <div className="flex gap-2">
      {options.map(({ value, label, icon: Icon }) => (
        <Button
          key={value}
          variant={theme === value ? 'default' : 'outline'}
          onClick={() => setTheme(value)}
          className="flex flex-1 flex-col gap-1 py-3"
        >
          <Icon className="size-4" />
          <span className="text-xs">{label}</span>
        </Button>
      ))}
    </div>
  );
}
