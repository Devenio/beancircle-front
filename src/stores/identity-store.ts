import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CafeRole } from '@/lib/api/cafe-os';

export type CafeIdentity = {
  cafeId: string;
  name: string;
  logoUrl: string | null;
  role: CafeRole;
};

export type ActiveIdentity =
  | { type: 'personal' }
  | { type: 'cafe'; cafeId: string };

type IdentityState = {
  active: ActiveIdentity;
  cafes: CafeIdentity[];
  switcherOpen: boolean;
  setCafes: (cafes: CafeIdentity[]) => void;
  switchToPersonal: () => void;
  switchToCafe: (cafeId: string) => void;
  setSwitcherOpen: (open: boolean) => void;
  reset: () => void;
};

export const useIdentityStore = create<IdentityState>()(
  persist(
    (set) => ({
      active: { type: 'personal' },
      cafes: [],
      switcherOpen: false,
      setCafes: (cafes) =>
        set((s) => {
          // If the active cafe no longer exists, fall back to personal.
          const stillValid =
            s.active.type !== 'cafe' ||
            cafes.some((c) => c.cafeId === (s.active as { cafeId: string }).cafeId);
          return {
            cafes,
            active: stillValid ? s.active : { type: 'personal' },
          };
        }),
      switchToPersonal: () =>
        set({ active: { type: 'personal' }, switcherOpen: false }),
      switchToCafe: (cafeId) =>
        set({ active: { type: 'cafe', cafeId }, switcherOpen: false }),
      setSwitcherOpen: (open) => set({ switcherOpen: open }),
      reset: () => set({ active: { type: 'personal' }, cafes: [] }),
    }),
    {
      name: 'beancircle-identity',
      partialize: (s) => ({ active: s.active, cafes: s.cafes }),
    },
  ),
);
