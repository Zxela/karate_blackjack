/**
 * @fileoverview Unit tests for Hand module.
 *
 * Tests cover:
 * - Hand value calculation with all card types
 * - Soft/hard hand distinction (Ace handling)
 * - Bust detection (value > 21)
 * - Blackjack detection (Ace + 10-value, 2 cards only)
 * - Split eligibility (matching ranks)
 * - Multiple Aces handling
 * - Edge cases and boundary conditions
 *
 * @module tests/game/Hand
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { Hand } from '../../js/game/Hand.js'
import { createCard } from '../../js/types/index.js'

describe('Hand', () => {
  let hand

  beforeEach(() => {
    hand = new Hand()
  })

  describe('constructor', () => {
    it('creates an empty hand with no cards', () => {
      expect(hand.getCardCount()).toBe(0)
      expect(hand.getCards()).toEqual([])
    })

    it('creates a hand with initial value of 0', () => {
      expect(hand.getValue()).toBe(0)
    })

    it('creates a hand that is not soft', () => {
      expect(hand.isSoft()).toBe(false)
    })

    it('creates a hand that is not bust', () => {
      expect(hand.isBust()).toBe(false)
    })

    it('creates a hand that is not blackjack', () => {
      expect(hand.isBlackjack()).toBe(false)
    })
  })

  describe('addCard', () => {
    it('adds a card to the hand', () => {
      const card = createCard('hearts', 5)
      hand.addCard(card)
      expect(hand.getCardCount()).toBe(1)
    })

    it('can add multiple cards', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 3))
      expect(hand.getCardCount()).toBe(3)
    })

    it('updates hand value after adding card', () => {
      hand.addCard(createCard('hearts', 5))
      expect(hand.getValue()).toBe(5)
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(12)
    })
  })

  describe('removeCard', () => {
    it('removes and returns the last card added', () => {
      const card1 = createCard('hearts', 5)
      const card2 = createCard('diamonds', 7)
      hand.addCard(card1)
      hand.addCard(card2)

      const removed = hand.removeCard()
      expect(removed).toEqual(card2)
      expect(hand.getCardCount()).toBe(1)
    })

    it('updates hand value after removing card', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(12)

      hand.removeCard()
      expect(hand.getValue()).toBe(5)
    })

    it('returns undefined when removing from empty hand', () => {
      const removed = hand.removeCard()
      expect(removed).toBeUndefined()
    })
  })

  describe('clear', () => {
    it('removes all cards from the hand', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 3))

      hand.clear()
      expect(hand.getCardCount()).toBe(0)
      expect(hand.getCards()).toEqual([])
    })

    it('resets hand value to 0', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))

      hand.clear()
      expect(hand.getValue()).toBe(0)
    })

    it('resets soft status', () => {
      hand.addCard(createCard('hearts', 'A'))
      expect(hand.isSoft()).toBe(true)

      hand.clear()
      expect(hand.isSoft()).toBe(false)
    })
  })

  describe('getValue - Number cards (2-10)', () => {
    it('returns face value for card 2', () => {
      hand.addCard(createCard('hearts', 2))
      expect(hand.getValue()).toBe(2)
    })

    it('returns face value for card 3', () => {
      hand.addCard(createCard('hearts', 3))
      expect(hand.getValue()).toBe(3)
    })

    it('returns face value for card 4', () => {
      hand.addCard(createCard('hearts', 4))
      expect(hand.getValue()).toBe(4)
    })

    it('returns face value for card 5', () => {
      hand.addCard(createCard('hearts', 5))
      expect(hand.getValue()).toBe(5)
    })

    it('returns face value for card 6', () => {
      hand.addCard(createCard('hearts', 6))
      expect(hand.getValue()).toBe(6)
    })

    it('returns face value for card 7', () => {
      hand.addCard(createCard('hearts', 7))
      expect(hand.getValue()).toBe(7)
    })

    it('returns face value for card 8', () => {
      hand.addCard(createCard('hearts', 8))
      expect(hand.getValue()).toBe(8)
    })

    it('returns face value for card 9', () => {
      hand.addCard(createCard('hearts', 9))
      expect(hand.getValue()).toBe(9)
    })

    it('returns face value for card 10', () => {
      hand.addCard(createCard('hearts', 10))
      expect(hand.getValue()).toBe(10)
    })

    it('returns correct sum for multiple number cards', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 3))
      expect(hand.getValue()).toBe(15)
    })
  })

  describe('getValue - Face cards (J, Q, K)', () => {
    it('returns 10 for Jack', () => {
      hand.addCard(createCard('hearts', 'J'))
      expect(hand.getValue()).toBe(10)
    })

    it('returns 10 for Queen', () => {
      hand.addCard(createCard('hearts', 'Q'))
      expect(hand.getValue()).toBe(10)
    })

    it('returns 10 for King', () => {
      hand.addCard(createCard('hearts', 'K'))
      expect(hand.getValue()).toBe(10)
    })

    it('returns correct sum for multiple face cards', () => {
      hand.addCard(createCard('hearts', 'J'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 'K'))
      expect(hand.getValue()).toBe(30)
    })

    it('returns correct sum for face cards mixed with number cards', () => {
      hand.addCard(createCard('hearts', 'J'))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(15)
    })
  })

  describe('getValue - Single Ace handling', () => {
    it('returns 11 for single Ace (soft hand)', () => {
      hand.addCard(createCard('hearts', 'A'))
      expect(hand.getValue()).toBe(11)
    })

    it('returns 11 for Ace + low card (soft 16)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(16)
    })

    it('returns 21 for Ace + 10 (soft 21, blackjack)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 10))
      expect(hand.getValue()).toBe(21)
    })

    it('returns 21 for Ace + King (soft 21, blackjack)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.getValue()).toBe(21)
    })

    it('counts Ace as 1 when 11 would bust', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 8))
      hand.addCard(createCard('clubs', 7))
      // A(1) + 8 + 7 = 16, not A(11) + 8 + 7 = 26 (bust)
      expect(hand.getValue()).toBe(16)
    })

    it('counts Ace as 1 in 6 + 7 + Ace', () => {
      hand.addCard(createCard('hearts', 6))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 'A'))
      // 6 + 7 + A(1) = 14, not 6 + 7 + A(11) = 24 (bust)
      expect(hand.getValue()).toBe(14)
    })
  })

  describe('getValue - Multiple Aces handling', () => {
    it('counts two Aces as 12 (one as 11, one as 1)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      // A(11) + A(1) = 12
      expect(hand.getValue()).toBe(12)
    })

    it('counts three Aces as 13 (one as 11, two as 1)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 'A'))
      // A(11) + A(1) + A(1) = 13
      expect(hand.getValue()).toBe(13)
    })

    it('counts four Aces as 14 (one as 11, three as 1)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 'A'))
      hand.addCard(createCard('spades', 'A'))
      // A(11) + A(1) + A(1) + A(1) = 14
      expect(hand.getValue()).toBe(14)
    })

    it('counts all Aces as 1 when needed to avoid bust', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 10))
      // A(1) + A(1) + 10 = 12, not A(11) + A(1) + 10 = 22 (bust)
      expect(hand.getValue()).toBe(12)
    })

    it('handles A + A + 9 = 21 (hard 21 with Aces as 1 and 11)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 9))
      // A(11) + A(1) + 9 = 21
      expect(hand.getValue()).toBe(21)
    })

    it('handles A + A + A + 8 = 21 (one Ace as 11, two as 1)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 'A'))
      hand.addCard(createCard('spades', 8))
      // A(11) + A(1) + A(1) + 8 = 21
      expect(hand.getValue()).toBe(21)
    })

    it('handles five Aces correctly', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 'A'))
      hand.addCard(createCard('spades', 'A'))
      // Need a 5th ace - would need multiple decks in real game
      // For testing, we can use same card object
      hand.addCard(createCard('hearts', 'A'))
      // A(11) + A(1) + A(1) + A(1) + A(1) = 15
      expect(hand.getValue()).toBe(15)
    })
  })

  describe('isSoft', () => {
    it('returns true for single Ace', () => {
      hand.addCard(createCard('hearts', 'A'))
      expect(hand.isSoft()).toBe(true)
    })

    it('returns true for Ace + 5 (soft 16)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.isSoft()).toBe(true)
    })

    it('returns true for Ace + 10 (soft 21)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 10))
      expect(hand.isSoft()).toBe(true)
    })

    it('returns true for two Aces (one counted as 11)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      expect(hand.isSoft()).toBe(true)
    })

    it('returns false for hand without Ace', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.isSoft()).toBe(false)
    })

    it('returns false when Ace must be counted as 1', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 8))
      hand.addCard(createCard('clubs', 7))
      // A(1) + 8 + 7 = 16 (hard hand, Ace forced to 1)
      expect(hand.isSoft()).toBe(false)
    })

    it('returns false for empty hand', () => {
      expect(hand.isSoft()).toBe(false)
    })

    it('returns true for A + A + 9 = soft 21', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 9))
      // A(11) + A(1) + 9 = 21 (soft, one Ace still as 11)
      expect(hand.isSoft()).toBe(true)
    })

    it('returns false for two Aces + 10 (both Aces forced to 1)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 10))
      // A(1) + A(1) + 10 = 12 (hard hand)
      expect(hand.isSoft()).toBe(false)
    })
  })

  describe('isBust', () => {
    it('returns false for hand value of 21', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.isBust()).toBe(false)
    })

    it('returns true for hand value of 22', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 2))
      expect(hand.getValue()).toBe(22)
      expect(hand.isBust()).toBe(true)
    })

    it('returns true for hand value of 30', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 'J'))
      expect(hand.getValue()).toBe(30)
      expect(hand.isBust()).toBe(true)
    })

    it('returns false for hand value less than 21', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.isBust()).toBe(false)
    })

    it('returns false for empty hand', () => {
      expect(hand.isBust()).toBe(false)
    })

    it('Ace prevents bust when possible', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      hand.addCard(createCard('clubs', 5))
      // A(1) + K(10) + 5 = 16, not bust
      expect(hand.isBust()).toBe(false)
      expect(hand.getValue()).toBe(16)
    })
  })

  describe('isBlackjack', () => {
    it('returns true for Ace + King (2 cards)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.isBlackjack()).toBe(true)
    })

    it('returns true for Ace + Queen (2 cards)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'Q'))
      expect(hand.isBlackjack()).toBe(true)
    })

    it('returns true for Ace + Jack (2 cards)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'J'))
      expect(hand.isBlackjack()).toBe(true)
    })

    it('returns true for Ace + 10 (2 cards)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 10))
      expect(hand.isBlackjack()).toBe(true)
    })

    it('returns true for King + Ace (order should not matter)', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'A'))
      expect(hand.isBlackjack()).toBe(true)
    })

    it('returns false for Ace + King + other card (3 cards totaling 21)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      // This would be 21, but adding any card makes it 3+ cards
      // Need to construct a 3-card 21 differently
      hand.clear()
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 7))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for three-card 21 (7 + 7 + 7)', () => {
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 7))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for three-card 21 (A + A + 9)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 9))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for King + Queen (2 cards but not 21)', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      expect(hand.getValue()).toBe(20)
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for Ace + 5 (2 cards but only 16)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(16)
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for empty hand', () => {
      expect(hand.isBlackjack()).toBe(false)
    })

    it('returns false for single Ace', () => {
      hand.addCard(createCard('hearts', 'A'))
      expect(hand.isBlackjack()).toBe(false)
    })
  })

  describe('canSplit', () => {
    it('returns true for two 5s', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.canSplit()).toBe(true)
    })

    it('returns true for two Kings', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.canSplit()).toBe(true)
    })

    it('returns true for two Aces', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      expect(hand.canSplit()).toBe(true)
    })

    it('returns true for two 10s', () => {
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 10))
      expect(hand.canSplit()).toBe(true)
    })

    it('returns false for King and Jack (same value but different ranks)', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'J'))
      // Task specifies: compare RANKS, not values
      // J !== K even though both = 10
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for King and Queen (same value but different ranks)', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for 10 and King (same value but different ranks)', () => {
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for 6 and 7', () => {
      hand.addCard(createCard('hearts', 6))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for single card', () => {
      hand.addCard(createCard('hearts', 5))
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for three cards (even if first two match)', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 5))
      hand.addCard(createCard('clubs', 3))
      expect(hand.canSplit()).toBe(false)
    })

    it('returns false for empty hand', () => {
      expect(hand.canSplit()).toBe(false)
    })
  })

  describe('getCards', () => {
    it('returns an empty array for empty hand', () => {
      expect(hand.getCards()).toEqual([])
    })

    it('returns a copy of the cards array', () => {
      const card = createCard('hearts', 5)
      hand.addCard(card)

      const cards = hand.getCards()
      expect(cards).toEqual([card])

      // Modifying returned array should not affect hand
      cards.push(createCard('diamonds', 7))
      expect(hand.getCardCount()).toBe(1)
    })

    it('returns all cards in order added', () => {
      const card1 = createCard('hearts', 5)
      const card2 = createCard('diamonds', 7)
      const card3 = createCard('clubs', 3)

      hand.addCard(card1)
      hand.addCard(card2)
      hand.addCard(card3)

      expect(hand.getCards()).toEqual([card1, card2, card3])
    })
  })

  describe('getCardCount', () => {
    it('returns 0 for empty hand', () => {
      expect(hand.getCardCount()).toBe(0)
    })

    it('returns 1 after adding one card', () => {
      hand.addCard(createCard('hearts', 5))
      expect(hand.getCardCount()).toBe(1)
    })

    it('returns correct count after adding multiple cards', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 3))
      expect(hand.getCardCount()).toBe(3)
    })

    it('updates correctly after removing card', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getCardCount()).toBe(2)

      hand.removeCard()
      expect(hand.getCardCount()).toBe(1)
    })

    it('returns 0 after clearing hand', () => {
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 7))
      hand.clear()
      expect(hand.getCardCount()).toBe(0)
    })
  })

  describe('edge cases', () => {
    it('handles maximum possible hand without bust (A + A + A + A + 7 + 10 = 21)', () => {
      // 4 Aces + 7 + 10 = 4(1) + 7 + 10 = 21 (all Aces as 1)
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 'A'))
      hand.addCard(createCard('spades', 'A'))
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 10))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBust()).toBe(false)
      expect(hand.isSoft()).toBe(false) // All Aces as 1
    })

    it('handles hand with all 10-value cards leading to bust', () => {
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 'J'))
      expect(hand.getValue()).toBe(30)
      expect(hand.isBust()).toBe(true)
    })

    it('handles alternating Ace/number pattern', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 3))
      hand.addCard(createCard('clubs', 'A'))
      hand.addCard(createCard('spades', 4))
      // A(11) + 3 + A(1) + 4 = 19 (soft)
      expect(hand.getValue()).toBe(19)
      expect(hand.isSoft()).toBe(true)
    })

    it('handles soft 17 correctly (A + 6)', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
    })

    it('handles hard 17 correctly (10 + 7)', () => {
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(false)
    })

    it('handles transition from soft to hard on hit', () => {
      // Start with soft 17
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)

      // Hit with a 7 makes it hard 14
      hand.addCard(createCard('clubs', 7))
      expect(hand.getValue()).toBe(14)
      expect(hand.isSoft()).toBe(false)
    })

    it('soft 21 from A+A+9 is soft', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      hand.addCard(createCard('clubs', 9))
      expect(hand.getValue()).toBe(21)
      expect(hand.isSoft()).toBe(true)
    })

    it('handles minimum possible hand value', () => {
      hand.addCard(createCard('hearts', 2))
      hand.addCard(createCard('diamonds', 2))
      expect(hand.getValue()).toBe(4)
    })
  })

  describe('integration scenarios', () => {
    it('simulates player hitting to 21', () => {
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(12)

      hand.addCard(createCard('clubs', 9))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBust()).toBe(false)
      expect(hand.isBlackjack()).toBe(false) // 3 cards
    })

    it('simulates player busting', () => {
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(16)
      expect(hand.isBust()).toBe(false)

      hand.addCard(createCard('clubs', 8))
      expect(hand.getValue()).toBe(24)
      expect(hand.isBust()).toBe(true)
    })

    it('simulates dealer with soft 17', () => {
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
    })

    it('simulates split scenario setup', () => {
      hand.addCard(createCard('hearts', 8))
      hand.addCard(createCard('diamonds', 8))
      expect(hand.getValue()).toBe(16)
      expect(hand.canSplit()).toBe(true)
    })
  })
})
