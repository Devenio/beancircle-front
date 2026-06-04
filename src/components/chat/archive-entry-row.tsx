'use client';

import { motion } from 'framer-motion';
import { Archive, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export function ArchiveEntryRow({
  count,
  className,
}: {
  count: number;
  className?: string;
}) {
  const t = useTranslations('messages');

  if (count === 0) return null;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
    >
      <Link
        href="/messages/archived"
        className={cn(
          'flex min-h-[52px] items-center gap-3 rounded-2xl px-3 py-2.5',
          'bg-muted/50 transition-colors active:bg-muted',
          className,
        )}
      >
        <span className="flex size-11 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Archive className="size-5" strokeWidth={2} />
        </span>
        <span className="min-w-0 flex-1 text-start">
          <span className="block text-[15px] font-semibold text-foreground">{t('archivedTitle')}</span>
          <span className="mt-0.5 block text-xs text-muted-foreground">{t('archivedEntryHint')}</span>
        </span>
        <Badge variant="secondary" className="min-w-6 justify-center rounded-full">
          {count > 99 ? '99+' : count}
        </Badge>
        <ChevronRight className="size-[18px] shrink-0 text-muted-foreground/80 rtl:rotate-180" />
      </Link>
    </motion.div>
  );
}
