self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

let checkInterval = null;
let userToken = null;
let vapidPublicKey = null;
baseUrl = "https://fbapp01-125e9985037c.herokuapp.com/api";

// IndexedDB helper
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('betsDB', 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore('bets', { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = reject;
  });
}

async function saveBetsToDB(bets) {
  const db = await openDB();
  const tx = db.transaction('bets', 'readwrite');
  const store = tx.objectStore('bets');
  bets.forEach(bet => store.put(bet));
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function getBetsFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('bets', 'readonly');
    const store = tx.objectStore('bets');
    const req = store.getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = reject;
  });
}

async function clearBetsDB() {
  const db = await openDB();
  const tx = db.transaction('bets', 'readwrite');
  tx.objectStore('bets').clear();
  return tx.complete;
}

async function checkOpenBets() {
  const bets = await getBetsFromDB();
  const now = Date.now();

  if (!bets.length||!userToken) {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      console.log('[SW] No bets || user found — stopping check interval');
    }
    return;
  }

  for (let bet of bets) {
    const finishTime = new Date(bet.startTime).getTime() + (108 * 60 * 1000);
    console.log("finishTime>>", finishTime);
    if (now >= finishTime && !bet.notified) {
      try {
        const res = await fetch(`${baseUrl}/bet/`, {
          method: 'POST',
          body: JSON.stringify({ betId: bet.id, processor: "check_bet_status" }),
          headers: {
            'Content-Type': 'application/json',
            ...(userToken ? { 'Authorization': `Token ${userToken}` } : {})
          }
        });

        if (!res.ok) throw new Error('Network response not ok');

        const json = await res.json();

        console.log({json});

        if (['won', 'postponed', 'cancel', "loss", "notFound"].includes(json.status)) {
          await removeBetFromDB(bet.id);
          try {
            showNotification_(`⚽️Bet ${bet.raw?.ticket_id}!`, {body: `Your bet ${bet.id} current status ${json.status}.`,});
          } catch (e) {
            console.log('FAILED TO NOTIFY USER');
          }
        } else {
          bet.notified = false;
          await saveBetsToDB([bet]);
        }
      } catch (err) {
        console.error('[SW] Failed to check bet status', err);
      }
    }
  }
}

// Helper functions
async function updateBetsInDB(bets) {
  const db = await openDB();
  const tx = db.transaction('bets', 'readwrite');
  const store = tx.objectStore('bets');

  for (const bet of bets) {
    store.put({
      id: bet.id,
      status: bet.status,
      startTime: bet.start_date || bet.startTime,
      notified: bet.notified || false,
      raw: bet
    });
  }
  return tx.complete;
}

async function removeBetFromDB(betId) {
  const db = await openDB();
  const tx = db.transaction('bets', 'readwrite');
  tx.objectStore('bets').delete(betId);
  return tx.complete;
}

function stopChecking() {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('[SW] Stopped check interval');
  }
}

function startChecking() {
  if (!checkInterval) {
    checkInterval = setInterval(checkOpenBets, 60 * 1000);
    console.log('[SW] Started check interval');
  }
}

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
  event.waitUntil(
    (async () => {
      const bets = await getBetsFromDB();
      if (bets.length) {
        startChecking();
      }
    })()
  );
});

// message listener
self.addEventListener('message', async (event) => {

  console.log({event});
  if (event.data.type === 'SET_TOKEN') {
    userToken = event.data.token;
    showNotification_();
  }
  else if (event.data.type === 'UPDATE_BETS') {
    await updateBetsInDB(event.data.bets);
    startChecking();
  } else if (event.data.type === 'CLEAR_BETS') {
    await clearBetsDB();
    stopChecking();
  } else if (event.data.type === 'REMOVE_BET') {
    await removeBetFromDB(event.data.betId);
  }
  if (event.data && event.data.type === 'SET_PUBLIC_KEY') {
    vapidPublicKey = event.data.key;
    console.log('[SW] VAPID public key received');
  }

  else if (event.data?.type === 'DISABLE_NOTIFICATIONS') {
    console.log('SW: Unsubscribing from push…');
    const subscription = await self.registration.pushManager.getSubscription();
    if (subscription) {
      await subscription.unsubscribe();
      console.log('SW: Push unsubscribed');
      // Optionally, notify your backend to remove this endpoint
      // await fetch('/api/remove-subscription', { method: 'POST', body: JSON.stringify(subscription) });
    } else {
      console.log('SW: No subscription found');
    }
  }
  else if (event.data?.type === 'ENABLE_NOTIFICATIONS') {
    console.log('SW: Subscribing to push…');
    try {
      const subscription = await self.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array('<YOUR_VAPID_PUBLIC_KEY>')
      });

      console.log('SW: Push subscribed', subscription);

      // Send subscription to your backend
      // await fetch('/api/save-subscription', {
      //   method: 'POST',
      //   body: JSON.stringify(subscription),
      //   headers: { 'Content-Type': 'application/json' }
      // });

    } catch (err) {
      console.error('SW: Failed to subscribe', err);
    }
  }

});

function showNotification_(header = "✅ Welcome", data = {body: 'Welcome to midassportfb.'}) {
  if (Notification.permission !== 'granted') return;

  Object.assign(data,{icon: '/assets/icons/icon-192x192.png',badge: '/assets/icons/icon-72x72.png',})
  self.registration.showNotification(header, data);
}

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

/* ✅ Network-first for HTML so pull-to-refresh reloads from server */
self.addEventListener('fetch', (event) => {
  const request = event.request;

  console.log('FETCH>>', event)

  // Only apply network-first for navigations (HTML pages)
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => {
          return response;
        })
        .catch(() => {
          return caches.match(request);
        })
    );
    return;
  }

  // For all other requests, just pass through (or add custom caching here)
  event.respondWith(fetch(request));
});

self.addEventListener('push', event => {
  let data = {};
  if (event.data) {
    data = event.data.json();
  }

  const title = data.title || 'Notification';
  const options = {
    body: data.body || 'You have a new message',
    icon: '/assets/icons/icon-192x192.png'
  };

  event.waitUntil(self.registration.showNotification(title, options));
});
