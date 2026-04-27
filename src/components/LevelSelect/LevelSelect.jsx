import { useState, useMemo, useRef, useEffect } from 'react'
import styles from './LevelSelect.module.css'
import curatedLevels from '../../levels/curatedLevels'
import { PLAYER_CHARACTERS, DEFAULT_CHARACTER } from '../../utils/characters'
import { generateLevel, FIRST_GENERATED_LEVEL, boxCountForLevel } from '../../utils/levelGenerator'
import { useSounds } from '../../hooks/useSounds'

const DIFFICULTY_LABEL = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

// ── Map geometry (horizontal snake) ────────────────────────────────
const NODES_PER_ROW = 5     // nodes per horizontal row
const PAD_H         = 60    // left / right padding
const PAD_V         = 80    // top / bottom padding
const ROW_H         = 155   // vertical distance between row centres
const WIGGLE        = 18    // vertical arch per row (bigger = more wavy)
const NORMAL_R      = 32    // regular node radius
const ACTIVE_R      = 44    // active node radius

/** Absolute centre of node i given canvas pixel width W */
function nodePos(i, W) {
  const colW       = (W - PAD_H * 2) / (NODES_PER_ROW - 1)
  const row        = Math.floor(i / NODES_PER_ROW)
  const col        = i % NODES_PER_ROW
  const goingRight = row % 2 === 0
  const actualCol  = goingRight ? col : (NODES_PER_ROW - 1 - col)
  const x = PAD_H + actualCol * colW
  const t = actualCol / (NODES_PER_ROW - 1)             // 0 → 1
  const wiggle = Math.sin(t * Math.PI) * WIGGLE * (goingRight ? -1 : 1)
  const y = PAD_V + row * ROW_H + wiggle
  return { x, y }
}

/**
 * Build a smooth continuous SVG path using Catmull-Rom → cubic bézier conversion
 * within each row, and a graceful outward bulge for U-turns between rows.
 */
function buildPath(count, W) {
  if (count < 2) return ''
  const pts  = Array.from({ length: count }, (_, i) => nodePos(i, W))
  const colW = (W - PAD_H * 2) / (NODES_PER_ROW - 1)
  let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`

  for (let i = 1; i < count; i++) {
    const p    = pts[i - 1]
    const c    = pts[i]
    const pRow = Math.floor((i - 1) / NODES_PER_ROW)
    const cRow = Math.floor(i / NODES_PER_ROW)

    if (pRow === cRow) {
      // ─ Catmull-Rom → cubic bézier (smooth flow through each node) ─
      const prev = (i >= 2 && Math.floor((i - 2) / NODES_PER_ROW) === pRow)
        ? pts[i - 2]
        : { x: 2 * p.x - c.x, y: 2 * p.y - c.y }   // reflected phantom
      const next = (i < count - 1 && Math.floor((i + 1) / NODES_PER_ROW) === cRow)
        ? pts[i + 1]
        : { x: 2 * c.x - p.x, y: 2 * c.y - p.y }   // reflected phantom
      const T   = 0.38  // tension: lower = tighter curves
      const cp1x = p.x + (c.x - prev.x) * T
      const cp1y = p.y + (c.y - prev.y) * T
      const cp2x = c.x - (next.x - p.x) * T
      const cp2y = c.y - (next.y - p.y) * T
      d += ` C ${cp1x.toFixed(1)} ${cp1y.toFixed(1)} ${cp2x.toFixed(1)} ${cp2y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
    } else {
      // ─ U-turn: bezier that bulges outward past the row edge ─
      const goingRight = pRow % 2 === 0
      const bulge = colW * 0.42
      const bx = goingRight ? p.x + bulge : p.x - bulge
      d += ` C ${bx.toFixed(1)} ${p.y.toFixed(1)} ${bx.toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
    }
  }
  return d
}

// ── Component ──────────────────────────────────────────────────────
function LevelSelect({ onSelectLevel, bestScores = {} }) {
  const [selectedChar, setSelectedChar] = useState(DEFAULT_CHARACTER)
  const { playCharSelect } = useSounds()

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

  // Track actual rendered width of the map container
  const mapRef = useRef(null)
  const [mapW, setMapW] = useState(600)
  useEffect(() => {
    if (!mapRef.current) return
    const ro = new ResizeObserver(([entry]) => setMapW(entry.contentRect.width))
    ro.observe(mapRef.current)
    return () => ro.disconnect()
  }, [])

  const numRows = Math.ceil(displayLevels.length / NODES_PER_ROW)
  const canvasH = PAD_V * 2 + (numRows - 1) * ROW_H + WIGGLE + ACTIVE_R
  const pathD   = buildPath(displayLevels.length, mapW)

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
              onClick={() => { setSelectedChar(char); playCharSelect(char.id) }}
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
      <section className={styles.mapSection}>
        <h2 className={styles.sectionTitle}>Level Map</h2>
        <div className={styles.mapScroller} ref={mapRef}>
          <div
            className={styles.mapCanvas}
            style={{ width: '100%', height: canvasH }}
          >
            {/* Winding path SVG */}
            <svg
              className={styles.pathSvg}
              viewBox={`0 0 ${mapW} ${canvasH}`}
              aria-hidden="true"
            >
              <defs>
                {/* Glow filter for the road */}
                <filter id="wkGlow" x="-15%" y="-15%" width="130%" height="130%">
                  <feGaussianBlur stdDeviation="7" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>
              {/* Outer soft glow */}
              <path d={pathD} fill="none" stroke="#4040c0" strokeWidth="56"
                strokeLinecap="round" opacity="0.18"
                style={{ filter: 'blur(10px)' }} />
              {/* Ground shadow — gives road depth */}
              <path d={pathD} fill="none" stroke="#03030a" strokeWidth="54" strokeLinecap="round" />
              {/* Road base */}
              <path d={pathD} fill="none" stroke="#2d2d78" strokeWidth="44" strokeLinecap="round" />
              {/* Lighter bevel — makes it look raised */}
              <path d={pathD} fill="none" stroke="#4848a8" strokeWidth="32" strokeLinecap="round" />
              {/* Inner surface — slightly lighter centre */}
              <path d={pathD} fill="none" stroke="#3a3a90" strokeWidth="20" strokeLinecap="round" />
              {/* Dashed centre line — road marking feel */}
              <path d={pathD} fill="none" stroke="rgba(255,255,160,0.13)" strokeWidth="2"
                strokeLinecap="round" strokeDasharray="10 18" />
              {/* Top highlight — thin bright edge */}
              <path d={pathD} fill="none" stroke="rgba(160,160,255,0.35)" strokeWidth="5" strokeLinecap="round" />
            </svg>

            {/* Level nodes */}
            {displayLevels.map((level, i) => {
              const { x: cx, y: cy } = nodePos(i, mapW)
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
