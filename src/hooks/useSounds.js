/**
 * useSounds — Web Audio API sound effects, no audio files required.
 * All sounds are synthesised from oscillators and noise.
 */

let ctx = null
function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  return ctx
}

function resumeCtx() {
  const c = getCtx()
  if (c.state === 'suspended') c.resume()
  return c
}

// ── Shared helpers ────────────────────────────────────────────────

function osc(ac, type, freq, start, duration, gainStart, gainEnd = 0) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(gainStart, start)
  g.gain.exponentialRampToValueAtTime(Math.max(gainEnd, 0.001), start + duration)
  o.connect(g)
  g.connect(ac.destination)
  o.start(start)
  o.stop(start + duration + 0.01)
}

function oscSlide(ac, type, freqFrom, freqTo, start, duration, gainStart) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = type
  o.frequency.setValueAtTime(freqFrom, start)
  o.frequency.exponentialRampToValueAtTime(freqTo, start + duration)
  g.gain.setValueAtTime(gainStart, start)
  g.gain.exponentialRampToValueAtTime(0.001, start + duration)
  o.connect(g)
  g.connect(ac.destination)
  o.start(start)
  o.stop(start + duration + 0.01)
}

// ── Individual sounds ─────────────────────────────────────────────

/** Soft step — varies by character */
function playStep(charId = 'worker') {
  const ac = resumeCtx()
  const t = ac.currentTime
  switch (charId) {
    case 'worker':    oscSlide(ac, 'sine',     280,  220, t, 0.07, 0.18); break
    case 'robot':     osc(ac, 'square',        380,       t, 0.05, 0.16); break
    case 'cat':       oscSlide(ac, 'sine',     700,  600, t, 0.04, 0.12); break
    case 'fox':       oscSlide(ac, 'sine',     450,  380, t, 0.05, 0.14); break
    case 'astronaut': osc(ac, 'sine',          900,       t, 0.04, 0.12); break
    case 'wizard':    osc(ac, 'sine',          660,       t, 0.05, 0.15); break
    case 'frog':      oscSlide(ac, 'triangle', 200,  160, t, 0.07, 0.18); break
    case 'ninja':     oscSlide(ac, 'sawtooth', 500,  200, t, 0.03, 0.10); break
    default:          oscSlide(ac, 'sine',     280,  220, t, 0.07, 0.18)
  }
}

/** Crate push — heavier, varies by character */
function playPush(charId = 'worker') {
  const ac = resumeCtx()
  const t = ac.currentTime
  switch (charId) {
    case 'worker':
      oscSlide(ac, 'triangle', 180, 100, t, 0.12, 0.35)
      osc(ac, 'sine', 95, t + 0.04, 0.1, 0.15)
      break
    case 'robot':
      osc(ac, 'square', 200, t, 0.1, 0.3)
      osc(ac, 'square', 140, t + 0.06, 0.08, 0.2)
      break
    case 'cat':
      oscSlide(ac, 'sine', 300, 200, t, 0.08, 0.25)
      oscSlide(ac, 'sine', 600, 400, t + 0.02, 0.05, 0.12)
      break
    case 'fox':
      oscSlide(ac, 'sawtooth', 260, 160, t, 0.10, 0.28)
      break
    case 'astronaut':
      osc(ac, 'sine', 180, t, 0.09, 0.28)
      osc(ac, 'sine', 360, t + 0.04, 0.06, 0.15)
      break
    case 'wizard':
      oscSlide(ac, 'sine', 400, 200, t, 0.11, 0.30)
      osc(ac, 'sine', 800, t, 0.05, 0.15)
      break
    case 'frog':
      oscSlide(ac, 'triangle', 160, 90, t, 0.13, 0.38)
      break
    case 'ninja':
      oscSlide(ac, 'sawtooth', 600, 150, t, 0.06, 0.20)
      break
    default:
      oscSlide(ac, 'triangle', 180, 100, t, 0.12, 0.35)
  }
}

/** Crate lands on target — positive chime, varies by character */
function playLand(charId = 'worker') {
  const ac = resumeCtx()
  const t = ac.currentTime
  switch (charId) {
    case 'worker':
      osc(ac, 'sine', 660, t, 0.15, 0.4)
      osc(ac, 'sine', 880, t + 0.05, 0.15, 0.25)
      break
    case 'robot':
      osc(ac, 'square', 880, t, 0.08, 0.3)
      osc(ac, 'square', 1100, t + 0.08, 0.06, 0.2)
      break
    case 'cat':
      osc(ac, 'sine', 1100, t, 0.12, 0.35)
      oscSlide(ac, 'sine', 1300, 1100, t + 0.06, 0.1, 0.2)
      break
    case 'fox':
      osc(ac, 'sine', 780, t, 0.12, 0.3)
      osc(ac, 'sine', 1040, t + 0.06, 0.1, 0.2)
      break
    case 'astronaut':
      [1200, 900, 1100].forEach((f, i) => osc(ac, 'sine', f, t + i * 0.07, 0.12, 0.3))
      break
    case 'wizard':
      [523, 659, 784, 1047].forEach((f, i) => osc(ac, 'sine', f, t + i * 0.06, 0.13, 0.3))
      break
    case 'frog':
      oscSlide(ac, 'triangle', 300, 200, t, 0.1, 0.3)
      osc(ac, 'sine', 600, t + 0.05, 0.08, 0.2)
      break
    case 'ninja':
      oscSlide(ac, 'sine', 1000, 600, t, 0.08, 0.25)
      break
    default:
      osc(ac, 'sine', 660, t, 0.15, 0.4)
      osc(ac, 'sine', 880, t + 0.05, 0.15, 0.25)
  }
}

/** Celebratory fanfare on level complete */
function playWin() {
  const ac = resumeCtx()
  const t = ac.currentTime
  const notes = [523, 659, 784, 1047]
  notes.forEach((f, i) => {
    osc(ac, 'sine', f, t + i * 0.12, 0.35, 0.5)
    osc(ac, 'triangle', f * 2, t + i * 0.12, 0.2, 0.15)
  })
}

/** Short undo "rewind" blip */
function playUndo() {
  const ac = resumeCtx()
  const t = ac.currentTime
  oscSlide(ac, 'sine', 400, 600, t, 0.1, 0.2)
}

/** Level select node tap */
function playSelect() {
  const ac = resumeCtx()
  const t = ac.currentTime
  osc(ac, 'sine', 740, t, 0.08, 0.3)
  osc(ac, 'sine', 990, t + 0.05, 0.07, 0.2)
}

/**
 * Per-character sounds — each has a distinct personality.
 * charId: 'worker' | 'robot' | 'cat' | 'fox' | 'astronaut' | 'wizard' | 'frog' | 'ninja'
 */
function playCharSelect(charId) {
  const ac = resumeCtx()
  const t = ac.currentTime
  switch (charId) {
    case 'worker':
      // Deep confident thud + whistle
      oscSlide(ac, 'triangle', 200, 140, t, 0.1, 0.35)
      oscSlide(ac, 'sine', 900, 700, t + 0.05, 0.18, 0.22)
      break
    case 'robot':
      // Robotic square-wave beep sequence
      osc(ac, 'square', 440, t,        0.07, 0.22)
      osc(ac, 'square', 660, t + 0.09, 0.07, 0.18)
      osc(ac, 'square', 550, t + 0.17, 0.07, 0.15)
      break
    case 'cat':
      // Soft rising mew
      oscSlide(ac, 'sine', 600, 1100, t, 0.22, 0.2)
      osc(ac, 'sine', 1100, t + 0.2, 0.08, 0.1)
      break
    case 'fox':
      // Playful quick yip — fast slide up then down
      oscSlide(ac, 'sawtooth', 400, 900, t,       0.1, 0.25)
      oscSlide(ac, 'sawtooth', 900, 500, t + 0.1, 0.1, 0.15)
      break
    case 'astronaut':
      // Space radio blip — two clean sine pulses
      osc(ac, 'sine', 1200, t,        0.06, 0.3)
      osc(ac, 'sine', 800,  t + 0.1,  0.06, 0.25)
      osc(ac, 'sine', 1000, t + 0.2,  0.06, 0.2)
      break
    case 'wizard':
      // Sparkly arpeggio
      [523, 659, 784, 1047].forEach((f, i) =>
        osc(ac, 'sine', f, t + i * 0.07, 0.14, 0.28))
      break
    case 'frog':
      // Ribbit — low blurp + harmonic
      oscSlide(ac, 'triangle', 140, 100, t,       0.12, 0.4)
      oscSlide(ac, 'triangle', 280, 200, t + 0.04, 0.08, 0.2)
      break
    case 'ninja':
      // Silent swish — very short noise-like click
      oscSlide(ac, 'sawtooth', 800, 200, t, 0.06, 0.18)
      break
    default:
      playSelect()
  }
}

/** Back / exit — descending soft tone */
function playBack() {
  const ac = resumeCtx()
  const t = ac.currentTime
  oscSlide(ac, 'sine', 500, 320, t, 0.14, 0.25)
}

/** Next level — quick ascending pair */
function playNext() {
  const ac = resumeCtx()
  const t = ac.currentTime
  osc(ac, 'sine', 660, t, 0.09, 0.35)
  osc(ac, 'sine', 880, t + 0.08, 0.1, 0.3)
}

/** Game-start fanfare — staccato run G4→C5→E5→G5 then full C major chord hit */
function playGameStart() {
  const ac = resumeCtx()
  const t = ac.currentTime
  // Quick ascending run: G4 C5 E5 G5
  const run = [391.99, 523.25, 659.25, 783.99]
  const step = 0.11
  run.forEach((freq, i) => {
    const at = t + i * step
    osc(ac, 'triangle', freq,     at, step * 0.75, 0.20)
    osc(ac, 'sine',     freq * 2, at, step * 0.50, 0.07)  // shimmer
  })
  // Triumphant final chord: C5 E5 G5 C6 + bass C3
  const hit = t + run.length * step   // ~t + 0.44
  osc(ac, 'sine',     1046.50, hit, 0.90, 0.26)  // C6 lead
  osc(ac, 'triangle', 1046.50, hit, 0.90, 0.13)  // C6 warm body
  osc(ac, 'sine',      783.99, hit, 0.85, 0.13)  // G5
  osc(ac, 'sine',      659.25, hit, 0.85, 0.11)  // E5
  osc(ac, 'sine',      523.25, hit, 0.85, 0.10)  // C5
  osc(ac, 'sine',      261.63, hit, 0.75, 0.15)  // C4
  osc(ac, 'sine',      130.81, hit, 0.60, 0.14)  // C3 sub-bass
  osc(ac, 'sine',     2093.00, hit + 0.04, 0.20, 0.07)  // C7 sparkle
}

/** Reset / replay — short neutral tick-tick */
function playReset() {
  const ac = resumeCtx()
  const t = ac.currentTime
  osc(ac, 'square', 300, t,        0.05, 0.18)
  osc(ac, 'square', 300, t + 0.07, 0.05, 0.18)
}

// ── Background music ──────────────────────────────────────────────
// Proper 4-bar looping melody in C major at 120 BPM
// beat = 0.5s | bar = 2s | phrase = 8s

const BG_PHRASE_DUR = 8.0

// Flat note schedule for one phrase. tp: 'mel' | 'bass' | 'pad'
// All times are relative to phrase start.
const BG_PHRASE = [
  // ── Bar 1 (t=0–2): C major bounce ────────────────────────────────
  { tp:'mel',  f:523.25, t:0.00, d:0.50, g:0.10 },   // C5 ♩
  { tp:'mel',  f:659.25, t:0.50, d:0.25, g:0.09 },   // E5 ♪
  { tp:'mel',  f:783.99, t:0.75, d:0.25, g:0.09 },   // G5 ♪
  { tp:'mel',  f:880.00, t:1.00, d:0.50, g:0.09 },   // A5 ♩
  { tp:'mel',  f:783.99, t:1.50, d:0.45, g:0.08 },   // G5 ♩
  { tp:'bass', f:130.81, t:0.00, d:1.70, g:0.08 },   // C3
  { tp:'pad',  f:261.63, t:0.00, d:1.80, g:0.025 },  // C4
  { tp:'pad',  f:392.00, t:0.00, d:1.80, g:0.025 },  // G4
  // ── Bar 2 (t=2–4): descend ───────────────────────────────────────
  { tp:'mel',  f:698.46, t:2.00, d:0.25, g:0.09 },   // F5 ♪
  { tp:'mel',  f:659.25, t:2.25, d:0.25, g:0.09 },   // E5 ♪
  { tp:'mel',  f:587.33, t:2.50, d:0.25, g:0.09 },   // D5 ♪
  { tp:'mel',  f:523.25, t:2.75, d:0.25, g:0.08 },   // C5 ♪
  { tp:'mel',  f:659.25, t:3.00, d:0.50, g:0.10 },   // E5 ♩
  { tp:'mel',  f:783.99, t:3.50, d:0.45, g:0.09 },   // G5 ♩
  { tp:'bass', f:174.61, t:2.00, d:1.70, g:0.08 },   // F3
  { tp:'pad',  f:349.23, t:2.00, d:1.80, g:0.025 },  // F4
  { tp:'pad',  f:440.00, t:2.00, d:1.80, g:0.025 },  // A4
  // ── Bar 3 (t=4–6): ascending run + hold ──────────────────────────
  { tp:'mel',  f:523.25, t:4.00, d:0.25, g:0.09 },   // C5 ♪
  { tp:'mel',  f:587.33, t:4.25, d:0.25, g:0.09 },   // D5 ♪
  { tp:'mel',  f:659.25, t:4.50, d:0.25, g:0.09 },   // E5 ♪
  { tp:'mel',  f:698.46, t:4.75, d:0.25, g:0.09 },   // F5 ♪
  { tp:'mel',  f:783.99, t:5.00, d:0.95, g:0.11 },   // G5 ♩♩ held
  { tp:'bass', f:130.81, t:4.00, d:1.70, g:0.08 },   // C3
  { tp:'pad',  f:261.63, t:4.00, d:1.80, g:0.025 },  // C4
  { tp:'pad',  f:329.63, t:4.00, d:1.80, g:0.025 },  // E4
  // ── Bar 4 (t=6–8): descend + resolve ─────────────────────────────
  { tp:'mel',  f:880.00, t:6.00, d:0.25, g:0.09 },   // A5 ♪
  { tp:'mel',  f:783.99, t:6.25, d:0.25, g:0.09 },   // G5 ♪
  { tp:'mel',  f:698.46, t:6.50, d:0.25, g:0.09 },   // F5 ♪
  { tp:'mel',  f:659.25, t:6.75, d:0.25, g:0.09 },   // E5 ♪
  { tp:'mel',  f:523.25, t:7.00, d:0.95, g:0.12 },   // C5 ♩♩ resolve
  { tp:'bass', f:196.00, t:6.00, d:1.70, g:0.08 },   // G3
  { tp:'pad',  f:293.66, t:6.00, d:1.80, g:0.025 },  // D4
  { tp:'pad',  f:392.00, t:6.00, d:1.80, g:0.025 },  // G4
]
BG_PHRASE.sort((a, b) => a.t - b.t)

let bgInterval    = null
let bgMasterGain  = null
let bgNoteIdx     = 0
let bgPhraseStart = -1

function _bgNote(ac, n, at) {
  const o = ac.createOscillator()
  const g = ac.createGain()
  o.type = n.tp === 'mel' ? 'triangle' : 'sine'
  o.frequency.setValueAtTime(n.f, at)
  const atk = Math.min(0.04, n.d * 0.15)
  g.gain.setValueAtTime(0.001, at)
  g.gain.linearRampToValueAtTime(n.g, at + atk)
  g.gain.setValueAtTime(n.g, at + n.d * 0.55)
  g.gain.exponentialRampToValueAtTime(0.001, at + n.d * (n.d >= 0.5 ? 0.95 : 0.88))
  o.connect(g); g.connect(bgMasterGain)
  o.start(at); o.stop(at + n.d + 0.06)
  // Melody: add a soft octave-up sine for a music-box bell tone
  if (n.tp === 'mel') {
    const oh = ac.createOscillator()
    const gh = ac.createGain()
    oh.type = 'sine'
    oh.frequency.setValueAtTime(n.f * 2, at)
    gh.gain.setValueAtTime(0.001, at)
    gh.gain.linearRampToValueAtTime(n.g * 0.28, at + 0.02)
    gh.gain.exponentialRampToValueAtTime(0.001, at + n.d * 0.55)
    oh.connect(gh); gh.connect(bgMasterGain)
    oh.start(at); oh.stop(at + n.d * 0.6)
  }
}

function scheduleBg() {
  const ac = getCtx()
  if (!bgMasterGain) return
  if (ac.state === 'suspended') { bgPhraseStart = -1; bgNoteIdx = 0; return }
  const now = ac.currentTime
  if (bgPhraseStart < 0) bgPhraseStart = now
  const lookahead = now + 0.8
  let guard = 0
  while (guard++ < 120) {
    if (bgNoteIdx >= BG_PHRASE.length) { bgPhraseStart += BG_PHRASE_DUR; bgNoteIdx = 0 }
    const n = BG_PHRASE[bgNoteIdx]
    const at = bgPhraseStart + n.t
    if (at > lookahead) break
    _bgNote(ac, n, at)
    bgNoteIdx++
  }
}

function startBgMusic() {
  if (bgInterval) return
  const ac = resumeCtx()
  bgMasterGain = ac.createGain()
  bgMasterGain.gain.setValueAtTime(0.001, ac.currentTime)
  bgMasterGain.gain.linearRampToValueAtTime(1, ac.currentTime + 2.5)  // 2.5s fade-in
  bgMasterGain.connect(ac.destination)
  bgNoteIdx = 0
  bgPhraseStart = -1
  scheduleBg()
  bgInterval = setInterval(scheduleBg, 200)
}

function stopBgMusic() {
  if (bgInterval) { clearInterval(bgInterval); bgInterval = null }
  if (bgMasterGain) {
    const ac = getCtx()
    const node = bgMasterGain
    bgMasterGain = null
    try {
      node.gain.cancelScheduledValues(0)
      node.gain.setValueAtTime(1.0, ac.currentTime)
      node.gain.linearRampToValueAtTime(0.0001, ac.currentTime + 0.8)
      setTimeout(() => { try { node.disconnect() } catch (_) {} }, 1200)
    } catch (_) {}
  }
  bgPhraseStart = -1
  bgNoteIdx = 0
}

// ── Hook ─────────────────────────────────────────────────────────

export function useSounds() {
  return { playStep, playPush, playLand, playWin, playUndo, playSelect, playCharSelect, playBack, playNext, playReset, playGameStart, startBgMusic, stopBgMusic }
}
