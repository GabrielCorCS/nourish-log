/* NourishLog service worker — Web Push.
   Receives push messages and shows a notification; focuses/opens the app on
   click. Payload shape (from the send-push edge function):
   { title, body, type, icon (emoji), url } */

self.addEventListener('push', (event) => {
  let data = {}
  try {
    data = event.data ? event.data.json() : {}
  } catch (e) {
    data = { title: 'NourishLog', body: event.data ? event.data.text() : '' }
  }

  const emoji = data.icon && data.icon.length <= 4 ? data.icon + ' ' : ''
  const title = (emoji + (data.title || 'NourishLog')).trim()
  const options = {
    body: data.body || '',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.type || 'nourishlog',
    renotify: true,
    data: { url: data.url || '/' },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if ('focus' in client) {
            if (client.navigate) client.navigate(url)
            return client.focus()
          }
        }
        return self.clients.openWindow(url)
      })
  )
})
