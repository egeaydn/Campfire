// Service Worker for Push Notifications
// Bu dosya public/ klasörüne konulmalı

self.addEventListener('install', (event) => {
  console.log('Service Worker installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('Service Worker activated');
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    
    const options = {
      body: data.body || '',
      icon: data.icon || '/icon-192x192.png',
      badge: '/badge-72x72.png',
      vibrate: [200, 100, 200],
      data: {
        url: data.url || '/',
        conversationId: data.conversationId,
      },
      actions: data.actions || [
        { action: 'open', title: 'Open' },
        { action: 'close', title: 'Close' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Campfire', options)
    );
  } catch (error) {
    console.error('Error showing notification:', error);
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Otherwise open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});
