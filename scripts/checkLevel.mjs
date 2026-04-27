import { generateLevel } from '../src/utils/levelGenerator.js'

const DIRS = [[-1,0],[1,0],[0,-1],[0,1]]

// Full Sokoban solver via BFS over (playerPos, frozenBoxSet) state space
function isSolvable(grid) {
  const rows = grid.length
  const cols = grid[0].length

  let player = null
  const boxes = []
  const targets = []

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const ch = grid[r][c]
      if (ch === '@' || ch === '+') player = [r, c]
      if (ch === '$' || ch === '*') boxes.push([r, c])
      if (ch === '.' || ch === '*' || ch === '+') targets.push([r, c])
    }
  }

  const targetSet = new Set(targets.map(([r,c]) => `${r},${c}`))

  function encode(pr, pc, bxs) {
    return `${pr},${pc}|${bxs.map(([r,c])=>`${r},${c}`).sort().join(';')}`
  }

  function isWon(bxs) {
    return bxs.every(([r,c]) => targetSet.has(`${r},${c}`))
  }

  const startBoxes = boxes
  const startKey = encode(player[0], player[1], startBoxes)
  const visited = new Set([startKey])
  const queue = [{ pr: player[0], pc: player[1], bxs: startBoxes }]

  let steps = 0
  while (queue.length) {
    steps++
    if (steps > 300000) return { solvable: false, reason: 'Search limit reached' }
    const { pr, pc, bxs } = queue.shift()
    const boxSet = new Set(bxs.map(([r,c]) => `${r},${c}`))

    for (const [dr, dc] of DIRS) {
      const nr = pr + dr, nc = pc + dc
      if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue
      if (grid[nr][nc] === '#') continue

      let newBxs = bxs
      if (boxSet.has(`${nr},${nc}`)) {
        // pushing a box
        const br = nr + dr, bc = nc + dc
        if (br < 0 || br >= rows || bc < 0 || bc >= cols) continue
        if (grid[br][bc] === '#') continue
        if (boxSet.has(`${br},${bc}`)) continue
        newBxs = bxs.map(([r,c]) => (r===nr && c===nc) ? [br,bc] : [r,c])
      }

      if (isWon(newBxs)) return { solvable: true, steps }

      const key = encode(nr, nc, newBxs)
      if (!visited.has(key)) {
        visited.add(key)
        queue.push({ pr: nr, pc: nc, bxs: newBxs })
      }
    }
  }

  return { solvable: false, reason: 'No solution found' }
}

const levelNum = parseInt(process.argv[2] ?? '8')
const level = generateLevel(levelNum)
console.log(`\nLevel ${levelNum}: ${level.name}`)
console.log('Grid:')
level.grid.forEach(row => console.log(' ', row))
const result = isSolvable(level.grid)
console.log('\nSolvable:', result.solvable)
if (result.steps) console.log('BFS states explored:', result.steps)
if (result.reason) console.log('Reason:', result.reason)
