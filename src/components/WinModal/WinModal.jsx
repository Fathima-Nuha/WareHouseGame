import styles from './WinModal.module.css'
import curatedLevels from '../../levels/curatedLevels'

function WinModal({ moves, bestScore, isNewRecord, currentLevel, onNextLevel, onReplay, onBack }) {
  const isRandom = currentLevel?.type === 'random'
  const currentIndex = isRandom ? -1 : curatedLevels.findIndex((l) => l.id === currentLevel?.id)
  const hasNext = !isRandom && currentIndex !== -1 && currentIndex < curatedLevels.length - 1

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
            Best: <strong>{bestScore}</strong> move{bestScore !== 1 ? 's' : ''}
          </p>
        )}

        <div className={styles.actions}>
          {isRandom && (
            <button className={`${styles.btn} ${styles.primary}`} onClick={onNextLevel}>
              🎲 New Random Level
            </button>
          )}
          {hasNext && (
            <button className={`${styles.btn} ${styles.primary}`} onClick={onNextLevel}>
              Next Level →
            </button>
          )}
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
