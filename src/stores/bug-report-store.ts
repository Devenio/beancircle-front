import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BugCategory, CreateBugReportInput } from '@/lib/api/bug-reports';

export type BugDraft = {
  title: string;
  description: string;
  category: BugCategory;
};

export type QueuedReport = {
  clientToken: string;
  /** Fully-prepared payload (URLs already uploaded). */
  payload: CreateBugReportInput;
  queuedAt: number;
  attempts: number;
};

const EMPTY_DRAFT: BugDraft = {
  title: '',
  description: '',
  category: 'BUG',
};

type BugReportState = {
  // Settings
  shakeEnabled: boolean;
  setShakeEnabled: (v: boolean) => void;

  // Draft (persisted so an interrupted report survives reloads)
  draft: BugDraft;
  setDraft: (patch: Partial<BugDraft>) => void;
  clearDraft: () => void;

  // Transient UI
  open: boolean;
  screenshot: string | null; // annotated data URL or raw capture
  rawScreenshot: string | null;
  openSheet: (screenshot: string | null) => void;
  closeSheet: () => void;
  setScreenshot: (dataUrl: string | null) => void;

  // Offline queue
  queue: QueuedReport[];
  enqueue: (item: QueuedReport) => void;
  dequeue: (clientToken: string) => void;
  bumpAttempt: (clientToken: string) => void;
};

export const useBugReportStore = create<BugReportState>()(
  persist(
    (set) => ({
      shakeEnabled: true,
      setShakeEnabled: (v) => set({ shakeEnabled: v }),

      draft: EMPTY_DRAFT,
      setDraft: (patch) => set((s) => ({ draft: { ...s.draft, ...patch } })),
      clearDraft: () => set({ draft: EMPTY_DRAFT }),

      open: false,
      screenshot: null,
      rawScreenshot: null,
      openSheet: (screenshot) =>
        set({ open: true, screenshot, rawScreenshot: screenshot }),
      closeSheet: () => set({ open: false }),
      setScreenshot: (dataUrl) => set({ screenshot: dataUrl }),

      queue: [],
      enqueue: (item) => set((s) => ({ queue: [...s.queue, item] })),
      dequeue: (clientToken) =>
        set((s) => ({
          queue: s.queue.filter((q) => q.clientToken !== clientToken),
        })),
      bumpAttempt: (clientToken) =>
        set((s) => ({
          queue: s.queue.map((q) =>
            q.clientToken === clientToken
              ? { ...q, attempts: q.attempts + 1 }
              : q,
          ),
        })),
    }),
    {
      name: 'beancircle-bug-report',
      // Persist only durable bits — never the transient screenshot/open state.
      partialize: (s) => ({
        shakeEnabled: s.shakeEnabled,
        draft: s.draft,
        queue: s.queue,
      }),
    },
  ),
);
