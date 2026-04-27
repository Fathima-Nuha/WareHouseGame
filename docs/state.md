# State

## Game State Shape

```js
{
  // Current grid — array of 8 strings, each exactly 8 characters
  grid: string[],

  // Player position
  player: { row: number, col: number },

  // All target positions (never change during a level)
  targets: Array<{ row: number, col: number }>,

  // Move counter for the current level attempt
  moves: number,

  // Undo history — array of previous { grid, player, moves } snapshots
  history: Array<{ grid: string[], player: { row, col }, moves: number }>,

  // Which level is loaded
  currentLevel: {
    id: number | 'random',
    name: string,
    type: 'curated' | 'random',
  },

  // Win condition
  isWon: boolean,
}
```

---

## Cell Encoding (Sokoban Standard)

| Char | Meaning             |
|------|---------------------|
| `#`  | Wall                |
| ` `  | Floor (empty)       |
| `@`  | Player on floor     |
| `$`  | Box on floor        |
| `.`  | Target spot (empty) |
| `*`  | Box on target       |
| `+`  | Player on target    |

The grid encodes everything — player and box positions are derived from scanning the grid.  
`targets` is extracted once on level load and cached (`.` and `*` cells).

---

## Actions (dispatched via useGameEngine)

| Action          | Payload          | Description                                  |
|-----------------|------------------|----------------------------------------------|
| `MOVE`          | `dir: 'up' \| 'down' \| 'left' \| 'right'` | Attempt a player move — validated before applying |
| `UNDO`          | —                | Pop last snapshot from `history` and restore |
| `RESET`         | —                | Reload the initial level state, clear history |
| `LOAD_LEVEL`    | `level` object   | Load a new level, reset all state             |

---

## Move Validation Logic (in `sokoban.js`)

```
isValidMove(grid, fromPos, dir):
  1. Compute newPos = fromPos + dir delta
  2. If newPos is out of bounds → invalid
  3. If grid[newPos] === '#' → invalid (wall)
  4. If grid[newPos] is a box ('$' or '*'):
       Compute boxNewPos = newPos + dir delta
       If boxNewPos out of bounds → invalid
       If grid[boxNewPos] === '#' → invalid
       If grid[boxNewPos] is another box → invalid
  5. Otherwise → valid
```

---

## Undo Stack
- Before every valid move, push `{ grid, player, moves }` to `history`
- On UNDO: pop last entry and restore; `isWon` is recomputed from restored grid
- On RESET or LOAD_LEVEL: history is cleared

---

## Win Detection
`isWon` = every target position `{ row, col }` in `targets` has grid cell `*` (box on target)
