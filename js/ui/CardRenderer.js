/**
 * @fileoverview Canvas-based card rendering for Karate Blackjack game.
 *
 * This module provides the CardRenderer class for rendering playing cards on
 * HTML5 canvas with support for face-up/face-down display, hand rendering with
 * configurable overlap, responsive scaling, and dealer hand with hidden hole card.
 *
 * Rendering Features:
 * - Face-up cards show image from AssetLoader
 * - Face-down cards show card back
 * - Cards overlap when drawn as a hand (configurable)
 * - Support for responsive scaling
 * - Shadow/border effects for card appearance
 *
 * @module ui/CardRenderer
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Default card width in pixels.
 * @type {number}
 */
const DEFAULT_CARD_WIDTH = 100

/**
 * Default card height in pixels.
 * Following 5:7 aspect ratio as per design spec.
 * @type {number}
 */
const DEFAULT_CARD_HEIGHT = 140

/**
 * Default corner radius for card rendering.
 * @type {number}
 */
const DEFAULT_CORNER_RADIUS = 8

/**
 * Default overlap amount when rendering multiple cards.
 * @type {number}
 */
const DEFAULT_OVERLAP_AMOUNT = 30

/**
 * Minimum allowed scale value.
 * @type {number}
 */
const MIN_SCALE = 0.1

/**
 * Maximum allowed scale value.
 * @type {number}
 */
const MAX_SCALE = 3

/**
 * Shadow blur amount for card appearance.
 * @type {number}
 */
const SHADOW_BLUR = 4

/**
 * Shadow color for card appearance.
 * @type {string}
 */
const SHADOW_COLOR = 'rgba(0, 0, 0, 0.3)'

/**
 * Shadow offset for card appearance.
 * @type {number}
 */
const SHADOW_OFFSET = 2

// =============================================================================
// CARD RENDERER CLASS
// =============================================================================

/**
 * Renders playing cards on HTML5 canvas.
 *
 * CardRenderer provides methods for drawing individual cards, hands with overlap,
 * and dealer hands with optional hidden hole card. Supports responsive scaling
 * and integrates with AssetLoader for card images.
 *
 * @class CardRenderer
 *
 * @example
 * // Basic usage
 * const canvas = document.getElementById('gameCanvas')
 * const assetLoader = new AssetLoader()
 * const renderer = new CardRenderer(canvas, assetLoader)
 *
 * await renderer.loadAssets()
 *
 * // Draw a single card
 * const card = createCard('hearts', 'A')
 * renderer.drawCard(card, 100, 100, true)
 *
 * // Draw a hand with overlap
 * const hand = [createCard('hearts', 'A'), createCard('spades', 'K')]
 * renderer.drawHand(hand, 100, 200)
 *
 * @example
 * // Responsive scaling
 * renderer.setScale(0.75) // 75% of base size
 * console.log(renderer.getCardWidth())  // 75
 * console.log(renderer.getCardHeight()) // 105
 */
export class CardRenderer {
  /**
   * Creates a new CardRenderer instance.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element to render on
   * @param {import('./AssetLoader.js').AssetLoader} assetLoader - AssetLoader instance for card images
   */
  constructor(canvas, assetLoader) {
    /**
     * Reference to the canvas element.
     * @type {HTMLCanvasElement}
     * @private
     */
    this._canvas = canvas

    /**
     * Canvas 2D rendering context.
     * @type {CanvasRenderingContext2D}
     * @private
     */
    this._ctx = canvas.getContext('2d')

    /**
     * AssetLoader instance for retrieving card images.
     * @type {import('./AssetLoader.js').AssetLoader}
     * @private
     */
    this._assetLoader = assetLoader

    /**
     * Base card width in pixels.
     * @type {number}
     * @private
     */
    this._baseWidth = DEFAULT_CARD_WIDTH

    /**
     * Base card height in pixels.
     * @type {number}
     * @private
     */
    this._baseHeight = DEFAULT_CARD_HEIGHT

    /**
     * Corner radius for rounded rectangle cards.
     * @type {number}
     * @private
     */
    this._cornerRadius = DEFAULT_CORNER_RADIUS

    /**
     * Overlap amount when rendering multiple cards.
     * @type {number}
     * @private
     */
    this._overlapAmount = DEFAULT_OVERLAP_AMOUNT

    /**
     * Current rendering scale (1 = 100%).
     * @type {number}
     * @private
     */
    this._scale = 1

    /**
     * Cache for loaded Image objects.
     * @type {Map<string, HTMLImageElement>}
     * @private
     */
    this._imageCache = new Map()
  }

  // ===========================================================================
  // PUBLIC METHODS
  // ===========================================================================

  /**
   * Loads all card assets via the AssetLoader.
   *
   * This method delegates to the AssetLoader's loadAll method to preload
   * all 52 card images plus the card back.
   *
   * @returns {Promise<void>} Promise that resolves when all assets are loaded
   *
   * @example
   * await renderer.loadAssets()
   * console.log('All card images loaded!')
   */
  async loadAssets() {
    await this._assetLoader.loadAll()
  }

  /**
   * Draws a single card at the specified position.
   *
   * Renders either the card face or card back depending on the faceUp parameter.
   * Applies shadow effects for a polished appearance.
   *
   * @param {import('../types/index.js').Card} card - The card to draw
   * @param {number} x - X coordinate (left edge)
   * @param {number} y - Y coordinate (top edge)
   * @param {boolean} faceUp - True to show card face, false for card back
   *
   * @example
   * const card = createCard('hearts', 'A')
   * renderer.drawCard(card, 100, 100, true)  // Face up
   * renderer.drawCard(card, 200, 100, false) // Face down
   */
  drawCard(card, x, y, faceUp) {
    const width = this.getCardWidth()
    const height = this.getCardHeight()

    // Get the appropriate image data URL
    const imageData = faceUp
      ? this._assetLoader.getCardImage(card)
      : this._assetLoader.getBackImage()

    // Draw the card with shadow effect
    this._drawCardImage(imageData, x, y, width, height)
  }

  /**
   * Draws multiple cards as a hand with configurable overlap.
   *
   * Cards are drawn left to right with the specified overlap amount.
   * Each subsequent card overlaps the previous card.
   *
   * @param {import('../types/index.js').Card[]} cards - Array of cards to draw
   * @param {number} x - X coordinate of the first card (left edge)
   * @param {number} y - Y coordinate (top edge, same for all cards)
   * @param {number} [overlap] - Override default overlap amount in pixels
   *
   * @example
   * const hand = [createCard('hearts', 'A'), createCard('spades', 'K')]
   * renderer.drawHand(hand, 100, 200)        // Default 30px overlap
   * renderer.drawHand(hand, 100, 200, 50)    // Custom 50px overlap
   */
  drawHand(cards, x, y, overlap) {
    if (cards.length === 0) {
      return
    }

    const cardWidth = this.getCardWidth()
    const overlapAmount =
      overlap !== undefined ? overlap * this._scale : this._overlapAmount * this._scale
    const spacing = cardWidth - overlapAmount

    for (let i = 0; i < cards.length; i++) {
      const cardX = x + i * spacing
      this.drawCard(cards[i], cardX, y, true)
    }
  }

  /**
   * Draws a dealer hand with optional hidden hole card.
   *
   * When hideHole is true, the first card (hole card) is rendered face-down
   * and all subsequent cards are rendered face-up. When hideHole is false,
   * all cards are rendered face-up.
   *
   * @param {import('../types/index.js').Card[]} cards - Array of dealer's cards
   * @param {number} x - X coordinate of the first card (left edge)
   * @param {number} y - Y coordinate (top edge)
   * @param {boolean} hideHole - True to hide the first (hole) card
   *
   * @example
   * const dealerHand = [createCard('hearts', 'A'), createCard('spades', 'K')]
   * renderer.drawDealerHand(dealerHand, 100, 50, true)  // Hide hole card
   * renderer.drawDealerHand(dealerHand, 100, 50, false) // Reveal all
   */
  drawDealerHand(cards, x, y, hideHole) {
    if (cards.length === 0) {
      return
    }

    const cardWidth = this.getCardWidth()
    const spacing = cardWidth - this._overlapAmount * this._scale

    for (let i = 0; i < cards.length; i++) {
      const cardX = x + i * spacing
      const faceUp = hideHole ? i !== 0 : true
      this.drawCard(cards[i], cardX, y, faceUp)
    }
  }

  /**
   * Draws a card back at the specified position.
   *
   * Convenience method for rendering just the card back design.
   *
   * @param {number} x - X coordinate (left edge)
   * @param {number} y - Y coordinate (top edge)
   *
   * @example
   * renderer.renderCardBack(100, 100)
   */
  renderCardBack(x, y) {
    const width = this.getCardWidth()
    const height = this.getCardHeight()
    const imageData = this._assetLoader.getBackImage()

    this._drawCardImage(imageData, x, y, width, height)
  }

  /**
   * Sets the rendering scale for responsive display.
   *
   * Scale affects all card dimensions and overlap amounts.
   * Value is clamped between 0.1 (10%) and 3 (300%).
   *
   * @param {number} scale - Scale factor (1 = 100%)
   *
   * @example
   * renderer.setScale(0.75)  // 75% size for mobile
   * renderer.setScale(1.5)   // 150% size for large displays
   */
  setScale(scale) {
    this._scale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale))
  }

  /**
   * Returns the current scaled card width.
   *
   * @returns {number} Card width in pixels (base width * scale)
   *
   * @example
   * renderer.setScale(0.5)
   * console.log(renderer.getCardWidth()) // 50
   */
  getCardWidth() {
    return this._baseWidth * this._scale
  }

  /**
   * Returns the current scaled card height.
   *
   * @returns {number} Card height in pixels (base height * scale)
   *
   * @example
   * renderer.setScale(0.5)
   * console.log(renderer.getCardHeight()) // 70
   */
  getCardHeight() {
    return this._baseHeight * this._scale
  }

  /**
   * Clears a region of the canvas.
   *
   * If no arguments are provided, clears the entire canvas.
   * If only x and y are provided, clears from that point to canvas edges.
   *
   * @param {number} [x] - X coordinate of the region to clear (default: 0)
   * @param {number} [y] - Y coordinate of the region to clear (default: 0)
   * @param {number} [width] - Width of the region (defaults to canvas width - x)
   * @param {number} [height] - Height of the region (defaults to canvas height - y)
   *
   * @example
   * renderer.clear()                     // Clear entire canvas
   * renderer.clear(10, 20, 100, 150)     // Clear specific region
   */
  clear(x, y, width, height) {
    const clearX = x !== undefined ? x : 0
    const clearY = y !== undefined ? y : 0
    const clearWidth = width !== undefined ? width : this._canvas.width - clearX
    const clearHeight = height !== undefined ? height : this._canvas.height - clearY

    this._ctx.clearRect(clearX, clearY, clearWidth, clearHeight)
  }

  /**
   * Animates a card dealing from one position to another.
   *
   * This method provides the signature for card dealing animations.
   * The actual animation implementation will be coordinated with AnimationManager
   * in Task 014.
   *
   * @param {import('../types/index.js').Card} card - The card to animate
   * @param {number} fromX - Starting X coordinate
   * @param {number} fromY - Starting Y coordinate
   * @param {number} toX - Ending X coordinate
   * @param {number} toY - Ending Y coordinate
   * @param {number} duration - Animation duration in milliseconds
   * @returns {Promise<void>} Promise that resolves when animation completes
   *
   * @example
   * await renderer.animateCardDeal(card, 400, 0, 100, 200, 300)
   */
  animateCardDeal(card, fromX, fromY, toX, toY, duration) {
    // Basic implementation - immediately draw at destination
    // Full animation support will be added in Task 014
    return new Promise((resolve) => {
      if (duration === 0) {
        this.drawCard(card, toX, toY, true)
        resolve()
        return
      }

      // Check if requestAnimationFrame is available (browser environment)
      if (typeof requestAnimationFrame !== 'function') {
        // Fallback for non-browser environments (e.g., Node.js tests)
        this.drawCard(card, toX, toY, true)
        resolve()
        return
      }

      // For non-zero duration, use requestAnimationFrame for smooth animation
      const startTime = performance.now()
      const animate = (currentTime) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Easing function (ease-out)
        const easeProgress = 1 - (1 - progress) ** 3

        const currentX = fromX + (toX - fromX) * easeProgress
        const currentY = fromY + (toY - fromY) * easeProgress

        // Clear previous position and draw at new position
        this.drawCard(card, currentX, currentY, true)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Draws a card image with shadow effects.
   *
   * @param {string} imageData - Data URL of the card image
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {number} width - Card width
   * @param {number} height - Card height
   * @private
   */
  _drawCardImage(imageData, x, y, width, height) {
    // Check if we have a cached Image object
    let img = this._imageCache.get(imageData)

    if (!img) {
      // Create and cache new Image
      img = new Image()
      img.src = imageData
      this._imageCache.set(imageData, img)
    }

    // Save context state
    this._ctx.save()

    // Apply shadow effect
    this._ctx.shadowColor = SHADOW_COLOR
    this._ctx.shadowBlur = SHADOW_BLUR * this._scale
    this._ctx.shadowOffsetX = SHADOW_OFFSET * this._scale
    this._ctx.shadowOffsetY = SHADOW_OFFSET * this._scale

    // Draw the card image
    this._ctx.drawImage(img, x, y, width, height)

    // Restore context state
    this._ctx.restore()
  }
}
