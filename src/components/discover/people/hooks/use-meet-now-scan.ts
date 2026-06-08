'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api/client';
import { getSocket } from '@/lib/realtime/socket';
import { hapticReveal, hapticSignal } from '@/lib/haptics';
import { useMeetNowStore } from '@/stores/meet-now-store';
import {
  layoutOrbits,
  type DiscoverPerson,
} from '../types';

type ScanResponse = {
  scanId: string;
  signals: { index: number; distanceLabel: string; distanceM: number }[];
  items: DiscoverPerson[];
  stats: {
    nearbyCount: number;
    sharedInterestsCount: number;
    matchPotential: 'low' | 'medium' | 'high';
  };
};

function enrichPerson(p: DiscoverPerson): DiscoverPerson {
  return { ...p, distanceM: p.distanceM ?? 800 };
}

export function useMeetNowScan() {
  const { locale } = useParams<{ locale: string }>();
  const qc = useQueryClient();
  const active = useMeetNowStore((s) => s.active);
  const radiusKm = useMeetNowStore((s) => s.radiusKm);
  const scanId = useMeetNowStore((s) => s.scanId);
  const stage = useMeetNowStore((s) => s.stage);
  const startedRef = useRef(false);

  const { data: me } = useQuery({
    queryKey: ['me', locale],
    queryFn: () =>
      api<{ id: string; name?: string; avatarUrl?: string }>('/users/me', { locale }),
    enabled: stage !== 'idle',
  });

  const startScan = useCallback(async () => {
    const store = useMeetNowStore.getState();
    store.setStage('radar');
    startedRef.current = false;

    const socket = getSocket();
    const handlers: Array<() => void> = [];

    const attachSocket = (id: string) => {
      if (!socket) return;
      const onProgress = (payload: {
        scanId: string;
        stage: string;
        messageIndex?: number;
      }) => {
        if (payload.scanId !== id) return;
        if (payload.stage === 'scanning') {
          store.setStage('scanning');
          if (payload.messageIndex != null) store.setMessageIndex(payload.messageIndex);
        }
      };
      const onSignal = (payload: {
        scanId: string;
        index: number;
        distanceLabel: string;
        distanceM: number;
      }) => {
        if (payload.scanId !== id) return;
        hapticSignal();
        store.addSignal({
          index: payload.index,
          distanceLabel: payload.distanceLabel,
          distanceM: payload.distanceM,
        });
      };
      const onReveal = (payload: { scanId: string; person: DiscoverPerson }) => {
        if (payload.scanId !== id) return;
        hapticReveal();
        store.revealPerson(enrichPerson(payload.person));
      };
      const onComplete = (payload: {
        scanId: string;
        stage: string;
        stats: ScanResponse['stats'];
        items: DiscoverPerson[];
      }) => {
        if (payload.scanId !== id) return;
        store.setStats(payload.stats);
        const people = payload.items.map(enrichPerson);
        store.setOrbits(layoutOrbits(people, store.radiusKm));
        store.setStage(payload.stage === 'empty' ? 'empty' : 'complete');
        void qc.invalidateQueries({ queryKey: ['discover', 'nearby'] });
        cleanup();
      };

      socket.on('discover:scan:progress', onProgress);
      socket.on('discover:scan:signal', onSignal);
      socket.on('discover:scan:reveal', onReveal);
      socket.on('discover:scan:complete', onComplete);
      handlers.push(() => {
        socket.off('discover:scan:progress', onProgress);
        socket.off('discover:scan:signal', onSignal);
        socket.off('discover:scan:reveal', onReveal);
        socket.off('discover:scan:complete', onComplete);
      });
    };

    const cleanup = () => {
      for (const h of handlers) h();
      handlers.length = 0;
    };

    await new Promise((r) => setTimeout(r, 1200));
    store.setStage('scanning');

    try {
      const res = await api<ScanResponse>(`/discover/scan?radiusKm=${radiusKm}`, {
        method: 'POST',
        locale,
      });
      store.setScanId(res.scanId);
      attachSocket(res.scanId);

      if (!socket?.connected) {
        await animateLocally(res, store, qc);
        cleanup();
      }
    } catch {
      store.setStage('empty');
      cleanup();
    }

    return cleanup;
  }, [locale, radiusKm, qc]);

  const cancelScan = useCallback(async () => {
    try {
      await api('/discover/scan', { method: 'DELETE', locale });
    } catch {
      /* ignore */
    }
    useMeetNowStore.getState().close();
  }, [locale]);

  useEffect(() => {
    if (!active) {
      startedRef.current = false;
      return;
    }
    if (stage === 'radar' && !startedRef.current) {
      startedRef.current = true;
      void startScan();
    }
  }, [active, stage, startScan]);

  return { me, scanId, startScan, cancelScan };
}

async function animateLocally(
  res: ScanResponse,
  store: ReturnType<typeof useMeetNowStore.getState>,
  qc: ReturnType<typeof useQueryClient>,
) {
  for (let i = 0; i < 3; i++) {
    await delay(1200);
    store.setMessageIndex(i);
  }
  for (const signal of res.signals) {
    await delay(800);
    hapticSignal();
    store.addSignal(signal);
  }
  for (const person of res.items) {
    await delay(1000);
    hapticReveal();
    store.revealPerson(enrichPerson(person));
  }
  await delay(500);
  store.setStats(res.stats);
  store.setOrbits(layoutOrbits(res.items.map(enrichPerson), store.radiusKm));
  store.setStage(res.items.length === 0 ? 'empty' : 'complete');
  void qc.invalidateQueries({ queryKey: ['discover', 'nearby'] });
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
