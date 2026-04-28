import { useState, useMemo, useRef, useEffect, useLayoutEffect } from 'react'
import styles from './LevelSelect.module.css'
import curatedLevels from '../../levels/curatedLevels'
import { PLAYER_CHARACTERS, DEFAULT_CHARACTER } from '../../utils/characters'
import { generateLevelOrNearest, FIRST_GENERATED_LEVEL, boxCountForLevel } from '../../utils/levelGenerator'
import { useSounds } from '../../hooks/useSounds'

const DIFFICULTY_LABEL = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert']

// ── Map geometry breakpoints ────────────────────────────────────────
// Derived at render time from measured container width (mapW)
// PAD_H must be >= colW * 0.42 so U-turn bulges never exceed the canvas edge.
// colW = (W - 2*PAD_H) / (N-1).  Solving PAD_H >= 0.42*colW gives the minimums below.
// ROW_H must comfortably fit 2*ACTIVE_R plus caption space (~40px).
function getGeo(w) {
  if (w < 370) return { NODES_PER_ROW: 3, PAD_H: 44, PAD_V: 58, ROW_H: 118, WIGGLE: 7,  NORMAL_R: 27, ACTIVE_R: 38 }
  if (w < 540) return { NODES_PER_ROW: 4, PAD_H: 50, PAD_V: 70, ROW_H: 138, WIGGLE: 11, NORMAL_R: 30, ACTIVE_R: 43 }
  return             { NODES_PER_ROW: 5, PAD_H: 60, PAD_V: 80, ROW_H: 155, WIGGLE: 18, NORMAL_R: 32, ACTIVE_R: 44 }
}

/** Absolute centre of node i given canvas pixel width W and geometry config */
function nodePos(i, W, geo) {
  const { NODES_PER_ROW, PAD_H, PAD_V, ROW_H, WIGGLE } = geo
  const colW       = (W - PAD_H * 2) / (NODES_PER_ROW - 1)
  const row        = Math.floor(i / NODES_PER_ROW)
  const col        = i % NODES_PER_ROW
  const goingRight = row % 2 === 0
  const actualCol  = goingRight ? col : (NODES_PER_ROW - 1 - col)
  const x = PAD_H + actualCol * colW
  const t = (NODES_PER_ROW > 1) ? actualCol / (NODES_PER_ROW - 1) : 0.5
  const wiggle = Math.sin(t * Math.PI) * WIGGLE * (goingRight ? -1 : 1)
  const y = PAD_V + row * ROW_H + wiggle
  return { x, y }
}

/**
 * Build a smooth continuous SVG path using Catmull-Rom → cubic bézier conversion
 * within each row, and a graceful outward bulge for U-turns between rows.
 */
function buildPath(count, W, geo) {
  if (count < 2) return ''
  const { NODES_PER_ROW, PAD_H } = geo
  const pts  = Array.from({ length: count }, (_, i) => nodePos(i, W, geo))
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
      // ─ U-turn: bulge clamped to PAD_H so it never escapes the canvas ─
      // (rightmost node sits at x = W − PAD_H, so PAD_H is the available space)
      const goingRight = pRow % 2 === 0
      const bulge = Math.min(colW * 0.42, geo.PAD_H * 0.88)
      const bx = goingRight ? p.x + bulge : p.x - bulge
      d += ` C ${bx.toFixed(1)} ${p.y.toFixed(1)} ${bx.toFixed(1)} ${c.y.toFixed(1)} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`
    }
  }
  return d
}

// ── Component ──────────────────────────────────────────────────────
function LevelSelect({ onSelectLevel, highestPassed = 0, bestScores = {}, activePlayer, players = [], onSelectPlayer, onAddPlayer, onRemovePlayer }) {
  const [selectedChar, setSelectedChar] = useState(DEFAULT_CHARACTER)
  const [newName, setNewName]           = useState('')
  const [nameError, setNameError]       = useState('')
  const [panelOpen, setPanelOpen]       = useState(false)
  const inputRef                        = useRef(null)
  const { playCharSelect } = useSounds()

  function handleAddPlayer(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) { setNameError('Enter a name.'); return }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setNameError('Name already taken.'); return
    }
    onAddPlayer(trimmed)
    setNewName('')
    setNameError('')
  }

  // Build the full ordered level list shown on the map
  const levels = useMemo(() => {
    let firstUnbeaten = FIRST_GENERATED_LEVEL
    while (firstUnbeaten <= highestPassed) firstUnbeaten++
    const genCount = firstUnbeaten - FIRST_GENERATED_LEVEL + 3

    const generated = Array.from({ length: genCount }, (_, i) => {
      const n = FIRST_GENERATED_LEVEL + i
      const boxes = boxCountForLevel(n)
      return {
        id: n,
        name: `Level ${n}`,
        type: 'generated',
        difficulty: `${boxes} crate${boxes > 1 ? 's' : ''}`,
        isLocked: n > FIRST_GENERATED_LEVEL && n - 1 > highestPassed,
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
  }, [highestPassed])

  // First uncompleted unlocked level = the "active" node
  const activeLevelId = useMemo(() => {
    for (const l of levels) {
      if (!l.isLocked && l.id > highestPassed) return l.id
    }
    return levels[levels.length - 1]?.id ?? null
  }, [levels, highestPassed])

  const [noPlayerError, setNoPlayerError] = useState(false)
  const [genError, setGenError]           = useState(false)
  const [generating, setGenerating]       = useState(false)

  function handlePlay(level) {
    if (!activePlayer) {
      setNoPlayerError(true)
      return
    }
    if (level.isLocked) return
    if (level.type !== 'generated') {
      onSelectLevel(level, selectedChar)
      return
    }
    // Show loading overlay, then run the CPU-heavy generator after paint
    setGenerating(true)
    setTimeout(() => {
      try {
        const obj = generateLevelOrNearest(level.id)
        setGenError(false)
        setGenerating(false)
        onSelectLevel(obj, selectedChar)
      } catch {
        setGenerating(false)
        setGenError(true)
        setTimeout(() => setGenError(false), 3000)
      }
    }, 0)
  }

  // Render highest level at top, Level 1 at bottom
  const displayLevels = [...levels].reverse()

  // Track actual rendered width of the map container
  const mapRef = useRef(null)
  // Seed with viewport width so first render already uses correct geo on mobile
  const [mapW, setMapW] = useState(() => window.innerWidth)
  // Immediate sync read after DOM renders (before paint) — eliminates layout flash
  useLayoutEffect(() => {
    if (!mapRef.current) return
    const w = mapRef.current.getBoundingClientRect().width
    if (w > 0) setMapW(w)
  }, [])
  useEffect(() => {
    if (!mapRef.current) return
    const ro = new ResizeObserver(([entry]) => setMapW(entry.contentRect.width))
    ro.observe(mapRef.current)
    return () => ro.disconnect()
  }, [])

  const geo     = useMemo(() => getGeo(mapW), [mapW])
  const numRows = Math.ceil(displayLevels.length / geo.NODES_PER_ROW)
  const canvasH = geo.PAD_V * 2 + (numRows - 1) * geo.ROW_H + geo.WIGGLE + geo.ACTIVE_R
  const pathD   = buildPath(displayLevels.length, mapW, geo)
  // Scale road stroke widths proportionally to node radius
  const rScale  = geo.NORMAL_R / 32

  return (
    <div className={styles.screen}>
      {generating && (
        <div className={styles.genOverlay}>
          <div className={styles.genCard}>
            <div className={styles.genSpinner} />
            <p className={styles.genMsg}>🏗️ Building your level…</p>
            <p className={styles.genSubMsg}>Hang tight, this takes a moment!</p>
          </div>
        </div>
      )}
      {/* ── Player panel ─────────────────────────────────── */}
      <div className={styles.playerWidget}>
        {/* Mobile-only toggle header */}
        <button
          className={[
            styles.playerWidgetToggle,
            noPlayerError && !activePlayer ? styles.playerWidgetNoPlayer : ''
          ].join(' ')}
          onClick={() => setPanelOpen((o) => !o)}
          aria-expanded={panelOpen}
        >
          <span>{activePlayer ? `🙂 ${activePlayer.name}` : noPlayerError ? '⚠️ Select Player' : '👤 Select Player'}</span>
          <span className={styles.playerWidgetCaret}>{panelOpen ? '▲' : '▼'}</span>
        </button>

        {/* Content: always visible on desktop, toggle-controlled on mobile */}
        <div className={[styles.playerPanelContent, panelOpen ? styles.playerPanelOpen : ''].join(' ')}>
          <p className={styles.playerPanelTitle}>Players</p>

          {players.length === 0 && (
            <p className={styles.playerPanelEmpty}>No players yet.</p>
          )}

          <ul className={styles.playerPanelList}>
            {players.map((p) => (
              <li key={p.id} className={styles.playerPanelItem}>
                <button
                  className={[
                    styles.playerPanelBtn,
                    activePlayer?.id === p.id ? styles.playerPanelBtnActive : ''
                  ].join(' ')}
                  onClick={() => { onSelectPlayer(p); setNoPlayerError(false); setPanelOpen(false) }}
                >
                  {activePlayer?.id === p.id ? '✓ ' : ''}{p.name}
                </button>
                <button
                  className={styles.playerPanelDel}
                  onClick={() => onRemovePlayer(p.id)}
                  aria-label={`Delete ${p.name}`}
                  title="Delete"
                >🗑</button>
              </li>
            ))}
          </ul>

          <form className={styles.playerPanelForm} onSubmit={handleAddPlayer} noValidate>
            <input
              ref={inputRef}
              className={styles.playerPanelInput}
              type="text"
              maxLength={20}
              placeholder="New player name…"
              value={newName}
              onChange={(e) => { setNewName(e.target.value); setNameError('') }}
            />
            <button type="submit" className={styles.playerPanelAdd}>Add</button>
          </form>
          {noPlayerError && !activePlayer && (
            <p className={styles.playerPanelError}>⚠️ Select a player to start!</p>
          )}
          {nameError && <p className={styles.playerPanelError}>{nameError}</p>}
        </div>
      </div>

      <h1 className={styles.title}>🏭 Warehouse Keeper</h1>
      <p className={styles.subtitle}>
        Shove every crate onto its marked spot — but think before you push!
      </p>
      {genError && (
        <p className={styles.genError}>⚠️ Couldn't generate that level — try again or pick another.</p>
      )}

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
              <path d={pathD} fill="none" stroke="#4040c0" strokeWidth={56 * rScale}
                strokeLinecap="round" opacity="0.18"
                style={{ filter: 'blur(10px)' }} />
              {/* Ground shadow — gives road depth */}
              <path d={pathD} fill="none" stroke="#03030a" strokeWidth={54 * rScale} strokeLinecap="round" />
              {/* Road base */}
              <path d={pathD} fill="none" stroke="#2d2d78" strokeWidth={44 * rScale} strokeLinecap="round" />
              {/* Lighter bevel — makes it look raised */}
              <path d={pathD} fill="none" stroke="#4848a8" strokeWidth={32 * rScale} strokeLinecap="round" />
              {/* Inner surface — slightly lighter centre */}
              <path d={pathD} fill="none" stroke="#3a3a90" strokeWidth={20 * rScale} strokeLinecap="round" />
              {/* Dashed centre line — road marking feel */}
              <path d={pathD} fill="none" stroke="rgba(255,255,160,0.13)" strokeWidth={Math.max(1.5, 2 * rScale)}
                strokeLinecap="round" strokeDasharray={`${8 * rScale} ${14 * rScale}`} />
              {/* Top highlight — thin bright edge */}
              <path d={pathD} fill="none" stroke="rgba(160,160,255,0.35)" strokeWidth={Math.max(2, 5 * rScale)} strokeLinecap="round" />
            </svg>

            {/* Level nodes */}
            {displayLevels.map((level, i) => {
              const { x: cx, y: cy } = nodePos(i, mapW, geo)
              const isActive    = level.id === activeLevelId
              const isCompleted = level.id <= highestPassed
              const isLocked    = level.isLocked
              const r           = isActive ? geo.ACTIVE_R : geo.NORMAL_R

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
                      ? `Level ${level.id} — best ${bestScores[level.id]?.moves ?? '?'} moves${
                          bestScores[level.id]?.playerName ? ` by ${bestScores[level.id].playerName}` : ''
                        }`
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
                      ? `★ ${bestScores[level.id]?.moves ?? '✓'}`
                      : !isLocked
                      ? level.difficulty
                      : ''}
                  </span>
                  {isCompleted && bestScores[level.id]?.playerName && (
                    <span className={styles.nodeBestBy}>
                      {bestScores[level.id].playerName}
                    </span>
                  )}
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
