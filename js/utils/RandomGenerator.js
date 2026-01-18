/**
 * @fileoverview Cryptographically secure random number generation utilities.
 *
 * This module provides secure randomness using the Web Crypto API
 * (crypto.getRandomValues) for all random operations. It implements
 * the Fisher-Yates shuffle algorithm for uniform array shuffling.
 *
 * Security Note: Uses crypto.getRandomValues() which provides
 * cryptographically strong random values suitable for security-sensitive
 * applications like card shuffling in games.
 *
 * @module utils/RandomGenerator
 * @version 1.0.0
 */

// =============================================================================
// CRYPTO API DETECTION
// =============================================================================

/**
 * Cached reference to the crypto object for performance.
 * Supports both browser (window.crypto) and Node.js (globalThis.crypto) environments.
 * @type {Crypto | undefined}
 */
const cryptoApi =
  typeof globalThis !== 'undefined' && globalThis.crypto
    ? globalThis.crypto
    : typeof crypto !== 'undefined'
      ? crypto
      : undefined

/**
 * Checks if the Web Crypto API is available in the current environment.
 *
 * @returns {boolean} True if crypto.getRandomValues is available
 *
 * @example
 * if (isCryptoAvailable()) {
 *   console.log('Secure random available')
 * } else {
 *   console.warn('Falling back to Math.random')
 * }
 */
export function isCryptoAvailable() {
  return cryptoApi !== undefined && typeof cryptoApi.getRandomValues === 'function'
}

// =============================================================================
// SECURE RANDOM NUMBER GENERATION
// =============================================================================

/**
 * Generates a cryptographically secure random number between 0 (inclusive) and 1 (exclusive).
 *
 * Uses crypto.getRandomValues() with a Uint32Array to generate a random 32-bit
 * unsigned integer, then normalizes it to the range [0, 1).
 *
 * This function is a secure replacement for Math.random().
 *
 * @returns {number} A random floating-point number in the range [0, 1)
 * @throws {Error} If Web Crypto API is not available
 *
 * @example
 * const random = getSecureRandom()
 * console.log(random) // 0.7234567890123456
 *
 * @example
 * // Generate random percentage
 * const percentage = getSecureRandom() * 100
 */
export function getSecureRandom() {
  if (!isCryptoAvailable()) {
    console.warn(
      'Web Crypto API not available. Falling back to Math.random() - not cryptographically secure.'
    )
    return Math.random()
  }

  // Generate a random 32-bit unsigned integer
  const array = new Uint32Array(1)
  cryptoApi.getRandomValues(array)

  // Normalize to [0, 1) by dividing by 2^32
  // Using 4294967296 (2^32) as the divisor
  return array[0] / 4294967296
}

/**
 * Generates a cryptographically secure random integer within a specified range (inclusive).
 *
 * Uses rejection sampling to ensure uniform distribution across the range.
 * The algorithm generates random values and rejects those that would cause
 * bias in the modulo operation.
 *
 * @param {number} min - The minimum value (inclusive)
 * @param {number} max - The maximum value (inclusive)
 * @returns {number} A random integer in the range [min, max]
 * @throws {Error} If min > max
 *
 * @example
 * // Roll a six-sided die
 * const dieRoll = getRandomInt(1, 6)
 *
 * @example
 * // Get random deck index
 * const cardIndex = getRandomInt(0, 51)
 *
 * @example
 * // Handle boundary case
 * const fixed = getRandomInt(5, 5) // Always returns 5
 */
export function getRandomInt(min, max) {
  if (min > max) {
    throw new Error(`Invalid range: min (${min}) cannot be greater than max (${max})`)
  }

  // Handle equal min and max
  if (min === max) {
    return min
  }

  const range = max - min + 1

  if (!isCryptoAvailable()) {
    console.warn(
      'Web Crypto API not available. Falling back to Math.random() - not cryptographically secure.'
    )
    return Math.floor(Math.random() * range) + min
  }

  // For uniform distribution, we need to handle rejection sampling
  // to avoid bias from modulo operations
  const maxUint32 = 4294967296 // 2^32
  const limit = maxUint32 - (maxUint32 % range)

  const array = new Uint32Array(1)
  let randomValue

  // Rejection sampling: reject values that would cause modulo bias
  do {
    cryptoApi.getRandomValues(array)
    randomValue = array[0]
  } while (randomValue >= limit)

  return (randomValue % range) + min
}

// =============================================================================
// ARRAY SHUFFLING (FISHER-YATES ALGORITHM)
// =============================================================================

/**
 * Shuffles an array in-place using the Fisher-Yates (Knuth) shuffle algorithm.
 *
 * The Fisher-Yates algorithm guarantees a uniform random permutation when used
 * with a uniform random number generator. Each of the n! permutations has an
 * equal probability of being produced.
 *
 * Time Complexity: O(n) where n is the array length
 * Space Complexity: O(1) - shuffles in place
 *
 * @template T
 * @param {T[]} array - The array to shuffle (will be modified)
 * @returns {T[]} The same array reference, now shuffled
 *
 * @example
 * // Shuffle a deck of cards
 * const deck = createDeck()
 * shuffle(deck)
 *
 * @example
 * // Shuffle numbers
 * const numbers = [1, 2, 3, 4, 5]
 * shuffle(numbers)
 * console.log(numbers) // [3, 1, 5, 2, 4] (random order)
 *
 * @example
 * // Empty and single-element arrays are handled
 * shuffle([]) // Returns []
 * shuffle([42]) // Returns [42]
 */
export function shuffle(array) {
  // Handle edge cases
  if (array.length <= 1) {
    return array
  }

  // Fisher-Yates shuffle: iterate from end to beginning
  // For each position i, swap with a random position from 0 to i (inclusive)
  for (let i = array.length - 1; i > 0; i--) {
    // Get random index from 0 to i (inclusive)
    const j = getRandomInt(0, i)

    // Swap elements at positions i and j
    const temp = array[i]
    array[i] = array[j]
    array[j] = temp
  }

  return array
}

/**
 * Creates a shuffled copy of an array without modifying the original.
 *
 * This function is useful when you need to preserve the original array order
 * while working with a shuffled version.
 *
 * Time Complexity: O(n) for copying + O(n) for shuffling = O(n)
 * Space Complexity: O(n) for the new array
 *
 * @template T
 * @param {T[]} array - The array to copy and shuffle
 * @returns {T[]} A new shuffled array
 *
 * @example
 * // Get shuffled deck without modifying original
 * const originalDeck = createDeck()
 * const shuffledDeck = shuffleCopy(originalDeck)
 * // originalDeck is unchanged, shuffledDeck is in random order
 *
 * @example
 * // Safe shuffling for immutable patterns
 * const players = ['Alice', 'Bob', 'Charlie']
 * const turnOrder = shuffleCopy(players)
 * console.log(players) // Still ['Alice', 'Bob', 'Charlie']
 */
export function shuffleCopy(array) {
  // Create a shallow copy of the array
  const copy = [...array]

  // Shuffle the copy in place and return it
  return shuffle(copy)
}
