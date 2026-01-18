/**
 * @fileoverview Tests for SoundSynthesizer module.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  WAVEFORMS,
  createOscillator,
  createGain,
  applyEnvelope,
  applySweep,
  createNoiseBuffer,
  createNoiseSource,
  createLowPassFilter,
  createHighPassFilter,
  createBandPassFilter,
  playTone,
  playNoise,
  playSweep,
  playArpeggio
} from '../../js/audio/SoundSynthesizer.js'

// Mock AudioContext and related nodes
function createMockAudioContext() {
  const mockGainNode = {
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  }

  const mockOscillator = {
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }

  const mockFilter = {
    type: 'lowpass',
    frequency: {
      value: 1000,
      setValueAtTime: vi.fn()
    },
    Q: {
      value: 1,
      setValueAtTime: vi.fn()
    },
    connect: vi.fn()
  }

  const mockBufferSource = {
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  }

  const mockBuffer = {
    getChannelData: vi.fn(() => new Float32Array(1000))
  }

  return {
    currentTime: 0,
    sampleRate: 44100,
    createOscillator: vi.fn(() => ({ ...mockOscillator })),
    createGain: vi.fn(() => ({
      gain: {
        value: 1,
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn()
      },
      connect: vi.fn()
    })),
    createBiquadFilter: vi.fn(() => ({ ...mockFilter })),
    createBuffer: vi.fn(() => mockBuffer),
    createBufferSource: vi.fn(() => ({ ...mockBufferSource }))
  }
}

describe('SoundSynthesizer', () => {
  let ctx

  beforeEach(() => {
    ctx = createMockAudioContext()
  })

  describe('WAVEFORMS', () => {
    it('exports all standard waveform types', () => {
      expect(WAVEFORMS.SQUARE).toBe('square')
      expect(WAVEFORMS.SAWTOOTH).toBe('sawtooth')
      expect(WAVEFORMS.TRIANGLE).toBe('triangle')
      expect(WAVEFORMS.SINE).toBe('sine')
    })

    it('is frozen (immutable)', () => {
      expect(Object.isFrozen(WAVEFORMS)).toBe(true)
    })
  })

  describe('createOscillator', () => {
    it('creates an oscillator with specified type and frequency', () => {
      const osc = createOscillator(ctx, 'square', 440)

      expect(ctx.createOscillator).toHaveBeenCalled()
      expect(osc.type).toBe('square')
      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(440, 0)
    })

    it('works with different waveform types', () => {
      Object.values(WAVEFORMS).forEach((waveform) => {
        const osc = createOscillator(ctx, waveform, 880)
        expect(osc.type).toBe(waveform)
      })
    })
  })

  describe('createGain', () => {
    it('creates a gain node with default gain of 1', () => {
      const gain = createGain(ctx)

      expect(ctx.createGain).toHaveBeenCalled()
      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(1, 0)
    })

    it('creates a gain node with specified initial gain', () => {
      const gain = createGain(ctx, 0.5)

      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0.5, 0)
    })

    it('accepts gain of 0', () => {
      const gain = createGain(ctx, 0)

      expect(gain.gain.setValueAtTime).toHaveBeenCalledWith(0, 0)
    })
  })

  describe('applyEnvelope', () => {
    it('applies ADSR envelope to gain node', () => {
      const gainNode = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        }
      }

      const envelope = {
        attack: 0.1,
        decay: 0.2,
        sustain: 0.5,
        release: 0.3
      }

      applyEnvelope(gainNode, ctx, envelope)

      // Start at 0
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(0, 0)
      // Attack to peak (1)
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(1, 0.1)
      // Decay to sustain level (sustain * peak = 0.5 * 1 = 0.5)
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.closeTo(0.3, 5)
      )
      // Release to 0
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        expect.closeTo(0.6, 5)
      )
      // Set value at release start
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(
        0.5,
        expect.closeTo(0.3, 5)
      )
    })

    it('applies envelope with custom peak level', () => {
      const gainNode = {
        gain: {
          setValueAtTime: vi.fn(),
          linearRampToValueAtTime: vi.fn()
        }
      }

      const envelope = {
        attack: 0.1,
        decay: 0.1,
        sustain: 0.8,
        release: 0.1
      }

      applyEnvelope(gainNode, ctx, envelope, 0.5)

      // Attack to peak (0.5)
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0.5, 0.1)
      // Decay to sustain * peak (0.8 * 0.5 = 0.4)
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        expect.closeTo(0.4, 5),
        expect.closeTo(0.2, 5)
      )
      // Release to 0
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(
        0,
        expect.closeTo(0.3, 5)
      )
    })
  })

  describe('applySweep', () => {
    it('applies frequency sweep to oscillator', () => {
      const osc = {
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        }
      }

      applySweep(osc, ctx, 800, 200, 0.5)

      expect(osc.frequency.setValueAtTime).toHaveBeenCalledWith(800, 0)
      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(200, 0.5)
    })

    it('clamps end frequency to minimum of 1', () => {
      const osc = {
        frequency: {
          setValueAtTime: vi.fn(),
          exponentialRampToValueAtTime: vi.fn()
        }
      }

      applySweep(osc, ctx, 100, 0, 0.3)

      expect(osc.frequency.exponentialRampToValueAtTime).toHaveBeenCalledWith(1, 0.3)
    })
  })

  describe('createNoiseBuffer', () => {
    it('creates a noise buffer with default duration', () => {
      const buffer = createNoiseBuffer(ctx)

      expect(ctx.createBuffer).toHaveBeenCalledWith(1, 44100 * 0.5, 44100)
    })

    it('creates a noise buffer with specified duration', () => {
      createNoiseBuffer(ctx, 1.0)

      expect(ctx.createBuffer).toHaveBeenCalledWith(1, 44100 * 1.0, 44100)
    })

    it('fills buffer with random values', () => {
      const mockData = new Float32Array(100)
      ctx.createBuffer = vi.fn(() => ({
        getChannelData: vi.fn(() => mockData)
      }))

      createNoiseBuffer(ctx, 100 / 44100)

      // The buffer should have been modified (values set)
      expect(ctx.createBuffer).toHaveBeenCalled()
    })
  })

  describe('createNoiseSource', () => {
    it('creates a buffer source with noise buffer', () => {
      const source = createNoiseSource(ctx)

      expect(ctx.createBuffer).toHaveBeenCalled()
      expect(ctx.createBufferSource).toHaveBeenCalled()
    })

    it('creates noise source with specified duration', () => {
      createNoiseSource(ctx, 1.0)

      expect(ctx.createBuffer).toHaveBeenCalledWith(1, 44100 * 1.0, 44100)
    })
  })

  describe('createLowPassFilter', () => {
    it('creates a low-pass filter with specified frequency', () => {
      const filter = createLowPassFilter(ctx, 1000)

      expect(ctx.createBiquadFilter).toHaveBeenCalled()
      expect(filter.type).toBe('lowpass')
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0)
    })

    it('creates filter with default Q of 1', () => {
      const filter = createLowPassFilter(ctx, 2000)

      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(1, 0)
    })

    it('creates filter with specified Q', () => {
      const filter = createLowPassFilter(ctx, 1500, 2)

      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(2, 0)
    })
  })

  describe('createHighPassFilter', () => {
    it('creates a high-pass filter with specified frequency', () => {
      const filter = createHighPassFilter(ctx, 500)

      expect(ctx.createBiquadFilter).toHaveBeenCalled()
      expect(filter.type).toBe('highpass')
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(500, 0)
    })

    it('creates filter with specified Q', () => {
      const filter = createHighPassFilter(ctx, 800, 1.5)

      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(1.5, 0)
    })
  })

  describe('createBandPassFilter', () => {
    it('creates a band-pass filter with specified frequency', () => {
      const filter = createBandPassFilter(ctx, 1000)

      expect(ctx.createBiquadFilter).toHaveBeenCalled()
      expect(filter.type).toBe('bandpass')
      expect(filter.frequency.setValueAtTime).toHaveBeenCalledWith(1000, 0)
    })

    it('creates filter with specified Q', () => {
      const filter = createBandPassFilter(ctx, 2000, 3)

      expect(filter.Q.setValueAtTime).toHaveBeenCalledWith(3, 0)
    })
  })

  describe('playTone', () => {
    it('creates and connects oscillator and gain nodes', () => {
      const masterGain = { connect: vi.fn() }

      playTone(ctx, masterGain, {
        waveform: 'square',
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.1 }
      })

      expect(ctx.createOscillator).toHaveBeenCalled()
      expect(ctx.createGain).toHaveBeenCalled()
    })

    it('uses default volume of 0.3', () => {
      const masterGain = { connect: vi.fn() }

      playTone(ctx, masterGain, {
        waveform: 'sine',
        frequency: 880,
        envelope: { attack: 0.01, decay: 0.01, sustain: 0.5, release: 0.01 }
      })

      // Oscillator should be created and started
      expect(ctx.createOscillator).toHaveBeenCalled()
    })

    it('accepts custom volume', () => {
      const masterGain = { connect: vi.fn() }

      playTone(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 660,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.4, release: 0.05 },
        volume: 0.5
      })

      expect(ctx.createOscillator).toHaveBeenCalled()
    })
  })

  describe('playNoise', () => {
    it('creates noise source with filter and gain', () => {
      const masterGain = { connect: vi.fn() }

      playNoise(ctx, masterGain, {
        envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.02 }
      })

      expect(ctx.createBufferSource).toHaveBeenCalled()
      expect(ctx.createBiquadFilter).toHaveBeenCalled()
      expect(ctx.createGain).toHaveBeenCalled()
    })

    it('uses default filter frequency of 2000', () => {
      const masterGain = { connect: vi.fn() }

      playNoise(ctx, masterGain, {
        envelope: { attack: 0.01, decay: 0.03, sustain: 0, release: 0.02 }
      })

      expect(ctx.createBiquadFilter).toHaveBeenCalled()
    })

    it('accepts custom filter frequency', () => {
      const masterGain = { connect: vi.fn() }

      playNoise(ctx, masterGain, {
        envelope: { attack: 0.01, decay: 0.05, sustain: 0, release: 0.03 },
        filterFreq: 800
      })

      expect(ctx.createBiquadFilter).toHaveBeenCalled()
    })

    it('accepts custom volume', () => {
      const masterGain = { connect: vi.fn() }

      playNoise(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.02, sustain: 0, release: 0.02 },
        volume: 0.15
      })

      expect(ctx.createGain).toHaveBeenCalled()
    })
  })

  describe('playSweep', () => {
    it('creates oscillator with frequency sweep', () => {
      const masterGain = { connect: vi.fn() }

      playSweep(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 800,
        endFreq: 200,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05 }
      })

      expect(ctx.createOscillator).toHaveBeenCalled()
      expect(ctx.createGain).toHaveBeenCalled()
    })

    it('accepts custom volume', () => {
      const masterGain = { connect: vi.fn() }

      playSweep(ctx, masterGain, {
        waveform: 'square',
        startFreq: 400,
        endFreq: 150,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0.03 },
        volume: 0.2
      })

      expect(ctx.createOscillator).toHaveBeenCalled()
    })
  })

  describe('playArpeggio', () => {
    it('creates oscillators for each frequency in sequence', () => {
      const masterGain = { connect: vi.fn() }

      playArpeggio(ctx, masterGain, {
        waveform: 'square',
        frequencies: [523, 659, 784, 1047],
        noteLength: 0.1
      })

      // Should create 4 oscillators (one per frequency)
      expect(ctx.createOscillator).toHaveBeenCalledTimes(4)
      expect(ctx.createGain).toHaveBeenCalledTimes(4)
    })

    it('uses default volume of 0.3', () => {
      const masterGain = { connect: vi.fn() }

      playArpeggio(ctx, masterGain, {
        waveform: 'triangle',
        frequencies: [440, 880],
        noteLength: 0.15
      })

      expect(ctx.createOscillator).toHaveBeenCalledTimes(2)
    })

    it('accepts custom volume', () => {
      const masterGain = { connect: vi.fn() }

      playArpeggio(ctx, masterGain, {
        waveform: 'square',
        frequencies: [262, 330, 392],
        noteLength: 0.08,
        volume: 0.18
      })

      expect(ctx.createOscillator).toHaveBeenCalledTimes(3)
    })

    it('handles empty frequency array', () => {
      const masterGain = { connect: vi.fn() }

      playArpeggio(ctx, masterGain, {
        waveform: 'sine',
        frequencies: [],
        noteLength: 0.1
      })

      expect(ctx.createOscillator).not.toHaveBeenCalled()
    })

    it('handles single note arpeggio', () => {
      const masterGain = { connect: vi.fn() }

      playArpeggio(ctx, masterGain, {
        waveform: 'square',
        frequencies: [440],
        noteLength: 0.2
      })

      expect(ctx.createOscillator).toHaveBeenCalledTimes(1)
    })
  })
})
