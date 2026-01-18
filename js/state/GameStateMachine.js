/**
 * @fileoverview GameStateMachine for managing game phase transitions.
 *
 * This module implements a state machine that enforces valid game phase
 * transitions and notifies subscribers of state changes. It ensures the
 * game follows the correct flow:
 *
 * betting -> dealing -> [insuranceCheck] -> playerTurn -> dealerTurn -> resolution -> gameOver -> betting
 *
 * @module state/GameStateMachine
 * @version 1.0.0
 */

import { GAME_PHASES, isGamePhase } from '../types/index.js'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Valid transitions from each game phase.
 * Maps each phase to an array of phases it can transition to.
 * @type {Record<string, string[]>}
 */
const VALID_TRANSITIONS = Object.freeze({
  [GAME_PHASES.BETTING]: [GAME_PHASES.DEALING],
  [GAME_PHASES.DEALING]: [GAME_PHASES.INSURANCE_CHECK, GAME_PHASES.PLAYER_TURN],
  [GAME_PHASES.INSURANCE_CHECK]: [GAME_PHASES.PLAYER_TURN],
  [GAME_PHASES.PLAYER_TURN]: [GAME_PHASES.DEALER_TURN],
  [GAME_PHASES.DEALER_TURN]: [GAME_PHASES.RESOLUTION],
  [GAME_PHASES.RESOLUTION]: [GAME_PHASES.GAME_OVER],
  [GAME_PHASES.GAME_OVER]: [GAME_PHASES.BETTING]
})

/**
 * Actions allowed in each game phase.
 * Maps each phase to an array of valid action strings.
 * @type {Record<string, string[]>}
 */
const ALLOWED_ACTIONS = Object.freeze({
  [GAME_PHASES.BETTING]: ['placeBet', 'removeBet', 'selectHands'],
  [GAME_PHASES.DEALING]: [],
  [GAME_PHASES.INSURANCE_CHECK]: ['acceptInsurance', 'declineInsurance'],
  [GAME_PHASES.PLAYER_TURN]: ['hit', 'stand', 'double', 'split'],
  [GAME_PHASES.DEALER_TURN]: [],
  [GAME_PHASES.RESOLUTION]: [],
  [GAME_PHASES.GAME_OVER]: []
})

// =============================================================================
// CLASS DEFINITION
// =============================================================================

/**
 * GameStateMachine manages game phase transitions and notifies subscribers.
 *
 * This class enforces valid state transitions following the blackjack game flow.
 * It uses the Observer pattern to notify subscribers of phase changes.
 *
 * @example
 * const machine = new GameStateMachine()
 * machine.subscribe((newPhase, oldPhase) => {
 *   console.log(`Phase changed from ${oldPhase} to ${newPhase}`)
 * })
 * machine.transition(GAME_PHASES.DEALING)
 */
export class GameStateMachine {
  /** @type {string} Current game phase */
  #currentPhase

  /** @type {Function[]} Array of subscriber callbacks */
  #subscribers

  /** @type {object|null} Optional storage manager for persisting state */
  #storageManager

  /**
   * Creates a new GameStateMachine instance.
   *
   * @param {object|null} [storageManager=null] - Optional storage manager for state persistence
   */
  constructor(storageManager = null) {
    this.#currentPhase = GAME_PHASES.BETTING
    this.#subscribers = []
    this.#storageManager = storageManager
  }

  /**
   * Returns the current game phase.
   *
   * @returns {string} The current phase (e.g., 'betting', 'playerTurn')
   *
   * @example
   * const phase = machine.getPhase()
   * console.log(phase) // 'betting'
   */
  getPhase() {
    return this.#currentPhase
  }

  /**
   * Checks if a transition to the specified phase is valid from the current phase.
   *
   * This method does not throw an error; it returns a boolean indicating
   * whether the transition is allowed.
   *
   * @param {unknown} toPhase - The target phase to check
   * @returns {boolean} True if transition is valid, false otherwise
   *
   * @example
   * if (machine.canTransition('dealing')) {
   *   machine.transition('dealing')
   * }
   */
  canTransition(toPhase) {
    // Validate input is a valid game phase
    if (!isGamePhase(toPhase)) {
      return false
    }

    // Cannot transition to same phase
    if (toPhase === this.#currentPhase) {
      return false
    }

    // Check if transition is in the valid transitions map
    const validTargets = VALID_TRANSITIONS[this.#currentPhase]
    return validTargets?.includes(toPhase) ?? false
  }

  /**
   * Transitions to a new game phase.
   *
   * This method validates the transition and throws an error if invalid.
   * On successful transition, all subscribers are notified.
   *
   * @param {unknown} toPhase - The target phase to transition to
   * @returns {string} The new phase after successful transition
   * @throws {Error} If the transition is invalid
   *
   * @example
   * try {
   *   machine.transition('dealing')
   *   console.log('Now dealing cards')
   * } catch (error) {
   *   console.error('Invalid transition:', error.message)
   * }
   */
  transition(toPhase) {
    // Validate phase is valid
    if (!isGamePhase(toPhase)) {
      throw new Error(
        `Invalid transition: "${toPhase}" is not a valid game phase. Current phase: ${this.#currentPhase}`
      )
    }

    // Check if transition is allowed
    if (!this.canTransition(toPhase)) {
      throw new Error(
        `Invalid transition from "${this.#currentPhase}" to "${toPhase}". ` +
          `Valid transitions from ${this.#currentPhase}: ${VALID_TRANSITIONS[this.#currentPhase]?.join(', ') || 'none'}`
      )
    }

    const previousPhase = this.#currentPhase
    this.#currentPhase = toPhase

    // Notify all subscribers
    this.#notifySubscribers(toPhase, previousPhase)

    return this.#currentPhase
  }

  /**
   * Registers a callback to be notified of phase changes.
   *
   * @param {Function} callback - Function called on phase change with (newPhase, oldPhase)
   * @returns {Function} Unsubscribe function to remove the callback
   *
   * @example
   * const unsubscribe = machine.subscribe((newPhase, oldPhase) => {
   *   console.log(`Phase changed from ${oldPhase} to ${newPhase}`)
   * })
   * // Later: unsubscribe()
   */
  subscribe(callback) {
    this.#subscribers.push(callback)

    // Return unsubscribe function
    return () => {
      const index = this.#subscribers.indexOf(callback)
      if (index > -1) {
        this.#subscribers.splice(index, 1)
      }
    }
  }

  /**
   * Checks if a specific action is allowed in the current phase.
   *
   * @param {unknown} action - The action to check (e.g., 'hit', 'placeBet')
   * @returns {boolean} True if action is allowed, false otherwise
   *
   * @example
   * if (machine.isActionAllowed('hit')) {
   *   // Perform hit action
   * }
   */
  isActionAllowed(action) {
    if (typeof action !== 'string' || action === '') {
      return false
    }

    const allowedActions = ALLOWED_ACTIONS[this.#currentPhase]
    return allowedActions?.includes(action) ?? false
  }

  /**
   * Resets the state machine to the BETTING phase.
   *
   * Notifies subscribers if the current phase was not already BETTING.
   *
   * @example
   * machine.reset()
   * console.log(machine.getPhase()) // 'betting'
   */
  reset() {
    if (this.#currentPhase === GAME_PHASES.BETTING) {
      return
    }

    const previousPhase = this.#currentPhase
    this.#currentPhase = GAME_PHASES.BETTING
    this.#notifySubscribers(GAME_PHASES.BETTING, previousPhase)
  }

  /**
   * Loads persisted state from storage manager if available.
   *
   * @returns {string} The current phase after loading (or current phase if no storage)
   *
   * @example
   * const machine = new GameStateMachine(storageManager)
   * machine.loadPersistedState()
   */
  loadPersistedState() {
    if (!this.#storageManager) {
      return this.#currentPhase
    }

    const persistedState = this.#storageManager.loadState()

    if (!persistedState || !isGamePhase(persistedState.phase)) {
      return this.#currentPhase
    }

    this.#currentPhase = persistedState.phase
    return this.#currentPhase
  }

  /**
   * Notifies all subscribers of a phase change.
   * Handles errors in callbacks gracefully to ensure all subscribers are notified.
   *
   * @private
   * @param {string} newPhase - The new phase
   * @param {string} oldPhase - The previous phase
   */
  #notifySubscribers(newPhase, oldPhase) {
    for (const callback of this.#subscribers) {
      try {
        callback(newPhase, oldPhase)
      } catch (error) {
        // Log error but continue notifying other subscribers
        console.error('Error in state change subscriber:', error)
      }
    }
  }
}
