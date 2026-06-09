const CACHE = 'wc2026-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html'))));
});

// Daily notification at 9:00 AM Bangladesh time
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    scheduleDailyNotification(e.data.matches);
  }
});

function scheduleDailyNotification(todayMatches) {
  if (!todayMatches || todayMatches.length === 0) return;

  const now = new Date();
  // Bangladesh time offset = UTC+6
  const bdNow = new Date(now.getTime() + 6 * 60 * 60 * 1000);
  const target = new Date(bdNow);
  target.setUTCHours(3, 0, 0, 0); // 9:00 AM BD = 3:00 AM UTC

  let delay = target.getTime() - now.getTime();
  if (delay < 0) delay += 24 * 60 * 60 * 1000;

  setTimeout(() => {
    const body = todayMatches.slice(0, 3).map(m => `⚽ ${m.time} — ${m.teams}`).join('\n');
    const extra = todayMatches.length > 3 ? `\nআরও ${todayMatches.length - 3}টি ম্যাচ...` : '';

    self.registration.showNotification('⚽ আজকের বিশ্বকাপ ম্যাচ', {
      body: body + extra,
      icon: './icon-192.png',
      badge: './icon-192.png',
      tag: 'daily-wc2026',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: './index.html' }
    });
  }, delay);
}

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(clients.matchAll({ type: 'window' }).then(cs => {
    if (cs.length) return cs[0].focus();
    return clients.openWindow('./index.html');
  }));
});
