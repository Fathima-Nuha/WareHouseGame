/**
 * usePlayers — manages named player profiles in localStorage.
 * Each player: { id, name, lastPassedLevel }
 * lastPassedLevel is the highest sequential level ID the player has beaten.
 * All levels up to and including lastPassedLevel are unlocked for that player.
 */
import { useState, useCallback } from 'react'

const STORAGE_KEY = 'wk-players'

function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? []
  } catch {
    return []
  }
}

function save(players) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(players))
  } catch {}
}

export function usePlayers() {
  const [players, setPlayers] = useState(load)

  const addPlayer = useCallback((name) => {
    const trimmed = name.trim()
    if (!trimmed) return null
    setPlayers((prev) => {
      // Prevent duplicates (case-insensitive)
      if (prev.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) return prev
      const next = [...prev, { id: `player_${Date.now()}`, name: trimmed, lastPassedLevel: 0 }]
      save(next)
      return next
    })
    return trimmed
  }, [])

  const removePlayer = useCallback((id) => {
    setPlayers((prev) => {
      const next = prev.filter((p) => p.id !== id)
      save(next)
      return next
    })
  }, [])

  // Update the furthest level a player has beaten.
  // Only advances forward — never reduces lastPassedLevel.
  const updateProgress = useCallback((id, levelId) => {
    setPlayers((prev) => {
      const player = prev.find((p) => p.id === id)
      if (!player || levelId <= (player.lastPassedLevel ?? 0)) return prev
      const next = prev.map((p) =>
        p.id === id ? { ...p, lastPassedLevel: levelId } : p
      )
      save(next)
      return next
    })
  }, [])

  return { players, addPlayer, removePlayer, updateProgress }
}
