import type { Conversation } from '@/components/chat/types';
import { conversationSortKey } from '@/components/chat/utils';
import { getDisplayUnread } from '@/stores/chat-archive-store';

export type ArchiveFilterId = 'all' | 'unread' | 'muted' | 'pinned' | 'recent';

export function sortArchivedConversations(
  conversations: Conversation[],
  archivedAt: Record<string, number>,
): Conversation[] {
  return [...conversations].sort((a, b) => {
    if (Boolean(a.pinned) !== Boolean(b.pinned)) return a.pinned ? -1 : 1;
    const aArch = archivedAt[a.id] ?? 0;
    const bArch = archivedAt[b.id] ?? 0;
    if (aArch !== bArch) return bArch - aArch;
    return conversationSortKey(b) - conversationSortKey(a);
  });
}

export function filterArchivedList(
  conversations: Conversation[],
  opts: {
    query: string;
    filter: ArchiveFilterId;
    archivedAt: Record<string, number>;
    forceUnreadIds: string[];
  },
): Conversation[] {
  const q = opts.query.trim().toLowerCase();
  let list = conversations;

  if (q) {
    list = list.filter((c) => {
      const name = c.otherMember?.name?.toLowerCase() ?? '';
      const username = c.otherMember?.username?.toLowerCase() ?? '';
      const preview = (c.lastMessage?.body ?? '').toLowerCase();
      return name.includes(q) || username.includes(q) || preview.includes(q);
    });
  }

  switch (opts.filter) {
    case 'unread':
      list = list.filter(
        (c) =>
          getDisplayUnread(c.id, c.unreadCount ?? 0) > 0 ||
          opts.forceUnreadIds.includes(c.id),
      );
      break;
    case 'muted':
      list = list.filter((c) => c.muted);
      break;
    case 'pinned':
      list = list.filter((c) => c.pinned);
      break;
    case 'recent':
      list = [...list].sort(
        (a, b) => (opts.archivedAt[b.id] ?? 0) - (opts.archivedAt[a.id] ?? 0),
      );
      break;
    default:
      break;
  }

  return sortArchivedConversations(list, opts.archivedAt);
}

/** Chats not opened in 30+ days (for smart archive suggestion). */
export function inactiveConversationSuggestions(
  conversations: Conversation[],
  lastOpenedAt: Record<string, number>,
  archivedAt: Record<string, number>,
  inactiveDays = 30,
): Conversation[] {
  const cutoff = Date.now() - inactiveDays * 24 * 60 * 60 * 1000;
  return conversations.filter((c) => {
    if (archivedAt[c.id]) return false;
    const lastOpen = lastOpenedAt[c.id];
    const activity = conversationSortKey(c);
    const reference = lastOpen ?? activity;
    return reference < cutoff;
  });
}
