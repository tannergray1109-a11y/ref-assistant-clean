/**
 * Google Calendar Integration for Ref Assistant
 */
const Calendar = (() => {
  let gapi = null;
  let isConnected = false;
  let calendarId = 'primary'; // Default to primary calendar
  
  // Google API configuration - Replace with your actual credentials
  const CLIENT_ID = '282949404666-3l6ho506ee6m7ujj7r12rpimvk1pr4nl.apps.googleusercontent.com';
  const API_KEY = 'AIzaSyBDfQnLxR_1XvBGDhcmmH1A7d_rzYSz-9g';
  const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest';
  const SCOPES = 'https://www.googleapis.com/auth/calendar';

  /**
   * Initialize Google Calendar API
   */
  async function init() {
    try {
      console.log('🔧 Initializing Google Calendar API...');
      console.log('🌐 Current domain:', window.location.origin);
      
      // Load Google API
      if (!window.gapi) {
        console.log('📥 Loading Google API...');
        await loadGoogleAPI();
      }
      
      gapi = window.gapi;
      
      await gapi.load('client:auth2', async () => {
        try {
          console.log('🔑 Initializing with credentials...');
          await gapi.client.init({
            apiKey: API_KEY,
            clientId: CLIENT_ID,
            discoveryDocs: [DISCOVERY_DOC],
            scope: SCOPES
          });
          
          console.log('✅ Google API initialized successfully');
        
          // Check if user is already signed in
          const authInstance = gapi.auth2.getAuthInstance();
          isConnected = authInstance.isSignedIn.get();
          
          console.log('🔐 Auth status:', isConnected ? 'Connected' : 'Not connected');
          updateConnectionStatus();
        } catch (initError) {
          console.error('❌ Google API initialization failed:', initError);
          if (initError.error === 'idpiframe_initialization_failed') {
            console.error('🚫 Domain not authorized. Check Google Cloud Console credentials.');
          }
          throw initError;
        }
      });
    } catch (error) {
      console.error('Failed to initialize Google Calendar API:', error);
      showToast('Failed to initialize Google Calendar', 'error');
    }
  }

  /**
   * Load Google API script dynamically
   */
  function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
      if (window.gapi) {
        resolve();
        return;
      }
      
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Connect to Google Calendar
   */
  async function connect() {
    try {
      if (!gapi) {
        await init();
      }
      
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signIn();
      isConnected = true;
      updateConnectionStatus();
      showToast('Successfully connected to Google Calendar!', 'success');
      
      // Sync existing games after connection
      await syncAllGames();
    } catch (error) {
      console.error('Failed to connect to Google Calendar:', error);
      showToast('Failed to connect to Google Calendar', 'error');
    }
  }

  /**
   * Disconnect from Google Calendar
   */
  async function disconnect() {
    try {
      if (gapi && isConnected) {
        const authInstance = gapi.auth2.getAuthInstance();
        await authInstance.signOut();
      }
      isConnected = false;
      updateConnectionStatus();
      showToast('Disconnected from Google Calendar', 'info');
    } catch (error) {
      console.error('Failed to disconnect from Google Calendar:', error);
    }
  }

  /**
   * Create a calendar event for a game
   */
  async function createGameEvent(game) {
    if (!isConnected || !gapi) {
      return null;
    }

    try {
      const startDateTime = new Date(`${game.date}T${game.time || '12:00'}`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later

      const event = {
        summary: `Referee: ${game.home || 'Game'} ${game.away ? `vs ${game.away}` : ''}`,
        location: game.location || '',
        description: `Referee Assignment\n\nTeams: ${game.home || 'Home'} vs ${game.away || 'Away'}\nLevel: ${game.level || 'N/A'}\nPay: $${Number(game.pay || 0).toFixed(2)}\n\nCreated by Ref Assistant`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 } // 1 hour before
          ]
        }
      };

      const response = await gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event
      });

      return response.result.id;
    } catch (error) {
      console.error('Failed to create calendar event:', error);
      showToast('Failed to create calendar event', 'error');
      return null;
    }
  }

  /**
   * Update a calendar event
   */
  async function updateGameEvent(game, eventId) {
    if (!isConnected || !gapi || !eventId) {
      return false;
    }

    try {
      const startDateTime = new Date(`${game.date}T${game.time || '12:00'}`);
      const endDateTime = new Date(startDateTime.getTime() + 2 * 60 * 60 * 1000);

      const event = {
        summary: `Referee: ${game.home || 'Game'} ${game.away ? `vs ${game.away}` : ''}`,
        location: game.location || '',
        description: `Referee Assignment\n\nTeams: ${game.home || 'Home'} vs ${game.away || 'Away'}\nLevel: ${game.level || 'N/A'}\nPay: $${Number(game.pay || 0).toFixed(2)}\n\nUpdated by Ref Assistant`,
        start: {
          dateTime: startDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        },
        end: {
          dateTime: endDateTime.toISOString(),
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
        }
      };

      await gapi.client.calendar.events.update({
        calendarId: calendarId,
        eventId: eventId,
        resource: event
      });

      return true;
    } catch (error) {
      console.error('Failed to update calendar event:', error);
      showToast('Failed to update calendar event', 'error');
      return false;
    }
  }

  /**
   * Delete a calendar event
   */
  async function deleteGameEvent(eventId) {
    if (!isConnected || !gapi || !eventId) {
      return false;
    }

    try {
      await gapi.client.calendar.events.delete({
        calendarId: calendarId,
        eventId: eventId
      });
      return true;
    } catch (error) {
      console.error('Failed to delete calendar event:', error);
      return false;
    }
  }

  /**
   * Sync all existing games to calendar
   */
  async function syncAllGames() {
    if (!isConnected) {
      return;
    }

    const { games } = Store.getState();
    let synced = 0;
    
    for (const game of games) {
      if (!game.calendarEventId) {
        const eventId = await createGameEvent(game);
        if (eventId) {
          Store.updateGame(game.id, { calendarEventId: eventId });
          synced++;
        }
      }
    }
    
    if (synced > 0) {
      showToast(`Synced ${synced} games to Google Calendar`, 'success');
    }
  }

  /**
   * Get upcoming calendar events
   */
  async function getUpcomingEvents(maxResults = 10) {
    if (!isConnected || !gapi) {
      return [];
    }

    try {
      const response = await gapi.client.calendar.events.list({
        calendarId: calendarId,
        timeMin: new Date().toISOString(),
        maxResults: maxResults,
        singleEvents: true,
        orderBy: 'startTime'
      });

      return response.result.items || [];
    } catch (error) {
      console.error('Failed to get calendar events:', error);
      return [];
    }
  }

  /**
   * Update connection status in UI
   */
  function updateConnectionStatus() {
    const statusEl = document.getElementById('calendarStatus');
    const connectBtn = document.getElementById('connectCalendarBtn');
    const disconnectBtn = document.getElementById('disconnectCalendarBtn');
    const syncBtn = document.getElementById('syncCalendarBtn');
    
    if (statusEl) {
      statusEl.textContent = isConnected ? 'Connected' : 'Not Connected';
      statusEl.className = `calendar-status ${isConnected ? 'connected' : 'disconnected'}`;
    }
    
    if (connectBtn) connectBtn.style.display = isConnected ? 'none' : 'inline-block';
    if (disconnectBtn) disconnectBtn.style.display = isConnected ? 'inline-block' : 'none';
    if (syncBtn) syncBtn.style.display = isConnected ? 'inline-block' : 'none';
  }

  /**
   * Toast notification helper
   */
  function showToast(message, type = 'info') {
    // Use existing toast system if available, otherwise fallback to alert
    if (window.showToast) {
      window.showToast(message, type);
    } else if (typeof AuthService !== 'undefined' && AuthService.showToast) {
      AuthService.showToast(message, type);
    } else {
      // Fallback: try to find the toast element and show it
      const toast = document.getElementById('toast');
      const toastMessage = document.getElementById('toastMessage');
      if (toast && toastMessage) {
        toastMessage.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.remove('hidden');
        setTimeout(() => {
          toast.classList.add('hidden');
        }, 3000);
      } else {
        console.log(`Calendar: ${message}`);
        alert(message);
      }
    }
  }

  // Public API
  return {
    init,
    connect,
    disconnect,
    createGameEvent,
    updateGameEvent,
    deleteGameEvent,
    syncAllGames,
    getUpcomingEvents,
    isConnected: () => isConnected,
    updateConnectionStatus
  };
})();

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  Calendar.init();
});
