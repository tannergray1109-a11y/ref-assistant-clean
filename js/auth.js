/**
 * Simple authentication service for the referee app
 * This is a simplified version for local development
 */
const AuthService = (() => {
  let currentUser = null;
  
  return {
    init() {
      // For now, just simulate a logged in user
      currentUser = {
        uid: 'local-user',
        email: 'user@example.com',
        displayName: 'Local User'
      };
      
      // Hide auth screen and show main app
      const authScreen = document.getElementById('authScreen');
      const loadingScreen = document.getElementById('loadingScreen');
      const app = document.querySelector('.app');
      
      if (authScreen) authScreen.style.display = 'none';
      if (loadingScreen) loadingScreen.style.display = 'none';
      if (app) app.style.display = 'block';
      
      // Show profile picture
      const profilePicture = document.getElementById('profilePicture');
      const userInitials = document.getElementById('userInitials');
      
      if (profilePicture) profilePicture.classList.remove('hidden');
      if (userInitials) userInitials.textContent = 'LU'; // Local User
      
      return Promise.resolve(currentUser);
    },
    
    getCurrentUser() {
      return currentUser;
    },
    
    signOut() {
      currentUser = null;
      localStorage.clear();
      location.reload();
    }
  };
})();

// Initialize auth when page loads
document.addEventListener('DOMContentLoaded', () => {
  AuthService.init();
});
