'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  RotateCw,
  SendHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { formatDuration, formatFileSize } from '@/components/chat/utils';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { ChatIconButton } from '@/components/chat/chat-icon-button';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';

export type MediaComposerItem = {
  file: File;
  type: 'image' | 'video' | 'file';
  previewUrl?: string;
};

type MediaComposerModalProps = {
  open: boolean;
  items: MediaComposerItem[];
  onOpenChange: (open: boolean) => void;
  onSend: (items: MediaComposerItem[], caption: string) => Promise<void>;
  uploading?: boolean;
};

export function MediaComposerModal({
  open,
  items,
  onOpenChange,
  onSend,
  uploading,
}: MediaComposerModalProps) {
  const t = useTranslations('messages');
  const coarse = useCoarsePointer();
  const [caption, setCaption] = useState('');
  const [index, setIndex] = useState(0);
  const [rotation, setRotation] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [videoTrimStart, setVideoTrimStart] = useState(0);
  const [videoTrimEnd, setVideoTrimEnd] = useState(100);
  const videoRef = useRef<HTMLVideoElement>(null);

  const current = items[index];
  const isImage = current?.type === 'image';
  const isVideo = current?.type === 'video';

  useEffect(() => {
    if (!open) return;
    setIndex(0);
    setCaption('');
    setRotation(0);
    setZoom(1);
    setVideoTrimStart(0);
    setVideoTrimEnd(100);
  }, [open, items]);

  const previewUrl = useMemo(() => {
    if (!current) return '';
    if (current.previewUrl) return current.previewUrl;
    return URL.createObjectURL(current.file);
  }, [current]);

  useEffect(() => {
    return () => {
      if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleSend = useCallback(async () => {
    await onSend(items, caption.trim());
    onOpenChange(false);
  }, [caption, items, onOpenChange, onSend]);

  if (!current) return null;

  const composerBody = (
    <>
        <div className="relative flex min-h-[240px] flex-1 items-center justify-center bg-muted/30 p-4">
          {isImage ? (
            <div className="relative max-h-[50dvh] overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt=""
                className="max-h-[50dvh] max-w-full object-contain transition-transform duration-200"
                style={{ transform: `rotate(${rotation}deg) scale(${zoom})` }}
              />
            </div>
          ) : isVideo ? (
            <div className="w-full space-y-3">
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="max-h-[40dvh] w-full rounded-xl bg-black"
              />
              <div className="space-y-1 px-1">
                <label className="text-xs text-muted-foreground">{t('trimVideo')}</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={videoTrimEnd - 1}
                    value={videoTrimStart}
                    onChange={(e) => setVideoTrimStart(Number(e.target.value))}
                    className="flex-1"
                    aria-label={t('trimStart')}
                  />
                  <input
                    type="range"
                    min={videoTrimStart + 1}
                    max={100}
                    value={videoTrimEnd}
                    onChange={(e) => setVideoTrimEnd(Number(e.target.value))}
                    className="flex-1"
                    aria-label={t('trimEnd')}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-border bg-background p-6">
              <p className="text-sm font-medium">{current.file.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(current.file.size)}</p>
            </div>
          )}

          {items.length > 1 ? (
            <>
              <ChatIconButton
                icon={ChevronLeft}
                label={t('previousMedia')}
                variant="muted"
                disabled={index === 0}
                onClick={() => setIndex((i) => i - 1)}
                className="absolute left-2 top-1/2 -translate-y-1/2 shadow-sm"
              />
              <ChatIconButton
                icon={ChevronRight}
                label={t('nextMedia')}
                variant="muted"
                disabled={index === items.length - 1}
                onClick={() => setIndex((i) => i + 1)}
                className="absolute right-2 top-1/2 -translate-y-1/2 shadow-sm"
              />
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-2 py-0.5 text-xs">
                {index + 1} / {items.length}
              </span>
            </>
          ) : null}
        </div>

        {isImage ? (
          <div className="flex items-center justify-center gap-2 border-t border-border px-4 py-2">
            <ChatIconButton icon={RotateCw} label={t('rotate')} onClick={() => setRotation((r) => r + 90)} />
            <ChatIconButton icon={ZoomIn} label={t('zoomIn')} onClick={() => setZoom((z) => Math.min(3, z + 0.25))} />
            <ChatIconButton icon={ZoomOut} label={t('zoomOut')} onClick={() => setZoom((z) => Math.max(0.5, z - 0.25))} />
            <ChatIconButton icon={X} label={t('reset')} onClick={() => { setRotation(0); setZoom(1); }} />
          </div>
        ) : null}

        {isVideo && videoRef.current?.duration ? (
          <p className="px-4 text-center text-xs text-muted-foreground">
            {formatDuration(Math.round(videoRef.current.duration))}
          </p>
        ) : null}

        <div className="space-y-3 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          <Textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={t('addCaption')}
            rows={2}
            className="min-h-11 resize-none rounded-xl"
          />
          <Button
            className="min-h-[52px] w-full rounded-full"
            disabled={uploading}
            onClick={() => void handleSend()}
          >
            {uploading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <SendHorizontal className="size-4" />
                {t('send')}
              </>
            )}
          </Button>
        </div>
    </>
  );

  if (coarse) {
    return (
      <ChatBottomSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('mediaComposerTitle')}
        description={t('mediaComposerDescription')}
        className="max-h-[95dvh]"
      >
        {composerBody}
      </ChatBottomSheet>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[92dvh] flex-col gap-0 overflow-hidden p-0 sm:max-w-md">
        <DialogHeader className="border-b border-border px-4 py-3">
          <DialogTitle>{t('mediaComposerTitle')}</DialogTitle>
          <DialogDescription className="sr-only">{t('mediaComposerDescription')}</DialogDescription>
        </DialogHeader>
        {composerBody}
      </DialogContent>
    </Dialog>
  );
}
