/**
 * @fileoverview Responsive Design Verification Tests
 *
 * Tests verify responsive design implementation in a Node.js environment by:
 * - Analyzing CSS media queries and breakpoints in styles.css
 * - Verifying touch target sizes meet WCAG 44x44px minimum
 * - Checking viewport meta tag configuration in index.html
 * - Verifying responsive utility classes and CSS custom properties
 *
 * Breakpoints tested:
 * - Mobile: 320px - 767px (default/base styles)
 * - Tablet: 768px - 1199px
 * - Desktop: 1200px+
 *
 * @module tests/responsive/ResponsiveDesign
 */

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

// =============================================================================
// TEST DATA SETUP
// =============================================================================

/** @type {string} */
let cssContent = ''
/** @type {string} */
let htmlContent = ''

/**
 * Responsive breakpoint definitions
 */
const BREAKPOINTS = {
  mobile: { min: 320, max: 767, label: 'Mobile (320px-767px)' },
  tablet: { min: 768, max: 1199, label: 'Tablet (768px-1199px)' },
  desktop: { min: 1200, max: Number.POSITIVE_INFINITY, label: 'Desktop (1200px+)' }
}

/**
 * WCAG touch target minimum size in pixels
 */
const TOUCH_TARGET_MIN = 44

/**
 * Extract all @media rules from CSS content
 * @param {string} css - CSS content
 * @returns {Array<{query: string, content: string}>}
 */
function extractMediaQueries(css) {
  const mediaQueries = []
  // Match @media followed by any content until the opening brace
  const mediaRegex = /@media\s+([^{]+)\{/g
  const matches = css.matchAll(mediaRegex)

  for (const match of matches) {
    const query = match[1].trim()
    const startIndex = match.index + match[0].length
    let braceCount = 1
    let endIndex = startIndex

    // Find matching closing brace
    for (let i = startIndex; i < css.length && braceCount > 0; i++) {
      if (css[i] === '{') braceCount++
      if (css[i] === '}') braceCount--
      endIndex = i
    }

    mediaQueries.push({
      query: query,
      content: css.slice(startIndex, endIndex)
    })
  }

  return mediaQueries
}

/**
 * Extract CSS custom properties from :root
 * @param {string} css - CSS content
 * @returns {Record<string, string>}
 */
function extractCSSVariables(css) {
  const variables = {}
  const rootMatch = css.match(/:root\s*\{([^}]+)\}/)

  if (rootMatch) {
    const rootContent = rootMatch[1]
    const varRegex = /--([\w-]+):\s*([^;]+);/g
    const matches = rootContent.matchAll(varRegex)

    for (const match of matches) {
      variables[`--${match[1]}`] = match[2].trim()
    }
  }

  return variables
}

/**
 * Check if a CSS rule contains a specific property
 * @param {string} css - CSS content
 * @param {string} selector - CSS selector
 * @param {string} property - CSS property
 * @returns {boolean}
 */
function hasPropertyForSelector(css, selector, property) {
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const selectorRegex = new RegExp(`${escapedSelector}[^{]*\\{([^}]+)\\}`, 'g')
  const matches = css.matchAll(selectorRegex)

  for (const match of matches) {
    if (match[1].includes(property)) {
      return true
    }
  }

  return false
}

/**
 * Extract HTML meta tags
 * @param {string} html - HTML content
 * @returns {Array<{name: string, content: string}>}
 */
function extractMetaTags(html) {
  const metaTags = []
  const metaRegex = /<meta\s+([^>]+)>/gi
  const matches = html.matchAll(metaRegex)

  for (const match of matches) {
    const attributes = match[1]
    const nameMatch = attributes.match(/name=["']([^"']+)["']/)
    const contentMatch = attributes.match(/content=["']([^"']+)["']/)

    if (nameMatch && contentMatch) {
      metaTags.push({
        name: nameMatch[1],
        content: contentMatch[1]
      })
    }

    // Also check for viewport without name attribute (uses attribute directly)
    if (attributes.includes('viewport')) {
      const viewportContent = contentMatch?.[1] || ''
      metaTags.push({
        name: 'viewport',
        content: viewportContent
      })
    }
  }

  return metaTags
}

/**
 * Check if HTML element has specific attribute
 * @param {string} html - HTML content
 * @param {string} tagName - HTML tag name
 * @param {string} attribute - Attribute to check
 * @returns {boolean}
 */
function hasElementWithAttribute(html, tagName, attribute) {
  const regex = new RegExp(`<${tagName}[^>]*${attribute}[^>]*>`, 'gi')
  return regex.test(html)
}

// =============================================================================
// TEST SETUP
// =============================================================================

beforeAll(() => {
  const projectRoot = resolve(import.meta.dirname, '..', '..')
  cssContent = readFileSync(resolve(projectRoot, 'css/styles.css'), 'utf-8')
  htmlContent = readFileSync(resolve(projectRoot, 'index.html'), 'utf-8')
})

// =============================================================================
// MEDIA QUERY BREAKPOINT TESTS
// =============================================================================

describe('Media Query Breakpoints', () => {
  describe('Tablet breakpoint (768px)', () => {
    it('has media query for tablet breakpoint at min-width: 768px', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const tabletQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('768')
      )

      expect(tabletQuery).toBeDefined()
      expect(tabletQuery?.query).toMatch(/min-width:\s*768px/)
    })

    it('tablet breakpoint modifies game-wrapper padding', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const tabletQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('768')
      )

      expect(tabletQuery?.content).toContain('.game-wrapper')
      expect(tabletQuery?.content).toContain('padding')
    })

    it('tablet breakpoint modifies game-header padding', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const tabletQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('768')
      )

      expect(tabletQuery?.content).toContain('.game-header')
    })

    it('tablet breakpoint modifies game-controls layout', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const tabletQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('768')
      )

      expect(tabletQuery?.content).toContain('.game-controls')
    })
  })

  describe('Desktop breakpoint (1200px)', () => {
    it('has media query for desktop breakpoint at min-width: 1200px', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const desktopQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('1200')
      )

      expect(desktopQuery).toBeDefined()
      expect(desktopQuery?.query).toMatch(/min-width:\s*1200px/)
    })

    it('desktop breakpoint modifies game-wrapper padding', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const desktopQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('1200')
      )

      expect(desktopQuery?.content).toContain('.game-wrapper')
    })

    it('desktop breakpoint modifies btn-action max-width', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const desktopQuery = mediaQueries.find(
        (mq) => mq.query.includes('min-width') && mq.query.includes('1200')
      )

      expect(desktopQuery?.content).toContain('.btn-action')
      expect(desktopQuery?.content).toContain('max-width')
    })
  })

  describe('Small mobile breakpoint (max-width: 374px)', () => {
    it('has media query for small mobile at max-width: 374px', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const smallMobileQuery = mediaQueries.find(
        (mq) => mq.query.includes('max-width') && mq.query.includes('374')
      )

      expect(smallMobileQuery).toBeDefined()
      expect(smallMobileQuery?.query).toMatch(/max-width:\s*374px/)
    })

    it('small mobile reduces padding for compact layout', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const smallMobileQuery = mediaQueries.find(
        (mq) => mq.query.includes('max-width') && mq.query.includes('374')
      )

      expect(smallMobileQuery?.content).toContain('.game-wrapper')
      expect(smallMobileQuery?.content).toContain('padding')
    })

    it('small mobile adjusts button sizes', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const smallMobileQuery = mediaQueries.find(
        (mq) => mq.query.includes('max-width') && mq.query.includes('374')
      )

      expect(smallMobileQuery?.content).toContain('.btn-bet')
    })
  })

  describe('Landscape orientation', () => {
    it('has media query for landscape orientation with max-height', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const landscapeQuery = mediaQueries.find(
        (mq) => mq.query.includes('orientation: landscape') && mq.query.includes('max-height')
      )

      expect(landscapeQuery).toBeDefined()
    })

    it('landscape mode adjusts header and controls for limited height', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const landscapeQuery = mediaQueries.find((mq) => mq.query.includes('orientation: landscape'))

      expect(landscapeQuery?.content).toContain('.game-header')
      expect(landscapeQuery?.content).toContain('.game-controls')
    })
  })
})

// =============================================================================
// TOUCH TARGET SIZE TESTS
// =============================================================================

describe('Touch Target Sizes (WCAG 44x44px minimum)', () => {
  it('defines --touch-target-min CSS variable as 44px', () => {
    const variables = extractCSSVariables(cssContent)
    expect(variables['--touch-target-min']).toBe('44px')
  })

  it('.btn class uses touch target minimum for min-width', () => {
    expect(cssContent).toMatch(/\.btn\s*\{[^}]*min-width:\s*var\(--touch-target-min\)/)
  })

  it('.btn class uses touch target minimum for min-height', () => {
    expect(cssContent).toMatch(/\.btn\s*\{[^}]*min-height:\s*var\(--touch-target-min\)/)
  })

  it('.btn-hand-count uses touch target minimum for width', () => {
    expect(cssContent).toMatch(/\.btn-hand-count\s*\{[^}]*width:\s*var\(--touch-target-min\)/)
  })

  it('.btn-hand-count uses touch target minimum for height', () => {
    expect(cssContent).toMatch(/\.btn-hand-count\s*\{[^}]*height:\s*var\(--touch-target-min\)/)
  })

  it('buttons have touch-action: manipulation for responsive touch', () => {
    expect(cssContent).toMatch(/\.btn\s*\{[^}]*touch-action:\s*manipulation/)
  })
})

// =============================================================================
// VIEWPORT META TAG TESTS
// =============================================================================

describe('Viewport Meta Tag', () => {
  it('has viewport meta tag', () => {
    expect(htmlContent).toMatch(/<meta[^>]*name=["']viewport["'][^>]*>/)
  })

  it('viewport includes width=device-width', () => {
    const viewportMatch = htmlContent.match(
      /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/
    )
    expect(viewportMatch?.[1]).toContain('width=device-width')
  })

  it('viewport includes initial-scale=1.0', () => {
    const viewportMatch = htmlContent.match(
      /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/
    )
    expect(viewportMatch?.[1]).toContain('initial-scale=1.0')
  })

  it('viewport allows user scaling (user-scalable=yes)', () => {
    const viewportMatch = htmlContent.match(
      /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/
    )
    expect(viewportMatch?.[1]).toContain('user-scalable=yes')
  })

  it('viewport includes maximum-scale for accessibility', () => {
    const viewportMatch = htmlContent.match(
      /<meta[^>]*name=["']viewport["'][^>]*content=["']([^"']+)["']/
    )
    expect(viewportMatch?.[1]).toContain('maximum-scale=5.0')
  })
})

// =============================================================================
// RESPONSIVE CSS CUSTOM PROPERTIES TESTS
// =============================================================================

describe('Responsive CSS Custom Properties', () => {
  describe('Fluid typography with clamp()', () => {
    it('--font-size-base uses clamp() for fluid sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--font-size-base']).toMatch(/clamp\([^)]+\)/)
    })

    it('--font-size-lg uses clamp() for fluid sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--font-size-lg']).toMatch(/clamp\([^)]+\)/)
    })

    it('--font-size-xl uses clamp() for fluid sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--font-size-xl']).toMatch(/clamp\([^)]+\)/)
    })

    it('--font-size-2xl uses clamp() for fluid sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--font-size-2xl']).toMatch(/clamp\([^)]+\)/)
    })
  })

  describe('Responsive card dimensions', () => {
    it('--card-width uses clamp() for responsive sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--card-width']).toMatch(/clamp\([^)]+\)/)
    })

    it('--card-height uses clamp() for responsive sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--card-height']).toMatch(/clamp\([^)]+\)/)
    })

    it('--card-overlap uses clamp() for responsive sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--card-overlap']).toMatch(/clamp\([^)]+\)/)
    })
  })

  describe('Responsive layout dimensions', () => {
    it('--header-height uses clamp() for responsive sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--header-height']).toMatch(/clamp\([^)]+\)/)
    })

    it('--controls-height uses clamp() for responsive sizing', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--controls-height']).toMatch(/clamp\([^)]+\)/)
    })

    it('--max-content-width is defined', () => {
      const variables = extractCSSVariables(cssContent)
      expect(variables['--max-content-width']).toBeDefined()
      expect(variables['--max-content-width']).toBe('1200px')
    })
  })

  describe('Spacing scale', () => {
    it('defines complete spacing scale (xs, sm, md, lg, xl, 2xl)', () => {
      const variables = extractCSSVariables(cssContent)

      expect(variables['--space-xs']).toBeDefined()
      expect(variables['--space-sm']).toBeDefined()
      expect(variables['--space-md']).toBeDefined()
      expect(variables['--space-lg']).toBeDefined()
      expect(variables['--space-xl']).toBeDefined()
      expect(variables['--space-2xl']).toBeDefined()
    })
  })
})

// =============================================================================
// RESPONSIVE LAYOUT STRUCTURE TESTS
// =============================================================================

describe('Responsive Layout Structure', () => {
  describe('Game wrapper', () => {
    it('uses CSS Grid for layout', () => {
      expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*display:\s*grid/)
    })

    it('uses grid-template-rows for vertical layout', () => {
      expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*grid-template-rows/)
    })

    it('uses 100dvh for dynamic viewport height support', () => {
      expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*min-height:\s*100dvh/)
    })

    it('constrains max-width with --max-content-width', () => {
      expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*max-width:\s*var\(--max-content-width\)/)
    })

    it('centers content with margin: 0 auto', () => {
      expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*margin:\s*0\s*auto/)
    })
  })

  describe('Game table', () => {
    it('uses CSS Grid for layout', () => {
      expect(cssContent).toMatch(/\.game-table\s*\{[^}]*display:\s*grid/)
    })

    it('uses grid-template-rows for dealer/cards/player layout', () => {
      expect(cssContent).toMatch(/\.game-table\s*\{[^}]*grid-template-rows/)
    })
  })

  describe('Control groups', () => {
    it('control-group uses flexbox', () => {
      expect(cssContent).toMatch(/\.control-group\s*\{[^}]*display:\s*flex/)
    })

    it('control-group uses flex-wrap: wrap for responsive layout', () => {
      expect(cssContent).toMatch(/\.control-group\s*\{[^}]*flex-wrap:\s*wrap/)
    })

    it('control-group centers content', () => {
      expect(cssContent).toMatch(/\.control-group\s*\{[^}]*justify-content:\s*center/)
    })
  })

  describe('Player hands', () => {
    it('player-hands container uses flexbox', () => {
      expect(cssContent).toMatch(/\.player-hands\s*\{[^}]*display:\s*flex/)
    })

    it('player-hands wraps for responsive layout', () => {
      expect(cssContent).toMatch(/\.player-hands\s*\{[^}]*flex-wrap:\s*wrap/)
    })

    it('player-hand uses clamp() for responsive min-width', () => {
      expect(cssContent).toMatch(/\.player-hand\s*\{[^}]*min-width:\s*clamp\([^)]+\)/)
    })
  })

  describe('Card container', () => {
    it('card-container uses flexbox', () => {
      expect(cssContent).toMatch(/\.card-container\s*\{[^}]*display:\s*flex/)
    })

    it('card-container wraps for multiple cards', () => {
      expect(cssContent).toMatch(/\.card-container\s*\{[^}]*flex-wrap:\s*wrap/)
    })

    it('card-container uses min-height with --card-height variable', () => {
      expect(cssContent).toMatch(/\.card-container\s*\{[^}]*min-height:\s*var\(--card-height\)/)
    })
  })
})

// =============================================================================
// RESPONSIVE UTILITY CLASSES TESTS
// =============================================================================

describe('Responsive Utility Classes', () => {
  describe('Hidden utility', () => {
    it('defines .hidden class with display: none', () => {
      expect(cssContent).toMatch(/\.hidden\s*\{[^}]*display:\s*none\s*!important/)
    })
  })

  describe('Invisible utility', () => {
    it('defines .invisible class with visibility: hidden', () => {
      expect(cssContent).toMatch(/\.invisible\s*\{[^}]*visibility:\s*hidden/)
    })
  })

  describe('Screen reader only', () => {
    it('defines .sr-only class for accessibility', () => {
      expect(cssContent).toMatch(/\.sr-only[^{]*\{/)
    })

    it('.sr-only uses position: absolute', () => {
      expect(cssContent).toMatch(/\.sr-only[^{]*\{[^}]*position:\s*absolute/)
    })

    it('defines .visually-hidden as alias', () => {
      expect(cssContent).toMatch(/\.visually-hidden[^{]*\{/)
    })
  })
})

// =============================================================================
// HTML RESPONSIVE STRUCTURE TESTS
// =============================================================================

describe('HTML Responsive Structure', () => {
  describe('Semantic structure', () => {
    it('uses <header> for game header', () => {
      expect(htmlContent).toMatch(/<header[^>]*class="[^"]*game-header[^"]*"/)
    })

    it('uses <main> for game content', () => {
      expect(htmlContent).toMatch(/<main[^>]*class="[^"]*game-main[^"]*"/)
    })

    it('uses <footer> for game controls', () => {
      expect(htmlContent).toMatch(/<footer[^>]*class="[^"]*game-controls[^"]*"/)
    })

    it('uses <section> for dealer and player areas', () => {
      expect(htmlContent).toMatch(/<section[^>]*class="[^"]*dealer-section[^"]*"/)
      expect(htmlContent).toMatch(/<section[^>]*class="[^"]*player-section[^"]*"/)
    })
  })

  describe('Accessibility attributes', () => {
    it('has aria-label on dealer section', () => {
      expect(htmlContent).toMatch(/<section[^>]*class="[^"]*dealer-section[^"]*"[^>]*aria-label/)
    })

    it('has aria-label on player section', () => {
      expect(htmlContent).toMatch(/<section[^>]*class="[^"]*player-section[^"]*"[^>]*aria-label/)
    })

    it('has role="status" with aria-live for announcements', () => {
      expect(htmlContent).toMatch(/<div[^>]*role="status"[^>]*aria-live="polite"/)
    })

    it('has skip link for keyboard navigation', () => {
      // Skip link has href before class in the HTML
      expect(htmlContent).toMatch(/<a[^>]*href="#main-content"[^>]*class="[^"]*skip-link[^"]*"/)
    })

    it('main content has id for skip link target', () => {
      expect(htmlContent).toMatch(/<main[^>]*id="main-content"/)
    })
  })

  describe('Button accessibility', () => {
    it('bet buttons have aria-label', () => {
      expect(htmlContent).toMatch(/<button[^>]*data-bet="10"[^>]*aria-label="Bet \$10"/)
    })

    it('hand count buttons have aria-pressed', () => {
      expect(htmlContent).toMatch(/<button[^>]*data-hands="1"[^>]*aria-pressed/)
    })
  })

  describe('Control groups', () => {
    it('has betting controls group', () => {
      // Control groups have class before id in the HTML
      expect(htmlContent).toMatch(
        /<div[^>]*class="[^"]*betting-controls[^"]*"[^>]*id="bettingControls"/
      )
    })

    it('has action controls group', () => {
      expect(htmlContent).toMatch(
        /<div[^>]*class="[^"]*action-controls[^"]*"[^>]*id="actionControls"/
      )
    })

    it('has insurance controls group', () => {
      expect(htmlContent).toMatch(
        /<div[^>]*class="[^"]*insurance-controls[^"]*"[^>]*id="insuranceControls"/
      )
    })

    it('has new round controls group', () => {
      expect(htmlContent).toMatch(
        /<div[^>]*class="[^"]*new-round-controls[^"]*"[^>]*id="newRoundControls"/
      )
    })
  })

  describe('Multi-hand support', () => {
    it('has container for multiple player hands', () => {
      expect(htmlContent).toMatch(/<div[^>]*class="[^"]*player-hands[^"]*"[^>]*id="playerHands"/)
    })

    it('has three player hand elements', () => {
      expect(htmlContent).toMatch(/id="playerHand0"/)
      expect(htmlContent).toMatch(/id="playerHand1"/)
      expect(htmlContent).toMatch(/id="playerHand2"/)
    })

    it('player hands have data-hand-index attributes', () => {
      expect(htmlContent).toMatch(/data-hand-index="0"/)
      expect(htmlContent).toMatch(/data-hand-index="1"/)
      expect(htmlContent).toMatch(/data-hand-index="2"/)
    })
  })
})

// =============================================================================
// ACCESSIBILITY MEDIA QUERY TESTS
// =============================================================================

describe('Accessibility Media Queries', () => {
  describe('Reduced motion support', () => {
    it('has prefers-reduced-motion media query', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const reducedMotionQuery = mediaQueries.find((mq) =>
        mq.query.includes('prefers-reduced-motion')
      )

      expect(reducedMotionQuery).toBeDefined()
    })

    it('reduced motion disables animations', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const reducedMotionQuery = mediaQueries.find((mq) =>
        mq.query.includes('prefers-reduced-motion')
      )

      expect(reducedMotionQuery?.content).toMatch(/animation-duration:\s*0\.01ms/)
    })

    it('reduced motion disables transitions', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const reducedMotionQuery = mediaQueries.find((mq) =>
        mq.query.includes('prefers-reduced-motion')
      )

      expect(reducedMotionQuery?.content).toMatch(/transition-duration:\s*0\.01ms/)
    })
  })

  describe('High contrast support', () => {
    it('has prefers-contrast: high media query', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const highContrastQuery = mediaQueries.find((mq) => mq.query.includes('prefers-contrast'))

      expect(highContrastQuery).toBeDefined()
    })

    it('high contrast mode increases button border width', () => {
      const mediaQueries = extractMediaQueries(cssContent)
      const highContrastQuery = mediaQueries.find((mq) => mq.query.includes('prefers-contrast'))

      expect(highContrastQuery?.content).toContain('.btn')
      expect(highContrastQuery?.content).toContain('border-width')
    })
  })

  describe('Dark/Light mode support', () => {
    it('has prefers-color-scheme media query for dark mode', () => {
      expect(cssContent).toMatch(/@media\s*\([^)]*prefers-color-scheme:\s*dark[^)]*\)/)
    })

    it('has prefers-color-scheme media query for light mode', () => {
      expect(cssContent).toMatch(/@media\s*\([^)]*prefers-color-scheme:\s*light[^)]*\)/)
    })
  })
})

// =============================================================================
// OVERFLOW PREVENTION TESTS
// =============================================================================

describe('Overflow Prevention (No Horizontal Scroll)', () => {
  it('game-main has overflow: hidden', () => {
    expect(cssContent).toMatch(/\.game-main\s*\{[^}]*overflow:\s*hidden/)
  })

  it('canvas-container has overflow: hidden', () => {
    expect(cssContent).toMatch(/\.canvas-container\s*\{[^}]*overflow:\s*hidden/)
  })

  it('images use max-width: 100%', () => {
    expect(cssContent).toMatch(/img[^{]*\{[^}]*max-width:\s*100%/)
  })

  it('box-sizing: border-box is set globally', () => {
    expect(cssContent).toMatch(/\*[^{]*\{[^}]*box-sizing:\s*border-box/)
  })
})

// =============================================================================
// MOBILE-FIRST APPROACH VERIFICATION
// =============================================================================

describe('Mobile-First Approach', () => {
  it('base styles (no media query) are mobile-optimized', () => {
    // Base .game-wrapper should have small padding
    expect(cssContent).toMatch(/\.game-wrapper\s*\{[^}]*padding:\s*var\(--space-sm\)/)
  })

  it('tablet breakpoint uses min-width (progressive enhancement)', () => {
    const mediaQueries = extractMediaQueries(cssContent)
    const tabletQuery = mediaQueries.find((mq) => mq.query.includes('768'))

    expect(tabletQuery?.query).toContain('min-width')
  })

  it('desktop breakpoint uses min-width (progressive enhancement)', () => {
    const mediaQueries = extractMediaQueries(cssContent)
    const desktopQuery = mediaQueries.find((mq) => mq.query.includes('1200'))

    expect(desktopQuery?.query).toContain('min-width')
  })

  it('CSS comments document the mobile-first approach', () => {
    expect(cssContent).toMatch(/Mobile-first/i)
  })

  it('CSS comments document breakpoint values', () => {
    expect(cssContent).toMatch(/320px/i)
    expect(cssContent).toMatch(/768px/i)
    expect(cssContent).toMatch(/1200px/i)
  })
})
