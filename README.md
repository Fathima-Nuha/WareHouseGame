# 🏭 Warehouse Keeper

A Sokoban-style puzzle game built with React + Vite.

<a href="https://warehouse-puzzle-game.netlify.app/" target="_blank" rel="noopener noreferrer"><strong>▶ Play Live</strong></a>

## About

Push every crate onto its marked target spot — but think before you push, because wrong moves may be irreversible. Features per-player progress tracking, global best scores with attribution, and a procedural level generator that keeps the challenge going beyond the curated levels.

## Features

- 5 hand-crafted curated levels (Beginner → Expert)
- Unlimited procedurally generated levels beyond level 5
- Per-player progress saved locally (no account needed)
- Global best scores with player attribution shown on the map
- Undo support — unlimited
- Background music & sound effects
- Mobile-responsive road map with adaptive layout
- Character selection
- **PWA** — installable on Android & iOS (works offline, home screen shortcut)

## Tech Stack

- React 18 + Vite
- CSS Modules
- localStorage for persistence (no backend)
- `vite-plugin-pwa` — service worker + web manifest for installability

## Running Locally

```bash
cd employee-board-games
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Install as Mobile App

Visit the live URL on your phone browser, tap **Share → Add to Home Screen** (iOS) or **Install App** (Android Chrome). It runs fullscreen like a native app and works offline.

