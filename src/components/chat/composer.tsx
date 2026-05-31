'use client';

import { useRef } from 'react';
import {
  MapPin,
  Mic,
  Paperclip,
  Plus,
  SendHorizontal,
  Square,
  Video,
  ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import type { ChatMessage } from '@/components/chat/types';
import { messagePreview } from '@/components/chat/utils';

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
  onStartRecording: (mode: 'voice' | 'video') => void;
  onStopRecording: () => void;
  composerError?: string;
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
  onStartRecording,
  onStopRecording,
  composerError,
  placeholder,
  disabled,
}: ChatComposerProps) {
  const imageRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLInputElement>(null);

  return (
    <div className="border-t border-border bg-background/95 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur-md">
      {replyTo ? (
        <div className="mb-2 flex items-center gap-2 rounded-xl border border-border bg-muted/50 px-3 py-2">
          <div className="min-w-0 flex-1 border-l-2 border-primary pl-2">
            <p className="text-[11px] font-medium text-primary">Reply</p>
            <p className="truncate text-xs text-muted-foreground">{messagePreview(replyTo)}</p>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onCancelReply} aria-label="Cancel reply">
            ✕
          </Button>
        </div>
      ) : null}

      {composerError ? <p className="mb-2 text-xs text-destructive">{composerError}</p> : null}

      <input ref={imageRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => onPickImage(e.target.files)} />
      <input ref={fileRef} type="file" multiple className="hidden" onChange={(e) => onPickFile(e.target.files)} />
      <input ref={videoRef} type="file" accept="video/*" multiple className="hidden" onChange={(e) => onPickVideo(e.target.files)} />

      <div className="flex items-end gap-2">
        <div className="flex items-center gap-1">
          <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" onClick={() => imageRef.current?.click()} aria-label="Send image">
            <ImageIcon />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" onClick={() => fileRef.current?.click()} aria-label="Send file">
            <Paperclip />
          </Button>
          <Button type="button" variant="ghost" size="icon" className="size-10 shrink-0" onClick={onSendLocation} aria-label="Send location">
            <MapPin />
          </Button>
        </div>

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
            className="max-h-32 min-h-11 resize-none rounded-2xl border-border bg-muted/40 py-2.5 pr-12"
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
          />
        </div>

        {draft.trim() ? (
          <Button type="button" size="icon" className="size-11 shrink-0 rounded-full" onClick={onSend} disabled={disabled} aria-label="Send message">
            <SendHorizontal />
          </Button>
        ) : (
          <Button
            type="button"
            size="icon"
            variant={recordingMode !== 'none' ? 'destructive' : 'secondary'}
            className={cn('size-11 shrink-0 rounded-full', recordingMode === 'video' && 'bg-primary text-primary-foreground')}
            onClick={() => {
              if (recordingMode === 'voice' || recordingMode === 'video') {
                onStopRecording();
                return;
              }
              onStartRecording('voice');
            }}
            onContextMenu={(event) => {
              event.preventDefault();
              if (recordingMode === 'none') onStartRecording('video');
            }}
            aria-label={recordingMode !== 'none' ? 'Stop recording' : 'Record voice message'}
          >
            {recordingMode !== 'none' ? <Square /> : <Mic />}
          </Button>
        )}
      </div>

      <div className="mt-1 flex items-center justify-center gap-3">
        <button type="button" className="text-[10px] text-muted-foreground" onClick={() => videoRef.current?.click()}>
          <Video className="mr-1 inline size-3" />
          Video file
        </button>
        <button
          type="button"
          className="text-[10px] text-muted-foreground"
          onClick={() => (recordingMode === 'video' ? onStopRecording() : onStartRecording('video'))}
        >
          <Plus className="mr-1 inline size-3" />
          Video note
        </button>
      </div>
    </div>
  );
}
