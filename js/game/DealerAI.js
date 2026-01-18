/**
 * @fileoverview DealerAI for Karate Blackjack game.
 *
 * This module provides automated dealer decision logic following standard
 * casino blackjack rules. The dealer follows a deterministic strategy:
 * - Hit on 16 or less
 * - Stand on 17 or more (including soft 17)
 *
 * Standard casino rule applied: Dealer stands on all 17s (including soft 17).
 *
 * @module game/DealerAI
 * @version 1.0.0
 */

// =============================================================================
// DEALERAI CLASS
// =============================================================================

/**
 * Implements automated dealer decision logic for blackjack.
 *
 * The DealerAI follows standard casino dealer rules:
 * - Dealer must hit when hand value is 16 or less
 * - Dealer must stand when hand value is 17 or more
 * - Soft 17 rule: Dealer stands on soft 17 (Ace + 6)
 *
 * This implementation uses the "stand on all 17s" rule, which is the most
 * common rule in casinos. Some casinos use "hit on soft 17" which would
 * give the house a slightly higher edge.
 *
 * @class DealerAI
 *
 * @example
 * // Create dealer AI and check if dealer should hit
 * const dealerAI = new DealerAI()
 * const hand = new Hand()
 * hand.addCard(createCard('hearts', 10))
 * hand.addCard(createCard('diamonds', 6))
 * console.log(dealerAI.shouldHit(hand)) // true (16, must hit)
 *
 * @example
 * // Execute complete dealer turn
 * const dealerAI = new DealerAI()
 * const hand = new Hand()
 * hand.addCard(createCard('hearts', 10))
 * hand.addCard(createCard('diamonds', 5))
 * dealerAI.playTurn(hand, deck) // Dealer hits until 17+ or bust
 */
export class DealerAI {
  /**
   * Determines whether the dealer should hit based on the current hand value.
   *
   * Dealer hit/stand rules:
   * - Value <= 16: Always hit
   * - Value >= 17: Always stand (including soft 17)
   * - Bust (value > 21): Stand (no further action possible)
   *
   * @param {import('./Hand.js').Hand} hand - The dealer's current hand
   * @returns {boolean} True if the dealer should hit, false if should stand
   *
   * @example
   * // Dealer hits on 16
   * const hand = new Hand()
   * hand.addCard(createCard('hearts', 10))
   * hand.addCard(createCard('diamonds', 6))
   * dealerAI.shouldHit(hand) // true
   *
   * @example
   * // Dealer stands on 17
   * const hand = new Hand()
   * hand.addCard(createCard('hearts', 10))
   * hand.addCard(createCard('diamonds', 7))
   * dealerAI.shouldHit(hand) // false
   *
   * @example
   * // Dealer stands on soft 17 (A + 6)
   * const hand = new Hand()
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 6))
   * dealerAI.shouldHit(hand) // false
   */
  shouldHit(hand) {
    const value = hand.getValue()

    // If bust, dealer cannot hit
    if (hand.isBust()) {
      return false
    }

    // Standard dealer rule: hit on 16 or less, stand on 17 or more
    // This includes standing on soft 17 (the standard casino rule)
    return value <= 16
  }

  /**
   * Returns the action the dealer should take for the current hand state.
   *
   * This is a convenience method that returns a string representation
   * of the dealer's decision rather than a boolean.
   *
   * @param {import('./Hand.js').Hand} hand - The dealer's current hand
   * @returns {'hit' | 'stand'} The action the dealer should take
   *
   * @example
   * const action = dealerAI.getAction(hand)
   * if (action === 'hit') {
   *   hand.addCard(deck.deal())
   * }
   */
  getAction(hand) {
    return this.shouldHit(hand) ? 'hit' : 'stand'
  }

  /**
   * Executes the dealer's complete turn, hitting until standing or busting.
   *
   * This method modifies the hand object by adding cards from the deck
   * until the dealer either:
   * - Reaches a hand value of 17 or more (stands)
   * - Busts (hand value exceeds 21)
   *
   * @param {import('./Hand.js').Hand} hand - The dealer's hand to play
   * @param {{ deal: () => import('../types/index.js').Card }} deck - The deck to deal from
   * @returns {import('./Hand.js').Hand} The completed dealer hand (same object as input)
   *
   * @example
   * // Play out dealer's hand
   * const dealerHand = new Hand()
   * dealerHand.addCard(deck.deal()) // First card
   * dealerHand.addCard(deck.deal()) // Second card
   *
   * // Dealer plays according to rules
   * const completedHand = dealerAI.playTurn(dealerHand, deck)
   * console.log(completedHand.getValue()) // Final hand value
   * console.log(completedHand.isBust())   // Whether dealer busted
   */
  playTurn(hand, deck) {
    // Hit while value is 16 or less
    while (this.shouldHit(hand)) {
      const card = deck.deal()
      hand.addCard(card)
    }

    // Return the completed hand
    return hand
  }
}
