import styles from './WinModal.module.css'

function WinModal({ moves, bestScore, isNewRecord, currentLevel, onNextLevel, onReplay, onBack }) {
  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Level complete">
      <div className={styles.modal}>
        <div className={styles.trophy}>🏆</div>
        <h2 className={styles.heading}>Level Complete!</h2>
        <p className={styles.levelName}>{currentLevel?.name}</p>

        {isNewRecord && (
          <p className={styles.newRecord}>🌟 New Best!</p>
        )}

        <p className={styles.moves}>
          Finished in <strong>{moves}</strong> move{moves !== 1 ? 's' : ''}
        </p>

        {!isNewRecord && bestScore !== undefined && (
          <p className={styles.bestScore}>
            Best: <strong>{bestScore.moves}</strong> move{bestScore.moves !== 1 ? 's' : ''}
            {bestScore.playerName && (
              <span className={styles.bestBy}> by {bestScore.playerName}</span>
            )}
          </p>
        )}

        <div className={styles.actions}>
          <button className={`${styles.btn} ${styles.primary}`} onClick={onNextLevel}>
            Next Level →
          </button>
          <button className={styles.btn} onClick={onReplay}>
            ↺ Play Again
          </button>
          <button className={styles.btn} onClick={onBack}>
            ← Level Select
          </button>
        </div>
      </div>
    </div>
  )
}

export default WinModal
