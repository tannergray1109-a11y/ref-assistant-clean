/**
 * Basic Router-ish screen switcher
 */
const screens = document.querySelectorAll(".screen");
const navBtns = document.querySelectorAll(".nav-btn");

function showScreen(name) {
  console.log('📱 showScreen called with:', name);
  
  screens.forEach(s => s.classList.add("hidden"));
  const targetScreen = document.getElementById(name);
  
  if (!targetScreen) {
    console.error('❌ Screen not found:', name);
    return;
  }
  
  targetScreen.classList.remove("hidden");
  console.log('✅ Screen shown:', name);
  
  // Update navigation buttons (remove active from all, then add to current if it exists)
  navBtns.forEach(b => b.classList.remove("active"));
  const activeBtn = document.querySelector(`[data-screen="${name}"]`);
  if (activeBtn) {
    activeBtn.classList.add("active");
  }
  
  if (name === "dashboard") renderDashboard();
  if (name === "games") { renderGamesTable(); hideGameForm(); }
  if (name === "calendar") {
    console.log('🗓️ Calendar screen selected, calling renderCalendar()');
    renderCalendar();
  }
  if (name === "mileage") { renderMileageGameOptions(); renderMileageTable(); }
  if (name === "expenses") { renderExpenseGameOptions(); renderExpensesTable(); }
  if (name === "reports") renderReports();
}
navBtns.forEach(b => b.addEventListener("click", () => showScreen(b.dataset.screen)));

// Logo click handler for dashboard
document.addEventListener('DOMContentLoaded', () => {
  const logoButton = document.getElementById('logoButton');
  if (logoButton) {
    logoButton.addEventListener('click', () => showScreen('dashboard'));
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
      
      // Update calendar if visible
      if (!document.getElementById("calendar").classList.contains("hidden")) {
        renderCalendar();
      }
      
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

let editingGameId = null;

btnAddGame.addEventListener("click", () => openGameForm(null));
document.getElementById("cancelGameForm").addEventListener("click", hideGameForm);
btnClearFilters.addEventListener("click", () => {
  filterUpdated.value = 'all';
  filterPaid.value = 'all';
  filterFrom.value = '';
  filterTo.value = '';
  renderGamesTable();
});
[filterUpdated, filterPaid, filterFrom, filterTo].forEach(el => el.addEventListener("change", renderGamesTable));

function renderGamesTable() {
  const { games } = Store.getState();
  gamesTableBody.innerHTML = "";

  const from = filterFrom.value ? new Date(filterFrom.value) : null;
  const to = filterTo.value ? new Date(filterTo.value) : null;

  let rows = [...games];
  if (filterUpdated.value !== 'all') {
    const want = filterUpdated.value === 'yes';
    rows = rows.filter(g => !!g.updated === want);
  }
  if (filterPaid.value !== 'all') {
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
      
      // Update calendar if visible
      if (!document.getElementById("calendar").classList.contains("hidden")) {
        renderCalendar();
      }
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
    if (!editingGameId) {
      alert('No game selected for deletion');
      return;
    }
    
    if (confirm("Delete this game?")) {
      try {
        const gameToDelete = Store.getState().games.find(g => g.id === editingGameId);
        
        // Delete calendar event if it exists
        if (typeof Calendar !== 'undefined' && Calendar.isConnected && Calendar.isConnected() && gameToDelete?.calendarEventId) {
          await Calendar.deleteGameEvent(gameToDelete.calendarEventId);
        }
        
        Store.deleteGame(editingGameId);
        editingGameId = null;
        renderGamesTable();
        hideGameForm();
        renderDashboard(); // Refresh dashboard after deletion
        
        // Trigger data sync if available
        if (typeof DataService !== 'undefined' && DataService.autoSync) {
          DataService.autoSync();
        }
      } catch (error) {
        console.error('Error deleting game:', error);
        alert('Error deleting game: ' + error.message);
      }
    }
  };
}

function hideGameForm() {
  gameFormSection.classList.add("hidden");
  editingGameId = null;
}

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
  renderCalendar(); // Refresh calendar after game changes
  hideGameForm();
});

/**
 * MILEAGE
 */
const mileageForm = document.getElementById("mileageForm");
const mileageTableBody = document.querySelector("#mileageTable tbody");
const mileageGameIdSelect = document.getElementById("mileageGameId");

function renderMileageGameOptions() {
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

mileageForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(mileageForm);
  const mileageData = {
    date: fd.get("date"),
    miles: Number(fd.get("miles")),
    gameId: fd.get("gameId") ? Number(fd.get("gameId")) : null
  };
  Store.addMileage(mileageData);
  mileageForm.reset();
  renderMileageTable();
});

/**
 * EXPENSES
 */
const expenseForm = document.getElementById("expenseForm");
const expensesTableBody = document.querySelector("#expensesTable tbody");
const expenseGameIdSelect = document.getElementById("expenseGameId");
const exportCSVBtn = document.getElementById("exportCSV");

function renderExpenseGameOptions() {
  const { games } = Store.getState();
  expenseGameIdSelect.innerHTML = `<option value="">(Optional) Link to game…</option>`;
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    expenseGameIdSelect.appendChild(opt);
  });
}

expenseForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const fd = new FormData(expenseForm);
  const receiptFile = fd.get("receipt");
  
  // Handle receipt photo if provided
  let receiptData = null;
  if (receiptFile && receiptFile.size > 0) {
    const reader = new FileReader();
    reader.onload = function(event) {
      receiptData = event.target.result;
      saveExpense(fd, receiptData);
    };
    reader.readAsDataURL(receiptFile);
  } else {
    saveExpense(fd, null);
  }
});

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

function renderExpensesTable() {
  const { expenses, games } = Store.getState();
  expensesTableBody.innerHTML = "";
  const rows = [...expenses].sort((a,b) => a.date.localeCompare(b.date));
  rows.forEach(e => {
    const tr = document.createElement("tr");
    const game = e.gameId ? games.find(g => g.id === e.gameId) : null;
    const receiptCell = e.receipt 
      ? `<img src="${e.receipt}" class="receipt-thumbnail" onclick="showReceiptModal('${e.receipt}')" alt="Receipt">`
      : "-";
    tr.innerHTML = `
      <td>${e.date}</td>
      <td>${e.category}</td>
      <td>$${e.amount.toFixed(2)}</td>
      <td>${game ? `${game.date} ${game.time}` : "-"}</td>
      <td>${e.notes || ""}</td>
      <td>${receiptCell}</td>
      <td class="right"><button class="btn secondary btn-del-exp" data-id="${e.id}">Delete</button></td>
    `;
    expensesTableBody.appendChild(tr);
  });
  expensesTableBody.querySelectorAll(".btn-del-exp").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      Store.deleteExpense(id);
      renderExpensesTable();
      renderDashboard();
    });
  });
}

exportCSVBtn.addEventListener("click", () => {
  const { expenses } = Store.getState();
  const header = ["id","date","category","amount","gameId","notes","hasReceipt"];
  const rows = expenses.map(e => [
    e.id, 
    e.date, 
    e.category, 
    e.amount, 
    e.gameId ?? "", 
    `"${(e.notes||"").replace(/"/g,'""')}"`,
    e.receipt ? "Yes" : "No"
  ]);
  const content = [header.join(","), ...rows.map(r => r.join(","))].join("\n");
  const blob = new Blob([content], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "expenses.csv";
  a.click();
  URL.revokeObjectURL(url);
});

// Mileage CSV export
document.getElementById("exportMileageCSV").addEventListener("click", () => {
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
 * CALENDAR
 */
function renderCalendar() {
  console.log('🗓️ renderCalendar() called');
  
  // Make sure calendar section is visible
  const calendarSection = document.getElementById('calendar');
  if (!calendarSection) {
    console.error('❌ Calendar section not found!');
    return;
  }
  
  // Initialize calendar UI if not already done
  if (!window.calendarUI) {
    if (typeof CalendarUI !== 'undefined') {
      console.log('✅ Creating new CalendarUI instance');
      try {
        window.calendarUI = new CalendarUI();
        console.log('✅ CalendarUI created successfully');
      } catch (error) {
        console.error('❌ Error creating CalendarUI:', error);
        return;
      }
    } else {
      console.error('❌ CalendarUI class not found');
      
      // Fallback: Show basic calendar message
      const calendarContainer = document.querySelector('#calendarDays');
      if (calendarContainer) {
        calendarContainer.innerHTML = '<div style="padding: 20px; text-align: center;">Calendar is loading... Please refresh the page.</div>';
      }
      return;
    }
  }
  
  // Sync calendar UI with current games data
  if (window.calendarUI) {
    try {
      const { games } = Store.getState();
      console.log('🎯 Syncing calendar with', games.length, 'games');
      window.calendarUI.syncWithGames(games);
      
      // Also sync with Google Calendar if available
      if (window.Calendar && window.Calendar.isConnected()) {
        console.log('📅 Syncing with Google Calendar');
        window.calendarUI.syncWithGoogleCalendar();
      }
      
      console.log('✅ Calendar sync completed');
    } catch (error) {
      console.error('❌ Error syncing calendar:', error);
    }
  }
}

/**
 * SETTINGS
 */
document.getElementById("resetData").addEventListener("click", async () => {
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

// Calendar Integration Event Listeners
document.getElementById("connectCalendarBtn").addEventListener("click", async () => {
  await Calendar.connect();
});

document.getElementById("disconnectCalendarBtn").addEventListener("click", async () => {
  await Calendar.disconnect();
});

document.getElementById("syncCalendarBtn").addEventListener("click", async () => {
  const syncBtn = document.getElementById("syncCalendarBtn");
  const originalText = syncBtn.textContent;
  syncBtn.textContent = "Syncing...";
  syncBtn.disabled = true;
  
  try {
    await Calendar.syncAllGames();
  } catch (error) {
    console.error('Error syncing calendar:', error);
  } finally {
    syncBtn.textContent = originalText;
    syncBtn.disabled = false;
  }
});

// Dark Mode Toggle
const darkModeToggle = document.getElementById("darkModeToggle");
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

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

/**
 * PHOTO UPLOAD FUNCTIONALITY
 */
const receiptInput = document.getElementById("receiptInput");
const receiptPreview = document.getElementById("receiptPreview");
const receiptImage = document.getElementById("receiptImage");
const removeReceiptBtn = document.getElementById("removeReceipt");

receiptInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(event) {
      receiptImage.src = event.target.result;
      receiptPreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

removeReceiptBtn.addEventListener("click", () => {
  clearReceiptPreview();
});

function clearReceiptPreview() {
  receiptInput.value = "";
  receiptImage.src = "";
  receiptPreview.classList.add("hidden");
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
 * Init - Wait for authentication before showing content
 */
document.addEventListener('DOMContentLoaded', async () => {
  // Wait for authentication to initialize
  if (typeof AuthService !== 'undefined') {
    try {
      await AuthService.init();
      // Only show dashboard if user is authenticated
      if (AuthService.getCurrentUser()) {
        showScreen("dashboard");
      }
    } catch (error) {
      console.error('Authentication initialization failed:', error);
      // Fallback to show dashboard anyway
      showScreen("dashboard");
    }
  } else {
    // AuthService not available, show dashboard anyway
    showScreen("dashboard");
  }
});
