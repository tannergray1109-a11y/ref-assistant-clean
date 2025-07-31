/**
 * Simple data store for the referee tracking app
 */
const Store = (() => {
  const KEY = "refAssistantData";
  
  const defaultData = {
    lastId: 0,
    games: [],
    expenses: [],
    mileage: []
  };

  function load() {
    const raw = localStorage.getItem(KEY);
    if (!raw) return JSON.parse(JSON.stringify(defaultData));
    try {
      return JSON.parse(raw);
    } catch {
      return JSON.parse(JSON.stringify(defaultData));
    }
  }

  let state = load();

  function persist() {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  return {
    getState: () => state,
    
    addGame(game) {
      state.lastId += 1;
      game.id = state.lastId;
      state.games.push(game);
      persist();
      return game;
    },
    
    updateGame(id, partial) {
      const idx = state.games.findIndex(g => g.id === id);
      if (idx >= 0) {
        state.games[idx] = { ...state.games[idx], ...partial };
        persist();
      }
    },
    
    deleteGame(id) {
      state.games = state.games.filter(g => g.id !== id);
      // Also unlink expenses pointing to that game
      state.expenses = state.expenses.map(e => e.gameId === id ? {...e, gameId: null} : e);
      // Also unlink mileage pointing to that game
      state.mileage = state.mileage.map(m => m.gameId === id ? {...m, gameId: null} : m);
      persist();
    },
    
    addExpense(exp) {
      const id = (state.expenses[state.expenses.length-1]?.id || 0) + 1;
      exp.id = id;
      state.expenses.push(exp);
      persist();
      return exp;
    },
    
    deleteExpense(id) {
      state.expenses = state.expenses.filter(e => e.id !== id);
      persist();
    },
    
    addMileage(mileage) {
      const id = (state.mileage[state.mileage.length-1]?.id || 0) + 1;
      mileage.id = id;
      state.mileage.push(mileage);
      persist();
      return mileage;
    },
    
    deleteMileage(id) {
      state.mileage = state.mileage.filter(m => m.id !== id);
      persist();
    },
    
    clearAll() {
      state = JSON.parse(JSON.stringify(defaultData));
      persist();
    }
  };
})();
