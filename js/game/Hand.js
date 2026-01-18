/**
 * @fileoverview Hand management for Karate Blackjack game.
 *
 * This module provides the Hand class for managing a player's or dealer's hand
 * in blackjack, including value calculation with proper Ace handling, bust detection,
 * blackjack identification, and split eligibility checking.
 *
 * @module game/Hand
 * @version 1.0.0
 */

import { getCardValue } from '../types/index.js'

// =============================================================================
// HAND CLASS
// =============================================================================

/**
 * Manages a hand of playing cards with blackjack value calculation.
 *
 * The Hand class implements standard blackjack hand rules including:
 * - Ace value flexibility (1 or 11)
 * - Soft/hard hand distinction
 * - Bust detection (value > 21)
 * - Natural blackjack detection (Ace + 10-value card in 2 cards)
 * - Split eligibility (two cards with same rank)
 *
 * @class Hand
 *
 * @example
 * // Create a hand and add cards
 * const hand = new Hand()
 * hand.addCard(createCard('hearts', 'A'))
 * hand.addCard(createCard('diamonds', 'K'))
 * console.log(hand.getValue())      // 21
 * console.log(hand.isBlackjack())   // true
 * console.log(hand.isSoft())        // true
 *
 * @example
 * // Check for bust
 * const hand = new Hand()
 * hand.addCard(createCard('hearts', 'K'))
 * hand.addCard(createCard('diamonds', 'Q'))
 * hand.addCard(createCard('clubs', 5))
 * console.log(hand.getValue())  // 25
 * console.log(hand.isBust())    // true
 */
export class Hand {
  /**
   * Creates a new empty Hand instance.
   *
   * The hand starts empty with no cards. Use `addCard()` to add cards to the hand.
   */
  constructor() {
    /**
     * Array of cards currently in the hand.
     * @type {import('../types/index.js').Card[]}
     * @private
     */
    this._cards = []

    /**
     * Cached hand value for performance.
     * @type {number}
     * @private
     */
    this._value = 0

    /**
     * Cached soft status.
     * @type {boolean}
     * @private
     */
    this._isSoft = false
  }

  /**
   * Adds a card to the hand and recalculates the hand value.
   *
   * @param {import('../types/index.js').Card} card - The card to add
   * @returns {void}
   *
   * @example
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 5))
   * console.log(hand.getValue()) // 16 (soft)
   */
  addCard(card) {
    this._cards.push(card)
    this._recalculate()
  }

  /**
   * Removes and returns the last card added to the hand.
   *
   * Useful for corrections or split operations. The hand value is
   * automatically recalculated after removal.
   *
   * @returns {import('../types/index.js').Card | undefined} The removed card, or undefined if hand is empty
   *
   * @example
   * hand.addCard(createCard('hearts', 5))
   * hand.addCard(createCard('diamonds', 7))
   * const removed = hand.removeCard()
   * console.log(removed.rank) // 7
   * console.log(hand.getValue()) // 5
   */
  removeCard() {
    const card = this._cards.pop()
    this._recalculate()
    return card
  }

  /**
   * Removes all cards from the hand and resets to initial state.
   *
   * @returns {void}
   *
   * @example
   * hand.addCard(createCard('hearts', 5))
   * hand.clear()
   * console.log(hand.getCardCount()) // 0
   * console.log(hand.getValue())     // 0
   */
  clear() {
    this._cards = []
    this._value = 0
    this._isSoft = false
  }

  /**
   * Calculates and returns the optimal hand value.
   *
   * Hand value calculation follows standard blackjack rules:
   * - Number cards (2-10): face value
   * - Face cards (J, Q, K): 10
   * - Ace: 11 if total <= 21, otherwise 1
   *
   * When multiple Aces are present, at most one can be counted as 11
   * (to avoid busting). The algorithm counts all Aces as 1 initially,
   * then upgrades one Ace to 11 if the total would not exceed 21.
   *
   * @returns {number} The optimal hand value (lowest non-bust value if possible)
   *
   * @example
   * // Ace + King = 21 (blackjack)
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 'K'))
   * console.log(hand.getValue()) // 21
   *
   * @example
   * // Multiple Aces: A + A + 9 = 21 (one Ace as 11, one as 1)
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 'A'))
   * hand.addCard(createCard('clubs', 9))
   * console.log(hand.getValue()) // 21
   */
  getValue() {
    return this._value
  }

  /**
   * Checks if the hand is "soft" (contains an Ace counted as 11).
   *
   * A soft hand has an Ace that can be counted as either 1 or 11
   * without busting. This is strategically important as soft hands
   * allow hitting without risk of busting on low-value cards.
   *
   * @returns {boolean} True if the hand contains an Ace counted as 11
   *
   * @example
   * // Ace + 5 = soft 16
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 5))
   * console.log(hand.isSoft()) // true
   *
   * @example
   * // Ace + 8 + 7 = hard 16 (Ace forced to 1)
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 8))
   * hand.addCard(createCard('clubs', 7))
   * console.log(hand.isSoft()) // false
   */
  isSoft() {
    return this._isSoft
  }

  /**
   * Checks if the hand is bust (value exceeds 21).
   *
   * A busted hand has automatically lost, regardless of the dealer's hand.
   *
   * @returns {boolean} True if hand value exceeds 21
   *
   * @example
   * hand.addCard(createCard('hearts', 'K'))
   * hand.addCard(createCard('diamonds', 'Q'))
   * hand.addCard(createCard('clubs', 5))
   * console.log(hand.getValue()) // 25
   * console.log(hand.isBust())   // true
   */
  isBust() {
    return this._value > 21
  }

  /**
   * Checks if the hand is a natural blackjack.
   *
   * A blackjack is exactly two cards totaling 21 (Ace + 10-value card).
   * Blackjack typically pays 3:2 and beats a dealer's 21 made with 3+ cards.
   *
   * @returns {boolean} True if hand is Ace + 10-value card in exactly 2 cards
   *
   * @example
   * // Ace + King = blackjack
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 'K'))
   * console.log(hand.isBlackjack()) // true
   *
   * @example
   * // 7 + 7 + 7 = 21 but NOT blackjack (3 cards)
   * hand.addCard(createCard('hearts', 7))
   * hand.addCard(createCard('diamonds', 7))
   * hand.addCard(createCard('clubs', 7))
   * console.log(hand.isBlackjack()) // false
   */
  isBlackjack() {
    return this._cards.length === 2 && this._value === 21
  }

  /**
   * Checks if the hand is eligible for splitting.
   *
   * A hand can be split if it contains exactly two cards with the same rank.
   * Note: Cards must have matching RANKS, not just matching values.
   * For example, King and Jack both have value 10, but different ranks,
   * so they cannot be split.
   *
   * @returns {boolean} True if exactly 2 cards with matching ranks
   *
   * @example
   * // Two 5s can be split
   * hand.addCard(createCard('hearts', 5))
   * hand.addCard(createCard('diamonds', 5))
   * console.log(hand.canSplit()) // true
   *
   * @example
   * // King and Jack cannot be split (different ranks despite same value)
   * hand.addCard(createCard('hearts', 'K'))
   * hand.addCard(createCard('diamonds', 'J'))
   * console.log(hand.canSplit()) // false
   */
  canSplit() {
    if (this._cards.length !== 2) {
      return false
    }
    return this._cards[0].rank === this._cards[1].rank
  }

  /**
   * Returns a copy of the cards array.
   *
   * The returned array is a shallow copy, so modifying it will not
   * affect the hand's internal state. However, the Card objects
   * themselves are the same references.
   *
   * @returns {import('../types/index.js').Card[]} Copy of the cards array
   *
   * @example
   * hand.addCard(createCard('hearts', 5))
   * const cards = hand.getCards()
   * console.log(cards.length) // 1
   *
   * // Modifying the array doesn't affect the hand
   * cards.push(createCard('diamonds', 7))
   * console.log(hand.getCardCount()) // still 1
   */
  getCards() {
    return [...this._cards]
  }

  /**
   * Returns the number of cards in the hand.
   *
   * @returns {number} The count of cards currently in the hand
   *
   * @example
   * hand.addCard(createCard('hearts', 5))
   * hand.addCard(createCard('diamonds', 7))
   * console.log(hand.getCardCount()) // 2
   */
  getCardCount() {
    return this._cards.length
  }

  /**
   * Recalculates the hand value and soft status.
   *
   * Algorithm:
   * 1. Sum all card values, counting Aces as 1
   * 2. If hand contains Aces and total <= 11, add 10 (making one Ace = 11)
   * 3. Track whether an Ace is being counted as 11 (soft hand)
   *
   * @private
   * @returns {void}
   */
  _recalculate() {
    if (this._cards.length === 0) {
      this._value = 0
      this._isSoft = false
      return
    }

    let total = 0
    let aceCount = 0

    // First pass: sum all cards, treating Aces as 1
    for (const card of this._cards) {
      const value = getCardValue(card.rank)
      if (card.rank === 'A') {
        aceCount++
        total += 1 // Count Ace as 1 initially
      } else {
        total += value
      }
    }

    // Second pass: upgrade one Ace to 11 if it won't cause bust
    // (adding 10 to total since Ace is already counted as 1)
    if (aceCount > 0 && total + 10 <= 21) {
      total += 10
      this._isSoft = true
    } else {
      this._isSoft = false
    }

    this._value = total
  }
}
