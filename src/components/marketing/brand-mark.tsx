import { cn } from '@/lib/utils';

/**
 * Bean Circle logo — a coffee bean cradled inside an open circle ("the circle
 * of people around the bean"). Pure SVG so it scales crisply and themes via
 * currentColor + the crema gradient.
 */
export function BrandMark({ className, withWordmark = true }: { className?: string; withWordmark?: boolean }) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg viewBox="0 0 48 48" className="size-8 shrink-0" aria-hidden="true">
        <defs>
          <linearGradient id="bc-mark" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f0b860" />
            <stop offset="1" stopColor="#c8853c" />
          </linearGradient>
        </defs>
        {/* open circle of people */}
        <circle cx="24" cy="24" r="20" fill="none" stroke="url(#bc-mark)" strokeWidth="2.5" strokeDasharray="98 28" strokeLinecap="round" transform="rotate(-30 24 24)" />
        {/* the bean */}
        <ellipse cx="24" cy="24" rx="8.5" ry="12" fill="url(#bc-mark)" transform="rotate(28 24 24)" />
        <path d="M24 13 C 20 18, 20 30, 24 35" fill="none" stroke="#120a06" strokeWidth="2" strokeLinecap="round" transform="rotate(28 24 24)" />
      </svg>
      {withWordmark ? (
        <span className="text-[17px] font-extrabold tracking-tight text-[var(--bc-cream)]">
          Bean<span className="text-[var(--bc-amber)]">Circle</span>
        </span>
      ) : null}
    </span>
  );
}
