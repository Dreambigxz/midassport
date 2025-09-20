let checkInterval = null;
let userToken = null;
let vapidPublicKey = null;
baseUrl = "https://gball-bd565bb2756c.herokuapp.com/api";

async function fetchApi(url,method,body) {
  console.log('FETCHING<<>>', {url,method,body});
  const res = await fetch(`${baseUrl}/${url}/`, {
    method,
    body,
    headers: {
      'Content-Type': 'application/json',
      ...(userToken ? { 'Authorization': `Token ${userToken}` } : {})
    }
  });
  if (res.status===401) {
    stopChecking()
  }
  if (!res.ok) throw new Error('Network response not ok');

  const json =  await res.json();
  console.log('fetchApiRES>>', {json});
  return json
}

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});
self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
  // event.waitUntil(
  //   (async () => {
  //     const bets = await getBetsFromDB();
  //     if (bets.length) {
  //       startChecking();
  //     }
  //   })()
  // );
});

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

async function checkOpenBets(type="BACKGROUND") {

  console.log("checkOpenBets>>", type);
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
    if (now >= finishTime && !bet.notified) {
      try {
        const res = await fetchApi("bet","POST",JSON.stringify({ betId: bet.id, processor: "check_bet_status", type }))

        if (res&&['won', 'postponed', 'cancel', "loss", "notFound"].includes(res.status)) {
          await removeBetFromDB(bet.id);
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

// message listener
self.addEventListener('message', async (event) => {
  if (!event.data)return //not client
  if (event.data.type === 'SET_TOKEN') {
    userToken = event.data.token;
  }
  else if (event.data.type==="showNotification") {
    showNotification_(...Object.values(event.data.notify))
  }
  else if (event.data.type === 'UPDATE_BETS') {
    await updateBetsInDB(event.data.bets);
    // startChecking();
  } else if (event.data.type === 'CLEAR_BETS') {
    await clearBetsDB();
    stopChecking();
  } else if (event.data.type === 'REMOVE_BET') {
    await removeBetFromDB(event.data.betId);
  }
  else if (event.data.type === 'SET_PUBLIC_KEY') {
    vapidPublicKey = event.data.key;
    console.log('[SW] VAPID public key received');
  }
  else if (['SUBSCRIBE', "UNSUBSCRIBE"].includes(event.data.type )) {
    fetchApi('notifications','POST', JSON.stringify(event.data.data))
  }
  else if (event.data.type==="check-open-bets") {
      checkOpenBets('FOREGROUND')
  }

});

function showNotification_(header,body) {

  if (Notification.permission !== 'granted') return;

  self.registration.showNotification(header, {icon: '/assets/icons/192x192.png',badge: '/assets/icons/72x72.png', url: '/main', body});
}

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

self.addEventListener('push', function(event) {

  let data = {};
  if (event.data) {
    data = event.data.json();
  }
  const title = data.title || "Notification";
  const options = {
    body: data.body || "",
    icon: data.icon || "/assets/icons/192x192.png",
    data: {
      url: data.url || "/"
    }
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});

self.addEventListener('periodicsync', (event) => {
  console.log("periodicsync", event);
  if (event.tag === 'check-open-bets') {
    event.waitUntil(checkOpenBets("periodicsync"));
  }
});
