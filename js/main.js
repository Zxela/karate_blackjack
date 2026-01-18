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

import { audioManager } from './audio/AudioManager.js'
import { GameEngine } from './game/GameEngine.js'
import { GAME_PHASES } from './types/index.js'
import { AnimationCoordinator } from './ui/AnimationCoordinator.js'

// =============================================================================
// GAME ENGINE INSTANCE
// =============================================================================

/** @type {GameEngine} */
let game = null

/** @type {AnimationCoordinator} */
let animationCoordinator = null

/** @type {boolean} */
let isAnimating = false

/** @type {number} */
let currentBet = 0

/** @type {number} */
let handCount = 1

/** @type {number} */
let activeHandIndex = 0

/** @type {boolean} */
let isDealingAnimation = false

// =============================================================================
// DOM REFERENCES
// =============================================================================

const elements = {
  // Balance
  balanceAmount: () => document.getElementById('balanceAmount'),

  // Volume controls
  volumeControl: () => document.getElementById('volumeControl'),
  volumeToggle: () => document.getElementById('volumeToggle'),
  volumeSlider: () => document.getElementById('volumeSlider'),
  volumeIcon: () => document.getElementById('volumeIcon'),

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

  // Hide cards during dealing animation - AnimationCoordinator will reveal them
  if (isDealingAnimation) {
    cardEl.style.visibility = 'hidden'
  }

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
  // Hide dealer's hole card during player turn AND insurance check
  const hideDealerCard =
    (state.phase === GAME_PHASES.PLAYER_TURN || state.phase === GAME_PHASES.INSURANCE_CHECK) &&
    dealerCards.length > 0
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
  // During play, show all hands from state (may have more than handCount due to splits)
  // During betting, show based on handCount
  const activeHandCount =
    state.phase === GAME_PHASES.BETTING ? handCount : Math.max(handCount, state.playerHands.length)

  for (let i = 0; i < 3; i++) {
    const handEl = elements.playerHand(i)
    const hand = state.playerHands[i]

    if (i < activeHandCount && hand && hand.cards.length > 0) {
      handEl.classList.remove('hidden')
      handEl.classList.toggle(
        'active',
        i === activeHandIndex && state.phase === GAME_PHASES.PLAYER_TURN
      )

      renderCards(elements.playerCards(i), hand.cards)
      elements.playerValue(i).textContent = hand.value > 0 ? `${hand.value}` : '--'
      elements.playerBet(i).textContent = hand.bet > 0 ? `$${hand.bet}` : ''
    } else if (i < handCount && state.phase === GAME_PHASES.BETTING) {
      // During betting, show empty hand slots
      handEl.classList.remove('hidden')
      handEl.classList.remove('active')
      renderCards(elements.playerCards(i), [])
      elements.playerValue(i).textContent = '--'
      elements.playerBet(i).textContent = ''
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
      // Play insurance offer alert sound
      audioManager.play('insuranceOffer')
      break

    case GAME_PHASES.DEALER_TURN:
      messageEl.textContent = "Dealer's turn"
      break

    case GAME_PHASES.RESOLUTION:
    case GAME_PHASES.GAME_OVER:
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

  // Can split if game engine allows (checks rank, balance, max hands)
  const canSplit = game.canSplit(activeHandIndex)

  elements.hitButton().disabled = false
  elements.standButton().disabled = false
  elements.doubleButton().disabled = !canDouble
  elements.splitButton().disabled = !canSplit
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
async function addBet(amount) {
  const state = game.getState()
  if (state.phase !== GAME_PHASES.BETTING) return
  if (isAnimating) return

  const maxBet = Math.min(state.balance, 1000)
  const newBet = Math.min(currentBet + amount, maxBet)

  // Only add chips if bet actually increased
  if (newBet > currentBet) {
    const chipAmount = newBet - currentBet

    // Play chip sound
    audioManager.play('chipPlace')

    // Add chips to table for each hand
    if (animationCoordinator) {
      isAnimating = true
      for (let i = 0; i < handCount; i++) {
        await animationCoordinator.addChipToTable(chipAmount, i, handCount)
      }
      isAnimating = false
    }

    currentBet = newBet
  }

  updateUI()
}

/**
 * Clears the current bet.
 */
function clearBet() {
  if (currentBet > 0) {
    audioManager.play('buttonClick')
  }

  currentBet = 0

  // Clear chips from table
  if (animationCoordinator) {
    animationCoordinator.clearAllChips()
  }

  updateUI()
}

/**
 * Deals cards and starts the round.
 */
async function deal() {
  if (currentBet === 0) return
  if (isAnimating) return

  const state = game.getState()
  if (state.phase !== GAME_PHASES.BETTING) return

  isAnimating = true

  // Play "FIGHT!" sound for new round
  audioManager.play('newRound')

  // Clear previous results and rules
  if (animationCoordinator) {
    animationCoordinator.clearResults()
    animationCoordinator.clearRules()
  }

  // Start new round
  game.startNewRound()

  // Animate bet placement for each hand
  for (let i = 0; i < handCount; i++) {
    if (animationCoordinator) {
      await animationCoordinator.animateBetPlacement(currentBet, i)
    }
    game.placeBet(i, currentBet)
  }

  // Deal cards
  game.deal()

  // Get the dealt state for animation
  const newState = game.getState()

  // Animate the initial deal
  if (animationCoordinator) {
    isDealingAnimation = true
    await animationCoordinator.animateInitialDeal(
      newState.playerHands,
      newState.dealerHand,
      handCount,
      updateUI
    )
    isDealingAnimation = false
  }

  activeHandIndex = 0

  // Check for any blackjacks and show animations (unless dealer shows ace for insurance)
  // dealerHand.cards[1] is the face-up card
  const dealerShowsAce = newState.dealerHand.cards?.[1]?.rank === 'A'

  if (!dealerShowsAce) {
    // Show blackjack animations for any hands that got blackjack
    for (let i = 0; i < handCount; i++) {
      const hand = newState.playerHands[i]
      if (hand?.isBlackjack && animationCoordinator) {
        await animationCoordinator.animateHandResult(i, 'blackjack', 'BLACKJACK!')
      }
    }
  }

  // Check for insurance or auto-proceed
  if (newState.phase === GAME_PHASES.PLAYER_TURN) {
    const hasActiveHand = findActiveHand()

    // If no active hands (all blackjack/bust), proceed to dealer turn
    if (!hasActiveHand) {
      isAnimating = false
      updateUI()
      await completeRoundIfNeeded()
      return
    }
  }

  isAnimating = false
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
async function completeRoundIfNeeded() {
  const state = game.getState()

  if (state.phase === GAME_PHASES.DEALER_TURN) {
    // Check if all player hands busted - dealer doesn't need to play
    const allBusted = state.playerHands
      .filter((h) => h && h.cards.length > 0)
      .every((h) => h.isBust)

    // Only animate dealer if not all players busted
    if (!allBusted) {
      // Get dealer's initial card count before playing
      const initialDealerCards = state.dealerHand.cards.length

      // Animate dealer hole card reveal
      if (animationCoordinator) {
        // Play dramatic reveal sound
        audioManager.play('dealerReveal')
        await animationCoordinator.animateDealerReveal(state.dealerHand)
      }

      // Update UI to show revealed hole card
      updateUI()

      // Play dealer turn (this may add cards)
      game.playDealerTurn()

      // Get state after dealer plays
      const afterDealerState = game.getState()

      // Animate any new dealer cards
      if (animationCoordinator) {
        for (let i = initialDealerCards; i < afterDealerState.dealerHand.cards.length; i++) {
          await animationCoordinator.animateDealerHit(
            afterDealerState.dealerHand.cards[i],
            i,
            updateUI
          )
        }
      }
    } else {
      // All busted - just play dealer turn without animation
      game.playDealerTurn()
    }

    // Resolve the round
    game.resolveRound()

    // Animate results for each hand
    const finalState = game.getState()
    const results = buildResultsArray(finalState)

    if (animationCoordinator) {
      // Play appropriate sounds for each result as they animate
      await animateResultsWithSound(results)
    }
  }
}

/**
 * Animates results with synchronized sounds.
 * @param {Array} results - Array of result objects
 */
async function animateResultsWithSound(results) {
  for (const result of results) {
    // Play sound based on outcome
    playResultSound(result.outcome)

    // Animate the result
    await animationCoordinator.animateHandResult(result.handIndex, result.outcome, result.message)

    // Animate chip movement based on outcome
    if (result.outcome === 'win' || result.outcome === 'blackjack') {
      await animationCoordinator.animateWinPayout(result.payout || 0, result.handIndex)
    } else if (result.outcome === 'lose' || result.outcome === 'bust') {
      await animationCoordinator.animateLoss(result.bet || 0, result.handIndex)
    } else if (result.outcome === 'push') {
      // Push - chips stay, just clear them
      animationCoordinator.clearHandChips(result.handIndex)
    }

    // Small delay between hands
    await new Promise((resolve) => setTimeout(resolve, 300))
  }
}

/**
 * Plays the appropriate sound for a game result.
 * @param {string} outcome - The result outcome
 */
function playResultSound(outcome) {
  const soundMap = {
    win: 'win',
    blackjack: 'blackjack',
    push: 'push',
    bust: 'bust',
    lose: 'lose'
  }
  const sound = soundMap[outcome]
  if (sound) {
    audioManager.play(sound)
  }
}

/**
 * Builds an array of result objects for animation.
 * @param {Object} state - Game state after resolution
 * @returns {Array<{handIndex: number, outcome: string, message: string, payout: number, bet: number}>}
 */
function buildResultsArray(state) {
  const results = []

  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (!hand || hand.cards.length === 0) continue

    let outcome = 'lose'
    let message = ''
    let payout = 0
    const bet = state.bets[i] || 0

    if (hand.isBust) {
      outcome = 'bust'
      message = 'BUST!'
    } else if (state.dealerHand.isBust) {
      outcome = 'win'
      message = 'WIN!'
      payout = bet * 2
    } else if (hand.isBlackjack && !state.dealerHand.isBlackjack) {
      outcome = 'blackjack'
      message = 'BLACKJACK!'
      payout = bet * 2.5
    } else if (state.dealerHand.isBlackjack && !hand.isBlackjack) {
      outcome = 'lose'
      message = 'LOSE'
    } else if (hand.value > state.dealerHand.value) {
      outcome = 'win'
      message = 'WIN!'
      payout = bet * 2
    } else if (hand.value < state.dealerHand.value) {
      outcome = 'lose'
      message = 'LOSE'
    } else {
      outcome = 'push'
      message = 'PUSH'
      payout = bet
    }

    results.push({ handIndex: i, outcome, message, payout, bet })
  }

  return results
}

/**
 * Player hits on the active hand.
 */
async function hit() {
  if (isAnimating) return

  isAnimating = true

  // Play hit (punch) sound
  audioManager.play('hit')

  // Get card count before hit
  const prevState = game.getState()
  const prevCardCount = prevState.playerHands[activeHandIndex]?.cards?.length || 0

  game.hit(activeHandIndex)

  const state = game.getState()
  const hand = state.playerHands[activeHandIndex]

  // Animate the new card
  if (animationCoordinator && hand && hand.cards.length > prevCardCount) {
    const newCard = hand.cards[prevCardCount]
    await animationCoordinator.animateHit(newCard, activeHandIndex, prevCardCount, updateUI)
  }

  // Show bust result immediately
  if (hand?.isBust && animationCoordinator) {
    await animationCoordinator.animateHandResult(activeHandIndex, 'bust', 'BUST!')
  }

  // If hand busted or standing, move to next hand
  if (hand && (hand.isBust || hand.isStanding)) {
    activeHandIndex++
    findActiveHand()
  }

  updateUI()

  // Check if dealer turn should happen
  await completeRoundIfNeeded()

  isAnimating = false
  updateUI()
}

/**
 * Player stands on the active hand.
 */
async function stand() {
  if (isAnimating) return

  isAnimating = true

  // Play stand (block) sound
  audioManager.play('stand')

  game.stand(activeHandIndex)

  activeHandIndex++
  findActiveHand()

  updateUI()

  // Check if dealer turn should happen
  await completeRoundIfNeeded()

  isAnimating = false
  updateUI()
}

/**
 * Player doubles down on the active hand.
 */
async function doubleDown() {
  if (isAnimating) return

  isAnimating = true

  // Play double down power-up sound
  audioManager.play('doubleDown')

  // Get card count before double
  const prevState = game.getState()
  const prevCardCount = prevState.playerHands[activeHandIndex]?.cards?.length || 0

  // Animate additional bet placement
  if (animationCoordinator) {
    await animationCoordinator.animateBetPlacement(currentBet, activeHandIndex)
  }

  game.doubleDown(activeHandIndex)

  const state = game.getState()
  const hand = state.playerHands[activeHandIndex]

  // Animate the new card
  if (animationCoordinator && hand && hand.cards.length > prevCardCount) {
    const newCard = hand.cards[prevCardCount]
    await animationCoordinator.animateHit(newCard, activeHandIndex, prevCardCount, updateUI)
  }

  // Show bust result immediately if doubled and busted
  if (hand?.isBust && animationCoordinator) {
    await animationCoordinator.animateHandResult(activeHandIndex, 'bust', 'BUST!')
  }

  activeHandIndex++
  findActiveHand()

  updateUI()

  // Check if dealer turn should happen
  await completeRoundIfNeeded()

  isAnimating = false
  updateUI()
}

/**
 * Player splits the active hand.
 */
async function splitHand() {
  if (isAnimating) return
  isAnimating = true

  // Play split (chop) sound
  audioManager.play('split')

  game.split(activeHandIndex)

  const state = game.getState()
  const hand = state.playerHands[activeHandIndex]

  // For split Aces, hands are auto-standing - check if we need to move to next hand
  if (hand && hand.isStanding) {
    activeHandIndex++
    findActiveHand()
  }

  updateUI()

  // Check if all hands complete (split Aces case triggers dealer turn)
  await completeRoundIfNeeded()

  isAnimating = false
  updateUI()
}

/**
 * Player takes insurance.
 */
async function takeInsurance() {
  if (isAnimating) return
  isAnimating = true

  // Play insurance accept sound
  audioManager.play('insuranceAccept')

  game.takeInsurance()
  activeHandIndex = 0

  // Show blackjack animations for any hands that got blackjack
  const state = game.getState()
  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (hand?.isBlackjack && animationCoordinator) {
      await animationCoordinator.animateHandResult(i, 'blackjack', 'BLACKJACK!')
    }
  }

  const hasActiveHand = findActiveHand()

  // If no active hands (all blackjack/bust), proceed to dealer turn
  if (!hasActiveHand) {
    isAnimating = false
    updateUI()
    await completeRoundIfNeeded()
    return
  }

  isAnimating = false
  updateUI()
}

/**
 * Player declines insurance.
 */
async function declineInsurance() {
  if (isAnimating) return
  isAnimating = true

  // Play insurance decline sound
  audioManager.play('insuranceDecline')

  game.declineInsurance()
  activeHandIndex = 0

  // Show blackjack animations for any hands that got blackjack
  const state = game.getState()
  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (hand?.isBlackjack && animationCoordinator) {
      await animationCoordinator.animateHandResult(i, 'blackjack', 'BLACKJACK!')
    }
  }

  const hasActiveHand = findActiveHand()

  // If no active hands (all blackjack/bust), proceed to dealer turn
  if (!hasActiveHand) {
    isAnimating = false
    updateUI()
    await completeRoundIfNeeded()
    return
  }

  isAnimating = false
  updateUI()
}

/**
 * Starts a new round.
 */
function newRound() {
  currentBet = 0
  activeHandIndex = 0

  // Clear result animations and chips
  if (animationCoordinator) {
    animationCoordinator.clearResults()
    animationCoordinator.clearAllChips()
  }

  game.startNewRound()
  updateUI()

  // Show house rules on canvas
  if (animationCoordinator) {
    animationCoordinator.drawRules()
  }
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

      const newHandCount = Number.parseInt(e.currentTarget.dataset.hands)

      // Clear chips if hand count changed (chips would need repositioning)
      if (newHandCount !== handCount && animationCoordinator) {
        animationCoordinator.clearAllChips()
        currentBet = 0
      }

      handCount = newHandCount

      if (animationCoordinator) {
        animationCoordinator.setHandCount(handCount)
      }

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

  // Volume control setup
  setupVolumeControls()
}

/**
 * Sets up volume control event listeners.
 */
function setupVolumeControls() {
  const volumeControl = elements.volumeControl()
  const volumeToggle = elements.volumeToggle()
  const volumeSlider = elements.volumeSlider()

  if (!volumeToggle || !volumeSlider || !volumeControl) return

  // Initialize UI from saved settings
  updateVolumeUI()

  // Volume slider change
  volumeSlider.addEventListener('input', (e) => {
    const volume = Number.parseInt(e.target.value) / 100
    audioManager.setVolume(volume)
    updateVolumeUI()
  })

  // Mute toggle button
  volumeToggle.addEventListener('click', () => {
    // Initialize audio on first interaction if needed
    if (!audioManager.isInitialized()) {
      audioManager.init()
    }

    audioManager.toggleMute()
    updateVolumeUI()

    // Play feedback sound if unmuting
    if (!audioManager.isMuted()) {
      audioManager.play('buttonClick')
    }
  })
}

/**
 * Updates the volume control UI to reflect current state.
 */
function updateVolumeUI() {
  const volumeControl = elements.volumeControl()
  const volumeSlider = elements.volumeSlider()

  if (!volumeControl || !volumeSlider) return

  const volume = audioManager.getVolume()
  const muted = audioManager.isMuted()

  // Update slider
  volumeSlider.value = Math.round(volume * 100)

  // Update CSS custom property for track fill
  volumeSlider.style.setProperty('--volume-percent', `${volume * 100}%`)

  // Update muted state
  if (muted) {
    volumeControl.classList.add('muted')
  } else {
    volumeControl.classList.remove('muted')
  }
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

  // Initialize animation coordinator
  const canvas = document.getElementById('gameCanvas')
  if (canvas) {
    animationCoordinator = new AnimationCoordinator(canvas, elements)
    console.log('Animation system initialized')
  }

  // Start in betting phase
  game.startNewRound()

  // Set up event listeners
  setupEventListeners()

  // Initialize audio on first user interaction (required by browser autoplay policies)
  const initAudioOnFirstInteraction = () => {
    if (!audioManager.isInitialized()) {
      audioManager.init()
      console.log('Audio system initialized')
    }
  }
  document.addEventListener('click', initAudioOnFirstInteraction, { once: true })
  document.addEventListener('keydown', initAudioOnFirstInteraction, { once: true })

  // Initial UI update
  updateUI()

  // Show house rules on canvas
  if (animationCoordinator) {
    animationCoordinator.drawRules()
  }

  console.log('=== Game Ready ===')

  // Expose test API for E2E testing
  window.__TEST_API__ = {
    getGame: () => game,
    forcePair: (rank) => game._testSetForcePair(rank),
    forceDealerAce: (value) => game._testSetDealerShowsAce(value),
    getState: () => game.getState(),
    startNewRound: () => {
      newRound()
    },
    getAudioManager: () => audioManager,
    setVolume: (level) => {
      audioManager.setVolume(level)
      updateVolumeUI()
    },
    toggleMute: () => {
      audioManager.toggleMute()
      updateVolumeUI()
      return audioManager.isMuted()
    }
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame)
} else {
  initializeGame()
}
