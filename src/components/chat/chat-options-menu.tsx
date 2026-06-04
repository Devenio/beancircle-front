'use client';

import { useState } from 'react';
import {
  Ban,
  Bell,
  BellOff,
  Eraser,
  Flag,
  MoreVertical,
  User,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

type ChatOptionsMenuProps = {
  muted?: boolean;
  onViewProfile: () => void;
  onToggleMute: () => void;
  onBlock: () => void;
  onReport: (reason: string) => void;
  onClearHistory: () => void;
};

export function ChatOptionsMenu({
  muted,
  onViewProfile,
  onToggleMute,
  onBlock,
  onReport,
  onClearHistory,
}: ChatOptionsMenuProps) {
  const t = useTranslations('messages');
  const [open, setOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [blockOpen, setBlockOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const closeMenu = () => setOpen(false);

  return (
    <>
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger
          className={cn(
            'inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label={t('chatOptions')}
        >
          <MoreVertical className="size-5" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" side="bottom" className="w-52">
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onViewProfile();
            }}
          >
            <User className="size-4" />
            {t('viewProfile')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              onToggleMute();
            }}
          >
            {muted ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            {muted ? t('unmute') : t('muteNotifications')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              closeMenu();
              setBlockOpen(true);
            }}
          >
            <Ban className="size-4" />
            {t('blockUser')}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              closeMenu();
              setReportOpen(true);
            }}
          >
            <Flag className="size-4" />
            {t('reportUser')}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            onClick={() => {
              closeMenu();
              setClearOpen(true);
            }}
          >
            <Eraser className="size-4" />
            {t('clearChatHistory')}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={reportOpen} onOpenChange={setReportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('reportUser')}</DialogTitle>
            <DialogDescription>{t('reportUserDescription')}</DialogDescription>
          </DialogHeader>
          <Input
            value={reportReason}
            onChange={(e) => setReportReason(e.target.value)}
            placeholder={t('reportReasonPlaceholder')}
            aria-label={t('reportReasonPlaceholder')}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setReportOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              disabled={reportReason.trim().length < 10}
              onClick={() => {
                onReport(reportReason.trim());
                setReportReason('');
                setReportOpen(false);
              }}
            >
              {t('reportSubmit')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={blockOpen} onOpenChange={setBlockOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('blockUser')}</DialogTitle>
            <DialogDescription>{t('blockUserDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onBlock();
                setBlockOpen(false);
              }}
            >
              {t('blockUser')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={clearOpen} onOpenChange={setClearOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('clearChatHistory')}</DialogTitle>
            <DialogDescription>{t('clearChatHistoryDescription')}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClearOpen(false)}>
              {t('cancel')}
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClearHistory();
                setClearOpen(false);
              }}
            >
              {t('clearChatHistory')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
