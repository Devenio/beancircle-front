'use client';

import { Copy, Forward, Pin, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/mobile/haptics';

type MessageSelectionBarProps = {
  count: number;
  canDelete: number;
  canPin: number;
  canUnpin: number;
  onCopy: () => void;
  onForward: () => void;
  onDelete: () => void;
  onPin: () => void;
  onUnpin: () => void;
};

function ActionButton({
  label,
  icon: Icon,
  onClick,
  disabled,
  destructive,
}: {
  label: string;
  icon: typeof Copy;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        haptic('selection');
        onClick();
      }}
      className={cn(
        'flex min-w-0 flex-1 flex-col items-center gap-1 rounded-xl px-2 py-2 text-[11px] font-medium transition-colors',
        disabled ? 'opacity-40' : 'active:bg-muted/70',
        destructive && !disabled ? 'text-destructive' : 'text-foreground',
      )}
    >
      <Icon className="size-5 shrink-0" />
      <span className="truncate">{label}</span>
    </button>
  );
}

export function MessageSelectionBar({
  count,
  canDelete,
  canPin,
  canUnpin,
  onCopy,
  onForward,
  onDelete,
  onPin,
  onUnpin,
}: MessageSelectionBarProps) {
  const t = useTranslations('messages');

  return (
    <div className="sticky bottom-0 z-30 border-t border-border/60 bg-background/95 px-2 py-2 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md">
      <div className="flex items-stretch justify-around gap-1">
        <ActionButton
          label={t('copy')}
          icon={Copy}
          onClick={onCopy}
          disabled={count === 0}
        />
        <ActionButton
          label={t('forward')}
          icon={Forward}
          onClick={onForward}
          disabled={count === 0}
        />
        {canPin > 0 ? (
          <ActionButton label={t('pin')} icon={Pin} onClick={onPin} />
        ) : canUnpin > 0 ? (
          <ActionButton label={t('unpin')} icon={Pin} onClick={onUnpin} />
        ) : null}
        <ActionButton
          label={canDelete > 0 ? t('deleteCount', { count: canDelete }) : t('delete')}
          icon={Trash2}
          onClick={onDelete}
          disabled={canDelete === 0}
          destructive
        />
      </div>
    </div>
  );
}
