'use client';

import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Square, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatDuration } from '@/components/chat/utils';

const BAR_COUNT = 24;

type VoiceRecordingBarProps = {
  elapsedSec: number;
  isPaused: boolean;
  onStop: () => void;
  onPause: () => void;
  onResume: () => void;
  onCancel: () => void;
  analyser?: AnalyserNode | null;
  className?: string;
};

export function VoiceRecordingBar({
  elapsedSec,
  isPaused,
  onStop,
  onPause,
  onResume,
  onCancel,
  analyser,
  className,
}: VoiceRecordingBarProps) {
  const [levels, setLevels] = useState<number[]>(() => Array.from({ length: BAR_COUNT }, () => 4));
  const rafRef = useRef<number | null>(null);
  const historyRef = useRef<number[]>(Array.from({ length: BAR_COUNT }, () => 4));

  useEffect(() => {
    if (!analyser || isPaused) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const data = new Uint8Array(analyser.frequencyBinCount);

    const loop = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      const normalized = Math.max(3, Math.min(20, (avg / 255) * 20 + 3));
      historyRef.current = [...historyRef.current.slice(1), normalized];
      setLevels([...historyRef.current]);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [analyser, isPaused]);

  // Fallback animated bars when no analyser
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (analyser || isPaused) return;
    const id = setInterval(() => setTick((v) => v + 1), 100);
    return () => clearInterval(id);
  }, [analyser, isPaused]);

  const staticHeights = [3, 5, 8, 4, 7, 6, 9, 5, 8, 4, 6, 7, 5, 9, 4, 6, 8, 5, 7, 4, 6, 8, 5, 7];
  const displayLevels = analyser
    ? levels
    : staticHeights.map((h, i) => (isPaused ? h : h + ((i + tick) % 4)));

  return (
    <div
      className={cn(
        'flex min-h-10 flex-1 items-center gap-2 rounded-2xl bg-destructive/10 px-3 py-2',
        className,
      )}
      role="status"
      aria-live="polite"
      aria-label={`${isPaused ? 'Paused' : 'Recording'} voice message, ${formatDuration(elapsedSec)}`}
    >
      {/* Cancel */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8 shrink-0 rounded-full text-muted-foreground hover:text-destructive"
        onClick={onCancel}
        aria-label="Cancel recording"
      >
        <Trash2 className="size-4" />
      </Button>

      {/* Waveform */}
      <div className="flex min-w-0 flex-1 items-center gap-[2px]" aria-hidden>
        {displayLevels.map((height, index) => (
          <span
            key={index}
            className={cn(
              'w-[3px] shrink-0 rounded-full transition-[height] duration-100',
              isPaused ? 'bg-destructive/30' : 'bg-destructive/70',
            )}
            style={{ height: `${height}px` }}
          />
        ))}
      </div>

      {/* Timer */}
      <span
        className={cn(
          'shrink-0 text-sm font-medium tabular-nums',
          isPaused ? 'text-muted-foreground' : 'text-destructive',
        )}
      >
        {isPaused && <span className="mr-1 text-xs opacity-60">II</span>}
        {formatDuration(elapsedSec)}
      </span>

      {/* Pause / Resume */}
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="size-8 shrink-0 rounded-full text-destructive hover:bg-destructive/10"
        onClick={isPaused ? onResume : onPause}
        aria-label={isPaused ? 'Resume recording' : 'Pause recording'}
      >
        {isPaused ? <Play className="size-4" /> : <Pause className="size-4" />}
      </Button>

      {/* Stop & Send */}
      <Button
        type="button"
        size="icon"
        variant="destructive"
        className="size-9 shrink-0 rounded-full"
        onClick={onStop}
        aria-label="Stop and send"
      >
        <Square className="size-4" />
      </Button>
    </div>
  );
}
