'use client';

import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';

export function useSocket(onNotification?: (data: unknown) => void) {
  const qc = useQueryClient();

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

    return () => {
      socket.disconnect();
    };
  }, [qc, onNotification]);
}
