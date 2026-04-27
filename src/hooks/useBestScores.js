import { useState, useRef, useCallback } from 'react'

/**
 * Global best scores — one shared record per level, across ALL players.
 *
 * Storage key: "wk-global-best"
 * Shape: { [levelId]: { moves: number, playerName: string|null, playerId: string|null } }
 *
 * recordScore(levelId, moves, player?)
 *   player = { id, name } | null
 *   Returns true if this is a new global best for that level.
 */
const GLOBAL_KEY = 'wk-global-best'

function load() {
  try {
    return JSON.parse(localStorage.getItem(GLOBAL_KEY)) ?? {}
  } catch {
    return {}
  }
}

export function useBestScores() {
  const [scores, setScores] = useState(load)

  const scoresRef = useRef(scores)
  scoresRef.current = scores

  const recordScore = useCallback((levelId, moves, player = null) => {
    const current = scoresRef.current[levelId]
    const isNewBest = !current || moves < current.moves
    if (isNewBest) {
      setScores((prev) => {
        const next = {
          ...prev,
          [levelId]: {
            moves,
            playerId: player?.id ?? null,
            playerName: player?.name ?? null,
          },
        }
        try {
          localStorage.setItem(GLOBAL_KEY, JSON.stringify(next))
        } catch {}
        return next
      })
    }
    return isNewBest
  }, [])

  return { bestScores: scores, recordScore }
}
