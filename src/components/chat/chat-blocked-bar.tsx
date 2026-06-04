'use client';

import { Ban } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import type { BlockStatus } from '@/components/chat/types';

type ChatBlockedBarProps = {
  peerName?: string | null;
  blockStatus: BlockStatus;
  onUnblock: () => void;
};

export function ChatBlockedBar({ peerName, blockStatus, onUnblock }: ChatBlockedBarProps) {
  const t = useTranslations('messages');
  const name = peerName ?? t('thisUser');

  const message = blockStatus.blockedByYou
    ? t('chatBlockedByYou', { name })
    : t('chatBlockedCantMessage');

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-muted/40 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <Ban className="size-4" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-foreground">{t('chatBlockedTitle')}</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{message}</p>
        </div>
        {blockStatus.blockedByYou ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0" onClick={onUnblock}>
            {t('unblock')}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
