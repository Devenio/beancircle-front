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

/**
 * Global mount point for the bug reporter. Installs diagnostics + activity
 * recording, wires shake-to-report, renders a floating trigger, flushes the
 * offline queue, and hosts the report sheet. Mount once in the locale layout.
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
  const capturingRef = useRef(false);

  // Install passive diagnostics once.
  useEffect(() => {
    installDiagnostics();
    installActivityRecorder();
  }, []);

  const trigger = useCallback(async () => {
    if (capturingRef.current || open) return;
    capturingRef.current = true;
    haptic('medium');
    setFlash(true);
    setTimeout(() => setFlash(false), 450);
    // Capture the screen BEFORE the sheet opens so it isn't in the shot.
    const shot = await captureScreenshot();
    openSheet(shot?.dataUrl ?? null);
    capturingRef.current = false;
  }, [open, openSheet]);

  useShake({ enabled: shakeEnabled && !!user && !open, onShake: trigger });

  // Flush queued reports when connectivity returns.
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
        break; // stop on first failure; retry later
      }
    }
  }, [dequeue, bumpAttempt]);

  useEffect(() => {
    if (!user) return;
    void flush();
    const onOnline = () => void flush();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
    // re-run when queue length changes so newly-queued items flush soon
  }, [user, flush, queue.length]);

  if (!user) return null;

  return (
    <>
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

      {!open && (
        <motion.button
          type="button"
          aria-label="Report a problem"
          onClick={trigger}
          whileTap={{ scale: 0.9 }}
          data-bug-report-ignore="true"
          className="fixed bottom-24 right-[max(1rem,calc(50%-215px+1rem))] z-50 flex h-12 w-12 items-center justify-center rounded-full border border-white/10 bg-foreground/80 text-background shadow-lg backdrop-blur-md"
        >
          <Bug className="h-5 w-5" />
        </motion.button>
      )}

      <BugReportSheet />
    </>
  );
}
