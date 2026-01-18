/**
 * @fileoverview Unit tests for CardDeck module.
 *
 * Tests cover:
 * - Standard 52-card deck initialization
 * - Fisher-Yates shuffle algorithm correctness
 * - Card dealing operations
 * - Deck state management (reset, count, peek)
 * - Multi-deck support
 *
 * @module tests/game/CardDeck
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { CardDeck } from '../../js/game/CardDeck.js'
import { RANK_VALUES, SUIT_VALUES, isCard } from '../../js/types/index.js'

describe('CardDeck', () => {
  describe('constructor', () => {
    it('creates an empty deck by default', () => {
      const deck = new CardDeck()
      expect(deck.getCount()).toBe(0)
      expect(deck.isEmpty()).toBe(true)
    })

    it('initializes cards property as empty array', () => {
      const deck = new CardDeck()
      expect(deck.cards).toEqual([])
    })
  })

  describe('createStandardDeck', () => {
    it('creates a deck with exactly 52 unique cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      expect(deck.getCount()).toBe(52)
    })

    it('returns the deck instance for method chaining', () => {
      const deck = new CardDeck()
      const result = deck.createStandardDeck()
      expect(result).toBe(deck)
    })

    it('creates 13 cards for each suit', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (const suit of SUIT_VALUES) {
        const suitCards = deck.cards.filter((card) => card.suit === suit)
        expect(suitCards.length).toBe(13)
      }
    })

    it('creates 4 cards for each rank', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (const rank of RANK_VALUES) {
        const rankCards = deck.cards.filter((card) => card.rank === rank)
        expect(rankCards.length).toBe(4)
      }
    })

    it('creates all valid Card objects with suit, rank, and id', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (const card of deck.cards) {
        expect(isCard(card)).toBe(true)
      }
    })

    it('creates cards with unique IDs', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const ids = deck.cards.map((card) => card.id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(52)
    })

    it('creates cards with correctly formatted IDs (suit-rank)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (const card of deck.cards) {
        expect(card.id).toBe(`${card.suit}-${card.rank}`)
      }
    })

    it('includes all four suits (hearts, diamonds, clubs, spades)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const suits = new Set(deck.cards.map((card) => card.suit))
      expect(suits.has('hearts')).toBe(true)
      expect(suits.has('diamonds')).toBe(true)
      expect(suits.has('clubs')).toBe(true)
      expect(suits.has('spades')).toBe(true)
    })

    it('includes all 13 ranks (2-10, J, Q, K, A)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const ranks = new Set(deck.cards.map((card) => card.rank))
      expect(ranks.has(2)).toBe(true)
      expect(ranks.has(3)).toBe(true)
      expect(ranks.has(4)).toBe(true)
      expect(ranks.has(5)).toBe(true)
      expect(ranks.has(6)).toBe(true)
      expect(ranks.has(7)).toBe(true)
      expect(ranks.has(8)).toBe(true)
      expect(ranks.has(9)).toBe(true)
      expect(ranks.has(10)).toBe(true)
      expect(ranks.has('J')).toBe(true)
      expect(ranks.has('Q')).toBe(true)
      expect(ranks.has('K')).toBe(true)
      expect(ranks.has('A')).toBe(true)
    })

    it('clears existing cards before creating new deck', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      deck.deal()
      deck.deal()
      expect(deck.getCount()).toBe(50)

      deck.createStandardDeck()
      expect(deck.getCount()).toBe(52)
    })
  })

  describe('shuffle', () => {
    it('returns the deck instance for method chaining', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const result = deck.shuffle()
      expect(result).toBe(deck)
    })

    it('changes the order of cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const originalOrder = deck.cards.map((c) => c.id).join(',')

      deck.shuffle()
      const shuffledOrder = deck.cards.map((c) => c.id).join(',')

      // With 52 cards, the probability of same order is 1/52! (effectively 0)
      expect(shuffledOrder).not.toBe(originalOrder)
    })

    it('maintains deck count after shuffle (no cards lost)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const countBefore = deck.getCount()

      deck.shuffle()
      expect(deck.getCount()).toBe(countBefore)
    })

    it('maintains all cards after shuffle (no duplicates, no missing)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const originalIds = [...deck.cards.map((c) => c.id)].sort()

      deck.shuffle()
      const shuffledIds = [...deck.cards.map((c) => c.id)].sort()

      expect(shuffledIds).toEqual(originalIds)
    })

    it('produces different results on repeated shuffles', () => {
      const orders = new Set()

      for (let i = 0; i < 20; i++) {
        const deck = new CardDeck()
        deck.createStandardDeck()
        deck.shuffle()
        orders.add(deck.cards.map((c) => c.id).join(','))
      }

      // 20 shuffles should produce at least 15 unique orders
      expect(orders.size).toBeGreaterThan(15)
    })

    it('shuffles empty deck without error', () => {
      const deck = new CardDeck()
      expect(() => deck.shuffle()).not.toThrow()
      expect(deck.getCount()).toBe(0)
    })

    it('shuffles single card deck without error', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      while (deck.getCount() > 1) {
        deck.deal()
      }

      expect(() => deck.shuffle()).not.toThrow()
      expect(deck.getCount()).toBe(1)
    })
  })

  describe('deal', () => {
    it('removes and returns the top card', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const topCard = deck.cards[deck.cards.length - 1]
      const countBefore = deck.getCount()

      const dealtCard = deck.deal()

      expect(dealtCard).toEqual(topCard)
      expect(deck.getCount()).toBe(countBefore - 1)
    })

    it('returns a valid Card object', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const card = deck.deal()

      expect(isCard(card)).toBe(true)
    })

    it('removes cards in sequence from top', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const topFive = deck.cards.slice(-5).reverse()
      const dealt = []

      for (let i = 0; i < 5; i++) {
        dealt.push(deck.deal())
      }

      expect(dealt).toEqual(topFive)
    })

    it('throws error when dealing from empty deck', () => {
      const deck = new CardDeck()
      expect(() => deck.deal()).toThrow('Cannot deal from empty deck')
    })

    it('throws error when deck becomes empty during dealing', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 0; i < 52; i++) {
        deck.deal()
      }

      expect(() => deck.deal()).toThrow('Cannot deal from empty deck')
    })

    it('updates isEmpty correctly after dealing all cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 0; i < 52; i++) {
        expect(deck.isEmpty()).toBe(false)
        deck.deal()
      }

      expect(deck.isEmpty()).toBe(true)
    })
  })

  describe('peek', () => {
    it('returns the top card without removing it', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const countBefore = deck.getCount()

      const peekedCard = deck.peek()

      expect(deck.getCount()).toBe(countBefore)
      expect(peekedCard).toEqual(deck.cards[deck.cards.length - 1])
    })

    it('returns a valid Card object', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const card = deck.peek()

      expect(isCard(card)).toBe(true)
    })

    it('returns the same card on repeated peeks', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const first = deck.peek()
      const second = deck.peek()
      const third = deck.peek()

      expect(first).toEqual(second)
      expect(second).toEqual(third)
    })

    it('throws error when peeking empty deck', () => {
      const deck = new CardDeck()
      expect(() => deck.peek()).toThrow('Cannot peek empty deck')
    })

    it('peek returns same card that deal would return', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      const peeked = deck.peek()
      const dealt = deck.deal()

      expect(peeked).toEqual(dealt)
    })
  })

  describe('reset', () => {
    it('restores deck to 52 cards after dealing', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      deck.deal()
      deck.deal()
      deck.deal()
      expect(deck.getCount()).toBe(49)

      deck.reset()
      expect(deck.getCount()).toBe(52)
    })

    it('returns the deck instance for method chaining', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const result = deck.reset()
      expect(result).toBe(deck)
    })

    it('restores original unshuffled order', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const originalOrder = deck.cards.map((c) => c.id).join(',')

      deck.shuffle()
      deck.deal()
      deck.deal()

      deck.reset()
      const resetOrder = deck.cards.map((c) => c.id).join(',')

      expect(resetOrder).toBe(originalOrder)
    })

    it('works correctly after multiple shuffles and deals', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      const originalOrder = deck.cards.map((c) => c.id).join(',')

      deck.shuffle()
      for (let i = 0; i < 10; i++) deck.deal()
      deck.shuffle()
      for (let i = 0; i < 20; i++) deck.deal()

      deck.reset()
      expect(deck.getCount()).toBe(52)
      expect(deck.cards.map((c) => c.id).join(',')).toBe(originalOrder)
    })

    it('handles reset on empty deck (that was created)', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 0; i < 52; i++) deck.deal()
      expect(deck.isEmpty()).toBe(true)

      deck.reset()
      expect(deck.getCount()).toBe(52)
      expect(deck.isEmpty()).toBe(false)
    })

    it('throws error when resetting deck that was never created', () => {
      const deck = new CardDeck()
      expect(() => deck.reset()).toThrow('Cannot reset: deck was never created')
    })
  })

  describe('getCount', () => {
    it('returns 0 for new empty deck', () => {
      const deck = new CardDeck()
      expect(deck.getCount()).toBe(0)
    })

    it('returns 52 after createStandardDeck', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      expect(deck.getCount()).toBe(52)
    })

    it('decreases correctly after each deal', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      expect(deck.getCount()).toBe(52)
      deck.deal()
      expect(deck.getCount()).toBe(51)
      deck.deal()
      expect(deck.getCount()).toBe(50)
      deck.deal()
      expect(deck.getCount()).toBe(49)
    })

    it('returns correct count throughout deck exhaustion', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 52; i > 0; i--) {
        expect(deck.getCount()).toBe(i)
        deck.deal()
      }
      expect(deck.getCount()).toBe(0)
    })
  })

  describe('isEmpty', () => {
    it('returns true for new empty deck', () => {
      const deck = new CardDeck()
      expect(deck.isEmpty()).toBe(true)
    })

    it('returns false after createStandardDeck', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      expect(deck.isEmpty()).toBe(false)
    })

    it('returns true after dealing all cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 0; i < 52; i++) {
        deck.deal()
      }

      expect(deck.isEmpty()).toBe(true)
    })

    it('returns false when deck has at least one card', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let i = 0; i < 51; i++) {
        deck.deal()
        expect(deck.isEmpty()).toBe(false)
      }
    })
  })

  describe('multi-deck support (deckCount parameter)', () => {
    it('createStandardDeck with deckCount=2 creates 104 cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck(2)
      expect(deck.getCount()).toBe(104)
    })

    it('createStandardDeck with deckCount=6 creates 312 cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck(6)
      expect(deck.getCount()).toBe(312)
    })

    it('each card type appears deckCount times in multi-deck', () => {
      const deck = new CardDeck()
      deck.createStandardDeck(3)

      // There should be 3 copies of each unique card type
      const cardCounts = new Map()
      for (const card of deck.cards) {
        const key = `${card.suit}-${card.rank}`
        cardCounts.set(key, (cardCounts.get(key) || 0) + 1)
      }

      for (const count of cardCounts.values()) {
        expect(count).toBe(3)
      }
    })

    it('multi-deck reset restores all cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck(2)

      for (let i = 0; i < 50; i++) deck.deal()
      deck.reset()

      expect(deck.getCount()).toBe(104)
    })

    it('defaults to single deck when deckCount not provided', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      expect(deck.getCount()).toBe(52)
    })

    it('throws error for deckCount less than 1', () => {
      const deck = new CardDeck()
      expect(() => deck.createStandardDeck(0)).toThrow('Deck count must be at least 1')
      expect(() => deck.createStandardDeck(-1)).toThrow('Deck count must be at least 1')
    })
  })

  describe('card object immutability', () => {
    it('dealt cards are independent objects from deck cards', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      deck.shuffle()

      const dealt = deck.deal()
      const originalId = dealt.id

      // Modifying dealt card should not affect future deck operations
      dealt.id = 'modified-id'
      dealt.suit = 'modified'

      // Reset and verify deck cards are unaffected
      deck.reset()
      const hasModified = deck.cards.some((c) => c.id === 'modified-id')
      expect(hasModified).toBe(false)
    })
  })

  describe('integration scenarios', () => {
    it('simulates full round: create, shuffle, deal multiple hands', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()
      deck.shuffle()

      // Deal 2 cards each to 3 players and dealer
      const playerHands = [[], [], []]
      const dealerHand = []

      for (let round = 0; round < 2; round++) {
        for (let player = 0; player < 3; player++) {
          playerHands[player].push(deck.deal())
        }
        dealerHand.push(deck.deal())
      }

      expect(deck.getCount()).toBe(52 - 8)
      expect(playerHands[0].length).toBe(2)
      expect(playerHands[1].length).toBe(2)
      expect(playerHands[2].length).toBe(2)
      expect(dealerHand.length).toBe(2)

      // All dealt cards should be valid and unique
      const allDealt = [...playerHands.flat(), ...dealerHand]
      const uniqueIds = new Set(allDealt.map((c) => c.id))
      expect(uniqueIds.size).toBe(8)
    })

    it('simulates multiple rounds with reset between rounds', () => {
      const deck = new CardDeck()
      deck.createStandardDeck()

      for (let round = 0; round < 3; round++) {
        deck.shuffle()

        // Deal 10 cards
        for (let i = 0; i < 10; i++) {
          deck.deal()
        }
        expect(deck.getCount()).toBe(42)

        // Reset for next round
        deck.reset()
        expect(deck.getCount()).toBe(52)
      }
    })

    it('deck supports chained operations', () => {
      const deck = new CardDeck()

      const result = deck.createStandardDeck().shuffle().shuffle().shuffle()

      expect(result).toBe(deck)
      expect(deck.getCount()).toBe(52)
    })
  })
})
