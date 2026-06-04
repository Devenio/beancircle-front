'use client';

import { Check, Loader2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { UserAvatar } from '@/components/chat/user-avatar';
import type { Conversation } from '@/components/chat/types';
import { cn } from '@/lib/utils';

type ForwardState = Record<string, 'idle' | 'sending' | 'ok' | 'failed'>;

type ForwardPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversations?: Conversation[];
  currentConversationId: string;
  forwardTargets: Set<string>;
  forwardState: ForwardState;
  isForwarding?: boolean;
  onToggleTarget: (id: string) => void;
  onForward: () => void;
};

export function ForwardPickerSheet({
  open,
  onOpenChange,
  conversations,
  currentConversationId,
  forwardTargets,
  forwardState,
  isForwarding,
  onToggleTarget,
  onForward,
}: ForwardPickerSheetProps) {
  const t = useTranslations('messages');

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('forward')}
      description={t('forwardDescription')}
      className="max-h-[85dvh]"
    >
      <div className="flex max-h-[50dvh] flex-col gap-1 overflow-y-auto px-2 pb-2">
        {conversations
          ?.filter((item) => item.id !== currentConversationId)
          .map((conv) => {
            const selected = forwardTargets.has(conv.id);
            const status = forwardState[conv.id];
            const name =
              conv.otherMember?.name ?? conv.otherMember?.username ?? 'Conversation';
            return (
              <button
                key={conv.id}
                type="button"
                disabled={status === 'sending'}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-colors',
                  selected ? 'bg-primary/10' : 'hover:bg-muted',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                )}
                onClick={() => onToggleTarget(conv.id)}
              >
                <UserAvatar src={conv.otherMember?.avatarUrl} name={name} size="sm" />
                <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>
                {status === 'sending' ? (
                  <Loader2 className="size-5 animate-spin text-muted-foreground" />
                ) : status === 'ok' ? (
                  <Check className="size-5 text-primary" />
                ) : status === 'failed' ? (
                  <span className="text-xs text-destructive">{t('failed')}</span>
                ) : (
                  <span
                    className={cn(
                      'flex size-6 items-center justify-center rounded-full border',
                      selected ? 'border-primary bg-primary text-primary-foreground' : 'border-border',
                    )}
                  >
                    {selected ? <Check className="size-3.5" /> : null}
                  </span>
                )}
              </button>
            );
          })}
      </div>
      <div className="border-t border-border px-4 pt-3">
        <Button className="w-full rounded-full" onClick={onForward} disabled={forwardTargets.size === 0 || isForwarding}>
          {isForwarding
            ? t('sending')
            : t('forwardToCount', { count: forwardTargets.size })}
        </Button>
      </div>
    </ChatBottomSheet>
  );
}
