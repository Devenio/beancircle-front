'use client';

import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import { Loader2, Mic, Plus, SendHorizontal, Square } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Textarea } from '@/components/ui/textarea';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/components/chat/types';
import { messagePreview, validateMessageText } from '@/components/chat/utils';
import { VoiceRecordingBar } from '@/components/chat/voice-recording-bar';
import { ChatIconButton } from '@/components/chat/chat-icon-button';
import { AttachmentPickerSheet } from '@/components/chat/attachment-picker-sheet';
import { useCoarsePointer } from '@/hooks/use-coarse-pointer';
import { haptic } from '@/lib/mobile/haptics';
import { ImageIcon, Paperclip, Video, MapPin } from 'lucide-react';

type ChatComposerProps = {
  draft: string;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  onTyping: () => void;
  replyTo: ChatMessage | null;
  onCancelReply: () => void;
  onPickImage: (files: FileList | null) => void;
  onPickFile: (files: FileList | null) => void;
  onPickVideo: (files: FileList | null) => void;
  onOpenLocation: () => void;
  recordingMode: 'none' | 'voice' | 'video';
  recordingElapsedSec: number;
  onStartRecording: (mode: 'voice' | 'video') => void;
  onStopRecording: () => void;
  composerError?: string;
  uploading?: boolean;
  placeholder: string;
  disabled?: boolean;
  inputRef?: RefObject<HTMLTextAreaElement | null>;
  autoFocus?: boolean;
};

export function ChatComposer({
  draft,
  onDraftChange,
  onSend,
  onTyping,
  replyTo,
  onCancelReply,
  onPickImage,
  onPickFile,
  onPickVideo,
  onOpenLocation,
  recordingMode,
  recordingElapsedSec,
  onStartRecording,
  onStopRecording,
  composerError,
  uploading,
  placeholder,
  disabled,
  inputRef: externalRef,
  autoFocus = true,
}: ChatComposerProps) {
  const t = useTranslations('messages');
  const coarse = useCoarsePointer();
  const [attachOpen, setAttachOpen] = useState(false);
  const internalRef = useRef<HTMLTextAreaElement>(null);
  const textareaRef = externalRef ?? internalRef;
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);
  const cursorRef = useRef<number | null>(null);

  const validation = useMemo(() => validateMessageText(draft), [draft]);
  const canSend = validation.valid && !disabled;
  const showSend = draft.trim().length > 0;

  useEffect(() => {
    if (!autoFocus || recordingMode !== 'none') return;
    const node = textareaRef.current;
    if (!node) return;
    node.focus({ preventScroll: true });
  }, [autoFocus, recordingMode, textareaRef]);

  const handleDraftChange = (value: string) => {
    const node = textareaRef.current;
    if (node) cursorRef.current = node.selectionStart;
    onDraftChange(value);
    if (value.trim()) onTyping();
  };

  useEffect(() => {
    const node = textareaRef.current;
    if (!node || cursorRef.current === null) return;
    const pos = cursorRef.current;
    node.setSelectionRange(pos, pos);
    cursorRef.current = null;
  }, [draft, textareaRef]);

  const focusInput = () => {
    requestAnimationFrame(() => {
      textareaRef.current?.focus({ preventScroll: true });
    });
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-[11px] font-medium text-primary">{t('reply')}</p>
            <p className="truncate text-xs text-muted-foreground">{messagePreview(replyTo)}</p>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            aria-label={t('cancelReply')}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ✕
          </button>
        </div>
      ) : null}

      {uploading ? (
        <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Loader2 className="size-3 animate-spin" />
          {t('uploading')}
        </p>
      ) : null}
      {composerError ? <p className="mb-1.5 text-xs text-destructive">{composerError}</p> : null}

      <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => { onPickImage(e.target.files); e.target.value = ''; }} />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => { onPickFile(e.target.files); e.target.value = ''; }} />
      <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => { onPickVideo(e.target.files); e.target.value = ''; }} />

      <div className="flex items-end gap-2">
        {coarse ? (
          <>
            <ChatIconButton
              icon={Plus}
              label={t('attachments')}
              onClick={() => setAttachOpen(true)}
            />
            <AttachmentPickerSheet
              open={attachOpen}
              onOpenChange={setAttachOpen}
              onPickImage={() => imageRef.current?.click()}
              onPickFile={() => fileRef.current?.click()}
              onPickVideo={() => videoRef.current?.click()}
              onOpenLocation={onOpenLocation}
            />
          </>
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex size-12 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-all duration-200 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.97]"
              aria-label={t('attachments')}
            >
              <Plus className="size-5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" side="top" className="w-44">
              <DropdownMenuItem onClick={() => imageRef.current?.click()}>
                <ImageIcon className="size-4" />
                {t('photo')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => fileRef.current?.click()}>
                <Paperclip className="size-4" />
                {t('file')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => videoRef.current?.click()}>
                <Video className="size-4" />
                {t('video')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onOpenLocation}>
                <MapPin className="size-4" />
                {t('location')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {recordingMode === 'voice' ? (
          <VoiceRecordingBar elapsedSec={recordingElapsedSec} onStop={onStopRecording} />
        ) : (
          <div className="relative min-w-0 flex-1">
            <Textarea
              ref={textareaRef}
              value={draft}
              onChange={(event) => handleDraftChange(event.target.value)}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="max-h-28 min-h-12 resize-none rounded-2xl border-transparent bg-muted/60 px-4 py-3 text-base shadow-none focus-visible:border-border focus-visible:ring-1"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) {
                    onSend();
                    focusInput();
                  }
                }
              }}
            />
          </div>
        )}

        {recordingMode === 'voice' ? null : showSend ? (
          <ChatIconButton
            icon={SendHorizontal}
            label={t('send')}
            variant="primary"
            size="primary"
            disabled={!canSend}
            onClick={() => {
              if (!canSend) return;
              haptic('light');
              onSend();
              focusInput();
            }}
          />
        ) : recordingMode === 'video' ? (
          <ChatIconButton
            icon={Square}
            label={t('stopVideoRecording')}
            variant="destructive"
            onClick={onStopRecording}
          />
        ) : (
          <ChatIconButton
            icon={Mic}
            label={t('recordVoice')}
            variant="muted"
            onClick={() => onStartRecording('voice')}
          />
        )}
      </div>
    </div>
  );
}
