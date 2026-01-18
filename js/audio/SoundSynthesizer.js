/**
 * @fileoverview Low-level synthesis utilities for 8-bit retro arcade sounds.
 *
 * Provides basic waveform generation, noise synthesis, and ADSR envelope
 * shaping using the Web Audio API.
 *
 * @module audio/SoundSynthesizer
 * @version 1.0.0
 */

// =============================================================================
// WAVEFORM TYPES
// =============================================================================

/**
 * Available oscillator waveform types.
 * @type {Object}
 */
export const WAVEFORMS = Object.freeze({
  SQUARE: 'square',
  SAWTOOTH: 'sawtooth',
  TRIANGLE: 'triangle',
  SINE: 'sine'
})

// =============================================================================
// SYNTHESIS UTILITIES
// =============================================================================

/**
 * Creates an oscillator node with specified parameters.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {string} type - Waveform type ('square', 'sawtooth', 'triangle', 'sine')
 * @param {number} frequency - Frequency in Hz
 * @returns {OscillatorNode}
 */
export function createOscillator(ctx, type, frequency) {
  const osc = ctx.createOscillator()
  osc.type = type
  osc.frequency.setValueAtTime(frequency, ctx.currentTime)
  return osc
}

/**
 * Creates a gain node with specified initial volume.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} [initialGain=1] - Initial gain value (0-1)
 * @returns {GainNode}
 */
export function createGain(ctx, initialGain = 1) {
  const gain = ctx.createGain()
  gain.gain.setValueAtTime(initialGain, ctx.currentTime)
  return gain
}

/**
 * Applies an ADSR envelope to a gain node.
 *
 * @param {GainNode} gainNode - The gain node to apply envelope to
 * @param {AudioContext} ctx - The audio context
 * @param {Object} envelope - ADSR envelope parameters
 * @param {number} envelope.attack - Attack time in seconds
 * @param {number} envelope.decay - Decay time in seconds
 * @param {number} envelope.sustain - Sustain level (0-1)
 * @param {number} envelope.release - Release time in seconds
 * @param {number} [peakLevel=1] - Peak level at end of attack
 */
export function applyEnvelope(gainNode, ctx, envelope, peakLevel = 1) {
  const now = ctx.currentTime
  const { attack, decay, sustain, release } = envelope

  // Start from 0
  gainNode.gain.setValueAtTime(0, now)

  // Attack: ramp to peak
  gainNode.gain.linearRampToValueAtTime(peakLevel, now + attack)

  // Decay: ramp to sustain level
  gainNode.gain.linearRampToValueAtTime(sustain * peakLevel, now + attack + decay)

  // Release: ramp to 0
  const releaseStart = now + attack + decay
  gainNode.gain.setValueAtTime(sustain * peakLevel, releaseStart)
  gainNode.gain.linearRampToValueAtTime(0, releaseStart + release)
}

/**
 * Creates a frequency sweep effect.
 *
 * @param {OscillatorNode} oscillator - The oscillator to sweep
 * @param {AudioContext} ctx - The audio context
 * @param {number} startFreq - Starting frequency in Hz
 * @param {number} endFreq - Ending frequency in Hz
 * @param {number} duration - Sweep duration in seconds
 */
export function applySweep(oscillator, ctx, startFreq, endFreq, duration) {
  const now = ctx.currentTime
  oscillator.frequency.setValueAtTime(startFreq, now)
  oscillator.frequency.exponentialRampToValueAtTime(Math.max(endFreq, 1), now + duration)
}

/**
 * Creates a white noise buffer.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} [duration=0.5] - Duration in seconds
 * @returns {AudioBuffer}
 */
export function createNoiseBuffer(ctx, duration = 0.5) {
  const sampleRate = ctx.sampleRate
  const bufferSize = sampleRate * duration
  const buffer = ctx.createBuffer(1, bufferSize, sampleRate)
  const output = buffer.getChannelData(0)

  for (let i = 0; i < bufferSize; i++) {
    output[i] = Math.random() * 2 - 1
  }

  return buffer
}

/**
 * Creates a noise source node.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} [duration=0.5] - Duration in seconds
 * @returns {AudioBufferSourceNode}
 */
export function createNoiseSource(ctx, duration = 0.5) {
  const buffer = createNoiseBuffer(ctx, duration)
  const source = ctx.createBufferSource()
  source.buffer = buffer
  return source
}

/**
 * Creates a low-pass filter for shaping noise/sounds.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} frequency - Cutoff frequency in Hz
 * @param {number} [q=1] - Q factor (resonance)
 * @returns {BiquadFilterNode}
 */
export function createLowPassFilter(ctx, frequency, q = 1) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.setValueAtTime(frequency, ctx.currentTime)
  filter.Q.setValueAtTime(q, ctx.currentTime)
  return filter
}

/**
 * Creates a high-pass filter for shaping sounds.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} frequency - Cutoff frequency in Hz
 * @param {number} [q=1] - Q factor (resonance)
 * @returns {BiquadFilterNode}
 */
export function createHighPassFilter(ctx, frequency, q = 1) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'highpass'
  filter.frequency.setValueAtTime(frequency, ctx.currentTime)
  filter.Q.setValueAtTime(q, ctx.currentTime)
  return filter
}

/**
 * Creates a bandpass filter for specific frequency ranges.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {number} frequency - Center frequency in Hz
 * @param {number} [q=1] - Q factor (bandwidth)
 * @returns {BiquadFilterNode}
 */
export function createBandPassFilter(ctx, frequency, q = 1) {
  const filter = ctx.createBiquadFilter()
  filter.type = 'bandpass'
  filter.frequency.setValueAtTime(frequency, ctx.currentTime)
  filter.Q.setValueAtTime(q, ctx.currentTime)
  return filter
}

/**
 * Plays a simple tone with envelope.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {GainNode} masterGain - Master gain node
 * @param {Object} options - Tone options
 * @param {string} options.waveform - Waveform type
 * @param {number} options.frequency - Frequency in Hz
 * @param {Object} options.envelope - ADSR envelope
 * @param {number} [options.volume=0.3] - Volume level
 */
export function playTone(ctx, masterGain, options) {
  const { waveform, frequency, envelope, volume = 0.3 } = options

  const osc = createOscillator(ctx, waveform, frequency)
  const gain = createGain(ctx, 0)

  osc.connect(gain)
  gain.connect(masterGain)

  applyEnvelope(gain, ctx, envelope, volume)

  const duration = envelope.attack + envelope.decay + envelope.release
  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration + 0.01)
}

/**
 * Plays noise with envelope and filter.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {GainNode} masterGain - Master gain node
 * @param {Object} options - Noise options
 * @param {Object} options.envelope - ADSR envelope
 * @param {number} [options.filterFreq=2000] - Low-pass filter frequency
 * @param {number} [options.volume=0.2] - Volume level
 */
export function playNoise(ctx, masterGain, options) {
  const { envelope, filterFreq = 2000, volume = 0.2 } = options

  const duration = envelope.attack + envelope.decay + envelope.release + 0.1
  const noise = createNoiseSource(ctx, duration)
  const filter = createLowPassFilter(ctx, filterFreq)
  const gain = createGain(ctx, 0)

  noise.connect(filter)
  filter.connect(gain)
  gain.connect(masterGain)

  applyEnvelope(gain, ctx, envelope, volume)

  noise.start(ctx.currentTime)
  noise.stop(ctx.currentTime + duration + 0.01)
}

/**
 * Plays a frequency sweep tone.
 *
 * @param {AudioContext} ctx - The audio context
 * @param {GainNode} masterGain - Master gain node
 * @param {Object} options - Sweep options
 * @param {string} options.waveform - Waveform type
 * @param {number} options.startFreq - Starting frequency
 * @param {number} options.endFreq - Ending frequency
 * @param {Object} options.envelope - ADSR envelope
 * @param {number} [options.volume=0.3] - Volume level
 */
export function playSweep(ctx, masterGain, options) {
  const { waveform, startFreq, endFreq, envelope, volume = 0.3 } = options

  const osc = createOscillator(ctx, waveform, startFreq)
  const gain = createGain(ctx, 0)

  osc.connect(gain)
  gain.connect(masterGain)

  const duration = envelope.attack + envelope.decay + envelope.release
  applySweep(osc, ctx, startFreq, endFreq, duration)
  applyEnvelope(gain, ctx, envelope, volume)

  osc.start(ctx.currentTime)
  osc.stop(ctx.currentTime + duration + 0.01)
}

/**
 * Plays an arpeggio (sequence of notes).
 *
 * @param {AudioContext} ctx - The audio context
 * @param {GainNode} masterGain - Master gain node
 * @param {Object} options - Arpeggio options
 * @param {string} options.waveform - Waveform type
 * @param {number[]} options.frequencies - Array of frequencies to play
 * @param {number} options.noteLength - Duration of each note in seconds
 * @param {number} [options.volume=0.3] - Volume level
 */
export function playArpeggio(ctx, masterGain, options) {
  const { waveform, frequencies, noteLength, volume = 0.3 } = options

  frequencies.forEach((freq, index) => {
    const startTime = ctx.currentTime + index * noteLength

    const osc = ctx.createOscillator()
    osc.type = waveform
    osc.frequency.setValueAtTime(freq, startTime)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(volume, startTime + 0.01)
    gain.gain.linearRampToValueAtTime(volume * 0.7, startTime + noteLength * 0.8)
    gain.gain.linearRampToValueAtTime(0, startTime + noteLength)

    osc.connect(gain)
    gain.connect(masterGain)

    osc.start(startTime)
    osc.stop(startTime + noteLength + 0.01)
  })
}
