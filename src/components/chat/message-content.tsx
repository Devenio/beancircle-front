'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Eye, ExternalLink, FileText, MapPin, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/utils';
import { extractUrls, formatDuration, formatFileSize, renderMentionParts } from '@/components/chat/utils';
import { useChatPrefs } from '@/components/chat/chat-prefs-context';

function SpoilerMedia({ children }: { children: React.ReactNode }) {
  const [revealed, setRevealed] = useState(false);

  if (revealed) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => setRevealed(true)}
      className="relative block w-full overflow-hidden rounded-xl text-left"
      aria-label="Reveal spoiler"
    >
      <div className="pointer-events-none select-none blur-2xl saturate-50" aria-hidden>
        {children}
      </div>
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
          <Eye className="size-3.5" />
          Spoiler
        </span>
      </span>
    </button>
  );
}

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
const SPEEDS = [1, 1.5, 2] as const;

export function VoiceMessagePlayer({
  url,
  durationSec,
  isMine,
}: {
  url: string;
  durationSec?: number;
  isMine?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [currentSec, setCurrentSec] = useState(0);
  const [duration, setDuration] = useState(durationSec ?? 0);
  const [speedIdx, setSpeedIdx] = useState(0);

  const speed = SPEEDS[speedIdx];
  const progress = duration > 0 ? (currentSec / duration) * 100 : 0;

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onTime = () => setCurrentSec(audio.currentTime);
    const onMeta = () => {
      if (isFinite(audio.duration)) setDuration(audio.duration);
    };
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    const onEnded = () => { setPlaying(false); setCurrentSec(0); };
    audio.addEventListener('timeupdate', onTime);
    audio.addEventListener('loadedmetadata', onMeta);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('ended', onEnded);
    return () => {
      audio.removeEventListener('timeupdate', onTime);
      audio.removeEventListener('loadedmetadata', onMeta);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('ended', onEnded);
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) void audio.play();
    else audio.pause();
  };

  const seek = (pct: number) => {
    const audio = audioRef.current;
    if (!audio || !isFinite(audio.duration)) return;
    audio.currentTime = (pct / 100) * audio.duration;
    setCurrentSec(audio.currentTime);
  };

  const cycleSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (audioRef.current) audioRef.current.playbackRate = SPEEDS[next];
  };

  return (
    <div
      className={cn(
        'flex min-w-[240px] flex-col gap-2 rounded-xl px-1 py-1',
        isMine ? 'text-primary-foreground' : 'text-foreground',
      )}
    >
      <div className="flex items-center gap-2">
        {/* Play / Pause */}
        <button
          type="button"
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full transition-colors duration-200',
            isMine ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25' : 'bg-muted hover:bg-muted/80',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95',
          )}
          onClick={togglePlay}
          aria-label={playing ? 'Pause voice message' : 'Play voice message'}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
        </button>

        {/* Waveform / Progress track */}
        <div className="relative flex min-w-0 flex-1 cursor-pointer items-center" aria-hidden>
          <div className="flex w-full items-end gap-[2px]">
            {VOICE_WAVE_HEIGHTS.map((height, index) => {
              const barPct = ((index + 1) / VOICE_WAVE_HEIGHTS.length) * 100;
              return (
                <span
                  key={index}
                  className={cn(
                    'w-[3px] shrink-0 rounded-full transition-colors duration-150',
                    barPct <= progress
                      ? isMine ? 'bg-primary-foreground' : 'bg-primary'
                      : isMine ? 'bg-primary-foreground/30' : 'bg-primary/30',
                  )}
                  style={{ height: `${height}px` }}
                />
              );
            })}
          </div>
          {/* Invisible scrub slider over waveform */}
          <input
            type="range"
            min={0}
            max={100}
            step={0.1}
            value={progress}
            onChange={(e) => seek(Number(e.target.value))}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            aria-label="Seek"
          />
        </div>

        {/* Speed toggle */}
        <button
          type="button"
          onClick={cycleSpeed}
          className={cn(
            'shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold tabular-nums transition-colors duration-150',
            isMine
              ? 'bg-primary-foreground/15 hover:bg-primary-foreground/25 text-primary-foreground'
              : 'bg-muted hover:bg-muted/80 text-foreground',
          )}
          aria-label={`Playback speed ${speed}x, tap to change`}
        >
          {speed}x
        </button>
      </div>

      {/* Time display */}
      <div className={cn('flex justify-between px-1 text-[10px] tabular-nums', isMine ? 'opacity-70' : 'opacity-60')}>
        <span>{formatDuration(Math.floor(currentSec))}</span>
        <span>{formatDuration(Math.floor(duration))}</span>
      </div>

      <audio ref={audioRef} src={url} preload="metadata" className="sr-only" />
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
  spoiler,
}: {
  type: string;
  body?: string;
  sticker?: string;
  attachment?: { url: string; name?: string; size?: number; durationSec?: number };
  location?: { lat: number; lng: number; label?: string };
  imageUrl?: string;
  isMine?: boolean;
  spoiler?: boolean;
}) {
  const { linkPreviews } = useChatPrefs();

  if (type === 'sticker') {
    return <p className="text-4xl leading-none">{sticker ?? '😀'}</p>;
  }

  const mediaUrl = attachment?.url ?? imageUrl;

  if (type === 'image' && mediaUrl) {
    const image = (
      <div className="overflow-hidden rounded-xl">
        <Image
          src={mediaUrl}
          alt={attachment?.name ?? 'Image'}
          width={280}
          height={200}
          loading="lazy"
          className="max-h-56 w-full bg-muted/40 object-cover transition-opacity duration-200"
        />
      </div>
    );
    return spoiler ? <SpoilerMedia>{image}</SpoilerMedia> : image;
  }

  if (type === 'video' && mediaUrl) {
    const video = <video controls className="max-h-56 w-full rounded-xl" src={mediaUrl} />;
    return spoiler ? <SpoilerMedia>{video}</SpoilerMedia> : video;
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
      {linkPreviews && type === 'text' && body
        ? extractUrls(body).map((url) => <LinkPreviewCard key={url} url={url} isMine={isMine} />)
        : null}
    </>
  );
}
