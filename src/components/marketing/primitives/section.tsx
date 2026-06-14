'use client';

import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Reveal } from './reveal';

/** Full-bleed marketing section that escapes the app's 430px mobile shell. */
export function Section({
  id,
  children,
  className,
  bleed = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  bleed?: boolean;
}) {
  return (
    <section
      id={id}
      className={cn(
        bleed && 'bc-fullbleed',
        'relative overflow-hidden',
        className,
      )}
    >
      {children}
    </section>
  );
}

/** Centered content rail with sensible reading width. */
export function Container({
  children,
  className,
  size = 'default',
}: {
  children: ReactNode;
  className?: string;
  size?: 'default' | 'wide' | 'narrow';
}) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-5 sm:px-8',
        size === 'narrow' && 'max-w-3xl',
        size === 'default' && 'max-w-6xl',
        size === 'wide' && 'max-w-7xl',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-[var(--bc-line)] bg-[var(--bc-glass)] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--bc-crema-soft)]',
        className,
      )}
    >
      <span className="size-1.5 rounded-full bg-[var(--bc-crema)] shadow-[0_0_8px_var(--bc-crema)]" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  body,
  align = 'center',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  body?: string;
  align?: 'center' | 'start';
  className?: string;
}) {
  return (
    <Reveal
      className={cn(
        'flex max-w-2xl flex-col gap-5',
        align === 'center' ? 'mx-auto items-center text-center' : 'items-start text-start',
        className,
      )}
    >
      {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
      <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl md:text-6xl">
        {title}
      </h2>
      {body ? (
        <p className="text-pretty text-base leading-relaxed text-[var(--bc-muted)] sm:text-lg">
          {body}
        </p>
      ) : null}
    </Reveal>
  );
}
