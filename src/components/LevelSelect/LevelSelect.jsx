import { useState, useMemo } from 'react'
import styles from './LevelSelect.module.css'
import curatedLevels from '../../levels/curatedLevels'
import { PLAYER_CHARACTERS, DEFAULT_CHARACTER } from '../../utils/characters'
import { generateLevel, FIRST_GENERATED_LEVEL, boxCountForLevel } from '../../utils/levelGenerator'

const DIFFICULTY_LABEL = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

// ── Map geometry ────────────────────────────────────────────────────
const MAP_W       = 320   // canvas width in px
const NODE_GAP    = 120   // vertical px between node centres
const AMPLITUDE   = 88    // horizontal swing from centre
const PAD_V       = 64    // top + bottom padding inside canvas
const NORMAL_R    = 34    // radius of a regular node
const ACTIVE_R    = 44    // radius of the pulsing active node

function nx(i)    { return MAP_W / 2 + Math.sin(i * Math.PI * 0.72) * AMPLITUDE }
function ny(i)    { return PAD_V + i * NODE_GAP }

function buildPath(count) {
  if (count < 2) return ''
  let d = `M ${nx(0)} ${ny(0)}`
  for (let i = 1; i < count; i++) {
    const half = NODE_GAP / 2
    d += ` C ${nx(i-1)} ${ny(i-1) + half} ${nx(i)} ${ny(i) - half} ${nx(i)} ${ny(i)}`
  }
  return d
}

// ── Component ──────────────────────────────────────────────────────
function LevelSelect({ onSelectLevel, bestScores = {} }) {
  const [selectedChar, setSelectedChar] = useState(DEFAULT_CHARACTER)

  // Build the full ordered level list shown on the map
  const levels = useMemo(() => {
    let firstUnbeaten = FIRST_GENERATED_LEVEL
    while (bestScores[firstUnbeaten] !== undefined) firstUnbeaten++
    const genCount = firstUnbeaten - FIRST_GENERATED_LEVEL + 3

    const generated = Array.from({ length: genCount }, (_, i) => {
      const n = FIRST_GENERATED_LEVEL + i
      const boxes = boxCountForLevel(n)
      return {
        id: n,
        name: `Level ${n}`,
        type: 'generated',
        difficulty: `${boxes} crate${boxes > 1 ? 's' : ''}`,
        isLocked: n > FIRST_GENERATED_LEVEL && bestScores[n - 1] === undefined,
      }
    })

    return [
      ...curatedLevels.map((l, i) => ({
        ...l,
        difficulty: DIFFICULTY_LABEL[i] ?? '',
        isLocked: false,
      })),
      ...generated,
    ]
  }, [bestScores])

  // First uncompleted unlocked level = the "active" node
  const activeLevelId = useMemo(() => {
    for (const l of levels) {
      if (!l.isLocked && bestScores[l.id] === undefined) return l.id
    }
    return levels[levels.length - 1]?.id ?? null
  }, [levels, bestScores])

  function handlePlay(level) {
    if (level.isLocked) return
    let obj = level
    if (level.type === 'generated') {
      try { obj = generateLevel(level.id) } catch { return }
    }
    onSelectLevel(obj, selectedChar)
  }

  // Render highest level at top, Level 1 at bottom
  const displayLevels = [...levels].reverse()

  const canvasH = PAD_V * 2 + (displayLevels.length - 1) * NODE_GAP
  const pathD   = buildPath(displayLevels.length)

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>🏭 Warehouse Keeper</h1>
      <p className={styles.subtitle}>
        Shove every crate onto its marked spot — but think before you push!
      </p>

      {/* ── Character picker ──────────────────────────────────── */}
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

      {/* ── Level map ─────────────────────────────────────────── */}
      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Level Map</h2>
        <div className={styles.mapScroller}>
          <div
            className={styles.mapCanvas}
            style={{ width: MAP_W, height: canvasH }}
          >
            {/* Winding path SVG */}
            <svg
              className={styles.pathSvg}
              viewBox={`0 0 ${MAP_W} ${canvasH}`}
              aria-hidden="true"
            >
              <defs>
                <pattern id="wkStripe" patternUnits="userSpaceOnUse" width="20" height="20" patternTransform="rotate(45)">
                  <rect width="10" height="20" fill="#252550" />
                  <rect x="10" width="10" height="20" fill="#1c1c40" />
                </pattern>
              </defs>
              {/* Drop shadow stroke */}
              <path d={pathD} fill="none" stroke="#08080f" strokeWidth="52" strokeLinecap="round" />
              {/* Base track colour */}
              <path d={pathD} fill="none" stroke="#35357a" strokeWidth="42" strokeLinecap="round" />
              {/* Candy stripe overlay */}
              <path d={pathD} fill="none" stroke="url(#wkStripe)" strokeWidth="34" strokeLinecap="round" />
              {/* Centre shimmer line */}
              <path d={pathD} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="3" strokeLinecap="round" />
            </svg>

            {/* Level nodes */}
            {displayLevels.map((level, i) => {
              const cx        = nx(i)
              const cy        = ny(i)
              const isActive    = level.id === activeLevelId
              const isCompleted = bestScores[level.id] !== undefined
              const isLocked    = level.isLocked
              const r           = isActive ? ACTIVE_R : NORMAL_R

              return (
                <div
                  key={level.id}
                  className={[
                    styles.node,
                    isActive    && styles.nodeActive,
                    isCompleted && styles.nodeCompleted,
                    isLocked    && styles.nodeLocked,
                    !isLocked   && styles.nodeClickable,
                  ].filter(Boolean).join(' ')}
                  style={{ left: cx - r, top: cy - r, width: r * 2, height: r * 2 }}
                  role="button"
                  tabIndex={isLocked ? -1 : 0}
                  aria-disabled={isLocked}
                  aria-label={
                    isLocked
                      ? `Level ${level.id} — locked`
                      : isCompleted
                      ? `Level ${level.id} — best ${bestScores[level.id]} moves`
                      : `Level ${level.id} — ${level.difficulty}`
                  }
                  onClick={() => handlePlay(level)}
                  onKeyDown={(e) => e.key === 'Enter' && handlePlay(level)}
                >
                  <span className={styles.nodeNum}>
                    {isLocked ? '🔒' : level.id}
                  </span>

                  {isCompleted && (
                    <span className={styles.starBadge}>⭐</span>
                  )}
                  {isActive && !isLocked && (
                    <span className={styles.playBadge}>▶</span>
                  )}

                  <span className={styles.nodeCaption}>
                    {isCompleted
                      ? `★ ${bestScores[level.id]}`
                      : !isLocked
                      ? level.difficulty
                      : ''}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </section>
    </div>
  )
}

export default LevelSelect
