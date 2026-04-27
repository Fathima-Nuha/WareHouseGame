// Cell characters (Sokoban standard encoding)
export const CELL = {
  WALL: '#',
  FLOOR: ' ',
  PLAYER: '@',
  BOX: '$',
  TARGET: '.',
  BOX_ON_TARGET: '*',
  PLAYER_ON_TARGET: '+',
}

// Direction deltas
const DELTAS = {
  up:    { dr: -1, dc:  0 },
  down:  { dr:  1, dc:  0 },
  left:  { dr:  0, dc: -1 },
  right: { dr:  0, dc:  1 },
}

/** Return the character at grid[row][col], or undefined if out of bounds. */
function getCell(grid, row, col) {
  return grid[row]?.[col]
}

/** Return a new grid with grid[row][col] replaced by char. */
function setCell(grid, row, col, char) {
  return grid.map((rowStr, r) => {
    if (r !== row) return rowStr
    return rowStr.slice(0, col) + char + rowStr.slice(col + 1)
  })
}

/** Scan grid and return { row, col } of the player (@  or +). */
export function extractPlayer(grid) {
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c]
      if (ch === CELL.PLAYER || ch === CELL.PLAYER_ON_TARGET) {
        return { row: r, col: c }
      }
    }
  }
  return null
}

/** Scan grid and return all target positions (., *, +). These never change. */
export function extractTargets(grid) {
  const targets = []
  for (let r = 0; r < grid.length; r++) {
    for (let c = 0; c < grid[r].length; c++) {
      const ch = grid[r][c]
      if (ch === CELL.TARGET || ch === CELL.BOX_ON_TARGET || ch === CELL.PLAYER_ON_TARGET) {
        targets.push({ row: r, col: c })
      }
    }
  }
  return targets
}

/** Return true when every target has a box on it. */
export function isWon(grid, targets) {
  return targets.length > 0 && targets.every(({ row, col }) => grid[row][col] === CELL.BOX_ON_TARGET)
}

/**
 * Validate a move without modifying state.
 * Rules:
 *  1. New position must be in bounds
 *  2. New position must not be a wall
 *  3. If new position holds a box, the cell behind the box must be in bounds,
 *     not a wall, and not another box
 */
export function isValidMove(grid, playerPos, dir) {
  const { dr, dc } = DELTAS[dir]
  const newRow = playerPos.row + dr
  const newCol = playerPos.col + dc

  const newCell = getCell(grid, newRow, newCol)
  if (newCell === undefined || newCell === CELL.WALL) return false

  if (newCell === CELL.BOX || newCell === CELL.BOX_ON_TARGET) {
    const boxRow = newRow + dr
    const boxCol = newCol + dc
    const boxDest = getCell(grid, boxRow, boxCol)
    if (
      boxDest === undefined ||
      boxDest === CELL.WALL ||
      boxDest === CELL.BOX ||
      boxDest === CELL.BOX_ON_TARGET
    ) return false
  }

  return true
}

/**
 * Apply a validated move and return { grid, player }.
 * If the move is invalid the original state is returned unchanged.
 */
export function movePlayer(grid, playerPos, dir) {
  if (!isValidMove(grid, playerPos, dir)) {
    return { grid, player: playerPos }
  }

  const { dr, dc } = DELTAS[dir]
  const { row, col } = playerPos
  const newRow = row + dr
  const newCol = col + dc

  const currentCell = grid[row][col]
  const destCell = grid[newRow][newCol]

  let newGrid = grid

  // Push box if needed
  if (destCell === CELL.BOX || destCell === CELL.BOX_ON_TARGET) {
    const boxRow = newRow + dr
    const boxCol = newCol + dc
    const boxDest = grid[boxRow][boxCol]
    const boxNewChar = boxDest === CELL.TARGET ? CELL.BOX_ON_TARGET : CELL.BOX
    newGrid = setCell(newGrid, boxRow, boxCol, boxNewChar)
  }

  // Move player into new cell
  const playerNewChar =
    destCell === CELL.TARGET || destCell === CELL.BOX_ON_TARGET
      ? CELL.PLAYER_ON_TARGET
      : CELL.PLAYER
  newGrid = setCell(newGrid, newRow, newCol, playerNewChar)

  // Vacate old player cell
  const playerOldChar = currentCell === CELL.PLAYER_ON_TARGET ? CELL.TARGET : CELL.FLOOR
  newGrid = setCell(newGrid, row, col, playerOldChar)

  return { grid: newGrid, player: { row: newRow, col: newCol } }
}
