'use client';

import { Check, Copy } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { cn } from '@/lib/utils';

/** Non-empty OTP `code` from a mock/demo `/auth/otp/request` payload. */
export function readOtpCode(payload: { code?: unknown }): string {
  if (typeof payload.code !== 'string') return '';
  const trimmed = payload.code.trim();
  return trimmed.length > 0 ? trimmed : '';
}

export function DemoOtpCode({
  code,
  onUse,
}: {
  code: string;
  onUse: (code: string) => void;
}) {
  const t = useTranslations('auth');
  const [copied, setCopied] = useState(false);

  async function activate() {
    onUse(code);
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard blocked — filling the inputs is still enough */
    }
  }

  return (
    <div
      data-testid="demo-otp-code"
      className="mt-5 rounded-2xl border border-amber-300/40 bg-amber-400/15 px-4 py-3 text-center"
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-amber-200/85">
        {t('demoCodeTitle')}
      </p>
      <button
        type="button"
        onClick={activate}
        aria-label={t('copyDemoCode', { code })}
        className="mt-1.5 inline-flex items-center gap-2 rounded-xl px-2 py-1 font-mono text-[1.65rem] font-bold tracking-[0.28em] text-amber-50 transition-colors hover:bg-white/5"
      >
        <span>{code}</span>
        {copied ? (
          <Check className="size-4 text-emerald-300" aria-hidden />
        ) : (
          <Copy className="size-4 text-amber-200/80" aria-hidden />
        )}
      </button>
      <p
        className={cn(
          'mt-0.5 text-[11px] text-white/50',
          copied && 'text-emerald-300/90',
        )}
        aria-live="polite"
      >
        {copied ? t('demoCodeCopied') : t('demoCodeHint')}
      </p>
    </div>
  );
}
