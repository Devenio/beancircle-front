'use client';

import { motion } from 'motion/react';
import { cn } from '@/lib/utils';

export function TypingIndicator({ label, className }: { label?: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.2 }}
      className={cn('flex items-center gap-2 px-1 py-1', className)}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-1 rounded-2xl bg-muted px-3 py-2">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="size-1.5 rounded-full bg-muted-foreground"
            animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
      {label ? <span className="text-xs text-muted-foreground">{label}</span> : null}
    </motion.div>
  );
}
