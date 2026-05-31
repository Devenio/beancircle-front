'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MessageReaction } from '@/components/chat/types';

type TypingState = Record<string, string | null>;

type ChatStore = {
  pinnedConversationIds: string[];
  unreadByConversation: Record<string, number>;
  typingByConversation: TypingState;
  onlineUserIds: Set<string>;
  reactionsByMessage: Record<string, MessageReaction[]>;
  totalUnread: () => number;
  togglePinConversation: (id: string) => void;
  setTyping: (conversationId: string, username: string | null) => void;
  setOnline: (userId: string, online: boolean) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
  addReaction: (messageId: string, reaction: MessageReaction) => void;
  removeReaction: (messageId: string, userId: string) => void;
};

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      pinnedConversationIds: [],
      unreadByConversation: {},
      typingByConversation: {},
      onlineUserIds: new Set<string>(),
      reactionsByMessage: {},

      totalUnread: () =>
        Object.values(get().unreadByConversation).reduce((sum, n) => sum + n, 0),

      togglePinConversation: (id) =>
        set((state) => ({
          pinnedConversationIds: state.pinnedConversationIds.includes(id)
            ? state.pinnedConversationIds.filter((item) => item !== id)
            : [...state.pinnedConversationIds, id],
        })),

      setTyping: (conversationId, username) =>
        set((state) => ({
          typingByConversation: { ...state.typingByConversation, [conversationId]: username },
        })),

      setOnline: (userId, online) =>
        set((state) => {
          const next = new Set(state.onlineUserIds);
          if (online) next.add(userId);
          else next.delete(userId);
          return { onlineUserIds: next };
        }),

      incrementUnread: (conversationId) =>
        set((state) => ({
          unreadByConversation: {
            ...state.unreadByConversation,
            [conversationId]: (state.unreadByConversation[conversationId] ?? 0) + 1,
          },
        })),

      clearUnread: (conversationId) =>
        set((state) => ({
          unreadByConversation: { ...state.unreadByConversation, [conversationId]: 0 },
        })),

      addReaction: (messageId, reaction) =>
        set((state) => {
          const existing = state.reactionsByMessage[messageId] ?? [];
          const filtered = existing.filter((item) => item.userId !== reaction.userId);
          return {
            reactionsByMessage: {
              ...state.reactionsByMessage,
              [messageId]: [...filtered, reaction],
            },
          };
        }),

      removeReaction: (messageId, userId) =>
        set((state) => ({
          reactionsByMessage: {
            ...state.reactionsByMessage,
            [messageId]: (state.reactionsByMessage[messageId] ?? []).filter(
              (item) => item.userId !== userId,
            ),
          },
        })),
    }),
    {
      name: 'beancircle-chat',
      partialize: (state) => ({
        pinnedConversationIds: state.pinnedConversationIds,
        reactionsByMessage: state.reactionsByMessage,
        unreadByConversation: state.unreadByConversation,
      }),
      merge: (persisted, current) => {
        const merged = { ...current, ...(persisted as Partial<ChatStore>) };
        return {
          ...merged,
          onlineUserIds: new Set<string>(),
          typingByConversation: {},
        };
      },
    },
  ),
);
