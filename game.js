(() => {
  'use strict';

  const SAVE_KEY = 'garden-match-save-v1';
  const BADGES_KEY = 'garden-match-badges-v1';
  const TILES = ['flower', 'berry', 'mushroom', 'clover', 'blueberry', 'sunflower'];
  const TILE_LABELS = {
    flower: 'pink flower',
    berry: 'red berry',
    mushroom: 'mushroom',
    clover: 'clover leaf',
    blueberry: 'blueberry',
    sunflower: 'sunshine bloom'
  };
  const GOAL_TILE = 'flower';
  const GOAL_NAME = 'pink flowers';
  const MILESTONE_BADGES = [
    { level: 5, emoji: '🌱', name: 'Garden Beginner', message: 'You are growing your first garden!' },
    { level: 10, emoji: '🌸', name: 'Flower Friend', message: 'Amazing! You reached Level 10 and unlocked a special flower celebration!' },
    { level: 15, emoji: '🍄', name: 'Mushroom Helper', message: 'A friendly mushroom helper joined your garden!' },
    { level: 20, emoji: '🦋', name: 'Butterfly Garden', message: 'Butterflies have arrived in your garden!' },
    { level: 25, emoji: '🌻', name: 'Sunshine Grower', message: 'Your garden is shining brighter than ever!' },
    { level: 30, emoji: '🌈', name: 'Rainbow Garden', message: 'Your garden is glowing with rainbow colors!' },
    { level: 35, emoji: '🐝', name: 'Busy Bee Buddy', message: 'A busy bee buddy came to cheer you on!' },
    { level: 40, emoji: '🍀', name: 'Lucky Gardener', message: 'Lucky leaves are growing all around your garden!' },
    { level: 45, emoji: '⭐', name: 'Star Planter', message: 'You planted a star in your magical garden!' },
    { level: 50, emoji: '👑', name: 'Garden Master', message: 'You completed 50 levels. You are a Garden Match Master!' }
  ];
  const LEVEL_COMPLETE_MESSAGES = [
    'Great job — your garden is growing!',
    'Nice work! Every match makes the garden brighter.',
    'Wonderful! You are becoming a better gardener.',
    'Keep going — the next reward is getting closer!',
    'Beautiful progress! Your puzzle skills are blooming.'
  ];
  const LEVELS = {
    relaxed: { moves: 36, target: 9, targetCap: 28, score: 650 },
    normal: { moves: 30, target: 11, targetCap: 34, score: 900 },
    tricky: { moves: 25, target: 14, targetCap: 40, score: 1250 }
  };

  const state = {
    size: 7,
    difficulty: 'normal',
    board: [],
    boardCells: [],
    selected: null,
    score: 0,
    moves: 26,
    target: 13,
    collected: 0,
    level: 1,
    mapContinueTarget: 6,
    busy: false,
    sound: true
  };

  const els = {
    home: document.querySelector('#home-screen'),
    game: document.querySelector('#game-screen'),
    mapScreen: document.querySelector('#map-screen'),
    mapKicker: document.querySelector('#map-kicker'),
    mapTitle: document.querySelector('#map-title'),
    mapIntro: document.querySelector('#map-intro'),
    mapSign: document.querySelector('#map-sign'),
    mapFlowerCount: document.querySelector('#map-flower-count'),
    mapNote: document.querySelector('#map-note'),
    mapProgressRow: document.querySelector('#map-progress-row'),
    board: document.querySelector('#board'),
    size: document.querySelector('#size-select'),
    difficulty: document.querySelector('#difficulty-select'),
    start: document.querySelector('#start-button'),
    continue: document.querySelector('#continue-button'),
    how: document.querySelector('#how-button'),
    share: document.querySelector('#share-button'),
    mapContinue: document.querySelector('#map-continue-button'),
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
    rewardProgress: document.querySelector('#reward-progress'),
    badgeList: document.querySelector('#badge-list'),
    badgeSummary: document.querySelector('#badge-summary'),
    gardenMap: document.querySelector('#garden-map'),
    gardenMapKicker: document.querySelector('#garden-map-kicker'),
    gardenMapTitle: document.querySelector('#garden-map-title'),
    gardenMapSummary: document.querySelector('#garden-map-summary'),
    gardenMapBadge: document.querySelector('#garden-map-badge'),
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
      if (!saved || saved.version !== 1 || !Array.isArray(saved.board)) throw new Error('Invalid save data');
      if (!Number.isInteger(saved.size) || saved.size < 6 || saved.size > 8) throw new Error('Invalid saved board size');
      if (!LEVELS[saved.difficulty]) throw new Error('Invalid saved difficulty');
      if (saved.board.length !== saved.size || !saved.board.every(row => Array.isArray(row) && row.length === saved.size && row.every(tile => TILES.includes(tile)))) throw new Error('Outdated saved board');

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
      els.mapScreen?.classList.add('hidden');
      els.game.classList.remove('hidden');
      renderBadges();
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

  function getUnlockedBadges() {
    try {
      return JSON.parse(localStorage.getItem(BADGES_KEY)) || [];
    } catch (_) {
      return [];
    }
  }

  function saveUnlockedBadges(levels) {
    localStorage.setItem(BADGES_KEY, JSON.stringify([...new Set(levels)].sort((a, b) => a - b)));
    renderBadges();
    renderGardenMap();
  }

  function renderGardenMap() {
    if (!els.gardenMap) return;
    const unlocked = getUnlockedBadges();
    const hasMap = unlocked.some(level => level >= 5);
    const highest = unlocked.length ? Math.max(...unlocked) : 0;
    const mapLevels = [5, 10, 20, 35, 50];

    els.gardenMap.classList.toggle('locked', !hasMap);
    els.gardenMap.querySelectorAll('.mini-node').forEach(node => {
      const level = Number((node.className.match(/node-l(\d+)/) || [])[1]);
      const isUnlocked = unlocked.includes(level) || highest >= level;
      node.classList.toggle('unlocked', isUnlocked);
      node.classList.toggle('locked', !isUnlocked);
    });

    if (hasMap) {
      const nextLevel = mapLevels.find(level => highest < level);
      if (els.gardenMapKicker) els.gardenMapKicker.textContent = 'Garden rewards road';
      if (els.badgeSummary) els.badgeSummary.textContent = nextLevel ? `Garden Map unlocked — reach Level ${nextLevel} for the next garden reward.` : 'Full garden complete — you are a Garden Master!';
      if (els.gardenMapBadge) els.gardenMapBadge.textContent = nextLevel ? `Next L${nextLevel}` : '👑 Done';
    } else {
      if (els.gardenMapKicker) els.gardenMapKicker.textContent = 'Next reward';
      if (els.badgeSummary) els.badgeSummary.textContent = 'Level 5 unlocks your Garden Map.';
      if (els.gardenMapBadge) els.gardenMapBadge.textContent = 'L5';
    }
  }

  function renderBadges() {
    if (!els.badgeList || !els.badgeSummary) return;
    const unlocked = getUnlockedBadges();
    els.badgeList.innerHTML = '';
    MILESTONE_BADGES.forEach(badge => {
      const badgeEl = document.createElement('div');
      const isUnlocked = unlocked.includes(badge.level);
      badgeEl.className = `badge${isUnlocked ? '' : ' locked'}`;
      badgeEl.title = `${badge.name} — Level ${badge.level}`;
      badgeEl.setAttribute('aria-label', `${isUnlocked ? 'Unlocked' : 'Locked'} badge: ${badge.name}, Level ${badge.level}`);
      badgeEl.textContent = isUnlocked ? badge.emoji : '🔒';
      const levelEl = document.createElement('small');
      levelEl.textContent = `L${badge.level}`;
      badgeEl.appendChild(levelEl);
      els.badgeList.appendChild(badgeEl);
    });

    if (unlocked.length) {
      const latest = MILESTONE_BADGES.filter(badge => unlocked.includes(badge.level)).at(-1);
      els.badgeSummary.textContent = `${unlocked.length}/${MILESTONE_BADGES.length} unlocked. Latest: ${latest.emoji} ${latest.name}.`;
    } else {
      els.badgeSummary.textContent = 'Level 5 unlocks your Garden Map.';
    }
    renderGardenMap();
  }

  function nextRewardLevel() {
    return MILESTONE_BADGES.find(badge => state.level < badge.level) || null;
  }

  function updateRewardProgress() {
    if (!els.rewardProgress) return;
    const next = nextRewardLevel();
    if (next) {
      els.rewardProgress.textContent = `Next reward: ${next.emoji} ${next.name} at Level ${next.level}`;
    } else {
      els.rewardProgress.textContent = 'All milestone badges unlocked — you are a Garden Master!';
    }
  }

  function launchConfetti() {
    const pieces = ['🌸', '🌼', '✨', '🍀', '🦋', '🌱'];
    for (let i = 0; i < 18; i++) {
      const piece = document.createElement('span');
      piece.className = 'confetti-piece';
      piece.textContent = pieces[rand(pieces.length)];
      piece.style.left = `${rand(100)}vw`;
      piece.style.setProperty('--drift', `${rand(120) - 60}px`);
      piece.style.setProperty('--fall-duration', `${1400 + rand(1300)}ms`);
      piece.style.setProperty('--confetti-size', `${18 + rand(16)}px`);
      document.body.appendChild(piece);
      setTimeout(() => piece.remove(), 3000);
    }
  }

  function unlockMilestoneIfNeeded(completedLevel) {
    const badge = MILESTONE_BADGES.find(item => item.level === completedLevel);
    if (!badge) return false;

    const unlocked = getUnlockedBadges();
    if (unlocked.includes(badge.level)) return false;

    saveUnlockedBadges([...unlocked, badge.level]);
    launchConfetti();
    makeAudio(820, 0.18);
    return badge;
  }

  function showGardenMap(completedLevel) {
    const nextLevel = completedLevel + 1;
    state.mapContinueTarget = nextLevel;
    const plotCount = Math.min(5, Math.max(1, Math.floor(completedLevel / 5)));

    if (els.mapKicker) els.mapKicker.textContent = 'Garden reward';
    if (els.mapTitle) els.mapTitle.textContent = completedLevel === 5 ? 'Your Flowers Bloomed!' : 'Your Garden Bloomed More!';
    if (els.mapIntro) els.mapIntro.textContent = `You collected ${state.target} pink flowers. They are now growing in your garden.`;
    if (els.mapSign) els.mapSign.textContent = '';
    if (els.mapFlowerCount) els.mapFlowerCount.textContent = `🌸 +${state.target}`;
    if (els.mapNote) els.mapNote.textContent = plotCount >= 4 ? 'Butterflies and bees love your blooming garden.' : 'Collect more flowers to attract bees, butterflies, and surprises.';
    if (els.mapContinue) els.mapContinue.textContent = `Continue to Level ${nextLevel}`;

    els.mapScreen?.style.setProperty('--plot-count', plotCount);
    els.mapScreen?.querySelectorAll('.garden-plot').forEach((plot, index) => {
      const unlocked = index < plotCount;
      plot.classList.toggle('locked-plot', !unlocked);
      plot.innerHTML = unlocked ? '<span></span>' : '?';
    });
    els.mapProgressRow?.querySelectorAll('[data-map-level]').forEach(node => {
      const level = Number(node.dataset.mapLevel);
      node.classList.toggle('done', level <= completedLevel);
    });

    els.game.classList.add('hidden');
    els.home.classList.add('hidden');
    els.mapScreen?.classList.remove('hidden');
    saveGame();
  }

  async function shareAchievement(badge) {
    const shareData = {
      title: `${badge.name} unlocked in Garden Match!`,
      text: `I reached Level ${badge.level} in Garden Match and unlocked the ${badge.emoji} ${badge.name} badge!`,
      url: window.location.origin + window.location.pathname.replace(/[^/]*$/, '')
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        return;
      }
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      showDialog('Achievement copied!', 'Your achievement message was copied. Paste it anywhere to share your progress.', 'OK');
    } catch (error) {
      if (error && error.name === 'AbortError') return;
      showDialog('Share your achievement', `${shareData.text}\n${shareData.url}`, 'OK');
    }
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
    state.moves = Math.max(22, base.moves - Math.floor((state.level - 1) / 4) + (state.size === 8 ? 4 : state.size === 6 ? -1 : 0));
    state.target = Math.min(base.targetCap + (state.size === 8 ? 3 : state.size === 6 ? -1 : 0), base.target + Math.floor((state.level - 1) * 0.6) + (state.size === 8 ? 3 : state.size === 6 ? -1 : 0));
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

  function ensureBoardCells() {
    const expected = state.size * state.size;
    if (state.boardCells.length === expected) return;

    els.board.replaceChildren();
    state.boardCells = [];
    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) {
        const button = document.createElement('button');
        button.type = 'button';
        button.dataset.row = row;
        button.dataset.col = col;
        button.addEventListener('click', () => onTileTap(row, col));
        els.board.appendChild(button);
        state.boardCells.push(button);
      }
    }
  }

  function setSelectedTile(nextSelected) {
    const prev = state.selected;
    state.selected = nextSelected;
    if (prev) {
      const prevTile = state.boardCells[prev.row * state.size + prev.col];
      if (prevTile) prevTile.classList.remove('selected');
    }
    if (nextSelected) {
      const nextTile = state.boardCells[nextSelected.row * state.size + nextSelected.col];
      if (nextTile) nextTile.classList.add('selected');
    }
  }

  function render() {
    document.documentElement.style.setProperty('--board-size', state.size);
    els.board.style.setProperty('--board-size', state.size);
    ensureBoardCells();

    for (let row = 0; row < state.size; row++) {
      for (let col = 0; col < state.size; col++) {
        const button = state.boardCells[row * state.size + col];
        const tileValue = get(row, col);
        button.className = `tile tile-${tileValue}${state.selected && state.selected.row === row && state.selected.col === col ? ' selected' : ''}`;
        button.dataset.tile = tileValue;
        button.setAttribute('aria-label', `${TILE_LABELS[tileValue] || 'garden'} tile at row ${row + 1}, column ${col + 1}`);
      }
    }
    updateHud();
  }

  function updateHud() {
    els.score.textContent = state.score.toLocaleString();
    els.moves.textContent = state.moves;
    els.target.textContent = `${state.collected} / ${state.target}`;
    els.level.textContent = state.level;
    els.goal.textContent = `Collect ${state.target} ${GOAL_NAME}`;
    updateRewardProgress();
  }

  async function onTileTap(row, col) {
    if (state.busy) return;
    const current = { row, col };
    if (!state.selected) {
      setSelectedTile(current);
      makeAudio(420, 0.035);
      return;
    }

    if (state.selected.row === row && state.selected.col === col) {
      setSelectedTile(null);
      return;
    }

    if (!isAdjacent(state.selected, current)) {
      setSelectedTile(current);
      makeAudio(400, 0.035);
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
      const [row, col] = id.split('-').map(Number);
      const tile = state.boardCells[row * state.size + col];
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
      const completedLevel = state.level;
      const unlockedMilestone = unlockMilestoneIfNeeded(completedLevel);
      if (unlockedMilestone) {
        if (completedLevel % 5 === 0) {
          showGardenMap(completedLevel);
          return;
        }
        showDialog(
          `${unlockedMilestone.emoji} ${unlockedMilestone.name} Unlocked!`,
          `${unlockedMilestone.message}\n\nYou reached Level ${unlockedMilestone.level}. Keep growing your badge collection!`,
          'Continue',
          () => {
            const encouragement = LEVEL_COMPLETE_MESSAGES[(completedLevel - 1) % LEVEL_COMPLETE_MESSAGES.length];
            showDialog('Wonderful garden!', `${encouragement}\n\nYou completed Level ${completedLevel}!\nScore: ${state.score.toLocaleString()}\n\nReady for the next level?`, 'Next Level', () => {
              state.level++;
              startGame();
            });
          }
        );
        return;
      }
      if (completedLevel % 5 === 0) {
        showGardenMap(completedLevel);
        return;
      }
      const encouragement = LEVEL_COMPLETE_MESSAGES[(completedLevel - 1) % LEVEL_COMPLETE_MESSAGES.length];
      showDialog('Wonderful garden!', `${encouragement}\n\nYou completed Level ${completedLevel}!\nScore: ${state.score.toLocaleString()}\n\nReady for the next level?`, 'Next Level', () => {
        state.level++;
        startGame();
      });
      return;
    }
    if (state.moves <= 0) {
      showDialog('Almost there!', `You collected ${state.collected} of ${state.target} ${GOAL_NAME}.\nTry again with a fresh board.`, 'Try Again', () => startGame());
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
    for (const pos of move) {
      const tile = state.boardCells[pos.row * state.size + pos.col];
      if (tile) tile.classList.add('hint');
    }
  }

  function startGame() {
    configureFromInputs();
    createBoard();
    els.home.classList.add('hidden');
    els.mapScreen?.classList.add('hidden');
    els.game.classList.remove('hidden');
    render();
    saveGame();
  }

  async function shareGame() {
    const shareData = {
      title: 'Garden Match',
      text: 'Play Garden Match with me — collect pink flowers, unlock badges, and beat my level!',
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
    'Tap one tile, then tap a neighbor to swap them.\n\nMatch 3 or more of the same garden tile in a row or column.\n\nYour goal tile is the pink flower with the orange center. Collect enough pink flowers before your moves run out. Use Hint if you get stuck — this game is meant to be kind.',
    'Got it'
  ));
  els.share.addEventListener('click', shareGame);
  if (els.mapContinue) {
    els.mapContinue.addEventListener('click', () => {
      state.level = state.mapContinueTarget || (state.level + 1);
      els.mapScreen.classList.add('hidden');
      startGame();
    });
  }
  els.back.addEventListener('click', () => { els.game.classList.add('hidden'); els.mapScreen?.classList.add('hidden'); els.home.classList.remove('hidden'); renderBadges(); updateContinueButton(); });
  els.sound.addEventListener('click', () => { state.sound = !state.sound; els.sound.textContent = state.sound ? '🔊' : '🔇'; });
  els.hint.addEventListener('click', showHint);
  els.shuffle.addEventListener('click', () => !state.busy && shuffleBoard(true));
  els.restart.addEventListener('click', () => !state.busy && startGame());

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
  }

  if (location.hostname === '127.0.0.1' || location.hostname === 'localhost') {
    window.__gardenMatchDebug = { showGardenMap, state };
  }

  updateContinueButton();
  renderBadges();
})();
