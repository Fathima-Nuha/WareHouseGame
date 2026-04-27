import { useState, useRef, useCallback } from 'react'

const STORAGE_KEY = 'wk-best-scores'

function loadFromStorage() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {}
  } catch {
    return {}
  }
}

/**
 * Persists best (minimum) move-count per level id across sessions.
 *
 * @returns {{ bestScores: Record<string|number, number>, recordScore: (levelId, moves) => boolean }}
 *   recordScore returns true if the score is a new personal best.
 */
export function useBestScores() {
  const [scores, setScores] = useState(loadFromStorage)

  // Keep a ref so recordScore can read the latest scores without being
  // recreated on every state update (keeps the dep array in App stable).
  const scoresRef = useRef(scores)
  scoresRef.current = scores

  const recordScore = useCallback((levelId, moves) => {
    const current = scoresRef.current[levelId]
    const isNewBest = current === undefined || moves < current
    if (isNewBest) {
      setScores((prev) => {
        const next = { ...prev, [levelId]: moves }
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
        } catch {
          // Storage quota exceeded or unavailable — silently ignore
        }
        return next
      })
    }
    return isNewBest
  }, []) // stable reference — reads scores through ref

  return { bestScores: scores, recordScore }
}
