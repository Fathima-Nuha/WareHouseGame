# Project Structure

```
employee-board-games/
├── .github/
│   └── copilot-instructions.md   # Copilot project-wide instructions
├── docs/
│   ├── plan.md                   # Game design and feature decisions
│   ├── structure.md              # This file — folder layout
│   ├── components.md             # React component tree and responsibilities
│   ├── state.md                  # State shape, data flow, undo history
│   └── phases.md                 # Development phases and milestones
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── GameBoard/
│   │   │   ├── GameBoard.jsx     # Renders 8x8 grid from state
│   │   │   └── GameBoard.module.css
│   │   ├── Cell/
│   │   │   ├── Cell.jsx          # Single tile: wall, floor, box, target, player
│   │   │   └── Cell.module.css
│   │   ├── DPad/
│   │   │   ├── DPad.jsx          # On-screen directional pad
│   │   │   └── DPad.module.css
│   │   ├── HUD/
│   │   │   ├── HUD.jsx           # Move counter, level name, Undo + Reset buttons
│   │   │   └── HUD.module.css
│   │   ├── LevelSelect/
│   │   │   ├── LevelSelect.jsx   # Choose curated level or random with box count
│   │   │   └── LevelSelect.module.css
│   │   └── WinModal/
│   │       ├── WinModal.jsx      # Victory screen — move count, next/replay
│   │       └── WinModal.module.css
│   ├── context/
│   │   └── GameContext.jsx       # React Context + useReducer for global game state
│   ├── hooks/
│   │   ├── useGameEngine.js      # Core game logic hook — exposes state + actions
│   │   └── useKeyboard.js        # Arrow/WASD key listener → dispatch move
│   ├── levels/
│   │   └── curatedLevels.js      # Array of hand-crafted 8x8 level definitions
│   ├── utils/
│   │   ├── sokoban.js            # Pure functions: movePlayer, isValidMove, isWon
│   │   └── levelGenerator.js     # Random 8x8 level generator
│   ├── App.jsx                   # Screen routing: LevelSelect → Game → WinModal
│   ├── App.module.css
│   └── main.jsx                  # Vite entry point
├── index.html
├── vite.config.js
└── package.json
```

## Key Conventions
- One component per folder — folder name = component name = file name
- Styles always in `.module.css` co-located with component
- Pure utility functions in `src/utils/` — no React imports allowed there
- Hooks in `src/hooks/` — always prefixed with `use`
