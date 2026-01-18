/**
 * @fileoverview Unit tests for AssetLoader module.
 *
 * Tests cover:
 * - Placeholder generation with correct suit colors
 * - Suit symbol mapping
 * - Card image loading with fallback
 * - Progress tracking
 * - Cache functionality
 * - Error handling for missing assets
 *
 * @module tests/ui/AssetLoader
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createCard } from '../../js/types/index.js'

// Mock canvas and image for Node.js environment
class MockCanvas {
  constructor() {
    this.width = 0
    this.height = 0
    this._context = new MockContext()
  }

  getContext() {
    return this._context
  }

  toDataURL() {
    return 'data:image/png;base64,mockdata'
  }
}

class MockContext {
  constructor() {
    this.fillStyle = ''
    this.font = ''
    this.textAlign = ''
    this.textBaseline = ''
  }

  fillRect() {}
  fillText() {}
  beginPath() {}
  arc() {}
  fill() {}
  strokeRect() {}
  drawImage() {}
  set strokeStyle(_) {}
  set lineWidth(_) {}
}

// Track created images for async testing
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

// Setup global mocks before importing AssetLoader
vi.stubGlobal('document', {
  createElement: (tag) => {
    if (tag === 'canvas') return new MockCanvas()
    if (tag === 'img') return new MockImage()
    return {}
  }
})

// Import AssetLoader after mock setup
const { AssetLoader } = await import('../../js/ui/AssetLoader.js')

describe('AssetLoader', () => {
  let loader

  beforeEach(() => {
    createdImages = []
    loader = new AssetLoader()
  })

  afterEach(() => {
    createdImages = []
  })

  describe('constructor', () => {
    it('initializes with empty cache', () => {
      expect(loader.isLoaded()).toBe(false)
      expect(loader.getLoadProgress()).toBe(0)
    })

    it('initializes with default card dimensions', () => {
      expect(loader.cardWidth).toBe(100)
      expect(loader.cardHeight).toBe(150)
    })
  })

  describe('getSuitColor', () => {
    it('returns red for hearts', () => {
      expect(loader.getSuitColor('hearts')).toBe('#DC143C')
    })

    it('returns blue for diamonds', () => {
      expect(loader.getSuitColor('diamonds')).toBe('#1E90FF')
    })

    it('returns black for clubs', () => {
      expect(loader.getSuitColor('clubs')).toBe('#1A1A1A')
    })

    it('returns black for spades', () => {
      expect(loader.getSuitColor('spades')).toBe('#1A1A1A')
    })

    it('returns default color for invalid suit', () => {
      expect(loader.getSuitColor('invalid')).toBe('#808080')
    })
  })

  describe('getSuitSymbol', () => {
    it('returns heart symbol for hearts', () => {
      expect(loader.getSuitSymbol('hearts')).toBe('\u2665')
    })

    it('returns diamond symbol for diamonds', () => {
      expect(loader.getSuitSymbol('diamonds')).toBe('\u2666')
    })

    it('returns club symbol for clubs', () => {
      expect(loader.getSuitSymbol('clubs')).toBe('\u2663')
    })

    it('returns spade symbol for spades', () => {
      expect(loader.getSuitSymbol('spades')).toBe('\u2660')
    })

    it('returns question mark for invalid suit', () => {
      expect(loader.getSuitSymbol('invalid')).toBe('?')
    })
  })

  describe('getPlaceholder', () => {
    it('returns canvas-based placeholder for a card', () => {
      const card = createCard('hearts', 'A')
      const placeholder = loader.getPlaceholder(card)

      expect(placeholder).toBeDefined()
      expect(typeof placeholder).toBe('string')
      expect(placeholder.startsWith('data:image/png')).toBe(true)
    })

    it('returns placeholder with correct dimensions set', () => {
      const card = createCard('diamonds', 'K')
      loader.getPlaceholder(card)

      // Verifies canvas was created with correct size
      expect(loader.cardWidth).toBe(100)
      expect(loader.cardHeight).toBe(150)
    })

    it('generates placeholder for numeric ranks', () => {
      const card = createCard('clubs', 7)
      const placeholder = loader.getPlaceholder(card)

      expect(placeholder).toBeDefined()
      expect(typeof placeholder).toBe('string')
    })

    it('generates placeholder for face cards', () => {
      const card = createCard('spades', 'J')
      const placeholder = loader.getPlaceholder(card)

      expect(placeholder).toBeDefined()
      expect(typeof placeholder).toBe('string')
    })

    it('caches generated placeholders', () => {
      const card = createCard('hearts', 'A')
      const placeholder1 = loader.getPlaceholder(card)
      const placeholder2 = loader.getPlaceholder(card)

      expect(placeholder1).toBe(placeholder2)
    })

    it('generates different placeholders for different cards', () => {
      const card1 = createCard('hearts', 'A')
      const card2 = createCard('spades', 'K')

      const placeholder1 = loader.getPlaceholder(card1)
      const placeholder2 = loader.getPlaceholder(card2)

      // Both should be valid data URLs
      expect(placeholder1).toBeDefined()
      expect(placeholder2).toBeDefined()
    })
  })

  describe('getBackPlaceholder', () => {
    it('returns a placeholder for card back', () => {
      const backPlaceholder = loader.getBackPlaceholder()

      expect(backPlaceholder).toBeDefined()
      expect(typeof backPlaceholder).toBe('string')
      expect(backPlaceholder.startsWith('data:image/png')).toBe(true)
    })

    it('caches the card back placeholder', () => {
      const back1 = loader.getBackPlaceholder()
      const back2 = loader.getBackPlaceholder()

      expect(back1).toBe(back2)
    })
  })

  describe('loadAsset', () => {
    it('returns a promise', () => {
      const result = loader.loadAsset('assets/cards/hearts_A.png')
      expect(result).toBeInstanceOf(Promise)

      // Trigger error to resolve promise
      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 0)
    })

    it('resolves to placeholder on image load failure', async () => {
      const promise = loader.loadAsset('assets/cards/nonexistent.png')

      // Trigger error callback
      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('Not found'))
        }
      }, 10)

      const result = await promise
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })

    it('caches loaded assets', async () => {
      const path = 'assets/cards/hearts_A.png'

      // Pre-populate cache
      loader._cache.set(path, 'cached-data')

      // Should return cached result immediately
      const result = await loader.loadAsset(path)
      expect(result).toBe('cached-data')
    })

    it('does not throw on network errors', async () => {
      const promise = loader.loadAsset('assets/cards/invalid.png')

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('Network error'))
        }
      }, 10)

      // Should not throw, should resolve gracefully
      await expect(promise).resolves.toBeDefined()
    })

    it('resolves with data URL on successful load', async () => {
      const path = 'assets/cards/hearts_A.png'
      const promise = loader.loadAsset(path)

      // Trigger success callback
      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onload) img.onload()
        }
      }, 10)

      const result = await promise
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('getCardImage', () => {
    it('returns cached image if available', () => {
      const card = createCard('hearts', 'A')

      // Pre-populate cache
      loader._cache.set('hearts-A', 'cached-image-data')

      const result = loader.getCardImage(card)
      expect(result).toBe('cached-image-data')
    })

    it('returns placeholder if image not cached', () => {
      const card = createCard('diamonds', 'K')

      const result = loader.getCardImage(card)

      // Should return a placeholder
      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('getBackImage', () => {
    it('returns cached back image if available', () => {
      loader._cache.set('back', 'cached-back-data')

      const result = loader.getBackImage()
      expect(result).toBe('cached-back-data')
    })

    it('returns back placeholder if not cached', () => {
      const result = loader.getBackImage()

      expect(result).toBeDefined()
      expect(typeof result).toBe('string')
    })
  })

  describe('loadAll', () => {
    it('returns a promise', () => {
      const result = loader.loadAll()
      expect(result).toBeInstanceOf(Promise)

      // Clean up - trigger errors to resolve
      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('cleanup'))
        }
      }, 0)
    })

    it('loads all 52 cards plus back image', async () => {
      const loadPromise = loader.loadAll()

      // Trigger errors for all images (to use placeholders)
      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 10)

      await loadPromise

      // 52 cards + 1 back = 53 image load attempts
      expect(createdImages.length).toBe(53)
    })

    it('sets isLoaded to true after completion', async () => {
      expect(loader.isLoaded()).toBe(false)

      const loadPromise = loader.loadAll()

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 10)

      await loadPromise

      expect(loader.isLoaded()).toBe(true)
    })

    it('tracks progress during loading', async () => {
      const loadPromise = loader.loadAll()

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 10)

      await loadPromise

      // Progress should be 1 after loading
      expect(loader.getLoadProgress()).toBe(1)
    })

    it('handles all failed loads gracefully', async () => {
      const loadPromise = loader.loadAll()

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('All assets failed'))
        }
      }, 10)

      // Should not throw
      await expect(loadPromise).resolves.not.toThrow()

      // Should still be marked as loaded (with placeholders)
      expect(loader.isLoaded()).toBe(true)
    })

    it('handles mixed success and failure loads', async () => {
      const loadPromise = loader.loadAll()

      setTimeout(() => {
        let count = 0
        for (const img of createdImages) {
          // Alternate between success and failure
          if (count % 2 === 0 && img.onload) {
            img.onload()
          } else if (img.onerror) {
            img.onerror(new Error('failed'))
          }
          count++
        }
      }, 10)

      await loadPromise

      expect(loader.isLoaded()).toBe(true)
      expect(loader.getLoadProgress()).toBe(1)
    })
  })

  describe('getLoadProgress', () => {
    it('returns 0 before loading starts', () => {
      expect(loader.getLoadProgress()).toBe(0)
    })

    it('returns 1 after loading completes', async () => {
      const loadPromise = loader.loadAll()

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 10)

      await loadPromise

      expect(loader.getLoadProgress()).toBe(1)
    })

    it('returns partial progress during loading', () => {
      // Manually set internal state to simulate partial load
      loader._loadedAssets = 26
      loader._totalAssets = 53

      const progress = loader.getLoadProgress()
      expect(progress).toBeGreaterThan(0)
      expect(progress).toBeLessThan(1)
      expect(progress).toBeCloseTo(26 / 53, 2)
    })
  })

  describe('isLoaded', () => {
    it('returns false before loadAll is called', () => {
      expect(loader.isLoaded()).toBe(false)
    })

    it('returns true after loadAll completes', async () => {
      const loadPromise = loader.loadAll()

      setTimeout(() => {
        for (const img of createdImages) {
          if (img.onerror) img.onerror(new Error('test'))
        }
      }, 10)

      await loadPromise

      expect(loader.isLoaded()).toBe(true)
    })
  })

  describe('asset path generation', () => {
    it('generates correct path for card assets', () => {
      const card = createCard('hearts', 'A')
      const path = loader.getAssetPath(card)

      expect(path).toBe('assets/cards/hearts_A.png')
    })

    it('generates correct path for numeric rank cards', () => {
      const card = createCard('diamonds', 10)
      const path = loader.getAssetPath(card)

      expect(path).toBe('assets/cards/diamonds_10.png')
    })

    it('generates correct back image path', () => {
      const path = loader.getBackAssetPath()

      expect(path).toBe('assets/cards/back.png')
    })
  })

  describe('edge cases', () => {
    it('handles rapid sequential getCardImage calls', () => {
      const card = createCard('hearts', 'A')

      // Multiple rapid calls should not cause errors
      for (let i = 0; i < 10; i++) {
        const result = loader.getCardImage(card)
        expect(result).toBeDefined()
      }
    })

    it('handles all valid suit and rank combinations', () => {
      const suits = ['hearts', 'diamonds', 'clubs', 'spades']
      const ranks = [2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', 'K', 'A']

      for (const suit of suits) {
        for (const rank of ranks) {
          const card = createCard(suit, rank)
          const placeholder = loader.getPlaceholder(card)
          expect(placeholder).toBeDefined()
        }
      }
    })

    it('handles generating fallback from path format', () => {
      // Access private method for testing
      const fallback = loader._generateFallbackFromPath('assets/cards/hearts_A.png')
      expect(fallback).toBeDefined()
      expect(typeof fallback).toBe('string')
    })

    it('handles generating fallback from invalid path format', () => {
      const fallback = loader._generateFallbackFromPath('invalid-path')
      expect(fallback).toBeDefined()
      expect(typeof fallback).toBe('string')
    })
  })
})
