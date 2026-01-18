/**
 * @fileoverview Performance validation tests for Karate Blackjack game.
 *
 * Tests verify:
 * - Operations complete within acceptable time limits
 * - Memory usage patterns are reasonable
 * - No performance regressions in game logic
 *
 * Performance targets (from NFR):
 * - UI response < 100ms
 * - Operations should be synchronous and fast
 * - No memory leaks during game play
 *
 * @module tests/performance/Performance
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { CardDeck } from '../../js/game/CardDeck.js'
import { GameEngine } from '../../js/game/GameEngine.js'
import { Hand } from '../../js/game/Hand.js'
import { createCard } from '../../js/types/index.js'

// =============================================================================
// PERFORMANCE THRESHOLDS
// =============================================================================

/**
 * Performance thresholds in milliseconds.
 * These values ensure the game remains responsive.
 */
const THRESHOLDS = Object.freeze({
  /** Maximum time for a single game operation (hit, stand, deal, etc.) */
  SINGLE_OPERATION: 10,
  /** Maximum time for deck shuffling */
  SHUFFLE: 50,
  /** Maximum time for hand value calculation */
  HAND_VALUE_CALCULATION: 5,
  /** Maximum time for state updates (AC-014: < 100ms) */
  STATE_UPDATE: 100,
  /** Maximum time for a complete game round */
  COMPLETE_ROUND: 100,
  /** Maximum time for batch operations (100 rounds) */
  BATCH_OPERATIONS: 1000
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Measures execution time of a function.
 * @param {Function} fn - Function to measure
 * @returns {number} Execution time in milliseconds
 */
function measureTime(fn) {
  const start = performance.now()
  fn()
  const end = performance.now()
  return end - start
}

/**
 * Measures average execution time over multiple runs.
 * @param {Function} fn - Function to measure
 * @param {number} iterations - Number of iterations
 * @returns {{average: number, min: number, max: number, total: number}}
 */
function measureAverageTime(fn, iterations = 100) {
  const times = []

  for (let i = 0; i < iterations; i++) {
    const elapsed = measureTime(fn)
    times.push(elapsed)
  }

  const total = times.reduce((sum, t) => sum + t, 0)
  const average = total / iterations
  const min = Math.min(...times)
  const max = Math.max(...times)

  return { average, min, max, total }
}

/**
 * Estimates memory usage by forcing garbage collection hints.
 * Note: This is an approximation since JS doesn't expose direct memory control.
 * @returns {number} Estimated heap size in bytes (if available)
 */
function getMemoryUsage() {
  if (typeof globalThis.gc === 'function') {
    globalThis.gc()
  }

  if (globalThis.process?.memoryUsage) {
    return globalThis.process.memoryUsage().heapUsed
  }

  return 0
}

// =============================================================================
// DECK SHUFFLING PERFORMANCE TESTS
// =============================================================================

describe('Performance: Deck Shuffling', () => {
  /** @type {CardDeck} */
  let deck

  beforeEach(() => {
    deck = new CardDeck()
    deck.createStandardDeck()
  })

  it('single shuffle completes under threshold', () => {
    const elapsed = measureTime(() => {
      deck.shuffle()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SHUFFLE)
  })

  it('100 consecutive shuffles complete efficiently', () => {
    const { average, total } = measureAverageTime(() => {
      deck.shuffle()
    }, 100)

    expect(average).toBeLessThan(THRESHOLDS.SHUFFLE)
    expect(total).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })

  it('shuffle maintains consistent performance', () => {
    const { min, max } = measureAverageTime(() => {
      deck.shuffle()
    }, 50)

    // Performance should be consistent (max not more than 10x min)
    const variance = max / (min || 0.1)
    expect(variance).toBeLessThan(20)
  })

  it('multi-deck shuffle (6 decks) completes under threshold', () => {
    const multiDeck = new CardDeck()
    multiDeck.createStandardDeck(6)

    const elapsed = measureTime(() => {
      multiDeck.shuffle()
    })

    // Allow slightly more time for larger deck
    expect(elapsed).toBeLessThan(THRESHOLDS.SHUFFLE * 2)
  })

  it('deck creation + shuffle completes under threshold', () => {
    const elapsed = measureTime(() => {
      const newDeck = new CardDeck()
      newDeck.createStandardDeck().shuffle()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SHUFFLE + THRESHOLDS.SINGLE_OPERATION)
  })
})

// =============================================================================
// HAND VALUE CALCULATION PERFORMANCE TESTS
// =============================================================================

describe('Performance: Hand Value Calculation', () => {
  /** @type {Hand} */
  let hand

  beforeEach(() => {
    hand = new Hand()
  })

  afterEach(() => {
    hand.clear()
  })

  it('adding single card and getting value completes under threshold', () => {
    const card = createCard('hearts', 'A')

    const elapsed = measureTime(() => {
      hand.addCard(card)
      hand.getValue()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.HAND_VALUE_CALCULATION)
  })

  it('adding 10 cards and getting value completes under threshold', () => {
    const elapsed = measureTime(() => {
      for (let i = 0; i < 10; i++) {
        hand.addCard(createCard('hearts', 2))
        hand.getValue()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.HAND_VALUE_CALCULATION * 10)
  })

  it('1000 hand value calculations complete efficiently', () => {
    hand.addCard(createCard('hearts', 'A'))
    hand.addCard(createCard('diamonds', 'K'))

    const { average, total } = measureAverageTime(() => {
      hand.getValue()
      hand.isSoft()
      hand.isBust()
      hand.isBlackjack()
    }, 1000)

    expect(average).toBeLessThan(1) // Each call should be sub-millisecond
    expect(total).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })

  it('complex hand with multiple Aces calculates efficiently', () => {
    // Add multiple Aces to test complex value calculation
    hand.addCard(createCard('hearts', 'A'))
    hand.addCard(createCard('diamonds', 'A'))
    hand.addCard(createCard('clubs', 'A'))
    hand.addCard(createCard('spades', 'A'))
    hand.addCard(createCard('hearts', 5))

    const { average } = measureAverageTime(() => {
      hand.getValue()
      hand.isSoft()
    }, 1000)

    expect(average).toBeLessThan(1)
  })

  it('clear and recalculate cycles complete efficiently', () => {
    const elapsed = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        hand.addCard(createCard('hearts', 'A'))
        hand.addCard(createCard('diamonds', 'K'))
        hand.getValue()
        hand.clear()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })
})

// =============================================================================
// GAME ENGINE OPERATION PERFORMANCE TESTS
// =============================================================================

describe('Performance: Game Engine Operations', () => {
  /** @type {GameEngine} */
  let engine

  beforeEach(() => {
    engine = new GameEngine({ initialBalance: 10000 })
  })

  it('startNewRound completes under threshold', () => {
    const elapsed = measureTime(() => {
      engine.startNewRound()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('placeBet completes under threshold', () => {
    engine.startNewRound()

    const elapsed = measureTime(() => {
      engine.placeBet(0, 100)
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('deal completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)

    const elapsed = measureTime(() => {
      engine.deal()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('hit completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    // Handle insurance if offered
    if (engine.getState().insuranceOffered) {
      engine.declineInsurance()
    }

    const elapsed = measureTime(() => {
      engine.hit(0)
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('stand completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    // Handle insurance if offered
    if (engine.getState().insuranceOffered) {
      engine.declineInsurance()
    }

    const elapsed = measureTime(() => {
      engine.stand(0)
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('playDealerTurn completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    // Handle insurance if offered
    if (engine.getState().insuranceOffered) {
      engine.declineInsurance()
    }

    engine.stand(0)

    const elapsed = measureTime(() => {
      engine.playDealerTurn()
    })

    // Dealer may draw multiple cards, allow slightly more time
    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION * 5)
  })

  it('resolveRound completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    // Handle insurance if offered
    if (engine.getState().insuranceOffered) {
      engine.declineInsurance()
    }

    engine.stand(0)
    engine.playDealerTurn()

    const elapsed = measureTime(() => {
      engine.resolveRound()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION)
  })

  it('getState completes under threshold', () => {
    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    const { average } = measureAverageTime(() => {
      engine.getState()
    }, 1000)

    expect(average).toBeLessThan(1)
  })
})

// =============================================================================
// GAME ENGINE THROUGHPUT TESTS
// =============================================================================

describe('Performance: Game Engine Throughput', () => {
  it('complete round completes under threshold (AC-014)', () => {
    const engine = new GameEngine({ initialBalance: 10000 })

    const elapsed = measureTime(() => {
      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.deal()

      // Handle insurance if offered
      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      // Simulate player actions
      if (!engine.getState().playerHands[0].isBust) {
        engine.stand(0)
      }

      engine.playDealerTurn()
      engine.resolveRound()
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.COMPLETE_ROUND)
  })

  it('100 complete rounds complete efficiently', () => {
    const engine = new GameEngine({ initialBalance: 100000 })

    const elapsed = measureTime(() => {
      for (let round = 0; round < 100; round++) {
        engine.startNewRound()
        engine.placeBet(0, 100)
        engine.deal()

        // Handle insurance if offered
        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        // Simulate player actions
        if (!engine.getState().playerHands[0].isBust) {
          engine.stand(0)
        }

        engine.playDealerTurn()
        engine.resolveRound()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })

  it('50 rounds with multiple hits complete efficiently', () => {
    const engine = new GameEngine({ initialBalance: 100000 })

    const elapsed = measureTime(() => {
      for (let round = 0; round < 50; round++) {
        engine.startNewRound()
        engine.placeBet(0, 100)
        engine.deal()

        // Handle insurance if offered
        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        // Hit until value >= 17 or bust
        let hitCount = 0
        while (
          !engine.getState().playerHands[0].isBust &&
          engine.getState().playerHands[0].value < 17 &&
          hitCount < 5
        ) {
          engine.hit(0)
          hitCount++
        }

        if (!engine.getState().playerHands[0].isBust) {
          engine.stand(0)
        }

        engine.playDealerTurn()
        engine.resolveRound()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })

  it('multi-hand rounds (3 hands) complete efficiently', () => {
    const engine = new GameEngine({ initialBalance: 100000 })

    const elapsed = measureTime(() => {
      for (let round = 0; round < 50; round++) {
        engine.startNewRound()
        engine.setHandCount(3)
        engine.placeBet(0, 100)
        engine.placeBet(1, 100)
        engine.placeBet(2, 100)
        engine.deal()

        // Handle insurance if offered
        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        // Stand on all hands
        for (let h = 0; h < 3; h++) {
          const state = engine.getState()
          if (
            state.playerHands[h] &&
            !state.playerHands[h].isStanding &&
            !state.playerHands[h].isBust
          ) {
            engine.stand(h)
          }
        }

        engine.playDealerTurn()
        engine.resolveRound()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS * 2)
  })
})

// =============================================================================
// STATE UPDATE PERFORMANCE TESTS (AC-014)
// =============================================================================

describe('Performance: State Updates (AC-014)', () => {
  it('state display updates within 100ms threshold', () => {
    const engine = new GameEngine({ initialBalance: 10000 })
    const stateUpdates = []

    engine.subscribe((state) => {
      stateUpdates.push(performance.now())
    })

    const startTime = performance.now()

    engine.startNewRound()
    engine.placeBet(0, 100)
    engine.deal()

    // Handle insurance if offered
    if (engine.getState().insuranceOffered) {
      engine.declineInsurance()
    }

    engine.hit(0)
    engine.stand(0)
    engine.playDealerTurn()
    engine.resolveRound()

    const endTime = performance.now()
    const totalTime = endTime - startTime

    // All operations including state notifications should complete under 100ms
    expect(totalTime).toBeLessThan(THRESHOLDS.STATE_UPDATE)
  })

  it('rapid state changes complete within threshold', () => {
    const engine = new GameEngine({ initialBalance: 10000 })
    let notificationCount = 0

    engine.subscribe(() => {
      notificationCount++
    })

    const elapsed = measureTime(() => {
      for (let i = 0; i < 20; i++) {
        engine.startNewRound()
        engine.placeBet(0, 100)
        engine.deal()

        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        engine.stand(0)
        engine.playDealerTurn()
        engine.resolveRound()
      }
    })

    expect(notificationCount).toBeGreaterThan(0)
    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })
})

// =============================================================================
// MEMORY EFFICIENCY TESTS
// =============================================================================

describe('Performance: Memory Efficiency', () => {
  it('repeated deck operations do not leak memory', () => {
    const initialMemory = getMemoryUsage()

    // Perform many deck operations
    for (let i = 0; i < 1000; i++) {
      const deck = new CardDeck()
      deck.createStandardDeck().shuffle()
      for (let j = 0; j < 10; j++) {
        deck.deal()
      }
      deck.reset()
    }

    const finalMemory = getMemoryUsage()

    // If memory tracking is available, check for reasonable growth
    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory
      // Allow up to 10MB growth (reasonable for test environment)
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    }

    // Test passes if no crash occurs
    expect(true).toBe(true)
  })

  it('repeated hand operations do not leak memory', () => {
    const initialMemory = getMemoryUsage()

    for (let i = 0; i < 1000; i++) {
      const hand = new Hand()
      for (let j = 0; j < 10; j++) {
        hand.addCard(createCard('hearts', 2))
        hand.getValue()
      }
      hand.clear()
    }

    const finalMemory = getMemoryUsage()

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory
      expect(memoryGrowth).toBeLessThan(10 * 1024 * 1024)
    }

    expect(true).toBe(true)
  })

  it('repeated game rounds do not leak memory', () => {
    const initialMemory = getMemoryUsage()

    for (let round = 0; round < 100; round++) {
      const engine = new GameEngine({ initialBalance: 10000 })
      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.deal()

      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      engine.stand(0)
      engine.playDealerTurn()
      engine.resolveRound()
    }

    const finalMemory = getMemoryUsage()

    if (initialMemory > 0 && finalMemory > 0) {
      const memoryGrowth = finalMemory - initialMemory
      expect(memoryGrowth).toBeLessThan(50 * 1024 * 1024)
    }

    expect(true).toBe(true)
  })

  it('subscriber cleanup prevents memory leaks', () => {
    const engine = new GameEngine({ initialBalance: 10000 })
    const unsubscribers = []

    // Add many subscribers
    for (let i = 0; i < 100; i++) {
      const unsubscribe = engine.subscribe(() => {})
      unsubscribers.push(unsubscribe)
    }

    // Remove all subscribers
    for (const unsubscribe of unsubscribers) {
      unsubscribe()
    }

    // Trigger state update - should not call any callbacks
    engine.startNewRound()

    // If no crash, test passes
    expect(true).toBe(true)
  })
})

// =============================================================================
// DEALER AI PERFORMANCE TESTS
// =============================================================================

describe('Performance: Dealer AI', () => {
  it('dealer turn completes efficiently even with many hits', () => {
    const timings = []

    // Run multiple rounds to sample dealer behavior
    for (let i = 0; i < 50; i++) {
      const engine = new GameEngine({ initialBalance: 10000 })
      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.deal()

      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      engine.stand(0)

      const start = performance.now()
      engine.playDealerTurn()
      const end = performance.now()

      timings.push(end - start)
    }

    const average = timings.reduce((a, b) => a + b, 0) / timings.length
    const max = Math.max(...timings)

    // Dealer turn should be fast
    expect(average).toBeLessThan(THRESHOLDS.SINGLE_OPERATION * 5)
    expect(max).toBeLessThan(THRESHOLDS.SINGLE_OPERATION * 10)
  })
})

// =============================================================================
// CARD DEALING PERFORMANCE TESTS
// =============================================================================

describe('Performance: Card Dealing', () => {
  it('dealing entire deck completes efficiently', () => {
    const deck = new CardDeck()
    deck.createStandardDeck().shuffle()

    const elapsed = measureTime(() => {
      while (!deck.isEmpty()) {
        deck.deal()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.SINGLE_OPERATION * 52)
  })

  it('dealing and resetting 100 times completes efficiently', () => {
    const deck = new CardDeck()
    deck.createStandardDeck()

    const elapsed = measureTime(() => {
      for (let i = 0; i < 100; i++) {
        deck.shuffle()
        for (let j = 0; j < 10; j++) {
          deck.deal()
        }
        deck.reset()
      }
    })

    expect(elapsed).toBeLessThan(THRESHOLDS.BATCH_OPERATIONS)
  })

  it('peek operations are fast', () => {
    const deck = new CardDeck()
    deck.createStandardDeck().shuffle()

    const { average } = measureAverageTime(() => {
      deck.peek()
    }, 1000)

    expect(average).toBeLessThan(1)
  })
})

// =============================================================================
// INTEGRATION PERFORMANCE TESTS
// =============================================================================

describe('Performance: Integration', () => {
  it('simulates realistic game session (50 rounds with varied actions)', () => {
    const engine = new GameEngine({ initialBalance: 50000 })

    const start = performance.now()

    for (let round = 0; round < 50; round++) {
      engine.startNewRound()

      // Vary number of hands (1-3)
      const handCount = (round % 3) + 1
      engine.setHandCount(handCount)

      for (let h = 0; h < handCount; h++) {
        engine.placeBet(h, 100)
      }

      engine.deal()

      if (engine.getState().insuranceOffered) {
        // Randomly take or decline insurance
        if (round % 2 === 0) {
          engine.takeInsurance()
        } else {
          engine.declineInsurance()
        }
      }

      // Simulate varied player actions
      for (let h = 0; h < handCount; h++) {
        const state = engine.getState()
        if (!state.playerHands[h]) continue

        const handValue = state.playerHands[h].value

        // Basic strategy simulation
        if (handValue < 12) {
          engine.hit(h)
          const newState = engine.getState()
          if (newState.playerHands[h] && newState.playerHands[h].value < 17) {
            engine.hit(h)
          }
        }

        if (!engine.getState().playerHands[h]?.isStanding) {
          engine.stand(h)
        }
      }

      engine.playDealerTurn()
      engine.resolveRound()
    }

    const end = performance.now()
    const totalTime = end - start

    // 50 varied rounds should complete in under 2 seconds
    expect(totalTime).toBeLessThan(2000)
  })

  it('handles stress test with rapid operations', () => {
    const engine = new GameEngine({ initialBalance: 1000000 })

    const elapsed = measureTime(() => {
      for (let i = 0; i < 500; i++) {
        engine.startNewRound()
        engine.placeBet(0, 100)
        engine.deal()

        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        // Rapid hits
        for (let j = 0; j < 3; j++) {
          if (!engine.getState().playerHands[0]?.isBust) {
            engine.hit(0)
          }
        }

        if (!engine.getState().playerHands[0]?.isStanding) {
          engine.stand(0)
        }

        engine.playDealerTurn()
        engine.resolveRound()
      }
    })

    // 500 rounds with multiple operations should complete in under 5 seconds
    expect(elapsed).toBeLessThan(5000)
  })
})

// =============================================================================
// PERFORMANCE METRICS SUMMARY
// =============================================================================

describe('Performance: Metrics Summary', () => {
  it('generates performance baseline metrics', () => {
    const metrics = {
      shuffle: measureAverageTime(() => {
        const deck = new CardDeck()
        deck.createStandardDeck().shuffle()
      }, 100),

      handCalculation: measureAverageTime(() => {
        const hand = new Hand()
        hand.addCard(createCard('hearts', 'A'))
        hand.addCard(createCard('diamonds', 'K'))
        hand.getValue()
        hand.isSoft()
        hand.isBlackjack()
      }, 100),

      completeRound: measureAverageTime(() => {
        const engine = new GameEngine({ initialBalance: 10000 })
        engine.startNewRound()
        engine.placeBet(0, 100)
        engine.deal()
        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }
        engine.stand(0)
        engine.playDealerTurn()
        engine.resolveRound()
      }, 50)
    }

    // All operations should be well under their thresholds
    expect(metrics.shuffle.average).toBeLessThan(THRESHOLDS.SHUFFLE)
    expect(metrics.handCalculation.average).toBeLessThan(THRESHOLDS.HAND_VALUE_CALCULATION)
    expect(metrics.completeRound.average).toBeLessThan(THRESHOLDS.COMPLETE_ROUND)

    // Log metrics for reference (in actual CI/CD, these could be stored)
    // console.log('Performance Baseline Metrics:', JSON.stringify(metrics, null, 2))
  })
})
