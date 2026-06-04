'use client';

import { useCallback, useRef, useState } from 'react';
import { Download, ImageIcon, MapPin, Paperclip, Video } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { ChatBottomSheet } from '@/components/chat/chat-bottom-sheet';
import { cn } from '@/lib/utils';

type AttachmentPickerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPickImage: () => void;
  onPickFile: () => void;
  onPickVideo: () => void;
  onOpenLocation: () => void;
};

export function AttachmentPickerSheet({
  open,
  onOpenChange,
  onPickImage,
  onPickFile,
  onPickVideo,
  onOpenLocation,
}: AttachmentPickerSheetProps) {
  const t = useTranslations('messages');

  const items = [
    { icon: ImageIcon, label: t('photo'), onClick: onPickImage, color: 'text-sky-500' },
    { icon: Video, label: t('video'), onClick: onPickVideo, color: 'text-violet-500' },
    { icon: Paperclip, label: t('file'), onClick: onPickFile, color: 'text-amber-600' },
    { icon: MapPin, label: t('location'), onClick: onOpenLocation, color: 'text-emerald-500' },
  ];

  const closeAnd = (fn: () => void) => {
    fn();
    onOpenChange(false);
  };

  return (
    <ChatBottomSheet open={open} onOpenChange={onOpenChange} title={t('attachments')}>
      <div className="grid grid-cols-4 gap-3 px-4 pb-4">
        {items.map(({ icon: Icon, label, onClick, color }) => (
          <button
            key={label}
            type="button"
            onClick={() => closeAnd(onClick)}
            className={cn(
              'flex flex-col items-center gap-2 rounded-2xl p-3 transition-colors',
              'hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            )}
          >
            <span className={cn('flex size-11 items-center justify-center rounded-full bg-muted', color)}>
              <Icon className="size-5" />
            </span>
            <span className="text-xs font-medium">{label}</span>
          </button>
        ))}
      </div>
    </ChatBottomSheet>
  );
}

type MediaViewerSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url?: string;
  type?: 'image' | 'video';
  onSave?: () => void;
  onShare?: () => void;
  onCopyLink?: () => void;
};

export function MediaViewerSheet({
  open,
  onOpenChange,
  url,
  type = 'image',
  onSave,
  onShare,
  onCopyLink,
}: MediaViewerSheetProps) {
  const t = useTranslations('messages');
  const [scale, setScale] = useState(1);
  const lastTapRef = useRef(0);

  const handleDoubleTap = useCallback(() => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      setScale((s) => (s > 1 ? 1 : 2));
    }
    lastTapRef.current = now;
  }, []);

  return (
    <ChatBottomSheet
      open={open}
      onOpenChange={(v) => {
        if (!v) setScale(1);
        onOpenChange(v);
      }}
      title={t('mediaDetails')}
      className="max-h-[95dvh]"
    >
      {url ? (
        <div
          className="flex max-h-[55dvh] items-center justify-center overflow-hidden px-4"
          onClick={handleDoubleTap}
          onKeyDown={(e) => e.key === 'Enter' && handleDoubleTap()}
          role="button"
          tabIndex={0}
          aria-label={t('doubleTapZoom')}
        >
          {type === 'video' ? (
            <video
              src={url}
              controls
              className="max-h-[55dvh] w-full rounded-xl"
              style={{ transform: `scale(${scale})`, transition: 'transform 200ms ease-out' }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt=""
              className="max-h-[55dvh] max-w-full object-contain"
              style={{ transform: `scale(${scale})`, transition: 'transform 200ms ease-out' }}
            />
          )}
        </div>
      ) : null}
      <div className="mt-4 flex justify-center gap-2 px-4 pb-4">
        {onSave ? (
          <button type="button" onClick={onSave} className={actionChip()}>
            <Download className="size-4" />
            {t('saveMedia')}
          </button>
        ) : null}
        {onShare ? (
          <button type="button" onClick={onShare} className={actionChip()}>
            {t('share')}
          </button>
        ) : null}
        {onCopyLink ? (
          <button type="button" onClick={onCopyLink} className={actionChip()}>
            {t('copyLink')}
          </button>
        ) : null}
      </div>
    </ChatBottomSheet>
  );
}

function actionChip() {
  return cn(
    'inline-flex items-center gap-2 rounded-full bg-muted px-4 py-2 text-sm font-medium transition-colors',
    'hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
  );
}
