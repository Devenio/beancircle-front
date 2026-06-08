import { create } from 'zustand';
import type { DiscoverPerson, OrbitPerson } from '@/components/discover/people/types';

export type MeetNowStage =
  | 'idle'
  | 'radar'
  | 'scanning'
  | 'signals'
  | 'revealing'
  | 'complete'
  | 'empty';

export type ScanSignal = {
  index: number;
  distanceLabel: string;
  distanceM: number;
};

export type DiscoveryStats = {
  nearbyCount: number;
  sharedInterestsCount: number;
  matchPotential: 'low' | 'medium' | 'high';
};

type MeetNowState = {
  active: boolean;
  stage: MeetNowStage;
  scanId: string | null;
  messageIndex: number;
  signals: ScanSignal[];
  revealed: DiscoverPerson[];
  orbits: OrbitPerson[];
  stats: DiscoveryStats | null;
  latestSignal: ScanSignal | null;
  selected: OrbitPerson | null;
  radiusKm: number;
  open: (radiusKm?: number) => void;
  close: () => void;
  reset: () => void;
  setStage: (stage: MeetNowStage) => void;
  setScanId: (id: string) => void;
  setMessageIndex: (i: number) => void;
  addSignal: (signal: ScanSignal) => void;
  revealPerson: (person: DiscoverPerson) => void;
  setOrbits: (orbits: OrbitPerson[]) => void;
  setStats: (stats: DiscoveryStats) => void;
  setLatestSignal: (s: ScanSignal | null) => void;
  setSelected: (p: OrbitPerson | null) => void;
  setRadiusKm: (km: number) => void;
};

const initial = {
  active: false,
  stage: 'idle' as MeetNowStage,
  scanId: null as string | null,
  messageIndex: 0,
  signals: [] as ScanSignal[],
  revealed: [] as DiscoverPerson[],
  orbits: [] as OrbitPerson[],
  stats: null as DiscoveryStats | null,
  latestSignal: null as ScanSignal | null,
  selected: null as OrbitPerson | null,
  radiusKm: 5,
};

export const useMeetNowStore = create<MeetNowState>((set) => ({
  ...initial,
  open: (radiusKm) =>
    set({ ...initial, active: true, stage: 'radar', radiusKm: radiusKm ?? initial.radiusKm }),
  close: () => set({ ...initial }),
  reset: () => set({ ...initial }),
  setStage: (stage) => set({ stage }),
  setScanId: (scanId) => set({ scanId }),
  setMessageIndex: (messageIndex) => set({ messageIndex }),
  addSignal: (signal) =>
    set((s) => ({
      signals: [...s.signals, signal],
      latestSignal: signal,
      stage: s.stage === 'scanning' ? 'signals' : s.stage,
    })),
  revealPerson: (person) =>
    set((s) => ({
      revealed: [...s.revealed, person],
      stage: 'revealing',
    })),
  setOrbits: (orbits) => set({ orbits }),
  setStats: (stats) => set({ stats }),
  setLatestSignal: (latestSignal) => set({ latestSignal }),
  setSelected: (selected) => set({ selected }),
  setRadiusKm: (radiusKm) => set({ radiusKm }),
}));
