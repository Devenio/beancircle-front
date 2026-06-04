'use client';

import Image from 'next/image';
import { ExternalLink, FileText, MapPin, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractUrls, formatDuration, formatFileSize, renderMentionParts } from '@/components/chat/utils';

export function LinkPreviewCard({ url, isMine }: { url: string; isMine?: boolean }) {
  let hostname = url;
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    /* keep raw url */
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'mt-2 block overflow-hidden rounded-xl border transition-colors duration-200',
        isMine ? 'border-primary-foreground/20 bg-primary-foreground/10 hover:bg-primary-foreground/15' : 'border-border bg-background hover:bg-muted/50',
      )}
    >
      <div className="flex flex-col gap-1 p-3">
        <span className="flex items-center gap-1 text-xs font-medium opacity-80">
          <ExternalLink className="size-3" />
          {hostname}
        </span>
        <span className="line-clamp-2 text-xs opacity-70">{url}</span>
      </div>
    </a>
  );
}

export function FileAttachmentCard({
  name,
  size,
  url,
  isMine,
}: {
  name?: string;
  size?: number;
  url: string;
  isMine?: boolean;
}) {
  return (
    <a
      href={url}
      download={name}
      className={cn(
        'mt-1 flex items-center gap-3 rounded-xl border p-3 transition-colors duration-200',
        isMine ? 'border-primary-foreground/20 bg-primary-foreground/10' : 'border-border bg-background',
      )}
    >
      <div className={cn('flex size-10 items-center justify-center rounded-lg', isMine ? 'bg-primary-foreground/15' : 'bg-muted')}>
        <FileText className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name ?? 'Attachment'}</p>
        {size ? <p className="text-xs opacity-70">{formatFileSize(size)}</p> : null}
      </div>
    </a>
  );
}

const VOICE_WAVE_HEIGHTS = [4, 7, 5, 9, 6, 8, 4, 10, 5, 7, 6, 9, 4, 8, 5, 7, 6, 10, 4, 8];

export function VoiceMessagePlayer({
  url,
  durationSec,
  isMine,
}: {
  url: string;
  durationSec?: number;
  isMine?: boolean;
}) {
  return (
    <div
      className={cn(
        'flex min-w-[220px] items-center gap-3 rounded-xl px-1 py-1',
        isMine ? 'text-primary-foreground' : 'text-foreground',
      )}
    >
      <button
        type="button"
        className={cn(
          'flex size-11 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
          isMine ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-muted hover:bg-muted/80',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'active:scale-95',
        )}
        onClick={(event) => {
          const audio = event.currentTarget.parentElement?.querySelector('audio');
          if (!audio) return;
          if (audio.paused) void audio.play();
          else audio.pause();
        }}
        aria-label="Play voice message"
      >
        <Play className="size-4" />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-end gap-[3px]" aria-hidden>
          {VOICE_WAVE_HEIGHTS.map((height, index) => (
            <span
              key={index}
              className={cn(
                'w-[3px] shrink-0 rounded-full',
                isMine ? 'bg-primary-foreground/80' : 'bg-primary/80',
              )}
              style={{ height: `${height}px` }}
            />
          ))}
        </div>
        <span className="text-[10px] tabular-nums opacity-70">{formatDuration(durationSec)}</span>
      </div>
      <audio src={url} preload="metadata" className="sr-only" />
    </div>
  );
}

export function LocationCard({
  lat,
  lng,
  label,
  isMine,
}: {
  lat: number;
  lng: number;
  label?: string;
  isMine?: boolean;
}) {
  const mapsUrl = `https://maps.google.com/?q=${lat},${lng}`;
  const previewUrl = `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lng}&zoom=14&size=400x180&markers=${lat},${lng},red-pushpin`;

  return (
    <a
      href={mapsUrl}
      target="_blank"
      rel="noreferrer noopener"
      className={cn(
        'mt-1 block overflow-hidden rounded-xl border transition-colors duration-200',
        isMine ? 'border-primary-foreground/20 bg-primary-foreground/10' : 'border-border bg-background',
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={previewUrl} alt="" className="h-28 w-full object-cover" loading="lazy" />
      <div className="flex items-center gap-3 p-3">
        <div className={cn('flex size-10 shrink-0 items-center justify-center rounded-lg', isMine ? 'bg-primary-foreground/15' : 'bg-muted')}>
          <MapPin className="size-5" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{label ?? 'Shared location'}</p>
          <p className="text-xs opacity-70">
            {lat.toFixed(4)}, {lng.toFixed(4)} · Open in Google Maps
          </p>
        </div>
      </div>
    </a>
  );
}

export function MentionText({ body, isMine }: { body: string; isMine?: boolean }) {
  return (
    <p className="break-words text-[15px] leading-relaxed">
      {renderMentionParts(body).map((part) =>
        part.type === 'mention' ? (
          <span
            key={part.key}
            className={cn('font-semibold', isMine ? 'text-primary-foreground/80' : 'text-primary')}
          >
            {part.value}
          </span>
        ) : (
          <span key={part.key}>{part.value}</span>
        ),
      )}
    </p>
  );
}

export function MessageBodyContent({
  type,
  body,
  sticker,
  attachment,
  location,
  imageUrl,
  isMine,
}: {
  type: string;
  body?: string;
  sticker?: string;
  attachment?: { url: string; name?: string; size?: number; durationSec?: number };
  location?: { lat: number; lng: number; label?: string };
  imageUrl?: string;
  isMine?: boolean;
}) {
  if (type === 'sticker') {
    return <p className="text-4xl leading-none">{sticker ?? '😀'}</p>;
  }

  const mediaUrl = attachment?.url ?? imageUrl;

  if (type === 'image' && mediaUrl) {
    return (
      <div className="overflow-hidden rounded-xl">
        <Image
          src={mediaUrl}
          alt={attachment?.name ?? 'Image'}
          width={280}
          height={200}
          className="max-h-56 w-full object-cover transition-opacity duration-200"
        />
      </div>
    );
  }

  if (type === 'video' && mediaUrl) {
    return <video controls className="max-h-56 w-full rounded-xl" src={mediaUrl} />;
  }

  if (type === 'voice' && attachment?.url) {
    return <VoiceMessagePlayer url={attachment.url} durationSec={attachment.durationSec} isMine={isMine} />;
  }

  if (type === 'file' && attachment?.url) {
    return <FileAttachmentCard name={attachment.name} size={attachment.size} url={attachment.url} isMine={isMine} />;
  }

  if (type === 'location' && location) {
    return <LocationCard {...location} isMine={isMine} />;
  }

  return (
    <>
      {body ? <MentionText body={body} isMine={isMine} /> : null}
      {type === 'text' && body
        ? extractUrls(body).map((url) => <LinkPreviewCard key={url} url={url} isMine={isMine} />)
        : null}
    </>
  );
}
