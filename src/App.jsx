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
import { generateLevel } from './utils/levelGenerator'
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
    if (state.currentLevel?.type === 'random') {
      // Extract the box count from the level name ("Random — N Box(es)")
      const match = state.currentLevel.name.match(/(\d+) [Bb]ox/)
      const boxCount = match ? parseInt(match[1], 10) : 2
      try {
        loadLevel(generateLevel(boxCount))
      } catch {
        // Generator exhausted — fall back to level select
        setScreen('levelSelect')
      }
      return
    }
    const currentIndex = curatedLevels.findIndex((l) => l.id === state.currentLevel?.id)
    const next = curatedLevels[currentIndex + 1]
    if (next) loadLevel(next)
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
