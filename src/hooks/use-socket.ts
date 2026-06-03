'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chat-store';
import { getSocket } from '@/lib/realtime/socket';

/**
 * Mounts once (in the authenticated layout) and owns the app-wide realtime
 * side effects on the single shared socket:
 *  - presence updates
 *  - notification invalidation
 *  - inbox bumps (server-authoritative unread) on new messages
 *  - read-cursor sync across a user's own devices
 *
 * It never disconnects the socket on unmount — the connection is shared and
 * outlives any single screen.
 */
export function useSocket(onNotification?: (data: unknown) => void) {
  const qc = useQueryClient();
  const setOnline = useChatStore((s) => s.setOnline);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNotification = (data: unknown) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      onNotification?.(data);
    };
    const handlePresence = (payload: { userId?: string; online?: boolean }) => {
      if (payload.userId && typeof payload.online === 'boolean') {
        setOnline(payload.userId, payload.online);
      }
    };
    const handleConversationChanged = () => {
      qc.invalidateQueries({ queryKey: ['conversations'] });
    };

    socket.on('notification:new', handleNotification);
    socket.on('presence', handlePresence);
    socket.on('conversation:bump', handleConversationChanged);
    socket.on('conversation:read', handleConversationChanged);

    return () => {
      socket.off('notification:new', handleNotification);
      socket.off('presence', handlePresence);
      socket.off('conversation:bump', handleConversationChanged);
      socket.off('conversation:read', handleConversationChanged);
    };
  }, [qc, setOnline, onNotification]);
}
