/**
 * @fileoverview Animation manager for Karate Blackjack game.
 *
 * This module provides the AnimationManager class for coordinating smooth
 * card dealing and flip animations using requestAnimationFrame. Supports
 * animation queuing, speed adjustment, and accessibility options.
 *
 * Animation Features:
 * - Card deal animations from deck to hand positions
 * - Card flip animations (face-up/face-down)
 * - Staggered reveal animations for multiple cards
 * - Chip/balance change animations
 * - Animation queue for sequential playback
 * - Speed multiplier for accessibility
 * - Enable/disable for reduced motion preferences
 *
 * @module ui/AnimationManager
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default duration for card deal animation in milliseconds.
 * @type {number}
 */
const DEFAULT_DEAL_DURATION = 300

/**
 * Default duration for card flip animation in milliseconds.
 * @type {number}
 */
const DEFAULT_FLIP_DURATION = 200

/**
 * Default stagger delay between sequential card animations in milliseconds.
 * @type {number}
 */
const DEFAULT_STAGGER_DELAY = 100

/**
 * Minimum allowed speed multiplier.
 * @type {number}
 */
const MIN_SPEED = 0.1

/**
 * Maximum allowed speed multiplier.
 * @type {number}
 */
const MAX_SPEED = 10

// =============================================================================
// ANIMATION MANAGER CLASS
// =============================================================================

/**
 * Manages smooth animations for card dealing, flipping, and transitions.
 *
 * AnimationManager uses requestAnimationFrame for 60fps smooth animations
 * and provides a queue system for sequential animation playback. Supports
 * accessibility through animation disabling and speed adjustment.
 *
 * @class AnimationManager
 *
 * @example
 * // Basic usage
 * const cardRenderer = new CardRenderer(canvas, assetLoader)
 * const animationManager = new AnimationManager(cardRenderer)
 *
 * // Animate dealing a card
 * await animationManager.animateDeal(card, 400, 0, 100, 200, 300)
 *
 * // Queue multiple animations
 * animationManager
 *   .queue(() => animationManager.animateDeal(card1, 0, 0, 100, 100, 300))
 *   .queue(() => animationManager.animateFlip(card2, 100, 100))
 *   .onComplete(() => console.log('All animations done!'))
 *   .play()
 *
 * @example
 * // Accessibility - disable animations
 * animationManager.disableAnimations()
 *
 * @example
 * // Speed adjustment
 * animationManager.setSpeed(2) // Double speed
 */
export class AnimationManager {
  /**
   * Creates a new AnimationManager instance.
   *
   * @param {import('./CardRenderer.js').CardRenderer} cardRenderer - The CardRenderer instance for drawing cards
   */
  constructor(cardRenderer) {
    /**
     * Reference to the CardRenderer for drawing operations.
     * @type {import('./CardRenderer.js').CardRenderer}
     * @private
     */
    this._cardRenderer = cardRenderer

    /**
     * Default duration for deal animations in milliseconds.
     * @type {number}
     * @private
     */
    this._defaultDealDuration = DEFAULT_DEAL_DURATION

    /**
     * Default duration for flip animations in milliseconds.
     * @type {number}
     * @private
     */
    this._defaultFlipDuration = DEFAULT_FLIP_DURATION

    /**
     * Default stagger delay between sequential cards in milliseconds.
     * @type {number}
     * @private
     */
    this._staggerDelay = DEFAULT_STAGGER_DELAY

    /**
     * Animation queue for sequential playback.
     * @type {Array<() => Promise<void>>}
     * @private
     */
    this._queue = []

    /**
     * Whether the queue is currently being played.
     * @type {boolean}
     * @private
     */
    this._isQueuePlaying = false

    /**
     * Speed multiplier for animations (1 = normal, 2 = double speed).
     * @type {number}
     * @private
     */
    this._speedMultiplier = 1

    /**
     * Whether animations are enabled.
     * @type {boolean}
     * @private
     */
    this._animationsEnabled = true

    /**
     * Callback to execute when queue playback completes.
     * @type {(() => void) | null}
     * @private
     */
    this._completionCallback = null

    /**
     * Set of active animation IDs for tracking and cancellation.
     * @type {Set<number>}
     * @private
     */
    this._activeAnimations = new Set()

    /**
     * Counter for generating unique animation IDs.
     * @type {number}
     * @private
     */
    this._animationIdCounter = 0
  }

  // ===========================================================================
  // PUBLIC METHODS - ANIMATIONS
  // ===========================================================================

  /**
   * Animates a card dealing from one position to another.
   *
   * Uses requestAnimationFrame for smooth 60fps animation with ease-out
   * easing for a natural feel. The card is drawn at intermediate positions
   * during the animation.
   *
   * @param {import('../types/index.js').Card} card - The card to animate
   * @param {number} startX - Starting X coordinate
   * @param {number} startY - Starting Y coordinate
   * @param {number} endX - Ending X coordinate
   * @param {number} endY - Ending Y coordinate
   * @param {number} duration - Animation duration in milliseconds
   * @param {(() => void)} [callback] - Optional callback when animation completes
   * @returns {Promise<void>} Promise that resolves when animation completes
   *
   * @example
   * // Animate card from deck to player hand
   * await animationManager.animateDeal(card, 400, 0, 100, 200, 300)
   *
   * @example
   * // With callback
   * animationManager.animateDeal(card, 400, 0, 100, 200, 300, () => {
   *   console.log('Card dealt!')
   * })
   */
  animateDeal(card, startX, startY, endX, endY, duration, callback) {
    // If animations are disabled, draw immediately at final position
    if (!this._animationsEnabled || duration === 0) {
      this._cardRenderer.drawCard(card, endX, endY, true)
      if (callback) {
        callback()
      }
      return Promise.resolve()
    }

    const adjustedDuration = duration / this._speedMultiplier

    return new Promise((resolve) => {
      const animationId = ++this._animationIdCounter
      this._activeAnimations.add(animationId)

      const startTime = performance.now()

      const animate = (currentTime) => {
        // Check if animation was cancelled
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / adjustedDuration, 1)

        // Ease-out easing: 1 - (1 - t)^3
        const easeProgress = 1 - (1 - progress) ** 3

        const currentX = startX + (endX - startX) * easeProgress
        const currentY = startY + (endY - startY) * easeProgress

        // Draw card at current position
        this._cardRenderer.drawCard(card, currentX, currentY, true)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this._activeAnimations.delete(animationId)
          if (callback) {
            callback()
          }
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  /**
   * Animates a card flip from face-down to face-up.
   *
   * The flip animation simulates a card turning over by scaling the
   * card width during the animation.
   *
   * @param {import('../types/index.js').Card} card - The card to flip
   * @param {number} x - X coordinate of the card
   * @param {number} y - Y coordinate of the card
   * @param {number} [duration] - Animation duration in milliseconds (default: 200ms)
   * @param {(() => void)} [callback] - Optional callback when animation completes
   * @returns {Promise<void>} Promise that resolves when animation completes
   *
   * @example
   * await animationManager.animateFlip(card, 100, 100)
   *
   * @example
   * // With custom duration
   * await animationManager.animateFlip(card, 100, 100, 300)
   */
  animateFlip(card, x, y, duration, callback) {
    const flipDuration = duration !== undefined ? duration : this._defaultFlipDuration

    // If animations are disabled, draw immediately
    if (!this._animationsEnabled || flipDuration === 0) {
      this._cardRenderer.drawCard(card, x, y, true)
      if (callback) {
        callback()
      }
      return Promise.resolve()
    }

    const adjustedDuration = flipDuration / this._speedMultiplier

    return new Promise((resolve) => {
      const animationId = ++this._animationIdCounter
      this._activeAnimations.add(animationId)

      const startTime = performance.now()

      const animate = (currentTime) => {
        // Check if animation was cancelled
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / adjustedDuration, 1)

        // Flip animation: first half shows back shrinking, second half shows front growing
        const isFaceUp = progress > 0.5

        // Draw the appropriate side
        if (isFaceUp) {
          this._cardRenderer.drawCard(card, x, y, true)
        } else {
          this._cardRenderer.drawCard(card, x, y, false)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this._activeAnimations.delete(animationId)
          if (callback) {
            callback()
          }
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  /**
   * Reveals multiple cards with staggered timing.
   *
   * Each card is flipped in sequence with a delay between each flip,
   * creating a cascading reveal effect.
   *
   * @param {import('../types/index.js').Card[]} cards - Array of cards to reveal
   * @param {number} x - X coordinate for the first card
   * @param {number} y - Y coordinate
   * @param {number} [stagger] - Delay between each card reveal in milliseconds (default: 100ms)
   * @param {(() => void)} [callback] - Optional callback when all cards are revealed
   * @returns {Promise<void>} Promise that resolves when all cards are revealed
   *
   * @example
   * const cards = [card1, card2, card3]
   * await animationManager.animateReveal(cards, 100, 100, 100)
   */
  animateReveal(cards, x, y, stagger, callback) {
    const staggerDelay = stagger !== undefined ? stagger : this._staggerDelay

    // Handle empty card array
    if (cards.length === 0) {
      if (callback) {
        callback()
      }
      return Promise.resolve()
    }

    // If animations are disabled, draw all cards immediately
    if (!this._animationsEnabled) {
      const cardWidth = this._cardRenderer.getCardWidth()
      const overlap = 30 // Default overlap
      for (let i = 0; i < cards.length; i++) {
        const cardX = x + i * (cardWidth - overlap)
        this._cardRenderer.drawCard(cards[i], cardX, y, true)
      }
      if (callback) {
        callback()
      }
      return Promise.resolve()
    }

    const cardWidth = this._cardRenderer.getCardWidth()
    const overlap = 30 // Default overlap
    const adjustedStagger = staggerDelay / this._speedMultiplier

    // Execute card flips sequentially with stagger delay
    const flipSequence = async () => {
      for (let i = 0; i < cards.length; i++) {
        const cardX = x + i * (cardWidth - overlap)

        // Wait for stagger delay between cards (except first card)
        if (i > 0) {
          await this._delay(adjustedStagger)
        }

        await this.animateFlip(cards[i], cardX, y, this._defaultFlipDuration)
      }

      if (callback) {
        callback()
      }
    }

    return flipSequence()
  }

  /**
   * Creates a delay using requestAnimationFrame.
   *
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>} Promise that resolves after the delay
   * @private
   */
  _delay(ms) {
    return new Promise((resolve) => {
      const animationId = ++this._animationIdCounter
      this._activeAnimations.add(animationId)

      const startTime = performance.now()

      const wait = (currentTime) => {
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        if (elapsed >= ms) {
          this._activeAnimations.delete(animationId)
          resolve()
        } else {
          requestAnimationFrame(wait)
        }
      }

      requestAnimationFrame(wait)
    })
  }

  /**
   * Animates a chip/balance value change.
   *
   * Smoothly transitions a numeric value from one amount to another,
   * calling the callback with intermediate values during animation.
   *
   * @param {number} fromValue - Starting value
   * @param {number} toValue - Ending value
   * @param {number} duration - Animation duration in milliseconds
   * @param {((currentValue: number) => void)} [callback] - Callback called with current value during animation
   * @returns {Promise<void>} Promise that resolves when animation completes
   *
   * @example
   * // Animate balance from 1000 to 1500
   * animationManager.animateChips(1000, 1500, 300, (value) => {
   *   balanceDisplay.textContent = `$${Math.round(value)}`
   * })
   */
  animateChips(fromValue, toValue, duration, callback) {
    // If animations are disabled, set final value immediately
    if (!this._animationsEnabled || duration === 0) {
      if (callback) {
        callback(toValue)
      }
      return Promise.resolve()
    }

    const adjustedDuration = duration / this._speedMultiplier

    return new Promise((resolve) => {
      const animationId = ++this._animationIdCounter
      this._activeAnimations.add(animationId)

      const startTime = performance.now()

      const animate = (currentTime) => {
        // Check if animation was cancelled
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / adjustedDuration, 1)

        // Ease-out easing
        const easeProgress = 1 - (1 - progress) ** 3

        const currentValue = fromValue + (toValue - fromValue) * easeProgress

        if (callback) {
          callback(progress < 1 ? currentValue : toValue)
        }

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this._activeAnimations.delete(animationId)
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // ===========================================================================
  // PUBLIC METHODS - QUEUE MANAGEMENT
  // ===========================================================================

  /**
   * Adds an animation function to the queue.
   *
   * Queued animations are executed sequentially when play() is called.
   *
   * @param {() => Promise<void>} animation - Animation function that returns a promise
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * animationManager
   *   .queue(() => animationManager.animateDeal(card1, 0, 0, 100, 100, 300))
   *   .queue(() => animationManager.animateFlip(card2, 100, 100))
   *   .play()
   */
  queue(animation) {
    this._queue.push(animation)
    return this
  }

  /**
   * Plays all queued animations in sequence.
   *
   * Animations are executed one after another, with each waiting for
   * the previous to complete before starting.
   *
   * @returns {Promise<void>} Promise that resolves when all animations complete
   *
   * @example
   * animationManager.queue(anim1).queue(anim2)
   * await animationManager.play()
   * console.log('All animations done!')
   */
  async play() {
    if (this._queue.length === 0) {
      if (this._completionCallback) {
        this._completionCallback()
      }
      return
    }

    this._isQueuePlaying = true

    const animations = [...this._queue]
    this._queue = []

    for (const animation of animations) {
      if (!this._isQueuePlaying) {
        break
      }
      await animation()
    }

    this._isQueuePlaying = false

    if (this._completionCallback) {
      this._completionCallback()
    }
  }

  /**
   * Stops all currently playing animations and clears the queue.
   *
   * Any active requestAnimationFrame callbacks are cancelled and
   * the animation queue is emptied.
   *
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * animationManager.stop()
   */
  stop() {
    this._isQueuePlaying = false
    this._queue = []

    // Cancel all active animations
    for (const id of this._activeAnimations) {
      cancelAnimationFrame(id)
    }
    this._activeAnimations.clear()

    return this
  }

  /**
   * Checks if any animation is currently playing.
   *
   * Returns true if either the queue is being played or there are
   * active individual animations running.
   *
   * @returns {boolean} True if animations are in progress
   *
   * @example
   * if (animationManager.isPlaying()) {
   *   console.log('Animation in progress')
   * }
   */
  isPlaying() {
    return this._isQueuePlaying || this._activeAnimations.size > 0
  }

  // ===========================================================================
  // PUBLIC METHODS - CONFIGURATION
  // ===========================================================================

  /**
   * Sets the animation speed multiplier.
   *
   * Higher values make animations faster, lower values make them slower.
   * Value is clamped between 0.1 (10x slower) and 10 (10x faster).
   *
   * @param {number} multiplier - Speed multiplier (1 = normal, 2 = double speed)
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * animationManager.setSpeed(2)  // Double speed
   * animationManager.setSpeed(0.5) // Half speed
   */
  setSpeed(multiplier) {
    this._speedMultiplier = Math.max(MIN_SPEED, Math.min(MAX_SPEED, multiplier))
    return this
  }

  /**
   * Registers a callback to be called when queue playback completes.
   *
   * The callback is called after play() finishes executing all queued
   * animations or when the queue is empty.
   *
   * @param {() => void} callback - Function to call on completion
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * animationManager
   *   .onComplete(() => console.log('Done!'))
   *   .queue(anim1)
   *   .queue(anim2)
   *   .play()
   */
  onComplete(callback) {
    this._completionCallback = callback
    return this
  }

  /**
   * Enables animations (default state).
   *
   * When enabled, animations play normally using requestAnimationFrame.
   *
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * animationManager.enableAnimations()
   */
  enableAnimations() {
    this._animationsEnabled = true
    return this
  }

  /**
   * Disables animations for accessibility.
   *
   * When disabled, all animation methods complete immediately without
   * animation, drawing final states directly.
   *
   * @returns {AnimationManager} This instance for method chaining
   *
   * @example
   * // For users who prefer reduced motion
   * animationManager.disableAnimations()
   */
  disableAnimations() {
    this._animationsEnabled = false
    return this
  }
}
