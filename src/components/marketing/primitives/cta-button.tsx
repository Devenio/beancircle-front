'use client';

import { useRef, type ReactNode } from 'react';
import { motion, useReducedMotion, useMotionValue, useSpring } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'glass';

const base =
  'group relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold tracking-tight transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--bc-crema)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bc-bg)]';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-br from-[var(--bc-amber)] to-[var(--bc-crema)] text-[#1a0e06] shadow-[0_10px_40px_-12px_var(--bc-crema)] hover:shadow-[0_16px_50px_-10px_var(--bc-crema)]',
  glass:
    'bc-glass text-[var(--bc-cream)] hover:bg-[var(--bc-glass-strong)]',
  ghost:
    'text-[var(--bc-cream)] hover:text-[var(--bc-amber)]',
};

/**
 * Magnetic CTA. Pointer gently pulls the button toward the cursor for that
 * Apple/Arc tactile feel. Falls back to a static button under reduced motion.
 * Renders an internal <Link> when `href` is set, otherwise a <button>.
 */
export function CtaButton({
  children,
  href,
  onClick,
  variant = 'primary',
  className,
  magnetic = true,
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  variant?: Variant;
  className?: string;
  magnetic?: boolean;
}) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLElement | null>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 250, damping: 18 });
  const sy = useSpring(y, { stiffness: 250, damping: 18 });

  const enabled = magnetic && !reduce;

  function handleMove(e: React.PointerEvent) {
    if (!enabled || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set(((e.clientX - (r.left + r.width / 2)) / r.width) * 18);
    y.set(((e.clientY - (r.top + r.height / 2)) / r.height) * 18);
  }
  function reset() {
    x.set(0);
    y.set(0);
  }

  const inner = (
    <>
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
      {variant === 'primary' && !reduce ? (
        <span
          aria-hidden
          className="absolute inset-0 -z-0 overflow-hidden rounded-full"
        >
          <span className="absolute -inset-x-2 top-0 h-full w-1/3 -translate-x-full skew-x-[-20deg] bg-white/30 blur-md transition-transform duration-700 group-hover:translate-x-[400%]" />
        </span>
      ) : null}
    </>
  );

  const cls = cn(base, variants[variant], className);
  const style = { x: sx, y: sy } as const;

  if (href) {
    const MotionLink = motion.create(Link);
    return (
      <MotionLink
        ref={ref as React.Ref<HTMLAnchorElement>}
        href={href}
        className={cls}
        style={style}
        onPointerMove={handleMove}
        onPointerLeave={reset}
        whileTap={{ scale: 0.96 }}
      >
        {inner}
      </MotionLink>
    );
  }

  return (
    <motion.button
      ref={ref as React.Ref<HTMLButtonElement>}
      type="button"
      onClick={onClick}
      className={cls}
      style={style}
      onPointerMove={handleMove}
      onPointerLeave={reset}
      whileTap={{ scale: 0.96 }}
    >
      {inner}
    </motion.button>
  );
}
