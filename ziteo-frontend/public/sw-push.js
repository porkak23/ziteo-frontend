// sw-push.js — Web Push handlers for Ziteo service worker
// This file is imported by the Workbox-generated SW via importScripts (vite.config.ts).
// No manual configuration required here — VAPID keys are handled server-side.

self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title ?? 'Ziteo'
  const options = {
    body: data.body ?? '',
    data: { url: data.url ?? '/' },
    badge: '/icons/icon-192.png',
    icon: '/icons/icon-192.png',
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        const targetUrl = event.notification.data?.url ?? '/'
        // If a tab with the app is already open, focus it and navigate
        for (const client of clientList) {
          if ('focus' in client) {
            client.focus()
            if ('navigate' in client) client.navigate(targetUrl)
            return
          }
        }
        // Otherwise open a new window
        return clients.openWindow(targetUrl)
      })
  )
})
