// Clear all caches and reload - Mobile Fix
// This file forces a fresh start on mobile devices

function clearAllCachesAndReload() {
  if ('serviceWorker' in navigator) {
    // Clear all caches
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          console.log('Clearing cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Clear localStorage
      localStorage.clear();
      sessionStorage.clear();
      
      // Unregister service worker
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      }).then(() => {
        // Force reload
        window.location.reload(true);
      });
    });
  } else {
    // Fallback for browsers without service worker
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload(true);
  }
}

// Add this to a button or call it manually to fix mobile auth issues
console.log('Mobile cache clear function loaded. Call clearAllCachesAndReload() to fix auth issues.');
