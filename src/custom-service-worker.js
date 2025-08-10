self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(clients.claim());
});

// Periodic check every X minutes
async function checkOpenBets() {
  // Call your backend API to get open bets status
  const res = await fetch('/api/user/openbets');
  const data = await res.json();

  // If any bets are over, notify the user
  data.forEach(bet => {
    if (bet.status === 'finished') {
      self.registration.showNotification('Bet Finished!', {
        body: `${bet.name} has ended. Check your results!`,
        icon: '/assets/icons/icon-192x192.png'
      });
    }
  });
}

// Use setInterval-like approach
setInterval(checkOpenBets, 60 * 1000); // every 1 minute
