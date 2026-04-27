# Development Phases

## Phase 0 — Scaffolding ✅
- [x] `.github/copilot-instructions.md`
- [x] `docs/plan.md`
- [x] `docs/structure.md`
- [x] `docs/components.md`
- [x] `docs/state.md`
- [x] `docs/phases.md`

---

## Phase 1 — Bootstrap ✅
- [x] Initialize Vite + React project inside `employee-board-games/`
- [x] Clean up default Vite template (remove boilerplate)
- [x] Set up folder structure: `src/components/`, `src/hooks/`, `src/utils/`, `src/levels/`, `src/context/`
- [x] Basic `App.jsx` shell

---

## Phase 2 — Core Game Engine ✅
- [x] `src/utils/sokoban.js` — pure functions:
  - `isValidMove(grid, playerPos, dir)`
  - `movePlayer(grid, playerPos, dir)` → returns `{ grid, player }`
  - `isWon(grid, targets)`
  - `extractTargets(grid)` → returns `[{row, col}]`
- [x] `src/context/GameContext.jsx` — Context + `useReducer` with all actions
- [x] `src/hooks/useGameEngine.js` — wraps context, exposes `{ state, move, undo, reset, loadLevel }`

---

## Phase 3 — Rendering ✅
- [x] `src/components/Cell/Cell.jsx` — renders one tile by type
- [x] `src/components/GameBoard/GameBoard.jsx` — renders 8×8 CSS grid of Cells
- [x] Verify grid renders correctly with a hardcoded test level

---

## Phase 4 — Curated Levels ✅
- [x] `src/levels/curatedLevels.js` — 5 hand-crafted 8×8 levels
- [x] `src/components/LevelSelect/LevelSelect.jsx` — list curated levels, start game
- [x] Wire LevelSelect → App screen transition

---

## Phase 5 — Controls ✅
- [x] `src/hooks/useKeyboard.js` — keydown listener for arrows + WASD
- [x] `src/components/DPad/DPad.jsx` — on-screen D-pad buttons

---

## Phase 6 — HUD ✅
- [x] `src/components/HUD/HUD.jsx` — move counter, level name, Undo + Reset + Back buttons

---

## Phase 7 — Win Flow ✅
- [x] `src/components/WinModal/WinModal.jsx` — victory overlay
- [x] Wire win detection → show modal → next level / replay / level select

---

## Phase 8 — Random Level Generator
- [ ] `src/utils/levelGenerator.js` — generate valid 8×8 Sokoban grid
- [ ] Add random level option to `LevelSelect`

---

## Phase 9 — Theme & Polish
- [ ] Warehouse visual theme (wooden crates, floor tiles, warehouse keeper sprite)
- [ ] CSS animations: box push slide, win celebration
- [ ] Responsive layout for mobile (DPad prominent on small screens)
- [ ] Optional: sound effects
