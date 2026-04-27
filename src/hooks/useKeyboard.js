import { useEffect } from 'react'

const KEY_MAP = {
  ArrowUp:    'up',
  ArrowDown:  'down',
  ArrowLeft:  'left',
  ArrowRight: 'right',
  w: 'up',
  s: 'down',
  a: 'left',
  d: 'right',
  W: 'up',
  S: 'down',
  A: 'left',
  D: 'right',
}

/**
 * Listens for keyboard input and calls the move callback.
 * Attach once at the game screen level.
 * @param {function} onMove - called with direction string: 'up'|'down'|'left'|'right'
 * @param {boolean} enabled - set false to disable (e.g. when win modal is open)
 */
function useKeyboard(onMove, enabled = true) {
  useEffect(() => {
    if (!enabled) return

    function handleKeyDown(e) {
      const dir = KEY_MAP[e.key]
      if (!dir) return
      e.preventDefault()   // prevent page scroll on arrow keys
      onMove(dir)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onMove, enabled])
}

export default useKeyboard
