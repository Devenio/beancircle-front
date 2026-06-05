'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type DeleteForPeerDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  peerName?: string | null;
  showAlsoDeleteForPeer?: boolean;
  alsoDeleteLabel?: string;
  alsoDeleteForPeer: boolean;
  onAlsoDeleteForPeerChange: (value: boolean) => void;
  confirmLabel?: string;
  onConfirm: () => void;
  loading?: boolean;
};

export function DeleteForPeerDialog({
  open,
  onOpenChange,
  title,
  description,
  peerName,
  showAlsoDeleteForPeer = true,
  alsoDeleteLabel,
  alsoDeleteForPeer,
  onAlsoDeleteForPeerChange,
  confirmLabel,
  onConfirm,
  loading = false,
}: DeleteForPeerDialogProps) {
  const t = useTranslations('messages');
  const peer = peerName?.trim() || t('unknownUser');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        {showAlsoDeleteForPeer ? (
          <label
            className={cn(
              'flex cursor-pointer items-start gap-3 rounded-xl border border-border px-3 py-3',
              'transition-colors hover:bg-muted/40',
            )}
          >
            <input
              type="checkbox"
              checked={alsoDeleteForPeer}
              onChange={(e) => onAlsoDeleteForPeerChange(e.target.checked)}
              className="mt-0.5 size-4 shrink-0 accent-primary"
            />
            <span className="text-sm leading-snug">
              {alsoDeleteLabel ?? t('alsoDeleteFor', { name: peer })}
            </span>
          </label>
        ) : null}
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            {t('cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {confirmLabel ?? t('delete')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
