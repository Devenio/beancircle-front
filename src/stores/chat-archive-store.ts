import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const LEGACY_ARCHIVED_KEY = 'chat.archived.ids';

export type ArchivePlacement = 'top' | 'bottom';

type ChatArchiveState = {
  /** conversationId → archivedAt (ms) */
  archivedAt: Record<string, number>;
  /** Local unread override until chat is opened */
  forceUnreadIds: string[];
  placement: ArchivePlacement;
  autoUnarchiveOnMessage: boolean;
  /** Last time user opened a conversation (for smart suggestions) */
  lastOpenedAt: Record<string, number>;
  archive: (conversationId: string) => void;
  unarchive: (conversationId: string) => void;
  isArchived: (conversationId: string) => boolean;
  setPlacement: (placement: ArchivePlacement) => void;
  setAutoUnarchiveOnMessage: (enabled: boolean) => void;
  markForceUnread: (conversationId: string) => void;
  clearForceUnread: (conversationId: string) => void;
  recordOpened: (conversationId: string) => void;
  maybeAutoUnarchive: (conversationId: string) => boolean;
};

function migrateLegacyArchived(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LEGACY_ARCHIVED_KEY);
    if (!raw) return {};
    const ids = JSON.parse(raw) as string[];
    localStorage.removeItem(LEGACY_ARCHIVED_KEY);
    const now = Date.now();
    return Object.fromEntries(ids.map((id) => [id, now]));
  } catch {
    return {};
  }
}

export const useChatArchiveStore = create<ChatArchiveState>()(
  persist(
    (set, get) => ({
      archivedAt: {},
      forceUnreadIds: [],
      placement: 'top',
      autoUnarchiveOnMessage: false,
      lastOpenedAt: {},

      archive: (conversationId) => {
        set((s) => ({
          archivedAt: { ...s.archivedAt, [conversationId]: Date.now() },
        }));
      },

      unarchive: (conversationId) => {
        set((s) => {
          const next = { ...s.archivedAt };
          delete next[conversationId];
          return { archivedAt: next };
        });
      },

      isArchived: (conversationId) => Boolean(get().archivedAt[conversationId]),

      setPlacement: (placement) => set({ placement }),

      setAutoUnarchiveOnMessage: (enabled) => set({ autoUnarchiveOnMessage: enabled }),

      markForceUnread: (conversationId) =>
        set((s) => ({
          forceUnreadIds: s.forceUnreadIds.includes(conversationId)
            ? s.forceUnreadIds
            : [...s.forceUnreadIds, conversationId],
        })),

      clearForceUnread: (conversationId) =>
        set((s) => ({
          forceUnreadIds: s.forceUnreadIds.filter((id) => id !== conversationId),
        })),

      recordOpened: (conversationId) =>
        set((s) => ({
          lastOpenedAt: { ...s.lastOpenedAt, [conversationId]: Date.now() },
        })),

      maybeAutoUnarchive: (conversationId) => {
        const { autoUnarchiveOnMessage, archivedAt } = get();
        if (!autoUnarchiveOnMessage || !archivedAt[conversationId]) return false;
        get().unarchive(conversationId);
        return true;
      },
    }),
    {
      name: 'beancircle-chat-archive',
      partialize: (s) => ({
        archivedAt: s.archivedAt,
        forceUnreadIds: s.forceUnreadIds,
        placement: s.placement,
        autoUnarchiveOnMessage: s.autoUnarchiveOnMessage,
        lastOpenedAt: s.lastOpenedAt,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const legacy = migrateLegacyArchived();
        if (Object.keys(legacy).length > 0) {
          state.archivedAt = { ...legacy, ...state.archivedAt };
        }
      },
    },
  ),
);

export function getArchivedConversationIds(): string[] {
  return Object.keys(useChatArchiveStore.getState().archivedAt);
}

export function getDisplayUnread(
  conversationId: string,
  apiUnread: number,
): number {
  const { forceUnreadIds } = useChatArchiveStore.getState();
  if (forceUnreadIds.includes(conversationId) && apiUnread === 0) return 1;
  return apiUnread;
}
