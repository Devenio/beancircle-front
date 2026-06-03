'use client';

import { LazyMotion, domAnimation, m } from 'framer-motion';
import { useCallback, useEffect, useId, useRef } from 'react';
import { cn } from '@/lib/utils';

const BOX = 6;

export function OtpInput({
  value,
  onChange,
  onComplete,
  error = false,
  disabled = false,
  autoFocus = false,
}: {
  value: string;
  onChange: (digits: string) => void;
  onComplete?: (code: string) => void;
  error?: boolean;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const groupId = useId();
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.replace(/\D/g, '').slice(0, BOX).split('');

  const setDigits = useCallback(
    (next: string) => {
      const clean = next.replace(/\D/g, '').slice(0, BOX);
      onChange(clean);
      if (clean.length === BOX) onComplete?.(clean);
    },
    [onChange, onComplete],
  );

  useEffect(() => {
    if (autoFocus) refs.current[0]?.focus();
  }, [autoFocus]);

  function focusAt(i: number) {
    const el = refs.current[Math.min(Math.max(i, 0), BOX - 1)];
    el?.focus();
    el?.select();
  }

  function handleChange(i: number, char: string) {
    const d = char.replace(/\D/g, '');
    if (!d) {
      const arr = [...digits];
      while (arr.length < BOX) arr.push('');
      arr[i] = '';
      setDigits(arr.join(''));
      return;
    }
    if (d.length > 1) {
      setDigits(d);
      focusAt(Math.min(d.length, BOX) - 1);
      return;
    }
    const arr = [...digits];
    while (arr.length < BOX) arr.push('');
    arr[i] = d[0];
    const joined = arr.join('').slice(0, BOX);
    setDigits(joined);
    if (i < BOX - 1) focusAt(i + 1);
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      e.preventDefault();
      focusAt(i - 1);
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      focusAt(i - 1);
    }
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      focusAt(i + 1);
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, BOX);
    if (!pasted) return;
    setDigits(pasted);
    focusAt(Math.min(pasted.length, BOX - 1));
  }

  return (
    <LazyMotion features={domAnimation}>
      <m.div
        role="group"
        aria-labelledby={`${groupId}-label`}
        className="flex justify-center gap-2 sm:gap-2.5"
        animate={error ? { x: [0, -10, 10, -8, 8, 0] } : { x: 0 }}
        transition={{ duration: 0.45 }}
      >
        <span id={`${groupId}-label`} className="sr-only">
          One-time code, 6 digits
        </span>
        {Array.from({ length: BOX }).map((_, i) => {
          const filled = !!digits[i];
          return (
            <m.input
              key={i}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              autoComplete={i === 0 ? 'one-time-code' : 'off'}
              maxLength={1}
              disabled={disabled}
              value={digits[i] ?? ''}
              aria-label={`Digit ${i + 1} of ${BOX}`}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              onPaste={handlePaste}
              onFocus={(e) => e.target.select()}
              className={cn(
                'size-12 rounded-xl border-2 bg-white/5 text-center text-xl font-semibold tabular-nums text-white outline-none transition-colors duration-200 sm:size-[3.25rem]',
                'focus:border-amber-400/90 focus:bg-white/8 focus:ring-4 focus:ring-amber-400/15',
                error
                  ? 'border-red-400/80'
                  : filled
                    ? 'border-amber-400/50'
                    : 'border-white/12',
                disabled && 'opacity-50',
              )}
              initial={false}
              animate={
                filled
                  ? { scale: [1, 1.06, 1], transition: { duration: 0.2 } }
                  : { scale: 1 }
              }
            />
          );
        })}
      </m.div>
    </LazyMotion>
  );
}
