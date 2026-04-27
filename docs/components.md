# Components

## Component Tree

```
App
├── LevelSelect              ← shown on start screen
└── Game screen
    ├── HUD                  ← top bar: level name, moves, undo, reset
    ├── GameBoard            ← 8x8 grid
    │   └── Cell (x64)       ← one tile per grid cell
    ├── DPad                 ← on-screen controls (below board)
    └── WinModal             ← overlay when all boxes on targets
```

---

## Component Responsibilities

### `App`
- Manages which screen is active: `levelSelect` | `game`
- Passes selected level into game context
- Renders `LevelSelect` or game screen based on state

### `LevelSelect`
- Lists all curated levels with name and difficulty
- Option to start a random level with a box-count selector
- On select: loads level into context, switches App to game screen

### `HUD`
- Displays: current level name, move counter
- Buttons: **Undo** (pop history), **Reset** (reload initial level state), **Back** (return to LevelSelect)
- Reads from `GameContext`

### `GameBoard`
- Receives the 8×8 grid (array of 8 strings, each 8 chars)
- Renders an 8×8 CSS grid of `<Cell>` components
- Maps cell character to cell type prop

### `Cell`
- Props: `type` — one of `wall | floor | target | box | boxOnTarget | player | playerOnTarget`
- Renders the correct visual/emoji for each type
- No logic — pure display component

### `DPad`
- Four buttons: ↑ ↓ ← →
- On click: calls move handler from `useGameEngine`
- Styled as a cross/D-pad layout

### `WinModal`
- Shown when `isWon === true`
- Displays move count for the completed level
- Buttons: **Next Level**, **Play Again**, **Level Select**

---

## Data Flow
```
GameContext (state + dispatch)
    ↓
useGameEngine (exposes: state, move, undo, reset, loadLevel)
    ↓
HUD + DPad + WinModal  ← read state, call actions
GameBoard → Cell       ← read grid from state, pure render
useKeyboard            ← calls move() on keydown, no render
```
