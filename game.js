(() => {
  'use strict';

  const SAVE_KEY = 'garden-match-save-v1';
  const TILES = ['🌼', '🍓', '🍄', '🍀', '🫐', '🌻'];
  const GOAL_TILE = '🌼';
  const LEVELS = {
    relaxed: { moves: 32, target: 10, score: 650 },
    normal: { moves: 26, target: 13, score: 900 },
    tricky: { moves: 21, target: 16, score: 1250 }
  };

  const state = {
    size: 7,
    difficulty: 'normal',
    board: [],
    selected: null,
    score: 0,
    moves: 26,
    target: 13,
    collected: 0,
    level: 1,
    busy: false,
    sound: true
  };

  const els = {
    home: document.querySelector('#home-screen'),
    game: document.querySelector('#game-screen'),
    board: document.querySelector('#board'),
    size: document.querySelector('#size-select'),
    difficulty: document.querySelector('#difficulty-select'),
    start: document.querySelector('#start-button'),
    continue: document.querySelector('#continue-button'),
    how: document.querySelector('#how-button'),
    share: document.querySelector('#share-button'),
    back: document.querySelector('#back-button'),
    sound: document.querySelector('#sound-button'),
    hint: document.querySelector('#hint-button'),
    shuffle: document.querySelector('#shuffle-button'),
    restart: document.querySelector('#restart-button'),
    score: document.querySelector('#score-label'),
    moves: document.querySelector('#moves-label'),
    target: document.querySelector('#target-label'),
    level: document.querySelector('#level-label'),
    goal: document.querySelector('#goal-label'),
    dialog: document.querySelector('#message-dialog'),
    dialogTitle: document.querySelector('#dialog-title'),
    dialogText: document.querySelector('#dialog-text'),
    dialogAction: document.querySelector('#dialog-action')
  };

  function rand(max) { return Math.floor(Math.random() * max); }
  function randomTile() { return TILES[rand(TILES.length)]; }
  function key(row, col) { return `${row}-${col}`; }
  function get(row, col) { return state.board[row]?.[col]; }
  function set(row, col, value) { state.board[row][col] = value; }
  function isAdjacent(a, b) { return Math.abs(a.row - b.row) + Math.abs(a.col - b.col) === 1; }

  function hasSavedGame() {
    return Boolean(localStorage.getItem(SAVE_KEY));
  }

  function updateContinueButton() {
    if (!els.continue) return;
    els.continue.classList.toggle('hidden', !hasSavedGame());
  }

  function saveGame() {
    try {
      const saveData = {
        version: 1,
        savedAt: new Date().toISOString(),
        size: state.size,
        difficulty: state.difficulty,
        board: state.board,
        score: state.score,
        moves: state.moves,
        target: state.target,
        collected: state.collected,
        level: state.level,
        sound: state.sound
      };
      localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
      updateContinueButton();
    } catch (_) { /* Saving is helpful, but the game should still work if storage is unavailable. */ }
  }

  function loadSavedGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return false;
      const saved = JSON.parse(raw);
      if (!saved || saved.version !== 1 || !Array.isArray(saved.board)) return false;
      if (!Number.isInteger(saved.size) || saved.size < 6 || saved.size > 8) return false;
      if (!LEVELS[saved.difficulty]) return false;
      if (saved.board.length !== saved.size || !saved.board.every(row => Array.isArray(row) && row.length === saved.size)) return false;

      state.size = saved.size;
      state.difficulty = saved.difficulty;
      state.board = saved.board;
      state.score = Number(saved.score) || 0;
      state.moves = Number(saved.moves) || LEVELS[state.difficulty].moves;
      state.target = Number(saved.target) || LEVELS[state.difficulty].target;
      state.collected = Number(saved.collected) || 0;
      state.level = Number(saved.level) || 1;
      state.sound = saved.sound !== false;
      state.selected = null;
      state.busy = false;

      els.size.value = String(state.size);
      els.difficulty.value = state.difficulty;
      els.sound.textContent = state.sound ? '🔊' : '🔇';
      els.home.classList.add('hidden');
      els.game.classList.remove('hidden');
      render();
      return true;
    } catch (_) {
      localStorage.removeItem(SAVE_KEY);
      updateContinueButton();
      return false;
    }
  }

  function clearSavedGame() {
    localStorage.removeItem(SAVE_KEY);
    updateContinueButton();
  }

  function makeAudio(freq = 520, duration = 0.06, type = 'sine') {
    if (!state.sound) return;
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      gain.gain.value = 0.045;
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
      osc.stop(ctx.currentTime + duration);
    } catch (_) { /* Sound is optional. */ }
  }

  function showDialog(title, text, actionLabel = 'OK', onClose) {
    els.dialogTitle.textContent = title;
    els.dialogText.textContent = text;
    els.dialogAction.textContent = actionLabel;
    els.dialog.onclose = () => {
      els.dialog.onclose = null;
      if (onClose) onClose();
    };
    els.dialog.showModal();
  }

  function configureFromInputs() {
    state.size = Number(els.size.value);
    state.difficulty = els.difficulty.value;
    const base = LEVELS[state.difficulty];
    state.moves = Math.max(12, base.moves - (state.level - 1) * 2 + (state.size === 8 ? 3 : state.size === 6 ? -2 : 0));
    state.target = base.target + (state.level - 1) * 2 + (state.size === 8 ? 3 : state.size === 6 ? -2 : 0);
    state.score = 0;
    state.collected = 0;
    state.selected = null;
    state.busy = false;
  }

  function createBoard() {
    state.board = Array.from({ length: state.size }, () => Array(state.size).fill(null));
    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) {
        let tile;
        do {
          tile = randomTile();
        } while (
          (col >= 2 && get(row, col - 1) === tile && get(row, col - 2) === tile) ||
          (row >= 2 && get(row - 1, col) === tile && get(row - 2, col) === tile)
        );
        set(row, col, tile);
      }
    }
    if (!findMove()) shuffleBoard(false);
  }

  function render() {
    document.documentElement.style.setProperty('--board-size', state.size);
    els.board.innerHTML = '';
    els.board.style.setProperty('--board-size', state.size);

    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) {
        const button = document.createElement('button');
        button.className = 'tile';
        button.type = 'button';
        button.dataset.row = row;
        button.dataset.col = col;
        button.textContent = get(row, col);
        button.setAttribute('aria-label', `${get(row, col)} tile at row ${row + 1}, column ${col + 1}`);
        if (state.selected && state.selected.row === row && state.selected.col === col) button.classList.add('selected');
        button.addEventListener('click', () => onTileTap(row, col));
        els.board.appendChild(button);
      }
    }
    updateHud();
  }

  function updateHud() {
    els.score.textContent = state.score.toLocaleString();
    els.moves.textContent = state.moves;
    els.target.textContent = `${state.collected} / ${state.target}`;
    els.level.textContent = state.level;
    els.goal.textContent = `Collect ${state.target} flowers`;
  }

  async function onTileTap(row, col) {
    if (state.busy) return;
    const current = { row, col };
    if (!state.selected) {
      state.selected = current;
      makeAudio(420, 0.035);
      render();
      return;
    }

    if (state.selected.row === row && state.selected.col === col) {
      state.selected = null;
      render();
      return;
    }

    if (!isAdjacent(state.selected, current)) {
      state.selected = current;
      makeAudio(400, 0.035);
      render();
      return;
    }

    await trySwap(state.selected, current);
  }

  function swap(a, b) {
    const temp = get(a.row, a.col);
    set(a.row, a.col, get(b.row, b.col));
    set(b.row, b.col, temp);
  }

  async function trySwap(a, b) {
    state.busy = true;
    state.selected = null;
    swap(a, b);
    render();
    await sleep(110);
    const matches = findMatches();
    if (!matches.size) {
      swap(a, b);
      makeAudio(180, 0.08, 'triangle');
      render();
      state.busy = false;
      return;
    }
    state.moves--;
    await resolveMatches(matches);
    endTurn();
  }

  async function resolveMatches(initialMatches) {
    let matches = initialMatches;
    let chain = 0;
    while (matches.size) {
      chain++;
      markMatches(matches);
      makeAudio(560 + chain * 75, 0.07, 'sine');
      await sleep(210);
      removeMatches(matches, chain);
      collapseColumns();
      render();
      await sleep(150);
      matches = findMatches();
    }
  }

  function markMatches(matches) {
    matches.forEach(id => {
      const tile = els.board.querySelector(`[data-row="${id.split('-')[0]}"][data-col="${id.split('-')[1]}"]`);
      if (tile) tile.classList.add('pop');
    });
  }

  function removeMatches(matches, chain) {
    matches.forEach(id => {
      const [row, col] = id.split('-').map(Number);
      if (get(row, col) === GOAL_TILE) state.collected++;
      set(row, col, null);
      state.score += 20 * chain;
    });
  }

  function collapseColumns() {
    for (let col = 0; col < state.size; col++) {
      const stack = [];
      for (let row = state.size - 1; row >= 0; row--) {
        if (get(row, col)) stack.push(get(row, col));
      }
      for (let row = state.size - 1; row >= 0; row--) {
        set(row, col, stack.shift() || randomTile());
      }
    }
  }

  function findMatches() {
    const matches = new Set();
    for (let row = 0; row < state.size; row++) {
      let runStart = 0;
      for (let col = 1; col <= state.size; col++) {
        if (col < state.size && get(row, col) === get(row, runStart)) continue;
        if (col - runStart >= 3) {
          for (let c = runStart; c < col; c++) matches.add(key(row, c));
        }
        runStart = col;
      }
    }
    for (let col = 0; col < state.size; col++) {
      let runStart = 0;
      for (let row = 1; row <= state.size; row++) {
        if (row < state.size && get(row, col) === get(runStart, col)) continue;
        if (row - runStart >= 3) {
          for (let r = runStart; r < row; r++) matches.add(key(r, col));
        }
        runStart = row;
      }
    }
    return matches;
  }

  function findMove() {
    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) {
        const a = { row, col };
        const neighbors = [{ row: row + 1, col }, { row, col: col + 1 }];
        for (const b of neighbors) {
          if (b.row >= state.size || b.col >= state.size) continue;
          swap(a, b);
          const works = findMatches().size > 0;
          swap(a, b);
          if (works) return [a, b];
        }
      }
    }
    return null;
  }

  function shuffleBoard(costMove = true) {
    const flat = state.board.flat().sort(() => Math.random() - 0.5);
    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) set(row, col, flat[row * state.size + col]);
    }
    let guard = 0;
    while ((findMatches().size || !findMove()) && guard < 80) {
      flat.sort(() => Math.random() - 0.5);
      for (let row = 0; row < state.size; row++) {
        for (let col = 0; col < state.size; col++) set(row, col, flat[row * state.size + col]);
      }
      guard++;
    }
    if (costMove && state.moves > 1) state.moves--;
    state.selected = null;
    makeAudio(300, 0.08, 'sawtooth');
    render();
    saveGame();
  }

  function endTurn() {
    state.busy = false;
    updateHud();
    saveGame();
    if (state.collected >= state.target) {
      makeAudio(740, 0.16);
      showDialog('Wonderful garden!', `You completed Level ${state.level}!\nScore: ${state.score.toLocaleString()}\n\nReady for the next level?`, 'Next Level', () => {
        state.level++;
        startGame();
      });
      return;
    }
    if (state.moves <= 0) {
      showDialog('Almost there!', `You collected ${state.collected} of ${state.target} flowers.\nTry again with a fresh board.`, 'Try Again', () => startGame());
      return;
    }
    if (!findMove()) {
      showDialog('Fresh shuffle', 'No more useful swaps were available, so the garden has been gently shuffled for you.', 'Continue', () => shuffleBoard(false));
    }
  }

  function showHint() {
    if (state.busy) return;
    const move = findMove();
    if (!move) return shuffleBoard(false);
    makeAudio(650, 0.06);
    move.flatMap(pos => [pos]).forEach(pos => {
      const tile = els.board.querySelector(`[data-row="${pos.row}"][data-col="${pos.col}"]`);
      if (tile) tile.classList.add('hint');
    });
  }

  function startGame() {
    configureFromInputs();
    createBoard();
    els.home.classList.add('hidden');
    els.game.classList.remove('hidden');
    render();
    saveGame();
  }

  async function shareGame() {
    const shareData = {
      title: 'Garden Match',
      text: 'Play Garden Match — a calm puzzle game for all ages!',
      url: window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        makeAudio(650, 0.05);
        return;
      }

      await navigator.clipboard.writeText(shareData.url);
      makeAudio(650, 0.05);
      showDialog('Link copied!', 'The Garden Match link was copied. You can paste it into LINE, WhatsApp, Facebook, or anywhere you want to share it.', 'Nice');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      showDialog('Share this link', shareData.url, 'OK');
    }
  }

  function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

  els.start.addEventListener('click', () => {
    clearSavedGame();
    state.level = 1;
    startGame();
  });
  if (els.continue) {
    els.continue.addEventListener('click', () => {
      if (!loadSavedGame()) showDialog('No saved game', 'There is no saved game on this device yet. Start a new game to create one.', 'OK');
    });
  }
  els.how.addEventListener('click', () => showDialog(
    'How to play',
    'Tap one tile, then tap a neighbor to swap them.\n\nMatch 3 or more of the same garden tile in a row or column.\n\nCollect the flower goal before your moves run out. Use Hint if you get stuck — this game is meant to be kind.',
    'Got it'
  ));
  els.share.addEventListener('click', shareGame);
  els.back.addEventListener('click', () => { els.game.classList.add('hidden'); els.home.classList.remove('hidden'); });
  els.sound.addEventListener('click', () => { state.sound = !state.sound; els.sound.textContent = state.sound ? '🔊' : '🔇'; });
  els.hint.addEventListener('click', showHint);
  els.shuffle.addEventListener('click', () => !state.busy && shuffleBoard(true));
  els.restart.addEventListener('click', () => !state.busy && startGame());

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  updateContinueButton();
})();
