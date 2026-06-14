'use client';

import Lenis from 'lenis';
import { useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';
import { ensureGsap } from '@/components/marketing/lib/gsap';

/**
 * Lenis smooth scroll, wired into GSAP ScrollTrigger so scroll-linked
 * animations stay perfectly in sync. Scoped to the marketing tree — it mounts
 * only inside the (marketing) layout, so the app shell keeps native scrolling.
 *
 * Respects `prefers-reduced-motion`: we skip Lenis entirely and let the browser
 * scroll natively, while still keeping ScrollTrigger alive for reveal triggers.
 */
export function SmoothScroll({ children }: { children: React.ReactNode }) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const { gsap, ScrollTrigger } = ensureGsap();

    if (reduceMotion) {
      ScrollTrigger.refresh();
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.4,
    });

    lenis.on('scroll', ScrollTrigger.update);
    // Expose for the nav's anchor scrolling (kept intentionally simple).
    (window as unknown as { __bcLenis?: Lenis }).__bcLenis = lenis;

    const onTick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Let images / fonts settle, then recalc trigger positions.
    const refresh = () => ScrollTrigger.refresh();
    const raf = requestAnimationFrame(refresh);

    return () => {
      cancelAnimationFrame(raf);
      gsap.ticker.remove(onTick);
      delete (window as unknown as { __bcLenis?: Lenis }).__bcLenis;
      lenis.destroy();
    };
  }, [reduceMotion]);

  return <>{children}</>;
}
