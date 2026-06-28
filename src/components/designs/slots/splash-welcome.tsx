'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useRef } from 'react';
import type { WelcomeDesignProps } from '../registry';

/**
 * Welcome design ported from public/welcome-splash.html — the BeanCircle
 * self-drawing logo splash. The brand mark draws its outline, the fills
 * dissolve in, then the cafe's welcome title settles and a "view menu" button
 * appears. All CSS is scoped under `.bc-splash` so it never leaks globally,
 * and the stroke length is measured at runtime for an exact reveal.
 */
export function SplashWelcome({ menu, labels, onViewMenu, onAnimationEnd }: WelcomeDesignProps) {
  const outlineRef = useRef<SVGPathElement>(null);
  const viewRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const outline = outlineRef.current;
    if (!outline) return;
    const len = Math.ceil(outline.getTotalLength());
    outline.style.strokeDasharray = String(len);
    outline.style.strokeDashoffset = String(len);
    outline.style.animation = 'none';
    void outline.getBoundingClientRect();
    outline.style.animation = '';
  }, []);

  useEffect(() => {
    const btn = viewRef.current;
    if (!btn || !onAnimationEnd) return;
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      onAnimationEnd();
      return;
    }
    const handler = () => onAnimationEnd();
    btn.addEventListener('animationend', handler, { once: true });
    return () => btn.removeEventListener('animationend', handler);
  }, [onAnimationEnd]);

  return (
    <section className="bc-splash">
      <style>{SPLASH_CSS}</style>
      <div className="bc-splash-inner">
        <svg
          className="bc-logo"
          viewBox="0 0 88 73"
          xmlns="http://www.w3.org/2000/svg"
          aria-label="BeanCircle"
        >
          <g className="bc-fills">
            <path fillRule="evenodd" clipRule="evenodd" d="M0.5 49.5V22.5H87.5V49.5H0.5ZM4.5 26V46H18.5V26H4.5Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M23.5 54H68.5V63V72H23.5V61.5H65.5V58.5L23.5 58.3503V54ZM45 64.5V68.5H65.5V64.5H45Z" />
            <path d="M0.5 72H8.5V65H10.5L16.5 70V72H21V54H16.5V60.5L8.5 54H0.5V72Z" />
            <path d="M71.5 72V54H87.5V72H83.5V58.5H78.5V72H71.5Z" />
            <path fillRule="evenodd" clipRule="evenodd" d="M23.5 0.5H68.5V9.5V18.5H23.5V8H65.5V5L23.5 4.85026V0.5ZM60.5 11V15H65.5V11H60.5Z" />
            <path d="M71.5 18.5V0.5H87.5V18.5H83.5V5H78.5V18.5H71.5Z" />
            <path d="M0.5 18.5H8.5V11.5H10.5L16.5 16.5V18.5H21V0.5H16.5V7L8.5 0.5H0.5V18.5Z" />
          </g>
          <path
            ref={outlineRef}
            className="bc-outline"
            d="M23.5 4V4.85026M23.5 4.85026V0.5H68.5V9.5V18.5H23.5V8H65.5V5L23.5 4.85026ZM23.5 56.1751V58.3503M23.5 58.3503V54H68.5V63V72H23.5V61.5H65.5V58.5L23.5 58.3503ZM0.5 18.5H8.5V11.5H10.5L16.5 16.5V18.5H21V0.5H16.5V7L8.5 0.5H0.5V18.5ZM60.5 15V11H65.5V15H60.5ZM71.5 18.5V0.5H87.5V18.5H83.5V5H78.5V18.5H71.5ZM0.5 49.5V22.5H87.5V49.5H0.5ZM4.5 46V26H18.5V46H4.5ZM0.5 72H8.5V65H10.5L16.5 70V72H21V54H16.5V60.5L8.5 54H0.5V72ZM45 68.5V64.5H65.5V68.5H45ZM71.5 72V54H87.5V72H83.5V58.5H78.5V72H71.5Z"
          />
        </svg>

        <p className="bc-welcome">{menu.welcomeTitle || menu.cafe.name}</p>
        {menu.welcomeMessage ? (
          <p className="bc-tagline">{menu.welcomeMessage}</p>
        ) : null}

        <button ref={viewRef} type="button" className="bc-view" onClick={onViewMenu}>
          {labels.viewMenu}
          <ChevronDown className="bc-view-icon" />
        </button>
      </div>
    </section>
  );
}

const SPLASH_CSS = `
.bc-splash {
  --bg: #0e0e0f;
  --logo: #ffffff;
  --draw-duration: 2.2s;
  --fill-duration: 1.1s;
  --fill-stagger: 0.09s;
  --ease: cubic-bezier(0.45, 0.05, 0.2, 1);
  --ease-draw: cubic-bezier(0.37, 0, 0.63, 1);
  display: grid;
  place-items: center;
  min-height: 100dvh;
  background: var(--bg);
  background-image: radial-gradient(circle, #1a1a1e 0%, var(--bg) 70%);
  animation: bc-screen-in 0.6s ease both;
}
.bc-splash-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 28px;
  text-align: center;
  padding: 24px;
}
.bc-logo {
  width: clamp(140px, 34vw, 260px);
  height: auto;
  color: var(--logo);
  transform-origin: center;
  transform: scale(0.965);
  animation: bc-logo-settle 2.6s var(--ease) forwards;
  will-change: transform;
}
.bc-logo .bc-outline {
  fill: none;
  stroke: var(--logo);
  stroke-width: 1;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1400;
  stroke-dashoffset: 1400;
  animation:
    bc-draw var(--draw-duration) var(--ease-draw) forwards,
    bc-outline-out 1.2s var(--ease) forwards;
  animation-delay: 0s, calc(var(--draw-duration) + 0.15s);
  will-change: stroke-dashoffset, opacity;
}
.bc-logo .bc-fills > * {
  fill: var(--logo);
  opacity: 0;
  animation: bc-fill-in var(--fill-duration) var(--ease) forwards;
  will-change: opacity;
}
.bc-logo .bc-fills > *:nth-child(1) { animation-delay: calc(var(--draw-duration) - 0.7s + 0 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(2) { animation-delay: calc(var(--draw-duration) - 0.7s + 1 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(3) { animation-delay: calc(var(--draw-duration) - 0.7s + 2 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(4) { animation-delay: calc(var(--draw-duration) - 0.7s + 3 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(5) { animation-delay: calc(var(--draw-duration) - 0.7s + 4 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(6) { animation-delay: calc(var(--draw-duration) - 0.7s + 5 * var(--fill-stagger)); }
.bc-logo .bc-fills > *:nth-child(7) { animation-delay: calc(var(--draw-duration) - 0.7s + 6 * var(--fill-stagger)); }
.bc-welcome {
  font-weight: 300;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  font-size: clamp(15px, 4vw, 22px);
  color: var(--logo);
  opacity: 0;
  transform: translateY(6px);
  animation: bc-welcome-in 1.1s var(--ease) forwards;
  animation-delay: calc(var(--draw-duration) + 0.45s);
}
.bc-tagline {
  font-weight: 400;
  letter-spacing: 0.04em;
  font-size: clamp(12px, 2.6vw, 14px);
  max-width: 28rem;
  color: rgba(255, 255, 255, 0.45);
  opacity: 0;
  animation: bc-tagline-in 0.8s var(--ease) forwards;
  animation-delay: calc(var(--draw-duration) + 0.7s);
}
.bc-view {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  padding: 12px 24px;
  border-radius: 9999px;
  background: #ffffff;
  color: #0e0e0f;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  opacity: 0;
  animation: bc-welcome-in 0.9s var(--ease) forwards;
  animation-delay: calc(var(--draw-duration) + 0.9s);
}
.bc-view-icon { width: 16px; height: 16px; }
@keyframes bc-screen-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes bc-draw         { to   { stroke-dashoffset: 0; } }
@keyframes bc-fill-in      { to   { opacity: 1; } }
@keyframes bc-outline-out  { to   { opacity: 0; } }
@keyframes bc-logo-settle  { to   { transform: scale(1); } }
@keyframes bc-welcome-in   { to   { opacity: 1; transform: translateY(0); } }
@keyframes bc-tagline-in   { to   { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .bc-splash, .bc-logo { animation: none; transform: none; }
  .bc-logo .bc-outline { animation: none; stroke-dashoffset: 0; opacity: 0; }
  .bc-logo .bc-fills > * { animation: none; opacity: 1; }
  .bc-welcome, .bc-tagline, .bc-view { animation: none; opacity: 1; transform: none; }
}
`;
