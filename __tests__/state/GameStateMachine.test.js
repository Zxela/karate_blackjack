/**
 * @fileoverview Unit tests for GameStateMachine module.
 *
 * Tests cover:
 * - Constructor initialization (initial state = betting)
 * - getPhase() returns current phase
 * - Valid state transitions
 * - Invalid state transitions (rejection)
 * - canTransition() boolean check
 * - transition() execution with error handling
 * - Subscriber registration and notification
 * - Unsubscribe functionality
 * - Action validation per phase (isActionAllowed)
 * - reset() functionality
 * - Edge cases and error handling
 *
 * @module tests/state/GameStateMachine
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { GameStateMachine } from '../../js/state/GameStateMachine.js'
import { GAME_PHASES } from '../../js/types/index.js'

describe('GameStateMachine', () => {
  let machine

  beforeEach(() => {
    machine = new GameStateMachine()
  })

  describe('constructor', () => {
    it('initializes in BETTING phase', () => {
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('initializes with empty subscribers array', () => {
      // Indirectly test by checking no callbacks are called
      const callback = vi.fn()
      machine.transition(GAME_PHASES.DEALING)
      expect(callback).not.toHaveBeenCalled()
    })

    it('accepts optional storageManager parameter', () => {
      const mockStorage = { loadState: vi.fn() }
      const machineWithStorage = new GameStateMachine(mockStorage)
      expect(machineWithStorage.getPhase()).toBe(GAME_PHASES.BETTING)
    })
  })

  describe('getPhase', () => {
    it('returns current phase as string', () => {
      expect(typeof machine.getPhase()).toBe('string')
    })

    it('returns betting initially', () => {
      expect(machine.getPhase()).toBe('betting')
    })

    it('returns dealing after valid transition', () => {
      machine.transition(GAME_PHASES.DEALING)
      expect(machine.getPhase()).toBe('dealing')
    })

    it('returns playerTurn after transitioning through dealing', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(machine.getPhase()).toBe('playerTurn')
    })
  })

  describe('valid state transitions', () => {
    it('allows betting -> dealing', () => {
      expect(() => machine.transition(GAME_PHASES.DEALING)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.DEALING)
    })

    it('allows dealing -> insuranceCheck when dealer shows Ace', () => {
      machine.transition(GAME_PHASES.DEALING)
      expect(() => machine.transition(GAME_PHASES.INSURANCE_CHECK)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.INSURANCE_CHECK)
    })

    it('allows dealing -> playerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      expect(() => machine.transition(GAME_PHASES.PLAYER_TURN)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.PLAYER_TURN)
    })

    it('allows insuranceCheck -> playerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.INSURANCE_CHECK)
      expect(() => machine.transition(GAME_PHASES.PLAYER_TURN)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.PLAYER_TURN)
    })

    it('allows playerTurn -> dealerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(() => machine.transition(GAME_PHASES.DEALER_TURN)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.DEALER_TURN)
    })

    it('allows dealerTurn -> resolution', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(() => machine.transition(GAME_PHASES.RESOLUTION)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.RESOLUTION)
    })

    it('allows resolution -> gameOver', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      expect(() => machine.transition(GAME_PHASES.GAME_OVER)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.GAME_OVER)
    })

    it('allows gameOver -> betting (new round)', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      expect(() => machine.transition(GAME_PHASES.BETTING)).not.toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('completes full game cycle', () => {
      // Full cycle: betting -> dealing -> playerTurn -> dealerTurn -> resolution -> gameOver -> betting
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      machine.transition(GAME_PHASES.BETTING)
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('completes full game cycle with insurance check', () => {
      // Full cycle with insurance: betting -> dealing -> insuranceCheck -> playerTurn -> dealerTurn -> resolution -> gameOver
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.INSURANCE_CHECK)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      expect(machine.getPhase()).toBe(GAME_PHASES.GAME_OVER)
    })
  })

  describe('invalid state transitions', () => {
    it('rejects betting -> dealerTurn', () => {
      expect(() => machine.transition(GAME_PHASES.DEALER_TURN)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects betting -> playerTurn', () => {
      expect(() => machine.transition(GAME_PHASES.PLAYER_TURN)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects betting -> resolution', () => {
      expect(() => machine.transition(GAME_PHASES.RESOLUTION)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects betting -> gameOver', () => {
      expect(() => machine.transition(GAME_PHASES.GAME_OVER)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects betting -> insuranceCheck', () => {
      expect(() => machine.transition(GAME_PHASES.INSURANCE_CHECK)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects playerTurn -> betting', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(() => machine.transition(GAME_PHASES.BETTING)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.PLAYER_TURN)
    })

    it('rejects playerTurn -> dealing', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(() => machine.transition(GAME_PHASES.DEALING)).toThrow()
    })

    it('rejects dealerTurn -> playerTurn (backwards)', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(() => machine.transition(GAME_PHASES.PLAYER_TURN)).toThrow()
    })

    it('rejects resolution -> dealing', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      expect(() => machine.transition(GAME_PHASES.DEALING)).toThrow()
    })

    it('rejects transition to invalid state string', () => {
      expect(() => machine.transition('invalidState')).toThrow()
    })

    it('rejects transition to null', () => {
      expect(() => machine.transition(null)).toThrow()
    })

    it('rejects transition to undefined', () => {
      expect(() => machine.transition(undefined)).toThrow()
    })

    it('rejects transition to number', () => {
      expect(() => machine.transition(123)).toThrow()
    })

    it('rejects transition to same state', () => {
      expect(() => machine.transition(GAME_PHASES.BETTING)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('rejects skipping states (betting -> resolution)', () => {
      expect(() => machine.transition(GAME_PHASES.RESOLUTION)).toThrow()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })
  })

  describe('canTransition', () => {
    it('returns true for betting -> dealing', () => {
      expect(machine.canTransition(GAME_PHASES.DEALING)).toBe(true)
    })

    it('returns false for betting -> dealerTurn', () => {
      expect(machine.canTransition(GAME_PHASES.DEALER_TURN)).toBe(false)
    })

    it('returns false for betting -> playerTurn', () => {
      expect(machine.canTransition(GAME_PHASES.PLAYER_TURN)).toBe(false)
    })

    it('returns boolean and does not throw', () => {
      expect(typeof machine.canTransition(GAME_PHASES.DEALING)).toBe('boolean')
      expect(typeof machine.canTransition(GAME_PHASES.RESOLUTION)).toBe('boolean')
    })

    it('returns false for invalid state string', () => {
      expect(machine.canTransition('invalidState')).toBe(false)
    })

    it('returns true for dealing -> playerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      expect(machine.canTransition(GAME_PHASES.PLAYER_TURN)).toBe(true)
    })

    it('returns true for dealing -> insuranceCheck', () => {
      machine.transition(GAME_PHASES.DEALING)
      expect(machine.canTransition(GAME_PHASES.INSURANCE_CHECK)).toBe(true)
    })

    it('returns true for insuranceCheck -> playerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.INSURANCE_CHECK)
      expect(machine.canTransition(GAME_PHASES.PLAYER_TURN)).toBe(true)
    })

    it('returns true for playerTurn -> dealerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(machine.canTransition(GAME_PHASES.DEALER_TURN)).toBe(true)
    })

    it('returns true for dealerTurn -> resolution', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(machine.canTransition(GAME_PHASES.RESOLUTION)).toBe(true)
    })

    it('returns true for resolution -> gameOver', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      expect(machine.canTransition(GAME_PHASES.GAME_OVER)).toBe(true)
    })

    it('returns true for gameOver -> betting', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      expect(machine.canTransition(GAME_PHASES.BETTING)).toBe(true)
    })

    it('returns false for backwards transition dealerTurn -> playerTurn', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(machine.canTransition(GAME_PHASES.PLAYER_TURN)).toBe(false)
    })

    it('returns false for same state transition', () => {
      expect(machine.canTransition(GAME_PHASES.BETTING)).toBe(false)
    })

    it('returns false for null input', () => {
      expect(machine.canTransition(null)).toBe(false)
    })

    it('returns false for undefined input', () => {
      expect(machine.canTransition(undefined)).toBe(false)
    })
  })

  describe('transition', () => {
    it('returns the new phase after successful transition', () => {
      const result = machine.transition(GAME_PHASES.DEALING)
      expect(result).toBe(GAME_PHASES.DEALING)
    })

    it('throws error with descriptive message on invalid transition', () => {
      expect(() => machine.transition(GAME_PHASES.RESOLUTION)).toThrowError(/invalid transition/i)
    })

    it('includes current and target phase in error message', () => {
      try {
        machine.transition(GAME_PHASES.RESOLUTION)
      } catch (error) {
        expect(error.message).toContain('betting')
        expect(error.message).toContain('resolution')
      }
    })

    it('does not change state when transition fails', () => {
      const initialPhase = machine.getPhase()
      try {
        machine.transition(GAME_PHASES.RESOLUTION)
      } catch {
        // Expected to throw
      }
      expect(machine.getPhase()).toBe(initialPhase)
    })
  })

  describe('subscribe and notifications', () => {
    it('registers a callback via subscribe', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      expect(callback).toHaveBeenCalled()
    })

    it('notifies subscribers with new phase as first argument', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      expect(callback.mock.calls[0][0]).toBe(GAME_PHASES.DEALING)
    })

    it('notifies subscribers with previous phase', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      expect(callback).toHaveBeenCalledWith(GAME_PHASES.DEALING, GAME_PHASES.BETTING)
    })

    it('notifies all registered subscribers', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const callback3 = vi.fn()
      machine.subscribe(callback1)
      machine.subscribe(callback2)
      machine.subscribe(callback3)
      machine.transition(GAME_PHASES.DEALING)
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      expect(callback3).toHaveBeenCalled()
    })

    it('subscribe returns unsubscribe function', () => {
      const callback = vi.fn()
      const unsubscribe = machine.subscribe(callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('unsubscribe removes callback from subscribers', () => {
      const callback = vi.fn()
      const unsubscribe = machine.subscribe(callback)
      unsubscribe()
      machine.transition(GAME_PHASES.DEALING)
      expect(callback).not.toHaveBeenCalled()
    })

    it('only removes the specific unsubscribed callback', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      const unsubscribe1 = machine.subscribe(callback1)
      machine.subscribe(callback2)
      unsubscribe1()
      machine.transition(GAME_PHASES.DEALING)
      expect(callback1).not.toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
    })

    it('does not notify on failed transitions', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      try {
        machine.transition(GAME_PHASES.RESOLUTION)
      } catch {
        // Expected
      }
      expect(callback).not.toHaveBeenCalled()
    })

    it('handles callback errors gracefully', () => {
      const errorCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      const normalCallback = vi.fn()
      machine.subscribe(errorCallback)
      machine.subscribe(normalCallback)
      expect(() => machine.transition(GAME_PHASES.DEALING)).not.toThrow()
      expect(normalCallback).toHaveBeenCalled()
    })

    it('notifies subscribers on each transition', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(callback).toHaveBeenCalledTimes(3)
    })

    it('calling unsubscribe multiple times is safe', () => {
      const callback = vi.fn()
      const unsubscribe = machine.subscribe(callback)
      unsubscribe()
      expect(() => unsubscribe()).not.toThrow()
    })
  })

  describe('isActionAllowed', () => {
    describe('in BETTING phase', () => {
      it('allows placeBet action', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(true)
      })

      it('allows removeBet action', () => {
        expect(machine.isActionAllowed('removeBet')).toBe(true)
      })

      it('allows selectHands action', () => {
        expect(machine.isActionAllowed('selectHands')).toBe(true)
      })

      it('rejects hit action', () => {
        expect(machine.isActionAllowed('hit')).toBe(false)
      })

      it('rejects stand action', () => {
        expect(machine.isActionAllowed('stand')).toBe(false)
      })

      it('rejects double action', () => {
        expect(machine.isActionAllowed('double')).toBe(false)
      })

      it('rejects split action', () => {
        expect(machine.isActionAllowed('split')).toBe(false)
      })
    })

    describe('in PLAYER_TURN phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
        machine.transition(GAME_PHASES.PLAYER_TURN)
      })

      it('allows hit action', () => {
        expect(machine.isActionAllowed('hit')).toBe(true)
      })

      it('allows stand action', () => {
        expect(machine.isActionAllowed('stand')).toBe(true)
      })

      it('allows double action', () => {
        expect(machine.isActionAllowed('double')).toBe(true)
      })

      it('allows split action', () => {
        expect(machine.isActionAllowed('split')).toBe(true)
      })

      it('rejects placeBet action', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
      })

      it('rejects acceptInsurance action', () => {
        expect(machine.isActionAllowed('acceptInsurance')).toBe(false)
      })
    })

    describe('in INSURANCE_CHECK phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
        machine.transition(GAME_PHASES.INSURANCE_CHECK)
      })

      it('allows acceptInsurance action', () => {
        expect(machine.isActionAllowed('acceptInsurance')).toBe(true)
      })

      it('allows declineInsurance action', () => {
        expect(machine.isActionAllowed('declineInsurance')).toBe(true)
      })

      it('rejects hit action', () => {
        expect(machine.isActionAllowed('hit')).toBe(false)
      })

      it('rejects placeBet action', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
      })
    })

    describe('in DEALING phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
      })

      it('rejects all player actions', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
        expect(machine.isActionAllowed('hit')).toBe(false)
        expect(machine.isActionAllowed('stand')).toBe(false)
        expect(machine.isActionAllowed('acceptInsurance')).toBe(false)
      })
    })

    describe('in DEALER_TURN phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
        machine.transition(GAME_PHASES.PLAYER_TURN)
        machine.transition(GAME_PHASES.DEALER_TURN)
      })

      it('rejects all player actions', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
        expect(machine.isActionAllowed('hit')).toBe(false)
        expect(machine.isActionAllowed('stand')).toBe(false)
        expect(machine.isActionAllowed('acceptInsurance')).toBe(false)
      })
    })

    describe('in RESOLUTION phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
        machine.transition(GAME_PHASES.PLAYER_TURN)
        machine.transition(GAME_PHASES.DEALER_TURN)
        machine.transition(GAME_PHASES.RESOLUTION)
      })

      it('rejects all player actions', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
        expect(machine.isActionAllowed('hit')).toBe(false)
        expect(machine.isActionAllowed('stand')).toBe(false)
      })
    })

    describe('in GAME_OVER phase', () => {
      beforeEach(() => {
        machine.transition(GAME_PHASES.DEALING)
        machine.transition(GAME_PHASES.PLAYER_TURN)
        machine.transition(GAME_PHASES.DEALER_TURN)
        machine.transition(GAME_PHASES.RESOLUTION)
        machine.transition(GAME_PHASES.GAME_OVER)
      })

      it('rejects all player actions', () => {
        expect(machine.isActionAllowed('placeBet')).toBe(false)
        expect(machine.isActionAllowed('hit')).toBe(false)
        expect(machine.isActionAllowed('stand')).toBe(false)
      })
    })

    it('returns false for unknown action', () => {
      expect(machine.isActionAllowed('unknownAction')).toBe(false)
    })

    it('returns false for null action', () => {
      expect(machine.isActionAllowed(null)).toBe(false)
    })

    it('returns false for undefined action', () => {
      expect(machine.isActionAllowed(undefined)).toBe(false)
    })
  })

  describe('reset', () => {
    it('resets phase to BETTING', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.reset()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('resets from any phase to BETTING', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.reset()
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('notifies subscribers of reset', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      callback.mockClear()
      machine.reset()
      expect(callback).toHaveBeenCalledWith(GAME_PHASES.BETTING, GAME_PHASES.DEALING)
    })

    it('allows new game cycle after reset', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.reset()
      expect(() => machine.transition(GAME_PHASES.DEALING)).not.toThrow()
    })

    it('does not notify if already in BETTING phase', () => {
      const callback = vi.fn()
      machine.subscribe(callback)
      machine.reset()
      expect(callback).not.toHaveBeenCalled()
    })
  })

  describe('loadPersistedState', () => {
    it('loads state from storageManager if available', () => {
      const mockStorage = {
        loadState: vi.fn().mockReturnValue({ phase: GAME_PHASES.PLAYER_TURN })
      }
      const machineWithStorage = new GameStateMachine(mockStorage)
      machineWithStorage.loadPersistedState()
      expect(mockStorage.loadState).toHaveBeenCalled()
    })

    it('returns current state if no storageManager', () => {
      const result = machine.loadPersistedState()
      expect(result).toBe(GAME_PHASES.BETTING)
    })

    it('returns current state if storageManager returns null', () => {
      const mockStorage = {
        loadState: vi.fn().mockReturnValue(null)
      }
      const machineWithStorage = new GameStateMachine(mockStorage)
      const result = machineWithStorage.loadPersistedState()
      expect(result).toBe(GAME_PHASES.BETTING)
    })

    it('updates phase if storageManager returns valid phase', () => {
      const mockStorage = {
        loadState: vi.fn().mockReturnValue({ phase: GAME_PHASES.DEALING })
      }
      const machineWithStorage = new GameStateMachine(mockStorage)
      machineWithStorage.loadPersistedState()
      expect(machineWithStorage.getPhase()).toBe(GAME_PHASES.DEALING)
    })

    it('ignores invalid phase from storage', () => {
      const mockStorage = {
        loadState: vi.fn().mockReturnValue({ phase: 'invalidPhase' })
      }
      const machineWithStorage = new GameStateMachine(mockStorage)
      machineWithStorage.loadPersistedState()
      expect(machineWithStorage.getPhase()).toBe(GAME_PHASES.BETTING)
    })
  })

  describe('edge cases', () => {
    it('handles rapid consecutive transitions', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      expect(machine.getPhase()).toBe(GAME_PHASES.GAME_OVER)
    })

    it('handles multiple subscribe/unsubscribe cycles', () => {
      const callback = vi.fn()
      const unsub1 = machine.subscribe(callback)
      unsub1()
      const unsub2 = machine.subscribe(callback)
      machine.transition(GAME_PHASES.DEALING)
      expect(callback).toHaveBeenCalledTimes(1)
      unsub2()
    })

    it('handles empty string action in isActionAllowed', () => {
      expect(machine.isActionAllowed('')).toBe(false)
    })

    it('handles empty string phase in canTransition', () => {
      expect(machine.canTransition('')).toBe(false)
    })

    it('maintains correct state after multiple resets', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.reset()
      machine.transition(GAME_PHASES.DEALING)
      machine.reset()
      machine.transition(GAME_PHASES.DEALING)
      expect(machine.getPhase()).toBe(GAME_PHASES.DEALING)
    })
  })

  describe('integration scenarios', () => {
    it('simulates full blackjack round without insurance', () => {
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
      expect(machine.isActionAllowed('placeBet')).toBe(true)

      machine.transition(GAME_PHASES.DEALING)
      expect(machine.getPhase()).toBe(GAME_PHASES.DEALING)

      machine.transition(GAME_PHASES.PLAYER_TURN)
      expect(machine.isActionAllowed('hit')).toBe(true)
      expect(machine.isActionAllowed('stand')).toBe(true)

      machine.transition(GAME_PHASES.DEALER_TURN)
      expect(machine.isActionAllowed('hit')).toBe(false)

      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)

      machine.transition(GAME_PHASES.BETTING)
      expect(machine.getPhase()).toBe(GAME_PHASES.BETTING)
    })

    it('simulates full blackjack round with insurance', () => {
      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.INSURANCE_CHECK)
      expect(machine.isActionAllowed('acceptInsurance')).toBe(true)
      expect(machine.isActionAllowed('declineInsurance')).toBe(true)

      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)
      machine.transition(GAME_PHASES.RESOLUTION)
      machine.transition(GAME_PHASES.GAME_OVER)
      expect(machine.getPhase()).toBe(GAME_PHASES.GAME_OVER)
    })

    it('tracks all state changes through subscribers', () => {
      const history = []
      machine.subscribe((newPhase, oldPhase) => {
        history.push({ from: oldPhase, to: newPhase })
      })

      machine.transition(GAME_PHASES.DEALING)
      machine.transition(GAME_PHASES.PLAYER_TURN)
      machine.transition(GAME_PHASES.DEALER_TURN)

      expect(history).toEqual([
        { from: GAME_PHASES.BETTING, to: GAME_PHASES.DEALING },
        { from: GAME_PHASES.DEALING, to: GAME_PHASES.PLAYER_TURN },
        { from: GAME_PHASES.PLAYER_TURN, to: GAME_PHASES.DEALER_TURN }
      ])
    })
  })
})
