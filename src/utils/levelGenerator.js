/**
 * Random 8×8 Sokoban level generator.
 *
 * Strategy:
 *  1. Fill border with walls, carve a random interior maze.
 *  2. Find the largest contiguous floor region via flood-fill.
 *  3. Place targets, boxes, and the player inside that region.
 *  4. Validate that every box can reach at least one target via BFS
 *     (simple reachability — boxes push in one axis at a time).
 *  5. Retry up to MAX_ATTEMPTS times; throw if genuinely impossible.
 */

const ROWS = 8
const COLS = 8
const WALL_CHANCE = 0.28   // ~28 % of interior cells become walls
const MAX_ATTEMPTS = 200

// ── helpers ──────────────────────────────────────────────────────────────────

function blankGrid() {
  return Array.from({ length: ROWS }, (_, r) =>
    Array.from({ length: COLS }, (_, c) =>
      r === 0 || r === ROWS - 1 || c === 0 || c === COLS - 1 ? '#' : ' '
    )
  )
}

function gridToStrings(g) {
  return g.map((row) => row.join(''))
}

/** Fisher-Yates shuffle (in-place). */
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]

/** Flood-fill from (r,c); returns list of floor cells in that component. */
function floodFill(grid, startR, startC) {
  const visited = new Set()
  const queue = [[startR, startC]]
  const cells = []
  while (queue.length) {
    const [r, c] = queue.pop()
    const key = `${r},${c}`
    if (visited.has(key)) continue
    visited.add(key)
    if (grid[r][c] !== ' ') continue
    cells.push([r, c])
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) queue.push([nr, nc])
    }
  }
  return cells
}

/** Largest connected floor region. */
function largestFloorRegion(grid) {
  const visited = new Set()
  let best = []
  for (let r = 1; r < ROWS - 1; r++) {
    for (let c = 1; c < COLS - 1; c++) {
      const key = `${r},${c}`
      if (grid[r][c] === ' ' && !visited.has(key)) {
        const region = floodFill(grid, r, c)
        region.forEach(([rr, cc]) => visited.add(`${rr},${cc}`))
        if (region.length > best.length) best = region
      }
    }
  }
  return best
}

/**
 * Simple box-reachability check via BFS of player positions.
 * Returns true if a box at (br,bc) can be pushed onto any target in `targets`.
 * Ignores other boxes (conservative — may pass unsolvable levels occasionally,
 * but never reject a solvable one).
 */
function boxCanReachATarget(grid, br, bc, targets) {
  const targetSet = new Set(targets.map(([r, c]) => `${r},${c}`))
  // BFS over positions the box can occupy when pushed by the player.
  const visited = new Set([`${br},${bc}`])
  const queue = [[br, bc]]
  while (queue.length) {
    const [r, c] = queue.shift()
    if (targetSet.has(`${r},${c}`)) return true
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc       // box would move here
      const pr = r - dr, pc = c - dc       // player must stand here to push
      if (
        nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS &&
        pr >= 0 && pr < ROWS && pc >= 0 && pc < COLS &&
        grid[nr][nc] !== '#' &&
        grid[pr][pc] !== '#' &&
        !visited.has(`${nr},${nc}`)
      ) {
        visited.add(`${nr},${nc}`)
        queue.push([nr, nc])
      }
    }
  }
  return false
}

/**
 * Simple deadlock check: a floor cell is a "corner deadlock" if both its
 * horizontal and vertical neighbours are walls. A box placed there with no
 * target can never be moved to a target.
 */
function isDeadlockCell(grid, r, c) {
  const blockedV = grid[r-1][c] === '#' || grid[r+1][c] === '#'
  const blockedH = grid[r][c-1] === '#' || grid[r][c+1] === '#'
  return blockedV && blockedH
}

// ── main export ───────────────────────────────────────────────────────────────

let _counter = 0

/**
 * Generate a random 8×8 Sokoban level.
 *
 * @param {number} boxCount  Number of boxes/targets (1–4).
 * @returns {{ id: string, name: string, type: 'random', grid: string[] }}
 */
export function generateLevel(boxCount = 2) {
  const n = Math.max(1, Math.min(4, boxCount))

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    // 1. Build grid with random interior walls
    const grid = blankGrid()
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (Math.random() < WALL_CHANCE) grid[r][c] = '#'
      }
    }

    // 2. Find largest floor region
    const region = largestFloorRegion(grid)
    // Need: n boxes + n targets + 1 player = 2n+1 distinct cells
    if (region.length < 2 * n + 1) continue

    // 3. Shuffle region and pick placements
    shuffle(region)

    const targetCells = region.slice(0, n)
    const boxCells    = region.slice(n, 2 * n)
    const playerCell  = region[2 * n]

    // 4. Reject boxes sitting on deadlock cells that aren't targets
    const targetSet = new Set(targetCells.map(([r, c]) => `${r},${c}`))
    const hasDeadlockedBox = boxCells.some(([r, c]) => {
      if (targetSet.has(`${r},${c}`)) return false   // box already on target — fine
      return isDeadlockCell(grid, r, c)
    })
    if (hasDeadlockedBox) continue

    // 5. BFS reachability: each box must reach at least one target
    const reachable = boxCells.every(([br, bc]) =>
      boxCanReachATarget(grid, br, bc, targetCells)
    )
    if (!reachable) continue

    // 6. Assemble final grid strings
    // Mark targets
    targetCells.forEach(([r, c]) => { grid[r][c] = '.' })
    // Mark boxes (may land on a target → '*')
    boxCells.forEach(([r, c]) => { grid[r][c] = grid[r][c] === '.' ? '*' : '$' })
    // Mark player (may land on a target → '+')
    const [pr, pc] = playerCell
    grid[pr][pc] = grid[pr][pc] === '.' ? '+' : '@'

    _counter++
    return {
      id: `random-${_counter}`,
      name: `Random — ${n} Box${n > 1 ? 'es' : ''}`,
      type: 'random',
      grid: gridToStrings(grid),
    }
  }

  throw new Error(`Could not generate a valid level after ${MAX_ATTEMPTS} attempts.`)
}
