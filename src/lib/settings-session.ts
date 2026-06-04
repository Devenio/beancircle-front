export function getCurrentSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  const dot = refreshToken.indexOf('.');
  return dot > 0 ? refreshToken.slice(0, dot) : null;
}
