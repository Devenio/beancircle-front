import { api } from './api/client';

const SW_URL = '/sw.js';

export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/** Decode a base64url VAPID key into the Uint8Array PushManager expects. */
function urlBase64ToUint8Array(base64: string): Uint8Array {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) output[i] = raw.charCodeAt(i);
  return output;
}

async function getPublicKey(locale: string): Promise<string | null> {
  try {
    const res = await api<{ publicKey: string | null }>(
      '/users/push/public-key',
      { locale },
    );
    return res.publicKey;
  } catch {
    return null;
  }
}

/**
 * Request permission, subscribe this device to push, and store the
 * subscription on the backend. Returns true only when fully subscribed.
 */
export async function subscribeToPush(locale: string): Promise<boolean> {
  if (!isPushSupported()) return false;

  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;

  const publicKey = await getPublicKey(locale);
  if (!publicKey) return false;

  const registration = await navigator.serviceWorker.register(SW_URL);
  await navigator.serviceWorker.ready;

  const existing = await registration.pushManager.getSubscription();
  const subscription =
    existing ??
    (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    }));

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;
  if (!p256dh || !auth) return false;

  await api('/users/me/push-token', {
    method: 'POST',
    locale,
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
    }),
  });
  return true;
}

/** Unsubscribe this device and remove the stored subscription. */
export async function unsubscribeFromPush(locale: string): Promise<void> {
  if (!isPushSupported()) return;

  const registration = await navigator.serviceWorker.getRegistration();
  const subscription = await registration?.pushManager.getSubscription();
  if (!subscription) return;

  const endpoint = subscription.endpoint;
  await subscription.unsubscribe().catch(() => undefined);
  await api('/users/me/push-token', {
    method: 'DELETE',
    locale,
    body: JSON.stringify({ endpoint }),
  }).catch(() => undefined);
}

/**
 * Refresh the stored subscription on app load when permission was already
 * granted — keeps the backend token valid across browser rotations without
 * prompting the user.
 */
export async function ensurePushSubscribed(locale: string): Promise<void> {
  if (!isPushSupported()) return;
  if (Notification.permission !== 'granted') return;
  await subscribeToPush(locale).catch(() => undefined);
}
