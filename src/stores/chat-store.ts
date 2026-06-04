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

type ChatStore = {
  typingByConversation: TypingState;
  onlineUserIds: Set<string>;
  setTyping: (conversationId: string, username: string | null) => void;
  setOnline: (userId: string, online: boolean) => void;
  isOnline: (userId?: string | null) => boolean;
};

export const useChatStore = create<ChatStore>()((set, get) => ({
  typingByConversation: {},
  onlineUserIds: new Set<string>(),

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

  setOnline: (userId, online) =>
    set((state) => {
      const has = state.onlineUserIds.has(userId);
      if (online === has) return state;
      const next = new Set(state.onlineUserIds);
      if (online) next.add(userId);
      else next.delete(userId);
      return { onlineUserIds: next };
    }),

  isOnline: (userId) => (userId ? get().onlineUserIds.has(userId) : false),
}));
