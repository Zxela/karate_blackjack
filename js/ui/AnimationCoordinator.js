/**
 * @fileoverview Animation coordinator for Karate Blackjack game.
 *
 * This module bridges game actions with canvas-based animations for card dealing,
 * chip movement, and win/lose feedback. Uses a hybrid approach where canvas handles
 * transitional animations and DOM displays final card states.
 *
 * @module ui/AnimationCoordinator
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Animation timing constants in milliseconds.
 * @type {Object}
 */
const TIMING = {
  CARD_DEAL: 250,
  CARD_STAGGER: 150,
  CHIP_MOVE: 200,
  RESULT_SHOW: 400,
  DEALER_PAUSE: 600,
  BETWEEN_HANDS: 300
}

/**
 * Chip colors by denomination.
 * @type {Object}
 */
const CHIP_COLORS = {
  10: '#1E90FF',
  50: '#DC143C',
  100: '#228B22',
  500: '#800080'
}

/**
 * Canvas positions for game elements.
 * @type {Object}
 */
const POSITIONS = {
  DECK: { x: 720, y: 50 },
  DEALER: { x: 400, y: 30 },
  CHIP_SOURCE: { x: 100, y: 380 }
}

/**
 * Card dimensions on canvas.
 * @type {Object}
 */
const CARD_DIMS = {
  WIDTH: 70,
  HEIGHT: 98,
  OVERLAP: 25
}

// =============================================================================
// ANIMATION COORDINATOR CLASS
// =============================================================================

/**
 * Coordinates animations between game logic and visual presentation.
 *
 * AnimationCoordinator handles the visual feedback for game actions including
 * card dealing, chip movement, and result displays. It uses canvas for smooth
 * transitional animations while maintaining DOM-based card displays.
 *
 * @class AnimationCoordinator
 */
export class AnimationCoordinator {
  /**
   * Creates a new AnimationCoordinator instance.
   *
   * @param {HTMLCanvasElement} canvas - The canvas element for animations
   * @param {Object} elements - DOM element references
   */
  constructor(canvas, elements) {
    /** @private */
    this._canvas = canvas

    /** @private */
    this._ctx = canvas.getContext('2d')

    /** @private */
    this._elements = elements

    /** @private */
    this._animationsEnabled = true

    /** @private */
    this._activeAnimations = new Set()

    /** @private */
    this._animationIdCounter = 0

    /**
     * Chips currently displayed on the table per hand
     * @private
     * @type {Array<Array<{value: number, x: number, y: number}>>}
     */
    this._tableChips = [[], [], []]

    /**
     * Current hand count for chip positioning
     * @private
     */
    this._handCount = 1

    /**
     * Whether to show house rules on canvas
     * @private
     */
    this._showingRules = false

    // Check for reduced motion preference
    this._checkReducedMotion()
  }

  // ===========================================================================
  // PUBLIC METHODS - CHIP DISPLAY
  // ===========================================================================

  /**
   * Adds a chip to the table display with animation.
   * Called when user clicks bet buttons.
   *
   * @param {number} amount - Chip amount to add
   * @param {number} handIndex - Which hand to add chip to
   * @param {number} handCount - Total number of hands being played
   * @returns {Promise<void>}
   */
  async addChipToTable(amount, handIndex, handCount) {
    this._handCount = handCount

    const chips = this._breakIntoChips(amount)
    const targetPos = this._getChipTargetPosition(handIndex)

    for (const chip of chips) {
      // Calculate chip position with stacking offset
      const stackOffset = this._tableChips[handIndex].length * 4
      const chipX = targetPos.x + (this._tableChips[handIndex].length % 3) * 15
      const chipY = targetPos.y - stackOffset

      if (this._animationsEnabled) {
        // Animate chip flying to table
        await this._animateChipToTable(chip.value, POSITIONS.CHIP_SOURCE, { x: chipX, y: chipY })
      }

      // Add chip to table state
      this._tableChips[handIndex].push({ value: chip.value, x: chipX, y: chipY })

      // Redraw all table chips
      this._redrawTableChips()
    }
  }

  /**
   * Clears all chips from a specific hand.
   *
   * @param {number} handIndex - Which hand to clear
   */
  clearHandChips(handIndex) {
    this._tableChips[handIndex] = []
    this._redrawTableChips()
  }

  /**
   * Clears all chips from all hands.
   */
  clearAllChips() {
    this._tableChips = [[], [], []]
    this._clearCanvas()
  }

  /**
   * Sets the current hand count for positioning.
   *
   * @param {number} count - Number of hands
   */
  setHandCount(count) {
    this._handCount = count
  }

  // ===========================================================================
  // PUBLIC METHODS - CARD ANIMATIONS
  // ===========================================================================

  /**
   * Animates the initial deal sequence with casino-style alternating pattern.
   *
   * @param {Array} playerHands - Array of player hand objects
   * @param {Object} dealerHand - Dealer hand object
   * @param {number} handCount - Number of player hands
   * @param {Function} updateUI - Callback to update DOM after each card
   * @returns {Promise<void>}
   */
  async animateInitialDeal(playerHands, dealerHand, handCount, updateUI) {
    if (!this._animationsEnabled) {
      return
    }

    this._handCount = handCount

    // Hide all DOM cards during animation
    this._hideAllCards()

    // Track how many cards have been dealt to each position
    const dealtCards = {
      dealer: 0,
      players: new Array(handCount).fill(0)
    }

    // Calculate player hand positions
    const playerPositions = this._calculatePlayerPositions(handCount)

    // Round 1: First card to each position (alternating)
    for (let i = 0; i < handCount; i++) {
      const card = playerHands[i]?.cards?.[0]
      if (card) {
        await this._animateCardDeal(card, playerPositions[i], 0, true)
        dealtCards.players[i] = 1
        this._showDealtCards(dealtCards, handCount)
        if (updateUI) updateUI()
        await this._delay(TIMING.CARD_STAGGER)
      }
    }

    // Dealer's first card (face down - hole card)
    if (dealerHand?.cards?.[0]) {
      await this._animateCardDeal(dealerHand.cards[0], POSITIONS.DEALER, 0, false)
      dealtCards.dealer = 1
      this._showDealtCards(dealtCards, handCount)
      if (updateUI) updateUI()
      await this._delay(TIMING.CARD_STAGGER)
    }

    // Round 2: Second card to each position
    for (let i = 0; i < handCount; i++) {
      const card = playerHands[i]?.cards?.[1]
      if (card) {
        await this._animateCardDeal(card, playerPositions[i], 1, true)
        dealtCards.players[i] = 2
        this._showDealtCards(dealtCards, handCount)
        if (updateUI) updateUI()
        await this._delay(TIMING.CARD_STAGGER)
      }
    }

    // Dealer's second card (face up)
    if (dealerHand?.cards?.[1]) {
      await this._animateCardDeal(dealerHand.cards[1], POSITIONS.DEALER, 1, true)
      dealtCards.dealer = 2
      this._showDealtCards(dealtCards, handCount)
      if (updateUI) updateUI()
    }

    // Show all cards now that animation is complete
    this._showAllCards()

    // Redraw table chips (cards are now in DOM)
    this._redrawTableChips()
  }

  /**
   * Animates a hit (new card dealt to player hand).
   *
   * @param {Object} card - The card being dealt
   * @param {number} handIndex - Index of the player hand
   * @param {number} cardIndex - Position in the hand
   * @param {Function} updateUI - Callback to update DOM after animation
   * @returns {Promise<void>}
   */
  async animateHit(card, handIndex, cardIndex, updateUI) {
    if (!this._animationsEnabled) {
      return
    }

    const playerPositions = this._calculatePlayerPositions(this._handCount)
    const targetPos = playerPositions[handIndex] || playerPositions[0]

    await this._animateCardDeal(card, targetPos, cardIndex, true)
    if (updateUI) updateUI()

    // Redraw table chips
    this._redrawTableChips()
  }

  /**
   * Animates the dealer revealing their hole card.
   *
   * @param {Object} dealerHand - Dealer hand object
   * @returns {Promise<void>}
   */
  async animateDealerReveal(dealerHand) {
    if (!this._animationsEnabled) {
      return
    }

    await this._delay(TIMING.DEALER_PAUSE)

    // Draw a flip animation effect
    const holeCard = dealerHand?.cards?.[0]
    if (holeCard) {
      await this._animateCardFlip(holeCard, POSITIONS.DEALER, 0)
    }

    this._redrawTableChips()
  }

  /**
   * Animates a dealer hit (new card dealt to dealer).
   *
   * @param {Object} card - The card being dealt
   * @param {number} cardIndex - Position in the dealer's hand
   * @param {Function} updateUI - Callback to update DOM
   * @returns {Promise<void>}
   */
  async animateDealerHit(card, cardIndex, updateUI) {
    if (!this._animationsEnabled) {
      return
    }

    await this._animateCardDeal(card, POSITIONS.DEALER, cardIndex, true)
    if (updateUI) updateUI()
    await this._delay(TIMING.CARD_STAGGER)

    this._redrawTableChips()
  }

  // ===========================================================================
  // PUBLIC METHODS - CHIP ANIMATIONS (END OF ROUND)
  // ===========================================================================

  /**
   * Animates chips moving from balance to betting area.
   * Used during deal when bets are locked in.
   *
   * @param {number} amount - Bet amount
   * @param {number} handIndex - Index of the player hand
   * @returns {Promise<void>}
   */
  async animateBetPlacement(amount, handIndex) {
    // Chips should already be on table from addChipToTable calls
    // This is called during deal - just ensure chips are visible
    this._redrawTableChips()
  }

  /**
   * Animates chips returning to balance on win.
   * First adds winning chips from dealer, then all chips fly to balance.
   *
   * @param {number} amount - Win amount (total payout including original bet)
   * @param {number} handIndex - Index of the player hand
   * @returns {Promise<void>}
   */
  async animateWinPayout(amount, handIndex) {
    if (!this._animationsEnabled || this._tableChips[handIndex].length === 0) {
      this._tableChips[handIndex] = []
      this._redrawTableChips()
      return
    }

    // Calculate winnings (payout minus original bet = profit)
    const originalBet = this._tableChips[handIndex].reduce((sum, c) => sum + c.value, 0)
    const winnings = amount - originalBet

    // Animate winning chips flying in from dealer
    if (winnings > 0) {
      const winChips = this._breakIntoChips(winnings)
      const targetPos = this._getChipTargetPosition(handIndex)
      const dealerPos = { x: this._canvas.width - 100, y: 50 }

      for (const chip of winChips) {
        const stackOffset = this._tableChips[handIndex].length * 4
        const chipX = targetPos.x + (this._tableChips[handIndex].length % 3) * 15
        const chipY = targetPos.y - stackOffset

        await this._animateChipToTable(chip.value, dealerPos, { x: chipX, y: chipY })
        this._tableChips[handIndex].push({ value: chip.value, x: chipX, y: chipY })
        this._redrawTableChips()
      }

      // Brief pause to show the doubled chips
      await this._delay(300)
    }

    // Animate all chips flying back to balance
    const chips = [...this._tableChips[handIndex]]

    for (const chip of chips) {
      await this._animateChipAway(chip, POSITIONS.CHIP_SOURCE, 100)
      this._tableChips[handIndex] = this._tableChips[handIndex].filter((c) => c !== chip)
      this._redrawTableChips()
    }
  }

  /**
   * Animates chips being taken by the dealer on loss.
   *
   * @param {number} amount - Lost amount
   * @param {number} handIndex - Index of the player hand
   * @returns {Promise<void>}
   */
  async animateLoss(amount, handIndex) {
    if (!this._animationsEnabled || this._tableChips[handIndex].length === 0) {
      this._tableChips[handIndex] = []
      this._redrawTableChips()
      return
    }

    // Animate chips sliding to the dealer (top right)
    const chips = [...this._tableChips[handIndex]]
    const dealerCollect = { x: this._canvas.width - 100, y: 50 }

    for (const chip of chips) {
      await this._animateChipAway(chip, dealerCollect, 120)
      this._tableChips[handIndex] = this._tableChips[handIndex].filter((c) => c !== chip)
      this._redrawTableChips()
    }
  }

  // ===========================================================================
  // PUBLIC METHODS - RESULT ANIMATIONS
  // ===========================================================================

  /**
   * Animates the result display for a single hand.
   *
   * @param {number} handIndex - Index of the player hand
   * @param {string} outcome - Result: 'win', 'lose', 'bust', 'blackjack', 'push'
   * @param {string} message - Message to display
   * @returns {Promise<void>}
   */
  async animateHandResult(handIndex, outcome, message) {
    const handEl = this._elements.playerHand(handIndex)
    const resultEl = document.getElementById(`handResult${handIndex}`)

    if (!handEl) return

    // Add result class to hand for glow effect
    handEl.classList.remove('result-win', 'result-lose', 'result-blackjack', 'result-push')

    const classMap = {
      win: 'result-win',
      lose: 'result-lose',
      bust: 'result-lose',
      blackjack: 'result-blackjack',
      push: 'result-push'
    }

    const resultClass = classMap[outcome] || 'result-lose'
    handEl.classList.add(resultClass)

    // Show result message if element exists
    if (resultEl) {
      resultEl.textContent = message
      resultEl.className = 'hand-result'
      resultEl.classList.add(outcome)

      // Trigger reflow for animation
      void resultEl.offsetWidth
      resultEl.classList.add('show')
    }

    if (this._animationsEnabled) {
      await this._delay(TIMING.RESULT_SHOW)
    }
  }

  /**
   * Animates results for all hands at end of round.
   *
   * @param {Array} results - Array of result objects { handIndex, outcome, message, payout }
   * @returns {Promise<void>}
   */
  async animateGameResult(results) {
    for (const result of results) {
      await this.animateHandResult(result.handIndex, result.outcome, result.message)

      // Animate chip movement based on outcome
      if (result.outcome === 'win' || result.outcome === 'blackjack') {
        await this.animateWinPayout(result.payout || 0, result.handIndex)
      } else if (result.outcome === 'lose' || result.outcome === 'bust') {
        await this.animateLoss(result.bet || 0, result.handIndex)
      } else if (result.outcome === 'push') {
        // Push - chips stay, just clear them
        this._tableChips[result.handIndex] = []
        this._redrawTableChips()
      }

      if (this._animationsEnabled) {
        await this._delay(TIMING.BETWEEN_HANDS)
      }
    }
  }

  /**
   * Clears result displays from all hands (does NOT clear chips).
   */
  clearResults() {
    for (let i = 0; i < 3; i++) {
      const handEl = this._elements.playerHand(i)
      const resultEl = document.getElementById(`handResult${i}`)

      if (handEl) {
        handEl.classList.remove('result-win', 'result-lose', 'result-blackjack', 'result-push')
      }

      if (resultEl) {
        resultEl.classList.remove('show')
        resultEl.textContent = ''
      }
    }
  }

  // ===========================================================================
  // PUBLIC METHODS - CONFIGURATION
  // ===========================================================================

  /**
   * Enables animations.
   */
  enableAnimations() {
    this._animationsEnabled = true
  }

  /**
   * Disables animations for accessibility.
   */
  disableAnimations() {
    this._animationsEnabled = false
  }

  /**
   * Checks if animations are currently enabled.
   *
   * @returns {boolean}
   */
  isEnabled() {
    return this._animationsEnabled
  }

  /**
   * Stops all active animations.
   */
  stop() {
    this._activeAnimations.clear()
    this._clearCanvas()
  }

  // ===========================================================================
  // PRIVATE METHODS - ANIMATION HELPERS
  // ===========================================================================

  /**
   * Animates a single card dealing from deck to target position.
   *
   * @param {Object} card - Card to animate
   * @param {Object} targetPos - Target position { x, y }
   * @param {number} cardIndex - Index in hand (for offset)
   * @param {boolean} faceUp - Whether to show card face
   * @returns {Promise<void>}
   * @private
   */
  async _animateCardDeal(card, targetPos, cardIndex, faceUp) {
    const startX = POSITIONS.DECK.x
    const startY = POSITIONS.DECK.y
    const endX = targetPos.x + cardIndex * (CARD_DIMS.WIDTH - CARD_DIMS.OVERLAP)
    const endY = targetPos.y

    const animationId = ++this._animationIdCounter
    this._activeAnimations.add(animationId)

    return new Promise((resolve) => {
      const startTime = performance.now()

      const animate = (currentTime) => {
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / TIMING.CARD_DEAL, 1)

        // Ease-out easing
        const easeProgress = 1 - (1 - progress) ** 3

        const currentX = startX + (endX - startX) * easeProgress
        const currentY = startY + (endY - startY) * easeProgress

        // Clear and redraw table chips + animating card
        this._clearCanvas()
        this._drawAllTableChips()
        this._drawCard(card, currentX, currentY, faceUp)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          this._activeAnimations.delete(animationId)
          // Final redraw without the card (DOM will show it)
          this._redrawTableChips()
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  /**
   * Animates a card flip.
   *
   * @param {Object} card - Card to flip
   * @param {Object} position - Position { x, y }
   * @param {number} cardIndex - Index in hand
   * @returns {Promise<void>}
   * @private
   */
  async _animateCardFlip(card, position, cardIndex) {
    const x = position.x + cardIndex * (CARD_DIMS.WIDTH - CARD_DIMS.OVERLAP)
    const y = position.y
    const duration = 200

    const animationId = ++this._animationIdCounter
    this._activeAnimations.add(animationId)

    return new Promise((resolve) => {
      const startTime = performance.now()

      const animate = (currentTime) => {
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Scale effect for flip
        const scaleX = Math.abs(Math.cos(progress * Math.PI))

        this._clearCanvas()
        this._drawAllTableChips()

        // Draw card with scale
        this._ctx.save()
        this._ctx.translate(x + CARD_DIMS.WIDTH / 2, y)
        this._ctx.scale(scaleX, 1)

        const showFace = progress > 0.5
        this._drawCard(card, -CARD_DIMS.WIDTH / 2, 0, showFace)

        this._ctx.restore()

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

  /**
   * Animates a chip flying to the table.
   *
   * @param {number} value - Chip value
   * @param {Object} from - Start position
   * @param {Object} to - End position
   * @returns {Promise<void>}
   * @private
   */
  async _animateChipToTable(value, from, to) {
    const duration = TIMING.CHIP_MOVE
    const animationId = ++this._animationIdCounter
    this._activeAnimations.add(animationId)

    return new Promise((resolve) => {
      const startTime = performance.now()

      const animate = (currentTime) => {
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease-out
        const easeProgress = 1 - (1 - progress) ** 3

        const currentX = from.x + (to.x - from.x) * easeProgress
        const currentY = from.y + (to.y - from.y) * easeProgress

        this._clearCanvas()
        this._drawAllTableChips()
        this._drawChip(currentX, currentY, value)

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

  /**
   * Animates a chip moving away from the table.
   *
   * @param {Object} chip - Chip object with position
   * @param {Object} to - Target position
   * @param {number} duration - Animation duration
   * @returns {Promise<void>}
   * @private
   */
  async _animateChipAway(chip, to, duration) {
    const animationId = ++this._animationIdCounter
    this._activeAnimations.add(animationId)
    const from = { x: chip.x, y: chip.y }

    return new Promise((resolve) => {
      const startTime = performance.now()

      const animate = (currentTime) => {
        if (!this._activeAnimations.has(animationId)) {
          resolve()
          return
        }

        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)

        // Ease-out
        const easeProgress = 1 - (1 - progress) ** 3

        const currentX = from.x + (to.x - from.x) * easeProgress
        const currentY = from.y + (to.y - from.y) * easeProgress

        // Update chip position temporarily for drawing
        chip.x = currentX
        chip.y = currentY

        this._clearCanvas()
        this._drawAllTableChips()

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
  // PRIVATE METHODS - DRAWING HELPERS
  // ===========================================================================

  /**
   * Gets the target position for chips on a hand.
   *
   * @param {number} handIndex - Hand index
   * @returns {{x: number, y: number}}
   * @private
   */
  _getChipTargetPosition(handIndex) {
    const canvasWidth = this._canvas.width
    const chipY = 350

    if (this._handCount === 1) {
      return { x: canvasWidth / 2 - 20, y: chipY }
    }

    if (this._handCount === 2) {
      const positions = [canvasWidth / 3, (canvasWidth * 2) / 3]
      return { x: positions[handIndex] - 20, y: chipY }
    }

    // 3 hands
    const positions = [canvasWidth / 4, canvasWidth / 2, (canvasWidth * 3) / 4]
    return { x: positions[handIndex] - 20, y: chipY }
  }

  /**
   * Redraws all table chips (and rules if showing).
   * @private
   */
  _redrawTableChips() {
    this._clearCanvas()
    this._drawAllTableChips()
    // Redraw rules if they should be showing
    if (this._showingRules) {
      this._drawRulesPanel()
    }
  }

  /**
   * Draws all chips currently on the table.
   * @private
   */
  _drawAllTableChips() {
    for (let handIndex = 0; handIndex < 3; handIndex++) {
      for (const chip of this._tableChips[handIndex]) {
        this._drawChip(chip.x, chip.y, chip.value)
      }
    }
  }

  /**
   * Draws a card on the canvas.
   *
   * @param {Object} card - Card object with suit and rank
   * @param {number} x - X position
   * @param {number} y - Y position
   * @param {boolean} faceUp - Whether to show face
   * @private
   */
  _drawCard(card, x, y, faceUp) {
    const ctx = this._ctx
    const width = CARD_DIMS.WIDTH
    const height = CARD_DIMS.HEIGHT
    const radius = 6

    // Card shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2

    // Card background
    ctx.fillStyle = faceUp ? '#f8f8f8' : '#1a1a2e'
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.fill()

    ctx.restore()

    // Card border
    ctx.strokeStyle = faceUp ? '#333' : '#d4af37'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.roundRect(x, y, width, height, radius)
    ctx.stroke()

    if (faceUp && card) {
      // Draw card content
      const suitSymbols = {
        hearts: '\u2665',
        diamonds: '\u2666',
        clubs: '\u2663',
        spades: '\u2660'
      }
      const suitColors = {
        hearts: '#c41e3a',
        diamonds: '#c41e3a',
        clubs: '#1a1a2e',
        spades: '#1a1a2e'
      }

      const symbol = suitSymbols[card.suit] || '\u2665'
      const color = suitColors[card.suit] || '#1a1a2e'

      ctx.fillStyle = color
      ctx.font = 'bold 16px Georgia, serif'
      ctx.textAlign = 'center'
      ctx.fillText(card.rank, x + width / 2, y + 22)

      ctx.font = '24px Georgia, serif'
      ctx.fillText(symbol, x + width / 2, y + height / 2 + 8)
    } else if (!faceUp) {
      // Card back design with karate logo
      // Inner red gradient background
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height)
      gradient.addColorStop(0, '#8b1428')
      gradient.addColorStop(0.5, '#c41e3a')
      gradient.addColorStop(1, '#8b1428')

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 4)
      ctx.fill()

      // Gold border inside
      ctx.strokeStyle = '#d4af37'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.roundRect(x + 4, y + 4, width - 8, height - 8, 4)
      ctx.stroke()

      // Draw karate figure logo
      this._drawKarateLogo(x + width / 2, y + height / 2, Math.min(width, height) * 0.35)
    }
  }

  /**
   * Draws a chip on the canvas.
   *
   * @param {number} x - X position (center)
   * @param {number} y - Y position (center)
   * @param {number} value - Chip denomination
   * @private
   */
  _drawChip(x, y, value) {
    const ctx = this._ctx
    const radius = 20

    // Determine chip color
    const color = CHIP_COLORS[value] || CHIP_COLORS[10]

    // Chip shadow
    ctx.save()
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)'
    ctx.shadowBlur = 4
    ctx.shadowOffsetY = 2

    // Chip body
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()

    ctx.restore()

    // Chip edge
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(x, y, radius - 3, 0, Math.PI * 2)
    ctx.stroke()

    // Chip value
    ctx.fillStyle = '#fff'
    ctx.font = 'bold 12px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(`$${value}`, x, y)
  }

  // ===========================================================================
  // PRIVATE METHODS - UTILITY
  // ===========================================================================

  /**
   * Calculates player hand positions based on hand count.
   *
   * @param {number} handCount - Number of hands
   * @returns {Array<{x: number, y: number}>}
   * @private
   */
  _calculatePlayerPositions(handCount) {
    const canvasWidth = this._canvas.width
    const playerY = 180

    if (handCount === 1) {
      return [{ x: canvasWidth / 2 - CARD_DIMS.WIDTH, y: playerY }]
    }

    if (handCount === 2) {
      return [
        { x: canvasWidth / 3 - CARD_DIMS.WIDTH, y: playerY },
        { x: (canvasWidth * 2) / 3 - CARD_DIMS.WIDTH, y: playerY }
      ]
    }

    // 3 hands
    return [
      { x: canvasWidth / 4 - CARD_DIMS.WIDTH / 2, y: playerY },
      { x: canvasWidth / 2 - CARD_DIMS.WIDTH / 2, y: playerY },
      { x: (canvasWidth * 3) / 4 - CARD_DIMS.WIDTH / 2, y: playerY }
    ]
  }

  /**
   * Breaks an amount into chip denominations.
   *
   * @param {number} amount - Amount to break into chips
   * @returns {Array<{value: number}>}
   * @private
   */
  _breakIntoChips(amount) {
    const denominations = [500, 100, 50, 10]
    const chips = []
    let remaining = amount

    for (const denom of denominations) {
      while (remaining >= denom) {
        chips.push({ value: denom })
        remaining -= denom
      }
    }

    return chips
  }

  /**
   * Clears the canvas.
   * @private
   */
  _clearCanvas() {
    this._ctx.clearRect(0, 0, this._canvas.width, this._canvas.height)
  }

  /**
   * Creates a delay using requestAnimationFrame.
   *
   * @param {number} ms - Delay in milliseconds
   * @returns {Promise<void>}
   * @private
   */
  _delay(ms) {
    if (!this._animationsEnabled) {
      return Promise.resolve()
    }

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
   * Draws the karate logo on the canvas.
   *
   * @param {number} cx - Center X position
   * @param {number} cy - Center Y position
   * @param {number} size - Size of the logo
   * @private
   */
  _drawKarateLogo(cx, cy, size) {
    const ctx = this._ctx
    const scale = size / 50 // Original design is 100x100, centered at 50,50

    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(scale, scale)

    // Gold color for the logo
    ctx.fillStyle = '#d4af37'
    ctx.strokeStyle = '#d4af37'

    // Draw karate figure silhouette
    ctx.beginPath()
    // Head
    ctx.moveTo(0, -40)
    ctx.lineTo(5, -35)
    ctx.lineTo(5, -25)
    // Right arm extended (punch)
    ctx.lineTo(10, -20)
    ctx.lineTo(25, -25)
    ctx.lineTo(30, -20)
    ctx.lineTo(15, -10)
    ctx.lineTo(10, -12)
    // Body
    ctx.lineTo(8, 0)
    // Right leg (kick)
    ctx.lineTo(20, 15)
    ctx.lineTo(18, 20)
    ctx.lineTo(5, 8)
    // Standing
    ctx.lineTo(2, 25)
    ctx.lineTo(5, 45)
    ctx.lineTo(0, 45)
    ctx.lineTo(-2, 25)
    ctx.lineTo(-5, 8)
    // Left leg
    ctx.lineTo(-18, 20)
    ctx.lineTo(-20, 15)
    ctx.lineTo(-8, 0)
    // Left arm
    ctx.lineTo(-10, -12)
    ctx.lineTo(-15, -10)
    ctx.lineTo(-30, -20)
    ctx.lineTo(-25, -25)
    ctx.lineTo(-10, -20)
    ctx.lineTo(-5, -25)
    ctx.lineTo(-5, -35)
    ctx.closePath()
    ctx.fill()

    // Belt
    ctx.fillRect(-10, -2, 20, 4)

    // Circle border
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.arc(0, 0, 45, 0, Math.PI * 2)
    ctx.stroke()

    ctx.restore()
  }

  /**
   * Checks for reduced motion preference and disables animations if needed.
   * @private
   */
  _checkReducedMotion() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')

      if (mediaQuery.matches) {
        this._animationsEnabled = false
      }

      // Listen for changes
      mediaQuery.addEventListener('change', (e) => {
        this._animationsEnabled = !e.matches
      })
    }
  }

  /**
   * Hides all DOM cards during animation.
   * @private
   */
  _hideAllCards() {
    // Hide dealer cards
    const dealerHand = this._elements.dealerHand()
    if (dealerHand) {
      for (const card of dealerHand.querySelectorAll('.card')) {
        card.style.visibility = 'hidden'
      }
    }

    // Hide player cards
    for (let i = 0; i < 3; i++) {
      const playerCards = this._elements.playerCards(i)
      if (playerCards) {
        for (const card of playerCards.querySelectorAll('.card')) {
          card.style.visibility = 'hidden'
        }
      }
    }
  }

  /**
   * Shows only the cards that have been dealt (animated).
   * @param {Object} dealtCards - { dealer: number, players: number[] }
   * @param {number} handCount - Number of player hands
   * @private
   */
  _showDealtCards(dealtCards, handCount) {
    // Show dealer cards up to dealt count
    const dealerHand = this._elements.dealerHand()
    if (dealerHand) {
      const cards = dealerHand.querySelectorAll('.card')
      for (let i = 0; i < cards.length; i++) {
        cards[i].style.visibility = i < dealtCards.dealer ? 'visible' : 'hidden'
      }
    }

    // Show player cards up to dealt count per hand
    for (let h = 0; h < handCount; h++) {
      const playerCards = this._elements.playerCards(h)
      if (playerCards) {
        const cards = playerCards.querySelectorAll('.card')
        for (let i = 0; i < cards.length; i++) {
          cards[i].style.visibility = i < dealtCards.players[h] ? 'visible' : 'hidden'
        }
      }
    }
  }

  /**
   * Shows all DOM cards after animation is complete.
   * @private
   */
  _showAllCards() {
    // Show dealer cards
    const dealerHand = this._elements.dealerHand()
    if (dealerHand) {
      for (const card of dealerHand.querySelectorAll('.card')) {
        card.style.visibility = 'visible'
      }
    }

    // Show player cards
    for (let i = 0; i < 3; i++) {
      const playerCards = this._elements.playerCards(i)
      if (playerCards) {
        for (const card of playerCards.querySelectorAll('.card')) {
          card.style.visibility = 'visible'
        }
      }
    }
  }

  // ===========================================================================
  // PUBLIC METHODS - RULES DISPLAY
  // ===========================================================================

  /**
   * Shows the house rules on the canvas.
   * Should be called during betting phase before cards are dealt.
   */
  drawRules() {
    this._showingRules = true
    this._redrawTableChips()
  }

  /**
   * Clears the rules display from the canvas.
   * Called when dealing begins.
   */
  clearRules() {
    this._showingRules = false
    this._redrawTableChips()
  }

  /**
   * Draws the house rules panel on the canvas.
   * @private
   */
  _drawRulesPanel() {
    const ctx = this._ctx
    const canvasWidth = this._canvas.width
    const canvasHeight = this._canvas.height

    // Rules panel position and styling
    const panelX = canvasWidth / 2
    const panelY = canvasHeight / 2 - 30
    const rules = ['BLACKJACK PAYS 3:2', 'DEALER HITS ON SOFT 17', 'INSURANCE PAYS 2:1']

    // Draw semi-transparent background panel
    ctx.save()

    const panelWidth = 280
    const panelHeight = 120
    const panelLeft = panelX - panelWidth / 2
    const panelTop = panelY - 20

    // Panel background with gradient
    const gradient = ctx.createLinearGradient(
      panelLeft,
      panelTop,
      panelLeft,
      panelTop + panelHeight
    )
    gradient.addColorStop(0, 'rgba(26, 26, 46, 0.85)')
    gradient.addColorStop(1, 'rgba(26, 26, 46, 0.95)')
    ctx.fillStyle = gradient

    ctx.beginPath()
    ctx.roundRect(panelLeft, panelTop, panelWidth, panelHeight, 8)
    ctx.fill()

    // Gold border
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 2
    ctx.stroke()

    // Title
    ctx.fillStyle = '#d4af37'
    ctx.font = 'bold 14px Georgia, serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    ctx.fillText('HOUSE RULES', panelX, panelTop + 12)

    // Decorative line under title
    ctx.strokeStyle = '#d4af37'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(panelLeft + 40, panelTop + 35)
    ctx.lineTo(panelLeft + panelWidth - 40, panelTop + 35)
    ctx.stroke()

    // Rules text
    ctx.fillStyle = '#f8f8f8'
    ctx.font = '13px Georgia, serif'

    for (let i = 0; i < rules.length; i++) {
      const ruleY = panelTop + 50 + i * 22
      ctx.fillText(rules[i], panelX, ruleY)
    }

    ctx.restore()
  }
}
