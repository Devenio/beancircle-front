'use client';

import { useEffect, useRef } from 'react';
import { useReducedMotion } from 'framer-motion';

/**
 * Lightweight canvas confetti burst — no dependency. Fires once on mount.
 * Under reduced-motion it paints a single static scatter instead of animating.
 */
const COLORS = ['#f0b860', '#c8853c', '#7fcf9f', '#e9a08a', '#ffffff'];

export function Confetti({ count = 120 }: { count?: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
    };
    resize();

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h * 0.32;

    type P = { x: number; y: number; vx: number; vy: number; r: number; c: string; rot: number; vr: number };
    const parts: P[] = Array.from({ length: count }, () => {
      const angle = Math.random() * Math.PI * 2;
      const speed = (2 + Math.random() * 6) * dpr;
      return {
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 4 * dpr,
        r: (3 + Math.random() * 4) * dpr,
        c: COLORS[(Math.random() * COLORS.length) | 0],
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.3,
      };
    });

    if (reduce) {
      parts.forEach((p) => {
        const x = cx + p.vx * 12;
        const y = cy + Math.abs(p.vy) * 12 + Math.random() * h * 0.3;
        ctx.fillStyle = p.c;
        ctx.globalAlpha = 0.9;
        ctx.fillRect(x, y, p.r * 1.6, p.r * 1.6);
      });
      return;
    }

    let frame = 0;
    let raf = 0;
    const gravity = 0.16 * dpr;
    const tick = () => {
      frame += 1;
      ctx.clearRect(0, 0, w, h);
      parts.forEach((p) => {
        p.vy += gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vr;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = Math.max(0, 1 - frame / 130);
        ctx.fillStyle = p.c;
        ctx.fillRect(-p.r, -p.r, p.r * 2, p.r * 2);
        ctx.restore();
      });
      if (frame < 130) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [count, reduce]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 h-full w-full"
    />
  );
}
