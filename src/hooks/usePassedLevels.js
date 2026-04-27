/**
 * usePassedLevels — tracks the furthest level a player has beaten.
 * Since levels unlock sequentially (pass N → unlock N+1), storing the
 * highest passed level ID is sufficient to know which levels are open.
 *
 * Storage key: "wk-progress:<playerId>"
 * Storage value: single number (highest level id beaten, 0 = none yet)
 */
import { useState, useRef, useCallback } from 'react'

const key = (playerId) => (playerId ? `wk-progress:${playerId}` : 'wk-progress')

function load(playerId) {
  try {
    return parseInt(localStorage.getItem(key(playerId)), 10) || 0
  } catch {
    return 0
  }
}

export function usePassedLevels(playerId = null) {
  const [highestPassed, setHighestPassed] = useState(() => load(playerId))

  // Reset when active player changes
  const prevRef = useRef(playerId)
  if (prevRef.current !== playerId) {
    prevRef.current = playerId
    // eslint-disable-next-line react-hooks/rules-of-hooks -- intentional derived-state reset
    setHighestPassed(load(playerId))
  }

  const markPassed = useCallback((levelId) => {
    setHighestPassed((prev) => {
      if (levelId <= prev) return prev          // already beyond this level
      try {
        localStorage.setItem(key(playerId), String(levelId))
      } catch {}
      return levelId
    })
  }, [playerId])

  return { highestPassed, markPassed }
}
