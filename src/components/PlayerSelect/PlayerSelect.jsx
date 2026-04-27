import { useState, useRef, useEffect } from 'react'
import styles from './PlayerSelect.module.css'

function PlayerSelect({ players, onSelect, onAdd, onRemove }) {
  const [newName, setNewName] = useState('')
  const [error, setError]     = useState('')
  const inputRef              = useRef(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  function handleAdd(e) {
    e.preventDefault()
    const trimmed = newName.trim()
    if (!trimmed) { setError('Please enter a name.'); return }
    if (players.some((p) => p.name.toLowerCase() === trimmed.toLowerCase())) {
      setError('That name is already taken.')
      return
    }
    onAdd(trimmed)
    setNewName('')
    setError('')
  }

  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>🏭 Warehouse Keeper</h1>
      <p className={styles.subtitle}>Who&rsquo;s playing today?</p>

      {/* ── Player list ───────────────────────────────────────── */}
      {players.length > 0 ? (
        <ul className={styles.playerList} aria-label="Player profiles">
          {players.map((p) => (
            <li key={p.id} className={styles.playerItem}>
              <button
                className={styles.playerBtn}
                onClick={() => onSelect(p)}
                aria-label={`Play as ${p.name}`}
              >
                <span className={styles.playerAvatar}>🙂</span>
                <span className={styles.playerName}>{p.name}</span>
                <span className={styles.playerCta}>▶ Play</span>
              </button>
              <button
                className={styles.deleteBtn}
                onClick={() => onRemove(p.id)}
                aria-label={`Delete player ${p.name}`}
                title="Delete player"
              >
                🗑
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className={styles.empty}>No players yet. Add one below to get started!</p>
      )}

      {/* ── Add new player ────────────────────────────────────── */}
      <form className={styles.addForm} onSubmit={handleAdd} noValidate>
        <h2 className={styles.addTitle}>Add New Player</h2>
        <div className={styles.inputRow}>
          <input
            ref={inputRef}
            className={styles.input}
            type="text"
            maxLength={20}
            placeholder="Enter player name…"
            value={newName}
            onChange={(e) => { setNewName(e.target.value); setError('') }}
            aria-label="New player name"
          />
          <button type="submit" className={styles.addBtn}>Add</button>
        </div>
        {error && <p className={styles.error}>{error}</p>}
      </form>
    </div>
  )
}

export default PlayerSelect
