/** Subtle haptic feedback via the Vibration API (mobile) with safe no-ops elsewhere. */

type HapticStyle = 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'selection';

const PATTERNS: Record<HapticStyle, number | number[]> = {
  light: 8,
  medium: 14,
  heavy: 22,
  success: [10, 40, 12],
  error: [16, 60, 16, 60, 16],
  selection: 4,
};

export function haptic(style: HapticStyle = 'light') {
  if (typeof navigator === 'undefined' || !navigator.vibrate) return;
  try {
    navigator.vibrate(PATTERNS[style]);
  } catch {
    /* unsupported */
  }
}
