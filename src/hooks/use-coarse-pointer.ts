'use client';

import { useSyncExternalStore } from 'react';

function subscribe(onChange: () => void) {
  const mq = window.matchMedia('(pointer: coarse)');
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}

function getSnapshot() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function getServerSnapshot() {
  return false;
}

/** True on phones/tablets with touch-primary input. */
export function useCoarsePointer() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
