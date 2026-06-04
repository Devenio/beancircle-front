'use client';

import { create } from 'zustand';

/**
 * Ephemeral, presentation-only realtime state.
 *
 * Everything that must be consistent between users (unread counts, reactions,
 * read/seen state, pins, mutes) is now SERVER-AUTHORITATIVE and read from the
 * REST/React-Query cache + socket events. This store only holds transient UI
 * signals that are inherently local to the current session:
 *  - who is currently online (presence)
 *  - who is currently typing in which conversation
 */

type TypingState = Record<string, string | null>;
type LastSeenState = Record<string, { lastSeenAt: string | null; hidden?: boolean }>;

type ChatStore = {
  typingByConversation: TypingState;
  onlineUserIds: Set<string>;
  lastSeenByUser: LastSeenState;
  setTyping: (conversationId: string, username: string | null) => void;
  setOnline: (userId: string, online: boolean, lastSeenAt?: string | null) => void;
  setLastSeen: (userId: string, lastSeenAt: string | null, hidden?: boolean) => void;
  isOnline: (userId?: string | null) => boolean;
  getLastSeen: (userId?: string | null) => { lastSeenAt: string | null; hidden?: boolean } | null;
};

export const useChatStore = create<ChatStore>()((set, get) => ({
  typingByConversation: {},
  onlineUserIds: new Set<string>(),
  lastSeenByUser: {},

  setTyping: (conversationId, username) =>
    set((state) => {
      if (state.typingByConversation[conversationId] === username) return state;
      return {
        typingByConversation: {
          ...state.typingByConversation,
          [conversationId]: username,
        },
      };
    }),

  setOnline: (userId, online, lastSeenAt) =>
    set((state) => {
      const has = state.onlineUserIds.has(userId);
      const nextOnline = new Set(state.onlineUserIds);
      if (online) nextOnline.add(userId);
      else nextOnline.delete(userId);

      const nextLastSeen = { ...state.lastSeenByUser };
      if (!online && lastSeenAt) {
        nextLastSeen[userId] = { lastSeenAt, hidden: nextLastSeen[userId]?.hidden };
      }

      if (online === has && !lastSeenAt) return state;
      return { onlineUserIds: nextOnline, lastSeenByUser: nextLastSeen };
    }),

  setLastSeen: (userId, lastSeenAt, hidden) =>
    set((state) => ({
      lastSeenByUser: {
        ...state.lastSeenByUser,
        [userId]: { lastSeenAt, hidden },
      },
    })),

  isOnline: (userId) => (userId ? get().onlineUserIds.has(userId) : false),

  getLastSeen: (userId) => (userId ? get().lastSeenByUser[userId] ?? null : null),
}));
