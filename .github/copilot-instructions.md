# Copilot Instructions — Warehouse Keeper (Sokoban Puzzle Game)

## Project Overview
A Sokoban-style puzzle game built with **Vite + React**.  
The player is a warehouse keeper who pushes crates onto marked floor targets on an **8×8 grid**.

## Tech Stack
- **Framework**: React 18 (Vite)
- **Styling**: CSS Modules (no CSS-in-JS, no Tailwind)
- **State**: React Context + `useReducer` (no Redux)
- **Testing**: Vitest
- **Language**: JavaScript (no TypeScript unless asked)

## Core Rules (enforce these in all game logic)
1. Player cannot move through walls (`#`) or out-of-bounds — always validate before state mutation
2. All moves must pass `isValidMove()` before being applied
3. Some moves are irreversible (box into deadlock corner) — undo history stack is always maintained
4. Make sure each puzzle created is solvable.

## Theme and Visuals
1. Keep theme of the game consistent with colors and visuals throughout the game.
2. Give proper UI/UX to the game to make it more engaging and fun to play.
3. Best practice of UI/UX to be kept.
4. Make UI responsive and mobile-friendly. 
## Cell Encoding (Sokoban standard)
| Symbol | Meaning |
|--------|---------|
| `#` | Wall |
| ` ` | Floor |
| `@` | Player |
| `$` | Box / Crate |
| `.` | Target spot |
| `*` | Box on target |
| `+` | Player on target |

## Project Docs
All design decisions are documented in `docs/`. Read these before making structural changes:
- [`docs/plan.md`](../docs/plan.md) — game design and feature decisions
- [`docs/structure.md`](../docs/structure.md) — folder and file layout
- [`docs/components.md`](../docs/components.md) — React component tree and responsibilities
- [`docs/state.md`](../docs/state.md) — state shape, game data flow, undo history
- [`docs/phases.md`](../docs/phases.md) — development phases and milestones

## Coding Conventions
- One component per file; file and component name must match
- Component folders: `src/components/ComponentName/ComponentName.jsx` + `ComponentName.module.css`
- Utility functions live in `src/utils/` — pure functions only, no React imports
- Custom hooks live in `src/hooks/` — prefix with `use`
- Level data lives in `src/levels/curatedLevels.js`
- Do not mutate state directly — always return new objects/arrays in reducers
- Grid is always represented as a flat `string[]` of 8-character rows (length 8, 8 rows)

## What NOT to do
- Do not install additional state management libraries
- Do not use `any` style overrides — use CSS Modules only
- Do not skip move validation — never update grid state without calling `isValidMove()` first
