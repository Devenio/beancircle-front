'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useChatStore } from '@/stores/chat-store';

export function useSocket(onNotification?: (data: unknown) => void) {
  const qc = useQueryClient();
  const setOnline = useChatStore((s) => s.setOnline);

  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    let socket: Socket;
    socket = io(process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001', {
      auth: { token },
    });

    socket.on('notification:new', (data) => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      onNotification?.(data);
    });

    socket.on('presence', (payload: { userId?: string; online?: boolean }) => {
      if (payload.userId && typeof payload.online === 'boolean') {
        setOnline(payload.userId, payload.online);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [qc, onNotification, setOnline]);
}
