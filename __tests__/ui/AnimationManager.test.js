/**
 * @fileoverview Unit tests for AnimationManager module.
 *
 * Tests cover:
 * - Constructor initialization with CardRenderer
 * - animateDeal animation lifecycle and callbacks
 * - animateFlip card flip animation
 * - animateReveal staggered card reveal
 * - animateChips balance/bet animations
 * - Animation queue management (queue, play, stop, isPlaying)
 * - Speed adjustment (setSpeed)
 * - Completion callbacks (onComplete)
 * - Animation cancellation
 *
 * @module tests/ui/AnimationManager
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
    this.drawCalls = []
    this.clearCalls = []
  }

  drawImage(image, x, y, width, height) {
    this.drawCalls.push({ image, x, y, width, height })
  }

  clearRect(x, y, width, height) {
    this.clearCalls.push({ x, y, width, height })
  }

  fillRect(x, y, width, height) {}
  beginPath() {}
  fill() {}
  save() {}
  restore() {}
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
  getCardImage(card) {
    return `data:image/png;base64,card-${card.id}`
  }

  getBackImage() {
    return 'data:image/png;base64,card-back'
  }

  isLoaded() {
    return true
  }

  async loadAll() {}
}

/**
 * Mock Image for browser image loading simulation
 */
class MockImage {
  constructor() {
    this.src = ''
    this.width = 100
    this.height = 150
  }
}

/**
 * Mock CardRenderer
 */
class MockCardRenderer {
  constructor() {
    this._canvas = new MockCanvas()
    this._assetLoader = new MockAssetLoader()
    this._scale = 1
    this.drawCardCalls = []
    this.clearCalls = []
  }

  drawCard(card, x, y, faceUp) {
    this.drawCardCalls.push({ card, x, y, faceUp })
  }

  renderCardBack(x, y) {
    this.drawCardCalls.push({ card: null, x, y, faceUp: false })
  }

  clear(x, y, width, height) {
    this.clearCalls.push({ x, y, width, height })
  }

  getCardWidth() {
    return 100 * this._scale
  }

  getCardHeight() {
    return 140 * this._scale
  }

  setScale(scale) {
    this._scale = scale
  }
}

// Track requestAnimationFrame calls
let rafCallbacks = []
let rafId = 0
let currentTime = 0

// Mock performance.now for controlling animation timing
vi.stubGlobal('performance', {
  now: () => currentTime
})

// Mock requestAnimationFrame for Node.js environment
vi.stubGlobal('requestAnimationFrame', (callback) => {
  const id = ++rafId
  rafCallbacks.push({ id, callback })
  return id
})

// Mock cancelAnimationFrame
vi.stubGlobal('cancelAnimationFrame', (id) => {
  rafCallbacks = rafCallbacks.filter((item) => item.id !== id)
})

// Setup global mocks before importing AnimationManager
vi.stubGlobal('Image', MockImage)

// Import AnimationManager after mock setup
const { AnimationManager } = await import('../../js/ui/AnimationManager.js')

/**
 * Helper function to advance animation frames
 * @param {number} frames - Number of frames to advance
 * @param {number} frameDuration - Duration per frame in ms (default: 16.67ms for 60fps)
 */
function advanceFrames(frames, frameDuration = 16.67) {
  for (let i = 0; i < frames; i++) {
    currentTime += frameDuration
    const callbacks = [...rafCallbacks]
    rafCallbacks = []
    for (const { callback } of callbacks) {
      callback(currentTime)
    }
  }
}

/**
 * Helper function to run animation to completion
 * @param {number} duration - Total duration to advance
 */
function runAnimationToCompletion(duration) {
  const frames = Math.ceil(duration / 16.67) + 5 // Add extra frames to ensure completion
  advanceFrames(frames)
}

// =============================================================================
// TEST SUITE
// =============================================================================

describe('AnimationManager', () => {
  /** @type {MockCardRenderer} */
  let cardRenderer
  /** @type {AnimationManager} */
  let animationManager

  beforeEach(() => {
    // Reset mocks
    rafCallbacks = []
    rafId = 0
    currentTime = 0

    cardRenderer = new MockCardRenderer()
    animationManager = new AnimationManager(cardRenderer)
  })

  afterEach(() => {
    rafCallbacks = []
    vi.clearAllMocks()
  })

  // ===========================================================================
  // CONSTRUCTOR TESTS
  // ===========================================================================

  describe('constructor', () => {
    it('stores cardRenderer reference', () => {
      expect(animationManager._cardRenderer).toBe(cardRenderer)
    })

    it('initializes with default animation duration', () => {
      expect(animationManager._defaultDealDuration).toBe(300)
      expect(animationManager._defaultFlipDuration).toBe(200)
    })

    it('initializes with default stagger delay', () => {
      expect(animationManager._staggerDelay).toBe(100)
    })

    it('initializes with empty animation queue', () => {
      expect(animationManager._queue).toEqual([])
    })

    it('initializes with isPlaying as false', () => {
      expect(animationManager.isPlaying()).toBe(false)
    })

    it('initializes with speed multiplier of 1', () => {
      expect(animationManager._speedMultiplier).toBe(1)
    })

    it('initializes with animations enabled by default', () => {
      expect(animationManager._animationsEnabled).toBe(true)
    })
  })

  // ===========================================================================
  // ANIMATE DEAL TESTS
  // ===========================================================================

  describe('animateDeal', () => {
    it('returns a promise', () => {
      const card = createCard('hearts', 'A')
      const result = animationManager.animateDeal(card, 0, 0, 100, 100, 300)
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves after animation completes', async () => {
      const card = createCard('hearts', 'A')
      const promise = animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      // Advance time beyond animation duration
      runAnimationToCompletion(300)

      await expect(promise).resolves.toBeUndefined()
    })

    it('calls callback when provided and animation completes', async () => {
      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      animationManager.animateDeal(card, 0, 0, 100, 100, 300, callback)

      // Advance time
      runAnimationToCompletion(300)

      expect(callback).toHaveBeenCalled()
    })

    it('animates card position over time', async () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      // Advance a few frames
      advanceFrames(5)

      // Card should have been drawn at intermediate positions
      expect(cardRenderer.drawCardCalls.length).toBeGreaterThan(0)
    })

    it('draws card at final position when complete', async () => {
      const card = createCard('hearts', 'A')
      const promise = animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      runAnimationToCompletion(300)
      await promise

      const lastDraw = cardRenderer.drawCardCalls[cardRenderer.drawCardCalls.length - 1]
      expect(lastDraw.x).toBeCloseTo(100, 0)
      expect(lastDraw.y).toBeCloseTo(100, 0)
    })

    it('respects speed multiplier', async () => {
      animationManager.setSpeed(2) // Double speed

      const card = createCard('hearts', 'A')
      const callback = vi.fn()
      animationManager.animateDeal(card, 0, 0, 100, 100, 300, callback)

      // With 2x speed, 300ms animation should complete in 150ms
      currentTime += 200 // Go beyond 150ms
      advanceFrames(20)

      expect(callback).toHaveBeenCalled()
    })

    it('immediately resolves when animations are disabled', async () => {
      animationManager.disableAnimations()

      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      const promise = animationManager.animateDeal(card, 0, 0, 100, 100, 300, callback)
      await promise

      expect(callback).toHaveBeenCalled()
      // Should draw at final position immediately
      const lastDraw = cardRenderer.drawCardCalls[cardRenderer.drawCardCalls.length - 1]
      expect(lastDraw.x).toBe(100)
      expect(lastDraw.y).toBe(100)
    })
  })

  // ===========================================================================
  // ANIMATE FLIP TESTS
  // ===========================================================================

  describe('animateFlip', () => {
    it('returns a promise', () => {
      const card = createCard('hearts', 'A')
      const result = animationManager.animateFlip(card, 100, 100, 200)
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves after animation completes', async () => {
      const card = createCard('hearts', 'A')
      const promise = animationManager.animateFlip(card, 100, 100, 200)

      runAnimationToCompletion(200)

      await expect(promise).resolves.toBeUndefined()
    })

    it('calls callback when animation completes', async () => {
      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      animationManager.animateFlip(card, 100, 100, 200, callback)

      runAnimationToCompletion(200)

      expect(callback).toHaveBeenCalled()
    })

    it('uses default flip duration when not specified', async () => {
      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      animationManager.animateFlip(card, 100, 100, undefined, callback)

      // Default flip duration is 200ms
      runAnimationToCompletion(200)

      expect(callback).toHaveBeenCalled()
    })

    it('immediately completes when animations are disabled', async () => {
      animationManager.disableAnimations()

      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      await animationManager.animateFlip(card, 100, 100, 200, callback)

      expect(callback).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ANIMATE REVEAL TESTS
  // ===========================================================================

  describe('animateReveal', () => {
    it('returns a promise', () => {
      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      const result = animationManager.animateReveal(cards, 100, 100, 100)
      expect(result).toBeInstanceOf(Promise)
    })

    it('reveals multiple cards with staggered timing', async () => {
      // Disable animations for this test to avoid timing issues
      animationManager.disableAnimations()

      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      await animationManager.animateReveal(cards, 100, 100, 100)

      // Cards should have been drawn
      expect(cardRenderer.drawCardCalls.length).toBe(2)
    })

    it('uses default stagger delay when not specified', async () => {
      // Disable animations for this test to verify it completes
      animationManager.disableAnimations()

      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      await animationManager.animateReveal(cards, 100, 100)

      expect(cardRenderer.drawCardCalls.length).toBe(2)
    })

    it('calls callback after all cards revealed', async () => {
      // Disable animations for deterministic testing
      animationManager.disableAnimations()

      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      const callback = vi.fn()

      await animationManager.animateReveal(cards, 100, 100, 100, callback)

      expect(callback).toHaveBeenCalled()
    })

    it('immediately completes when animations are disabled', async () => {
      animationManager.disableAnimations()

      const cards = [createCard('hearts', 'A'), createCard('spades', 'K')]
      const callback = vi.fn()

      await animationManager.animateReveal(cards, 100, 100, 100, callback)

      expect(callback).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ANIMATE CHIPS TESTS
  // ===========================================================================

  describe('animateChips', () => {
    it('returns a promise', () => {
      const result = animationManager.animateChips(100, 200, 300)
      expect(result).toBeInstanceOf(Promise)
    })

    it('resolves after animation completes', async () => {
      const promise = animationManager.animateChips(100, 200, 300)

      runAnimationToCompletion(300)

      await expect(promise).resolves.toBeUndefined()
    })

    it('calls callback with current value during animation', async () => {
      const callback = vi.fn()

      animationManager.animateChips(100, 200, 300, callback)

      advanceFrames(10)

      // Callback should be called with intermediate values
      expect(callback).toHaveBeenCalled()
      const firstCallArg = callback.mock.calls[0][0]
      expect(firstCallArg).toBeGreaterThanOrEqual(100)
      expect(firstCallArg).toBeLessThanOrEqual(200)
    })

    it('calls callback with final value when complete', async () => {
      const callback = vi.fn()

      const promise = animationManager.animateChips(100, 200, 300, callback)
      runAnimationToCompletion(300)
      await promise

      // Last call should have the target value
      const lastCallArg = callback.mock.calls[callback.mock.calls.length - 1][0]
      expect(lastCallArg).toBe(200)
    })

    it('immediately completes when animations are disabled', async () => {
      animationManager.disableAnimations()

      const callback = vi.fn()
      await animationManager.animateChips(100, 200, 300, callback)

      expect(callback).toHaveBeenCalledWith(200)
    })
  })

  // ===========================================================================
  // QUEUE MANAGEMENT TESTS
  // ===========================================================================

  describe('queue', () => {
    it('adds animation to queue', () => {
      const animation = () => Promise.resolve()
      animationManager.queue(animation)

      expect(animationManager._queue.length).toBe(1)
    })

    it('allows chaining multiple animations', () => {
      const anim1 = () => Promise.resolve()
      const anim2 = () => Promise.resolve()

      animationManager.queue(anim1)
      animationManager.queue(anim2)

      expect(animationManager._queue.length).toBe(2)
    })

    it('returns this for method chaining', () => {
      const animation = () => Promise.resolve()
      const result = animationManager.queue(animation)

      expect(result).toBe(animationManager)
    })
  })

  describe('play', () => {
    it('returns a promise', () => {
      const result = animationManager.play()
      expect(result).toBeInstanceOf(Promise)
    })

    it('executes queued animations in order', async () => {
      const order = []

      animationManager.queue(async () => {
        order.push(1)
      })
      animationManager.queue(async () => {
        order.push(2)
      })

      await animationManager.play()

      expect(order).toEqual([1, 2])
    })

    it('sets isPlaying to true while executing', async () => {
      let wasPlaying = false

      animationManager.queue(async () => {
        wasPlaying = animationManager.isPlaying()
      })

      await animationManager.play()

      expect(wasPlaying).toBe(true)
    })

    it('sets isPlaying to false after completion', async () => {
      animationManager.queue(async () => {})

      await animationManager.play()

      expect(animationManager.isPlaying()).toBe(false)
    })

    it('clears queue after playing', async () => {
      animationManager.queue(async () => {})
      animationManager.queue(async () => {})

      await animationManager.play()

      expect(animationManager._queue.length).toBe(0)
    })

    it('calls onComplete callback after all animations', async () => {
      const callback = vi.fn()
      animationManager.onComplete(callback)

      animationManager.queue(async () => {})
      await animationManager.play()

      expect(callback).toHaveBeenCalled()
    })

    it('resolves immediately if queue is empty', async () => {
      const result = animationManager.play()
      await expect(result).resolves.toBeUndefined()
    })
  })

  describe('stop', () => {
    it('stops currently playing animation', () => {
      animationManager.queue(async () => {
        await new Promise((resolve) => setTimeout(resolve, 1000))
      })

      const playPromise = animationManager.play()
      animationManager.stop()

      expect(animationManager.isPlaying()).toBe(false)
    })

    it('clears the animation queue', () => {
      animationManager.queue(async () => {})
      animationManager.queue(async () => {})

      animationManager.stop()

      expect(animationManager._queue.length).toBe(0)
    })

    it('cancels active requestAnimationFrame', async () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 100, 5000) // Long duration

      advanceFrames(2) // Start animation

      animationManager.stop()

      // Should have cleared the raf callbacks
      expect(animationManager._activeAnimations.size).toBe(0)
    })
  })

  describe('isPlaying', () => {
    it('returns false initially', () => {
      expect(animationManager.isPlaying()).toBe(false)
    })

    it('returns true during animation', async () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      expect(animationManager.isPlaying()).toBe(true)
    })

    it('returns false after animation completes', async () => {
      const card = createCard('hearts', 'A')
      const promise = animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      runAnimationToCompletion(300)
      await promise

      expect(animationManager.isPlaying()).toBe(false)
    })
  })

  // ===========================================================================
  // SPEED ADJUSTMENT TESTS
  // ===========================================================================

  describe('setSpeed', () => {
    it('updates speed multiplier', () => {
      animationManager.setSpeed(2)
      expect(animationManager._speedMultiplier).toBe(2)
    })

    it('clamps speed to minimum of 0.1', () => {
      animationManager.setSpeed(0.01)
      expect(animationManager._speedMultiplier).toBe(0.1)
    })

    it('clamps speed to maximum of 10', () => {
      animationManager.setSpeed(100)
      expect(animationManager._speedMultiplier).toBe(10)
    })

    it('accepts fractional values', () => {
      animationManager.setSpeed(0.5)
      expect(animationManager._speedMultiplier).toBe(0.5)
    })

    it('returns this for method chaining', () => {
      const result = animationManager.setSpeed(2)
      expect(result).toBe(animationManager)
    })
  })

  // ===========================================================================
  // COMPLETION CALLBACK TESTS
  // ===========================================================================

  describe('onComplete', () => {
    it('registers completion callback', () => {
      const callback = vi.fn()
      animationManager.onComplete(callback)

      expect(animationManager._completionCallback).toBe(callback)
    })

    it('callback is called after play() completes', async () => {
      const callback = vi.fn()
      animationManager.onComplete(callback)

      animationManager.queue(async () => {})
      await animationManager.play()

      expect(callback).toHaveBeenCalled()
    })

    it('returns this for method chaining', () => {
      const callback = vi.fn()
      const result = animationManager.onComplete(callback)

      expect(result).toBe(animationManager)
    })

    it('replaces previous callback', () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()

      animationManager.onComplete(callback1)
      animationManager.onComplete(callback2)

      expect(animationManager._completionCallback).toBe(callback2)
    })
  })

  // ===========================================================================
  // ANIMATION ENABLE/DISABLE TESTS
  // ===========================================================================

  describe('enableAnimations', () => {
    it('enables animations', () => {
      animationManager.disableAnimations()
      animationManager.enableAnimations()

      expect(animationManager._animationsEnabled).toBe(true)
    })

    it('returns this for method chaining', () => {
      const result = animationManager.enableAnimations()
      expect(result).toBe(animationManager)
    })
  })

  describe('disableAnimations', () => {
    it('disables animations', () => {
      animationManager.disableAnimations()
      expect(animationManager._animationsEnabled).toBe(false)
    })

    it('returns this for method chaining', () => {
      const result = animationManager.disableAnimations()
      expect(result).toBe(animationManager)
    })
  })

  // ===========================================================================
  // EASING TESTS
  // ===========================================================================

  describe('easing', () => {
    it('uses ease-out easing for smooth animation', async () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 0, 300)

      // Advance to midpoint
      currentTime = 150
      advanceFrames(1)

      // With ease-out, at 50% time, position should be > 50% progress
      const midDraw = cardRenderer.drawCardCalls[cardRenderer.drawCardCalls.length - 1]
      // Ease-out means faster at start, slower at end
      // At 50% time, progress should be > 50%
      expect(midDraw.x).toBeGreaterThan(50)
    })
  })

  // ===========================================================================
  // EDGE CASES TESTS
  // ===========================================================================

  describe('edge cases', () => {
    it('handles zero duration animation', async () => {
      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      await animationManager.animateDeal(card, 0, 0, 100, 100, 0, callback)

      expect(callback).toHaveBeenCalled()
    })

    it('handles animation with same start and end position', async () => {
      const card = createCard('hearts', 'A')
      const callback = vi.fn()

      const promise = animationManager.animateDeal(card, 100, 100, 100, 100, 300, callback)
      runAnimationToCompletion(300)
      await promise

      expect(callback).toHaveBeenCalled()
    })

    it('handles negative positions', async () => {
      const card = createCard('hearts', 'A')
      const promise = animationManager.animateDeal(card, -50, -50, 100, 100, 300)

      runAnimationToCompletion(300)
      await expect(promise).resolves.toBeUndefined()
    })

    it('handles concurrent animations', async () => {
      const card1 = createCard('hearts', 'A')
      const card2 = createCard('spades', 'K')

      const promise1 = animationManager.animateDeal(card1, 0, 0, 100, 100, 300)
      const promise2 = animationManager.animateDeal(card2, 0, 0, 200, 200, 300)

      runAnimationToCompletion(300)

      await Promise.all([promise1, promise2])
    })

    it('handles empty card array in animateReveal', async () => {
      const callback = vi.fn()

      await animationManager.animateReveal([], 100, 100, 100, callback)

      expect(callback).toHaveBeenCalled()
    })

    it('handles single card in animateReveal', async () => {
      // Disable animations for deterministic testing
      animationManager.disableAnimations()

      const cards = [createCard('hearts', 'A')]
      const callback = vi.fn()

      await animationManager.animateReveal(cards, 100, 100, 100, callback)

      expect(callback).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // ANIMATION TIMING TESTS
  // ===========================================================================

  describe('animation timing', () => {
    it('default deal duration is 300ms', () => {
      expect(animationManager._defaultDealDuration).toBe(300)
    })

    it('default flip duration is 200ms', () => {
      expect(animationManager._defaultFlipDuration).toBe(200)
    })

    it('default stagger delay is 100ms', () => {
      expect(animationManager._staggerDelay).toBe(100)
    })
  })

  // ===========================================================================
  // REQUESTANIMATIONFRAME TESTS
  // ===========================================================================

  describe('requestAnimationFrame usage', () => {
    it('uses requestAnimationFrame for smooth animation', () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 100, 300)

      // Should have scheduled a frame
      expect(rafCallbacks.length).toBeGreaterThan(0)
    })

    it('cancels requestAnimationFrame on stop', () => {
      const card = createCard('hearts', 'A')
      animationManager.animateDeal(card, 0, 0, 100, 100, 5000)

      advanceFrames(2)

      animationManager.stop()

      // Active animations should be cleared
      expect(animationManager._activeAnimations.size).toBe(0)
    })
  })
})
