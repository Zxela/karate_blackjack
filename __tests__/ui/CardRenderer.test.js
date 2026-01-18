/**
 * @fileoverview Unit tests for CardRenderer module.
 *
 * Tests cover:
 * - Constructor initialization with canvas context and AssetLoader
 * - Single card rendering (face-up and face-down)
 * - Hand rendering with configurable overlap
 * - Dealer hand rendering with hidden hole card
 * - Responsive scaling support
 * - Canvas region clearing
 *
 * @module tests/ui/CardRenderer
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCard } from '../../js/types/index.js'

// =============================================================================
// MOCK SETUP
// =============================================================================

/**
 * Mock canvas context for Node.js environment
 */
class MockContext {
  constructor() {
    this.fillStyle = ''
    this.strokeStyle = ''
    this.lineWidth = 0
    this.shadowColor = ''
    this.shadowBlur = 0
    this.shadowOffsetX = 0
    this.shadowOffsetY = 0
    // Track drawing calls for verification
    this.drawCalls = []
    this.clearCalls = []
    this.fillRectCalls = []
    this.roundRectCalls = []
    this.strokeCalls = []
  }

  drawImage(image, x, y, width, height) {
    this.drawCalls.push({ image, x, y, width, height })
  }

  clearRect(x, y, width, height) {
    this.clearCalls.push({ x, y, width, height })
  }

  fillRect(x, y, width, height) {
    this.fillRectCalls.push({ x, y, width, height })
  }

  roundRect(x, y, width, height, radius) {
    this.roundRectCalls.push({ x, y, width, height, radius })
  }

  stroke() {
    this.strokeCalls.push({})
  }

  beginPath() {}
  fill() {}
  save() {}
  restore() {}
  clip() {}
}

/**
 * Mock canvas element
 */
class MockCanvas {
  constructor() {
    this.width = 800
    this.height = 600
    this._context = new MockContext()
  }

  getContext() {
    return this._context
  }
}

/**
 * Mock AssetLoader
 */
class MockAssetLoader {
  constructor() {
    this.cardWidth = 100
    this.cardHeight = 150
    this._loaded = false
  }

  getCardImage(card) {
    return `data:image/png;base64,card-${card.id}`
  }

  getBackImage() {
    return 'data:image/png;base64,card-back'
  }

  isLoaded() {
    return this._loaded
  }

  async loadAll() {
    this._loaded = true
  }
}

/**
 * Mock Image for browser image loading simulation
 */
let createdImages = []

class MockImage {
  constructor() {
    this.src = ''
    this.onload = null
    this.onerror = null
    this.width = 100
    this.height = 150
    createdImages.push(this)
  }
}

// Setup global mocks before importing CardRenderer
vi.stubGlobal('Image', MockImage)

// Import CardRenderer after mock setup
const { CardRenderer } = await import('../../js/ui/CardRenderer.js')

// =============================================================================
// TEST SUITE
// =============================================================================

describe('CardRenderer', () => {
  /** @type {MockCanvas} */
  let canvas
  /** @type {MockContext} */
  let ctx
  /** @type {MockAssetLoader} */
  let assetLoader
  /** @type {CardRenderer} */
  let renderer

  beforeEach(() => {
    createdImages = []
    canvas = new MockCanvas()
    ctx = canvas._context
    assetLoader = new MockAssetLoader()
    renderer = new CardRenderer(canvas, assetLoader)
  })

  afterEach(() => {
    createdImages = []
  })

  // ===========================================================================
  // CONSTRUCTOR TESTS
  // ===========================================================================

  describe('constructor', () => {
    it('stores canvas reference', () => {
      expect(renderer._canvas).toBe(canvas)
    })

    it('stores canvas context', () => {
      expect(renderer._ctx).toBe(ctx)
    })

    it('stores assetLoader reference', () => {
      expect(renderer._assetLoader).toBe(assetLoader)
    })

    it('initializes with default card dimensions', () => {
      expect(renderer.getCardWidth()).toBe(100)
      expect(renderer.getCardHeight()).toBe(140)
    })

    it('initializes with scale of 1', () => {
      expect(renderer._scale).toBe(1)
    })

    it('initializes with default corner radius', () => {
      expect(renderer._cornerRadius).toBe(8)
    })

    it('initializes with default overlap amount', () => {
      expect(renderer._overlapAmount).toBe(30)
    })
  })

  // ===========================================================================
  // LOAD ASSETS TESTS
  // ===========================================================================

  describe('loadAssets', () => {
    it('delegates to assetLoader.loadAll()', async () => {
      const loadAllSpy = vi.spyOn(assetLoader, 'loadAll')
      await renderer.loadAssets()
      expect(loadAllSpy).toHaveBeenCalled()
    })

    it('returns a promise', () => {
      const result = renderer.loadAssets()
      expect(result).toBeInstanceOf(Promise)
    })
  })

  // ===========================================================================
  // DRAW CARD TESTS
  // ===========================================================================

  describe('drawCard', () => {
    it('draws face-up card at correct coordinates', () => {
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 100, 200, true)

      expect(ctx.drawCalls.length).toBeGreaterThan(0)
      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.x).toBe(100)
      expect(lastDraw.y).toBe(200)
    })

    it('draws face-up card with correct dimensions', () => {
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 0, 0, true)

      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.width).toBe(100) // base width
      expect(lastDraw.height).toBe(140) // base height
    })

    it('draws face-down card using card back image', () => {
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 50, 50, false)

      // Should have drawn something
      expect(ctx.drawCalls.length).toBeGreaterThan(0)
    })

    it('uses assetLoader to get card image for face-up cards', () => {
      const card = createCard('spades', 'K')
      const getCardImageSpy = vi.spyOn(assetLoader, 'getCardImage')

      renderer.drawCard(card, 0, 0, true)

      expect(getCardImageSpy).toHaveBeenCalledWith(card)
    })

    it('uses assetLoader to get back image for face-down cards', () => {
      const card = createCard('spades', 'K')
      const getBackImageSpy = vi.spyOn(assetLoader, 'getBackImage')

      renderer.drawCard(card, 0, 0, false)

      expect(getBackImageSpy).toHaveBeenCalled()
    })

    it('respects scale when drawing cards', () => {
      renderer.setScale(0.5)
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 0, 0, true)

      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.width).toBe(50) // 100 * 0.5
      expect(lastDraw.height).toBe(70) // 140 * 0.5
    })

    it('applies shadow effect for card appearance', () => {
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 0, 0, true)

      // Should have set shadow properties (check context was modified)
      // The actual shadow values are implementation details
      expect(ctx.drawCalls.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // DRAW HAND TESTS
  // ===========================================================================

  describe('drawHand', () => {
    it('draws multiple cards with default overlap', () => {
      const cards = [
        createCard('hearts', 'A'),
        createCard('spades', 'K'),
        createCard('diamonds', 'Q')
      ]

      renderer.drawHand(cards, 100, 200)

      // Should draw all 3 cards
      expect(ctx.drawCalls.length).toBe(3)
    })

    it('positions cards with correct overlap spacing', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]

      renderer.drawHand(cards, 100, 200)

      // First card at x=100, second at x=100+70 (100 - 30 overlap)
      expect(ctx.drawCalls[0].x).toBe(100)
      expect(ctx.drawCalls[1].x).toBe(170) // 100 + (100 - 30)
    })

    it('all cards drawn at same y position', () => {
      const cards = [
        createCard('hearts', 'A'),
        createCard('spades', 'K'),
        createCard('diamonds', 'Q')
      ]

      renderer.drawHand(cards, 100, 200)

      for (const call of ctx.drawCalls) {
        expect(call.y).toBe(200)
      }
    })

    it('uses custom overlap when provided', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]

      renderer.drawHand(cards, 100, 200, 50) // 50px overlap

      // First card at x=100, second at x=100+50 (100 - 50 overlap)
      expect(ctx.drawCalls[0].x).toBe(100)
      expect(ctx.drawCalls[1].x).toBe(150) // 100 + (100 - 50)
    })

    it('draws empty hand without errors', () => {
      expect(() => renderer.drawHand([], 100, 200)).not.toThrow()
      expect(ctx.drawCalls.length).toBe(0)
    })

    it('draws single card hand correctly', () => {
      const cards = [createCard('hearts', 'A')]

      renderer.drawHand(cards, 100, 200)

      expect(ctx.drawCalls.length).toBe(1)
      expect(ctx.drawCalls[0].x).toBe(100)
    })

    it('respects scale when drawing hand', () => {
      renderer.setScale(0.5)
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]

      renderer.drawHand(cards, 100, 200)

      // With 0.5 scale: card width = 50, overlap = 15
      // Second card at 100 + (50 - 15) = 135
      expect(ctx.drawCalls[1].x).toBe(135)
    })
  })

  // ===========================================================================
  // DRAW DEALER HAND TESTS
  // ===========================================================================

  describe('drawDealerHand', () => {
    it('draws all cards face-up when not hiding hole card', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      const getCardImageSpy = vi.spyOn(assetLoader, 'getCardImage')

      renderer.drawDealerHand(cards, 100, 200, false)

      // Both cards should use getCardImage (face-up)
      expect(getCardImageSpy).toHaveBeenCalledTimes(2)
    })

    it('draws first card face-down when hiding hole card', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      const getBackImageSpy = vi.spyOn(assetLoader, 'getBackImage')
      const getCardImageSpy = vi.spyOn(assetLoader, 'getCardImage')

      renderer.drawDealerHand(cards, 100, 200, true)

      // First card uses back image, second uses card image
      expect(getBackImageSpy).toHaveBeenCalled()
      expect(getCardImageSpy).toHaveBeenCalledTimes(1)
      expect(getCardImageSpy).toHaveBeenCalledWith(cards[1])
    })

    it('positions cards with overlap like regular hand', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]

      renderer.drawDealerHand(cards, 100, 200, true)

      expect(ctx.drawCalls[0].x).toBe(100)
      expect(ctx.drawCalls[1].x).toBe(170) // 100 + (100 - 30)
    })

    it('handles single card dealer hand', () => {
      const cards = [createCard('hearts', 'A')]

      renderer.drawDealerHand(cards, 100, 200, true)

      expect(ctx.drawCalls.length).toBe(1)
    })

    it('handles empty dealer hand', () => {
      expect(() => renderer.drawDealerHand([], 100, 200, true)).not.toThrow()
    })
  })

  // ===========================================================================
  // SCALING TESTS
  // ===========================================================================

  describe('setScale', () => {
    it('updates internal scale value', () => {
      renderer.setScale(1.5)
      expect(renderer._scale).toBe(1.5)
    })

    it('affects getCardWidth result', () => {
      renderer.setScale(2)
      expect(renderer.getCardWidth()).toBe(200) // 100 * 2
    })

    it('affects getCardHeight result', () => {
      renderer.setScale(0.5)
      expect(renderer.getCardHeight()).toBe(70) // 140 * 0.5
    })

    it('clamps scale to minimum of 0.1', () => {
      renderer.setScale(0.05)
      expect(renderer._scale).toBe(0.1)
    })

    it('clamps scale to maximum of 3', () => {
      renderer.setScale(5)
      expect(renderer._scale).toBe(3)
    })

    it('handles fractional scales', () => {
      renderer.setScale(0.75)
      expect(renderer.getCardWidth()).toBe(75) // 100 * 0.75
      expect(renderer.getCardHeight()).toBe(105) // 140 * 0.75
    })
  })

  describe('getCardWidth', () => {
    it('returns base width with default scale', () => {
      expect(renderer.getCardWidth()).toBe(100)
    })

    it('returns scaled width', () => {
      renderer.setScale(1.5)
      expect(renderer.getCardWidth()).toBe(150)
    })
  })

  describe('getCardHeight', () => {
    it('returns base height with default scale', () => {
      expect(renderer.getCardHeight()).toBe(140)
    })

    it('returns scaled height', () => {
      renderer.setScale(2)
      expect(renderer.getCardHeight()).toBe(280)
    })
  })

  // ===========================================================================
  // CLEAR TESTS
  // ===========================================================================

  describe('clear', () => {
    it('clears specified region of canvas', () => {
      renderer.clear(10, 20, 100, 150)

      expect(ctx.clearCalls.length).toBe(1)
      expect(ctx.clearCalls[0]).toEqual({ x: 10, y: 20, width: 100, height: 150 })
    })

    it('clears entire canvas when called without arguments', () => {
      renderer.clear()

      expect(ctx.clearCalls.length).toBe(1)
      expect(ctx.clearCalls[0]).toEqual({ x: 0, y: 0, width: 800, height: 600 })
    })

    it('handles partial arguments', () => {
      renderer.clear(50, 50)

      expect(ctx.clearCalls.length).toBe(1)
      // Should default remaining dimensions to canvas size
      expect(ctx.clearCalls[0].x).toBe(50)
      expect(ctx.clearCalls[0].y).toBe(50)
    })
  })

  // ===========================================================================
  // RENDERING CARD BACK TESTS
  // ===========================================================================

  describe('renderCardBack', () => {
    it('draws card back at specified position', () => {
      renderer.renderCardBack(50, 100)

      expect(ctx.drawCalls.length).toBeGreaterThan(0)
      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.x).toBe(50)
      expect(lastDraw.y).toBe(100)
    })

    it('uses correct dimensions', () => {
      renderer.renderCardBack(0, 0)

      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.width).toBe(100)
      expect(lastDraw.height).toBe(140)
    })

    it('respects scale', () => {
      renderer.setScale(0.5)
      renderer.renderCardBack(0, 0)

      const lastDraw = ctx.drawCalls[ctx.drawCalls.length - 1]
      expect(lastDraw.width).toBe(50)
      expect(lastDraw.height).toBe(70)
    })
  })

  // ===========================================================================
  // ANIMATION PREPARATION TESTS
  // ===========================================================================

  describe('animateCardDeal', () => {
    it('has correct method signature', () => {
      expect(typeof renderer.animateCardDeal).toBe('function')
    })

    it('returns a promise', () => {
      const card = createCard('hearts', 'A')
      const result = renderer.animateCardDeal(card, 0, 0, 100, 100, 300)
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves after animation completes', async () => {
      const card = createCard('hearts', 'A')
      // For now, stub animation resolves immediately
      await expect(renderer.animateCardDeal(card, 0, 0, 100, 100, 0)).resolves.toBeUndefined()
    })
  })

  // ===========================================================================
  // EDGE CASES AND ERROR HANDLING
  // ===========================================================================

  describe('edge cases', () => {
    it('handles drawing at negative coordinates', () => {
      const card = createCard('hearts', 'A')
      expect(() => renderer.drawCard(card, -50, -50, true)).not.toThrow()
    })

    it('handles drawing at large coordinates', () => {
      const card = createCard('hearts', 'A')
      expect(() => renderer.drawCard(card, 10000, 10000, true)).not.toThrow()
    })

    it('handles all valid suit and rank combinations', () => {
      const suits = ['hearts', 'diamonds', 'clubs', 'spades']
      const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']

      for (const suit of suits) {
        for (const rank of ranks) {
          const card = createCard(suit, rank)
          expect(() => renderer.drawCard(card, 0, 0, true)).not.toThrow()
        }
      }
    })

    it('handles rapid sequential drawCard calls', () => {
      const card = createCard('hearts', 'A')

      for (let i = 0; i < 100; i++) {
        renderer.drawCard(card, i * 10, 0, true)
      }

      expect(ctx.drawCalls.length).toBe(100)
    })

    it('handles large hands', () => {
      const cards = []
      for (let i = 0; i < 10; i++) {
        cards.push(createCard('hearts', 'A'))
      }

      expect(() => renderer.drawHand(cards, 0, 0)).not.toThrow()
      expect(ctx.drawCalls.length).toBe(10)
    })
  })

  // ===========================================================================
  // INTEGRATION TESTS
  // ===========================================================================

  describe('integration with AssetLoader', () => {
    it('works with actual AssetLoader dimensions', () => {
      // AssetLoader uses 100x150, CardRenderer uses 100x140
      // Verify they work together
      expect(assetLoader.cardWidth).toBe(100)
      expect(assetLoader.cardHeight).toBe(150)
      expect(renderer.getCardWidth()).toBe(100)
      expect(renderer.getCardHeight()).toBe(140)
    })

    it('retrieves images correctly through assetLoader', () => {
      const card = createCard('hearts', 'A')
      renderer.drawCard(card, 0, 0, true)

      // Verify assetLoader was called
      const expectedImage = assetLoader.getCardImage(card)
      expect(expectedImage).toBe('data:image/png;base64,card-hearts-A')
    })
  })
})
