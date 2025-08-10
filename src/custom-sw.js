
self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

let checkInterval = null;
let userToken = null;
// let baseUrl = 'http://127.0.0.1:8000/api';
baseUrl="https://fbapp01-125e9985037c.herokuapp.com/api"
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
    console.log('ENDING>><<<', finishTime.toLocaleString());
    if (now >= finishTime && !bet.notified || true) {
      console.log('[SW] Bet finished, checking status from server:', bet.id);

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

        console.log(json);

        if (json.status === 'settled') {
          console.log('[SW] Bet settled:', bet.id);

          // Remove bet from DB since it's settled
          await removeBetFromDB(bet.id);

          try {
            // Optionally notify user
            self.registration.showNotification('Bet Settled!', {
              body: `Your bet ${bet.id} has been settled.`,
              icon: '/assets/icons/icon-192x192.png'
            });
          } catch (e) {
            console.log('FAILED TO NOTIFY USER');
          }

        } else {
          // Not settled, keep bet and mark notified false
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
    // Put will add or update
    console.log('ADDING BET>>>', bet);
    store.put({
      id: bet.id,
      status: bet.status,
      startTime: bet.start_date || bet.startTime, // unify key name
      notified: bet.notified || false,
      raw: bet // optionally save full data
    });
  }
  return tx.complete;
}

async function removeBetFromDB(betId) {
  const db = await openDB();
  const tx = db.transaction('bets', 'readwrite');
  const store = tx.objectStore('bets');
  store.delete(betId);
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

  // Start checking on activation in case bets already exist
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
    console.log('[SW] Token set:', userToken);
  }
  else if (event.data.type === 'UPDATE_BETS') {
    console.log('[SW] Updating bets in DB', event.data);
    await updateBetsInDB(event.data.bets);
    startChecking();
  } else if (event.data.type === 'CLEAR_BETS') {
    console.log('[SW] Clearing all bets');
    await clearBetsDB();
    stopChecking();
  } else if (event.data.type === 'REMOVE_BET') {
    console.log('[SW] Removing bet:', event.data.betId);
    await removeBetFromDB(event.data.betId);
  }
});
