/**
 * @fileoverview Main entry point for Karate Blackjack game.
 *
 * This module initializes the game application by:
 * 1. Setting up the canvas rendering context
 * 2. Initializing game state
 * 3. Setting up event listeners for user interactions
 *
 * @module main
 * @version 1.0.0
 */

// Import core types and utilities
import { DEFAULTS, GAME_PHASES, createInitialGameState } from './types/index.js'

// =============================================================================
// DOM ELEMENT REFERENCES
// =============================================================================

/**
 * Canvas element for card rendering.
 * @type {HTMLCanvasElement | null}
 */
let gameCanvas = null

/**
 * Canvas 2D rendering context.
 * @type {CanvasRenderingContext2D | null}
 */
let canvasContext = null

/**
 * Current game state.
 * @type {import('./types/index.js').GameState | null}
 */
let gameState = null

// =============================================================================
// INITIALIZATION
// =============================================================================

/**
 * Initializes the canvas element and its 2D rendering context.
 *
 * @returns {boolean} True if canvas was initialized successfully
 */
function initializeCanvas() {
  gameCanvas = document.getElementById('gameCanvas')

  if (!(gameCanvas instanceof HTMLCanvasElement)) {
    console.error('Canvas element not found or not a valid canvas')
    return false
  }

  const context = gameCanvas.getContext('2d')

  if (!context) {
    console.error('Failed to get 2D canvas context')
    return false
  }

  canvasContext = context

  // Set canvas size to match CSS dimensions
  resizeCanvas()

  console.log('Canvas initialized successfully')
  return true
}

/**
 * Resizes the canvas to match its display size.
 * Called on initialization and window resize.
 */
function resizeCanvas() {
  if (!gameCanvas) return

  // Get the computed display size
  const rect = gameCanvas.getBoundingClientRect()

  // Set the canvas internal size to match display size (for crisp rendering)
  // Use devicePixelRatio for high-DPI displays
  const dpr = window.devicePixelRatio || 1
  gameCanvas.width = rect.width * dpr
  gameCanvas.height = rect.height * dpr

  // Scale the context to account for the pixel ratio
  if (canvasContext) {
    canvasContext.scale(dpr, dpr)
  }
}

/**
 * Initializes the game state with default values.
 *
 * @returns {import('./types/index.js').GameState} The initialized game state
 */
function initializeGameState() {
  gameState = createInitialGameState({
    initialBalance: DEFAULTS.INITIAL_BALANCE,
    minBet: DEFAULTS.MIN_BET,
    maxBet: DEFAULTS.MAX_BET
  })

  console.log('Game state initialized:', {
    phase: gameState.phase,
    balance: gameState.balance
  })

  return gameState
}

/**
 * Updates the UI to reflect the current game state.
 * Placeholder for future UIController integration.
 */
function updateUI() {
  if (!gameState) return

  // Update balance display
  const balanceAmount = document.getElementById('balanceAmount')
  if (balanceAmount) {
    balanceAmount.textContent = `$${gameState.balance}`
  }

  // Update message based on phase
  const messageText = document.getElementById('messageText')
  if (messageText) {
    switch (gameState.phase) {
      case GAME_PHASES.BETTING:
        messageText.textContent = 'Place your bet to begin'
        break
      case GAME_PHASES.DEALING:
        messageText.textContent = 'Dealing cards...'
        break
      case GAME_PHASES.PLAYER_TURN:
        messageText.textContent = 'Your turn'
        break
      case GAME_PHASES.DEALER_TURN:
        messageText.textContent = "Dealer's turn"
        break
      case GAME_PHASES.RESOLUTION:
        messageText.textContent = 'Round complete'
        break
      default:
        messageText.textContent = 'Welcome to Karate Blackjack!'
    }
  }
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

/**
 * Sets up all event listeners for user interactions.
 * Placeholder handlers will be replaced with actual game logic.
 */
function setupEventListeners() {
  // Window resize handler for canvas
  window.addEventListener('resize', () => {
    resizeCanvas()
    console.log('Canvas resized')
  })

  // Bet buttons
  const betButtons = document.querySelectorAll('.btn-bet')
  for (const button of betButtons) {
    button.addEventListener('click', (event) => {
      const target = event.currentTarget
      if (target instanceof HTMLButtonElement) {
        const betAmount = target.dataset.bet
        console.log(`Bet button clicked: $${betAmount}`)
        // TODO: Implement bet placement logic
      }
    })
  }

  // Hand count selector buttons
  const handCountButtons = document.querySelectorAll('.btn-hand-count')
  for (const button of handCountButtons) {
    button.addEventListener('click', (event) => {
      const target = event.currentTarget
      if (target instanceof HTMLButtonElement) {
        // Update active state
        for (const btn of handCountButtons) {
          btn.classList.remove('active')
          btn.setAttribute('aria-pressed', 'false')
        }
        target.classList.add('active')
        target.setAttribute('aria-pressed', 'true')

        const handCount = target.dataset.hands
        console.log(`Hand count selected: ${handCount}`)
        // TODO: Implement hand count logic
      }
    })
  }

  // Deal button
  const dealButton = document.getElementById('dealButton')
  if (dealButton) {
    dealButton.addEventListener('click', () => {
      console.log('Deal button clicked')
      // TODO: Implement deal logic
    })
  }

  // Clear bet button
  const clearBetButton = document.getElementById('clearBetButton')
  if (clearBetButton) {
    clearBetButton.addEventListener('click', () => {
      console.log('Clear bet clicked')
      // TODO: Implement clear bet logic
    })
  }

  // Action buttons
  const actionButtons = {
    hit: document.getElementById('hitButton'),
    stand: document.getElementById('standButton'),
    double: document.getElementById('doubleButton'),
    split: document.getElementById('splitButton')
  }

  for (const [action, button] of Object.entries(actionButtons)) {
    if (button) {
      button.addEventListener('click', () => {
        console.log(`Action clicked: ${action}`)
        // TODO: Implement action logic
      })
    }
  }

  // Insurance buttons
  const insuranceYes = document.getElementById('insuranceYesButton')
  const insuranceNo = document.getElementById('insuranceNoButton')

  if (insuranceYes) {
    insuranceYes.addEventListener('click', () => {
      console.log('Insurance accepted')
      // TODO: Implement insurance logic
    })
  }

  if (insuranceNo) {
    insuranceNo.addEventListener('click', () => {
      console.log('Insurance declined')
      // TODO: Implement insurance logic
    })
  }

  // New round button
  const newRoundButton = document.getElementById('newRoundButton')
  if (newRoundButton) {
    newRoundButton.addEventListener('click', () => {
      console.log('New round clicked')
      // TODO: Implement new round logic
    })
  }

  console.log('Event listeners set up successfully')
}

// =============================================================================
// MAIN APPLICATION ENTRY POINT
// =============================================================================

/**
 * Main initialization function called when the DOM is ready.
 * Sets up all game components and prepares the game for play.
 */
function initializeGame() {
  console.log('=== Karate Blackjack Initializing ===')

  // Initialize canvas
  const canvasReady = initializeCanvas()
  if (!canvasReady) {
    console.warn('Canvas initialization failed, game will run without canvas rendering')
  }

  // Initialize game state
  initializeGameState()

  // Set up event listeners
  setupEventListeners()

  // Initial UI update
  updateUI()

  console.log('=== Game Initialized Successfully ===')
  console.log('Ready for game engine integration')
}

// Wait for DOM to be fully loaded before initializing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame)
} else {
  // DOM already loaded
  initializeGame()
}

// =============================================================================
// EXPORTS (for testing and external access)
// =============================================================================

export {
  gameState,
  gameCanvas,
  canvasContext,
  initializeCanvas,
  initializeGameState,
  updateUI,
  setupEventListeners
}
