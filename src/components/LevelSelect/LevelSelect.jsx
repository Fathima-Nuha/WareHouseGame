import { useState } from 'react'
import styles from './LevelSelect.module.css'
import curatedLevels from '../../levels/curatedLevels'
import { PLAYER_CHARACTERS, DEFAULT_CHARACTER } from '../../utils/characters'
import { generateLevel } from '../../utils/levelGenerator'

const DIFFICULTY = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']
const BOX_OPTIONS = [1, 2, 3, 4]

function LevelSelect({ onSelectLevel, bestScores = {} }) {
  const [selectedChar, setSelectedChar] = useState(DEFAULT_CHARACTER)
  const [boxCount, setBoxCount] = useState(2)
  const [genError, setGenError] = useState(null)

  function handleSelectLevel(level) {
    onSelectLevel(level, selectedChar)
  }

  function handleGenerate() {
    try {
      setGenError(null)
      const level = generateLevel(boxCount)
      onSelectLevel(level, selectedChar)
    } catch {
      setGenError('Could not generate a level — try again!')
    }
  }

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
        <h2 className={styles.sectionTitle}>♾️ Infinite Random Levels</h2>
        <p className={styles.randomDesc}>
          Every generated puzzle is unique. Pick how many crates to juggle.
        </p>
        <div className={styles.boxPicker}>
          {BOX_OPTIONS.map((n) => (
            <button
              key={n}
              className={`${styles.boxBtn} ${boxCount === n ? styles.boxBtnSelected : ''}`}
              onClick={() => setBoxCount(n)}
              aria-label={`${n} box${n > 1 ? 'es' : ''}`}
              aria-pressed={boxCount === n}
            >
              {'📦'.repeat(n)}
              <span className={styles.boxLabel}>{n} crate{n > 1 ? 's' : ''}</span>
            </button>
          ))}
        </div>
        {genError && <p className={styles.genError}>{genError}</p>}
        <button className={styles.generateBtn} onClick={handleGenerate}>
          🎲 Generate &amp; Play
        </button>
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
    </div>
  )
}

export default LevelSelect
