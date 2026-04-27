import { useGameContext } from '../context/GameContext'

/**
 * Primary hook for game interactions.
 * Exposes state and all dispatchable actions.
 */
export function useGameEngine() {
  const { state, dispatch } = useGameContext()

  /** Move the player in a direction: 'up' | 'down' | 'left' | 'right' */
  function move(dir) {
    dispatch({ type: 'MOVE', dir })
  }

  /** Undo the last move (pops history stack). */
  function undo() {
    dispatch({ type: 'UNDO' })
  }

  /** Reset the current level to its initial state. */
  function reset() {
    dispatch({ type: 'RESET' })
  }

  /**
   * Load a level object into the game.
   * Expected shape: { id, name, type: 'curated'|'random', grid: string[] }
   */
  function loadLevel(level) {
    dispatch({ type: 'LOAD_LEVEL', level })
  }

  return { state, move, undo, reset, loadLevel }
}
