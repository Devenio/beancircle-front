'use client';

import { useMemo, useRef } from 'react';
import { MapPin, Mic, Plus, SendHorizontal, Square, Video, ImageIcon, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  onSendLocation: () => void;
  recordingMode: 'none' | 'voice' | 'video';
  recordingElapsedSec: number;
  onStartRecording: (mode: 'voice' | 'video') => void;
  onStopRecording: () => void;
  composerError?: string;
  validationHint?: string;
  placeholder: string;
  disabled?: boolean;
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
  onSendLocation,
  recordingMode,
  recordingElapsedSec,
  onStartRecording,
  onStopRecording,
  composerError,
  validationHint,
  placeholder,
  disabled,
}: ChatComposerProps) {
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  const validation = useMemo(() => validateMessageText(draft), [draft]);
  const canSend = validation.valid && !disabled;
  const showSend = draft.trim().length > 0;

  return (
    <div className="sticky bottom-0 z-20 border-t border-border/60 bg-background/95 px-3 pb-[max(0.625rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-[11px] font-medium text-primary">Reply</p>
            <p className="truncate text-xs text-muted-foreground">{messagePreview(replyTo)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancelReply} aria-label="Cancel reply">
            ✕
          </Button>
        </div>
      ) : null}

      {composerError ? <p className="mb-1.5 text-xs text-destructive">{composerError}</p> : null}
      {!validation.valid && draft.trim() && validationHint ? (
        <p className="mb-1.5 text-xs text-muted-foreground">{validationHint}</p>
      ) : null}

      <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickImage(e.target.files)} />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onPickFile(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => onPickVideo(e.target.files)} />

      <div className="flex items-end gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label="Attachments"
          >
            <Plus className="size-5" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" side="top" className="w-44">
            <DropdownMenuItem onClick={() => imageRef.current?.click()}>
              <ImageIcon className="size-4" />
              Photo
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => fileRef.current?.click()}>
              <Paperclip className="size-4" />
              File
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => videoRef.current?.click()}>
              <Video className="size-4" />
              Video
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onSendLocation}>
              <MapPin className="size-4" />
              Location
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {recordingMode === 'voice' ? (
          <VoiceRecordingBar elapsedSec={recordingElapsedSec} onStop={onStopRecording} />
        ) : (
          <div className="relative min-w-0 flex-1">
            <Textarea
              value={draft}
              onChange={(event) => {
                onDraftChange(event.target.value);
                if (event.target.value.trim()) onTyping();
              }}
              placeholder={placeholder}
              rows={1}
              disabled={disabled}
              className="max-h-28 min-h-10 resize-none rounded-2xl border-transparent bg-muted/60 px-4 py-2.5 text-[15px] shadow-none focus-visible:border-border focus-visible:ring-1"
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  if (canSend) onSend();
                }
              }}
            />
          </div>
        )}

        {recordingMode === 'voice' ? null : showSend ? (
          <Button
            type="button"
            size="icon"
            className={cn(
              'size-10 shrink-0 rounded-full transition-opacity',
              !canSend && 'opacity-40',
            )}
            onClick={onSend}
            disabled={!canSend}
            aria-label="Send message"
          >
            <SendHorizontal className="size-5" />
          </Button>
        ) : recordingMode === 'video' ? (
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="size-10 shrink-0 rounded-full"
            onClick={onStopRecording}
            aria-label="Stop video recording"
          >
            <Square className="size-4" />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="size-10 shrink-0 rounded-full"
            onClick={() => onStartRecording('voice')}
            onContextMenu={(event) => {
              event.preventDefault();
              onStartRecording('video');
            }}
            aria-label="Record voice message"
          >
            <Mic className="size-5" />
          </Button>
        )}
      </div>
    </div>
  );
}
