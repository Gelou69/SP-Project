import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const SFX_KEY = 'evquiz_sfx'

// ---- tiny procedural sound effects + ambient background music ----
// No audio files are needed: every sound is synthesized with the Web Audio
// API. Audio only starts after the user interacts (autoplay policy).

const AudioContextRef = createContext(null)

function createAudioEngine() {
  let ctx = null
  let master = null
  let musicGain = null
  let sfxGain = null
  let musicTimer = null
  let step = 0
  let sfxEnabled = true
  let musicEnabled = false
  let unlocked = false

  // Gentle, calm "science lab" loop over a pentatonic scale (C major-ish).
  const MELODY = [523.25, 587.33, 659.25, 783.99, 659.25, 587.33, 493.88, 523.25, 659.25, 783.99, 880, 783.99, 659.25, 587.33, 523.25, 440]
  const BASS = [130.81, 130.81, 146.83, 130.81, 164.81, 146.83, 130.81, 146.83]

  function ensureCtx() {
    if (!ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return null
      ctx = new AudioContext()
      master = ctx.createGain()
      master.gain.value = 0.9
      master.connect(ctx.destination)
      sfxGain = ctx.createGain()
      sfxGain.gain.value = 0.5
      sfxGain.connect(master)
      musicGain = ctx.createGain()
      musicGain.gain.value = 0.5
      musicGain.connect(master)
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
    return ctx
  }

  function tone({ freq, start = 0, dur = 0.15, type = 'sine', gain = 0.12, dest = null }) {
    const c = ensureCtx()
    if (!c) return
    const osc = c.createOscillator()
    const g = c.createGain()
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + start)
    const when = c.currentTime + start
    const peak = gain
    g.gain.setValueAtTime(0.0001, when)
    g.gain.exponentialRampToValueAtTime(peak, when + 0.015)
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur)
    osc.connect(g)
    g.connect(dest || sfxGain)
    osc.start(when)
    osc.stop(when + dur + 0.05)
  }

  const SFX = {
    click: () => tone({ freq: 700, dur: 0.06, type: 'triangle', gain: 0.15 }),
    tick: () => tone({ freq: 520, dur: 0.04, type: 'square', gain: 0.05 }),
    correct: () => {
      tone({ freq: 523.25, dur: 0.12, type: 'triangle', gain: 0.2 })
      tone({ freq: 659.25, dur: 0.12, start: 0.11, type: 'triangle', gain: 0.2 })
      tone({ freq: 783.99, dur: 0.18, start: 0.22, type: 'triangle', gain: 0.22 })
    },
    wrong: () => {
      tone({ freq: 200, dur: 0.22, type: 'sawtooth', gain: 0.12 })
      tone({ freq: 140, dur: 0.3, start: 0.1, type: 'sawtooth', gain: 0.12 })
    },
    timeup: () => {
      tone({ freq: 300, dur: 0.2, type: 'square', gain: 0.1 })
      tone({ freq: 180, dur: 0.35, start: 0.16, type: 'square', gain: 0.1 })
    },
    notify: () => {
      tone({ freq: 660, dur: 0.09, type: 'sine', gain: 0.15 })
      tone({ freq: 660, dur: 0.09, start: 0.1, type: 'sine', gain: 0.15 })
    },
    unlock: () => {
      ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
        tone({ freq: f, dur: 0.18, start: i * 0.12, type: 'triangle', gain: 0.18 })
      )
    },
    complete: () => {
      ;[523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) =>
        tone({ freq: f, dur: 0.22, start: i * 0.14, type: 'triangle', gain: 0.16 })
      )
    },
  }

  function playSfx(name) {
    if (!sfxEnabled || !unlocked) return
    const c = ensureCtx()
    if (!c || c.state !== 'running') return
    const fn = SFX[name]
    if (fn) fn()
  }

  function startMusic() {
    if (!unlocked) return
    const c = ensureCtx()
    if (!c) return
    stopMusic()
    step = 0
    musicTimer = setInterval(() => {
      if (!musicEnabled || !ctx) return
      const note = MELODY[step % MELODY.length]
      const bass = BASS[Math.floor(step / 2) % BASS.length]
      tone({ freq: note, dur: 0.34, type: 'sine', gain: 0.06, dest: musicGain })
      if (step % 2 === 0) tone({ freq: bass, dur: 0.6, type: 'sine', gain: 0.05, dest: musicGain })
      step += 1
    }, 420)
  }

  function stopMusic() {
    if (musicTimer) {
      clearInterval(musicTimer)
      musicTimer = null
    }
  }

  function unlock() {
    unlocked = true
    ensureCtx()
  }

  function setSfx(on) {
    sfxEnabled = on
    localStorage.setItem(SFX_KEY, on ? '1' : '0')
  }

  function setQuizMusic(on) {
    musicEnabled = on
    if (on) startMusic()
    else stopMusic()
  }

  return { playSfx, setSfx, setQuizMusic, unlock }
}

export function AudioProvider({ children }) {
  const engineRef = useRef(null)
  const [sfx, setSfxState] = useState(() => localStorage.getItem(SFX_KEY) !== '0')
  const [music, setMusicState] = useState(false)

  const getEngine = useCallback(() => {
    if (!engineRef.current) engineRef.current = createAudioEngine()
    return engineRef.current
  }, [])

  useEffect(() => {
    const unlock = () => getEngine().unlock()
    window.addEventListener('pointerdown', unlock, { once: false })
    window.addEventListener('keydown', unlock, { once: false })
    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('keydown', unlock)
    }
  }, [getEngine])

  useEffect(() => {
    getEngine().setSfx(sfx)
  }, [sfx, getEngine])

  const playSfx = useCallback(
    (name) => {
      const e = getEngine()
      e.unlock()
      e.playSfx(name)
    },
    [getEngine]
  )

  const toggleSfx = useCallback(() => setSfxState((v) => !v), [])
  const startQuizMusic = useCallback(() => {
    const e = getEngine()
    e.unlock()
    e.setQuizMusic(true)
    setMusicState(true)
  }, [getEngine])

  const stopQuizMusic = useCallback(() => {
    getEngine().setQuizMusic(false)
    setMusicState(false)
  }, [getEngine])

  return (
    <AudioContextRef.Provider value={{ sfx, music, playSfx, toggleSfx, startQuizMusic, stopQuizMusic }}>
      {children}
    </AudioContextRef.Provider>
  )
}

export function useAudio() {
  return useContext(AudioContextRef)
}