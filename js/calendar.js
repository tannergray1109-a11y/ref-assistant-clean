// Calendar Module - Simple UI Calendar for Referee Games
class CalendarManager {
    constructor() {
        this.currentDate = new Date();
        this.selectedDate = null;
        this.currentView = 'month';
        this.games = [];
        
        this.initializeEventListeners();
        this.renderCalendar();
        this.loadGames();
    }

    initializeEventListeners() {
        // Navigation buttons
        document.getElementById('prevBtn').addEventListener('click', () => this.navigatePrevious());
        document.getElementById('nextBtn').addEventListener('click', () => this.navigateNext());
        document.getElementById('todayBtn').addEventListener('click', () => this.goToToday());

        // View toggle buttons
        document.querySelectorAll('.view-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.changeView(e.target.dataset.view));
        });

        // Game details sidebar
        document.getElementById('closeSidebar').addEventListener('click', () => this.closeGameDetails());
    }

    navigatePrevious() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() - 7);
        } else if (this.currentView === 'day') {
            this.currentDate.setDate(this.currentDate.getDate() - 1);
        }
        this.renderCalendar();
    }

    navigateNext() {
        if (this.currentView === 'month') {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
        } else if (this.currentView === 'week') {
            this.currentDate.setDate(this.currentDate.getDate() + 7);
        } else if (this.currentView === 'day') {
            this.currentDate.setDate(this.currentDate.getDate() + 1);
        }
        this.renderCalendar();
    }

    goToToday() {
        this.currentDate = new Date();
        this.renderCalendar();
    }

    changeView(view) {
        this.currentView = view;
        
        // Update active button
        document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector(`[data-view="${view}"]`).classList.add('active');
        
        this.renderCalendar();
    }

    renderCalendar() {
        this.updateCurrentMonthDisplay();
        
        if (this.currentView === 'month') {
            this.renderMonthView();
        } else if (this.currentView === 'week') {
            this.renderWeekView();
        } else if (this.currentView === 'day') {
            this.renderDayView();
        }
    }

    updateCurrentMonthDisplay() {
        const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
        ];
        
        let displayText = '';
        if (this.currentView === 'month') {
            displayText = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getFullYear()}`;
        } else if (this.currentView === 'week') {
            const startOfWeek = this.getStartOfWeek(this.currentDate);
            const endOfWeek = new Date(startOfWeek);
            endOfWeek.setDate(endOfWeek.getDate() + 6);
            
            if (startOfWeek.getMonth() === endOfWeek.getMonth()) {
                displayText = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()}-${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
            } else {
                displayText = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
            }
        } else if (this.currentView === 'day') {
            displayText = `${monthNames[this.currentDate.getMonth()]} ${this.currentDate.getDate()}, ${this.currentDate.getFullYear()}`;
        }
        
        document.getElementById('currentMonth').textContent = displayText;
    }

    renderMonthView() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.className = 'calendar-grid month-view';
        
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1);
        const lastDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0);
        const startDate = this.getStartOfWeek(firstDay);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 41); // 6 weeks
        
        let html = this.renderCalendarHeader();
        
        const today = new Date();
        const currentDate = new Date(startDate);
        
        while (currentDate <= endDate) {
            const isOtherMonth = currentDate.getMonth() !== this.currentDate.getMonth();
            const isToday = this.isSameDay(currentDate, today);
            const isSelected = this.selectedDate && this.isSameDay(currentDate, this.selectedDate);
            
            let dayClasses = 'calendar-day';
            if (isOtherMonth) dayClasses += ' other-month';
            if (isToday) dayClasses += ' today';
            if (isSelected) dayClasses += ' selected';
            
            const dayGames = this.getGamesForDate(currentDate);
            
            html += `
                <div class="${dayClasses}" data-date="${currentDate.toISOString().split('T')[0]}">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-events">
                        ${this.renderDayEvents(dayGames)}
                    </div>
                </div>
            `;
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        calendarGrid.innerHTML = html;
        this.attachCalendarEventListeners();
    }

    renderWeekView() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.className = 'calendar-grid week-view';
        
        const startOfWeek = this.getStartOfWeek(this.currentDate);
        let html = this.renderCalendarHeader();
        
        const today = new Date();
        
        for (let i = 0; i < 7; i++) {
            const currentDate = new Date(startOfWeek);
            currentDate.setDate(currentDate.getDate() + i);
            
            const isToday = this.isSameDay(currentDate, today);
            const isSelected = this.selectedDate && this.isSameDay(currentDate, this.selectedDate);
            
            let dayClasses = 'calendar-day';
            if (isToday) dayClasses += ' today';
            if (isSelected) dayClasses += ' selected';
            
            const dayGames = this.getGamesForDate(currentDate);
            
            html += `
                <div class="${dayClasses}" data-date="${currentDate.toISOString().split('T')[0]}">
                    <div class="day-number">${currentDate.getDate()}</div>
                    <div class="day-events">
                        ${this.renderDayEvents(dayGames)}
                    </div>
                </div>
            `;
        }
        
        calendarGrid.innerHTML = html;
        this.attachCalendarEventListeners();
    }

    renderDayView() {
        const calendarGrid = document.getElementById('calendarGrid');
        calendarGrid.className = 'calendar-grid day-view';
        
        const today = new Date();
        const isToday = this.isSameDay(this.currentDate, today);
        const isSelected = this.selectedDate && this.isSameDay(this.currentDate, this.selectedDate);
        
        let dayClasses = 'calendar-day';
        if (isToday) dayClasses += ' today';
        if (isSelected) dayClasses += ' selected';
        
        const dayGames = this.getGamesForDate(this.currentDate);
        
        const html = `
            <div class="${dayClasses}" data-date="${this.currentDate.toISOString().split('T')[0]}">
                <div class="day-number">${this.currentDate.getDate()}</div>
                <div class="day-events">
                    ${this.renderDayEvents(dayGames, true)}
                </div>
            </div>
        `;
        
        calendarGrid.innerHTML = html;
        this.attachCalendarEventListeners();
    }

    renderCalendarHeader() {
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return dayNames.map(day => 
            `<div class="calendar-day-header">${day}</div>`
        ).join('');
    }

    renderDayEvents(games, detailed = false) {
        if (games.length === 0) return '';
        
        const maxVisible = detailed ? games.length : 3;
        const visibleGames = games.slice(0, maxVisible);
        const hiddenCount = games.length - maxVisible;
        
        let html = visibleGames.map(game => {
            const time = this.formatTime(game.time);
            const statusClass = game.status || 'scheduled';
            
            if (detailed) {
                return `
                    <div class="game-event ${statusClass}" data-game-id="${game.id}">
                        <div class="game-time">${time}</div>
                        <div class="game-home">${game.home}</div>
                    </div>
                `;
            } else {
                return `
                    <div class="game-event ${statusClass}" data-game-id="${game.id}">
                        <span class="event-time">${time}</span>
                        <span class="event-home">${game.home}</span>
                    </div>
                `;
            }
        }).join('');
        
        if (hiddenCount > 0) {
            html += `<div class="more-events">+${hiddenCount} more</div>`;
        }
        
        return html;
    }

    attachCalendarEventListeners() {
        // Day click handlers
        document.querySelectorAll('.calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                if (!e.target.closest('.game-event')) {
                    this.selectDate(new Date(day.dataset.date));
                }
            });
        });

        // Game event click handlers
        document.querySelectorAll('.game-event').forEach(event => {
            event.addEventListener('click', (e) => {
                e.stopPropagation();
                this.showGameDetails(event.dataset.gameId);
            });
        });
    }

    selectDate(date) {
        this.selectedDate = date;
        this.renderCalendar();
    }

    getStartOfWeek(date) {
        const startOfWeek = new Date(date);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day;
        startOfWeek.setDate(diff);
        return startOfWeek;
    }

    isSameDay(date1, date2) {
        return date1.getDate() === date2.getDate() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getFullYear() === date2.getFullYear();
    }

    getGamesForDate(date) {
        return this.games.filter(game => {
            const gameDate = new Date(game.date);
            return this.isSameDay(gameDate, date);
        }).sort((a, b) => a.time.localeCompare(b.time));
    }

    formatTime(timeString) {
        // Handle both "HH:MM" and "H:MM AM/PM" formats
        if (timeString.includes('AM') || timeString.includes('PM')) {
            return timeString;
        }
        
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:${minutes} ${ampm}`;
    }

    // Game Management
    async loadGames() {
        try {
            this.games = await window.store.getGames();
            this.renderCalendar();
        } catch (error) {
            console.error('Error loading games:', error);
            this.showNotification('Error loading games.', 'error');
        }
    }

    showGameDetails(gameId) {
        const game = this.games.find(g => g.id === gameId);
        if (!game) return;

        const sidebar = document.getElementById('gameDetailsSidebar');
        const content = document.getElementById('gameDetailsContent');
        
        content.innerHTML = `
            <div class="game-detail-item">
                <div class="game-detail-label">Date & Time</div>
                <div class="game-detail-value">${this.formatDate(game.date)} at ${this.formatTime(game.time)}</div>
            </div>
            <div class="game-detail-item">
                <div class="game-detail-label">Teams</div>
                <div class="game-detail-value">${game.home} vs ${game.away}</div>
            </div>
            ${game.league ? `
                <div class="game-detail-item">
                    <div class="game-detail-label">League</div>
                    <div class="game-detail-value">${game.league}</div>
                </div>
            ` : ''}
            <div class="game-detail-item">
                <div class="game-detail-label">Pay</div>
                <div class="game-detail-value">$${game.pay?.toFixed(2) || '0.00'}</div>
            </div>
            <div class="game-detail-actions">
                <button class="btn secondary" onclick="calendar.closeGameDetails()">Close</button>
            </div>
        `;
        
        sidebar.classList.remove('hidden');
        sidebar.classList.add('visible');
    }

    closeGameDetails() {
        const sidebar = document.getElementById('gameDetailsSidebar');
        sidebar.classList.remove('visible');
        setTimeout(() => {
            sidebar.classList.add('hidden');
        }, 300);
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to DOM
        document.body.appendChild(notification);
        
        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Hide and remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 300);
        }, 3000);
    }
}

// Initialize calendar when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait for auth and store to be available
    if (window.authService && window.store) {
        window.calendar = new CalendarManager();
    } else {
        // Retry after a short delay
        setTimeout(() => {
            window.calendar = new CalendarManager();
        }, 500);
    }
});

// Add notification styles if not already present
if (!document.querySelector('style[data-notifications]')) {
    const style = document.createElement('style');
    style.setAttribute('data-notifications', 'true');
    style.textContent = `
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            z-index: 10000;
            max-width: 300px;
        }
        
        .notification.show {
            transform: translateX(0);
        }
        
        .notification.success {
            background: #10b981;
        }
        
        .notification.error {
            background: #ef4444;
        }
        
        .notification.info {
            background: #3b82f6;
        }
        
        .notification.warning {
            background: #f59e0b;
        }
    `;
    document.head.appendChild(style);
}
