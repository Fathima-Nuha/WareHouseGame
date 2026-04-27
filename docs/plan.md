# Game Plan — Warehouse Keeper

## Concept
Sokoban-style puzzle game. The player is a warehouse keeper pushing crates onto marked floor targets.  
Shift ends when all boxes are on their spots. Think before you push — wrong moves may be irreversible.

## Grid
- Fixed **8×8** grid for all levels (curated and randomly generated)
- Border cells are always walls

## Core Rules
1. Player cannot move through walls (`#`) or outside the grid
2. Player can push one box at a time — cannot push two boxes in a row
3. A box cannot be pulled — only pushed
4. Level is won when all boxes (`$`) are on targets (`.`) — i.e., all cells become `*`
5. Some moves are irreversible (box pushed into a corner with no target) — undo mitigates this

## Controls
- **Keyboard**: Arrow keys + WASD
- **On-screen**: D-pad buttons (mobile-friendly)

## Levels
- **Curated levels**: Hand-crafted, progressively harder (at least 5 to start)
- **Random levels**: Generated 8×8 grids with N boxes and N targets (player selects N)

## Undo
- Unlimited undo — pops previous state from history stack
- Allows recovery from irreversible-looking moves

## Winning
- Win modal appears when level is complete
- Shows move count
- Options: next level, replay, go to level select
