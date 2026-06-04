'use client';

import { AnimatePresence, LazyMotion, domAnimation, m } from 'framer-motion';
import { Check, ChevronDown, Loader2 } from 'lucide-react';
import { useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

export type Country = {
  code: string;
  name: string;
  dial: string;
  flag: string;
  groups: number[];
};

export const COUNTRIES: Country[] = [
  { code: 'IR', name: 'Iran', dial: '+98', flag: '🇮🇷', groups: [3, 3, 4] },
  { code: 'US', name: 'United States', dial: '+1', flag: '🇺🇸', groups: [3, 3, 4] },
  { code: 'GB', name: 'United Kingdom', dial: '+44', flag: '🇬🇧', groups: [4, 6] },
  { code: 'DE', name: 'Germany', dial: '+49', flag: '🇩🇪', groups: [4, 7] },
  { code: 'TR', name: 'Türkiye', dial: '+90', flag: '🇹🇷', groups: [3, 3, 4] },
  { code: 'AE', name: 'UAE', dial: '+971', flag: '🇦🇪', groups: [2, 3, 4] },
  { code: 'CA', name: 'Canada', dial: '+1', flag: '🇨🇦', groups: [3, 3, 4] },
  { code: 'FR', name: 'France', dial: '+33', flag: '🇫🇷', groups: [1, 2, 2, 2, 2] },
];

export function formatNational(digits: string, groups: number[]) {
  const parts: string[] = [];
  let i = 0;
  for (const g of groups) {
    if (i >= digits.length) break;
    parts.push(digits.slice(i, i + g));
    i += g;
  }
  if (i < digits.length) parts.push(digits.slice(i));
  return parts.join(' ');
}

type Status = 'idle' | 'error' | 'loading' | 'success';

export function PhoneField({
  country,
  onCountryChange,
  value,
  onChange,
  onEnter,
  status = 'idle',
  label,
  selectLabel,
}: {
  country: Country;
  onCountryChange: (c: Country) => void;
  value: string;
  onChange: (digits: string) => void;
  onEnter?: () => void;
  status?: Status;
  label: string;
  selectLabel: string;
}) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [focused, setFocused] = useState(false);
  const [open, setOpen] = useState(false);

  const floated = focused || value.length > 0;
  const borderClass =
    status === 'error'
      ? 'border-red-400/70'
      : status === 'success'
        ? 'border-emerald-400/70'
        : focused
          ? 'border-amber-400/80'
          : 'border-white/12';

  return (
    <LazyMotion features={domAnimation}>
      <div className="relative">
        <div
          className={cn(
            'relative flex items-stretch rounded-2xl border bg-white/5 backdrop-blur-md transition-colors duration-200',
            borderClass,
          )}
          style={
            focused && status !== 'error'
              ? { boxShadow: '0 0 0 4px rgba(245,184,120,0.12)' }
              : undefined
          }
        >
          {/* Country selector */}
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            aria-label={selectLabel}
            aria-haspopup="listbox"
            aria-expanded={open}
            className="flex items-center gap-1.5 rounded-s-2xl px-3.5 text-white/90 transition-colors hover:bg-white/5"
          >
            <span className="text-lg leading-none">{country.flag}</span>
            <span className="text-sm font-medium tabular-nums">{country.dial}</span>
            <ChevronDown
              className={cn(
                'size-3.5 text-white/50 transition-transform duration-200',
                open && 'rotate-180',
              )}
            />
          </button>
          <span className="my-2.5 w-px bg-white/10" />

          {/* Floating label + input */}
          <div className="relative flex-1">
            <label
              htmlFor={id}
              className={cn(
                'pointer-events-none absolute start-3.5 origin-start text-white/50 transition-all duration-200',
                floated
                  ? 'top-1.5 text-[11px]'
                  : 'top-1/2 -translate-y-1/2 text-base',
              )}
            >
              {label}
            </label>
            <input
              id={id}
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="tel-national"
              dir="ltr"
              aria-invalid={status === 'error'}
              value={formatNational(value, country.groups)}
              onChange={(e) =>
                onChange(e.target.value.replace(/\D/g, '').slice(0, 13))
              }
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && onEnter?.()}
              className="h-14 w-full bg-transparent px-3.5 pt-4 text-start text-base font-medium tracking-wide text-white outline-none placeholder:text-transparent"
            />
          </div>

          {/* Status icon */}
          <div className="flex w-10 items-center justify-center">
            <AnimatePresence mode="wait">
              {status === 'loading' ? (
                <m.span
                  key="loading"
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.6 }}
                >
                  <Loader2 className="size-4 animate-spin text-amber-300" />
                </m.span>
              ) : status === 'success' ? (
                <m.span
                  key="success"
                  initial={{ opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.4 }}
                >
                  <Check className="size-4 text-emerald-400" />
                </m.span>
              ) : null}
            </AnimatePresence>
          </div>

          {/* Animated focus underline */}
          <m.span
            className="absolute inset-x-3 bottom-0 h-px origin-center rounded-full bg-gradient-to-r from-amber-300 to-orange-500"
            initial={false}
            animate={{ scaleX: focused && status !== 'error' ? 1 : 0, opacity: focused ? 1 : 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        </div>

        {/* Country dropdown */}
        <AnimatePresence>
          {open ? (
            <>
              <button
                type="button"
                aria-hidden
                tabIndex={-1}
                className="fixed inset-0 z-30 cursor-default"
                onClick={() => setOpen(false)}
              />
              <m.ul
                role="listbox"
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                className="absolute z-40 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-white/10 bg-[#1a120d]/95 p-1.5 shadow-2xl backdrop-blur-xl"
              >
                {COUNTRIES.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={c.code === country.code}
                      onClick={() => {
                        onCountryChange(c);
                        setOpen(false);
                        inputRef.current?.focus();
                      }}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-sm text-white/90 transition-colors hover:bg-white/8',
                        c.code === country.code && 'bg-white/10',
                      )}
                    >
                      <span className="text-lg">{c.flag}</span>
                      <span className="flex-1">{c.name}</span>
                      <span className="text-white/50 tabular-nums">{c.dial}</span>
                    </button>
                  </li>
                ))}
              </m.ul>
            </>
          ) : null}
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
