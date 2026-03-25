// ─── ReservationGonzalo Service Worker ───────────────────────────────────────

self.addEventListener('push', function (event) {
  if (!event.data) return

  let data = { title: 'Notificação', body: '', url: '/dashboard' }
  try {
    data = event.data.json()
  } catch {
    data.body = event.data.text()
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body:    data.body,
      icon:    '/icon-192x192.png',
      badge:   '/icon-72x72.png',
      data:    { url: data.url || '/dashboard' },
      actions: [
        { action: 'view',    title: 'Ver' },
        { action: 'dismiss', title: 'Dispensar' },
      ],
    }),
  )
})

self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  if (event.action === 'dismiss') return

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then(function (clientList) {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.navigate(url)
            return client.focus()
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      }),
  )
})
