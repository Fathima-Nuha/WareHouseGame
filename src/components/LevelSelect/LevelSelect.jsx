import { useState } from 'react'
import styles from './LevelSelect.module.css'
import curatedLevels from '../../levels/curatedLevels'
import { PLAYER_CHARACTERS, DEFAULT_CHARACTER } from '../../utils/characters'
import { generateLevel, FIRST_GENERATED_LEVEL, boxCountForLevel } from '../../utils/levelGenerator'

const DIFFICULTY = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

function LevelSelect({ onSelectLevel, bestScores = {} }) {
  const [selectedChar, setSelectedChar] = useState(DEFAULT_CHARACTER)

  function handleSelectLevel(level) {
    onSelectLevel(level, selectedChar)
  }

  function handleGeneratedLevel(levelNum) {
    try {
      onSelectLevel(generateLevel(levelNum), selectedChar)
    } catch {
      // Extremely unlikely — silently ignore, user can tap again
    }
  }

  // Show from level FIRST_GENERATED_LEVEL up to the first unbeaten + 2 ahead
  const firstUnbeaten = (() => {
    let n = FIRST_GENERATED_LEVEL
    while (bestScores[n] !== undefined) n++
    return n
  })()
  const visibleGenerated = Array.from(
    { length: firstUnbeaten - FIRST_GENERATED_LEVEL + 3 },
    (_, i) => FIRST_GENERATED_LEVEL + i
  )

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>🏭 Warehouse Keeper</h1>
      <p className={styles.subtitle}>
        Shove every crate onto its marked spot — but think before you push!
      </p>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Choose Your Character</h2>
        <div className={styles.charGrid}>
          {PLAYER_CHARACTERS.map((char) => (
            <button
              key={char.id}
              className={`${styles.charBtn} ${selectedChar.id === char.id ? styles.charBtnSelected : ''}`}
              onClick={() => setSelectedChar(char)}
              aria-label={`Select ${char.label}`}
              aria-pressed={selectedChar.id === char.id}
            >
              <span className={styles.charEmoji}>{char.emoji}</span>
              <span className={styles.charLabel}>{char.label}</span>
            </button>
          ))}
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Curated Levels</h2>
        <ul className={styles.levelList}>
          {curatedLevels.map((level, i) => (
            <li key={level.id}>
              <button
                className={styles.levelBtn}
                onClick={() => handleSelectLevel(level)}
              >
                <span className={styles.levelNumber}>#{i + 1}</span>
                <span className={styles.levelName}>{level.name}</span>
                {bestScores[level.id] !== undefined ? (
                  <span className={styles.bestBadge} title="Your best score">
                    ⭐ {bestScores[level.id]}
                  </span>
                ) : (
                  <span className={styles.difficulty}>{DIFFICULTY[i] ?? ''}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>More Levels</h2>
        <ul className={styles.levelList}>
          {visibleGenerated.map((n) => {
            const boxes = boxCountForLevel(n)
            return (
              <li key={n}>
                <button
                  className={styles.levelBtn}
                  onClick={() => handleGeneratedLevel(n)}
                >
                  <span className={styles.levelNumber}>#{n}</span>
                  <span className={styles.levelName}>Level {n}</span>
                  {bestScores[n] !== undefined ? (
                    <span className={styles.bestBadge} title="Your best score">
                      ⭐ {bestScores[n]}
                    </span>
                  ) : (
                    <span className={styles.difficulty}>{boxes} crate{boxes > 1 ? 's' : ''}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}

export default LevelSelect
