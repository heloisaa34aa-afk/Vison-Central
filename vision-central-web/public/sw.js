self.addEventListener('push', function(event) {
  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch(e) {
      data = { title: 'VisionCentral', body: event.data.text() };
    }
  } else {
    data = { title: 'VisionCentral', body: 'Nova notificação recebida' };
  }

  const options = {
    body: data.body || 'Nova notificação',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: {
      url: self.registration.scope + '#alertas'
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Alerta do Sistema', options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      const urlToOpen = event.notification.data?.url || '/#alertas';
      
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.registration.scope) && 'focus' in client) {
          return client.focus().then(() => client.navigate(urlToOpen));
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
