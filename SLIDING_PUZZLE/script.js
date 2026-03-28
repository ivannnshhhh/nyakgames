(function () {
  "use strict";

  const LEVELS = {
    easy: 3,
    medium: 4,
    hard: 5,
  };

  const SHUFFLE_MOVES = {
    easy: 300,
    medium: 800,
    hard: 1500,
  };

  // 9 images: indices 0–2 Easy, 3–5 Medium, 6–8 Hard. One is chosen randomly per level.
  const PUZZLE_IMAGES = [
    "./images/first.jpg",
    "./images/second.jpg",
    "./images/third.jpg",
    "./images/fourth.jpg",
    "./images/fifth.jpg",
    "./images/sixth.jpg",
    "./images/seventh.jpg",
    "./images/eighth.jpg",
    "./images/ninth.jpg",
  ];

  const IMAGE_INDEX_BY_LEVEL = {
    easy: [0, 1, 2],
    medium: [3, 4, 5],
    hard: [6, 7, 8],
  };

  let state = {
    level: "easy",
    size: 4,
    grid: [],
    emptyIndex: 0,
    moves: 0,
    currentImageUrl: "",
    referenceVisible: true,
  };

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => el.querySelectorAll(sel);

  function getNeighbors(index, size) {
    const n = size;
    const row = Math.floor(index / n);
    const col = index % n;
    const neighbors = [];
    if (row > 0) neighbors.push(index - n);
    if (row < n - 1) neighbors.push(index + n);
    if (col > 0) neighbors.push(index - 1);
    if (col < n - 1) neighbors.push(index + 1);
    return neighbors;
  }

  function createSolvablePuzzle(size) {
    const n = size * size;
    const grid = [];
    for (let i = 1; i < n; i++) grid.push(i);
    grid.push(0);
    let emptyIndex = n - 1;
    const movesCount = SHUFFLE_MOVES[state.level] || 500;
    for (let i = 0; i < movesCount; i++) {
      const neighbors = getNeighbors(emptyIndex, size);
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      [grid[emptyIndex], grid[next]] = [grid[next], grid[emptyIndex]];
      emptyIndex = next;
    }
    return { grid, emptyIndex };
  }

  function startNewGame() {
    state.size = LEVELS[state.level];
    const indices = IMAGE_INDEX_BY_LEVEL[state.level];
    state.currentImageUrl = PUZZLE_IMAGES[indices[Math.floor(Math.random() * indices.length)]];
    const { grid, emptyIndex } = createSolvablePuzzle(state.size);
    state.grid = grid;
    state.emptyIndex = emptyIndex;
    state.moves = 0;
    render();
    updateReferenceImage();
    updateGridOverlay();
    $("#winOverlay").classList.add("hidden");
  }

  function isAdjacentToEmpty(index) {
    return getNeighbors(state.emptyIndex, state.size).includes(index);
  }

  function moveTile(index) {
    if (!isAdjacentToEmpty(index)) return;
    const empty = state.emptyIndex;
    
    // Add sliding animation class
    const tile = $(`.tile[data-index="${index}"]`);
    if (tile) {
      tile.classList.add("sliding");
      setTimeout(() => tile.classList.remove("sliding"), 150);
    }
    
    [state.grid[empty], state.grid[index]] = [state.grid[index], state.grid[empty]];
    state.emptyIndex = index;
    state.moves += 1;
    render();
    if (checkWin()) {
      $("#winMoves").textContent = "Moves: " + state.moves;
      $("#winOverlay").classList.remove("hidden");
    }
  }

  function checkWin() {
    const n = state.grid.length;
    for (let i = 0; i < n - 1; i++) {
      if (state.grid[i] !== i + 1) return false;
    }
    return state.grid[n - 1] === 0;
  }

  function render() {
    const board = $("#board");
    const size = state.size;
    board.className = "board size-" + size;
    board.innerHTML = "";
    const n = size * size;
    for (let i = 0; i < n; i++) {
      const value = state.grid[i];
      const tile = document.createElement("div");
      tile.className = "tile" + (value === 0 ? " empty" : " tile-image");
      tile.dataset.index = i;
      tile.setAttribute("role", "gridcell");
      if (value !== 0) {
        const pieceIndex = value - 1;
        const row = Math.floor(pieceIndex / size);
        const col = pieceIndex % size;
        tile.style.backgroundImage = "url(" + state.currentImageUrl + ")";
        tile.style.backgroundSize = size * 100 + "% " + size * 100 + "%";
        tile.style.backgroundRepeat = "no-repeat";
        if (size > 1) {
          const xPct = (col / (size - 1)) * 100;
          const yPct = (row / (size - 1)) * 100;
          tile.style.backgroundPosition = xPct + "% " + yPct + "%";
        } else {
          tile.style.backgroundPosition = "0% 0%";
        }
        tile.addEventListener("click", () => moveTile(i));
      }
      board.appendChild(tile);
    }
    $("#moves").textContent = "Moves: " + state.moves;
  }

  function updateReferenceImage() {
    const refImage = $("#refImage");
    if (refImage && state.currentImageUrl) {
      refImage.src = state.currentImageUrl;
    }
  }

  function updateGridOverlay() {
    const overlay = $("#refGridOverlay");
    const size = state.size;
    if (!overlay) return;
    
    overlay.innerHTML = "";
    
    // Create grid lines
    const cellSize = 100 / size;
    
    // Vertical lines
    for (let i = 1; i < size; i++) {
      const vLine = document.createElement("div");
      vLine.style.cssText = `
        position: absolute;
        left: ${i * cellSize}%;
        top: 0;
        width: 1px;
        height: 100%;
        background: rgba(255, 255, 255, 0.3);
      `;
      overlay.appendChild(vLine);
    }
    
    // Horizontal lines
    for (let i = 1; i < size; i++) {
      const hLine = document.createElement("div");
      hLine.style.cssText = `
        position: absolute;
        left: 0;
        top: ${i * cellSize}%;
        width: 100%;
        height: 1px;
        background: rgba(255, 255, 255, 0.3);
      `;
      overlay.appendChild(hLine);
    }
  }

  function toggleReferenceImage() {
    state.referenceVisible = !state.referenceVisible;
    const container = $(".reference-image-container");
    if (container) {
      if (state.referenceVisible) {
        container.classList.remove("hidden");
      } else {
        container.classList.add("hidden");
      }
    }
  }

  function startGame(level) {
    state.level = level;
    state.size = LEVELS[level];
    $("#levelScreen").classList.add("hidden");
    $("#gameScreen").classList.remove("hidden");
    $("#levelBadge").textContent = level.charAt(0).toUpperCase() + level.slice(1);
    startNewGame();
  }

  function goToLevelScreen() {
    $("#gameScreen").classList.add("hidden");
    $("#winOverlay").classList.add("hidden");
    $("#levelScreen").classList.remove("hidden");
  }

  document.addEventListener("DOMContentLoaded", () => {
    $$(".level-btn").forEach((btn) => {
      btn.addEventListener("click", () => startGame(btn.dataset.level));
    });
    $("#newGameBtn").addEventListener("click", startNewGame);
    $("#changeLevelBtn").addEventListener("click", goToLevelScreen);
    $("#playAgainBtn").addEventListener("click", () => {
      $("#winOverlay").classList.add("hidden");
      startNewGame();
    });
    $("#changeLevelFromWinBtn").addEventListener("click", () => {
      $("#winOverlay").classList.add("hidden");
      goToLevelScreen();
    });
    $("#helpBtnLevel").addEventListener("click", showHelp);
    $("#helpBtnGame").addEventListener("click", showHelp);
    $("#helpClose").addEventListener("click", hideHelp);
    $("#helpOverlay").addEventListener("click", (e) => {
      if (e.target.id === "helpOverlay") hideHelp();
    });
    $("#toggleRefBtn").addEventListener("click", toggleReferenceImage);
    
    // Keyboard support for closing modals
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        hideHelp();
        if (!$("#winOverlay").classList.contains("hidden")) {
          $("#winOverlay").classList.add("hidden");
        }
      }
    });
  });

  function showHelp() {
    $("#helpOverlay").classList.remove("hidden");
    $("#helpOverlay").setAttribute("aria-hidden", "false");
  }

  function hideHelp() {
    $("#helpOverlay").classList.add("hidden");
    $("#helpOverlay").setAttribute("aria-hidden", "true");
  }
})();
