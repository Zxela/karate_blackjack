/**
 * @fileoverview Card deck management for Karate Blackjack game.
 *
 * This module provides the CardDeck class for managing a standard 52-card deck
 * with support for multiple decks (shoe), shuffling using cryptographically secure
 * random generation, and card dealing operations.
 *
 * @module game/CardDeck
 * @version 1.0.0
 */

import { RANK_VALUES, SUIT_VALUES, createCard } from '../types/index.js'
import { shuffle as fisherYatesShuffle } from '../utils/RandomGenerator.js'

// =============================================================================
// CARD DECK CLASS
// =============================================================================

/**
 * Manages a deck of playing cards with shuffling and dealing operations.
 *
 * The CardDeck class provides a standard 52-card deck implementation with support
 * for multiple decks (shoe) commonly used in casino blackjack. It uses the Fisher-Yates
 * shuffle algorithm with cryptographically secure random number generation.
 *
 * @class CardDeck
 *
 * @example
 * // Create and use a standard deck
 * const deck = new CardDeck()
 * deck.createStandardDeck().shuffle()
 *
 * const card = deck.deal()
 * console.log(card) // { suit: 'hearts', rank: 'A', id: 'hearts-A' }
 *
 * @example
 * // Create a multi-deck shoe (6 decks, common in casinos)
 * const shoe = new CardDeck()
 * shoe.createStandardDeck(6).shuffle()
 * console.log(shoe.getCount()) // 312
 */
export class CardDeck {
  /**
   * Creates a new empty CardDeck instance.
   *
   * The deck starts empty. Use `createStandardDeck()` to populate it with cards.
   */
  constructor() {
    /**
     * Array of cards currently in the deck.
     * Cards are dealt from the end of the array (top of deck).
     * @type {import('../types/index.js').Card[]}
     */
    this.cards = []

    /**
     * Original deck state for reset functionality.
     * @type {import('../types/index.js').Card[] | null}
     * @private
     */
    this._originalCards = null
  }

  /**
   * Creates a standard 52-card deck with all suit/rank combinations.
   *
   * Generates cards for all four suits (hearts, diamonds, clubs, spades) and
   * all thirteen ranks (2-10, J, Q, K, A). Supports creating multi-deck shoes
   * by specifying a deck count.
   *
   * @param {number} [deckCount=1] - Number of standard decks to combine (1-8 typical)
   * @returns {CardDeck} This deck instance for method chaining
   * @throws {Error} If deckCount is less than 1
   *
   * @example
   * // Single deck
   * deck.createStandardDeck()  // 52 cards
   *
   * @example
   * // Six-deck shoe (common in casinos)
   * deck.createStandardDeck(6) // 312 cards
   */
  createStandardDeck(deckCount = 1) {
    if (deckCount < 1) {
      throw new Error('Deck count must be at least 1')
    }

    // Clear any existing cards
    this.cards = []

    // Create cards for each deck in the shoe
    for (let d = 0; d < deckCount; d++) {
      for (const suit of SUIT_VALUES) {
        for (const rank of RANK_VALUES) {
          this.cards.push(createCard(suit, rank))
        }
      }
    }

    // Store original state for reset functionality
    // Deep copy cards to ensure independence
    this._originalCards = this.cards.map((card) => ({ ...card }))

    return this
  }

  /**
   * Shuffles the deck using the Fisher-Yates algorithm.
   *
   * Uses cryptographically secure random number generation from the
   * RandomGenerator module to ensure fair and unpredictable shuffling.
   * The shuffle is performed in-place and modifies the card order.
   *
   * @returns {CardDeck} This deck instance for method chaining
   *
   * @example
   * deck.createStandardDeck().shuffle()
   *
   * @example
   * // Multiple shuffles for extra randomness
   * deck.shuffle().shuffle().shuffle()
   */
  shuffle() {
    fisherYatesShuffle(this.cards)
    return this
  }

  /**
   * Deals (removes and returns) the top card from the deck.
   *
   * Cards are dealt from the top of the deck (end of the array).
   * The dealt card is removed from the deck and returned to the caller.
   *
   * @returns {import('../types/index.js').Card} The dealt card
   * @throws {Error} If the deck is empty
   *
   * @example
   * const card = deck.deal()
   * console.log(card.id) // 'hearts-A'
   */
  deal() {
    if (this.isEmpty()) {
      throw new Error('Cannot deal from empty deck')
    }

    return this.cards.pop()
  }

  /**
   * Views the top card without removing it from the deck.
   *
   * Useful for previewing the next card to be dealt without
   * actually dealing it.
   *
   * @returns {import('../types/index.js').Card} The top card
   * @throws {Error} If the deck is empty
   *
   * @example
   * const topCard = deck.peek()
   * console.log(topCard.id) // 'spades-K'
   * // Card is still in the deck
   */
  peek() {
    if (this.isEmpty()) {
      throw new Error('Cannot peek empty deck')
    }

    // Return a copy to prevent modification
    const topCard = this.cards[this.cards.length - 1]
    return { ...topCard }
  }

  /**
   * Resets the deck to its original state after `createStandardDeck()`.
   *
   * Restores all cards in their original unshuffled order.
   * This is useful for starting a new round without creating a new deck instance.
   *
   * @returns {CardDeck} This deck instance for method chaining
   * @throws {Error} If the deck was never created with `createStandardDeck()`
   *
   * @example
   * deck.createStandardDeck().shuffle()
   * deck.deal()
   * deck.deal()
   * deck.reset() // Back to 52 cards, unshuffled
   */
  reset() {
    if (this._originalCards === null) {
      throw new Error('Cannot reset: deck was never created')
    }

    // Restore from original state (deep copy to ensure independence)
    this.cards = this._originalCards.map((card) => ({ ...card }))

    return this
  }

  /**
   * Returns the number of cards remaining in the deck.
   *
   * @returns {number} The count of remaining cards
   *
   * @example
   * deck.createStandardDeck()
   * console.log(deck.getCount()) // 52
   * deck.deal()
   * console.log(deck.getCount()) // 51
   */
  getCount() {
    return this.cards.length
  }

  /**
   * Checks if the deck is empty.
   *
   * @returns {boolean} True if no cards remain, false otherwise
   *
   * @example
   * if (deck.isEmpty()) {
   *   deck.reset()
   *   deck.shuffle()
   * }
   */
  isEmpty() {
    return this.cards.length === 0
  }
}
