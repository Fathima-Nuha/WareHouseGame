import styles from './Cell.module.css'

const CELL_META = {
  '#': { className: 'wall',           label: '🧱', ariaLabel: 'wall',            isPlayer: false },
  ' ': { className: 'floor',          label: '',   ariaLabel: 'floor',           isPlayer: false },
  '@': { className: 'player',         label: null, ariaLabel: 'player',          isPlayer: true  },
  '$': { className: 'box',            label: '📦', ariaLabel: 'crate',           isPlayer: false },
  '.': { className: 'target',         label: '🔲', ariaLabel: 'target',          isPlayer: false },
  '*': { className: 'boxOnTarget',    label: '✅', ariaLabel: 'crate on target', isPlayer: false },
  '+': { className: 'playerOnTarget', label: null, ariaLabel: 'player on target',isPlayer: true  },
}

const DEFAULT_PLAYER_EMOJI = '🧍'

function Cell({ type, playerEmoji }) {
  const meta = CELL_META[type] ?? CELL_META[' ']
  const label = meta.isPlayer ? (playerEmoji ?? DEFAULT_PLAYER_EMOJI) : meta.label
  return (
    <div
      className={`${styles.cell} ${styles[meta.className]}`}
      role="img"
      aria-label={meta.ariaLabel}
    >
      {label}
    </div>
  )
}

export default Cell
