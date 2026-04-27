import styles from './DPad.module.css'

const BUTTONS = [
  { dir: 'up',    label: '▲', gridArea: 'up'    },
  { dir: 'left',  label: '◀', gridArea: 'left'  },
  { dir: 'right', label: '▶', gridArea: 'right' },
  { dir: 'down',  label: '▼', gridArea: 'down'  },
]

function DPad({ onMove }) {
  return (
    <div className={styles.dpad} aria-label="Directional pad">
      {BUTTONS.map(({ dir, label, gridArea }) => (
        <button
          key={dir}
          className={styles.btn}
          style={{ gridArea }}
          aria-label={`Move ${dir}`}
          onPointerDown={(e) => {
            e.preventDefault()   // prevent focus stealing on mobile
            onMove(dir)
          }}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

export default DPad
