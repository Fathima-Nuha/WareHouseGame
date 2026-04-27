import styles from './HUD.module.css'

function HUD({ levelName, moves, bestScore, canUndo, onUndo, onReset, onBack }) {
  return (
    <div className={styles.hud}>
      <button className={styles.btn} onClick={onBack} aria-label="Back to level select">
        ← Back
      </button>

      <div className={styles.info}>
        <span className={styles.levelName}>{levelName}</span>
        <span className={styles.moves}>Moves: {moves}</span>
        {bestScore != null && (
          <span className={styles.best}>
            🏆 Best: {bestScore.moves}
            {bestScore.playerName && (
              <span className={styles.bestBy}> by {bestScore.playerName}</span>
            )}
          </span>
        )}
      </div>

      <div className={styles.actions}>
        <button
          className={styles.btn}
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last move"
        >
          ↩ Undo
        </button>
        <button className={styles.btn} onClick={onReset} aria-label="Reset level">
          ↺ Reset
        </button>
      </div>
    </div>
  )
}

export default HUD
