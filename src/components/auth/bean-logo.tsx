'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * BeanCircle brand mark: a glowing coffee bean inside a ring.
 * Pure SVG so it stays crisp and animatable without extra assets.
 */
export function BeanLogo({ className }: { className?: string }) {
  const uid = useId().replace(/:/g, '');
  const ringId = `bc-ring-${uid}`;
  const fillId = `bc-fill-${uid}`;

  return (
    <svg
      viewBox="0 0 96 96"
      role="img"
      aria-label="BeanCircle"
      className={cn('h-16 w-16', className)}
    >
      <defs>
        <linearGradient id={ringId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f5b878" />
          <stop offset="55%" stopColor="#c87f43" />
          <stop offset="100%" stopColor="#7a4a25" />
        </linearGradient>
        <radialGradient id={fillId} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#3a2418" />
          <stop offset="100%" stopColor="#1a0f0a" />
        </radialGradient>
      </defs>
      <circle cx="48" cy="48" r="44" fill={`url(#${fillId})`} />
      <circle
        cx="48"
        cy="48"
        r="44"
        fill="none"
        stroke={`url(#${ringId})`}
        strokeWidth="4"
      />
      <ellipse
        cx="48"
        cy="48"
        rx="20"
        ry="27"
        fill={`url(#${ringId})`}
        transform="rotate(32 48 48)"
      />
      <path
        d="M48 24 C40 36, 56 60, 48 72"
        fill="none"
        stroke="#1a0f0a"
        strokeWidth="4"
        strokeLinecap="round"
        transform="rotate(32 48 48)"
      />
    </svg>
  );
}
