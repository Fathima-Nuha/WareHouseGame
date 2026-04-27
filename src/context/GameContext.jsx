import { createContext, useContext, useReducer } from 'react'
import { movePlayer, extractPlayer, extractTargets, isWon } from '../utils/sokoban'

const GameContext = createContext(null)

const initialState = {
  grid: null,
  player: null,
  targets: [],
  moves: 0,
  history: [],       // each entry: { grid, player, moves }
  currentLevel: null,
  isWon: false,
}

function gameReducer(state, action) {
  switch (action.type) {

    case 'LOAD_LEVEL': {
      const { level } = action
      const grid = level.grid
      const player = extractPlayer(grid)
      const targets = extractTargets(grid)
      return {
        ...initialState,
        grid,
        player,
        targets,
        currentLevel: level,
      }
    }

    case 'MOVE': {
      if (!state.grid || state.isWon) return state

      const result = movePlayer(state.grid, state.player, action.dir)

      // movePlayer returns the same grid reference when the move is invalid
      if (result.grid === state.grid) return state

      return {
        ...state,
        grid: result.grid,
        player: result.player,
        moves: state.moves + 1,
        history: [
          ...state.history,
          { grid: state.grid, player: state.player, moves: state.moves },
        ],
        isWon: isWon(result.grid, state.targets),
      }
    }

    case 'UNDO': {
      if (state.history.length === 0) return state

      const prev = state.history[state.history.length - 1]
      return {
        ...state,
        grid: prev.grid,
        player: prev.player,
        moves: prev.moves,
        history: state.history.slice(0, -1),
        isWon: false,
      }
    }

    case 'RESET': {
      if (!state.currentLevel) return state

      const grid = state.currentLevel.grid
      const player = extractPlayer(grid)
      return {
        ...state,
        grid,
        player,
        moves: 0,
        history: [],
        isWon: false,
      }
    }

    default:
      return state
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState)

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  )
}

export function useGameContext() {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGameContext must be used within a GameProvider')
  return ctx
}
