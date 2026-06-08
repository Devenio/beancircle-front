/** Light tap feedback for discovery reveals (mobile). */
export function hapticPulse(pattern: number | number[] = 12) {
  if (typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    /* ignore */
  }
}

export function hapticReveal() {
  hapticPulse([8, 40, 12]);
}

export function hapticSignal() {
  hapticPulse(6);
}
