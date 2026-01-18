/**
 * @fileoverview Betting system for Karate Blackjack game.
 *
 * This module provides the BettingSystem class for managing player balance,
 * bet placement, payout calculation, and bet tracking. Supports multi-hand
 * betting scenarios including splits and double downs.
 *
 * @module game/BettingSystem
 * @version 1.0.0
 */

import { DEFAULTS } from '../types/index.js'

// =============================================================================
// BETTING SYSTEM CLASS
// =============================================================================

/**
 * Manages player balance, bet placement, and payout calculations.
 *
 * The BettingSystem class handles all betting operations in blackjack including:
 * - Balance tracking and management
 * - Bet validation (min/max limits, balance constraints)
 * - Bet placement and tracking
 * - Payout calculation with multipliers
 * - Multi-hand bet tracking for splits
 *
 * @class BettingSystem
 *
 * @example
 * // Create a betting system with default settings
 * const betting = new BettingSystem()
 * console.log(betting.getBalance()) // 1000
 *
 * // Place a bet
 * betting.placeBet(100)
 * console.log(betting.getBalance()) // 900
 *
 * // Win with 1:1 payout
 * betting.payout(100, 2.0)
 * console.log(betting.getBalance()) // 1100
 *
 * @example
 * // Custom configuration
 * const highRoller = new BettingSystem(10000, 100, 5000)
 * console.log(highRoller.getMinBet()) // 100
 * console.log(highRoller.getMaxBet()) // 5000
 */
export class BettingSystem {
  /**
   * Creates a new BettingSystem instance.
   *
   * @param {number} [initialBalance=1000] - Starting chip balance
   * @param {number} [minBet=10] - Minimum allowed bet amount
   * @param {number} [maxBet=500] - Maximum allowed bet amount
   *
   * @example
   * // Default configuration (1000 chips, 10-500 bet range)
   * const betting = new BettingSystem()
   *
   * // Custom high-roller configuration
   * const highRoller = new BettingSystem(10000, 100, 5000)
   */
  constructor(
    initialBalance = DEFAULTS.INITIAL_BALANCE,
    minBet = DEFAULTS.MIN_BET,
    maxBet = DEFAULTS.MAX_BET
  ) {
    /**
     * Current chip balance.
     * @type {number}
     * @private
     */
    this._balance = initialBalance

    /**
     * Original initial balance for reset functionality.
     * @type {number}
     * @private
     */
    this._initialBalance = initialBalance

    /**
     * Minimum allowed bet amount.
     * @type {number}
     * @private
     */
    this._minBet = minBet

    /**
     * Maximum allowed bet amount.
     * @type {number}
     * @private
     */
    this._maxBet = maxBet

    /**
     * Array of active bet amounts (one per hand).
     * @type {number[]}
     * @private
     */
    this._bets = []
  }

  /**
   * Returns the current chip balance.
   *
   * @returns {number} Current balance
   *
   * @example
   * const betting = new BettingSystem()
   * console.log(betting.getBalance()) // 1000
   * betting.placeBet(100)
   * console.log(betting.getBalance()) // 900
   */
  getBalance() {
    return this._balance
  }

  /**
   * Returns the minimum allowed bet amount.
   *
   * @returns {number} Minimum bet limit
   *
   * @example
   * const betting = new BettingSystem(1000, 25, 500)
   * console.log(betting.getMinBet()) // 25
   */
  getMinBet() {
    return this._minBet
  }

  /**
   * Returns the maximum allowed bet amount.
   *
   * @returns {number} Maximum bet limit
   *
   * @example
   * const betting = new BettingSystem(1000, 10, 1000)
   * console.log(betting.getMaxBet()) // 1000
   */
  getMaxBet() {
    return this._maxBet
  }

  /**
   * Attempts to place a bet, deducting from balance if valid.
   *
   * A bet is valid if:
   * - Amount is greater than 0
   * - Amount is >= minimum bet
   * - Amount is <= maximum bet
   * - Amount is <= current balance
   *
   * @param {number} amount - The bet amount to place
   * @returns {boolean} True if bet was successfully placed, false otherwise
   *
   * @example
   * const betting = new BettingSystem()
   * betting.placeBet(100)  // Returns true, balance is now 900
   * betting.placeBet(5)    // Returns false (below minimum)
   * betting.placeBet(600)  // Returns false (above maximum)
   * betting.placeBet(1000) // Returns false (exceeds balance)
   */
  placeBet(amount) {
    if (!this.canBet(amount)) {
      return false
    }

    this._balance -= amount
    this._bets.push(amount)
    return true
  }

  /**
   * Checks if a bet amount is valid without placing it.
   *
   * Validates that the bet:
   * - Is greater than 0
   * - Is within min/max limits
   * - Does not exceed current balance
   *
   * @param {number} amount - The bet amount to validate
   * @returns {boolean} True if the bet would be valid
   *
   * @example
   * const betting = new BettingSystem(100, 10, 500)
   * betting.canBet(50)  // true
   * betting.canBet(5)   // false (below minimum)
   * betting.canBet(200) // false (exceeds balance)
   */
  canBet(amount) {
    if (amount <= 0) {
      return false
    }
    if (amount < this._minBet) {
      return false
    }
    if (amount > this._maxBet) {
      return false
    }
    if (amount > this._balance) {
      return false
    }
    return true
  }

  /**
   * Adds winnings to the balance based on bet amount and multiplier.
   *
   * Payout multipliers:
   * - Win (1:1): multiplier = 2.0 (returns bet + equal amount)
   * - Blackjack (3:2): multiplier = 2.5 (returns bet + 1.5x bet)
   * - Push: multiplier = 1.0 (returns original bet only)
   * - Loss: multiplier = 0 (no payout)
   * - Insurance (2:1): multiplier = 2.0 on insurance bet
   *
   * @param {number} amount - The bet amount used for calculation
   * @param {number} multiplier - The payout multiplier
   * @returns {number} The new balance after payout
   *
   * @example
   * const betting = new BettingSystem()
   * betting.placeBet(100)  // Balance: 900
   *
   * // Normal win (1:1)
   * betting.payout(100, 2.0)  // Balance: 900 + 200 = 1100
   *
   * // Blackjack (3:2)
   * betting.payout(100, 2.5)  // Returns bet + 1.5x = 250
   *
   * // Push (return bet)
   * betting.payout(100, 1.0)  // Returns original 100
   *
   * // Loss
   * betting.payout(100, 0)    // Returns 0
   */
  payout(amount, multiplier) {
    const winnings = amount * multiplier
    this._balance += winnings
    return this._balance
  }

  /**
   * Resets the balance to the initial value or a new value.
   *
   * Also clears all active bets.
   *
   * @param {number} [newInitialBalance] - Optional new initial balance.
   *                                       If not provided, uses original initial balance.
   * @returns {void}
   *
   * @example
   * const betting = new BettingSystem(1000)
   * betting.placeBet(500)
   * console.log(betting.getBalance()) // 500
   * betting.reset()
   * console.log(betting.getBalance()) // 1000
   *
   * // Reset with new balance
   * betting.reset(2000)
   * console.log(betting.getBalance()) // 2000
   */
  reset(newInitialBalance) {
    if (newInitialBalance !== undefined) {
      this._balance = newInitialBalance
      this._initialBalance = newInitialBalance
    } else {
      this._balance = this._initialBalance
    }
    this._bets = []
  }

  /**
   * Returns the total amount currently bet across all hands.
   *
   * @returns {number} Sum of all active bets
   *
   * @example
   * const betting = new BettingSystem()
   * betting.placeBet(100)
   * betting.placeBet(50)
   * console.log(betting.getBetsTotal()) // 150
   */
  getBetsTotal() {
    return this._bets.reduce((sum, bet) => sum + bet, 0)
  }

  /**
   * Clears all active bets without affecting balance.
   *
   * Used at the end of a round to prepare for new bets.
   * The bet amounts are not returned to balance (use payout for that).
   *
   * @returns {void}
   *
   * @example
   * const betting = new BettingSystem()
   * betting.placeBet(100)
   * betting.placeBet(50)
   * console.log(betting.getBetsTotal()) // 150
   * betting.clearBets()
   * console.log(betting.getBetsTotal()) // 0
   */
  clearBets() {
    this._bets = []
  }
}
