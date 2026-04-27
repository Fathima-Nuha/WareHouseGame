import Cell from '../Cell/Cell'
import styles from './GameBoard.module.css'

function GameBoard({ grid, playerEmoji }) {
  if (!grid) return null

  return (
    <div
      className={styles.board}
      style={{ gridTemplateColumns: `repeat(${grid[0].length}, var(--cell-size))` }}
    >
      {grid.map((row, r) =>
        row.split('').map((cellType, c) => (
          <Cell key={`${r}-${c}`} type={cellType} playerEmoji={playerEmoji} />
        ))
      )}
    </div>
  )
}

export default GameBoard
