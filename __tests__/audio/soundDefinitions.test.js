/**
 * @fileoverview Tests for soundDefinitions module.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { SOUNDS, SOUND_NAMES } from '../../js/audio/soundDefinitions.js'

// Mock the SoundSynthesizer functions
vi.mock('../../js/audio/SoundSynthesizer.js', () => ({
  WAVEFORMS: {
    SQUARE: 'square',
    SAWTOOTH: 'sawtooth',
    TRIANGLE: 'triangle',
    SINE: 'sine'
  },
  playTone: vi.fn(),
  playNoise: vi.fn(),
  playSweep: vi.fn(),
  playArpeggio: vi.fn()
}))

import { playTone, playNoise, playSweep, playArpeggio } from '../../js/audio/SoundSynthesizer.js'

describe('soundDefinitions', () => {
  let ctx
  let masterGain

  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    ctx = {
      currentTime: 0,
      sampleRate: 44100
    }

    masterGain = {
      connect: vi.fn()
    }
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('SOUND_NAMES', () => {
    it('exports an array of 17 sound names', () => {
      expect(Array.isArray(SOUND_NAMES)).toBe(true)
      expect(SOUND_NAMES).toHaveLength(17)
    })

    it('contains all expected sound names', () => {
      const expectedSounds = [
        'cardDeal',
        'chipPlace',
        'hit',
        'stand',
        'doubleDown',
        'split',
        'win',
        'blackjack',
        'push',
        'bust',
        'lose',
        'dealerReveal',
        'newRound',
        'insuranceOffer',
        'insuranceAccept',
        'insuranceDecline',
        'buttonClick'
      ]

      expectedSounds.forEach((name) => {
        expect(SOUND_NAMES).toContain(name)
      })
    })

    it('matches the keys of SOUNDS object', () => {
      expect(SOUND_NAMES).toEqual(Object.keys(SOUNDS))
    })
  })

  describe('SOUNDS', () => {
    it('exports an object with all sound functions', () => {
      expect(typeof SOUNDS).toBe('object')
      expect(Object.keys(SOUNDS)).toHaveLength(17)
    })

    it('all sound values are functions', () => {
      Object.values(SOUNDS).forEach((sound) => {
        expect(typeof sound).toBe('function')
      })
    })
  })

  // ===========================================================================
  // CARD SOUNDS
  // ===========================================================================

  describe('cardDeal', () => {
    it('plays a swoosh sweep', () => {
      SOUNDS.cardDeal(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 800,
        endFreq: 200,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05 },
        volume: 0.15
      })
    })

    it('plays impact noise after delay', () => {
      SOUNDS.cardDeal(ctx, masterGain)

      expect(playNoise).not.toHaveBeenCalled()

      vi.advanceTimersByTime(60)

      expect(playNoise).toHaveBeenCalledWith(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.02 },
        filterFreq: 800,
        volume: 0.12
      })
    })
  })

  describe('chipPlace', () => {
    it('plays metallic clink tone', () => {
      SOUNDS.chipPlace(ctx, masterGain)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 1800,
        envelope: { attack: 0.005, decay: 0.06, sustain: 0, release: 0.08 },
        volume: 0.18
      })
    })

    it('plays power-up undertone simultaneously', () => {
      SOUNDS.chipPlace(ctx, masterGain)

      expect(playTone).toHaveBeenCalledTimes(2)
      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 600,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0.1, release: 0.04 },
        volume: 0.08
      })
    })
  })

  // ===========================================================================
  // ACTION SOUNDS
  // ===========================================================================

  describe('hit', () => {
    it('plays punch impact sweep', () => {
      SOUNDS.hit(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        startFreq: 400,
        endFreq: 150,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0.03 },
        volume: 0.2
      })
    })

    it('plays impact noise simultaneously', () => {
      SOUNDS.hit(ctx, masterGain)

      expect(playNoise).toHaveBeenCalledWith(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.02, sustain: 0, release: 0.02 },
        filterFreq: 1200,
        volume: 0.12
      })
    })
  })

  describe('stand', () => {
    it('plays block sound tone', () => {
      SOUNDS.stand(ctx, masterGain)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 220,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0.2, release: 0.05 },
        volume: 0.15
      })
    })

    it('plays resonance tone simultaneously', () => {
      SOUNDS.stand(ctx, masterGain)

      expect(playTone).toHaveBeenCalledTimes(2)
      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 440,
        envelope: { attack: 0.02, decay: 0.06, sustain: 0, release: 0.04 },
        volume: 0.08
      })
    })
  })

  describe('doubleDown', () => {
    it('plays charge up sweep', () => {
      SOUNDS.doubleDown(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 200,
        endFreq: 800,
        envelope: { attack: 0.08, decay: 0.02, sustain: 0.3, release: 0.02 },
        volume: 0.15
      })
    })

    it('plays power release tone after delay', () => {
      SOUNDS.doubleDown(ctx, masterGain)

      expect(playTone).not.toHaveBeenCalled()

      vi.advanceTimersByTime(100)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 523,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.2, release: 0.05 },
        volume: 0.2
      })
    })
  })

  describe('split', () => {
    it('plays initial slice sweep', () => {
      SOUNDS.split(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 1200,
        endFreq: 300,
        envelope: { attack: 0.01, decay: 0.06, sustain: 0, release: 0.04 },
        volume: 0.18
      })
    })

    it('plays chop impact noise after 50ms', () => {
      SOUNDS.split(ctx, masterGain)

      vi.advanceTimersByTime(50)

      expect(playNoise).toHaveBeenCalledWith(ctx, masterGain, {
        envelope: { attack: 0.005, decay: 0.03, sustain: 0, release: 0.02 },
        filterFreq: 2000,
        volume: 0.15
      })
    })

    it('plays second slice sweep after 80ms', () => {
      SOUNDS.split(ctx, masterGain)

      vi.advanceTimersByTime(80)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 900,
        endFreq: 400,
        envelope: { attack: 0.01, decay: 0.04, sustain: 0, release: 0.03 },
        volume: 0.12
      })
    })
  })

  // ===========================================================================
  // RESULT SOUNDS
  // ===========================================================================

  describe('win', () => {
    it('plays victory arpeggio (C major ascending)', () => {
      SOUNDS.win(ctx, masterGain)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequencies: [523, 659, 784, 1047],
        noteLength: 0.1,
        volume: 0.18
      })
    })

    it('plays harmony layer after 20ms', () => {
      SOUNDS.win(ctx, masterGain)

      vi.advanceTimersByTime(20)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequencies: [262, 330, 392, 523],
        noteLength: 0.1,
        volume: 0.08
      })
    })
  })

  describe('blackjack', () => {
    it('plays dramatic opening tone', () => {
      SOUNDS.blackjack(ctx, masterGain)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.05 },
        volume: 0.15
      })
    })

    it('plays victory arpeggio after 80ms', () => {
      SOUNDS.blackjack(ctx, masterGain)

      vi.advanceTimersByTime(80)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequencies: [523, 659, 784, 880, 1047],
        noteLength: 0.08,
        volume: 0.2
      })
    })

    it('plays flourish high note after 450ms', () => {
      SOUNDS.blackjack(ctx, masterGain)

      vi.advanceTimersByTime(450)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 1319,
        envelope: { attack: 0.01, decay: 0.15, sustain: 0.1, release: 0.1 },
        volume: 0.12
      })
    })
  })

  describe('push', () => {
    it('plays neutral chord with two triangle tones', () => {
      SOUNDS.push(ctx, masterGain)

      expect(playTone).toHaveBeenCalledTimes(2)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 440,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.1 },
        volume: 0.12
      })

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        frequency: 330,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.2, release: 0.1 },
        volume: 0.1
      })
    })
  })

  describe('bust', () => {
    it('plays heavy thud noise', () => {
      SOUNDS.bust(ctx, masterGain)

      expect(playNoise).toHaveBeenCalledWith(ctx, masterGain, {
        envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.05 },
        filterFreq: 400,
        volume: 0.2
      })
    })

    it('plays descending doom tones after 100ms', () => {
      SOUNDS.bust(ctx, masterGain)

      vi.advanceTimersByTime(100)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequencies: [330, 262, 220],
        noteLength: 0.12,
        volume: 0.15
      })
    })
  })

  describe('lose', () => {
    it('plays KO impact noise', () => {
      SOUNDS.lose(ctx, masterGain)

      expect(playNoise).toHaveBeenCalledWith(ctx, masterGain, {
        envelope: { attack: 0.01, decay: 0.1, sustain: 0, release: 0.05 },
        filterFreq: 300,
        volume: 0.18
      })
    })

    it('plays sad descending sweep simultaneously', () => {
      SOUNDS.lose(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 400,
        endFreq: 80,
        envelope: { attack: 0.02, decay: 0.2, sustain: 0.1, release: 0.1 },
        volume: 0.12
      })
    })

    it('plays final thud after 250ms', () => {
      SOUNDS.lose(ctx, masterGain)

      vi.advanceTimersByTime(250)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 65,
        envelope: { attack: 0.01, decay: 0.15, sustain: 0, release: 0.05 },
        volume: 0.15
      })
    })
  })

  // ===========================================================================
  // DEALER SOUNDS
  // ===========================================================================

  describe('dealerReveal', () => {
    it('plays tension sweep up', () => {
      SOUNDS.dealerReveal(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 150,
        endFreq: 600,
        envelope: { attack: 0.1, decay: 0.05, sustain: 0.2, release: 0.05 },
        volume: 0.12
      })
    })

    it('plays reveal accent after 150ms', () => {
      SOUNDS.dealerReveal(ctx, masterGain)

      vi.advanceTimersByTime(150)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 880,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.1, release: 0.05 },
        volume: 0.15
      })
    })
  })

  // ===========================================================================
  // ROUND SOUNDS
  // ===========================================================================

  describe('newRound', () => {
    it('plays power up sweep', () => {
      SOUNDS.newRound(ctx, masterGain)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'sawtooth',
        startFreq: 100,
        endFreq: 500,
        envelope: { attack: 0.1, decay: 0.02, sustain: 0.2, release: 0.02 },
        volume: 0.12
      })
    })

    it('plays first ready tone after 120ms', () => {
      SOUNDS.newRound(ctx, masterGain)

      vi.advanceTimersByTime(120)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 440,
        envelope: { attack: 0.01, decay: 0.08, sustain: 0, release: 0.02 },
        volume: 0.15
      })
    })

    it('plays second ready tone after 200ms', () => {
      SOUNDS.newRound(ctx, masterGain)

      vi.advanceTimersByTime(200)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 659,
        envelope: { attack: 0.01, decay: 0.1, sustain: 0.1, release: 0.05 },
        volume: 0.18
      })
    })
  })

  // ===========================================================================
  // INSURANCE SOUNDS
  // ===========================================================================

  describe('insuranceOffer', () => {
    it('plays initial alert beep', () => {
      SOUNDS.insuranceOffer(ctx, masterGain)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 880,
        envelope: { attack: 0.01, decay: 0.05, sustain: 0.3, release: 0.02 },
        volume: 0.12
      })
    })

    it('plays second beep after 150ms', () => {
      SOUNDS.insuranceOffer(ctx, masterGain)

      vi.advanceTimersByTime(150)

      // Should be called twice with same parameters (second beep)
      expect(playTone).toHaveBeenCalledTimes(2)
    })

    it('plays question mark sweep after 300ms', () => {
      SOUNDS.insuranceOffer(ctx, masterGain)

      vi.advanceTimersByTime(300)

      expect(playSweep).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'triangle',
        startFreq: 660,
        endFreq: 880,
        envelope: { attack: 0.02, decay: 0.1, sustain: 0.1, release: 0.05 },
        volume: 0.1
      })
    })
  })

  describe('insuranceAccept', () => {
    it('plays ascending confirmation arpeggio', () => {
      SOUNDS.insuranceAccept(ctx, masterGain)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequencies: [523, 659],
        noteLength: 0.08,
        volume: 0.15
      })
    })
  })

  describe('insuranceDecline', () => {
    it('plays descending cancel arpeggio', () => {
      SOUNDS.insuranceDecline(ctx, masterGain)

      expect(playArpeggio).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequencies: [523, 392],
        noteLength: 0.08,
        volume: 0.12
      })
    })
  })

  // ===========================================================================
  // UI SOUNDS
  // ===========================================================================

  describe('buttonClick', () => {
    it('plays quick UI blip tone', () => {
      SOUNDS.buttonClick(ctx, masterGain)

      expect(playTone).toHaveBeenCalledWith(ctx, masterGain, {
        waveform: 'square',
        frequency: 1000,
        envelope: { attack: 0.005, decay: 0.02, sustain: 0, release: 0.01 },
        volume: 0.08
      })
    })

    it('calls playTone only once', () => {
      SOUNDS.buttonClick(ctx, masterGain)

      expect(playTone).toHaveBeenCalledTimes(1)
    })
  })

  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================

  describe('all sounds callable', () => {
    it('all 17 sounds can be called without error', () => {
      SOUND_NAMES.forEach((name) => {
        expect(() => {
          SOUNDS[name](ctx, masterGain)
        }).not.toThrow()
      })
    })

    it('all sounds work with different context times', () => {
      const laterCtx = { ...ctx, currentTime: 5.5 }

      SOUND_NAMES.forEach((name) => {
        expect(() => {
          SOUNDS[name](laterCtx, masterGain)
        }).not.toThrow()
      })
    })
  })
})
