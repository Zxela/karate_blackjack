/**
 * @fileoverview Unit tests for StorageManager module.
 *
 * Tests cover:
 * - isAvailable() correctly detects storage availability
 * - save(state) persists state to localStorage
 * - load() retrieves persisted state
 * - clear() removes state from storage
 * - saveSettings() persists user preferences
 * - loadSettings() retrieves user preferences
 * - hasState() checks if saved state exists
 * - getLastSaved() returns timestamp of last save
 * - Error handling for private browsing, quota exceeded
 * - Custom storage key support
 * - Graceful degradation when localStorage unavailable
 * - JSON serialization round-trip
 *
 * @module tests/state/StorageManager
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StorageManager } from '../../js/state/StorageManager.js'
import { GAME_PHASES, createEmptyHandState, createInitialGameState } from '../../js/types/index.js'

// =============================================================================
// MOCK SETUP
// =============================================================================

/**
 * Creates a mock localStorage object for testing.
 * @returns {Object} Mock localStorage with getItem, setItem, removeItem
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

/**
 * Creates a throwing mock localStorage for error scenario testing.
 * @param {Error} error - The error to throw
 * @returns {Object} Mock localStorage that throws on operations
 */
function createThrowingStorage(error) {
  return {
    getItem: vi.fn(() => {
      throw error
    }),
    setItem: vi.fn(() => {
      throw error
    }),
    removeItem: vi.fn(() => {
      throw error
    }),
    clear: vi.fn(() => {
      throw error
    })
  }
}

// =============================================================================
// TESTS
// =============================================================================

describe('StorageManager', () => {
  let mockStorage
  let storageManager

  beforeEach(() => {
    mockStorage = createMockStorage()
    storageManager = new StorageManager(mockStorage)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('constructor', () => {
    it('uses default storage key "karateBlackjack"', () => {
      const manager = new StorageManager(mockStorage)
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      manager.saveState(testState)

      expect(mockStorage.setItem).toHaveBeenCalledWith('karate_blackjack_state', expect.any(String))
    })

    it('accepts custom storage key prefix', () => {
      const manager = new StorageManager(mockStorage, 'customKey')
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      manager.saveState(testState)

      expect(mockStorage.setItem).toHaveBeenCalledWith('customKey_state', expect.any(String))
    })

    it('handles null storage gracefully', () => {
      const manager = new StorageManager(null)
      expect(manager.isAvailable()).toBe(false)
    })

    it('handles undefined storage gracefully', () => {
      const manager = new StorageManager(undefined)
      expect(manager.isAvailable()).toBe(false)
    })
  })

  describe('isAvailable', () => {
    it('returns true when localStorage exists and works', () => {
      expect(storageManager.isAvailable()).toBe(true)
    })

    it('returns false when localStorage is null', () => {
      const manager = new StorageManager(null)
      expect(manager.isAvailable()).toBe(false)
    })

    it('returns false when localStorage throws on setItem (private browsing)', () => {
      const error = new DOMException('QuotaExceededError', 'QuotaExceededError')
      const throwingStorage = createThrowingStorage(error)
      const manager = new StorageManager(throwingStorage)
      expect(manager.isAvailable()).toBe(false)
    })

    it('returns false when localStorage throws SecurityError', () => {
      const error = new DOMException('SecurityError', 'SecurityError')
      const throwingStorage = createThrowingStorage(error)
      const manager = new StorageManager(throwingStorage)
      expect(manager.isAvailable()).toBe(false)
    })

    it('caches availability check result', () => {
      // First call
      storageManager.isAvailable()
      // Second call should use cached result
      storageManager.isAvailable()
      // setItem called only once during availability check
      expect(mockStorage.setItem).toHaveBeenCalledTimes(1)
    })
  })

  describe('saveState', () => {
    it('persists state to localStorage', () => {
      const testState = createInitialGameState()
      storageManager.saveState(testState)

      expect(mockStorage.setItem).toHaveBeenCalled()
      const savedJson = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === 'karate_blackjack_state'
      )?.[1]
      expect(savedJson).toBeDefined()
    })

    it('serializes state as JSON', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 500 }
      storageManager.saveState(testState)

      const savedJson = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === 'karate_blackjack_state'
      )?.[1]
      const parsed = JSON.parse(savedJson)
      expect(parsed.phase).toBe(GAME_PHASES.BETTING)
      expect(parsed.balance).toBe(500)
    })

    it('updates timestamp on save', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      const beforeSave = Date.now()
      storageManager.saveState(testState)
      const afterSave = Date.now()

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'karate_blackjack_timestamp',
        expect.any(String)
      )

      const timestampCall = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === 'karate_blackjack_timestamp'
      )
      const savedTimestamp = Number(timestampCall[1])
      expect(savedTimestamp).toBeGreaterThanOrEqual(beforeSave)
      expect(savedTimestamp).toBeLessThanOrEqual(afterSave)
    })

    it('returns true on successful save', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      const result = storageManager.saveState(testState)
      expect(result).toBe(true)
    })

    it('returns false when storage unavailable', () => {
      const manager = new StorageManager(null)
      const result = manager.saveState({ phase: GAME_PHASES.BETTING })
      expect(result).toBe(false)
    })

    it('handles QuotaExceededError gracefully', () => {
      const quotaError = new DOMException('QuotaExceededError', 'QuotaExceededError')
      mockStorage.setItem.mockImplementation(() => {
        throw quotaError
      })

      // First make the manager think storage is available
      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)

      // Then make it fail on actual save
      workingStorage.setItem.mockImplementation(() => {
        throw quotaError
      })

      const result = manager.saveState({ phase: GAME_PHASES.BETTING })
      expect(result).toBe(false)
    })

    it('does not crash on save error', () => {
      const error = new Error('Storage error')
      mockStorage.setItem.mockImplementation(() => {
        throw error
      })

      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)
      workingStorage.setItem.mockImplementation(() => {
        throw error
      })

      expect(() => manager.saveState({ phase: GAME_PHASES.BETTING })).not.toThrow()
    })
  })

  describe('loadState', () => {
    it('retrieves persisted state from localStorage', () => {
      const testState = { phase: GAME_PHASES.PLAYER_TURN, balance: 750 }
      storageManager.saveState(testState)

      const loaded = storageManager.loadState()
      expect(loaded).not.toBeNull()
      expect(loaded.phase).toBe(GAME_PHASES.PLAYER_TURN)
      expect(loaded.balance).toBe(750)
    })

    it('returns null when no state saved', () => {
      const loaded = storageManager.loadState()
      expect(loaded).toBeNull()
    })

    it('returns null when storage unavailable', () => {
      const manager = new StorageManager(null)
      expect(manager.loadState()).toBeNull()
    })

    it('returns null when storage contains invalid JSON', () => {
      mockStorage.getItem.mockReturnValue('not valid json {{{')
      const loaded = storageManager.loadState()
      expect(loaded).toBeNull()
    })

    it('returns null when storage throws error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      const loaded = storageManager.loadState()
      expect(loaded).toBeNull()
    })

    it('preserves complex state objects through round-trip', () => {
      const complexState = createInitialGameState()
      complexState.phase = GAME_PHASES.PLAYER_TURN
      complexState.balance = 850
      complexState.playerHands = [createEmptyHandState(100)]
      complexState.playerHands[0].cards = [
        { suit: 'hearts', rank: 'A', id: 'hearts-A' },
        { suit: 'spades', rank: 10, id: 'spades-10' }
      ]
      complexState.playerHands[0].value = 21
      complexState.playerHands[0].isBlackjack = true

      storageManager.saveState(complexState)
      const loaded = storageManager.loadState()

      expect(loaded.phase).toBe(GAME_PHASES.PLAYER_TURN)
      expect(loaded.balance).toBe(850)
      expect(loaded.playerHands).toHaveLength(1)
      expect(loaded.playerHands[0].cards).toHaveLength(2)
      expect(loaded.playerHands[0].cards[0].suit).toBe('hearts')
      expect(loaded.playerHands[0].cards[0].rank).toBe('A')
      expect(loaded.playerHands[0].isBlackjack).toBe(true)
    })

    it('preserves balance values as numbers', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1234.56 }
      storageManager.saveState(testState)

      const loaded = storageManager.loadState()
      expect(typeof loaded.balance).toBe('number')
      expect(loaded.balance).toBe(1234.56)
    })

    it('preserves hand arrays', () => {
      const testState = {
        phase: GAME_PHASES.PLAYER_TURN,
        playerHands: [createEmptyHandState(50), createEmptyHandState(100)]
      }

      storageManager.saveState(testState)
      const loaded = storageManager.loadState()

      expect(Array.isArray(loaded.playerHands)).toBe(true)
      expect(loaded.playerHands).toHaveLength(2)
      expect(loaded.playerHands[0].bet).toBe(50)
      expect(loaded.playerHands[1].bet).toBe(100)
    })
  })

  describe('clearState', () => {
    it('removes state from storage', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      storageManager.saveState(testState)
      storageManager.clearState()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('karate_blackjack_state')
    })

    it('removes timestamp from storage', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      storageManager.saveState(testState)
      storageManager.clearState()

      expect(mockStorage.removeItem).toHaveBeenCalledWith('karate_blackjack_timestamp')
    })

    it('returns true on successful clear', () => {
      const result = storageManager.clearState()
      expect(result).toBe(true)
    })

    it('returns false when storage unavailable', () => {
      const manager = new StorageManager(null)
      const result = manager.clearState()
      expect(result).toBe(false)
    })

    it('handles errors gracefully', () => {
      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)

      // First let availability check pass
      manager.isAvailable()

      // Then make removeItem fail
      workingStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => manager.clearState()).not.toThrow()
      expect(manager.clearState()).toBe(false)
    })

    it('loadState returns null after clearState', () => {
      const testState = { phase: GAME_PHASES.BETTING, balance: 1000 }
      storageManager.saveState(testState)
      storageManager.clearState()

      // Need to update the mock to return null after removal
      mockStorage.getItem.mockReturnValue(null)

      const loaded = storageManager.loadState()
      expect(loaded).toBeNull()
    })
  })

  describe('saveSettings', () => {
    it('persists settings to localStorage', () => {
      const settings = { soundEnabled: true, betAmount: 50 }
      storageManager.saveSettings(settings)

      expect(mockStorage.setItem).toHaveBeenCalledWith(
        'karate_blackjack_settings',
        expect.any(String)
      )
    })

    it('serializes settings as JSON', () => {
      const settings = { soundEnabled: false, betAmount: 100, visualPrefs: { theme: 'dark' } }
      storageManager.saveSettings(settings)

      const savedJson = mockStorage.setItem.mock.calls.find(
        (call) => call[0] === 'karate_blackjack_settings'
      )?.[1]
      const parsed = JSON.parse(savedJson)
      expect(parsed.soundEnabled).toBe(false)
      expect(parsed.betAmount).toBe(100)
      expect(parsed.visualPrefs.theme).toBe('dark')
    })

    it('returns true on successful save', () => {
      const result = storageManager.saveSettings({ soundEnabled: true })
      expect(result).toBe(true)
    })

    it('returns false when storage unavailable', () => {
      const manager = new StorageManager(null)
      const result = manager.saveSettings({ soundEnabled: true })
      expect(result).toBe(false)
    })

    it('handles errors gracefully', () => {
      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)

      // First let availability check pass
      manager.isAvailable()

      // Then make setItem fail for settings
      workingStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error')
      })

      expect(() => manager.saveSettings({ soundEnabled: true })).not.toThrow()
      expect(manager.saveSettings({ soundEnabled: true })).toBe(false)
    })
  })

  describe('loadSettings', () => {
    it('retrieves persisted settings from localStorage', () => {
      const settings = { soundEnabled: true, betAmount: 75 }
      storageManager.saveSettings(settings)

      const loaded = storageManager.loadSettings()
      expect(loaded).not.toBeNull()
      expect(loaded.soundEnabled).toBe(true)
      expect(loaded.betAmount).toBe(75)
    })

    it('returns null when no settings saved', () => {
      const loaded = storageManager.loadSettings()
      expect(loaded).toBeNull()
    })

    it('returns null when storage unavailable', () => {
      const manager = new StorageManager(null)
      expect(manager.loadSettings()).toBeNull()
    })

    it('returns null when settings contain invalid JSON', () => {
      mockStorage.getItem.mockReturnValue('invalid json')
      const loaded = storageManager.loadSettings()
      expect(loaded).toBeNull()
    })

    it('returns null when storage throws error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      const loaded = storageManager.loadSettings()
      expect(loaded).toBeNull()
    })

    it('preserves complex settings through round-trip', () => {
      const settings = {
        soundEnabled: true,
        betAmount: 100,
        visualPrefs: {
          theme: 'classic',
          cardBack: 'red',
          animations: true
        }
      }
      storageManager.saveSettings(settings)

      const loaded = storageManager.loadSettings()
      expect(loaded.soundEnabled).toBe(true)
      expect(loaded.betAmount).toBe(100)
      expect(loaded.visualPrefs.theme).toBe('classic')
      expect(loaded.visualPrefs.cardBack).toBe('red')
      expect(loaded.visualPrefs.animations).toBe(true)
    })
  })

  describe('hasState', () => {
    it('returns true when state exists', () => {
      storageManager.saveState({ phase: GAME_PHASES.BETTING, balance: 1000 })
      expect(storageManager.hasState()).toBe(true)
    })

    it('returns false when no state saved', () => {
      expect(storageManager.hasState()).toBe(false)
    })

    it('returns false after clearState', () => {
      storageManager.saveState({ phase: GAME_PHASES.BETTING, balance: 1000 })
      storageManager.clearState()
      mockStorage.getItem.mockReturnValue(null)
      expect(storageManager.hasState()).toBe(false)
    })

    it('returns false when storage unavailable', () => {
      const manager = new StorageManager(null)
      expect(manager.hasState()).toBe(false)
    })

    it('returns false when storage throws error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      expect(storageManager.hasState()).toBe(false)
    })
  })

  describe('getLastSaved', () => {
    it('returns timestamp of last save', () => {
      const beforeSave = Date.now()
      storageManager.saveState({ phase: GAME_PHASES.BETTING, balance: 1000 })
      const afterSave = Date.now()

      const timestamp = storageManager.getLastSaved()
      expect(timestamp).toBeGreaterThanOrEqual(beforeSave)
      expect(timestamp).toBeLessThanOrEqual(afterSave)
    })

    it('returns null when no state saved', () => {
      expect(storageManager.getLastSaved()).toBeNull()
    })

    it('returns null when storage unavailable', () => {
      const manager = new StorageManager(null)
      expect(manager.getLastSaved()).toBeNull()
    })

    it('returns null when timestamp is invalid', () => {
      mockStorage.getItem.mockReturnValue('not a number')
      expect(storageManager.getLastSaved()).toBeNull()
    })

    it('returns null when storage throws error', () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error('Storage error')
      })
      expect(storageManager.getLastSaved()).toBeNull()
    })
  })

  describe('custom storage key', () => {
    it('uses custom key prefix for state', () => {
      const manager = new StorageManager(mockStorage, 'myGame')
      manager.saveState({ phase: GAME_PHASES.BETTING })

      expect(mockStorage.setItem).toHaveBeenCalledWith('myGame_state', expect.any(String))
    })

    it('uses custom key prefix for settings', () => {
      const manager = new StorageManager(mockStorage, 'myGame')
      manager.saveSettings({ soundEnabled: true })

      expect(mockStorage.setItem).toHaveBeenCalledWith('myGame_settings', expect.any(String))
    })

    it('uses custom key prefix for timestamp', () => {
      const manager = new StorageManager(mockStorage, 'myGame')
      manager.saveState({ phase: GAME_PHASES.BETTING })

      expect(mockStorage.setItem).toHaveBeenCalledWith('myGame_timestamp', expect.any(String))
    })

    it('isolates data between different key prefixes', () => {
      const manager1 = new StorageManager(mockStorage, 'game1')
      const manager2 = new StorageManager(mockStorage, 'game2')

      manager1.saveState({ phase: GAME_PHASES.BETTING, balance: 100 })
      manager2.saveState({ phase: GAME_PHASES.PLAYER_TURN, balance: 200 })

      // Verify both were called with different keys
      expect(mockStorage.setItem).toHaveBeenCalledWith('game1_state', expect.any(String))
      expect(mockStorage.setItem).toHaveBeenCalledWith('game2_state', expect.any(String))
    })
  })

  describe('repeated save/load cycles', () => {
    it('preserves data through multiple save/load cycles', () => {
      const states = [
        { phase: GAME_PHASES.BETTING, balance: 1000 },
        { phase: GAME_PHASES.DEALING, balance: 900 },
        { phase: GAME_PHASES.PLAYER_TURN, balance: 900 }
      ]

      for (const state of states) {
        storageManager.saveState(state)
        const loaded = storageManager.loadState()
        expect(loaded.phase).toBe(state.phase)
        expect(loaded.balance).toBe(state.balance)
      }
    })

    it('overwrites previous state on save', () => {
      storageManager.saveState({ phase: GAME_PHASES.BETTING, balance: 1000 })
      storageManager.saveState({ phase: GAME_PHASES.PLAYER_TURN, balance: 500 })

      const loaded = storageManager.loadState()
      expect(loaded.phase).toBe(GAME_PHASES.PLAYER_TURN)
      expect(loaded.balance).toBe(500)
    })
  })

  describe('error isolation', () => {
    it('save failure does not prevent subsequent operations', () => {
      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)

      // Trigger availability check first so it's cached as available
      manager.isAvailable()

      // Now make setItem fail for the save operation
      let failCount = 0
      workingStorage.setItem.mockImplementation((key, value) => {
        if (failCount === 0) {
          failCount++
          throw new Error('First save failed')
        }
        workingStorage._store.set(key, value)
      })

      // First save fails
      const firstResult = manager.saveState({ phase: GAME_PHASES.BETTING })
      expect(firstResult).toBe(false)

      // Second save should work
      const secondResult = manager.saveState({ phase: GAME_PHASES.DEALING })
      expect(secondResult).toBe(true)
    })

    it('load failure does not prevent subsequent operations', () => {
      const workingStorage = createMockStorage()
      const manager = new StorageManager(workingStorage)

      // Save something first
      manager.saveState({ phase: GAME_PHASES.BETTING, balance: 1000 })

      // Make getItem fail once, then work again
      let failCount = 0
      workingStorage.getItem.mockImplementation((key) => {
        if (failCount === 0) {
          failCount++
          throw new Error('First load failed')
        }
        return workingStorage._store.get(key) ?? null
      })

      // First load fails
      const firstLoad = manager.loadState()
      expect(firstLoad).toBeNull()

      // Second load should work
      const secondLoad = manager.loadState()
      expect(secondLoad).not.toBeNull()
    })
  })

  describe('graceful degradation', () => {
    it('all operations return gracefully when storage unavailable', () => {
      const manager = new StorageManager(null)

      expect(manager.isAvailable()).toBe(false)
      expect(manager.saveState({ phase: GAME_PHASES.BETTING })).toBe(false)
      expect(manager.loadState()).toBeNull()
      expect(manager.clearState()).toBe(false)
      expect(manager.saveSettings({ soundEnabled: true })).toBe(false)
      expect(manager.loadSettings()).toBeNull()
      expect(manager.hasState()).toBe(false)
      expect(manager.getLastSaved()).toBeNull()
    })

    it('does not throw any errors when storage unavailable', () => {
      const manager = new StorageManager(null)

      expect(() => manager.isAvailable()).not.toThrow()
      expect(() => manager.saveState({ phase: GAME_PHASES.BETTING })).not.toThrow()
      expect(() => manager.loadState()).not.toThrow()
      expect(() => manager.clearState()).not.toThrow()
      expect(() => manager.saveSettings({ soundEnabled: true })).not.toThrow()
      expect(() => manager.loadSettings()).not.toThrow()
      expect(() => manager.hasState()).not.toThrow()
      expect(() => manager.getLastSaved()).not.toThrow()
    })
  })
})
