/**
 * @fileoverview DealerAI for Karate Blackjack game.
 *
 * This module provides automated dealer decision logic following standard
 * casino blackjack rules. The dealer follows a deterministic strategy:
 * - Hit on 16 or less
 * - Hit on soft 17 (Ace counted as 11 + 6)
 * - Stand on hard 17 or more
 *
 * Standard Vegas rule applied: Dealer hits on soft 17 (H17).
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
 * - Dealer must hit on soft 17 (Ace counted as 11)
 * - Dealer must stand on hard 17 or more
 *
 * This implementation uses the "hit on soft 17" (H17) rule, which is common
 * in Las Vegas casinos and gives the house a slightly higher edge.
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
   * - Soft 17: Hit (H17 rule)
   * - Hard 17+: Stand
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
   * // Dealer stands on hard 17
   * const hand = new Hand()
   * hand.addCard(createCard('hearts', 10))
   * hand.addCard(createCard('diamonds', 7))
   * dealerAI.shouldHit(hand) // false
   *
   * @example
   * // Dealer hits on soft 17 (A + 6)
   * const hand = new Hand()
   * hand.addCard(createCard('hearts', 'A'))
   * hand.addCard(createCard('diamonds', 6))
   * dealerAI.shouldHit(hand) // true
   */
  shouldHit(hand) {
    const value = hand.getValue()

    // If bust, dealer cannot hit
    if (hand.isBust()) {
      return false
    }

    // Hit on 16 or less
    if (value <= 16) {
      return true
    }

    // Hit on soft 17 (H17 rule)
    if (value === 17 && hand.isSoft()) {
      return true
    }

    // Stand on hard 17 or more
    return false
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
