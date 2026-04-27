/**
 * Curated 8x8 levels.
 * Each row is exactly 8 characters using Sokoban encoding:
 *   # wall   space floor   @ player   $ box   . target   * box-on-target   + player-on-target
 */

const curatedLevels = [
  {
    id: 1,
    name: 'Level 1 — First Shift',
    type: 'curated',
    grid: [
      '########',
      '#      #',
      '#  $   #',
      '#  .   #',
      '#      #',
      '#   $  #',
      '#   .  #',
      '########',
    ],
  },
  {
    id: 2,
    name: 'Level 2 — Corner Work',
    type: 'curated',
    grid: [
      '########',
      '#      #',
      '# $    #',
      '# . #  #',
      '#   $  #',
      '#   .  #',
      '#  @   #',
      '########',
    ],
  },
  {
    id: 3,
    name: 'Level 3 — Two by Two',
    type: 'curated',
    grid: [
      '########',
      '#   @  #',
      '# $$   #',
      '#      #',
      '#  ..  #',
      '#      #',
      '#      #',
      '########',
    ],
  },
  {
    id: 4,
    name: 'Level 4 — Tight Squeeze',
    type: 'curated',
    grid: [
      '########',
      '#      #',
      '##$##  #',
      '#  .   #',
      '#  $   #',
      '#  .   #',
      '# @    #',
      '########',
    ],
  },
  {
    id: 5,
    name: 'Level 5 — Shift End',
    type: 'curated',
    grid: [
      '########',
      '#@     #',
      '#  $   #',
      '#  . # #',
      '# #$   #',
      '#   .  #',
      '#      #',
      '########',
    ],
  },
]

// Add default player position to levels that don't have @ in the grid
curatedLevels.forEach((level) => {
  const hasPlayer = level.grid.some((row) => row.includes('@') || row.includes('+'))
  if (!hasPlayer) {
    // Place player at row 1, col 1 as fallback
    const row = level.grid[1]
    level.grid[1] = '@' + row.slice(1)
  }
})

export default curatedLevels
