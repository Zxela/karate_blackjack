/**
 * @fileoverview UI Controller for Karate Blackjack game.
 *
 * This module provides the UIController class that bridges game logic (GameEngine)
 * with the user interface. It manages DOM elements, event listeners, and
 * translates game state changes into visual updates.
 *
 * Responsibilities:
 * - Subscribe to GameEngine state changes
 * - Update DOM elements to reflect current game state
 * - Handle user input events and delegate to GameEngine
 * - Manage button states based on game phase
 * - Support responsive layout adjustments
 *
 * @module ui/UIController
 * @version 1.0.0
 */

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Mapping of action names to button element IDs.
 * @type {Object<string, string>}
 */
const ACTION_BUTTON_MAP = Object.freeze({
  hit: 'hitButton',
  stand: 'standButton',
  doubleDown: 'doubleButton',
  split: 'splitButton',
  placeBet: 'dealButton'
})

/**
 * Game phases enumeration for reference.
 * @type {Object<string, string>}
 */
const PHASES = Object.freeze({
  BETTING: 'betting',
  DEALING: 'dealing',
  INSURANCE_CHECK: 'insuranceCheck',
  PLAYER_TURN: 'playerTurn',
  DEALER_TURN: 'dealerTurn',
  RESOLUTION: 'resolution',
  GAME_OVER: 'gameOver'
})

/**
 * Maximum number of player hands supported.
 * @type {number}
 */
const MAX_HANDS = 3

// =============================================================================
// UI CONTROLLER CLASS
// =============================================================================

/**
 * UIController manages DOM interactions and bridges game logic with the UI.
 *
 * The controller subscribes to GameEngine state changes and updates the DOM
 * accordingly. It also handles user input events and delegates actions to
 * the GameEngine.
 *
 * @class UIController
 *
 * @example
 * const engine = new GameEngine()
 * const renderer = new CardRenderer(canvas, assetLoader)
 * const ui = new UIController(engine, renderer)
 *
 * ui.init() // Set up event listeners and subscribe to state
 *
 * // Later: cleanup
 * ui.destroy()
 */
export class UIController {
  /**
   * Creates a new UIController instance.
   *
   * @param {import('../game/GameEngine.js').GameEngine} gameEngine - The game engine instance
   * @param {import('./CardRenderer.js').CardRenderer} cardRenderer - The card renderer instance
   */
  constructor(gameEngine, cardRenderer) {
    /**
     * Reference to the game engine.
     * @type {import('../game/GameEngine.js').GameEngine}
     * @private
     */
    this._gameEngine = gameEngine

    /**
     * Reference to the card renderer.
     * @type {import('./CardRenderer.js').CardRenderer}
     * @private
     */
    this._cardRenderer = cardRenderer

    /**
     * Current bet amount being built.
     * @type {number}
     * @private
     */
    this._currentBet = 0

    /**
     * Current hand index for actions.
     * @type {number}
     * @private
     */
    this._currentHandIndex = 0

    /**
     * Unsubscribe function for GameEngine state subscription.
     * @type {Function | null}
     * @private
     */
    this._unsubscribe = null

    /**
     * Stored event handlers for cleanup.
     * @type {Map<Element, Map<string, Function>>}
     * @private
     */
    this._eventHandlers = new Map()

    /**
     * Resize event handler reference.
     * @type {Function | null}
     * @private
     */
    this._resizeHandler = null

    /**
     * DOM element references.
     * @type {Object}
     * @private
     */
    this._elements = this._initializeElements()

    /**
     * Bet buttons reference.
     * @type {NodeListOf<Element>}
     * @private
     */
    this._betButtons = document.querySelectorAll('.btn-bet')

    /**
     * Hand count buttons reference.
     * @type {NodeListOf<Element>}
     * @private
     */
    this._handCountButtons = document.querySelectorAll('.btn-hand-count')
  }

  // ===========================================================================
  // INITIALIZATION
  // ===========================================================================

  /**
   * Initializes DOM element references.
   *
   * @returns {Object} Object containing DOM element references
   * @private
   */
  _initializeElements() {
    return {
      // Balance and betting displays
      balanceAmount: document.getElementById('balanceAmount'),
      currentBetAmount: document.getElementById('currentBetAmount'),

      // Message display
      messageText: document.getElementById('messageText'),
      messageArea: document.getElementById('messageArea'),
      gameStatusAnnouncer: document.getElementById('gameStatusAnnouncer'),

      // Dealer display
      dealerValue: document.getElementById('dealerValue'),
      dealerHand: document.getElementById('dealerHand'),

      // Player hand displays (up to 3 hands)
      playerHand0: document.getElementById('playerHand0'),
      playerHand1: document.getElementById('playerHand1'),
      playerHand2: document.getElementById('playerHand2'),
      playerValue0: document.getElementById('playerValue0'),
      playerValue1: document.getElementById('playerValue1'),
      playerValue2: document.getElementById('playerValue2'),
      playerBet0: document.getElementById('playerBet0'),
      playerBet1: document.getElementById('playerBet1'),
      playerBet2: document.getElementById('playerBet2'),
      playerCards0: document.getElementById('playerCards0'),
      playerCards1: document.getElementById('playerCards1'),
      playerCards2: document.getElementById('playerCards2'),

      // Control buttons
      dealButton: document.getElementById('dealButton'),
      clearBetButton: document.getElementById('clearBetButton'),
      hitButton: document.getElementById('hitButton'),
      standButton: document.getElementById('standButton'),
      doubleButton: document.getElementById('doubleButton'),
      splitButton: document.getElementById('splitButton'),
      insuranceYesButton: document.getElementById('insuranceYesButton'),
      insuranceNoButton: document.getElementById('insuranceNoButton'),
      newRoundButton: document.getElementById('newRoundButton'),

      // Control group containers
      bettingControls: document.getElementById('bettingControls'),
      actionControls: document.getElementById('actionControls'),
      insuranceControls: document.getElementById('insuranceControls'),
      newRoundControls: document.getElementById('newRoundControls'),

      // Canvas
      gameCanvas: document.getElementById('gameCanvas')
    }
  }

  /**
   * Initializes the UI controller by setting up event listeners and subscribing
   * to game state changes.
   *
   * @returns {Function} Unsubscribe function to clean up subscriptions
   *
   * @example
   * const cleanup = ui.init()
   * // Later: cleanup()
   */
  init() {
    // Subscribe to game engine state changes
    this._unsubscribe = this._gameEngine.subscribe((state) => {
      this.render(state)
    })

    // Set up event listeners
    this._setupBetButtonListeners()
    this._setupHandCountButtonListeners()
    this._setupDealButtonListener()
    this._setupActionButtonListeners()
    this._setupInsuranceButtonListeners()
    this._setupNewRoundButtonListener()
    this._setupClearBetButtonListener()
    this._setupResizeListener()

    // Render initial state
    this.render(this._gameEngine.getState())

    return () => this.destroy()
  }

  // ===========================================================================
  // EVENT LISTENER SETUP
  // ===========================================================================

  /**
   * Stores an event handler for later cleanup.
   *
   * @param {Element} element - The DOM element
   * @param {string} eventType - The event type (e.g., 'click')
   * @param {Function} handler - The event handler function
   * @private
   */
  _storeHandler(element, eventType, handler) {
    if (!this._eventHandlers.has(element)) {
      this._eventHandlers.set(element, new Map())
    }
    this._eventHandlers.get(element).set(eventType, handler)
  }

  /**
   * Sets up event listeners for bet buttons.
   * @private
   */
  _setupBetButtonListeners() {
    for (const button of this._betButtons) {
      const handler = (event) => {
        const target = event.currentTarget
        const betAmount = Number.parseInt(target.dataset.bet, 10)
        if (!Number.isNaN(betAmount)) {
          this._currentBet += betAmount
          this._gameEngine.placeBet(this._currentHandIndex, betAmount)
        }
      }
      button.addEventListener('click', handler)
      this._storeHandler(button, 'click', handler)
    }
  }

  /**
   * Sets up event listeners for hand count buttons.
   * @private
   */
  _setupHandCountButtonListeners() {
    for (const button of this._handCountButtons) {
      const handler = (event) => {
        const target = event.currentTarget
        const handCount = Number.parseInt(target.dataset.hands, 10)
        if (!Number.isNaN(handCount)) {
          this._gameEngine.setHandCount(handCount)

          // Update active state on buttons
          for (const btn of this._handCountButtons) {
            btn.classList.remove('active')
            btn.setAttribute('aria-pressed', 'false')
          }
          target.classList.add('active')
          target.setAttribute('aria-pressed', 'true')
        }
      }
      button.addEventListener('click', handler)
      this._storeHandler(button, 'click', handler)
    }
  }

  /**
   * Sets up event listener for the deal button.
   * @private
   */
  _setupDealButtonListener() {
    const button = this._elements.dealButton
    if (button) {
      const handler = () => {
        this._gameEngine.deal()
      }
      button.addEventListener('click', handler)
      this._storeHandler(button, 'click', handler)
    }
  }

  /**
   * Sets up event listeners for action buttons (hit, stand, double, split).
   * @private
   */
  _setupActionButtonListeners() {
    const hitButton = this._elements.hitButton
    if (hitButton) {
      const handler = () => {
        const state = this._gameEngine.getState()
        this._gameEngine.hit(state.currentHandIndex)
      }
      hitButton.addEventListener('click', handler)
      this._storeHandler(hitButton, 'click', handler)
    }

    const standButton = this._elements.standButton
    if (standButton) {
      const handler = () => {
        const state = this._gameEngine.getState()
        this._gameEngine.stand(state.currentHandIndex)
      }
      standButton.addEventListener('click', handler)
      this._storeHandler(standButton, 'click', handler)
    }

    const doubleButton = this._elements.doubleButton
    if (doubleButton) {
      const handler = () => {
        const state = this._gameEngine.getState()
        this._gameEngine.doubleDown(state.currentHandIndex)
      }
      doubleButton.addEventListener('click', handler)
      this._storeHandler(doubleButton, 'click', handler)
    }

    const splitButton = this._elements.splitButton
    if (splitButton) {
      const handler = () => {
        const state = this._gameEngine.getState()
        this._gameEngine.split(state.currentHandIndex)
      }
      splitButton.addEventListener('click', handler)
      this._storeHandler(splitButton, 'click', handler)
    }
  }

  /**
   * Sets up event listeners for insurance buttons.
   * @private
   */
  _setupInsuranceButtonListeners() {
    const yesButton = this._elements.insuranceYesButton
    if (yesButton) {
      const handler = () => {
        this._gameEngine.takeInsurance()
      }
      yesButton.addEventListener('click', handler)
      this._storeHandler(yesButton, 'click', handler)
    }

    const noButton = this._elements.insuranceNoButton
    if (noButton) {
      const handler = () => {
        this._gameEngine.declineInsurance()
      }
      noButton.addEventListener('click', handler)
      this._storeHandler(noButton, 'click', handler)
    }
  }

  /**
   * Sets up event listener for the new round button.
   * @private
   */
  _setupNewRoundButtonListener() {
    const button = this._elements.newRoundButton
    if (button) {
      const handler = () => {
        this._currentBet = 0
        this._gameEngine.startNewRound()
      }
      button.addEventListener('click', handler)
      this._storeHandler(button, 'click', handler)
    }
  }

  /**
   * Sets up event listener for the clear bet button.
   * @private
   */
  _setupClearBetButtonListener() {
    const button = this._elements.clearBetButton
    if (button) {
      const handler = () => {
        this._currentBet = 0
        this._updateCurrentBetDisplay(0)
      }
      button.addEventListener('click', handler)
      this._storeHandler(button, 'click', handler)
    }
  }

  /**
   * Sets up the window resize event listener.
   * @private
   */
  _setupResizeListener() {
    this._resizeHandler = () => {
      this.handleResize()
    }
    window.addEventListener('resize', this._resizeHandler)
  }

  // ===========================================================================
  // RENDERING
  // ===========================================================================

  /**
   * Renders the UI based on the current game state.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   *
   * @example
   * ui.render(engine.getState())
   */
  render(state) {
    // Update balance display
    this.updateBalance(state.balance)

    // Update bet displays
    this.updateBets(state.bets)

    // Update dealer hand display
    this._updateDealerDisplay(state)

    // Update player hands display
    this._updatePlayerHandsDisplay(state)

    // Update control visibility based on phase
    this._updateControlVisibility(state)

    // Update button states based on phase and hand state
    this._updateButtonStates(state)

    // Highlight active hand
    if (state.phase === PHASES.PLAYER_TURN) {
      this.highlightActiveHand(state.currentHandIndex)
    }

    // Update message based on phase
    this._updatePhaseMessage(state)
  }

  /**
   * Updates the dealer display.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   * @private
   */
  _updateDealerDisplay(state) {
    const dealerValue = this._elements.dealerValue
    if (dealerValue) {
      if (state.dealerHand.cards.length === 0) {
        dealerValue.textContent = '--'
      } else {
        dealerValue.textContent = String(state.dealerHand.value)
      }
    }
  }

  /**
   * Updates the player hands display.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   * @private
   */
  _updatePlayerHandsDisplay(state) {
    // Set hand count data attribute for CSS layout
    const playerHandsContainer = document.querySelector('.player-hands')
    if (playerHandsContainer) {
      const handCount = state.handCount || state.playerHands.length || 1
      playerHandsContainer.setAttribute('data-hand-count', String(handCount))
    }

    for (let i = 0; i < MAX_HANDS; i++) {
      const handElement = this._elements[`playerHand${i}`]
      const valueElement = this._elements[`playerValue${i}`]
      const betElement = this._elements[`playerBet${i}`]

      if (handElement) {
        if (i < state.playerHands.length) {
          handElement.classList.remove('hidden')
          if (valueElement) {
            valueElement.textContent = String(state.playerHands[i].value)
          }
          if (betElement) {
            betElement.textContent = `$${state.bets[i] || 0}`
          }

          // Mark completed hands
          if (state.playerHands[i].isStanding) {
            handElement.classList.add('completed')
          } else {
            handElement.classList.remove('completed')
          }
        } else {
          handElement.classList.add('hidden')
          if (valueElement) {
            valueElement.textContent = '--'
          }
          if (betElement) {
            betElement.textContent = ''
          }
          handElement.classList.remove('completed')
        }
      }
    }
  }

  /**
   * Updates control group visibility based on game phase.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   * @private
   */
  _updateControlVisibility(state) {
    const { bettingControls, actionControls, insuranceControls, newRoundControls } = this._elements

    // Default: hide all
    if (bettingControls) bettingControls.classList.add('hidden')
    if (actionControls) actionControls.classList.add('hidden')
    if (insuranceControls) insuranceControls.classList.add('hidden')
    if (newRoundControls) newRoundControls.classList.add('hidden')

    // Show appropriate controls based on phase
    switch (state.phase) {
      case PHASES.BETTING:
        if (bettingControls) bettingControls.classList.remove('hidden')
        break

      case PHASES.INSURANCE_CHECK:
        if (insuranceControls) insuranceControls.classList.remove('hidden')
        break

      case PHASES.PLAYER_TURN:
        if (actionControls) actionControls.classList.remove('hidden')
        break

      case PHASES.DEALER_TURN:
        // No controls during dealer turn
        break

      case PHASES.RESOLUTION:
      case PHASES.GAME_OVER:
        if (newRoundControls) newRoundControls.classList.remove('hidden')
        break
    }
  }

  /**
   * Updates button states (enabled/disabled) based on game state.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   * @private
   */
  _updateButtonStates(state) {
    const { hitButton, standButton, doubleButton, splitButton, dealButton } = this._elements

    // Disable all action buttons by default
    if (hitButton) hitButton.disabled = true
    if (standButton) standButton.disabled = true
    if (doubleButton) doubleButton.disabled = true
    if (splitButton) splitButton.disabled = true
    if (dealButton) dealButton.disabled = true

    switch (state.phase) {
      case PHASES.BETTING:
        // Enable deal button if there are bets
        if (dealButton) {
          dealButton.disabled = state.bets.length === 0 || state.bets.every((b) => b === 0)
        }
        break

      case PHASES.PLAYER_TURN: {
        const currentHand = state.playerHands[state.currentHandIndex]
        if (currentHand && !currentHand.isStanding) {
          if (hitButton) hitButton.disabled = false
          if (standButton) standButton.disabled = false

          // Double only allowed with exactly 2 cards
          if (doubleButton && currentHand.cards && currentHand.cards.length === 2) {
            doubleButton.disabled = false
          }

          // Split only allowed with exactly 2 cards that can split
          if (splitButton && currentHand.canSplit) {
            splitButton.disabled = false
          }
        }
        break
      }

      // All buttons disabled in other phases
      default:
        break
    }
  }

  /**
   * Updates the message based on game phase.
   *
   * @param {import('../types/index.js').GameState} state - The current game state
   * @private
   */
  _updatePhaseMessage(state) {
    let message = ''
    const handCount = state.handCount || state.playerHands.length || 1

    switch (state.phase) {
      case PHASES.BETTING:
        if (handCount > 1) {
          message = `Place bets on ${handCount} hands`
        } else {
          message = 'Place your bet to begin'
        }
        break
      case PHASES.DEALING:
        message = 'Dealing cards...'
        break
      case PHASES.INSURANCE_CHECK:
        message = 'Insurance?'
        break
      case PHASES.PLAYER_TURN:
        if (handCount > 1) {
          const handNum = state.currentHandIndex + 1
          message = `Hand ${handNum} of ${handCount} - Your turn`
        } else {
          message = 'Your turn'
        }
        break
      case PHASES.DEALER_TURN:
        message = "Dealer's turn"
        break
      case PHASES.RESOLUTION:
        message = 'Round complete'
        break
      case PHASES.GAME_OVER:
        message = 'Round complete - Click New Round to continue'
        break
    }

    this.updateMessage(message)
  }

  /**
   * Updates the current bet display.
   *
   * @param {number} amount - The current bet amount
   * @private
   */
  _updateCurrentBetDisplay(amount) {
    const element = this._elements.currentBetAmount
    if (element) {
      element.textContent = `$${amount}`
    }
  }

  // ===========================================================================
  // PUBLIC UPDATE METHODS
  // ===========================================================================

  /**
   * Updates the balance display.
   *
   * @param {number} balance - The current balance amount
   *
   * @example
   * ui.updateBalance(1500)
   */
  updateBalance(balance) {
    const element = this._elements.balanceAmount
    if (element) {
      element.textContent = `$${balance}`
    }
  }

  /**
   * Updates the bet displays.
   *
   * @param {number[]} bets - Array of bet amounts for each hand
   *
   * @example
   * ui.updateBets([100, 50, 25])
   */
  updateBets(bets) {
    // Update total bet
    const totalBet = bets.reduce((sum, bet) => sum + bet, 0)
    this._updateCurrentBetDisplay(totalBet)

    // Update individual hand bets
    for (let i = 0; i < MAX_HANDS; i++) {
      const betElement = this._elements[`playerBet${i}`]
      if (betElement) {
        betElement.textContent = i < bets.length ? `$${bets[i]}` : ''
      }
    }
  }

  /**
   * Updates the message display.
   *
   * @param {string} message - The message to display
   *
   * @example
   * ui.updateMessage('Your turn')
   */
  updateMessage(message) {
    const element = this._elements.messageText
    if (element) {
      element.textContent = message
    }

    // Update accessible announcer for screen readers
    const announcer = this._elements.gameStatusAnnouncer
    if (announcer) {
      announcer.textContent = message
    }
  }

  /**
   * Enables or disables action buttons based on allowed actions.
   *
   * @param {string[]} actions - Array of action names that should be enabled
   *
   * @example
   * ui.enableActions(['hit', 'stand', 'doubleDown'])
   */
  enableActions(actions) {
    const {
      hitButton,
      standButton,
      doubleButton,
      splitButton,
      dealButton,
      bettingControls,
      actionControls
    } = this._elements

    // Disable all action buttons first
    if (hitButton) hitButton.disabled = true
    if (standButton) standButton.disabled = true
    if (doubleButton) doubleButton.disabled = true
    if (splitButton) splitButton.disabled = true
    if (dealButton) dealButton.disabled = true

    // Enable specified actions
    for (const action of actions) {
      const buttonId = ACTION_BUTTON_MAP[action]
      if (buttonId && this._elements[buttonId]) {
        this._elements[buttonId].disabled = false
      }
    }

    // Show/hide control groups based on actions
    const hasGameActions = actions.some((a) => ['hit', 'stand', 'doubleDown', 'split'].includes(a))
    const hasBettingActions = actions.includes('placeBet')

    if (hasGameActions) {
      if (actionControls) actionControls.classList.remove('hidden')
      if (bettingControls) bettingControls.classList.add('hidden')
    } else if (hasBettingActions) {
      if (bettingControls) bettingControls.classList.remove('hidden')
      if (actionControls) actionControls.classList.add('hidden')
    }
  }

  /**
   * Displays the round results.
   *
   * @param {import('../types/index.js').RoundResult[]} results - Array of round results
   *
   * @example
   * ui.showResult([{ handIndex: 0, outcome: 'win', winnings: 100, message: 'You win!' }])
   */
  showResult(results) {
    // Build result message
    const messages = results.map((result) => result.message)
    const combinedMessage = messages.join(' | ')

    this.updateMessage(combinedMessage)

    // Show new round controls, hide others
    const { actionControls, newRoundControls, bettingControls, insuranceControls } = this._elements

    if (actionControls) actionControls.classList.add('hidden')
    if (bettingControls) bettingControls.classList.add('hidden')
    if (insuranceControls) insuranceControls.classList.add('hidden')
    if (newRoundControls) newRoundControls.classList.remove('hidden')
  }

  /**
   * Highlights the active hand during player turn.
   *
   * @param {number} handIndex - The index of the hand to highlight (0-2)
   *
   * @example
   * ui.highlightActiveHand(1)
   */
  highlightActiveHand(handIndex) {
    // Remove active class from all hands
    for (let i = 0; i < MAX_HANDS; i++) {
      const handElement = this._elements[`playerHand${i}`]
      if (handElement) {
        handElement.classList.remove('active')
      }
    }

    // Add active class to specified hand
    if (handIndex >= 0 && handIndex < MAX_HANDS) {
      const activeHand = this._elements[`playerHand${handIndex}`]
      if (activeHand) {
        activeHand.classList.add('active')
      }
    }
  }

  /**
   * Handles window resize events for responsive layout.
   *
   * @example
   * window.addEventListener('resize', () => ui.handleResize())
   */
  handleResize() {
    // Recalculate responsive sizing if needed
    // This can be extended for more complex responsive behavior
    const state = this._gameEngine.getState()

    // Adjust card renderer scale based on viewport
    if (this._cardRenderer && typeof window !== 'undefined') {
      const width = window.innerWidth
      let scale = 1

      if (width < 480) {
        scale = 0.5
      } else if (width < 768) {
        scale = 0.75
      } else if (width < 1024) {
        scale = 0.85
      }

      this._cardRenderer.setScale(scale)
    }

    // Re-render with current state
    this.render(state)
  }

  // ===========================================================================
  // CLEANUP
  // ===========================================================================

  /**
   * Cleans up event listeners and subscriptions.
   *
   * @example
   * ui.destroy()
   */
  destroy() {
    // Unsubscribe from game engine
    if (this._unsubscribe) {
      this._unsubscribe()
      this._unsubscribe = null
    }

    // Remove resize listener
    if (this._resizeHandler) {
      window.removeEventListener('resize', this._resizeHandler)
      this._resizeHandler = null
    }

    // Remove all stored event handlers
    for (const [element, handlers] of this._eventHandlers) {
      for (const [eventType, handler] of handlers) {
        element.removeEventListener(eventType, handler)
      }
    }
    this._eventHandlers.clear()
  }
}
