self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

let checkInterval = null;
let userToken = null;
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

  if (!bets.length) {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      console.log('[SW] No bets found — stopping check interval');
    }
    return;
  }

  for (let bet of bets) {
    const finishTime = new Date(bet.startTime).getTime() + (108 * 60 * 1000);
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

        if (['won', 'postponed', 'cancel', "loss", "notFound"].includes(json.status)) {
          await removeBetFromDB(bet.id);
          try {
            self.registration.showNotification(`⚽️Bet ${bet.raw?.ticket_id}!`, {
              body: `Your bet ${bet.id} current status ${json.status}.`,
              icon: '/assets/icons/icon-192x192.png'
            });
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
});

function showNotification_(header = "Test Notification", body = {
  body: 'This is a test notification from SW.',
  icon: '/assets/icons/icon-192x192.png',
  badge: '/assets/icons/icon-72x72.png',
}) {
  if (Notification.permission !== 'granted') {
    return;
  }
  self.registration.showNotification(header, body);
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
