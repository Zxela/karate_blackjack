/**
 * @fileoverview Main entry point for Karate Blackjack game.
 *
 * This module initializes the game application by:
 * 1. Setting up the GameEngine
 * 2. Connecting UI elements to game actions
 * 3. Updating the display based on game state
 *
 * @module main
 * @version 1.0.0
 */

import { GameEngine } from './game/GameEngine.js'
import { GAME_PHASES } from './types/index.js'

// =============================================================================
// GAME ENGINE INSTANCE
// =============================================================================

/** @type {GameEngine} */
let game = null

/** @type {number} */
let currentBet = 0

/** @type {number} */
let handCount = 1

/** @type {number} */
let activeHandIndex = 0

// =============================================================================
// DOM REFERENCES
// =============================================================================

const elements = {
  // Balance
  balanceAmount: () => document.getElementById('balanceAmount'),

  // Message
  messageText: () => document.getElementById('messageText'),

  // Betting
  currentBetAmount: () => document.getElementById('currentBetAmount'),
  dealButton: () => document.getElementById('dealButton'),
  clearBetButton: () => document.getElementById('clearBetButton'),
  bettingControls: () => document.getElementById('bettingControls'),

  // Actions
  actionControls: () => document.getElementById('actionControls'),
  hitButton: () => document.getElementById('hitButton'),
  standButton: () => document.getElementById('standButton'),
  doubleButton: () => document.getElementById('doubleButton'),
  splitButton: () => document.getElementById('splitButton'),

  // Insurance
  insuranceControls: () => document.getElementById('insuranceControls'),

  // New Round
  newRoundControls: () => document.getElementById('newRoundControls'),
  newRoundButton: () => document.getElementById('newRoundButton'),

  // Dealer
  dealerHand: () => document.getElementById('dealerHand'),
  dealerValue: () => document.getElementById('dealerValue'),

  // Player hands
  playerHands: () => document.getElementById('playerHands'),
  playerHand: (i) => document.getElementById(`playerHand${i}`),
  playerCards: (i) => document.getElementById(`playerCards${i}`),
  playerValue: (i) => document.getElementById(`playerValue${i}`),
  playerBet: (i) => document.getElementById(`playerBet${i}`)
}

// =============================================================================
// CARD RENDERING
// =============================================================================

/**
 * Creates an HTML element for a card.
 * @param {import('./types/index.js').Card} card
 * @param {boolean} faceDown
 * @returns {HTMLElement}
 */
function createCardElement(card, faceDown = false) {
  const cardEl = document.createElement('div')
  cardEl.className = `card ${faceDown ? 'face-down' : ''}`

  if (faceDown) {
    cardEl.innerHTML = '<span class="card-back">🂠</span>'
  } else {
    const suitSymbols = { hearts: '♥', diamonds: '♦', clubs: '♣', spades: '♠' }
    const suitColors = { hearts: 'red', diamonds: 'red', clubs: 'black', spades: 'black' }
    const symbol = suitSymbols[card.suit]
    const color = suitColors[card.suit]

    cardEl.innerHTML = `
      <span class="card-rank" style="color: ${color}">${card.rank}</span>
      <span class="card-suit" style="color: ${color}">${symbol}</span>
    `
  }

  return cardEl
}

/**
 * Renders cards in a container.
 * @param {HTMLElement} container
 * @param {import('./types/index.js').Card[]} cards
 * @param {boolean} hideFirst - Hide the first card (for dealer)
 */
function renderCards(container, cards, hideFirst = false) {
  container.innerHTML = ''
  cards.forEach((card, index) => {
    const faceDown = hideFirst && index === 0
    container.appendChild(createCardElement(card, faceDown))
  })
}

// =============================================================================
// UI UPDATE
// =============================================================================

/**
 * Updates the entire UI based on game state.
 */
function updateUI() {
  const state = game.getState()

  // Update balance
  elements.balanceAmount().textContent = `$${state.balance}`

  // Update current bet display
  elements.currentBetAmount().textContent = `$${currentBet}`

  // Update dealer
  const dealerCards = state.dealerHand.cards
  const hideDealerCard = state.phase === GAME_PHASES.PLAYER_TURN && dealerCards.length > 0
  renderCards(elements.dealerHand(), dealerCards, hideDealerCard)

  if (hideDealerCard && dealerCards.length > 0) {
    // Show only second card value
    const visibleCard = dealerCards[1]
    const visibleValue = visibleCard
      ? visibleCard.rank === 'A'
        ? 11
        : ['J', 'Q', 'K'].includes(visibleCard.rank)
          ? 10
          : Number.parseInt(visibleCard.rank)
      : 0
    elements.dealerValue().textContent = visibleValue > 0 ? `${visibleValue}` : '--'
  } else {
    elements.dealerValue().textContent =
      state.dealerHand.value > 0 ? `${state.dealerHand.value}` : '--'
  }

  // Update player hands
  for (let i = 0; i < 3; i++) {
    const handEl = elements.playerHand(i)
    const hand = state.playerHands[i]

    if (i < handCount && hand) {
      handEl.classList.remove('hidden')
      handEl.classList.toggle(
        'active',
        i === activeHandIndex && state.phase === GAME_PHASES.PLAYER_TURN
      )

      renderCards(elements.playerCards(i), hand.cards)
      elements.playerValue(i).textContent = hand.value > 0 ? `${hand.value}` : '--'
      elements.playerBet(i).textContent = hand.bet > 0 ? `$${hand.bet}` : ''
    } else {
      handEl.classList.add('hidden')
    }
  }

  // Update message and controls based on phase
  updatePhaseUI(state)
}

/**
 * Updates UI elements based on game phase.
 * @param {import('./types/index.js').GameState} state
 */
function updatePhaseUI(state) {
  const messageEl = elements.messageText()

  // Hide all control groups first
  elements.bettingControls().classList.add('hidden')
  elements.actionControls().classList.add('hidden')
  elements.insuranceControls().classList.add('hidden')
  elements.newRoundControls().classList.add('hidden')

  switch (state.phase) {
    case GAME_PHASES.BETTING:
      elements.bettingControls().classList.remove('hidden')
      messageEl.textContent = 'Place your bet to begin'
      updateBettingControls()
      break

    case GAME_PHASES.DEALING:
      messageEl.textContent = 'Dealing cards...'
      break

    case GAME_PHASES.PLAYER_TURN:
      elements.actionControls().classList.remove('hidden')
      messageEl.textContent =
        handCount > 1 ? `Hand ${activeHandIndex + 1} - Your turn` : 'Your turn'
      updateActionButtons()
      break

    case GAME_PHASES.INSURANCE_CHECK:
      elements.insuranceControls().classList.remove('hidden')
      messageEl.textContent = 'Dealer shows Ace - Insurance?'
      break

    case GAME_PHASES.DEALER_TURN:
      messageEl.textContent = "Dealer's turn"
      break

    case GAME_PHASES.RESOLUTION:
      elements.newRoundControls().classList.remove('hidden')
      displayResults(state)
      break

    default:
      messageEl.textContent = 'Welcome to Karate Blackjack!'
  }
}

/**
 * Updates betting control states.
 */
function updateBettingControls() {
  const dealBtn = elements.dealButton()
  const canDeal = currentBet > 0
  dealBtn.disabled = !canDeal
}

/**
 * Updates action button states based on current hand.
 */
function updateActionButtons() {
  const state = game.getState()
  const hand = state.playerHands[activeHandIndex]

  if (!hand) return

  // Can double if balance >= bet and only 2 cards
  const canDouble = state.balance >= (state.bets[activeHandIndex] || 0) && hand.cards.length === 2

  elements.hitButton().disabled = false
  elements.standButton().disabled = false
  elements.doubleButton().disabled = !canDouble
  elements.splitButton().disabled = !hand.canSplit
}

/**
 * Displays round results.
 * @param {import('./types/index.js').GameState} state
 */
function displayResults(state) {
  const messageEl = elements.messageText()
  const results = []

  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (!hand || hand.cards.length === 0) continue

    let outcome = ''
    if (hand.isBust) {
      outcome = 'Bust'
    } else if (state.dealerHand.isBust) {
      outcome = 'Win (Dealer Bust)'
    } else if (hand.isBlackjack && !state.dealerHand.isBlackjack) {
      outcome = 'Blackjack!'
    } else if (state.dealerHand.isBlackjack && !hand.isBlackjack) {
      outcome = 'Lose (Dealer BJ)'
    } else if (hand.value > state.dealerHand.value) {
      outcome = 'Win'
    } else if (hand.value < state.dealerHand.value) {
      outcome = 'Lose'
    } else {
      outcome = 'Push'
    }

    if (state.playerHands.length > 1) {
      results.push(`Hand ${i + 1}: ${outcome}`)
    } else {
      results.push(outcome)
    }
  }

  messageEl.textContent = results.join(' | ')
}

// =============================================================================
// GAME ACTIONS
// =============================================================================

/**
 * Adds to the current bet.
 * @param {number} amount
 */
function addBet(amount) {
  const state = game.getState()
  if (state.phase !== GAME_PHASES.BETTING) return

  const maxBet = Math.min(state.balance, 1000)
  currentBet = Math.min(currentBet + amount, maxBet)
  updateUI()
}

/**
 * Clears the current bet.
 */
function clearBet() {
  currentBet = 0
  updateUI()
}

/**
 * Deals cards and starts the round.
 */
function deal() {
  if (currentBet === 0) return

  const state = game.getState()
  if (state.phase !== GAME_PHASES.BETTING) return

  // Start new round
  game.startNewRound()

  // Place bets for each hand
  for (let i = 0; i < handCount; i++) {
    game.placeBet(i, currentBet)
  }

  // Deal cards
  game.deal()

  activeHandIndex = 0

  // Check for insurance or auto-proceed
  const newState = game.getState()
  if (newState.phase === GAME_PHASES.PLAYER_TURN) {
    findActiveHand()
  }

  updateUI()
}

/**
 * Finds the next active (non-standing, non-bust) hand.
 */
function findActiveHand() {
  const state = game.getState()
  for (let i = activeHandIndex; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (hand && !hand.isStanding && !hand.isBust && !hand.isBlackjack) {
      activeHandIndex = i
      return true
    }
  }
  return false
}

/**
 * Completes the round if in dealer turn phase.
 * Plays dealer turn and resolves the round.
 */
function completeRoundIfNeeded() {
  const state = game.getState()

  if (state.phase === GAME_PHASES.DEALER_TURN) {
    game.playDealerTurn()
    game.resolveRound()
  }
}

/**
 * Player hits on the active hand.
 */
function hit() {
  game.hit(activeHandIndex)

  const state = game.getState()
  const hand = state.playerHands[activeHandIndex]

  // If hand busted or standing, move to next hand
  if (hand && (hand.isBust || hand.isStanding)) {
    activeHandIndex++
    findActiveHand()
  }

  // Check if dealer turn should happen
  completeRoundIfNeeded()

  updateUI()
}

/**
 * Player stands on the active hand.
 */
function stand() {
  game.stand(activeHandIndex)

  activeHandIndex++
  findActiveHand()

  // Check if dealer turn should happen
  completeRoundIfNeeded()

  updateUI()
}

/**
 * Player doubles down on the active hand.
 */
function doubleDown() {
  game.doubleDown(activeHandIndex)

  activeHandIndex++
  findActiveHand()

  // Check if dealer turn should happen
  completeRoundIfNeeded()

  updateUI()
}

/**
 * Player splits the active hand.
 */
function splitHand() {
  game.split(activeHandIndex)
  updateUI()
}

/**
 * Player takes insurance.
 */
function takeInsurance() {
  game.takeInsurance()
  activeHandIndex = 0
  findActiveHand()
  updateUI()
}

/**
 * Player declines insurance.
 */
function declineInsurance() {
  game.declineInsurance()
  activeHandIndex = 0
  findActiveHand()
  updateUI()
}

/**
 * Starts a new round.
 */
function newRound() {
  currentBet = 0
  activeHandIndex = 0
  game.startNewRound()
  updateUI()
}

// =============================================================================
// EVENT LISTENERS
// =============================================================================

function setupEventListeners() {
  // Bet buttons
  for (const button of document.querySelectorAll('.btn-bet')) {
    button.addEventListener('click', (e) => {
      const amount = Number.parseInt(e.currentTarget.dataset.bet)
      addBet(amount)
    })
  }

  // Hand count buttons
  for (const button of document.querySelectorAll('.btn-hand-count')) {
    button.addEventListener('click', (e) => {
      for (const b of document.querySelectorAll('.btn-hand-count')) {
        b.classList.remove('active')
        b.setAttribute('aria-pressed', 'false')
      }
      e.currentTarget.classList.add('active')
      e.currentTarget.setAttribute('aria-pressed', 'true')
      handCount = Number.parseInt(e.currentTarget.dataset.hands)
      updateUI()
    })
  }

  // Deal button
  elements.dealButton().addEventListener('click', deal)

  // Clear bet button
  elements.clearBetButton().addEventListener('click', clearBet)

  // Action buttons
  elements.hitButton().addEventListener('click', hit)
  elements.standButton().addEventListener('click', stand)
  elements.doubleButton().addEventListener('click', doubleDown)
  elements.splitButton().addEventListener('click', splitHand)

  // Insurance buttons
  document.getElementById('insuranceYesButton').addEventListener('click', takeInsurance)
  document.getElementById('insuranceNoButton').addEventListener('click', declineInsurance)

  // New round button
  elements.newRoundButton().addEventListener('click', newRound)
}

// =============================================================================
// INITIALIZATION
// =============================================================================

function initializeGame() {
  console.log('=== Karate Blackjack Initializing ===')

  // Create game engine
  game = new GameEngine({
    initialBalance: 1000,
    deckCount: 6,
    minBet: 10,
    maxBet: 1000
  })

  // Start in betting phase
  game.startNewRound()

  // Set up event listeners
  setupEventListeners()

  // Initial UI update
  updateUI()

  console.log('=== Game Ready ===')
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame)
} else {
  initializeGame()
}
