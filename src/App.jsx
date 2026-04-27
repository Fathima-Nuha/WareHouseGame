import { useState, useCallback, useEffect, useRef } from 'react'
import styles from './App.module.css'
import GameBoard from './components/GameBoard/GameBoard'
import HUD from './components/HUD/HUD'
import DPad from './components/DPad/DPad'
import LevelSelect from './components/LevelSelect/LevelSelect'
import WinModal from './components/WinModal/WinModal'
import { useGameEngine } from './hooks/useGameEngine'
import useKeyboard from './hooks/useKeyboard'
import { useBestScores } from './hooks/useBestScores'
import { useSounds } from './hooks/useSounds'
import curatedLevels from './levels/curatedLevels'
import { generateLevel, FIRST_GENERATED_LEVEL } from './utils/levelGenerator'
import { DEFAULT_CHARACTER } from './utils/characters'
import { movePlayer, isWon, CELL } from './utils/sokoban'

function App() {
  const { state, loadLevel, move, undo, reset } = useGameEngine()
  const [screen, setScreen] = useState('levelSelect') // 'levelSelect' | 'game'
  const [playerChar, setPlayerChar] = useState(DEFAULT_CHARACTER)
  const { bestScores, recordScore } = useBestScores()
  const [isNewRecord, setIsNewRecord] = useState(false)
  const { playStep, playPush, playLand, playWin, playUndo, playSelect, playBack, playNext, playReset, playGameStart, startBgMusic, stopBgMusic } = useSounds()

  // Background music: play on level-select, stop when game starts
  useEffect(() => {
    if (screen === 'levelSelect') {
      startBgMusic()
    } else {
      stopBgMusic()
    }
    return () => stopBgMusic()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [screen])

  // Record score + win sound once when level is won
  const recordedKeyRef = useRef(null)
  useEffect(() => {
    if (!state.isWon || !state.currentLevel) {
      recordedKeyRef.current = null
      return
    }
    const key = `${state.currentLevel.id}:${state.moves}`
    if (recordedKeyRef.current === key) return
    recordedKeyRef.current = key
    setIsNewRecord(recordScore(state.currentLevel.id, state.moves))
    playWin()
  }, [state.isWon, state.currentLevel, state.moves, recordScore, playWin])

  function handleSelectLevel(level, char) {
    setPlayerChar(char)
    loadLevel(level)
    setScreen('game')
    playSelect()
    playGameStart()
  }

  function handleBack() {
    playBack()
    setScreen('levelSelect')
  }

  function handleNextLevel() {
    playNext()
    const level = state.currentLevel
    if (!level) return

    if (level.type === 'generated') {
      try {
        loadLevel(generateLevel(level.id + 1))
      } catch {
        setScreen('levelSelect')
      }
      return
    }

    // Curated level: advance to next curated, or begin generated sequence
    const currentIndex = curatedLevels.findIndex((l) => l.id === level.id)
    if (currentIndex !== -1 && currentIndex < curatedLevels.length - 1) {
      loadLevel(curatedLevels[currentIndex + 1])
    } else {
      try {
        loadLevel(generateLevel(FIRST_GENERATED_LEVEL))
      } catch {
        setScreen('levelSelect')
      }
    }
  }

  function handleReplay() {
    playReset()
    reset()
  }

  const handleMove = useCallback((dir) => {
    if (!state.grid || !state.player || state.isWon) return
    // Peek at what the move will do before dispatching
    const destRow = state.player.row + (dir === 'down' ? 1 : dir === 'up' ? -1 : 0)
    const destCol = state.player.col + (dir === 'right' ? 1 : dir === 'left' ? -1 : 0)
    const destCell = state.grid[destRow]?.[destCol]
    const isPush = destCell === CELL.BOX || destCell === CELL.BOX_ON_TARGET
    const result = movePlayer(state.grid, state.player, dir)
    if (result.grid === state.grid) return // invalid move, no sound
    if (isPush) {
      // check if the box landed on a target
      const dr = dir === 'down' ? 1 : dir === 'up' ? -1 : 0
      const dc = dir === 'right' ? 1 : dir === 'left' ? -1 : 0
      const boxDest = result.grid[destRow + dr]?.[destCol + dc]
      if (boxDest === CELL.BOX_ON_TARGET) playLand(playerChar.id)
      else playPush(playerChar.id)
    } else {
      playStep(playerChar.id)
    }
    move(dir)
  }, [state.grid, state.player, state.isWon, move, playerChar.id, playStep, playPush, playLand])

  const [showHint, setShowHint] = useState(true)

  // Hide hint once the player makes their first move
  const prevMoves = useRef(0)
  useEffect(() => {
    if (state.moves > 0 && showHint) setShowHint(false)
    prevMoves.current = state.moves
  }, [state.moves, showHint])

  // Reset hint when a new level loads
  useEffect(() => { setShowHint(true) }, [state.currentLevel?.id])

  // Keyboard active only on game screen when not won
  useKeyboard(handleMove, screen === 'game' && !state.isWon)

  if (screen === 'levelSelect') {
    return <LevelSelect onSelectLevel={handleSelectLevel} bestScores={bestScores} />
  }

  return (
    <div className={styles.app}>
      <h1 className={styles.title}>🏭 Warehouse Keeper</h1>

      <HUD
        levelName={state.currentLevel?.name ?? ''}
        moves={state.moves}
        canUndo={state.history.length > 0}
        onUndo={() => { undo(); playUndo() }}
        onReset={() => { reset(); playReset() }}
        onBack={handleBack}
      />

      <GameBoard grid={state.grid} playerEmoji={playerChar.emoji} />

      {showHint && !state.isWon && (
        <div className={styles.hint}>
          <span className={styles.hintIcon}>💡</span>
          <span>
            Push <strong>📦 crates</strong> onto the <strong>🎯 marked spots</strong>
            &nbsp;— use arrow keys, WASD, or the D-pad below.
          </span>
          <button className={styles.hintClose} onClick={() => setShowHint(false)} aria-label="Dismiss">✕</button>
        </div>
      )}

      <DPad onMove={handleMove} />

      {state.isWon && (
        <WinModal
          moves={state.moves}
          bestScore={bestScores[state.currentLevel?.id]}
          isNewRecord={isNewRecord}
          currentLevel={state.currentLevel}
          onNextLevel={handleNextLevel}
          onReplay={handleReplay}
          onBack={handleBack}
        />
      )}
    </div>
  )
}

export default App
