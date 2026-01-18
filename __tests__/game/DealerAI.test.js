/**
 * @fileoverview Unit tests for DealerAI module.
 *
 * Tests cover:
 * - shouldHit() decision logic at all boundary values
 * - Soft 17 handling (standard rule: stand on soft 17)
 * - Hard 17 handling (always stand)
 * - play() method full dealer turn execution
 * - Edge cases and bust scenarios
 *
 * @module tests/game/DealerAI
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { DealerAI } from '../../js/game/DealerAI.js'
import { Hand } from '../../js/game/Hand.js'
import { createCard } from '../../js/types/index.js'

describe('DealerAI', () => {
  let dealerAI

  beforeEach(() => {
    dealerAI = new DealerAI()
  })

  describe('constructor', () => {
    it('creates a DealerAI instance', () => {
      expect(dealerAI).toBeInstanceOf(DealerAI)
    })
  })

  describe('shouldHit - low hand values (always hit)', () => {
    it('returns true for hand value 2', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 2))
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hand value 5', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 5))
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hand value 10', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hand value 12', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(12)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hand value 14', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 8))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(14)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hand value 15', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 9))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(15)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })
  })

  describe('shouldHit - boundary value 16 (must hit)', () => {
    it('returns true for hard 16 (10 + 6)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(16)
      expect(hand.isSoft()).toBe(false)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hard 16 (9 + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 9))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(16)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for hard 16 (K + 6)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(16)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for soft 16 (A + 5)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 5))
      expect(hand.getValue()).toBe(16)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for 3-card hard 16 (5 + 5 + 6)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 5))
      hand.addCard(createCard('clubs', 6))
      expect(hand.getValue()).toBe(16)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })
  })

  describe('shouldHit - boundary value 17', () => {
    it('returns false for hard 17 (10 + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(false)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hard 17 (K + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(17)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hard 17 (J + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'J'))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(17)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hard 17 (9 + 8)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 9))
      hand.addCard(createCard('diamonds', 8))
      expect(hand.getValue()).toBe(17)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for 3-card hard 17 (5 + 5 + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 5))
      hand.addCard(createCard('clubs', 7))
      expect(hand.getValue()).toBe(17)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })
  })

  describe('shouldHit - soft 17 handling (standard rule: stand)', () => {
    it('returns false for soft 17 (A + 6)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for soft 17 (6 + A)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 6))
      hand.addCard(createCard('diamonds', 'A'))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for soft 17 (A + 2 + 4)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 2))
      hand.addCard(createCard('clubs', 4))
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })
  })

  describe('shouldHit - high hand values (always stand)', () => {
    it('returns false for hand value 18', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 8))
      expect(hand.getValue()).toBe(18)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hand value 19', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 9))
      expect(hand.getValue()).toBe(19)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hand value 20', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.getValue()).toBe(20)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for hand value 21 (not blackjack)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 7))
      hand.addCard(createCard('diamonds', 7))
      hand.addCard(createCard('clubs', 7))
      expect(hand.getValue()).toBe(21)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for blackjack (A + K)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))
      expect(hand.getValue()).toBe(21)
      expect(hand.isBlackjack()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for soft 18 (A + 7)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(18)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for soft 19 (A + 8)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 8))
      expect(hand.getValue()).toBe(19)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for soft 20 (A + 9)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 9))
      expect(hand.getValue()).toBe(20)
      expect(hand.isSoft()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })
  })

  describe('shouldHit - bust scenarios', () => {
    it('returns false for bust hand (value > 21)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 5))
      expect(hand.getValue()).toBe(25)
      expect(hand.isBust()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('returns false for bust hand value 22', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 2))
      expect(hand.getValue()).toBe(22)
      expect(hand.isBust()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })
  })

  describe('shouldHit - edge cases', () => {
    it('returns true for empty hand (value 0)', () => {
      const hand = new Hand()
      expect(hand.getValue()).toBe(0)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for single ace (value 11)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      expect(hand.getValue()).toBe(11)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('returns true for two aces (value 12)', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'A'))
      expect(hand.getValue()).toBe(12)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })
  })

  describe('getAction', () => {
    it('returns "hit" when shouldHit is true', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 6))
      expect(dealerAI.getAction(hand)).toBe('hit')
    })

    it('returns "stand" when shouldHit is false', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 7))
      expect(dealerAI.getAction(hand)).toBe('stand')
    })

    it('returns "stand" for bust hand', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 5))
      expect(dealerAI.getAction(hand)).toBe('stand')
    })
  })

  describe('playTurn - full turn execution', () => {
    it('stands immediately on hard 17', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 7))

      const mockDeck = {
        deal: vi.fn()
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).not.toHaveBeenCalled()
      expect(hand.getValue()).toBe(17)
    })

    it('stands immediately on soft 17', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))

      const mockDeck = {
        deal: vi.fn()
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).not.toHaveBeenCalled()
      expect(hand.getValue()).toBe(17)
    })

    it('hits on 16 and stands when reaching 17+', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 6))

      const mockDeck = {
        deal: vi.fn().mockReturnValueOnce(createCard('clubs', 'A'))
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(1)
      expect(hand.getValue()).toBe(17) // 10 + 6 + A(1) = 17
    })

    it('hits multiple times until reaching 17+', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 6)) // value = 11

      const mockDeck = {
        deal: vi
          .fn()
          .mockReturnValueOnce(createCard('clubs', 3)) // value = 14
          .mockReturnValueOnce(createCard('spades', 4)) // value = 18
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(2)
      expect(hand.getValue()).toBe(18)
    })

    it('hits until bust', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 5)) // value = 15

      const mockDeck = {
        deal: vi.fn().mockReturnValueOnce(createCard('clubs', 'K')) // value = 25 (bust)
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(1)
      expect(hand.getValue()).toBe(25)
      expect(hand.isBust()).toBe(true)
    })

    it('does not hit when already at 18', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 8))

      const mockDeck = {
        deal: vi.fn()
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).not.toHaveBeenCalled()
      expect(hand.getValue()).toBe(18)
    })

    it('does not hit on blackjack', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 'K'))

      const mockDeck = {
        deal: vi.fn()
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).not.toHaveBeenCalled()
      expect(hand.getValue()).toBe(21)
      expect(hand.isBlackjack()).toBe(true)
    })

    it('modifies the hand object by adding cards', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 5))
      hand.addCard(createCard('diamonds', 5)) // value = 10

      const cardToAdd = createCard('clubs', 7)
      const mockDeck = {
        deal: vi.fn().mockReturnValueOnce(cardToAdd)
      }

      expect(hand.getCardCount()).toBe(2)

      dealerAI.playTurn(hand, mockDeck)

      expect(hand.getCardCount()).toBe(3)
      expect(hand.getCards()).toContainEqual(cardToAdd)
      expect(hand.getValue()).toBe(17)
    })

    it('returns the final hand', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 10))
      hand.addCard(createCard('diamonds', 7))

      const mockDeck = { deal: vi.fn() }

      const result = dealerAI.playTurn(hand, mockDeck)

      expect(result).toBe(hand)
    })
  })

  describe('playTurn - complex scenarios', () => {
    it('handles soft to hard transition', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 5)) // soft 16

      const mockDeck = {
        deal: vi
          .fn()
          .mockReturnValueOnce(createCard('clubs', 8)) // A(1) + 5 + 8 = 14 (soft to hard)
          .mockReturnValueOnce(createCard('spades', 3)) // 14 + 3 = 17
      }

      dealerAI.playTurn(hand, mockDeck)

      // After hitting twice, dealer reaches hard 17 and stands
      expect(mockDeck.deal).toHaveBeenCalledTimes(2)
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(false)
    })

    it('handles multiple hits with aces', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 2)) // soft 13

      const mockDeck = {
        deal: vi
          .fn()
          .mockReturnValueOnce(createCard('clubs', 'A')) // soft 14 (A11+2+A1)
          .mockReturnValueOnce(createCard('spades', 3)) // soft 17 (A11+2+A1+3)
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(2)
      expect(hand.getValue()).toBe(17)
      expect(hand.isSoft()).toBe(true)
    })

    it('handles dealer hitting to exactly 21', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 6))
      hand.addCard(createCard('diamonds', 5)) // value = 11

      const mockDeck = {
        deal: vi.fn().mockReturnValueOnce(createCard('clubs', 10)) // value = 21
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(1)
      expect(hand.getValue()).toBe(21)
      expect(hand.isBust()).toBe(false)
    })

    it('handles many sequential hits', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 2))
      hand.addCard(createCard('diamonds', 2)) // value = 4

      const mockDeck = {
        deal: vi
          .fn()
          .mockReturnValueOnce(createCard('clubs', 2)) // 6
          .mockReturnValueOnce(createCard('spades', 2)) // 8
          .mockReturnValueOnce(createCard('hearts', 3)) // 11
          .mockReturnValueOnce(createCard('diamonds', 3)) // 14
          .mockReturnValueOnce(createCard('clubs', 3)) // 17
      }

      dealerAI.playTurn(hand, mockDeck)

      expect(mockDeck.deal).toHaveBeenCalledTimes(5)
      expect(hand.getValue()).toBe(17)
    })
  })

  describe('integration with Hand class', () => {
    it('correctly reads hand value', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 9))
      hand.addCard(createCard('diamonds', 7))
      expect(hand.getValue()).toBe(16)
      expect(dealerAI.shouldHit(hand)).toBe(true)
    })

    it('correctly reads soft status', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'A'))
      hand.addCard(createCard('diamonds', 6))
      expect(hand.isSoft()).toBe(true)
      expect(hand.getValue()).toBe(17)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })

    it('correctly reads bust status', () => {
      const hand = new Hand()
      hand.addCard(createCard('hearts', 'K'))
      hand.addCard(createCard('diamonds', 'Q'))
      hand.addCard(createCard('clubs', 'J'))
      expect(hand.isBust()).toBe(true)
      expect(dealerAI.shouldHit(hand)).toBe(false)
    })
  })
})
