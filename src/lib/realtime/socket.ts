'use client';

import { io, type Socket } from 'socket.io-client';

/**
 * Single source of truth for the realtime connection.
 *
 * The whole app shares ONE Socket.IO connection per authenticated session.
 * Components must never call `io()` directly — they get the shared instance
 * from here and attach/detach their own listeners (socket.io multiplexes many
 * listeners over a single connection). This eliminates the duplicate sockets
 * that previously existed (global layout + per chat room + per squad room).
 */

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? 'http://localhost:3001';
const RECONNECT_BACKOFF_MAX_MS = 30000;

let socket: Socket | null = null;
let activeToken: string | null = null;

function readToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

/**
 * Returns the shared socket, creating it on first use. Re-creates the
 * connection only when the auth token actually changes (e.g. after a refresh
 * that rotated the access token). Returns null when unauthenticated / SSR.
 */
export function getSocket(): Socket | null {
  const token = readToken();
  if (!token) {
    disconnectSocket();
    return null;
  }
  if (socket && activeToken === token) return socket;
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeToken = token;
  socket = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: RECONNECT_BACKOFF_MAX_MS,
    timeout: 10000,
  });
  return socket;
}

/** Tear down the shared connection (call on logout). */
export function disconnectSocket() {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  activeToken = null;
}

export type ConnectionState = 'offline' | 'connecting' | 'online';

export function currentConnectionState(): ConnectionState {
  if (!socket) return 'offline';
  if (socket.connected) return 'online';
  return 'connecting';
}
