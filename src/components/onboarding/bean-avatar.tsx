'use client';

import { useId } from 'react';
import { cn } from '@/lib/utils';
import type { AvatarConfig } from '@/stores/onboarding-store';

/**
 * Parametric "bean" avatar — a friendly coffee-bean character rendered as pure
 * SVG from discrete option keys. Shared by the avatar builder step, the live
 * preview, and anywhere a chosen bean is shown. No external assets.
 */

export const AVATAR_OPTIONS = {
  bg: ['crema', 'mint', 'rose', 'sky', 'espresso'],
  skin: ['roast', 'light', 'dark'],
  hair: ['none', 'tuft', 'bun', 'curly'],
  glasses: ['none', 'round', 'square'],
  beard: ['none', 'stubble', 'full'],
  outfit: ['apron', 'hoodie', 'tee', 'suit'],
  accessory: ['none', 'headphones', 'beanie', 'flower'],
  coffeeCup: ['latte', 'espresso', 'togo', 'none'],
} as const;

const BG: Record<string, [string, string]> = {
  crema: ['#f0b860', '#c8853c'],
  mint: ['#7fcf9f', '#3f9e6e'],
  rose: ['#e9a08a', '#cf6f55'],
  sky: ['#8ab6e0', '#5a86c0'],
  espresso: ['#3a2418', '#160d08'],
};
const SKIN: Record<string, [string, string]> = {
  roast: ['#c87f43', '#7a4a25'],
  light: ['#e0a85a', '#b07a3a'],
  dark: ['#7a4a25', '#3a2418'],
};
const HAIR_COLOR = '#2a1810';

export function BeanAvatar({
  config,
  className,
}: {
  config: AvatarConfig;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const bg = BG[config.bg] ?? BG.crema;
  const skin = SKIN[config.skin] ?? SKIN.roast;

  return (
    <svg
      viewBox="0 0 200 200"
      role="img"
      aria-label="Your bean avatar"
      className={cn('h-40 w-40', className)}
    >
      <defs>
        <radialGradient id={`bg-${uid}`} cx="50%" cy="38%" r="75%">
          <stop offset="0%" stopColor={bg[0]} />
          <stop offset="100%" stopColor={bg[1]} />
        </radialGradient>
        <linearGradient id={`bean-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={skin[0]} />
          <stop offset="100%" stopColor={skin[1]} />
        </linearGradient>
      </defs>

      {/* background */}
      <rect width="200" height="200" rx="48" fill={`url(#bg-${uid})`} />
      <ellipse cx="100" cy="172" rx="56" ry="12" fill="#000" opacity="0.12" />

      {/* bean body */}
      <g>
        <ellipse
          cx="100"
          cy="100"
          rx="52"
          ry="64"
          fill={`url(#bean-${uid})`}
          transform="rotate(8 100 100)"
        />
        {/* bean crack */}
        <path
          d="M100 48 C84 74, 116 126, 100 152"
          fill="none"
          stroke="#160d08"
          strokeWidth="6"
          strokeLinecap="round"
          opacity="0.55"
          transform="rotate(8 100 100)"
        />
      </g>

      {/* beard (behind face features but over body) */}
      {config.beard === 'stubble' && (
        <ellipse cx="100" cy="126" rx="34" ry="20" fill="#160d08" opacity="0.22" />
      )}
      {config.beard === 'full' && (
        <path
          d="M68 110 Q100 168 132 110 Q120 140 100 142 Q80 140 68 110 Z"
          fill="#160d08"
          opacity="0.7"
        />
      )}

      {/* eyes */}
      <g fill="#160d08">
        <circle cx="84" cy="98" r="6" />
        <circle cx="116" cy="98" r="6" />
      </g>
      <g fill="#fff" opacity="0.85">
        <circle cx="86" cy="96" r="2" />
        <circle cx="118" cy="96" r="2" />
      </g>
      {/* smile */}
      <path
        d="M86 116 Q100 128 114 116"
        fill="none"
        stroke="#160d08"
        strokeWidth="4"
        strokeLinecap="round"
      />

      {/* glasses */}
      {config.glasses === 'round' && (
        <g fill="none" stroke="#160d08" strokeWidth="3.5">
          <circle cx="84" cy="98" r="13" />
          <circle cx="116" cy="98" r="13" />
          <line x1="97" y1="98" x2="103" y2="98" />
        </g>
      )}
      {config.glasses === 'square' && (
        <g fill="none" stroke="#160d08" strokeWidth="3.5">
          <rect x="71" y="89" width="24" height="18" rx="4" />
          <rect x="105" y="89" width="24" height="18" rx="4" />
          <line x1="95" y1="98" x2="105" y2="98" />
        </g>
      )}

      {/* hair */}
      {config.hair === 'tuft' && (
        <path d="M100 36 q14 6 6 20 q-6 -10 -6 -2 q0 -8 -6 2 q-8 -14 6 -20 Z" fill={HAIR_COLOR} />
      )}
      {config.hair === 'bun' && <circle cx="100" cy="40" r="12" fill={HAIR_COLOR} />}
      {config.hair === 'curly' && (
        <g fill={HAIR_COLOR}>
          <circle cx="80" cy="50" r="11" />
          <circle cx="100" cy="44" r="12" />
          <circle cx="120" cy="50" r="11" />
        </g>
      )}

      {/* accessory */}
      {config.accessory === 'headphones' && (
        <g fill="none" stroke="#160d08" strokeWidth="6">
          <path d="M58 96 A42 42 0 0 1 142 96" />
          <rect x="50" y="92" width="14" height="26" rx="6" fill="#160d08" />
          <rect x="136" y="92" width="14" height="26" rx="6" fill="#160d08" />
        </g>
      )}
      {config.accessory === 'beanie' && (
        <g>
          <path d="M62 56 Q100 22 138 56 Z" fill="#cf6f55" />
          <rect x="60" y="52" width="80" height="12" rx="6" fill="#b04f35" />
        </g>
      )}
      {config.accessory === 'flower' && (
        <g transform="translate(128 52)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse key={a} cx="0" cy="-8" rx="4" ry="7" fill="#e9a08a" transform={`rotate(${a})`} />
          ))}
          <circle r="4" fill="#f0b860" />
        </g>
      )}

      {/* outfit collar */}
      {config.outfit === 'apron' && (
        <path d="M64 150 Q100 138 136 150 L136 168 L64 168 Z" fill="#7fcf9f" opacity="0.9" />
      )}
      {config.outfit === 'hoodie' && (
        <g>
          <path d="M58 152 Q100 140 142 152 L142 170 L58 170 Z" fill="#5a86c0" />
          <path d="M88 150 l12 14 l12 -14" fill="none" stroke="#fff" strokeWidth="3" opacity="0.7" />
        </g>
      )}
      {config.outfit === 'tee' && (
        <path d="M62 152 Q100 142 138 152 L138 170 L62 170 Z" fill="#f0b860" />
      )}
      {config.outfit === 'suit' && (
        <g>
          <path d="M60 150 Q100 140 140 150 L140 170 L60 170 Z" fill="#2a1810" />
          <path d="M92 148 l8 12 l8 -12" fill="#fff" />
          <path d="M98 152 l2 14 l2 -14" fill="#cf6f55" />
        </g>
      )}

      {/* coffee cup held in front */}
      {config.coffeeCup !== 'none' && (
        <g transform="translate(140 138)">
          {config.coffeeCup === 'togo' ? (
            <g>
              <path d="M0 6 L22 6 L19 34 L3 34 Z" fill="#e6d2b5" />
              <rect x="-2" y="0" width="26" height="8" rx="3" fill="#fff" />
              <rect x="6" y="-7" width="10" height="8" rx="2" fill="#cf6f55" />
            </g>
          ) : (
            <g>
              <path
                d="M2 8 L24 8 L21 30 a4 4 0 0 1 -4 3 L9 33 a4 4 0 0 1 -4 -3 Z"
                fill="#fff"
              />
              <path
                d="M5 12 L21 12 L19 26 L7 26 Z"
                fill={config.coffeeCup === 'espresso' ? '#3a2418' : '#c8853c'}
              />
              <path d="M24 12 a6 6 0 0 1 0 12" fill="none" stroke="#fff" strokeWidth="3" />
              <ellipse cx="13" cy="8" rx="11" ry="2.4" fill="#fff" opacity="0.6" />
            </g>
          )}
        </g>
      )}
    </svg>
  );
}
