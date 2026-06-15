'use client';

import type { ReactNode } from 'react';

/** Glass card + header used by most steps for visual consistency. */
export function StepFrame({
  title,
  subtitle,
  children,
  nav,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  nav?: ReactNode;
}) {
  return (
    <div className="mx-auto flex w-full max-w-md flex-col rounded-3xl border border-white/10 bg-white/[0.06] p-5 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl">
      <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
      {subtitle && <p className="mt-1.5 text-sm text-white/55">{subtitle}</p>}
      <div className="mt-4 min-h-0 flex-1">{children}</div>
      {nav}
    </div>
  );
}
