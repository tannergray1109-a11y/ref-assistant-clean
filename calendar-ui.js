// Calendar UI Module
// Handles the visual calendar component

class CalendarUI {
    constructor() {
        this.currentDate = new Date();
        this.events = [];
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        const todayBtn = document.getElementById('calendarTodayBtn');
        const prevBtn = document.getElementById('calendarPrevBtn');
        const nextBtn = document.getElementById('calendarNextBtn');

        if (todayBtn) {
            todayBtn.addEventListener('click', () => {
                this.currentDate = new Date();
                this.render();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                this.render();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                this.render();
            });
        }
    }

    render() {
        this.renderMonthHeader();
        this.renderCalendarGrid();
        this.renderUpcomingGames();
    }

    renderMonthHeader() {
        const monthYearElement = document.getElementById('calendarMonthYear');
        if (monthYearElement) {
            const options = { year: 'numeric', month: 'long' };
            monthYearElement.textContent = this.currentDate.toLocaleDateString('en-US', options);
        }
    }

    renderCalendarGrid() {
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;

        calendarDays.innerHTML = '';

        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - firstDay.getDay());

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let week = 0; week < 6; week++) {
            for (let day = 0; day < 7; day++) {
                const currentDate = new Date(startDate);
                currentDate.setDate(startDate.getDate() + (week * 7) + day);

                const dayElement = this.createDayElement(currentDate, month, today);
                calendarDays.appendChild(dayElement);
            }
        }
    }

    createDayElement(date, currentMonth, today) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';

        if (date.getMonth() !== currentMonth) {
            dayDiv.classList.add('other-month');
        }

        if (date.getTime() === today.getTime()) {
            dayDiv.classList.add('today');
        }

        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = date.getDate();
        dayDiv.appendChild(dayNumber);

        const eventsContainer = document.createElement('div');
        eventsContainer.className = 'day-events';

        // Add events for this day
        const dayEvents = this.getEventsForDate(date);
        dayEvents.forEach(event => {
            const eventElement = document.createElement('div');
            eventElement.className = `calendar-event ${event.type}`;
            eventElement.textContent = event.title;
            eventElement.title = `${event.title} - ${event.time || 'All day'}`;
            eventsContainer.appendChild(eventElement);
        });

        dayDiv.appendChild(eventsContainer);

        dayDiv.addEventListener('click', () => {
            this.onDayClick(date);
        });

        return dayDiv;
    }

    getEventsForDate(date) {
        const dateStr = date.toISOString().split('T')[0];
        return this.events.filter(event => {
            const eventDate = new Date(event.date).toISOString().split('T')[0];
            return eventDate === dateStr;
        });
    }

    renderUpcomingGames() {
        const upcomingContainer = document.getElementById('calendarUpcomingGames');
        if (!upcomingContainer) return;

        const today = new Date();
        const nextWeek = new Date(today);
        nextWeek.setDate(today.getDate() + 7);

        const upcomingEvents = this.events.filter(event => {
            const eventDate = new Date(event.date);
            return eventDate >= today && eventDate <= nextWeek;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (upcomingEvents.length === 0) {
            upcomingContainer.innerHTML = '<p class="muted">No upcoming games in the next 7 days</p>';
            return;
        }

        upcomingContainer.innerHTML = upcomingEvents.map(event => `
            <div class="upcoming-game-item">
                <div class="upcoming-game-info">
                    <h4>${event.title}</h4>
                    <p>${this.formatEventDate(event.date)} ${event.time ? `at ${event.time}` : ''}</p>
                    ${event.location ? `<p>${event.location}</p>` : ''}
                </div>
                <div class="upcoming-game-status">
                    <span class="legend-dot ${event.type}"></span>
                    ${event.paid ? '<span>✓ Paid</span>' : '<span>Pending</span>'}
                </div>
            </div>
        `).join('');
    }

    formatEventDate(dateStr) {
        const date = new Date(dateStr);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
            });
        }
    }

    onDayClick(date) {
        const events = this.getEventsForDate(date);
        if (events.length > 0) {
            // Show event details or navigate to games page
            console.log('Events for', date, events);
        } else {
            // Option to add new game for this date
            console.log('No events for', date);
        }
    }

    addEvent(event) {
        this.events.push({
            id: Date.now(),
            title: event.title,
            date: event.date,
            time: event.time,
            location: event.location,
            type: event.type || 'game-scheduled',
            paid: event.paid || false,
            googleEventId: event.googleEventId
        });
        this.render();
    }

    updateEvent(eventId, updates) {
        const eventIndex = this.events.findIndex(e => e.id === eventId);
        if (eventIndex !== -1) {
            this.events[eventIndex] = { ...this.events[eventIndex], ...updates };
            this.render();
        }
    }

    removeEvent(eventId) {
        this.events = this.events.filter(e => e.id !== eventId);
        this.render();
    }

    syncWithGames(games) {
        // Convert games to calendar events
        this.events = games.map(game => ({
            id: game.id,
            title: `${game.league || 'Game'} - ${game.away || 'Away'} @ ${game.home || 'Home'}`,
            date: game.date,
            time: game.time,
            location: game.location,
            type: game.paid ? 'game-paid' : 'game-scheduled',
            paid: game.paid,
            gameData: game
        }));
        this.render();
    }

    async syncWithGoogleCalendar() {
        const syncStatus = document.getElementById('syncStatusText');
        const syncDot = document.querySelector('.sync-dot');
        
        if (syncDot) {
            syncDot.className = 'sync-dot syncing';
        }
        if (syncStatus) {
            syncStatus.textContent = 'Syncing with Google Calendar...';
        }

        try {
            // Use the existing Calendar module
            if (window.Calendar && window.Calendar.isConnected()) {
                const googleEvents = await window.Calendar.getEvents();
                
                // Merge Google Calendar events with local games
                const googleCalendarEvents = googleEvents.map(event => ({
                    id: `google_${event.id}`,
                    title: event.summary,
                    date: event.start.date || event.start.dateTime.split('T')[0],
                    time: event.start.dateTime ? new Date(event.start.dateTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit'
                    }) : null,
                    location: event.location,
                    type: 'google-synced',
                    paid: false,
                    googleEventId: event.id
                }));

                // Add Google events to existing events
                this.events = [...this.events.filter(e => !e.googleEventId), ...googleCalendarEvents];
                this.render();

                if (syncDot) {
                    syncDot.className = 'sync-dot';
                }
                if (syncStatus) {
                    syncStatus.textContent = 'Synced with Google Calendar';
                }
            } else {
                throw new Error('Google Calendar not connected');
            }
        } catch (error) {
            console.error('Google Calendar sync failed:', error);
            if (syncDot) {
                syncDot.className = 'sync-dot error';
            }
            if (syncStatus) {
                syncStatus.textContent = 'Sync failed - Click to retry';
                syncStatus.style.cursor = 'pointer';
                syncStatus.onclick = () => this.syncWithGoogleCalendar();
            }
        }
    }
}

// Initialize calendar UI when needed
// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarUI;
}
document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('calendarDays')) {
        window.calendarUI = new CalendarUI();
        
        // Sync with existing games
        if (window.Store && window.Store.games) {
            window.calendarUI.syncWithGames(window.Store.games);
        }

        // Attempt to sync with Google Calendar if available
        if (window.Calendar) {
            window.calendarUI.syncWithGoogleCalendar();
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalendarUI;
}
