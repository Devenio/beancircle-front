'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Bug } from 'lucide-react';
import { useShake } from '@/hooks/use-shake';
import { haptic } from '@/lib/mobile/haptics';
import { installDiagnostics } from '@/lib/bug-report/console-buffer';
import { installActivityRecorder } from '@/lib/bug-report/activity-recorder';
import { captureScreenshot } from '@/lib/bug-report/screenshot';
import { useBugReportStore } from '@/stores/bug-report-store';
import { useAuthStore } from '@/stores/auth-store';
import { createBugReport } from '@/lib/api/bug-reports';
import { BugReportSheet } from './bug-report-sheet';

const MAX_QUEUE_ATTEMPTS = 5;
// How long the tab stays revealed before auto-collapsing (ms).
const AUTO_COLLAPSE_MS = 4000;

/**
 * Global mount point for the bug reporter. Installs diagnostics + activity
 * recording, wires shake-to-report, renders a right-edge peek tab, flushes
 * the offline queue, and hosts the report sheet. Mount once in the locale layout.
 *
 * Interaction model:
 *  - Shake phone → opens sheet directly (primary path).
 *  - Tap the peek tab → it slides out to reveal the Bug button.
 *  - Tap the revealed button → captures screenshot and opens sheet.
 *  - Tab auto-collapses after AUTO_COLLAPSE_MS of inactivity.
 */
export function BugReportLauncher() {
  const user = useAuthStore((s) => s.user);
  const open = useBugReportStore((s) => s.open);
  const openSheet = useBugReportStore((s) => s.openSheet);
  const shakeEnabled = useBugReportStore((s) => s.shakeEnabled);
  const queue = useBugReportStore((s) => s.queue);
  const dequeue = useBugReportStore((s) => s.dequeue);
  const bumpAttempt = useBugReportStore((s) => s.bumpAttempt);

  const [flash, setFlash] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const capturingRef = useRef(false);
  const collapseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    installDiagnostics();
    installActivityRecorder();
  }, []);

  const scheduleCollapse = useCallback(() => {
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    collapseTimerRef.current = setTimeout(() => setRevealed(false), AUTO_COLLAPSE_MS);
  }, []);

  const trigger = useCallback(async () => {
    if (capturingRef.current || open) return;
    capturingRef.current = true;
    setRevealed(false);
    if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
    haptic('medium');
    setFlash(true);
    setTimeout(() => setFlash(false), 450);
    const shot = await captureScreenshot();
    openSheet(shot?.dataUrl ?? null);
    capturingRef.current = false;
  }, [open, openSheet]);

  function reveal() {
    haptic('selection');
    setRevealed(true);
    scheduleCollapse();
  }

  useShake({ enabled: shakeEnabled && !!user && !open, onShake: trigger });

  const flush = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    for (const item of useBugReportStore.getState().queue) {
      if (item.attempts >= MAX_QUEUE_ATTEMPTS) {
        dequeue(item.clientToken);
        continue;
      }
      try {
        await createBugReport(item.payload);
        dequeue(item.clientToken);
      } catch {
        bumpAttempt(item.clientToken);
        break;
      }
    }
  }, [dequeue, bumpAttempt]);

  useEffect(() => {
    if (!user) return;
    void flush();
    const onOnline = () => void flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [user, flush, queue.length]);

  // Clean up timer on unmount.
  useEffect(() => () => { if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current); }, []);

  if (!user) return null;

  return (
    <>
      {/* Shake / screenshot flash overlay */}
      <AnimatePresence>
        {flash && (
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 22 }}
            data-bug-report-ignore="true"
            className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center"
          >
            <div className="rounded-3xl bg-foreground/10 px-6 py-4 backdrop-blur-md">
              <Bug className="h-10 w-10 text-primary" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/*
       * Right-edge peek tab. Two distinct hit targets so taps never leak onto
       * content underneath:
       *  - Collapsed: only a ~10px peek strip is interactive. The full tab is
       *    translated off-screen AND pointer-events:none, so it can't swallow
       *    taps meant for content (e.g. a conversation row) beneath it.
       *  - Revealed: a transparent backdrop catches outside clicks to collapse,
       *    and the full tab becomes interactive to launch the reporter.
       */}
      {!open && (
        <>
          {revealed && (
            <div
              className="fixed inset-0 z-40"
              data-bug-report-ignore="true"
              onClick={() => setRevealed(false)}
            />
          )}

          <div
            className="pointer-events-none fixed inset-0 z-50 flex justify-center"
            data-bug-report-ignore="true"
          >
            <div className="relative w-full max-w-[430px]">
              {/* Collapsed peek strip — the only hit target when idle */}
              {!revealed && (
                <button
                  type="button"
                  aria-label="Open bug reporter"
                  onClick={reveal}
                  className="pointer-events-auto absolute right-0 top-[38%] h-14 w-2.5 rounded-l-full bg-foreground/20 active:bg-foreground/30 rtl:left-0 rtl:right-auto rtl:rounded-l-none rtl:rounded-r-full"
                />
              )}

              {/* Revealed tab — slides in; inert while collapsed */}
              <motion.button
                type="button"
                aria-label="Report a bug"
                onClick={() => void trigger()}
                initial={false}
                animate={{ x: revealed ? 0 : '115%', opacity: revealed ? 1 : 0 }}
                transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                className={`absolute right-0 top-[37%] flex items-center gap-2 rounded-l-2xl border border-r-0 border-border/60 bg-background/90 py-2.5 pl-4 pr-3 shadow-lg backdrop-blur-md rtl:left-0 rtl:right-auto rtl:rounded-l-none rtl:rounded-r-2xl rtl:border-l-0 rtl:border-r rtl:pl-3 rtl:pr-4 ${revealed ? 'pointer-events-auto' : 'pointer-events-none'}`}
              >
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-foreground/10">
                  <Bug className="h-4 w-4 text-foreground/70" />
                </span>
                <span className="text-xs font-medium leading-none text-foreground/80">
                  Report a bug
                </span>
              </motion.button>
            </div>
          </div>
        </>
      )}

      <BugReportSheet />
    </>
  );
}
