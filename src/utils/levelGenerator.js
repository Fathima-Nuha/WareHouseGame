/**
 * Seeded 8×8 Sokoban level generator.
 *
 * generateLevel(levelNumber) always produces the same puzzle for a given level
 * number, so best scores are meaningful across sessions.
 *
 * Strategy:
 *  1. Seed a deterministic RNG with the level number + attempt index.
 *  2. Fill border with walls, scatter random interior walls.
 *  3. Find the largest contiguous floor region via flood-fill.
 *  4. Place targets, boxes, and the player inside that region.
 *  5. Reject corner-deadlock boxes and verify BFS reachability.
 *  6. Retry (different attempt seed) up to MAX_ATTEMPTS times.
 */

const ROWS = 8
const COLS = 8
const MAX_ATTEMPTS = 200

/** Curated levels occupy IDs 1–5; generated levels start here. */
export const FIRST_GENERATED_LEVEL = 6

// ── Seeded RNG (mulberry32) ───────────────────────────────────────────────────

function makeRng(seed) {
  let s = seed >>> 0
  return function () {
    s = (s + 0x6D2B79F5) >>> 0
    let t = Math.imul(s ^ (s >>> 15), s | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// ── Difficulty scaling ────────────────────────────────────────────────────────

/** Number of boxes/targets for a given level number. */
export function boxCountForLevel(n) {
  if (n <= 10) return 2
  if (n <= 17) return 3
  return 4
}

function wallChanceForLevel(n) {
  // Gently increase wall density as levels progress.
  return Math.min(0.36, 0.26 + (n - FIRST_GENERATED_LEVEL) * 0.004)
}

// ── Grid helpers ──────────────────────────────────────────────────────────────

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

function shuffleWith(arr, rng) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]]

function floodFill(grid, startR, startC) {
  const visited = new Set()
  const stack = [[startR, startC]]
  const cells = []
  while (stack.length) {
    const [r, c] = stack.pop()
    const key = `${r},${c}`
    if (visited.has(key)) continue
    visited.add(key)
    if (grid[r][c] !== ' ') continue
    cells.push([r, c])
    for (const [dr, dc] of DIRS) {
      const nr = r + dr, nc = c + dc
      if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) stack.push([nr, nc])
    }
  }
  return cells
}

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

function isDeadlockCell(grid, r, c) {
  const blockedV = grid[r - 1][c] === '#' || grid[r + 1][c] === '#'
  const blockedH = grid[r][c - 1] === '#' || grid[r][c + 1] === '#'
  return blockedV && blockedH
}

/**
 * Full BFS Sokoban solver over (playerRow, playerCol, sortedBoxPositions).
 * Returns true if the puzzle is solvable within the state cap.
 */
function isSolvable(grid, player, boxes, targets) {
  const targetSet = new Set(targets.map(([r, c]) => `${r},${c}`))

  function isWon(bxs) {
    return bxs.every(([r, c]) => targetSet.has(`${r},${c}`))
  }

  function encode(pr, pc, bxs) {
    return `${pr},${pc}|${bxs.map(([r, c]) => `${r},${c}`).sort().join(';')}`
  }

  const startKey = encode(player[0], player[1], boxes)
  const visited = new Set([startKey])
  const queue = [{ pr: player[0], pc: player[1], bxs: boxes }]
  let steps = 0
  const STATE_CAP = 250000

  while (queue.length && steps < STATE_CAP) {
    steps++
    const { pr, pc, bxs } = queue.shift()
    const boxSet = new Set(bxs.map(([r, c]) => `${r},${c}`))

    for (const [dr, dc] of DIRS) {
      const nr = pr + dr, nc = pc + dc
      if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS) continue
      if (grid[nr][nc] === '#') continue

      let newBxs = bxs
      if (boxSet.has(`${nr},${nc}`)) {
        const br = nr + dr, bc = nc + dc
        if (br < 0 || br >= ROWS || bc < 0 || bc >= COLS) continue
        if (grid[br][bc] === '#') continue
        if (boxSet.has(`${br},${bc}`)) continue
        newBxs = bxs.map(([r, c]) => (r === nr && c === nc) ? [br, bc] : [r, c])
      }

      if (isWon(newBxs)) return true

      const key = encode(nr, nc, newBxs)
      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ pr: nr, pc: nc, bxs: newBxs })
      }
    }
  }

  return false
}

// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Generate a deterministic 8×8 Sokoban level for a given level number.
 * The same levelNumber always produces the same puzzle.
 *
 * @param {number} levelNumber  Sequential level number (≥ FIRST_GENERATED_LEVEL).
 * @returns {{ id: number, name: string, type: 'generated', grid: string[] }}
 */
export function generateLevel(levelNumber) {
  const n = boxCountForLevel(levelNumber)
  const wallChance = wallChanceForLevel(levelNumber)

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const rng = makeRng(levelNumber * 1000 + attempt)

    const grid = blankGrid()
    for (let r = 1; r < ROWS - 1; r++) {
      for (let c = 1; c < COLS - 1; c++) {
        if (rng() < wallChance) grid[r][c] = '#'
      }
    }

    const region = largestFloorRegion(grid)
    if (region.length < 2 * n + 1) continue

    const shuffled = shuffleWith(region, rng)
    const targetCells = shuffled.slice(0, n)
    const boxCells    = shuffled.slice(n, 2 * n)
    const playerCell  = shuffled[2 * n]

    const targetSet = new Set(targetCells.map(([r, c]) => `${r},${c}`))
    const hasDeadlockedBox = boxCells.some(([r, c]) => {
      if (targetSet.has(`${r},${c}`)) return false
      return isDeadlockCell(grid, r, c)
    })
    if (hasDeadlockedBox) continue

    // Full BFS solve — only accept provably solvable layouts
    if (!isSolvable(grid, playerCell, boxCells, targetCells)) continue

    targetCells.forEach(([r, c]) => { grid[r][c] = '.' })
    boxCells.forEach(([r, c]) => { grid[r][c] = grid[r][c] === '.' ? '*' : '$' })
    const [pr, pc] = playerCell
    grid[pr][pc] = grid[pr][pc] === '.' ? '+' : '@'

    return {
      id: levelNumber,
      name: `Level ${levelNumber}`,
      type: 'generated',
      grid: gridToStrings(grid),
    }
  }

  throw new Error(`Could not generate level ${levelNumber} after ${MAX_ATTEMPTS} attempts.`)
}
