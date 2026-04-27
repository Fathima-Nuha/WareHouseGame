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
import curatedLevels from './levels/curatedLevels'
import { generateLevel, FIRST_GENERATED_LEVEL } from './utils/levelGenerator'
import { DEFAULT_CHARACTER } from './utils/characters'

function App() {
  const { state, loadLevel, move, undo, reset } = useGameEngine()
  const [screen, setScreen] = useState('levelSelect') // 'levelSelect' | 'game'
  const [playerChar, setPlayerChar] = useState(DEFAULT_CHARACTER)
  const { bestScores, recordScore } = useBestScores()
  const [isNewRecord, setIsNewRecord] = useState(false)

  // Record score once when the level is won; reset when starting a new attempt.
  const recordedKeyRef = useRef(null)
  useEffect(() => {
    if (!state.isWon || !state.currentLevel) {
      recordedKeyRef.current = null
      return
    }
    const key = `${state.currentLevel.id}:${state.moves}`
    if (recordedKeyRef.current === key) return // already handled this win
    recordedKeyRef.current = key
    setIsNewRecord(recordScore(state.currentLevel.id, state.moves))
  }, [state.isWon, state.currentLevel, state.moves, recordScore])

  function handleSelectLevel(level, char) {
    setPlayerChar(char)
    loadLevel(level)
    setScreen('game')
  }

  function handleBack() {
    setScreen('levelSelect')
  }

  function handleNextLevel() {
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
    reset()
  }

  const handleMove = useCallback((dir) => move(dir), [move])

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
        onUndo={undo}
        onReset={reset}
        onBack={handleBack}
      />

      <GameBoard grid={state.grid} playerEmoji={playerChar.emoji} />

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
