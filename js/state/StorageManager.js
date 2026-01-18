/**
 * @fileoverview StorageManager for LocalStorage-based state persistence.
 *
 * This module provides persistent storage for game state and user settings
 * across browser sessions. It uses localStorage with graceful degradation
 * when storage is unavailable (private browsing, quota exceeded, etc.).
 *
 * Storage Keys:
 * - {prefix}_state: Complete game state
 * - {prefix}_settings: User preferences (sound, bet amount, visual preferences)
 * - {prefix}_timestamp: Last save time in milliseconds since epoch
 *
 * @module state/StorageManager
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default storage key prefix.
 * @type {string}
 */
const DEFAULT_KEY_PREFIX = 'karate_blackjack'

/**
 * Storage key suffixes.
 * @type {Object}
 */
const KEY_SUFFIXES = Object.freeze({
  STATE: '_state',
  SETTINGS: '_settings',
  TIMESTAMP: '_timestamp'
})

// =============================================================================
// CLASS DEFINITION
// =============================================================================

/**
 * StorageManager handles persistence of game state and user settings to localStorage.
 *
 * All methods handle errors gracefully and return appropriate fallback values
 * when storage is unavailable. This ensures the game continues to function
 * even in private browsing mode or when localStorage is disabled.
 *
 * @example
 * // Basic usage
 * const storage = new StorageManager(localStorage)
 * storage.saveState({ phase: 'betting', balance: 1000 })
 * const state = storage.loadState()
 *
 * @example
 * // With custom key prefix for multiple game instances
 * const storage = new StorageManager(localStorage, 'myCustomGame')
 * storage.saveState({ phase: 'betting', balance: 500 })
 */
export class StorageManager {
  /** @type {Storage|null} The underlying storage object */
  #storage

  /** @type {string} Key prefix for all storage keys */
  #keyPrefix

  /** @type {boolean|null} Cached availability check result */
  #availabilityCache

  /**
   * Creates a new StorageManager instance.
   *
   * @param {Storage|null} [storage=null] - The storage object to use (typically localStorage)
   * @param {string} [keyPrefix=DEFAULT_KEY_PREFIX] - Prefix for all storage keys
   *
   * @example
   * // Default usage with localStorage
   * const manager = new StorageManager(localStorage)
   *
   * @example
   * // Custom key prefix
   * const manager = new StorageManager(localStorage, 'myGame')
   */
  constructor(storage = null, keyPrefix = DEFAULT_KEY_PREFIX) {
    this.#storage = storage
    this.#keyPrefix = keyPrefix
    this.#availabilityCache = null
  }

  // ===========================================================================
  // AVAILABILITY METHODS
  // ===========================================================================

  /**
   * Checks if localStorage is available and functional.
   *
   * This method tests storage by attempting to write and read a test value.
   * The result is cached to avoid repeated tests.
   *
   * @returns {boolean} True if storage is available and functional
   *
   * @example
   * if (storageManager.isAvailable()) {
   *   storageManager.saveState(gameState)
   * }
   */
  isAvailable() {
    // Return cached result if available
    if (this.#availabilityCache !== null) {
      return this.#availabilityCache
    }

    // No storage object provided
    if (!this.#storage) {
      this.#availabilityCache = false
      return false
    }

    try {
      const testKey = `${this.#keyPrefix}_test`
      this.#storage.setItem(testKey, 'test')
      this.#storage.removeItem(testKey)
      this.#availabilityCache = true
      return true
    } catch {
      // Catches QuotaExceededError, SecurityError (private browsing), etc.
      this.#availabilityCache = false
      return false
    }
  }

  // ===========================================================================
  // STATE METHODS
  // ===========================================================================

  /**
   * Saves the complete game state to localStorage.
   *
   * The state is serialized as JSON and stored with the current timestamp.
   * If storage is unavailable or an error occurs, the method returns false
   * and the game continues without persistence.
   *
   * @param {Object} state - The game state object to persist
   * @returns {boolean} True if save was successful, false otherwise
   *
   * @example
   * const success = storageManager.saveState({
   *   phase: 'betting',
   *   balance: 1000,
   *   playerHands: []
   * })
   */
  saveState(state) {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const stateKey = this.#keyPrefix + KEY_SUFFIXES.STATE
      const timestampKey = this.#keyPrefix + KEY_SUFFIXES.TIMESTAMP

      this.#storage.setItem(stateKey, JSON.stringify(state))
      this.#storage.setItem(timestampKey, String(Date.now()))

      return true
    } catch {
      // Handle QuotaExceededError, etc.
      return false
    }
  }

  /**
   * Loads the saved game state from localStorage.
   *
   * Returns null if no state is saved, storage is unavailable,
   * or the saved data is corrupted (invalid JSON).
   *
   * @returns {Object|null} The saved game state, or null if unavailable
   *
   * @example
   * const state = storageManager.loadState()
   * if (state) {
   *   gameEngine.restoreState(state)
   * } else {
   *   gameEngine.startNewGame()
   * }
   */
  loadState() {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const stateKey = this.#keyPrefix + KEY_SUFFIXES.STATE
      const json = this.#storage.getItem(stateKey)

      if (!json) {
        return null
      }

      return JSON.parse(json)
    } catch {
      // Handle JSON parse errors or storage access errors
      return null
    }
  }

  /**
   * Removes the saved game state and timestamp from localStorage.
   *
   * @returns {boolean} True if clear was successful, false otherwise
   *
   * @example
   * storageManager.clearState()
   * // Fresh game start
   */
  clearState() {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const stateKey = this.#keyPrefix + KEY_SUFFIXES.STATE
      const timestampKey = this.#keyPrefix + KEY_SUFFIXES.TIMESTAMP

      this.#storage.removeItem(stateKey)
      this.#storage.removeItem(timestampKey)

      return true
    } catch {
      return false
    }
  }

  /**
   * Checks if a saved game state exists in localStorage.
   *
   * @returns {boolean} True if saved state exists, false otherwise
   *
   * @example
   * if (storageManager.hasState()) {
   *   showResumeGamePrompt()
   * }
   */
  hasState() {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const stateKey = this.#keyPrefix + KEY_SUFFIXES.STATE
      return this.#storage.getItem(stateKey) !== null
    } catch {
      return false
    }
  }

  /**
   * Gets the timestamp of the last state save.
   *
   * @returns {number|null} Unix timestamp in milliseconds, or null if not available
   *
   * @example
   * const lastSaved = storageManager.getLastSaved()
   * if (lastSaved) {
   *   console.log(`Last saved: ${new Date(lastSaved).toLocaleString()}`)
   * }
   */
  getLastSaved() {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const timestampKey = this.#keyPrefix + KEY_SUFFIXES.TIMESTAMP
      const timestampStr = this.#storage.getItem(timestampKey)

      if (!timestampStr) {
        return null
      }

      const timestamp = Number(timestampStr)

      if (Number.isNaN(timestamp)) {
        return null
      }

      return timestamp
    } catch {
      return null
    }
  }

  // ===========================================================================
  // SETTINGS METHODS
  // ===========================================================================

  /**
   * Saves user preferences to localStorage.
   *
   * Settings are stored separately from game state, allowing preferences
   * to persist even when the game state is cleared.
   *
   * @param {Object} settings - The settings object to persist
   * @param {boolean} [settings.soundEnabled] - Sound on/off preference
   * @param {number} [settings.betAmount] - Preferred bet amount
   * @param {Object} [settings.visualPrefs] - Visual preferences (theme, card back, etc.)
   * @returns {boolean} True if save was successful, false otherwise
   *
   * @example
   * storageManager.saveSettings({
   *   soundEnabled: true,
   *   betAmount: 50,
   *   visualPrefs: { theme: 'classic', cardBack: 'red' }
   * })
   */
  saveSettings(settings) {
    if (!this.isAvailable()) {
      return false
    }

    try {
      const settingsKey = this.#keyPrefix + KEY_SUFFIXES.SETTINGS
      this.#storage.setItem(settingsKey, JSON.stringify(settings))
      return true
    } catch {
      return false
    }
  }

  /**
   * Loads user preferences from localStorage.
   *
   * Returns null if no settings are saved, storage is unavailable,
   * or the saved data is corrupted.
   *
   * @returns {Object|null} The saved settings, or null if unavailable
   *
   * @example
   * const settings = storageManager.loadSettings()
   * if (settings) {
   *   applySettings(settings)
   * } else {
   *   applyDefaultSettings()
   * }
   */
  loadSettings() {
    if (!this.isAvailable()) {
      return null
    }

    try {
      const settingsKey = this.#keyPrefix + KEY_SUFFIXES.SETTINGS
      const json = this.#storage.getItem(settingsKey)

      if (!json) {
        return null
      }

      return JSON.parse(json)
    } catch {
      return null
    }
  }
}
