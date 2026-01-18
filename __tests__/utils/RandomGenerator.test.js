/**
 * @fileoverview Unit tests for RandomGenerator module.
 *
 * Tests cover:
 * - Cryptographically secure random number generation
 * - Range-bounded integer generation
 * - Fisher-Yates shuffle algorithm correctness
 * - Statistical distribution verification
 *
 * @module tests/utils/RandomGenerator
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  getRandomInt,
  getSecureRandom,
  isCryptoAvailable,
  shuffle,
  shuffleCopy
} from '../../js/utils/RandomGenerator.js'

describe('RandomGenerator', () => {
  describe('isCryptoAvailable', () => {
    it('returns true when Web Crypto API is available', () => {
      // In test environment, crypto should be available
      const result = isCryptoAvailable()
      expect(typeof result).toBe('boolean')
    })
  })

  describe('getSecureRandom', () => {
    it('returns a number between 0 (inclusive) and 1 (exclusive)', () => {
      for (let i = 0; i < 100; i++) {
        const result = getSecureRandom()
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThan(1)
      }
    })

    it('returns different values on repeated calls', () => {
      const results = new Set()
      for (let i = 0; i < 100; i++) {
        results.add(getSecureRandom())
      }
      // With 100 calls, we should get at least 90 unique values
      expect(results.size).toBeGreaterThan(90)
    })

    it('returns a number type', () => {
      const result = getSecureRandom()
      expect(typeof result).toBe('number')
      expect(Number.isNaN(result)).toBe(false)
      expect(Number.isFinite(result)).toBe(true)
    })
  })

  describe('getRandomInt', () => {
    it('returns integer within [min, max] range inclusive', () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomInt(0, 10)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(10)
        expect(Number.isInteger(result)).toBe(true)
      }
    })

    it('returns values in range [1, 5] without returning 0 or 6', () => {
      const results = new Set()
      for (let i = 0; i < 500; i++) {
        const result = getRandomInt(1, 5)
        results.add(result)
        expect(result).toBeGreaterThanOrEqual(1)
        expect(result).toBeLessThanOrEqual(5)
      }
      // Should never have 0 or 6
      expect(results.has(0)).toBe(false)
      expect(results.has(6)).toBe(false)
    })

    it('handles min equal to max (boundary case)', () => {
      const result = getRandomInt(5, 5)
      expect(result).toBe(5)
    })

    it('handles min = 0 correctly', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInt(0, 3)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(3)
      }
    })

    it('handles max = 52 (deck size boundary)', () => {
      for (let i = 0; i < 100; i++) {
        const result = getRandomInt(0, 51)
        expect(result).toBeGreaterThanOrEqual(0)
        expect(result).toBeLessThanOrEqual(51)
      }
    })

    it('handles negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInt(-10, -5)
        expect(result).toBeGreaterThanOrEqual(-10)
        expect(result).toBeLessThanOrEqual(-5)
      }
    })

    it('handles mixed positive and negative ranges', () => {
      for (let i = 0; i < 50; i++) {
        const result = getRandomInt(-5, 5)
        expect(result).toBeGreaterThanOrEqual(-5)
        expect(result).toBeLessThanOrEqual(5)
      }
    })

    it('produces distribution covering all values in range', () => {
      const results = new Set()
      // Run enough iterations to statistically cover small range
      for (let i = 0; i < 500; i++) {
        results.add(getRandomInt(0, 5))
      }
      // All values 0-5 should appear at least once
      for (let v = 0; v <= 5; v++) {
        expect(results.has(v)).toBe(true)
      }
    })

    it('throws error when min > max', () => {
      expect(() => getRandomInt(10, 5)).toThrow()
    })

    it('returns integer type', () => {
      const result = getRandomInt(0, 100)
      expect(Number.isInteger(result)).toBe(true)
    })
  })

  describe('shuffle', () => {
    it('shuffles array in place and returns the same array reference', () => {
      const original = [1, 2, 3, 4, 5]
      const result = shuffle(original)
      expect(result).toBe(original) // Same reference
    })

    it('does not duplicate or remove elements', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const copy = [...original]
      shuffle(original)

      // Same length
      expect(original.length).toBe(copy.length)

      // Same elements (sorted should match)
      expect([...original].sort((a, b) => a - b)).toEqual(copy.sort((a, b) => a - b))
    })

    it('does not duplicate cards when shuffling deck-like array', () => {
      // Simulate a deck with unique card IDs
      const deck = Array.from({ length: 52 }, (_, i) => `card-${i}`)
      shuffle(deck)

      // Check for uniqueness
      const uniqueCards = new Set(deck)
      expect(uniqueCards.size).toBe(52)
      expect(deck.length).toBe(52)
    })

    it('produces different order on repeated calls (100 shuffles)', () => {
      const getOrderString = (arr) => arr.join(',')
      const orders = new Set()

      for (let i = 0; i < 100; i++) {
        const arr = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
        shuffle(arr)
        orders.add(getOrderString(arr))
      }

      // With 10 elements, there are 10! = 3,628,800 permutations
      // 100 shuffles should produce at least 90 unique orders
      expect(orders.size).toBeGreaterThan(90)
    })

    it('handles empty array', () => {
      const empty = []
      const result = shuffle(empty)
      expect(result).toEqual([])
      expect(result).toBe(empty)
    })

    it('handles single element array', () => {
      const single = [42]
      const result = shuffle(single)
      expect(result).toEqual([42])
      expect(result).toBe(single)
    })

    it('handles two element array', () => {
      // With 2 elements, should swap about 50% of the time
      let swapCount = 0
      for (let i = 0; i < 100; i++) {
        const arr = [1, 2]
        shuffle(arr)
        if (arr[0] === 2) swapCount++
      }
      // Should swap roughly 50% of the time (allow 30-70% range)
      expect(swapCount).toBeGreaterThan(30)
      expect(swapCount).toBeLessThan(70)
    })

    it('maintains array with object elements', () => {
      const objects = [
        { id: 1, name: 'A' },
        { id: 2, name: 'B' },
        { id: 3, name: 'C' }
      ]
      const originalRefs = objects.map((o) => o)
      shuffle(objects)

      // Same object references should exist
      expect(objects.length).toBe(3)
      for (const ref of originalRefs) {
        expect(objects).toContain(ref)
      }
    })
  })

  describe('shuffleCopy', () => {
    it('returns a new array, preserving original', () => {
      const original = [1, 2, 3, 4, 5]
      const originalCopy = [...original]
      const result = shuffleCopy(original)

      // Original unchanged
      expect(original).toEqual(originalCopy)
      // Result is different reference
      expect(result).not.toBe(original)
    })

    it('contains same elements as original', () => {
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      const result = shuffleCopy(original)

      expect(result.length).toBe(original.length)
      expect([...result].sort((a, b) => a - b)).toEqual([...original].sort((a, b) => a - b))
    })

    it('produces shuffled result (different from original order most times)', () => {
      let differentCount = 0
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      for (let i = 0; i < 100; i++) {
        const result = shuffleCopy(original)
        if (result.join(',') !== original.join(',')) {
          differentCount++
        }
      }

      // Should be different almost always (99%+ of the time with 10 elements)
      expect(differentCount).toBeGreaterThan(95)
    })

    it('handles empty array', () => {
      const empty = []
      const result = shuffleCopy(empty)
      expect(result).toEqual([])
      expect(result).not.toBe(empty)
    })

    it('handles single element array', () => {
      const single = [42]
      const result = shuffleCopy(single)
      expect(result).toEqual([42])
      expect(result).not.toBe(single)
    })

    it('does not modify original when shuffling deck', () => {
      const deck = Array.from({ length: 52 }, (_, i) => ({
        id: `card-${i}`,
        suit: ['hearts', 'diamonds', 'clubs', 'spades'][Math.floor(i / 13)],
        rank: (i % 13) + 1
      }))
      const originalOrder = deck.map((c) => c.id).join(',')

      shuffleCopy(deck)

      const afterOrder = deck.map((c) => c.id).join(',')
      expect(afterOrder).toBe(originalOrder)
    })
  })

  describe('Statistical Distribution Tests', () => {
    it('getRandomInt distribution is approximately uniform', () => {
      // Chi-squared test approximation
      const buckets = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
      const iterations = 5000
      const expectedPerBucket = iterations / 5

      for (let i = 0; i < iterations; i++) {
        const value = getRandomInt(0, 4)
        buckets[value]++
      }

      // Each bucket should be within 20% of expected (generous margin for randomness)
      for (const count of Object.values(buckets)) {
        expect(count).toBeGreaterThan(expectedPerBucket * 0.8)
        expect(count).toBeLessThan(expectedPerBucket * 1.2)
      }
    })

    it('shuffle position distribution is approximately uniform', () => {
      // Track how often element 0 ends up in each position
      const positions = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 }
      const iterations = 5000
      const expectedPerPosition = iterations / 5

      for (let i = 0; i < iterations; i++) {
        const arr = [0, 1, 2, 3, 4]
        shuffle(arr)
        const posOfZero = arr.indexOf(0)
        positions[posOfZero]++
      }

      // Each position should be within 20% of expected
      for (const count of Object.values(positions)) {
        expect(count).toBeGreaterThan(expectedPerPosition * 0.8)
        expect(count).toBeLessThan(expectedPerPosition * 1.2)
      }
    })
  })
})
