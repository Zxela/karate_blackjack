/**
 * @fileoverview Asset loading system for Karate Blackjack game.
 *
 * This module provides the AssetLoader class for loading and caching card images
 * with automatic placeholder generation as fallback. Enables development to proceed
 * without actual card artwork by generating canvas-based placeholder cards.
 *
 * Placeholder Design:
 * - Colored background based on suit (Hearts=red, Diamonds=blue, Clubs/Spades=black)
 * - Suit symbols at corners
 * - Large rank text in center
 * - White text for readability
 *
 * @module ui/AssetLoader
 * @version 1.0.0
 */

import { RANK_VALUES, SUIT_VALUES } from '../types/index.js'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Suit color mapping for placeholder cards.
 * Uses karate-themed colors with emphasis on red and black.
 * @type {Record<string, string>}
 */
const SUIT_COLORS = Object.freeze({
  hearts: '#DC143C', // Crimson red
  diamonds: '#1E90FF', // Dodger blue
  clubs: '#1A1A1A', // Near black
  spades: '#1A1A1A' // Near black
})

/**
 * Unicode symbols for card suits.
 * @type {Record<string, string>}
 */
const SUIT_SYMBOLS = Object.freeze({
  hearts: '\u2665', // Black heart
  diamonds: '\u2666', // Black diamond
  clubs: '\u2663', // Black club
  spades: '\u2660' // Black spade
})

/**
 * Default card dimensions in pixels.
 */
const DEFAULT_CARD_WIDTH = 100
const DEFAULT_CARD_HEIGHT = 150

// =============================================================================
// ASSET LOADER CLASS
// =============================================================================

/**
 * Manages card asset loading with placeholder fallback support.
 *
 * The AssetLoader attempts to load actual card images from the assets directory.
 * If loading fails (images not present), it automatically generates canvas-based
 * placeholder cards that display the suit and rank clearly.
 *
 * @class AssetLoader
 *
 * @example
 * // Basic usage
 * const loader = new AssetLoader()
 * await loader.loadAll()
 *
 * const card = createCard('hearts', 'A')
 * const imageData = loader.getCardImage(card)
 *
 * @example
 * // Get placeholder without loading
 * const loader = new AssetLoader()
 * const placeholder = loader.getPlaceholder(createCard('spades', 'K'))
 */
export class AssetLoader {
  /**
   * Creates a new AssetLoader instance.
   *
   * Initializes with empty cache and default card dimensions.
   */
  constructor() {
    /**
     * Cache for loaded images and generated placeholders.
     * Key format: "{suit}-{rank}" for cards, "back" for card back.
     * @type {Map<string, string>}
     * @private
     */
    this._cache = new Map()

    /**
     * Total number of assets to load (52 cards + 1 back).
     * @type {number}
     * @private
     */
    this._totalAssets = 53

    /**
     * Number of assets loaded so far.
     * @type {number}
     * @private
     */
    this._loadedAssets = 0

    /**
     * Whether all assets have been loaded (or failed with fallbacks).
     * @type {boolean}
     * @private
     */
    this._allLoaded = false

    /**
     * Card width in pixels.
     * @type {number}
     */
    this.cardWidth = DEFAULT_CARD_WIDTH

    /**
     * Card height in pixels.
     * @type {number}
     */
    this.cardHeight = DEFAULT_CARD_HEIGHT
  }

  /**
   * Returns the color associated with a suit.
   *
   * @param {string} suit - The suit (hearts, diamonds, clubs, spades)
   * @returns {string} Hex color code for the suit
   *
   * @example
   * loader.getSuitColor('hearts')   // '#DC143C'
   * loader.getSuitColor('clubs')    // '#1A1A1A'
   */
  getSuitColor(suit) {
    return SUIT_COLORS[suit] || '#808080'
  }

  /**
   * Returns the Unicode symbol for a suit.
   *
   * @param {string} suit - The suit (hearts, diamonds, clubs, spades)
   * @returns {string} Unicode symbol for the suit
   *
   * @example
   * loader.getSuitSymbol('hearts')   // '\u2665' (heart)
   * loader.getSuitSymbol('spades')   // '\u2660' (spade)
   */
  getSuitSymbol(suit) {
    return SUIT_SYMBOLS[suit] || '?'
  }

  /**
   * Generates a placeholder image for a card.
   *
   * Creates a canvas-based placeholder with:
   * - Suit-colored background
   * - Suit symbols in corners
   * - Large rank text in center
   * - White text for readability on dark backgrounds
   *
   * @param {import('../types/index.js').Card} card - The card to generate placeholder for
   * @returns {string} Data URL of the placeholder image
   *
   * @example
   * const card = createCard('hearts', 'A')
   * const dataUrl = loader.getPlaceholder(card)
   * // Returns 'data:image/png;base64,...'
   */
  getPlaceholder(card) {
    const cacheKey = card.id

    // Return cached placeholder if available
    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    const placeholder = this._generatePlaceholder(card.suit, String(card.rank))

    this._cache.set(cacheKey, placeholder)
    return placeholder
  }

  /**
   * Generates a placeholder image for the card back.
   *
   * Creates a decorative back design using karate-themed colors
   * (primarily red and gold patterns).
   *
   * @returns {string} Data URL of the card back placeholder image
   *
   * @example
   * const backUrl = loader.getBackPlaceholder()
   * // Returns 'data:image/png;base64,...'
   */
  getBackPlaceholder() {
    const cacheKey = 'back'

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    const placeholder = this._generateBackPlaceholder()
    this._cache.set(cacheKey, placeholder)
    return placeholder
  }

  /**
   * Generates the asset path for a card image.
   *
   * @param {import('../types/index.js').Card} card - The card to get path for
   * @returns {string} Path to the card image asset
   *
   * @example
   * const card = createCard('hearts', 'A')
   * loader.getAssetPath(card) // 'assets/cards/hearts_A.png'
   */
  getAssetPath(card) {
    return `assets/cards/${card.suit}_${card.rank}.png`
  }

  /**
   * Returns the asset path for the card back image.
   *
   * @returns {string} Path to the card back image
   *
   * @example
   * loader.getBackAssetPath() // 'assets/cards/back.png'
   */
  getBackAssetPath() {
    return 'assets/cards/back.png'
  }

  /**
   * Loads a single asset from the given path.
   *
   * Attempts to load an image from the path. On success, caches the image.
   * On failure, generates and caches a placeholder instead.
   *
   * @param {string} path - Path to the image asset
   * @returns {Promise<string>} Promise resolving to image data URL or placeholder
   *
   * @example
   * const imageData = await loader.loadAsset('assets/cards/hearts_A.png')
   */
  loadAsset(path) {
    return new Promise((resolve) => {
      // Check if already cached
      if (this._cache.has(path)) {
        resolve(this._cache.get(path))
        return
      }

      const img = document.createElement('img')

      img.onload = () => {
        // Convert image to data URL for caching
        const canvas = document.createElement('canvas')
        canvas.width = img.width || this.cardWidth
        canvas.height = img.height || this.cardHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL()
        this._cache.set(path, dataUrl)
        resolve(dataUrl)
      }

      img.onerror = () => {
        // On error, generate a fallback placeholder
        // Extract suit and rank from path if possible
        const fallback = this._generateFallbackFromPath(path)
        this._cache.set(path, fallback)
        resolve(fallback)
      }

      img.src = path
    })
  }

  /**
   * Gets the loaded image for a card.
   *
   * Returns cached image if available, otherwise returns a placeholder.
   *
   * @param {import('../types/index.js').Card} card - The card to get image for
   * @returns {string} Data URL of the card image or placeholder
   *
   * @example
   * const imageData = loader.getCardImage(createCard('hearts', 'A'))
   */
  getCardImage(card) {
    const cacheKey = card.id

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    // Return placeholder if not cached
    return this.getPlaceholder(card)
  }

  /**
   * Gets the loaded card back image.
   *
   * Returns cached back image if available, otherwise returns a placeholder.
   *
   * @returns {string} Data URL of the card back image or placeholder
   *
   * @example
   * const backImage = loader.getBackImage()
   */
  getBackImage() {
    const cacheKey = 'back'

    if (this._cache.has(cacheKey)) {
      return this._cache.get(cacheKey)
    }

    return this.getBackPlaceholder()
  }

  /**
   * Loads all card assets in parallel.
   *
   * Attempts to load all 52 card images plus the card back.
   * Failed loads are automatically replaced with placeholders.
   * Progress can be tracked via getLoadProgress().
   *
   * @returns {Promise<void>} Promise that resolves when all assets are loaded
   *
   * @example
   * await loader.loadAll()
   * console.log(loader.isLoaded()) // true
   * console.log(loader.getLoadProgress()) // 1
   */
  async loadAll() {
    this._loadedAssets = 0
    this._allLoaded = false

    const loadPromises = []

    // Load all 52 cards
    for (const suit of SUIT_VALUES) {
      for (const rank of RANK_VALUES) {
        const path = `assets/cards/${suit}_${rank}.png`
        const cardId = `${suit}-${rank}`

        const loadPromise = this._loadCardAsset(path, cardId, suit, rank)
        loadPromises.push(loadPromise)
      }
    }

    // Load card back
    const backPromise = this._loadBackAsset()
    loadPromises.push(backPromise)

    await Promise.all(loadPromises)

    this._allLoaded = true
  }

  /**
   * Checks if all assets have been loaded.
   *
   * @returns {boolean} True if loadAll() has completed
   *
   * @example
   * await loader.loadAll()
   * loader.isLoaded() // true
   */
  isLoaded() {
    return this._allLoaded
  }

  /**
   * Returns the current loading progress.
   *
   * @returns {number} Progress from 0 (not started) to 1 (complete)
   *
   * @example
   * loader.getLoadProgress() // 0.5 (50% loaded)
   */
  getLoadProgress() {
    if (this._totalAssets === 0) return 0
    return this._loadedAssets / this._totalAssets
  }

  // ===========================================================================
  // PRIVATE METHODS
  // ===========================================================================

  /**
   * Loads a single card asset and caches it.
   *
   * @param {string} path - Path to the image file
   * @param {string} cardId - Cache key for the card
   * @param {string} suit - Card suit for fallback placeholder
   * @param {number|string} rank - Card rank for fallback placeholder
   * @returns {Promise<void>}
   * @private
   */
  _loadCardAsset(path, cardId, suit, rank) {
    return new Promise((resolve) => {
      const img = document.createElement('img')

      img.onload = () => {
        // Convert to canvas data URL
        const canvas = document.createElement('canvas')
        canvas.width = img.width || this.cardWidth
        canvas.height = img.height || this.cardHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL()
        this._cache.set(cardId, dataUrl)
        this._loadedAssets++
        resolve()
      }

      img.onerror = () => {
        // Generate placeholder on failure
        const placeholder = this._generatePlaceholder(suit, String(rank))
        this._cache.set(cardId, placeholder)
        this._loadedAssets++
        resolve()
      }

      img.src = path
    })
  }

  /**
   * Loads the card back asset.
   *
   * @returns {Promise<void>}
   * @private
   */
  _loadBackAsset() {
    return new Promise((resolve) => {
      const img = document.createElement('img')
      const path = this.getBackAssetPath()

      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width || this.cardWidth
        canvas.height = img.height || this.cardHeight

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0)

        const dataUrl = canvas.toDataURL()
        this._cache.set('back', dataUrl)
        this._loadedAssets++
        resolve()
      }

      img.onerror = () => {
        const placeholder = this._generateBackPlaceholder()
        this._cache.set('back', placeholder)
        this._loadedAssets++
        resolve()
      }

      img.src = path
    })
  }

  /**
   * Generates a placeholder card image.
   *
   * @param {string} suit - The card suit
   * @param {string} rank - The card rank as string
   * @returns {string} Data URL of the placeholder
   * @private
   */
  _generatePlaceholder(suit, rank) {
    const canvas = document.createElement('canvas')
    canvas.width = this.cardWidth
    canvas.height = this.cardHeight

    const ctx = canvas.getContext('2d')
    const color = this.getSuitColor(suit)
    const symbol = this.getSuitSymbol(suit)

    // Fill background with suit color
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Add subtle border
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2)

    // Draw center rank (large)
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 36px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(rank, canvas.width / 2, canvas.height / 2)

    // Draw suit symbols in corners
    ctx.font = 'bold 18px Arial'

    // Top-left
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(symbol, 6, 6)

    // Bottom-right
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(symbol, canvas.width - 6, canvas.height - 6)

    // Draw corner rank indicators
    ctx.font = 'bold 14px Arial'

    // Top-left rank
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText(rank, 6, 24)

    // Bottom-right rank (upside down simulation)
    ctx.textAlign = 'right'
    ctx.textBaseline = 'bottom'
    ctx.fillText(rank, canvas.width - 6, canvas.height - 24)

    return canvas.toDataURL()
  }

  /**
   * Generates a placeholder for the card back.
   *
   * Uses karate-themed design with red/gold pattern.
   *
   * @returns {string} Data URL of the back placeholder
   * @private
   */
  _generateBackPlaceholder() {
    const canvas = document.createElement('canvas')
    canvas.width = this.cardWidth
    canvas.height = this.cardHeight

    const ctx = canvas.getContext('2d')

    // Main background - dark red
    ctx.fillStyle = '#8B0000'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Border
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.strokeRect(2, 2, canvas.width - 4, canvas.height - 4)

    // Inner border
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 1
    ctx.strokeRect(8, 8, canvas.width - 16, canvas.height - 16)

    // Center circle decoration
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, 25, 0, Math.PI * 2)
    ctx.fill()

    // Inner circle
    ctx.fillStyle = '#8B0000'
    ctx.beginPath()
    ctx.arc(canvas.width / 2, canvas.height / 2, 18, 0, Math.PI * 2)
    ctx.fill()

    // Center symbol (karate-themed)
    ctx.fillStyle = '#FFD700'
    ctx.font = 'bold 16px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('BJ', canvas.width / 2, canvas.height / 2)

    return canvas.toDataURL()
  }

  /**
   * Generates a fallback placeholder from an asset path.
   *
   * Attempts to extract suit and rank from the path format:
   * "assets/cards/{suit}_{rank}.png"
   *
   * @param {string} path - The asset path
   * @returns {string} Data URL of fallback placeholder
   * @private
   */
  _generateFallbackFromPath(path) {
    // Try to parse path like "assets/cards/hearts_A.png"
    const match = path.match(/(\w+)_(\w+)\.png$/)

    if (match) {
      const suit = match[1]
      const rank = match[2]
      return this._generatePlaceholder(suit, rank)
    }

    // If path doesn't match, return back placeholder
    return this._generateBackPlaceholder()
  }
}
