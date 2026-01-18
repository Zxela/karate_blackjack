/**
 * @fileoverview Audio manager for Karate Blackjack game.
 *
 * Provides a high-level interface for playing synthesized 8-bit retro arcade
 * sounds using the Web Audio API. Handles initialization on user gesture,
 * volume control, muting, and graceful degradation.
 *
 * @module audio/AudioManager
 * @version 1.0.0
 */

import { SOUNDS, SOUND_NAMES } from './soundDefinitions.js'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default volume level (0-1).
 * @type {number}
 */
const DEFAULT_VOLUME = 0.7

/**
 * Storage key for volume settings.
 * @type {string}
 */
const STORAGE_KEY = 'karate_blackjack_audio'

// =============================================================================
// AUDIO MANAGER CLASS
// =============================================================================

/**
 * AudioManager handles all game audio through Web Audio API synthesis.
 *
 * Key features:
 * - Lazy initialization (waits for user gesture)
 * - Volume control with persistence
 * - Mute/unmute functionality
 * - Graceful degradation when audio unavailable
 *
 * @class AudioManager
 * @example
 * const audio = new AudioManager()
 *
 * // Initialize on first user interaction
 * document.addEventListener('click', () => audio.init(), { once: true })
 *
 * // Play sounds
 * audio.play('cardDeal')
 * audio.play('win')
 *
 * // Volume control
 * audio.setVolume(0.5)
 * audio.mute()
 * audio.unmute()
 */
export class AudioManager {
  /**
   * Creates a new AudioManager instance.
   */
  constructor() {
    /** @private @type {AudioContext|null} */
    this._context = null

    /** @private @type {GainNode|null} */
    this._masterGain = null

    /** @private @type {boolean} */
    this._initialized = false

    /** @private @type {boolean} */
    this._available = this._checkAvailability()

    /** @private @type {number} */
    this._volume = DEFAULT_VOLUME

    /** @private @type {boolean} */
    this._muted = false

    /** @private @type {number} */
    this._volumeBeforeMute = DEFAULT_VOLUME

    // Load saved settings
    this._loadSettings()
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initializes the audio context. Must be called from a user gesture
   * (click, touch, keypress) due to browser autoplay policies.
   *
   * @returns {boolean} True if initialization succeeded
   *
   * @example
   * button.addEventListener('click', () => {
   *   if (audioManager.init()) {
   *     console.log('Audio ready!')
   *   }
   * })
   */
  init() {
    if (this._initialized) {
      return true
    }

    if (!this._available) {
      console.warn('AudioManager: Web Audio API not available')
      return false
    }

    try {
      // Create audio context - use globalThis for test compatibility
      const global =
        typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}
      const AudioContextClass = global.AudioContext || global.webkitAudioContext
      this._context = new AudioContextClass()

      // Create master gain node
      this._masterGain = this._context.createGain()
      this._masterGain.connect(this._context.destination)

      // Apply saved volume
      this._applyVolume()

      this._initialized = true
      console.log('AudioManager: Initialized successfully')

      return true
    } catch (error) {
      console.warn('AudioManager: Failed to initialize', error)
      this._available = false
      return false
    }
  }

  /**
   * Resumes the audio context if it was suspended.
   * Called automatically on play(), but can be called manually.
   *
   * @returns {Promise<void>}
   */
  async resume() {
    if (this._context && this._context.state === 'suspended') {
      try {
        await this._context.resume()
      } catch (error) {
        console.warn('AudioManager: Failed to resume context', error)
      }
    }
  }

  // ===========================================================================
  // SOUND PLAYBACK
  // ===========================================================================

  /**
   * Plays a sound by name.
   *
   * @param {string} soundName - Name of the sound to play (from SOUND_NAMES)
   * @returns {boolean} True if sound played successfully
   *
   * @example
   * audioManager.play('cardDeal')
   * audioManager.play('win')
   * audioManager.play('buttonClick')
   */
  play(soundName) {
    // Check if we can play
    if (!this._available || this._muted) {
      return false
    }

    // Initialize if needed (on first play attempt)
    if (!this._initialized) {
      if (!this.init()) {
        return false
      }
    }

    // Resume context if suspended
    if (this._context.state === 'suspended') {
      this._context.resume()
    }

    // Get sound function
    const soundFn = SOUNDS[soundName]
    if (!soundFn) {
      console.warn(`AudioManager: Unknown sound "${soundName}"`)
      return false
    }

    try {
      // Play the sound
      soundFn(this._context, this._masterGain)
      return true
    } catch (error) {
      console.warn(`AudioManager: Error playing "${soundName}"`, error)
      return false
    }
  }

  // ===========================================================================
  // VOLUME CONTROL
  // ===========================================================================

  /**
   * Sets the master volume level.
   *
   * @param {number} level - Volume level (0-1)
   *
   * @example
   * audioManager.setVolume(0.5) // 50% volume
   * audioManager.setVolume(1)   // Full volume
   * audioManager.setVolume(0)   // Muted
   */
  setVolume(level) {
    // Clamp to valid range
    this._volume = Math.max(0, Math.min(1, level))

    // If setting volume > 0, unmute
    if (this._volume > 0 && this._muted) {
      this._muted = false
    }

    // If setting volume to 0, mute
    if (this._volume === 0) {
      this._muted = true
    }

    this._applyVolume()
    this._saveSettings()
  }

  /**
   * Gets the current volume level.
   *
   * @returns {number} Current volume level (0-1)
   */
  getVolume() {
    return this._volume
  }

  /**
   * Mutes all audio output.
   * Remembers the previous volume for unmute.
   */
  mute() {
    if (this._muted) return

    this._volumeBeforeMute = this._volume
    this._muted = true
    this._applyVolume()
    this._saveSettings()
  }

  /**
   * Unmutes audio output.
   * Restores the volume from before muting.
   */
  unmute() {
    if (!this._muted) return

    this._muted = false
    // Restore previous volume, or default if it was 0
    this._volume = this._volumeBeforeMute > 0 ? this._volumeBeforeMute : DEFAULT_VOLUME
    this._applyVolume()
    this._saveSettings()
  }

  /**
   * Toggles mute state.
   *
   * @returns {boolean} New muted state
   */
  toggleMute() {
    if (this._muted) {
      this.unmute()
    } else {
      this.mute()
    }
    return this._muted
  }

  /**
   * Checks if audio is currently muted.
   *
   * @returns {boolean} True if muted
   */
  isMuted() {
    return this._muted
  }

  // ===========================================================================
  // STATUS
  // ===========================================================================

  /**
   * Checks if audio is available and can play sounds.
   *
   * @returns {boolean} True if audio is available
   */
  isAvailable() {
    return this._available
  }

  /**
   * Checks if the audio manager has been initialized.
   *
   * @returns {boolean} True if initialized
   */
  isInitialized() {
    return this._initialized
  }

  /**
   * Gets the list of available sound names.
   *
   * @returns {string[]} Array of sound names
   */
  getSoundNames() {
    return [...SOUND_NAMES]
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Checks if Web Audio API is available.
   *
   * @returns {boolean}
   * @private
   */
  _checkAvailability() {
    // Use globalThis to support both browser and test environments
    const global =
      typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}
    return !!(global.AudioContext || global.webkitAudioContext)
  }

  /**
   * Applies the current volume to the master gain node.
   * @private
   */
  _applyVolume() {
    if (!this._masterGain || !this._context) return

    const effectiveVolume = this._muted ? 0 : this._volume
    this._masterGain.gain.setValueAtTime(effectiveVolume, this._context.currentTime)
  }

  /**
   * Gets the localStorage object if available.
   * @returns {Storage|null}
   * @private
   */
  _getStorage() {
    try {
      const global =
        typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : {}
      return global.localStorage || null
    } catch {
      return null
    }
  }

  /**
   * Saves volume settings to localStorage.
   * @private
   */
  _saveSettings() {
    try {
      const storage = this._getStorage()
      if (!storage) return

      const settings = {
        volume: this._volume,
        muted: this._muted
      }
      storage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage errors (private browsing, etc.)
    }
  }

  /**
   * Loads volume settings from localStorage.
   * @private
   */
  _loadSettings() {
    try {
      const storage = this._getStorage()
      if (!storage) return

      const json = storage.getItem(STORAGE_KEY)
      if (json) {
        const settings = JSON.parse(json)
        if (typeof settings.volume === 'number') {
          this._volume = Math.max(0, Math.min(1, settings.volume))
        }
        if (typeof settings.muted === 'boolean') {
          this._muted = settings.muted
        }
        // Store volume before mute for unmute functionality
        this._volumeBeforeMute = this._volume
      }
    } catch {
      // Ignore storage/parse errors, use defaults
    }
  }
}

// =============================================================================
// SINGLETON INSTANCE
// =============================================================================

/**
 * Singleton AudioManager instance for the game.
 * @type {AudioManager}
 */
export const audioManager = new AudioManager()
