import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { clearSessionCookie, setSessionCookie } from '@/lib/auth-session';
import { disconnectSocket } from '@/lib/realtime/socket';

export type AuthUser = {
  id: string;
  username?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
  role?: string;
  needsOnboarding?: boolean;
};

type AuthState = {
  user: AuthUser | null;
  setUser: (user: AuthUser | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),
      setTokens: (accessToken, refreshToken) => {
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        setSessionCookie();
      },
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        clearSessionCookie();
        disconnectSocket();
        set({ user: null });
      },
    }),
    { name: 'beancircle-auth', partialize: (s) => ({ user: s.user }) },
  ),
);
