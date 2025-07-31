// Firebase Authentication and Data Management
// Firebase is initialized in index.html, we'll use the global instances

// Wait for Firebase to be initialized
function waitForFirebase() {
  return new Promise((resolve) => {
    const checkFirebase = () => {
      if (window.firebaseAuth && window.firebaseDb) {
        resolve();
      } else {
        setTimeout(checkFirebase, 100);
      }
    };
    checkFirebase();
  });
}

// Auth State Management
let currentUser = null;
let authInitialized = false;

// Authentication Functions
const AuthService = {
  // Initialize auth service
  async init() {
    await waitForFirebase();
    
    return new Promise((resolve) => {
      // Set up auth state listener
      const { onAuthStateChanged } = import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js').then(({ onAuthStateChanged }) => {
        const unsubscribe = onAuthStateChanged(window.firebaseAuth, (user) => {
          currentUser = user;
          authInitialized = true;
          updateUI(user);
          resolve();
        });
        return unsubscribe;
      });
    });
  },

  // Sign out
  async signOut() {
    try {
      const { signOut } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js');
      await signOut(window.firebaseAuth);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  // Get current user
  getCurrentUser() {
    return currentUser;
  }
};

// Data Synchronization Functions
const DataService = {
  // Sync local data to cloud
  async syncToCloud() {
    const user = AuthService.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { doc, setDoc, serverTimestamp } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const localData = Store.getAllData();
      
      await setDoc(doc(window.firebaseDb, 'userData', user.uid), {
        games: localData.games || [],
        expenses: localData.expenses || [],
        mileage: localData.mileage || [],
        lastUpdated: serverTimestamp()
      });
      
      updateSyncStatus('synced');
      return { success: true };
    } catch (error) {
      updateSyncStatus('error');
      return { success: false, error: error.message };
    }
  },

  // Load data from cloud
  async loadFromCloud() {
    const user = AuthService.getCurrentUser();
    if (!user) return { success: false, error: 'User not authenticated' };
    
    try {
      const { doc, getDoc } = await import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js');
      const docRef = doc(window.firebaseDb, 'userData', user.uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        Store.setAllData(data);
        updateSyncStatus('synced');
        return { success: true, data };
      } else {
        // Initialize empty data
        await this.syncToCloud();
        return { success: true, data: { games: [], expenses: [], mileage: [] } };
      }
    } catch (error) {
      updateSyncStatus('error');
      return { success: false, error: error.message };
    }
  },

  // Auto-sync when data changes
  async autoSync() {
    const user = AuthService.getCurrentUser();
    if (user) {
      updateSyncStatus('syncing');
      await this.syncToCloud();
    }
  }
};

// UI Helper Functions
function updateUI(user) {
  // Don't redirect if we're already on the signin page
  if (window.location.pathname.includes('signin.html')) {
    return;
  }
  
  const profilePicture = document.getElementById('profilePicture');
  const userInitials = document.getElementById('userInitials');
  const authScreen = document.getElementById('authScreen');
  const loadingScreen = document.getElementById('loadingScreen');
  const app = document.querySelector('.app');
  
  if (user) {
    // User is signed in
    if (authScreen) authScreen.style.display = 'none';
    if (loadingScreen) loadingScreen.style.display = 'none';
    if (app) app.style.display = 'block';
    if (profilePicture) profilePicture.classList.remove('hidden');
    
    // Set user initials in profile picture
    if (userInitials) {
      let initials = 'U'; // Default fallback
      
      if (user.displayName && user.displayName.trim()) {
        // Use display name if available
        const nameParts = user.displayName.trim().split(' ').filter(part => part.length > 0);
        if (nameParts.length >= 2) {
          // First name + Last name
          initials = (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
        } else if (nameParts.length === 1) {
          // Single name - use first two letters
          initials = nameParts[0].substring(0, 2).toUpperCase();
        }
      } else if (user.email) {
        // Fallback to email - use first letter of email + 'U' for User
        initials = (user.email[0] + 'U').toUpperCase();
      }
      
      userInitials.textContent = initials;
    }
    
    // Load user data
    DataService.loadFromCloud();
  } else {
    // Only redirect if auth is initialized and we're sure there's no user
    if (authInitialized) {
      window.location.href = 'signin.html';
    }
  }
}

function updateSyncStatus(status) {
  const syncStatus = document.getElementById('syncStatus');
  
  if (!syncStatus) return;
  
  switch (status) {
    case 'syncing':
      syncStatus.textContent = 'Syncing...';
      break;
    case 'synced':
      syncStatus.textContent = 'Data synced';
      break;
    case 'error':
      syncStatus.textContent = 'Sync error';
      break;
  }
}

// Event Listeners for Auth
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize auth service
  await AuthService.init();
  
  // Sign Out Button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      const result = await AuthService.signOut();
      if (!result.success) {
        console.error('Error signing out:', result.error);
      }
      // User will be redirected by updateUI function
    });
  }
  
  // Profile Picture Dropdown
  const userAvatar = document.getElementById('userAvatar');
  const profileDropdown = document.getElementById('profileDropdown');
  
  if (userAvatar && profileDropdown) {
    userAvatar.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('hidden');
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', () => {
      profileDropdown.classList.add('hidden');
    });
    
    // Handle dropdown menu items
    profileDropdown.addEventListener('click', (e) => {
      const item = e.target.closest('.dropdown-item');
      if (item) {
        const action = item.dataset.action;
        if (action === 'settings') {
          // Use the global showScreen function if available
          if (typeof showScreen === 'function') {
            showScreen('settings');
          }
        } else if (action === 'edit-profile') {
          // Go to settings
          if (typeof showScreen === 'function') {
            showScreen('settings');
          }
        }
        profileDropdown.classList.add('hidden');
      }
    });
  }
});

// Auto-sync data when changes are made (wrap Store methods)
function wrapStoreMethodsForSync() {
  if (typeof Store !== 'undefined') {
    const originalAddGame = Store.addGame;
    const originalAddExpense = Store.addExpense;
    const originalAddMileage = Store.addMileage;
    
    if (originalAddGame) {
      Store.addGame = function(...args) {
        const result = originalAddGame.apply(this, args);
        DataService.autoSync();
        return result;
      };
    }
    
    if (originalAddExpense) {
      Store.addExpense = function(...args) {
        const result = originalAddExpense.apply(this, args);
        DataService.autoSync();
        return result;
      };
    }
    
    if (originalAddMileage) {
      Store.addMileage = function(...args) {
        const result = originalAddMileage.apply(this, args);
        DataService.autoSync();
        return result;
      };
    }
  }
}

// Initialize auto-sync when Store is available
setTimeout(wrapStoreMethodsForSync, 500);
