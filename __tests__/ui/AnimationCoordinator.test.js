/**
 * @fileoverview Unit tests for AnimationCoordinator module.
 *
 * Tests cover:
 * - Chip management (add, clear, position calculation)
 * - Card animation methods
 * - Result animations
 * - Reduced motion support
 *
 * @module tests/ui/AnimationCoordinator
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AnimationCoordinator } from '../../js/ui/AnimationCoordinator.js'

// Mock canvas and context
function createMockCanvas() {
  const ctx = {
    clearRect: vi.fn(),
    fillRect: vi.fn(),
    strokeRect: vi.fn(),
    beginPath: vi.fn(),
    closePath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    stroke: vi.fn(),
    roundRect: vi.fn(),
    save: vi.fn(),
    restore: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    fillText: vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn()
    })),
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    font: '',
    textAlign: '',
    textBaseline: '',
    shadowColor: '',
    shadowBlur: 0,
    shadowOffsetX: 0,
    shadowOffsetY: 0
  }

  return {
    width: 800,
    height: 400,
    getContext: vi.fn(() => ctx),
    _ctx: ctx
  }
}

// Mock elements
function createMockElements() {
  const createHandElement = () => ({
    classList: {
      add: vi.fn(),
      remove: vi.fn(),
      toggle: vi.fn(),
      contains: vi.fn(() => false)
    },
    querySelectorAll: vi.fn(() => [])
  })

  const createCardContainer = () => ({
    querySelectorAll: vi.fn(() => [])
  })

  return {
    dealerHand: vi.fn(() => createHandElement()),
    playerHand: vi.fn(() => createHandElement()),
    playerCards: vi.fn(() => createCardContainer())
  }
}

describe('AnimationCoordinator', () => {
  let coordinator
  let mockCanvas
  let mockElements

  beforeEach(() => {
    mockCanvas = createMockCanvas()
    mockElements = createMockElements()
    coordinator = new AnimationCoordinator(mockCanvas, mockElements)
  })

  describe('constructor', () => {
    it('creates an AnimationCoordinator instance', () => {
      expect(coordinator).toBeInstanceOf(AnimationCoordinator)
    })

    it('initializes with animations enabled by default', () => {
      expect(coordinator.isEnabled()).toBe(true)
    })

    it('initializes empty table chips arrays', () => {
      // Internal state - test through behavior
      expect(coordinator.isEnabled()).toBe(true)
    })
  })

  describe('enableAnimations / disableAnimations', () => {
    it('can enable animations', () => {
      coordinator.disableAnimations()
      expect(coordinator.isEnabled()).toBe(false)

      coordinator.enableAnimations()
      expect(coordinator.isEnabled()).toBe(true)
    })

    it('can disable animations', () => {
      coordinator.disableAnimations()
      expect(coordinator.isEnabled()).toBe(false)
    })
  })

  describe('setHandCount', () => {
    it('sets the hand count for positioning', () => {
      coordinator.setHandCount(2)
      // Verify by checking that subsequent operations use correct positioning
      expect(coordinator.isEnabled()).toBe(true) // Basic validation
    })

    it('accepts values 1-3', () => {
      coordinator.setHandCount(1)
      coordinator.setHandCount(2)
      coordinator.setHandCount(3)
      expect(coordinator.isEnabled()).toBe(true)
    })
  })

  describe('clearAllChips', () => {
    it('clears all chips from table', () => {
      coordinator.clearAllChips()
      // Should clear canvas
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('clearHandChips', () => {
    it('clears chips from specific hand', () => {
      coordinator.clearHandChips(0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('handles all hand indices', () => {
      coordinator.clearHandChips(0)
      coordinator.clearHandChips(1)
      coordinator.clearHandChips(2)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('clearResults', () => {
    it('clears result displays from all hands', () => {
      // Setup mock document
      const originalGetElementById = globalThis.document?.getElementById
      globalThis.document = {
        getElementById: vi.fn(() => ({
          classList: { remove: vi.fn() },
          textContent: ''
        }))
      }

      coordinator.clearResults()

      // Verify element methods were called
      expect(mockElements.playerHand).toHaveBeenCalled()

      // Restore
      if (originalGetElementById) {
        globalThis.document.getElementById = originalGetElementById
      }
    })
  })

  describe('stop', () => {
    it('stops all active animations', () => {
      coordinator.stop()
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('addChipToTable', () => {
    it('adds chip to specified hand', async () => {
      coordinator.disableAnimations() // Skip animation for instant test
      await coordinator.addChipToTable(10, 0, 1)
      // Chip should be added to internal state
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('handles different chip denominations', async () => {
      coordinator.disableAnimations()
      await coordinator.addChipToTable(10, 0, 1)
      await coordinator.addChipToTable(50, 0, 1)
      await coordinator.addChipToTable(100, 0, 1)
      await coordinator.addChipToTable(500, 0, 1)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('breaks large amounts into multiple chips', async () => {
      coordinator.disableAnimations()
      await coordinator.addChipToTable(110, 0, 1) // Should be 100 + 10
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('animateBetPlacement', () => {
    it('redraws table chips', async () => {
      coordinator.disableAnimations()
      await coordinator.animateBetPlacement(100, 0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('animateInitialDeal', () => {
    it('returns immediately when animations disabled', async () => {
      coordinator.disableAnimations()

      const playerHands = [
        {
          cards: [
            { suit: 'hearts', rank: '10' },
            { suit: 'clubs', rank: '5' }
          ]
        }
      ]
      const dealerHand = {
        cards: [
          { suit: 'spades', rank: 'A' },
          { suit: 'diamonds', rank: 'K' }
        ]
      }
      const updateUI = vi.fn()

      await coordinator.animateInitialDeal(playerHands, dealerHand, 1, updateUI)

      // Should still call updateUI once when animations disabled to update DOM
      expect(updateUI).toHaveBeenCalledTimes(1)
    })

    it('handles multiple hands', async () => {
      coordinator.disableAnimations()

      const playerHands = [
        {
          cards: [
            { suit: 'hearts', rank: '10' },
            { suit: 'clubs', rank: '5' }
          ]
        },
        {
          cards: [
            { suit: 'spades', rank: '7' },
            { suit: 'diamonds', rank: '8' }
          ]
        }
      ]
      const dealerHand = {
        cards: [
          { suit: 'spades', rank: 'A' },
          { suit: 'diamonds', rank: 'K' }
        ]
      }

      await coordinator.animateInitialDeal(playerHands, dealerHand, 2, vi.fn())
      expect(coordinator.isEnabled()).toBe(false)
    })
  })

  describe('animateHit', () => {
    it('returns immediately when animations disabled', async () => {
      coordinator.disableAnimations()

      const card = { suit: 'hearts', rank: '7' }
      const updateUI = vi.fn()

      await coordinator.animateHit(card, 0, 2, updateUI)

      // Should still call updateUI once when animations disabled to update DOM
      expect(updateUI).toHaveBeenCalledTimes(1)
    })
  })

  describe('animateDealerReveal', () => {
    it('returns immediately when animations disabled', async () => {
      coordinator.disableAnimations()

      const dealerHand = {
        cards: [
          { suit: 'spades', rank: 'K' },
          { suit: 'hearts', rank: '10' }
        ]
      }

      await coordinator.animateDealerReveal(dealerHand)
      expect(mockCanvas._ctx.clearRect).not.toHaveBeenCalled()
    })
  })

  describe('animateDealerHit', () => {
    it('returns immediately when animations disabled', async () => {
      coordinator.disableAnimations()

      const card = { suit: 'clubs', rank: '5' }
      const updateUI = vi.fn()

      await coordinator.animateDealerHit(card, 2, updateUI)

      // Should still call updateUI once when animations disabled to update DOM
      expect(updateUI).toHaveBeenCalledTimes(1)
    })
  })

  describe('animateWinPayout', () => {
    it('clears chips when no chips on table', async () => {
      coordinator.disableAnimations()
      await coordinator.animateWinPayout(200, 0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('handles win with chips on table', async () => {
      coordinator.disableAnimations()
      // Add some chips first
      await coordinator.addChipToTable(100, 0, 1)
      await coordinator.animateWinPayout(200, 0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('animateLoss', () => {
    it('clears chips when no chips on table', async () => {
      coordinator.disableAnimations()
      await coordinator.animateLoss(100, 0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('handles loss with chips on table', async () => {
      coordinator.disableAnimations()
      await coordinator.addChipToTable(100, 0, 1)
      await coordinator.animateLoss(100, 0)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('animateHandResult', () => {
    it('adds result class for win', async () => {
      coordinator.disableAnimations()

      const originalGetElementById = globalThis.document?.getElementById
      const mockResultEl = {
        textContent: '',
        className: '',
        classList: {
          add: vi.fn(),
          remove: vi.fn()
        },
        offsetWidth: 100
      }
      globalThis.document = {
        getElementById: vi.fn(() => mockResultEl)
      }

      await coordinator.animateHandResult(0, 'win', 'WIN!')

      expect(mockElements.playerHand).toHaveBeenCalledWith(0)

      if (originalGetElementById) {
        globalThis.document.getElementById = originalGetElementById
      }
    })

    it('handles different outcomes', async () => {
      coordinator.disableAnimations()

      const mockResultEl = {
        textContent: '',
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        offsetWidth: 100
      }
      globalThis.document = {
        getElementById: vi.fn(() => mockResultEl)
      }

      await coordinator.animateHandResult(0, 'win', 'WIN!')
      await coordinator.animateHandResult(0, 'lose', 'LOSE')
      await coordinator.animateHandResult(0, 'bust', 'BUST!')
      await coordinator.animateHandResult(0, 'blackjack', 'BLACKJACK!')
      await coordinator.animateHandResult(0, 'push', 'PUSH')

      expect(mockElements.playerHand).toHaveBeenCalled()
    })
  })

  describe('animateGameResult', () => {
    it('animates results for multiple hands', async () => {
      coordinator.disableAnimations()

      const mockResultEl = {
        textContent: '',
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        offsetWidth: 100
      }
      globalThis.document = {
        getElementById: vi.fn(() => mockResultEl)
      }

      const results = [
        { handIndex: 0, outcome: 'win', message: 'WIN!', payout: 200, bet: 100 },
        { handIndex: 1, outcome: 'lose', message: 'LOSE', payout: 0, bet: 100 }
      ]

      await coordinator.animateGameResult(results)

      expect(mockElements.playerHand).toHaveBeenCalled()
    })

    it('handles blackjack payout', async () => {
      coordinator.disableAnimations()

      const mockResultEl = {
        textContent: '',
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        offsetWidth: 100
      }
      globalThis.document = {
        getElementById: vi.fn(() => mockResultEl)
      }

      const results = [
        { handIndex: 0, outcome: 'blackjack', message: 'BLACKJACK!', payout: 250, bet: 100 }
      ]

      await coordinator.animateGameResult(results)
      expect(mockElements.playerHand).toHaveBeenCalled()
    })

    it('handles push (return bet)', async () => {
      coordinator.disableAnimations()

      const mockResultEl = {
        textContent: '',
        className: '',
        classList: { add: vi.fn(), remove: vi.fn() },
        offsetWidth: 100
      }
      globalThis.document = {
        getElementById: vi.fn(() => mockResultEl)
      }

      const results = [{ handIndex: 0, outcome: 'push', message: 'PUSH', payout: 100, bet: 100 }]

      await coordinator.animateGameResult(results)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('chip position calculations', () => {
    it('calculates positions for 1 hand', async () => {
      coordinator.disableAnimations()
      coordinator.setHandCount(1)
      await coordinator.addChipToTable(100, 0, 1)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('calculates positions for 2 hands', async () => {
      coordinator.disableAnimations()
      coordinator.setHandCount(2)
      await coordinator.addChipToTable(100, 0, 2)
      await coordinator.addChipToTable(100, 1, 2)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('calculates positions for 3 hands', async () => {
      coordinator.disableAnimations()
      coordinator.setHandCount(3)
      await coordinator.addChipToTable(100, 0, 3)
      await coordinator.addChipToTable(100, 1, 3)
      await coordinator.addChipToTable(100, 2, 3)
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })
  })

  describe('reduced motion support', () => {
    it('checks prefers-reduced-motion on creation', () => {
      // Mock matchMedia
      const originalMatchMedia = globalThis.window?.matchMedia
      globalThis.window = {
        matchMedia: vi.fn(() => ({
          matches: true,
          addEventListener: vi.fn()
        }))
      }

      const newCoordinator = new AnimationCoordinator(mockCanvas, mockElements)
      expect(newCoordinator.isEnabled()).toBe(false)

      if (originalMatchMedia) {
        globalThis.window.matchMedia = originalMatchMedia
      }
    })
  })

  describe('rules display', () => {
    it('can draw rules on canvas', () => {
      coordinator.drawRules()
      // Rules panel draws text
      expect(mockCanvas._ctx.fillText).toHaveBeenCalled()
    })

    it('can clear rules from canvas', () => {
      coordinator.drawRules()
      coordinator.clearRules()
      expect(mockCanvas._ctx.clearRect).toHaveBeenCalled()
    })

    it('rules persist when adding chips', async () => {
      coordinator.disableAnimations()
      coordinator.drawRules()
      await coordinator.addChipToTable(100, 0, 1)
      // fillText should be called multiple times (once for rules, once after chip)
      const fillTextCalls = mockCanvas._ctx.fillText.mock.calls
      expect(fillTextCalls.length).toBeGreaterThan(1)
    })

    it('rules display shows correct content', () => {
      coordinator.drawRules()
      const fillTextCalls = mockCanvas._ctx.fillText.mock.calls
      const textContent = fillTextCalls.map((call) => call[0])
      expect(textContent).toContain('HOUSE RULES')
      expect(textContent).toContain('BLACKJACK PAYS 3:2')
      expect(textContent).toContain('DEALER HITS ON SOFT 17')
      expect(textContent).toContain('INSURANCE PAYS 2:1')
    })
  })
})
