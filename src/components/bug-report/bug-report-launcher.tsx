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

  function handleTabTap() {
    if (revealed) {
      void trigger();
    } else {
      haptic('selection');
      setRevealed(true);
      scheduleCollapse();
    }
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
       * Right-edge peek tab — sits flush with the right edge of the 430px
       * content column. Collapses to a 5px peek when idle; slides in to reveal
       * the full Bug button on tap.
       *
       * The outer wrapper is pointer-events-none so it never blocks scroll on
       * the content underneath. Only the tab itself gets pointer events.
       */}
      {!open && (
        <div
          className="pointer-events-none fixed inset-0 z-50 flex justify-center"
          data-bug-report-ignore="true"
        >
          <div className="relative w-full max-w-[430px]">
            {/* Peek strip — visible even when collapsed */}
            <motion.div
              className="pointer-events-auto absolute right-0 top-[38%] flex cursor-pointer select-none flex-col items-end"
              onClick={handleTabTap}
              aria-label={revealed ? 'Report a bug' : 'Open bug reporter'}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleTabTap(); }}
            >
              {/* The sliding body */}
              <motion.div
                animate={{ x: revealed ? 0 : 'calc(100% - 5px)' }}
                transition={{ type: 'spring', stiffness: 380, damping: 28 }}
                className="flex items-center gap-2 rounded-l-2xl border border-r-0 border-border/60 bg-background/90 py-2.5 pl-3 pr-2 shadow-lg backdrop-blur-md rtl:rounded-l-none rtl:rounded-r-2xl rtl:border-l-0 rtl:border-r rtl:pl-2 rtl:pr-3"
              >
                <span className="text-[11px] font-medium leading-none text-muted-foreground">
                  {revealed ? 'Report' : ''}
                </span>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground/10">
                  <Bug className="h-4 w-4 text-foreground/70" />
                </span>
              </motion.div>

              {/* Thin accent line that's always visible (the "peek") */}
              <motion.div
                animate={{ opacity: revealed ? 0 : 1 }}
                transition={{ duration: 0.18 }}
                className="absolute inset-y-0 right-0 w-[5px] rounded-l-full bg-foreground/20"
              />
            </motion.div>
          </div>
        </div>
      )}

      <BugReportSheet />
    </>
  );
}
