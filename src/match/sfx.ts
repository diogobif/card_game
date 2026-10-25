// Synthesized sound effects (Web Audio), so the game ships no audio files.

const MUTE_KEY = 'card-game:muted'

let ctx: AudioContext | null = null
let noise: AudioBuffer | null = null
let muted = readMuted()
const listeners = new Set<() => void>()

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export function isMuted(): boolean {
  return muted
}

export function setMuted(value: boolean) {
  muted = value
  try {
    localStorage.setItem(MUTE_KEY, value ? '1' : '0')
  } catch {
    // Storage blocked: the choice lasts for this page only.
  }
  listeners.forEach((l) => l())
}

export function subscribeMuted(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** Browsers only allow audio after a user gesture; call this from one (any click on the board). */
export function unlockAudio() {
  if (!ctx) {
    try {
      ctx = new AudioContext()
    } catch {
      return
    }
  }
  if (ctx.state === 'suspended') void ctx.resume()
}

function audio(): AudioContext | null {
  if (muted || !ctx || ctx.state !== 'running') return null
  return ctx
}

function noiseBuffer(ac: AudioContext): AudioBuffer {
  if (!noise) {
    noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
    const data = noise.getChannelData(0)
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  }
  return noise
}

/** A gain node with a fast attack and exponential decay, wired to the speakers. */
function envelope(ac: AudioContext, start: number, peak: number, attack: number, decay: number): GainNode {
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(peak, start + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + attack + decay)
  gain.connect(ac.destination)
  return gain
}

function noiseBurst(ac: AudioContext, start: number, duration: number, filter: BiquadFilterNode, out: AudioNode) {
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.connect(filter)
  filter.connect(out)
  src.start(start, Math.random() * 0.5, duration)
}

/** Air rushing past: band-passed noise sweeping upward. */
export function playWhoosh() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const filter = ac.createBiquadFilter()
  filter.type = 'bandpass'
  filter.Q.value = 1.2
  filter.frequency.setValueAtTime(350, t)
  filter.frequency.exponentialRampToValueAtTime(2400, t + 0.24)
  noiseBurst(ac, t, 0.3, filter, envelope(ac, t, 0.35, 0.12, 0.18))
}

/** The hit: a falling sub thump under a short crack. */
export function playImpact(heavy: boolean) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(heavy ? 170 : 220, t)
  osc.frequency.exponentialRampToValueAtTime(45, t + 0.22)
  osc.connect(envelope(ac, t, heavy ? 0.9 : 0.6, 0.005, 0.3))
  osc.start(t)
  osc.stop(t + 0.35)
  const crack = ac.createBiquadFilter()
  crack.type = 'lowpass'
  crack.frequency.value = 2600
  noiseBurst(ac, t, 0.08, crack, envelope(ac, t, 0.5, 0.002, 0.07))
}

/** Breaking glass: bright noise grains plus a few ringing high partials. */
export function playShatter(volume = 1) {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  for (let i = 0; i < 9; i++) {
    const at = t + Math.random() * 0.28
    const hp = ac.createBiquadFilter()
    hp.type = 'highpass'
    hp.frequency.value = 2500 + Math.random() * 3500
    noiseBurst(ac, at, 0.06, hp, envelope(ac, at, 0.28 * volume, 0.002, 0.05 + Math.random() * 0.08))
  }
  for (let i = 0; i < 5; i++) {
    const at = t + Math.random() * 0.2
    const osc = ac.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = 1800 + Math.random() * 2600
    osc.connect(envelope(ac, at, 0.07 * volume, 0.002, 0.25 + Math.random() * 0.3))
    osc.start(at)
    osc.stop(at + 0.7)
  }
}

/** Life points lost: a short descending blip. */
export function playLifeHit() {
  const ac = audio()
  if (!ac) return
  const t = ac.currentTime
  const osc = ac.createOscillator()
  osc.type = 'square'
  osc.frequency.setValueAtTime(330, t)
  osc.frequency.exponentialRampToValueAtTime(110, t + 0.25)
  const lp = ac.createBiquadFilter()
  lp.type = 'lowpass'
  lp.frequency.value = 1400
  osc.connect(lp)
  lp.connect(envelope(ac, t, 0.18, 0.005, 0.28))
  osc.start(t)
  osc.stop(t + 0.35)
}
