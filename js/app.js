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
  const upcomingContainer = document.getElementById("upcomingGames");
  if (!upcomingContainer) return;
  
  upcomingContainer.innerHTML = "";
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const next7 = new Date(today.getTime() + 7*24*60*60*1000);
  const upcomingGames = games
    .filter(g => {
      const gameDate = new Date(g.date);
      return gameDate >= today && gameDate <= next7;
    })
    .sort((a,b) => a.date.localeCompare(b.date));

  if (upcomingGames.length === 0) {
    upcomingContainer.innerHTML = '<p class="muted">No upcoming games in the next 7 days.</p>';
  } else {
    upcomingGames.forEach(g => {
      const gameCard = document.createElement("div");
      gameCard.className = "game-card";
      gameCard.innerHTML = `
        <div class="game-info">
          <div class="game-date">${g.date} at ${g.time}</div>
          <div class="game-teams">${g.away || 'Team A'} @ ${g.home || 'Team B'}</div>
          <div class="game-pay">$${Number(g.pay || 0).toFixed(2)}</div>
        </div>
        <div class="game-flags">
          <label><input type="checkbox" ${g.updated ? "checked":""} data-flag="updated" data-id="${g.id}" data-source="dashboard" /> Updated</label>
          <label><input type="checkbox" ${g.paid ? "checked":""} data-flag="paid" data-id="${g.id}" data-source="dashboard" /> Paid</label>
        </div>
      `;
      
      // Add click handler for the card (but not for checkboxes)
      gameCard.addEventListener("click", (e) => {
        if (e.target.type !== 'checkbox') {
          showScreen("games");
          openGameForm(g.id);
        }
      });
      
      upcomingContainer.appendChild(gameCard);
    });
    
    // Add checkbox listeners
    upcomingContainer.querySelectorAll('input[type="checkbox"][data-source="dashboard"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = Number(e.target.dataset.id);
        const flag = e.target.dataset.flag;
        Store.updateGame(id, { [flag]: e.target.checked });
        renderDashboard();
        
        // If games screen is visible, update it too
        if (!document.getElementById("games").classList.contains("hidden")) {
          renderGamesTable();
        }
      });
    });
  }
}

/**
 * GAMES
 */
let editingGameId = null;

function renderGamesTable() {
  const { games } = Store.getState();
  const gamesList = document.getElementById("gamesList");
  if (!gamesList) return;
  
  gamesList.innerHTML = "";

  if (games.length === 0) {
    gamesList.innerHTML = '<p class="muted">No games added yet. Click "Add Game" to get started.</p>';
    return;
  }

  const sortedGames = [...games].sort((a,b) => b.date.localeCompare(a.date)); // Most recent first

  sortedGames.forEach(g => {
    const gameCard = document.createElement("div");
    gameCard.className = "game-item";
    gameCard.innerHTML = `
      <div class="game-header">
        <div class="game-date-time">${g.date} at ${g.time}</div>
        <div class="game-pay">$${Number(g.pay || 0).toFixed(2)}</div>
      </div>
      <div class="game-details">
        <div class="game-teams">${g.away || 'Team A'} @ ${g.home || 'Team B'}</div>
        ${g.league ? `<div class="game-league">${g.league}</div>` : ''}
      </div>
      <div class="game-flags">
        <label class="flag-label ${g.updated ? 'checked' : ''}">
          <input type="checkbox" ${g.updated ? "checked":""} data-flag="updated" data-id="${g.id}" />
          <span>Updated</span>
        </label>
        <label class="flag-label ${g.paid ? 'checked' : ''}">
          <input type="checkbox" ${g.paid ? "checked":""} data-flag="paid" data-id="${g.id}" />
          <span>Paid</span>
        </label>
      </div>
      <div class="game-actions">
        <button class="secondary-btn btn-edit" data-id="${g.id}">Edit</button>
      </div>
    `;
    
    gamesList.appendChild(gameCard);
  });

  // Add event listeners
  gamesList.querySelectorAll('input[type="checkbox"]').forEach(cb => {
    cb.addEventListener('change', (e) => {
      const id = Number(e.target.dataset.id);
      const flag = e.target.dataset.flag;
      Store.updateGame(id, { [flag]: e.target.checked });
      renderDashboard();
      renderGamesTable(); // Refresh to update visual state
    });
  });

  gamesList.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', e => {
      const id = Number(e.target.dataset.id);
      openGameForm(id);
    });
  });
}

function openGameForm(id) {
  const state = Store.getState();
  editingGameId = id;
  
  // Create modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>${id ? 'Edit Game' : 'Add Game'}</h3>
        <button class="close-modal" type="button">&times;</button>
      </div>
      <form id="gameForm" class="modal-body">
        <div class="form-group">
          <label for="gameDate">Date</label>
          <input type="date" id="gameDate" name="date" required>
        </div>
        <div class="form-group">
          <label for="gameTime">Time</label>
          <input type="time" id="gameTime" name="time" required>
        </div>
        <div class="form-group">
          <label for="gameLeague">League</label>
          <input type="text" id="gameLeague" name="league" placeholder="Optional">
        </div>
        <div class="form-group">
          <label for="gameHome">Home Team</label>
          <input type="text" id="gameHome" name="home" placeholder="Home team">
        </div>
        <div class="form-group">
          <label for="gameAway">Away Team</label>
          <input type="text" id="gameAway" name="away" placeholder="Away team">
        </div>
        <div class="form-group">
          <label for="gamePay">Pay</label>
          <input type="number" id="gamePay" name="pay" step="0.01" min="0" placeholder="0.00">
        </div>
      </form>
      <div class="modal-footer">
        <button type="button" class="secondary-btn cancel-btn">Cancel</button>
        ${id ? '<button type="button" class="danger-btn delete-btn">Delete</button>' : ''}
        <button type="submit" form="gameForm" class="primary-btn">Save</button>
      </div>
    </div>
  `;
  
  // Fill form if editing
  if (id) {
    const g = state.games.find(x => x.id === id);
    if (g) {
      modal.querySelector('#gameDate').value = g.date;
      modal.querySelector('#gameTime').value = g.time;
      modal.querySelector('#gameLeague').value = g.league || "";
      modal.querySelector('#gamePay').value = g.pay || "";
      modal.querySelector('#gameHome').value = g.home || "";
      modal.querySelector('#gameAway').value = g.away || "";
    }
  }
  
  // Event listeners
  modal.querySelector('.close-modal').addEventListener('click', () => hideGameForm(modal));
  modal.querySelector('.cancel-btn').addEventListener('click', () => hideGameForm(modal));
  
  if (id) {
    modal.querySelector('.delete-btn').addEventListener('click', () => {
      if (confirm("Delete this game?")) {
        Store.deleteGame(editingGameId);
        renderGamesTable();
        renderDashboard();
        hideGameForm(modal);
      }
    });
  }
  
  modal.querySelector('#gameForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = {
      date: formData.get("date"),
      time: formData.get("time"),
      league: formData.get("league"),
      pay: Number(formData.get("pay") || 0),
      home: formData.get("home"),
      away: formData.get("away"),
    };
    
    if (editingGameId) {
      Store.updateGame(editingGameId, payload);
    } else {
      Store.addGame({ ...payload, updated: false, paid: false });
    }
    
    renderGamesTable();
    renderDashboard();
    hideGameForm(modal);
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      hideGameForm(modal);
    }
  });
  
  document.body.appendChild(modal);
}

function hideGameForm(modal) {
  if (modal && modal.parentNode) {
    modal.parentNode.removeChild(modal);
  }
  editingGameId = null;
}

// Add Game button listener
document.addEventListener('DOMContentLoaded', () => {
  const addGameBtn = document.getElementById('addGameBtn');
  if (addGameBtn) {
    addGameBtn.addEventListener('click', () => openGameForm(null));
  }
});

/**
 * MILEAGE
 */
function renderMileageGameOptions() {
  const { games } = Store.getState();
  const mileageGameSelect = document.getElementById("mileageGameId");
  if (!mileageGameSelect) return;
  
  mileageGameSelect.innerHTML = `<option value="">(Optional) Link to game…</option>`;
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    mileageGameSelect.appendChild(opt);
  });
}

function renderMileageTable() {
  const { mileage, games } = Store.getState();
  const mileageList = document.getElementById("mileageList");
  if (!mileageList) return;
  
  mileageList.innerHTML = "";
  
  if (mileage.length === 0) {
    mileageList.innerHTML = '<p class="muted">No mileage entries yet. Click "Add Mileage" to get started.</p>';
    return;
  }
  
  const sortedMileage = [...mileage].sort((a,b) => b.date.localeCompare(a.date));
  
  sortedMileage.forEach(m => {
    const game = m.gameId ? games.find(g => g.id === m.gameId) : null;
    const mileageCard = document.createElement("div");
    mileageCard.className = "mileage-item";
    mileageCard.innerHTML = `
      <div class="mileage-header">
        <div class="mileage-date">${m.date}</div>
        <div class="mileage-miles">${m.miles.toFixed(1)} miles</div>
      </div>
      ${game ? `<div class="mileage-game">Game: ${game.date} ${game.time}</div>` : ''}
      <div class="mileage-actions">
        <button class="danger-btn btn-del-mileage" data-id="${m.id}">Delete</button>
      </div>
    `;
    mileageList.appendChild(mileageCard);
  });

  mileageList.querySelectorAll(".btn-del-mileage").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      if (confirm("Delete this mileage entry?")) {
        Store.deleteMileage(id);
        renderMileageTable();
      }
    });
  });
}

// Add Mileage button and form listeners
document.addEventListener('DOMContentLoaded', () => {
  const addMileageBtn = document.getElementById('addMileageBtn');
  if (addMileageBtn) {
    addMileageBtn.addEventListener('click', () => openMileageForm());
  }
});

function openMileageForm() {
  // Create modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Add Mileage</h3>
        <button class="close-modal" type="button">&times;</button>
      </div>
      <form id="mileageForm" class="modal-body">
        <div class="form-group">
          <label for="mileageDate">Date</label>
          <input type="date" id="mileageDate" name="date" required>
        </div>
        <div class="form-group">
          <label for="mileageMiles">Miles</label>
          <input type="number" id="mileageMiles" name="miles" step="0.1" min="0" placeholder="0.0" required>
        </div>
        <div class="form-group">
          <label for="mileageGameId">Link to Game (Optional)</label>
          <select id="mileageGameId" name="gameId">
            <option value="">Select a game...</option>
          </select>
        </div>
      </form>
      <div class="modal-footer">
        <button type="button" class="secondary-btn cancel-btn">Cancel</button>
        <button type="submit" form="mileageForm" class="primary-btn">Save</button>
      </div>
    </div>
  `;
  
  // Populate game options
  const { games } = Store.getState();
  const gameSelect = modal.querySelector('#mileageGameId');
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    gameSelect.appendChild(opt);
  });
  
  // Event listeners
  modal.querySelector('.close-modal').addEventListener('click', () => document.body.removeChild(modal));
  modal.querySelector('.cancel-btn').addEventListener('click', () => document.body.removeChild(modal));
  
  modal.querySelector('#mileageForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const mileageData = {
      date: formData.get("date"),
      miles: Number(formData.get("miles")),
      gameId: formData.get("gameId") ? Number(formData.get("gameId")) : null
    };
    Store.addMileage(mileageData);
    renderMileageTable();
    document.body.removeChild(modal);
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

/**
 * EXPENSES
 */
function renderExpenseGameOptions() {
  // This function is called but we'll handle game selection in the modal
}

function renderExpensesTable() {
  const { expenses, games } = Store.getState();
  const expensesList = document.getElementById("expensesList");
  if (!expensesList) return;
  
  expensesList.innerHTML = "";
  
  if (expenses.length === 0) {
    expensesList.innerHTML = '<p class="muted">No expenses yet. Click "Add Expense" to get started.</p>';
    return;
  }
  
  const sortedExpenses = [...expenses].sort((a,b) => b.date.localeCompare(a.date));
  
  sortedExpenses.forEach(e => {
    const game = e.gameId ? games.find(g => g.id === e.gameId) : null;
    const expenseCard = document.createElement("div");
    expenseCard.className = "expense-item";
    expenseCard.innerHTML = `
      <div class="expense-header">
        <div class="expense-date">${e.date}</div>
        <div class="expense-amount">$${e.amount.toFixed(2)}</div>
      </div>
      <div class="expense-details">
        <div class="expense-category">${e.category}</div>
        ${game ? `<div class="expense-game">Game: ${game.date} ${game.time}</div>` : ''}
        ${e.notes ? `<div class="expense-notes">${e.notes}</div>` : ''}
      </div>
      ${e.receipt ? `<div class="expense-receipt">
        <img src="${e.receipt}" class="receipt-thumbnail" onclick="showReceiptModal('${e.receipt}')" alt="Receipt">
      </div>` : ''}
      <div class="expense-actions">
        <button class="danger-btn btn-del-expense" data-id="${e.id}">Delete</button>
      </div>
    `;
    expensesList.appendChild(expenseCard);
  });

  expensesList.querySelectorAll(".btn-del-expense").forEach(btn => {
    btn.addEventListener("click", (e) => {
      const id = Number(e.target.dataset.id);
      if (confirm("Delete this expense?")) {
        Store.deleteExpense(id);
        renderExpensesTable();
        renderDashboard();
      }
    });
  });
}

// Add Expense button listener
document.addEventListener('DOMContentLoaded', () => {
  const addExpenseBtn = document.getElementById('addExpenseBtn');
  if (addExpenseBtn) {
    addExpenseBtn.addEventListener('click', () => openExpenseForm());
  }
});

function openExpenseForm() {
  // Create modal
  const modal = document.createElement("div");
  modal.className = "modal-overlay";
  modal.innerHTML = `
    <div class="modal">
      <div class="modal-header">
        <h3>Add Expense</h3>
        <button class="close-modal" type="button">&times;</button>
      </div>
      <form id="expenseForm" class="modal-body">
        <div class="form-group">
          <label for="expenseDate">Date</label>
          <input type="date" id="expenseDate" name="date" required>
        </div>
        <div class="form-group">
          <label for="expenseCategory">Category</label>
          <select id="expenseCategory" name="category" required>
            <option value="">Select category...</option>
            <option value="Gas">Gas</option>
            <option value="Meals">Meals</option>
            <option value="Equipment">Equipment</option>
            <option value="Registration">Registration</option>
            <option value="Training">Training</option>
            <option value="Other">Other</option>
          </select>
        </div>
        <div class="form-group">
          <label for="expenseAmount">Amount</label>
          <input type="number" id="expenseAmount" name="amount" step="0.01" min="0" placeholder="0.00" required>
        </div>
        <div class="form-group">
          <label for="expenseGameId">Link to Game (Optional)</label>
          <select id="expenseGameId" name="gameId">
            <option value="">Select a game...</option>
          </select>
        </div>
        <div class="form-group">
          <label for="expenseNotes">Notes</label>
          <textarea id="expenseNotes" name="notes" placeholder="Optional notes"></textarea>
        </div>
        <div class="form-group">
          <label for="expenseReceipt">Receipt Photo (Optional)</label>
          <input type="file" id="expenseReceipt" name="receipt" accept="image/*">
          <div id="receiptPreview" class="receipt-preview hidden">
            <img id="receiptImage" alt="Receipt preview">
            <button type="button" id="removeReceipt" class="remove-receipt">&times;</button>
          </div>
        </div>
      </form>
      <div class="modal-footer">
        <button type="button" class="secondary-btn cancel-btn">Cancel</button>
        <button type="submit" form="expenseForm" class="primary-btn">Save</button>
      </div>
    </div>
  `;
  
  // Populate game options
  const { games } = Store.getState();
  const gameSelect = modal.querySelector('#expenseGameId');
  [...games].sort((a,b) => a.date.localeCompare(b.date)).forEach(g => {
    const opt = document.createElement("option");
    opt.value = g.id;
    opt.textContent = `${g.date} ${g.time} – ${g.away || ''} @ ${g.home || ''} ($${g.pay || 0})`;
    gameSelect.appendChild(opt);
  });
  
  // Receipt preview functionality
  const receiptInput = modal.querySelector('#expenseReceipt');
  const receiptPreview = modal.querySelector('#receiptPreview');
  const receiptImage = modal.querySelector('#receiptImage');
  const removeReceiptBtn = modal.querySelector('#removeReceipt');
  
  receiptInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function(event) {
        receiptImage.src = event.target.result;
        receiptPreview.classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });
  
  removeReceiptBtn.addEventListener('click', () => {
    receiptInput.value = '';
    receiptImage.src = '';
    receiptPreview.classList.add('hidden');
  });
  
  // Event listeners
  modal.querySelector('.close-modal').addEventListener('click', () => document.body.removeChild(modal));
  modal.querySelector('.cancel-btn').addEventListener('click', () => document.body.removeChild(modal));
  
  modal.querySelector('#expenseForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const receiptFile = formData.get("receipt");
    
    // Handle receipt photo if provided
    let receiptData = null;
    if (receiptFile && receiptFile.size > 0) {
      const reader = new FileReader();
      reader.onload = function(event) {
        receiptData = event.target.result;
        saveExpense(formData, receiptData, modal);
      };
      reader.readAsDataURL(receiptFile);
    } else {
      saveExpense(formData, null, modal);
    }
  });
  
  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

function saveExpense(formData, receiptData, modal) {
  const exp = {
    date: formData.get("date"),
    category: formData.get("category"),
    amount: Number(formData.get("amount")),
    gameId: formData.get("gameId") ? Number(formData.get("gameId")) : null,
    notes: formData.get("notes") || "",
    receipt: receiptData
  };
  Store.addExpense(exp);
  renderExpensesTable();
  renderDashboard();
  document.body.removeChild(modal);
}

function showReceiptModal(receiptSrc) {
  const modal = document.createElement("div");
  modal.className = "receipt-modal";
  modal.innerHTML = `
    <img src="${receiptSrc}" alt="Receipt">
    <button class="close-modal">&times;</button>
  `;
  
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.classList.contains("close-modal")) {
      document.body.removeChild(modal);
    }
  });
  
  document.body.appendChild(modal);
}

/**
 * REPORTS
 */
function renderReports() {
  const { games, expenses, mileage } = Store.getState();
  const income = games.reduce((sum, g) => sum + Number(g.pay || 0), 0);
  const exp = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  
  // Update summary cards if they exist
  const incomeEl = document.getElementById("rptYTDIncome");
  const expensesEl = document.getElementById("rptYTDExpenses");
  const netEl = document.getElementById("rptYTDNet");
  
  if (incomeEl) incomeEl.textContent = `$${income.toFixed(2)}`;
  if (expensesEl) expensesEl.textContent = `$${exp.toFixed(2)}`;
  if (netEl) netEl.textContent = `$${(income - exp).toFixed(2)}`;

  // Mileage summary
  const totalMiles = mileage.reduce((sum, m) => sum + Number(m.miles || 0), 0);
  const avgMiles = mileage.length > 0 ? totalMiles / mileage.length : 0;
  
  const totalMilesEl = document.getElementById("rptTotalMiles");
  const avgMilesEl = document.getElementById("rptAvgMiles");
  
  if (totalMilesEl) totalMilesEl.textContent = `${totalMiles.toFixed(1)} mi`;
  if (avgMilesEl) avgMilesEl.textContent = `${avgMiles.toFixed(1)} mi`;
}

/**
 * SETTINGS
 */
document.addEventListener('DOMContentLoaded', () => {
  // Profile picture and dropdown functionality
  const profilePicture = document.getElementById('profilePicture');
  const profileDropdown = document.getElementById('profileDropdown');
  const userAvatar = document.getElementById('userAvatar');
  const userInitials = document.getElementById('userInitials');
  
  if (profilePicture) {
    profilePicture.addEventListener('click', (e) => {
      e.stopPropagation();
      profileDropdown.classList.toggle('hidden');
    });
  }
  
  // Close dropdown when clicking outside
  document.addEventListener('click', () => {
    if (profileDropdown && !profileDropdown.classList.contains('hidden')) {
      profileDropdown.classList.add('hidden');
    }
  });
  
  // Dropdown item handlers
  if (profileDropdown) {
    profileDropdown.addEventListener('click', (e) => {
      const action = e.target.closest('.dropdown-item')?.dataset.action;
      if (action === 'settings') {
        showScreen('settings');
        profileDropdown.classList.add('hidden');
      } else if (action === 'edit-profile') {
        // Handle edit profile
        profileDropdown.classList.add('hidden');
      }
    });
  }
  
  // Sign out button
  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', () => {
      if (typeof AuthService !== 'undefined' && AuthService.signOut) {
        AuthService.signOut();
      } else {
        // Fallback for local development
        localStorage.clear();
        location.reload();
      }
    });
  }
});

/**
 * Init - Show dashboard on load
 */
document.addEventListener('DOMContentLoaded', () => {
  // Initialize the app
  setTimeout(() => {
    showScreen("dashboard");
  }, 100);
});
