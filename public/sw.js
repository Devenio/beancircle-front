/* BeanCircle service worker — Web Push delivery + click handling. */

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
  let payload = {};
  if (event.data) {
    try {
      payload = event.data.json();
    } catch (_e) {
      payload = { title: 'BeanCircle', body: event.data.text() };
    }
  }

  const title = payload.title || 'BeanCircle';
  const options = {
    body: payload.body || '',
    tag: payload.tag,
    data: { url: payload.url || '/' },
    renotify: Boolean(payload.tag),
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url =
    (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({
        type: 'window',
        includeUncontrolled: true,
      });
      for (const client of clients) {
        if ('focus' in client) {
          try {
            await client.navigate(url);
          } catch (_e) {
            /* navigate can reject cross-origin; fall back to focus */
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url);
      }
    })(),
  );
});
