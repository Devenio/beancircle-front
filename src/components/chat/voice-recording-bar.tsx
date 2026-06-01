'use client';

import { useEffect, useState } from 'react';
import { Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/components/chat/utils';

const WAVE_BARS = [3, 5, 8, 4, 7, 6, 9, 5, 8, 4, 6, 7, 5, 9, 4, 6, 8, 5, 7, 4];

type VoiceRecordingBarProps = {
  elapsedSec: number;
  onStop: () => void;
  className?: string;
};

export function VoiceRecordingBar({ elapsedSec, onStop, className }: VoiceRecordingBarProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setTick((value) => value + 1), 120);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className={cn(
        'flex min-h-10 flex-1 items-center gap-3 rounded-2xl bg-destructive/10 px-3 py-2',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`Recording voice message, ${formatDuration(elapsedSec)}`}
    >
      <span className="relative flex size-2.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-destructive opacity-60" />
        <span className="relative inline-flex size-2.5 rounded-full bg-destructive" />
      </span>

      <div className="flex min-w-0 flex-1 items-center gap-0.5" aria-hidden>
        {WAVE_BARS.map((height, index) => (
          <span
            key={index}
            className="w-[3px] shrink-0 rounded-full bg-destructive/70 transition-[height] duration-150"
            style={{
              height: `${height + ((index + tick) % 3)}px`,
            }}
          />
        ))}
      </div>

      <span className="shrink-0 text-sm font-medium tabular-nums text-destructive">
        {formatDuration(elapsedSec)}
      </span>

      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="size-9 shrink-0 rounded-full"
        onClick={onStop}
        aria-label="Stop recording"
      >
        <Square className="size-4" />
      </Button>
    </div>
  );
}
