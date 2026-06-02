'use client';

import { useState, type ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

type ReportTargetType = 'USER' | 'POST' | 'REVIEW' | 'CAFE' | 'MESSAGE';

type ReportDialogProps = {
  targetType: ReportTargetType;
  targetId: string;
  locale?: string;
  trigger: ReactNode;
};

export function ReportDialog({
  targetType,
  targetId,
  locale,
  trigger,
}: ReportDialogProps) {
  const t = useTranslations('report');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  async function submit() {
    if (reason.trim().length < 10) return;
    setStatus('loading');
    try {
      await api('/reports', {
        method: 'POST',
        locale,
        body: JSON.stringify({ targetType, targetId, reason: reason.trim() }),
      });
      setStatus('done');
      setReason('');
      setTimeout(() => {
        setOpen(false);
        setStatus('idle');
      }, 1200);
    } catch {
      setStatus('error');
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('title')}</DialogTitle>
        </DialogHeader>
        <Textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={t('placeholder')}
          rows={4}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">{t('hint')}</p>
        {status === 'done' && (
          <p className="text-sm text-green-600">{t('success')}</p>
        )}
        {status === 'error' && (
          <p className="text-sm text-destructive">{t('error')}</p>
        )}
        <Button
          type="button"
          disabled={reason.trim().length < 10 || status === 'loading'}
          onClick={submit}
          className="w-full"
        >
          {status === 'loading' ? t('submitting') : t('submit')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
