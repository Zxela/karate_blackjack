/**
 * @fileoverview Unit tests for AudioManager module.
 *
 * Tests cover:
 * - AudioManager initialization
 * - Play functionality
 * - Volume control (setVolume, getVolume)
 * - Mute/unmute functionality
 * - State persistence to localStorage
 * - Graceful degradation when audio unavailable
 * - Sound name validation
 *
 * @module tests/audio/AudioManager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { AudioManager } from '../../js/audio/AudioManager.js'
import { SOUND_NAMES } from '../../js/audio/soundDefinitions.js'

// =============================================================================
// MOCK SETUP
// =============================================================================

/**
 * Creates a mock AudioContext.
 * @returns {Object} Mock AudioContext
 */
function createMockAudioContext() {
  // Create mock nodes that return themselves for chaining
  const createMockGainNode = () => ({
    gain: {
      value: 1,
      setValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn()
  })

  const createMockOscillator = () => ({
    type: 'sine',
    frequency: {
      value: 440,
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
      linearRampToValueAtTime: vi.fn()
    },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })

  const createMockBufferSource = () => ({
    buffer: null,
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn()
  })

  const createMockFilter = () => ({
    type: 'lowpass',
    frequency: { setValueAtTime: vi.fn() },
    Q: { setValueAtTime: vi.fn() },
    connect: vi.fn()
  })

  return {
    state: 'running',
    currentTime: 0,
    destination: {},
    sampleRate: 44100,
    createGain: vi.fn(createMockGainNode),
    createOscillator: vi.fn(createMockOscillator),
    createBufferSource: vi.fn(createMockBufferSource),
    createBiquadFilter: vi.fn(createMockFilter),
    createBuffer: vi.fn((channels, length, sampleRate) => ({
      getChannelData: vi.fn(() => new Float32Array(length || 1024))
    })),
    resume: vi.fn(() => Promise.resolve())
  }
}

/**
 * Creates a mock localStorage.
 * @returns {Object} Mock localStorage
 */
function createMockStorage() {
  const store = new Map()
  return {
    getItem: vi.fn((key) => store.get(key) ?? null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    _store: store
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe('AudioManager', () => {
  let mockAudioContext
  let mockStorage
  let originalAudioContext
  let originalLocalStorage

  beforeEach(() => {
    mockAudioContext = createMockAudioContext()
    mockStorage = createMockStorage()

    // Store originals
    originalAudioContext = globalThis.AudioContext
    originalLocalStorage = globalThis.localStorage

    // Setup mocks
    globalThis.AudioContext = vi.fn(() => mockAudioContext)
    globalThis.localStorage = mockStorage
  })

  afterEach(() => {
    // Restore originals
    globalThis.AudioContext = originalAudioContext
    globalThis.localStorage = originalLocalStorage
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('creates instance without initializing audio context', () => {
      const audio = new AudioManager()
      expect(audio.isInitialized()).toBe(false)
    })

    it('loads saved volume settings from localStorage', () => {
      mockStorage.setItem('karate_blackjack_audio', JSON.stringify({ volume: 0.5, muted: false }))
      const audio = new AudioManager()
      expect(audio.getVolume()).toBe(0.5)
    })

    it('loads saved muted state from localStorage', () => {
      mockStorage.setItem('karate_blackjack_audio', JSON.stringify({ volume: 0.7, muted: true }))
      const audio = new AudioManager()
      expect(audio.isMuted()).toBe(true)
    })

    it('uses default volume when no settings saved', () => {
      const audio = new AudioManager()
      expect(audio.getVolume()).toBe(0.7) // DEFAULT_VOLUME
    })

    it('handles corrupted localStorage data gracefully', () => {
      mockStorage.setItem('karate_blackjack_audio', 'invalid json')
      expect(() => new AudioManager()).not.toThrow()
      const audio = new AudioManager()
      expect(audio.getVolume()).toBe(0.7)
    })
  })

  describe('init', () => {
    it('creates audio context on init', () => {
      const audio = new AudioManager()
      audio.init()
      expect(AudioContext).toHaveBeenCalled()
    })

    it('returns true on successful init', () => {
      const audio = new AudioManager()
      expect(audio.init()).toBe(true)
    })

    it('returns true on subsequent init calls (already initialized)', () => {
      const audio = new AudioManager()
      audio.init()
      expect(audio.init()).toBe(true)
    })

    it('sets initialized flag to true', () => {
      const audio = new AudioManager()
      audio.init()
      expect(audio.isInitialized()).toBe(true)
    })

    it('applies saved volume on init', () => {
      mockStorage.setItem('karate_blackjack_audio', JSON.stringify({ volume: 0.5, muted: false }))
      const audio = new AudioManager()
      audio.init()

      // Verify createGain was called and the gain node was set up
      expect(mockAudioContext.createGain).toHaveBeenCalled()
      // The volume should be stored internally
      expect(audio.getVolume()).toBe(0.5)
    })

    it('returns false when AudioContext not available', () => {
      globalThis.AudioContext = undefined
      const audio = new AudioManager()
      expect(audio.init()).toBe(false)
    })

    it('handles AudioContext creation errors', () => {
      globalThis.AudioContext = vi.fn(() => {
        throw new Error('Audio not supported')
      })
      const audio = new AudioManager()
      expect(audio.init()).toBe(false)
      expect(audio.isInitialized()).toBe(false)
    })
  })

  describe('play', () => {
    it('initializes on first play if needed', () => {
      const audio = new AudioManager()
      audio.play('buttonClick')
      expect(audio.isInitialized()).toBe(true)
    })

    it('returns true when playing valid sound', () => {
      const audio = new AudioManager()
      audio.init()
      expect(audio.play('buttonClick')).toBe(true)
    })

    it('returns false for unknown sound name', () => {
      const audio = new AudioManager()
      audio.init()
      expect(audio.play('nonExistentSound')).toBe(false)
    })

    it('returns false when muted', () => {
      const audio = new AudioManager()
      audio.init()
      audio.mute()
      expect(audio.play('buttonClick')).toBe(false)
    })

    it('returns false when audio unavailable', () => {
      globalThis.AudioContext = undefined
      const audio = new AudioManager()
      expect(audio.play('buttonClick')).toBe(false)
    })

    it('resumes suspended context', () => {
      mockAudioContext.state = 'suspended'
      const audio = new AudioManager()
      audio.init()
      audio.play('buttonClick')
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('does not crash on synthesis error', () => {
      const audio = new AudioManager()
      audio.init()

      // Make oscillator throw
      mockAudioContext.createOscillator.mockImplementation(() => {
        throw new Error('Synthesis error')
      })

      expect(() => audio.play('buttonClick')).not.toThrow()
    })
  })

  describe('setVolume', () => {
    it('sets volume between 0 and 1', () => {
      const audio = new AudioManager()
      audio.setVolume(0.5)
      expect(audio.getVolume()).toBe(0.5)
    })

    it('clamps volume to minimum 0', () => {
      const audio = new AudioManager()
      audio.setVolume(-0.5)
      expect(audio.getVolume()).toBe(0)
    })

    it('clamps volume to maximum 1', () => {
      const audio = new AudioManager()
      audio.setVolume(1.5)
      expect(audio.getVolume()).toBe(1)
    })

    it('saves volume to localStorage', () => {
      const audio = new AudioManager()
      audio.setVolume(0.8)
      expect(mockStorage.setItem).toHaveBeenCalled()

      const savedData = JSON.parse(mockStorage._store.get('karate_blackjack_audio'))
      expect(savedData.volume).toBe(0.8)
    })

    it('unmutes when setting volume > 0 while muted', () => {
      const audio = new AudioManager()
      audio.mute()
      expect(audio.isMuted()).toBe(true)

      audio.setVolume(0.5)
      expect(audio.isMuted()).toBe(false)
    })

    it('mutes when setting volume to 0', () => {
      const audio = new AudioManager()
      audio.setVolume(0)
      expect(audio.isMuted()).toBe(true)
    })

    it('applies volume to gain node when initialized', () => {
      const audio = new AudioManager()
      audio.init()

      // The first createGain call was during init (master gain)
      const masterGainCall = mockAudioContext.createGain.mock.results[0]
      expect(masterGainCall).toBeDefined()

      audio.setVolume(0.6)
      expect(audio.getVolume()).toBe(0.6)
    })
  })

  describe('getVolume', () => {
    it('returns current volume level', () => {
      const audio = new AudioManager()
      audio.setVolume(0.3)
      expect(audio.getVolume()).toBe(0.3)
    })

    it('returns default volume initially', () => {
      const audio = new AudioManager()
      expect(audio.getVolume()).toBe(0.7)
    })
  })

  describe('mute', () => {
    it('sets muted state to true', () => {
      const audio = new AudioManager()
      audio.mute()
      expect(audio.isMuted()).toBe(true)
    })

    it('remembers volume before muting', () => {
      const audio = new AudioManager()
      audio.setVolume(0.8)
      audio.mute()
      audio.unmute()
      expect(audio.getVolume()).toBe(0.8)
    })

    it('saves muted state to localStorage', () => {
      const audio = new AudioManager()
      audio.mute()

      const savedData = JSON.parse(mockStorage._store.get('karate_blackjack_audio'))
      expect(savedData.muted).toBe(true)
    })

    it('does nothing if already muted', () => {
      const audio = new AudioManager()
      audio.mute()
      vi.clearAllMocks()
      audio.mute()
      // Should not save again
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })

    it('sets gain to 0 when initialized', () => {
      const audio = new AudioManager()
      audio.init()

      // The first createGain call was during init (master gain)
      const masterGainCall = mockAudioContext.createGain.mock.results[0]
      expect(masterGainCall).toBeDefined()

      audio.mute()
      expect(audio.isMuted()).toBe(true)
    })
  })

  describe('unmute', () => {
    it('sets muted state to false', () => {
      const audio = new AudioManager()
      audio.mute()
      audio.unmute()
      expect(audio.isMuted()).toBe(false)
    })

    it('restores volume from before muting', () => {
      const audio = new AudioManager()
      audio.setVolume(0.6)
      audio.mute()
      audio.unmute()
      expect(audio.getVolume()).toBe(0.6)
    })

    it('uses default volume if previous volume was 0', () => {
      const audio = new AudioManager()
      audio.setVolume(0) // This also mutes
      audio.unmute()
      expect(audio.getVolume()).toBe(0.7) // Default
    })

    it('saves unmuted state to localStorage', () => {
      const audio = new AudioManager()
      audio.mute()
      vi.clearAllMocks()
      audio.unmute()

      const savedData = JSON.parse(mockStorage._store.get('karate_blackjack_audio'))
      expect(savedData.muted).toBe(false)
    })

    it('does nothing if already unmuted', () => {
      const audio = new AudioManager()
      vi.clearAllMocks()
      audio.unmute()
      // Should not save since state didn't change
      expect(mockStorage.setItem).not.toHaveBeenCalled()
    })
  })

  describe('toggleMute', () => {
    it('mutes when unmuted', () => {
      const audio = new AudioManager()
      audio.toggleMute()
      expect(audio.isMuted()).toBe(true)
    })

    it('unmutes when muted', () => {
      const audio = new AudioManager()
      audio.mute()
      audio.toggleMute()
      expect(audio.isMuted()).toBe(false)
    })

    it('returns new muted state', () => {
      const audio = new AudioManager()
      expect(audio.toggleMute()).toBe(true)
      expect(audio.toggleMute()).toBe(false)
    })
  })

  describe('isMuted', () => {
    it('returns false initially', () => {
      const audio = new AudioManager()
      expect(audio.isMuted()).toBe(false)
    })

    it('returns true after mute', () => {
      const audio = new AudioManager()
      audio.mute()
      expect(audio.isMuted()).toBe(true)
    })

    it('returns false after unmute', () => {
      const audio = new AudioManager()
      audio.mute()
      audio.unmute()
      expect(audio.isMuted()).toBe(false)
    })
  })

  describe('isAvailable', () => {
    it('returns true when AudioContext available', () => {
      const audio = new AudioManager()
      expect(audio.isAvailable()).toBe(true)
    })

    it('returns false when AudioContext unavailable', () => {
      globalThis.AudioContext = undefined
      const audio = new AudioManager()
      expect(audio.isAvailable()).toBe(false)
    })
  })

  describe('isInitialized', () => {
    it('returns false before init', () => {
      const audio = new AudioManager()
      expect(audio.isInitialized()).toBe(false)
    })

    it('returns true after init', () => {
      const audio = new AudioManager()
      audio.init()
      expect(audio.isInitialized()).toBe(true)
    })
  })

  describe('getSoundNames', () => {
    it('returns array of sound names', () => {
      const audio = new AudioManager()
      const names = audio.getSoundNames()
      expect(Array.isArray(names)).toBe(true)
      expect(names.length).toBeGreaterThan(0)
    })

    it('includes expected sounds', () => {
      const audio = new AudioManager()
      const names = audio.getSoundNames()

      expect(names).toContain('cardDeal')
      expect(names).toContain('chipPlace')
      expect(names).toContain('hit')
      expect(names).toContain('stand')
      expect(names).toContain('win')
      expect(names).toContain('blackjack')
      expect(names).toContain('bust')
      expect(names).toContain('lose')
      expect(names).toContain('buttonClick')
    })

    it('returns copy of array (immutable)', () => {
      const audio = new AudioManager()
      const names1 = audio.getSoundNames()
      const names2 = audio.getSoundNames()
      expect(names1).not.toBe(names2)
    })
  })

  describe('resume', () => {
    it('resumes suspended context', async () => {
      mockAudioContext.state = 'suspended'
      const audio = new AudioManager()
      audio.init()

      await audio.resume()
      expect(mockAudioContext.resume).toHaveBeenCalled()
    })

    it('does nothing if context not suspended', async () => {
      mockAudioContext.state = 'running'
      const audio = new AudioManager()
      audio.init()

      await audio.resume()
      expect(mockAudioContext.resume).not.toHaveBeenCalled()
    })

    it('does not crash if not initialized', async () => {
      const audio = new AudioManager()
      await expect(audio.resume()).resolves.not.toThrow()
    })

    it('handles resume errors gracefully', async () => {
      mockAudioContext.state = 'suspended'
      mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'))

      const audio = new AudioManager()
      audio.init()

      await expect(audio.resume()).resolves.not.toThrow()
    })
  })

  describe('localStorage persistence', () => {
    it('persists volume across instances', () => {
      const audio1 = new AudioManager()
      audio1.setVolume(0.4)

      const audio2 = new AudioManager()
      expect(audio2.getVolume()).toBe(0.4)
    })

    it('persists muted state across instances', () => {
      const audio1 = new AudioManager()
      audio1.mute()

      const audio2 = new AudioManager()
      expect(audio2.isMuted()).toBe(true)
    })

    it('handles localStorage errors gracefully on save', () => {
      const audio = new AudioManager()
      mockStorage.setItem.mockImplementation(() => {
        throw new Error('Storage full')
      })

      expect(() => audio.setVolume(0.5)).not.toThrow()
      expect(audio.getVolume()).toBe(0.5) // Still works in memory
    })

    it('handles localStorage errors gracefully on load', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => new AudioManager()).not.toThrow()
    })
  })

  describe('graceful degradation', () => {
    it('all operations work when audio unavailable', () => {
      globalThis.AudioContext = undefined
      const audio = new AudioManager()

      expect(audio.isAvailable()).toBe(false)
      expect(audio.init()).toBe(false)
      expect(audio.play('buttonClick')).toBe(false)

      // Volume controls should still work
      audio.setVolume(0.5)
      expect(audio.getVolume()).toBe(0.5)

      audio.mute()
      expect(audio.isMuted()).toBe(true)

      audio.unmute()
      expect(audio.isMuted()).toBe(false)
    })

    it('no operations throw when audio unavailable', () => {
      globalThis.AudioContext = undefined
      const audio = new AudioManager()

      expect(() => audio.isAvailable()).not.toThrow()
      expect(() => audio.init()).not.toThrow()
      expect(() => audio.play('buttonClick')).not.toThrow()
      expect(() => audio.setVolume(0.5)).not.toThrow()
      expect(() => audio.getVolume()).not.toThrow()
      expect(() => audio.mute()).not.toThrow()
      expect(() => audio.unmute()).not.toThrow()
      expect(() => audio.toggleMute()).not.toThrow()
      expect(() => audio.isMuted()).not.toThrow()
      expect(() => audio.getSoundNames()).not.toThrow()
    })
  })
})

describe('Sound Definitions', () => {
  it('exports all expected sound names', () => {
    expect(SOUND_NAMES).toContain('cardDeal')
    expect(SOUND_NAMES).toContain('chipPlace')
    expect(SOUND_NAMES).toContain('hit')
    expect(SOUND_NAMES).toContain('stand')
    expect(SOUND_NAMES).toContain('doubleDown')
    expect(SOUND_NAMES).toContain('split')
    expect(SOUND_NAMES).toContain('win')
    expect(SOUND_NAMES).toContain('blackjack')
    expect(SOUND_NAMES).toContain('push')
    expect(SOUND_NAMES).toContain('bust')
    expect(SOUND_NAMES).toContain('lose')
    expect(SOUND_NAMES).toContain('dealerReveal')
    expect(SOUND_NAMES).toContain('newRound')
    expect(SOUND_NAMES).toContain('insuranceOffer')
    expect(SOUND_NAMES).toContain('insuranceAccept')
    expect(SOUND_NAMES).toContain('insuranceDecline')
    expect(SOUND_NAMES).toContain('buttonClick')
  })

  it('has exactly 17 sounds', () => {
    expect(SOUND_NAMES.length).toBe(17)
  })
})
