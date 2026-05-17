self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const title = data.title || 'NexusJJ';
  const options = {
    body: data.body || '',
    icon: '/favicon.svg',
    badge: '/favicon.svg',
    tag: data.tag || 'nexusjj',
    data: { url: data.url || '/' },
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
