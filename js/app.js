/**
 * Basic Router-ish screen switcher
 */

function showScreen(name) {
  const screens = document.querySelectorAll(".screen");
  const navBtns = document.querySelectorAll(".nav-btn");
  
  screens.forEach(s => s.classList.add("hidden"));
  const targetScreen = document.getElementById(name);
  
  if (!targetScreen) {
    console.error('Screen not found:', name);
    return;
  }
  
  targetScreen.classList.remove("hidden");
  
  // Update navigation buttons (remove active from all, then add to current if it exists)
  navBtns.forEach(b => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-screen="${name}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  if (name === "dashboard") renderDashboard();
  if (name === "games") { 
    renderGamesTable(); 
    hideGameForm(); 
    // Check if we should auto-open the add game form (from calendar redirect)
    if (sessionStorage.getItem('openAddGameForm') === 'true') {
      sessionStorage.removeItem('openAddGameForm');
      // Small delay to ensure the games screen is fully rendered
      setTimeout(() => {
        const addGameBtn = document.getElementById('btnAddGame');
        if (addGameBtn) {
          addGameBtn.click();
        }
      }, 100);
    }
  }
  if (name === "mileage") { renderMileageGameOptions(); renderMileageTable(); }
  if (name === "expenses") { renderExpenseGameOptions(); renderExpensesTable(); }
  if (name === "reports") renderReports();
}

// Logo click handler for dashboard
document.addEventListener('DOMContentLoaded', () => {
  // Set up navigation button listeners
  const navBtns = document.querySelectorAll('.nav-btn');
  
  const logoButton = document.getElementById('logoButton');
  if (logoButton) {
    logoButton.addEventListener('click', () => {
      showScreen('dashboard');
    });
  }
  
  // Hamburger menu functionality
  const hamburgerBtn = document.getElementById('hamburgerBtn');
  const sidebar = document.getElementById('sidebar');
  const navOverlay = document.getElementById('navOverlay');
  
  function toggleNav() {
    if (hamburgerBtn) hamburgerBtn.classList.toggle('active');
    if (sidebar) sidebar.classList.toggle('active');
    if (navOverlay) navOverlay.classList.toggle('active');
  }
  
  function closeNav() {
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    if (sidebar) sidebar.classList.remove('active');
    if (navOverlay) navOverlay.classList.remove('active');
  }
  
  if (hamburgerBtn) {
    hamburgerBtn.addEventListener('click', toggleNav);
  }
  
  if (navOverlay) {
    navOverlay.addEventListener('click', closeNav);
  }
  
  // Set up navigation button listeners - navigate and close menu
  navBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      showScreen(btn.dataset.screen);
      closeNav();
    });
  });
  
  // Initialize all sections
  initializeGamesSection();
  initializeMileageSection();
  initializeExpensesSection();
  initializeMileageCSVExport();
  initializeSettingsSection();
  initializeThemeToggle();
  initializePhotoUpload();
  
  // Initialize the data and render dashboard
  renderDashboard();
  
  // Check for hash navigation on page load
  const hash = window.location.hash.substring(1);
  if (hash && document.getElementById(hash) && window.location.href.includes('#')) {
    showScreen(hash);
    // Clear the hash after navigation to prevent interference
    history.replaceState(null, null, window.location.pathname);
  } else {
    showScreen("dashboard");
  }
});

/**
 * DASHBOARD
 */
function renderDashboard() {
  const { games, expenses } = Store.getState();
  const now = new Date();
  const monthStr = String(now.getMonth()+1).padStart(2,'0');
  const thisMonth = `${now.getFullYear()}-${monthStr}`;

  const gamesThisMonth = games.filter(g => g.date.startsWith(thisMonth)).length;
  const needUpdate = games.filter(g => !g.updated).length;
  const unpaid = games.filter(g => !g.paid).length;
  const ytdExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

  document.getElementById("dashGamesThisMonth").textContent = gamesThisMonth;
  document.getElementById("dashNeedUpdate").textContent = needUpdate;
  document.getElementById("dashUnpaid").textContent = unpaid;
  document.getElementById("dashYTDExpenses").textContent = `$${ytdExpenses.toFixed(2)}`;

  // Upcoming 7 days
  const upcomingBody = document.querySelector("#upcomingTable tbody");
  upcomingBody.innerHTML = "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()); // Start of today
  const next7 = new Date(today.getTime() + 7*24*60*60*1000);
  const rows = games
    .filter(g => {
      const gameDate = new Date(g.date);
      return gameDate >= today && gameDate <= next7;
    })
    .sort((a,b) => a.date.localeCompare(b.date));
  rows.forEach(g => {
    const calendarIcon = g.calendarEventId ? '📅' : '';
    const calendarTitle = g.calendarEventId ? 'Synced with Google Calendar' : '';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.date}</td>
      <td>${g.time}</td>
      <td>${g.home || ""} <span class="calendar-indicator" title="${calendarTitle}">${calendarIcon}</span></td>
      <td>$${Number(g.pay).toFixed(2)}</td>
      <td><input type="checkbox" ${g.updated ? "checked":""} data-flag="updated" data-id="${g.id}" data-source="dashboard" /></td>
      <td><input type="checkbox" ${g.paid ? "checked":""} data-flag="paid" data-id="${g.id}" data-source="dashboard" /></td>
    `;
    
    // Add click handler for the row (but not for checkboxes)
    tr.addEventListener("click", (e) => {
      // Don't navigate if clicking on checkbox
      if (e.target.type !== 'checkbox') {
        showScreen("games");
        openGameForm(g.id);
      }
    });
    
    upcomingBody.appendChild(tr);
  });
  
  // Add checkbox listeners for dashboard
  upcomingBody.querySelectorAll('input[type="checkbox"][data-source="dashboard"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const flag = e.target.dataset.flag;
      Store.updateGame(id, { [flag]: e.target.checked });
      
      // Update dashboard metrics immediately
      renderDashboard();
      
      // If games screen is visible, update it too
      if (!document.getElementById("games").classList.contains("hidden")) {
        renderGamesTable();
      }
    });
  });
}

/**
 * GAMES
 */

let editingGameId = null;

function initializeGamesSection() {
  const gamesTableBody = document.querySelector("#gamesTable tbody");
  const btnAddGame = document.getElementById("btnAddGame");
  const gameFormSection = document.getElementById("gameFormSection");
  const gameForm = document.getElementById("gameForm");
  const gameFormTitle = document.getElementById("gameFormTitle");
  const deleteGameBtn = document.getElementById("deleteGameBtn");
  const filterUpdated = document.getElementById("filterUpdated");
  const filterPaid = document.getElementById("filterPaid");
  const filterFrom = document.getElementById("filterFrom");
  const filterTo = document.getElementById("filterTo");
  const btnClearFilters = document.getElementById("btnClearFilters");

  if (btnAddGame) {
    btnAddGame.addEventListener("click", () => {
      openGameForm(null);
    });
  }
  
  const cancelGameForm = document.getElementById("cancelGameForm");
  if (cancelGameForm) {
    cancelGameForm.addEventListener("click", hideGameForm);
  }
  
  // Game form submit handler
  if (gameForm) {
    gameForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(gameForm);
      const payload = {
        date: formData.get("date"),
        time: formData.get("time"),
        league: formData.get("league"),
        pay: Number(formData.get("pay") || 0),
        home: formData.get("home"),
        away: formData.get("away"),
      };
      
      let gameData;
      if (editingGameId) {
        const existingGame = Store.getState().games.find(g => g.id === editingGameId);
        Store.updateGame(editingGameId, payload);
        gameData = { ...existingGame, ...payload };
        
        // Update calendar event if connected and event exists
        if (Calendar.isConnected() && existingGame.calendarEventId) {
          await Calendar.updateGameEvent(gameData, existingGame.calendarEventId);
        }
      } else {
        gameData = Store.addGame({ ...payload, updated: false, paid: false });
        
        // Create calendar event if connected
        if (Calendar.isConnected()) {
          const eventId = await Calendar.createGameEvent(gameData);
          if (eventId) {
            Store.updateGame(gameData.id, { calendarEventId: eventId });
          }
        }
      }
      
      renderGamesTable();
      renderDashboard(); // Refresh dashboard after game changes
      hideGameForm();
    });
  }
  
  if (btnClearFilters) {
    btnClearFilters.addEventListener("click", () => {
      if (filterUpdated) filterUpdated.value = 'all';
      if (filterPaid) filterPaid.value = 'all';
      if (filterFrom) filterFrom.value = '';
      if (filterTo) filterTo.value = '';
      renderGamesTable();
    });
  }
  
  [filterUpdated, filterPaid, filterFrom, filterTo].forEach(el => {
    if (el) {
      el.addEventListener("change", renderGamesTable);
    }
  });
}

function renderGamesTable() {
  const { games } = Store.getState();
  const gamesTableBody = document.querySelector("#gamesTable tbody");
  const filterUpdated = document.getElementById("filterUpdated");
  const filterPaid = document.getElementById("filterPaid");
  const filterFrom = document.getElementById("filterFrom");
  const filterTo = document.getElementById("filterTo");
  
  if (!gamesTableBody) return;
  
  gamesTableBody.innerHTML = "";

  const from = (filterFrom && filterFrom.value) ? new Date(filterFrom.value) : null;
  const to = (filterTo && filterTo.value) ? new Date(filterTo.value) : null;

  let rows = [...games];
  if (filterUpdated && filterUpdated.value !== 'all') {
    const want = filterUpdated.value === 'yes';
    rows = rows.filter(g => !!g.updated === want);
  }
  if (filterPaid && filterPaid.value !== 'all') {
    const want = filterPaid.value === 'yes';
    rows = rows.filter(g => !!g.paid === want);
  }
  if (from) rows = rows.filter(g => new Date(g.date) >= from);
  if (to) rows = rows.filter(g => new Date(g.date) <= to);

  rows.sort((a,b) => a.date.localeCompare(b.date));

  rows.forEach(g => {
    const calendarIcon = g.calendarEventId ? '📅' : '';
    const calendarTitle = g.calendarEventId ? 'Synced with Google Calendar' : '';
    
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${g.date}</td>
      <td>${g.time}</td>
      <td>${g.league || ""}</td>
      <td>${g.away || ""} @ ${g.home || ""} <span class="calendar-indicator" title="${calendarTitle}">${calendarIcon}</span></td>
      <td>$${Number(g.pay || 0).toFixed(2)}</td>
      <td><input type="checkbox" ${g.updated ? "checked":""} data-flag="updated" data-id="${g.id}" /></td>
      <td><input type="checkbox" ${g.paid ? "checked":""} data-flag="paid" data-id="${g.id}" /></td>
      <td class="right"><button class="btn secondary btn-edit" data-id="${g.id}">Edit</button></td>
    `;
    gamesTableBody.appendChild(tr);
  });

  // checkbox listeners
  gamesTableBody.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const flag = e.target.dataset.flag;
      Store.updateGame(id, { [flag]: e.target.checked });
      renderDashboard(); // Update dashboard metrics and upcoming games
    });
  });

  // edit buttons
  gamesTableBody.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      openGameForm(id);
    });
  });
}

function openGameForm(id) {
  const gameForm = document.getElementById("gameForm");
  const gameFormTitle = document.getElementById("gameFormTitle");
  const gameFormSection = document.getElementById("gameFormSection");
  const deleteGameBtn = document.getElementById("deleteGameBtn");
  
  if (!gameForm || !gameFormTitle || !gameFormSection || !deleteGameBtn) {
    console.error('Game form elements not found');
    return;
  }
  
  const state = Store.getState();
  editingGameId = id;
  gameForm.reset();
  deleteGameBtn.classList.toggle("hidden", !id);
  if (id) {
    gameFormTitle.textContent = "Edit Game";
    const g = state.games.find(x => x.id === id);
    gameForm.date.value = g.date;
    gameForm.time.value = g.time;
    gameForm.league.value = g.league || "";
    gameForm.pay.value = g.pay || "";
    gameForm.home.value = g.home || "";
    gameForm.away.value = g.away || "";
  } else {
    gameFormTitle.textContent = "Add Game";
  }
  gameFormSection.classList.remove("hidden");
  gameForm.scrollIntoView({ behavior: "smooth" });

  deleteGameBtn.onclick = async () => {
    if (confirm("Delete this game?")) {
      const gameToDelete = Store.getState().games.find(g => g.id === editingGameId);
      
      // Delete calendar event if it exists
      if (Calendar.isConnected() && gameToDelete?.calendarEventId) {
        await Calendar.deleteGameEvent(gameToDelete.calendarEventId);
      }
      
      Store.deleteGame(editingGameId);
      editingGameId = null;
      renderGamesTable();
      hideGameForm();
      renderDashboard(); // Refresh dashboard after deletion
    }
  };
}

function hideGameForm() {
  const gameFormSection = document.getElementById("gameFormSection");
  if (gameFormSection) {
    gameFormSection.classList.add("hidden");
  }
  editingGameId = null;
}

/**
 * MILEAGE
 */

function initializeMileageSection() {
  const mileageForm = document.getElementById("mileageForm");
  const mileageGameIdSelect = document.getElementById("mileageGameId");
  
  if (mileageForm) {
    mileageForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(mileageForm);
      const mileageData = {
        from: fd.get("from"),
        to: fd.get("to"),
        roundTrip: fd.get("roundTrip") === "on",
        miles: Number(fd.get("miles")),
        rate: Number(fd.get("rate")),
        total: Number(fd.get("miles")) * Number(fd.get("rate")),
        date: fd.get("date"),
        gameId: fd.get("gameId") ? Number(fd.get("gameId")) : null
      };
      Store.addMileage(mileageData);
      mileageForm.reset();
      renderMileageTable();
    });
  }
  
  renderMileageGameOptions();
}

function renderMileageGameOptions() {
  const mileageGameIdSelect = document.getElementById("mileageGameId");
  if (!mileageGameIdSelect) return;
  
  const { games } = Store.getState();
  mileageGameIdSelect.innerHTML = `<option value="">(Optional) Link to game…</option>`;
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    mileageGameIdSelect.appendChild(opt);
  });
}

function renderMileageTable() {
  const mileageTableBody = document.querySelector("#mileageTable tbody");
  if (!mileageTableBody) return;
  
  const { mileage, games } = Store.getState();
  mileageTableBody.innerHTML = "";
  const rows = [...mileage].sort((a,b) => a.date.localeCompare(b.date));
  rows.forEach(m => {
    const game = m.gameId ? games.find(g => g.id === m.gameId) : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.date}</td>
      <td>${m.miles.toFixed(1)}</td>
      <td>${game ? `${game.date} ${game.time}` : "-"}</td>
      <td class="right"><button class="btn secondary btn-del-mileage" data-id="${m.id}">Delete</button></td>
    `;
    mileageTableBody.appendChild(tr);
  });

  mileageTableBody.querySelectorAll(".btn-del-mileage").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      Store.deleteMileage(id);
      renderMileageTable();
    });
  });
}

/**
 * EXPENSES
 */

function initializeExpensesSection() {
  console.log('💰 Initializing expenses section...');
  
  const expenseForm = document.getElementById("expenseForm");
  const exportCSVBtn = document.getElementById("exportCSV");
  
  console.log('💰 Expense elements:', {
    expenseForm: !!expenseForm,
    exportCSVBtn: !!exportCSVBtn
  });
  
  if (expenseForm) {
    expenseForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const fd = new FormData(expenseForm);
      const expenseData = {
        date: fd.get("date"),
        description: fd.get("description"),
        amount: Number(fd.get("amount")),
        gameId: fd.get("gameId") ? Number(fd.get("gameId")) : null,
        receipt: fd.get("receipt") || null
      };
      Store.addExpense(expenseData);
      expenseForm.reset();
      renderExpensesTable();
    });
    console.log('✅ Expense form listener set up');
  }
  
  if (exportCSVBtn) {
    exportCSVBtn.addEventListener("click", () => {
      const { expenses, games } = Store.getState();
      let csv = "Date,Description,Amount,Game\n";
      expenses.forEach(e => {
        const game = e.gameId ? games.find(g => g.id === e.gameId) : null;
        csv += `${e.date},"${e.description}",${e.amount},"${game ? `${game.date} ${game.time}` : ""}"\n`;
      });
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `referee-expenses-${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    });
    console.log('✅ Export CSV listener set up');
  }
  
  renderExpenseGameOptions();
}

function renderExpenseGameOptions() {
  const expenseGameIdSelect = document.getElementById("expenseGameId");
  if (!expenseGameIdSelect) return;
  
  const { games } = Store.getState();
  expenseGameIdSelect.innerHTML = `<option value="">(Optional) Link to game…</option>`;
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    expenseGameIdSelect.appendChild(opt);
  });
}

function renderExpensesTable() {
  const expensesTableBody = document.querySelector("#expensesTable tbody");
  if (!expensesTableBody) return;
  
  const { expenses, games } = Store.getState();
  expensesTableBody.innerHTML = "";
  const rows = [...expenses].sort((a,b) => a.date.localeCompare(b.date));
  rows.forEach(e => {
    const game = e.gameId ? games.find(g => g.id === e.gameId) : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${e.description}</td>
      <td class="right">$${e.amount.toFixed(2)}</td>
      <td>${game ? `${game.date} ${game.time}` : "-"}</td>
      <td class="right">
        ${e.receipt ? '<span class="receipt-indicator">📷</span>' : ''}
        <button class="btn secondary btn-del-expense" data-id="${e.id}">Delete</button>
      </td>
    `;
    expensesTableBody.appendChild(tr);
  });

  expensesTableBody.querySelectorAll(".btn-del-expense").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      Store.deleteExpense(id);
      renderExpensesTable();
      renderDashboard();
    });
  });
}

function saveExpense(formData, receiptData) {
  const exp = {
    date: formData.get("date"),
    category: formData.get("category"),
    amount: Number(formData.get("amount")),
    gameId: formData.get("gameId") ? Number(formData.get("gameId")) : null,
    notes: formData.get("notes") || "",
    receipt: receiptData
  };
  Store.addExpense(exp);
  expenseForm.reset();
  clearReceiptPreview();
  renderExpensesTable();
  renderDashboard();
}

// Mileage CSV export - This should be moved to mileage initialization
function initializeMileageCSVExport() {
  const exportMileageCSVBtn = document.getElementById("exportMileageCSV");
  if (exportMileageCSVBtn) {
    exportMileageCSVBtn.addEventListener("click", () => {
      const { mileage, games } = Store.getState();
      const header = ["id","date","miles","gameId","gameInfo"];
      const rows = mileage.map(m => {
        const game = m.gameId ? games.find(g => g.id === m.gameId) : null;
        const gameInfo = game ? `${game.date} ${game.time} - ${game.away} @ ${game.home}` : "";
        return [m.id, m.date, m.miles, m.gameId ?? "", `"${gameInfo.replace(/"/g,'""')}"`];
      });
      const content = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
      const blob = new Blob([content], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "mileage.csv";
      a.click();
      URL.revokeObjectURL(url);
    });
  }
}

/**
 * REPORTS
 */
function renderReports() {
  const { games, expenses, mileage } = Store.getState();
  const income = games.reduce((sum, g) => sum + Number(g.pay || 0), 0);
  const exp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  document.getElementById("rptYTDIncome").textContent = `$${income.toFixed(2)}`;
  document.getElementById("rptYTDExpenses").textContent = `$${exp.toFixed(2)}`;
  document.getElementById("rptYTDNet").textContent = `$${(income - exp).toFixed(2)}`;

  // By category
  const catTotals = {};
  expenses.forEach(e => {
    catTotals[e.category] = (catTotals[e.category] || 0) + Number(e.amount);
  });
  const tbody = document.querySelector("#categoryReportTable tbody");
  tbody.innerHTML = "";
  Object.entries(catTotals).forEach(([cat, total]) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${cat}</td><td>$${total.toFixed(2)}</td>`;
    tbody.appendChild(tr);
  });

  // Mileage summary
  const totalMiles = mileage.reduce((sum, m) => sum + Number(m.miles || 0), 0);
  const avgMiles = mileage.length > 0 ? totalMiles / mileage.length : 0;
  document.getElementById("rptTotalMiles").textContent = `${totalMiles.toFixed(1)} mi`;
  document.getElementById("rptAvgMiles").textContent = `${avgMiles.toFixed(1)} mi`;

  // Mileage table
  const mileageTbody = document.querySelector("#mileageReportTable tbody");
  mileageTbody.innerHTML = "";
  const mileageRows = [...mileage].sort((a,b) => a.date.localeCompare(b.date));
  mileageRows.forEach(m => {
    const game = m.gameId ? games.find(g => g.id === m.gameId) : null;
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${m.date}</td>
      <td>${m.miles.toFixed(1)}</td>
      <td>${game ? `${game.date} ${game.time}` : "-"}</td>
    `;
    mileageTbody.appendChild(tr);
  });
}

/**
 * SETTINGS
 */

function initializeSettingsSection() {
  console.log('⚙️ Initializing settings section...');
  
  const resetDataBtn = document.getElementById("resetData");
  
  if (resetDataBtn) {
    resetDataBtn.addEventListener("click", async () => {
      if (confirm("This will delete ALL your games, expenses, and mileage data. This action cannot be undone. Are you sure?")) {
        // Show loading state
        const resetBtn = document.getElementById("resetData");
        const originalText = resetBtn.textContent;
        resetBtn.textContent = "Clearing...";
        resetBtn.disabled = true;
        
        try {
          // Check if user is authenticated for cloud sync
          const user = AuthService?.getCurrentUser();
          if (user && typeof DataService !== 'undefined') {
            // Clear both local and cloud data
            const result = await DataService.clearAllUserData();
            if (!result.success) {
              console.error('Error clearing cloud data:', result.error);
              // Still clear local data even if cloud fails
              Store.clearAll();
            }
          } else {
            // Just clear local data
            Store.clearAll();
          }
          
          // Refresh all views
          renderDashboard();
          renderGamesTable();
          renderExpenseGameOptions();
          renderExpensesTable();
          renderMileageGameOptions();
          renderMileageTable();
          renderReports();
          showScreen("dashboard");
          
          // Show success message
          if (typeof showToast === 'function') {
            showToast('All data has been cleared successfully');
          } else {
            alert('All data has been cleared successfully');
          }
        } catch (error) {
          console.error('Error clearing data:', error);
          if (typeof showToast === 'function') {
            showToast('Error clearing data. Please try again.', 'error');
          } else {
            alert('Error clearing data. Please try again.');
          }
        } finally {
          // Restore button
          resetBtn.textContent = originalText;
          resetBtn.disabled = false;
        }
      }
    });
    console.log('✅ Reset data button listener set up');
  }
}

// Dark Mode Toggle
function initializeThemeToggle() {
  console.log('🌙 Initializing theme toggle...');
  
  const darkModeToggle = document.getElementById("darkModeToggle");
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
  
  if (!darkModeToggle) return;
  
  // Load saved theme or use system preference
  function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const isDark = savedTheme === 'dark' || (!savedTheme && prefersDark.matches);
    
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    darkModeToggle.checked = isDark;
  }
  
  // Save theme preference
  function saveTheme(isDark) {
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }
  
  // Initialize theme on page load
  loadTheme();
  
  // Handle toggle changes
  darkModeToggle.addEventListener('change', (e) => {
    saveTheme(e.target.checked);
  });
  
  // Listen for system theme changes
  prefersDark.addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      loadTheme();
    }
  });
  
  console.log('✅ Theme toggle listener set up');
}

/**
 * PHOTO UPLOAD FUNCTIONALITY
 */

function initializePhotoUpload() {
  console.log('📷 Initializing photo upload...');
  
  const receiptInput = document.getElementById("receiptInput");
  const receiptPreview = document.getElementById("receiptPreview");
  const receiptImage = document.getElementById("receiptImage");
  const removeReceiptBtn = document.getElementById("removeReceipt");
  
  console.log('📷 Photo upload elements:', {
    receiptInput: !!receiptInput,
    receiptPreview: !!receiptPreview,
    receiptImage: !!receiptImage,
    removeReceiptBtn: !!removeReceiptBtn
  });
  
  if (receiptInput) {
    receiptInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file && receiptImage && receiptPreview) {
        const reader = new FileReader();
        reader.onload = function(event) {
          receiptImage.src = event.target.result;
          receiptPreview.classList.remove("hidden");
        };
        reader.readAsDataURL(file);
      }
    });
    console.log('✅ Receipt input listener set up');
  }
  
  if (removeReceiptBtn) {
    removeReceiptBtn.addEventListener("click", () => {
      clearReceiptPreview();
    });
    console.log('✅ Remove receipt button listener set up');
  }
}

function clearReceiptPreview() {
  const receiptInput = document.getElementById("receiptInput");
  const receiptImage = document.getElementById("receiptImage");
  const receiptPreview = document.getElementById("receiptPreview");
  
  if (receiptInput) receiptInput.value = "";
  if (receiptImage) receiptImage.src = "";
  if (receiptPreview) receiptPreview.classList.add("hidden");
}

function showReceiptModal(receiptSrc) {
  // Create modal overlay
  const modal = document.createElement("div");
  modal.className = "receipt-modal";
  modal.innerHTML = `
    <img src="${receiptSrc}" alt="Receipt">
    <button class="close-modal">×</button>
  `;
  
  // Close modal on click
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("close-modal")) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

/**
 * Init - Navigation handling
 */
// Handle hash changes for navigation (only when explicitly set)
window.addEventListener('hashchange', () => {
  const hash = window.location.hash.substring(1);
  // Only navigate if hash exists and corresponds to a valid screen
  if (hash && document.getElementById(hash)) {
    showScreen(hash);
    // Clear the hash after navigation to prevent staying in URL
    setTimeout(() => {
      history.replaceState(null, null, window.location.pathname);
    }, 100);
  }
});
