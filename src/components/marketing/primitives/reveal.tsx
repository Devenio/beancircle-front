'use client';

import { motion, useReducedMotion, type Variants } from 'framer-motion';
import type { ReactNode } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right' | 'none';

const offset: Record<Direction, { x: number; y: number }> = {
  up: { x: 0, y: 32 },
  down: { x: 0, y: -32 },
  left: { x: 40, y: 0 },
  right: { x: -40, y: 0 },
  none: { x: 0, y: 0 },
};

/**
 * Scroll-into-view reveal with physics-y spring + optional stagger of children.
 * Collapses to an instant fade when the user prefers reduced motion.
 */
export function Reveal({
  children,
  direction = 'up',
  delay = 0,
  className,
  as = 'div',
  amount = 0.3,
}: {
  children: ReactNode;
  direction?: Direction;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'li' | 'span';
  amount?: number;
}) {
  const reduce = useReducedMotion();
  const { x, y } = offset[direction];

  const variants: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, x, y, filter: 'blur(8px)' },
    show: {
      opacity: 1,
      x: 0,
      y: 0,
      filter: 'blur(0px)',
      transition: reduce
        ? { duration: 0.25 }
        : { type: 'spring', stiffness: 90, damping: 20, mass: 0.8, delay },
    },
  };

  const MotionTag = motion[as];

  return (
    <MotionTag
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount }}
    >
      {children}
    </MotionTag>
  );
}

/** Staggers direct Reveal/motion children when scrolled into view. */
export function RevealGroup({
  children,
  className,
  stagger = 0.08,
  as = 'div',
}: {
  children: ReactNode;
  className?: string;
  stagger?: number;
  as?: 'div' | 'ul' | 'section';
}) {
  const MotionTag = motion[as];
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.2 }}
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </MotionTag>
  );
}
