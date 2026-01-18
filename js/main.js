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

/** @type {{wins: number, losses: number, startBalance: number, betHistory: number[]}} */
let sessionStats = {
  wins: 0,
  losses: 0,
  startBalance: 1000,
  betHistory: [] // Track bets for undo functionality
}

/** @type {Object} */
let settings = {
  animationSpeed: 'normal',
  tableColor: 'green',
  showDeckCount: true,
  showTutorial: true
}

// =============================================================================
// DOM REFERENCES
// =============================================================================

const elements = {
  // Balance & Rank
  balanceAmount: () => document.getElementById('balanceAmount'),
  rankDisplay: () => document.getElementById('rankDisplay'),
  rankBelt: () => document.getElementById('rankBelt'),
  rankName: () => document.getElementById('rankName'),

  // Volume controls
  volumeControl: () => document.getElementById('volumeControl'),
  volumeToggle: () => document.getElementById('volumeToggle'),
  volumeSlider: () => document.getElementById('volumeSlider'),
  volumeIcon: () => document.getElementById('volumeIcon'),

  // Game table & avatars
  gameTable: () => document.querySelector('.game-table'),
  gameMain: () => document.querySelector('.game-main'),
  karatekaAvatar: () => document.getElementById('karatekaAvatar'),

  // Message
  messageText: () => document.getElementById('messageText'),

  // Session stats
  sessionRecord: () => document.getElementById('sessionRecord'),
  sessionProfit: () => document.getElementById('sessionProfit'),

  // Deck count
  deckCount: () => document.getElementById('deckCount'),

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
  insuranceDetails: () => document.getElementById('insuranceDetails'),

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
  playerBet: (i) => document.getElementById(`playerBet${i}`),
  chipStack: (i) => document.getElementById(`chipStack${i}`),

  // Settings & Tutorial
  settingsButton: () => document.getElementById('settingsButton'),
  settingsPanel: () => document.getElementById('settingsPanel'),
  settingsClose: () => document.getElementById('settingsClose'),
  settingsSave: () => document.getElementById('settingsSave'),
  resetStats: () => document.getElementById('resetStats'),
  tutorialOverlay: () => document.getElementById('tutorialOverlay'),
  tutorialClose: () => document.getElementById('tutorialClose'),
  tutorialStart: () => document.getElementById('tutorialStart'),
  dontShowAgain: () => document.getElementById('dontShowAgain')
}

// =============================================================================
// BELT RANK SYSTEM
// =============================================================================

/**
 * Belt ranks based on balance thresholds.
 * @type {Array<{name: string, class: string, minBalance: number}>}
 */
const BELT_RANKS = [
  { name: 'White Belt', class: 'rank-white', minBalance: 0 },
  { name: 'Yellow Belt', class: 'rank-yellow', minBalance: 500 },
  { name: 'Orange Belt', class: 'rank-orange', minBalance: 1000 },
  { name: 'Green Belt', class: 'rank-green', minBalance: 2000 },
  { name: 'Blue Belt', class: 'rank-blue', minBalance: 3500 },
  { name: 'Purple Belt', class: 'rank-purple', minBalance: 5000 },
  { name: 'Brown Belt', class: 'rank-brown', minBalance: 7500 },
  { name: 'Red Belt', class: 'rank-red', minBalance: 10000 },
  { name: 'Black Belt', class: 'rank-black', minBalance: 15000 }
]

/**
 * Updates the belt rank display based on current balance.
 * @param {number} balance - Current player balance
 */
function updateBeltRank(balance) {
  const rankDisplay = elements.rankDisplay()
  const rankName = elements.rankName()

  if (!rankDisplay || !rankName) return

  // Find the highest rank the player has achieved
  let currentRank = BELT_RANKS[0]
  for (const rank of BELT_RANKS) {
    if (balance >= rank.minBalance) {
      currentRank = rank
    }
  }

  // Remove all rank classes and add current one
  BELT_RANKS.forEach((rank) => rankDisplay.classList.remove(rank.class))
  rankDisplay.classList.add(currentRank.class)
  rankName.textContent = currentRank.name
}

// =============================================================================
// SESSION STATS
// =============================================================================

/**
 * Updates the session stats display.
 */
function updateSessionStats() {
  const recordEl = elements.sessionRecord()
  const profitEl = elements.sessionProfit()
  const state = game.getState()

  if (recordEl) {
    recordEl.textContent = `W/L: ${sessionStats.wins}/${sessionStats.losses}`
  }

  if (profitEl) {
    const profit = state.balance - sessionStats.startBalance
    const sign = profit >= 0 ? '+' : ''
    profitEl.textContent = `${sign}$${profit}`
    profitEl.classList.remove('positive', 'negative', 'neutral')
    if (profit > 0) {
      profitEl.classList.add('positive')
    } else if (profit < 0) {
      profitEl.classList.add('negative')
    } else {
      profitEl.classList.add('neutral')
    }
  }
}

/**
 * Records a win in session stats.
 */
function recordWin() {
  sessionStats.wins++
  updateSessionStats()
}

/**
 * Records a loss in session stats.
 */
function recordLoss() {
  sessionStats.losses++
  updateSessionStats()
}

/**
 * Resets session stats.
 */
function resetSessionStats() {
  const state = game.getState()
  sessionStats.wins = 0
  sessionStats.losses = 0
  sessionStats.startBalance = state.balance
  sessionStats.betHistory = []
  updateSessionStats()
}

// =============================================================================
// CHIP DISPLAY
// =============================================================================

/**
 * Breaks an amount into chip denominations.
 * @param {number} amount - Amount to break into chips
 * @returns {number[]} - Array of chip values
 */
function breakIntoChips(amount) {
  const denominations = [500, 100, 50, 10]
  const chips = []
  let remaining = amount

  for (const denom of denominations) {
    while (remaining >= denom) {
      chips.push(denom)
      remaining -= denom
    }
  }

  return chips
}

/**
 * Renders chip stack for a hand.
 * @param {number} handIndex - Hand index
 * @param {number} amount - Bet amount
 */
function renderChipStack(handIndex, amount) {
  const stackEl = elements.chipStack(handIndex)
  if (!stackEl) return

  stackEl.innerHTML = ''

  if (amount <= 0) return

  const chips = breakIntoChips(amount)

  // Limit display to max 8 chips for readability
  const displayChips = chips.slice(0, 8)

  for (const value of displayChips) {
    const chip = document.createElement('div')
    chip.className = `chip chip-${value}`
    chip.textContent = `$${value}`
    chip.setAttribute('aria-label', `$${value} chip`)
    stackEl.appendChild(chip)
  }

  // Show overflow indicator if more chips
  if (chips.length > 8) {
    const overflow = document.createElement('div')
    overflow.className = 'chip-overflow'
    overflow.textContent = `+${chips.length - 8}`
    stackEl.appendChild(overflow)
  }
}

/**
 * Clears all chip stacks.
 */
function clearAllChipStacks() {
  for (let i = 0; i < 3; i++) {
    const stackEl = elements.chipStack(i)
    if (stackEl) {
      stackEl.innerHTML = ''
    }
  }
}

// =============================================================================
// DECK COUNT
// =============================================================================

/**
 * Updates the deck count display.
 */
function updateDeckCount() {
  const deckCountEl = elements.deckCount()
  if (!deckCountEl) return

  const state = game.getState()
  deckCountEl.textContent = state.deckCount || 52

  // Hide if settings say so
  if (!settings.showDeckCount) {
    deckCountEl.style.display = 'none'
  } else {
    deckCountEl.style.display = ''
  }
}

// =============================================================================
// IMPACT EFFECTS
// =============================================================================

/**
 * Triggers screen shake effect on the game table.
 */
function triggerScreenShake() {
  const table = elements.gameTable()
  if (!table) return

  table.classList.add('shake')
  setTimeout(() => table.classList.remove('shake'), 400)
}

/**
 * Triggers victory animation on karateka avatar.
 */
function triggerVictoryPose() {
  const avatar = elements.karatekaAvatar()
  if (!avatar) return

  avatar.classList.remove('defeat')
  avatar.classList.add('victory')
  setTimeout(() => avatar.classList.remove('victory'), 600)
}

/**
 * Triggers defeat animation on karateka avatar.
 */
function triggerDefeatPose() {
  const avatar = elements.karatekaAvatar()
  if (!avatar) return

  avatar.classList.remove('victory')
  avatar.classList.add('defeat')
  setTimeout(() => avatar.classList.remove('defeat'), 600)
}

/**
 * Creates an impact star effect at the specified position.
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
function createImpactStar(x, y) {
  const star = document.createElement('div')
  star.className = 'impact-star'
  star.style.left = `${x}px`
  star.style.top = `${y}px`

  document.body.appendChild(star)
  setTimeout(() => star.remove(), 500)
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
/**
 * Face card image mappings.
 * @type {Object<string, string>}
 */
const FACE_CARD_IMAGES = {
  K: 'assets/face-king.svg',
  Q: 'assets/face-queen.svg',
  J: 'assets/face-jack.svg'
}

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

    // Check if this is a face card
    const faceCardImage = FACE_CARD_IMAGES[card.rank]

    if (faceCardImage) {
      // Render face card with karate character image
      cardEl.classList.add('face-card')
      cardEl.innerHTML = `
        <span class="card-rank card-rank-top" style="color: ${color}">${card.rank}</span>
        <span class="card-suit card-suit-top" style="color: ${color}">${symbol}</span>
        <img class="face-card-image" src="${faceCardImage}" alt="${card.rank}" style="color: ${color}">
        <span class="card-suit card-suit-bottom" style="color: ${color}">${symbol}</span>
        <span class="card-rank card-rank-bottom" style="color: ${color}">${card.rank}</span>
      `
    } else {
      cardEl.innerHTML = `
        <span class="card-rank" style="color: ${color}">${card.rank}</span>
        <span class="card-suit" style="color: ${color}">${symbol}</span>
      `
    }
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
 * Formats hand value with soft indicator.
 * @param {Object} hand - Hand object with value and isSoft properties
 * @returns {string} - Formatted value string
 */
function formatHandValue(hand) {
  if (!hand || hand.value <= 0) return '--'
  if (hand.isSoft && hand.value <= 21) {
    return `Soft ${hand.value}`
  }
  return `${hand.value}`
}

/**
 * Updates the entire UI based on game state.
 */
function updateUI() {
  const state = game.getState()

  // Update balance and belt rank
  elements.balanceAmount().textContent = `$${state.balance}`
  updateBeltRank(state.balance)

  // Update session stats and deck count
  updateSessionStats()
  updateDeckCount()

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
    // Show dealer value with soft indicator
    const dealerValue = state.dealerHand.value
    if (dealerValue > 0 && state.dealerHand.isSoft && dealerValue <= 21) {
      elements.dealerValue().textContent = `Soft ${dealerValue}`
    } else {
      elements.dealerValue().textContent = dealerValue > 0 ? `${dealerValue}` : '--'
    }
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
      // Show soft indicator for player hands
      elements.playerValue(i).textContent = formatHandValue(hand)
      elements.playerBet(i).textContent = hand.bet > 0 ? `$${hand.bet}` : ''

      // Render chip stack for this hand
      renderChipStack(i, hand.bet || 0)
    } else if (i < handCount && state.phase === GAME_PHASES.BETTING) {
      // During betting, show empty hand slots with current bet chips
      handEl.classList.remove('hidden')
      handEl.classList.remove('active')
      renderCards(elements.playerCards(i), [])
      elements.playerValue(i).textContent = '--'
      elements.playerBet(i).textContent = currentBet > 0 ? `$${currentBet}` : ''

      // Show bet chips during betting phase
      renderChipStack(i, currentBet)
    } else {
      handEl.classList.add('hidden')
      // Clear chips for hidden hands
      renderChipStack(i, 0)
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

    case GAME_PHASES.INSURANCE_CHECK: {
      elements.insuranceControls().classList.remove('hidden')
      messageEl.textContent = 'Dealer shows Ace - Insurance?'
      // Update insurance details with actual costs
      const insuranceCost = Math.floor(currentBet / 2)
      const insurancePayout = insuranceCost * 2
      const detailsEl = elements.insuranceDetails()
      if (detailsEl) {
        detailsEl.textContent = `Cost: $${insuranceCost} | Pays $${insurancePayout} if dealer has blackjack`
      }
      // Play insurance offer alert sound
      audioManager.play('insuranceOffer')
      break
    }

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
 * Displays round results and updates session stats.
 * @param {import('./types/index.js').GameState} state
 */
function displayResults(state) {
  const messageEl = elements.messageText()
  const results = []
  let roundWins = 0
  let roundLosses = 0

  for (let i = 0; i < state.playerHands.length; i++) {
    const hand = state.playerHands[i]
    if (!hand || hand.cards.length === 0) continue

    let outcome = ''
    let isWin = false
    let isLoss = false

    if (hand.isBust) {
      outcome = 'Bust'
      isLoss = true
    } else if (state.dealerHand.isBust) {
      outcome = 'Win (Dealer Bust)'
      isWin = true
    } else if (hand.isBlackjack && !state.dealerHand.isBlackjack) {
      outcome = 'Blackjack!'
      isWin = true
    } else if (state.dealerHand.isBlackjack && !hand.isBlackjack) {
      outcome = 'Lose (Dealer BJ)'
      isLoss = true
    } else if (hand.value > state.dealerHand.value) {
      outcome = 'Win'
      isWin = true
    } else if (hand.value < state.dealerHand.value) {
      outcome = 'Lose'
      isLoss = true
    } else {
      outcome = 'Push'
      // Push is neither win nor loss
    }

    if (isWin) roundWins++
    if (isLoss) roundLosses++

    if (state.playerHands.length > 1) {
      results.push(`Hand ${i + 1}: ${outcome}`)
    } else {
      results.push(outcome)
    }
  }

  // Update session stats
  sessionStats.wins += roundWins
  sessionStats.losses += roundLosses
  updateSessionStats()

  // Clear bet history after round completes
  sessionStats.betHistory = []

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

  // Max bet per hand is limited by total balance divided by number of hands
  const maxBetPerHand = Math.floor(state.balance / handCount)
  const maxBet = Math.min(maxBetPerHand, 1000)
  const newBet = Math.min(currentBet + amount, maxBet)

  // Only add chips if bet actually increased
  if (newBet > currentBet) {
    const chipAmount = newBet - currentBet

    // Track bet history for undo
    sessionStats.betHistory.push(chipAmount)

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
  sessionStats.betHistory = [] // Clear bet history

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

  // Check for insurance or auto-proceed based on phase
  if (newState.phase === GAME_PHASES.PLAYER_TURN) {
    const hasActiveHand = findActiveHand()

    // If no active hands (all blackjack/bust), proceed to dealer turn
    if (!hasActiveHand) {
      isAnimating = false
      updateUI()
      await completeRoundIfNeeded()
      return
    }
  } else if (newState.phase === GAME_PHASES.DEALER_TURN) {
    // All player hands are complete (e.g., all blackjacks) - proceed to dealer
    isAnimating = false
    updateUI()
    await completeRoundIfNeeded()
    return
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

    // Check if all player hands have blackjack - instant win (unless dealer could have blackjack)
    const allBlackjack = state.playerHands
      .filter((h) => h && h.cards.length > 0)
      .every((h) => h.isBlackjack)

    // Dealer's face-up card (second card dealt)
    const dealerUpCard = state.dealerHand.cards?.[1]?.rank
    const dealerCouldHaveBlackjack = dealerUpCard === 'A' || dealerUpCard === 10 ||
      dealerUpCard === 'J' || dealerUpCard === 'Q' || dealerUpCard === 'K'

    // If all players have blackjack and dealer can't have blackjack - instant win
    if (allBlackjack && !dealerCouldHaveBlackjack) {
      // Skip dealer turn entirely - player wins instantly
      game.playDealerTurn() // Still need to call for state transition
    } else if (!allBusted) {
      // Normal dealer play required
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

      // Show dealer's hand value after reveal
      const revealedState = game.getState()
      const dealerValue = revealedState.dealerHand.value
      elements.messageText().textContent = `Dealer has ${dealerValue}`
      await new Promise((resolve) => setTimeout(resolve, 800))

      // Play dealer turn (this may add cards)
      game.playDealerTurn()

      // Get state after dealer plays
      const afterDealerState = game.getState()
      const newCardsDealt = afterDealerState.dealerHand.cards.length - initialDealerCards

      // Animate any new dealer cards
      if (animationCoordinator && newCardsDealt > 0) {
        for (let i = initialDealerCards; i < afterDealerState.dealerHand.cards.length; i++) {
          await animationCoordinator.animateDealerHit(
            afterDealerState.dealerHand.cards[i],
            i,
            updateUI
          )
          // Show updated dealer value
          const currentState = game.getState()
          elements.messageText().textContent = `Dealer has ${currentState.dealerHand.value}`
        }
      } else if (dealerValue >= 17) {
        // Dealer stands - show message
        elements.messageText().textContent = `Dealer stands on ${dealerValue}`
        await new Promise((resolve) => setTimeout(resolve, 800))
      }

      // Show final dealer result
      if (afterDealerState.dealerHand.isBust) {
        elements.messageText().textContent = 'Dealer busts!'
        await new Promise((resolve) => setTimeout(resolve, 500))
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
  // Determine overall outcome for avatar animation
  const hasWin = results.some((r) => r.outcome === 'win' || r.outcome === 'blackjack')
  const hasLoss = results.some((r) => r.outcome === 'lose' || r.outcome === 'bust')

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

  // Trigger avatar animation based on overall outcome
  if (hasWin && !hasLoss) {
    triggerVictoryPose()
  } else if (hasLoss && !hasWin) {
    triggerDefeatPose()
    triggerScreenShake()
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
    triggerScreenShake()
    triggerDefeatPose()
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
    triggerScreenShake()
    triggerDefeatPose()
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

  // Get state BEFORE split to capture original cards
  const stateBefore = game.getState()
  const originalHand = stateBefore.playerHands[activeHandIndex]
  const originalCard1 = originalHand?.cards?.[0]
  const originalCard2 = originalHand?.cards?.[1]
  const originalHandCount = stateBefore.playerHands.length

  // Perform the split
  game.split(activeHandIndex)

  // Get state AFTER split to get newly dealt cards
  const stateAfter = game.getState()
  const newHand1 = stateAfter.playerHands[activeHandIndex]
  const newHand2 = stateAfter.playerHands[activeHandIndex + 1]
  const newCard1 = newHand1?.cards?.[1] // Second card in first hand (dealt after split)
  const newCard2 = newHand2?.cards?.[1] // Second card in second hand (dealt after split)
  const newHandCount = stateAfter.playerHands.length

  // Animate the split if we have the animation coordinator
  if (animationCoordinator && originalCard1 && originalCard2 && newCard1 && newCard2) {
    await animationCoordinator.animateSplit(
      originalCard1,
      originalCard2,
      newCard1,
      newCard2,
      activeHandIndex,
      newHandCount,
      updateUI
    )
  }

  const hand = stateAfter.playerHands[activeHandIndex]

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
// KEYBOARD SHORTCUTS
// =============================================================================

/**
 * Sets up keyboard shortcuts for game actions.
 */
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in an input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

    const state = game.getState()

    switch (e.key.toLowerCase()) {
      case 'h':
        if (state.phase === GAME_PHASES.PLAYER_TURN && !elements.hitButton().disabled) {
          hit()
        }
        break
      case 's':
        if (state.phase === GAME_PHASES.PLAYER_TURN && !elements.standButton().disabled) {
          stand()
        }
        break
      case 'd':
        if (state.phase === GAME_PHASES.PLAYER_TURN && !elements.doubleButton().disabled) {
          doubleDown()
        }
        break
      case 'p':
        if (state.phase === GAME_PHASES.PLAYER_TURN && !elements.splitButton().disabled) {
          splitHand()
        }
        break
      case ' ':
      case 'enter':
        e.preventDefault()
        if (state.phase === GAME_PHASES.BETTING && !elements.dealButton().disabled) {
          deal()
        } else if (
          state.phase === GAME_PHASES.RESOLUTION ||
          state.phase === GAME_PHASES.GAME_OVER
        ) {
          newRound()
        }
        break
      case 'y':
        if (state.phase === GAME_PHASES.INSURANCE_CHECK) {
          takeInsurance()
        }
        break
      case 'n':
        if (state.phase === GAME_PHASES.INSURANCE_CHECK) {
          declineInsurance()
        }
        break
      case 'escape':
        // Close settings or tutorial if open
        elements.settingsPanel()?.classList.add('hidden')
        elements.tutorialOverlay()?.classList.add('hidden')
        break
    }
  })
}

// =============================================================================
// SETTINGS PANEL
// =============================================================================

/**
 * Loads settings from localStorage.
 */
function loadSettings() {
  const saved = localStorage.getItem('karateBlackjack_settings')
  if (saved) {
    try {
      const parsed = JSON.parse(saved)
      settings = { ...settings, ...parsed }
    } catch {
      console.warn('Failed to parse saved settings')
    }
  }

  // Apply loaded settings
  applySettings()
}

/**
 * Saves settings to localStorage.
 */
function saveSettings() {
  localStorage.setItem('karateBlackjack_settings', JSON.stringify(settings))
}

/**
 * Applies current settings to the UI.
 */
function applySettings() {
  // Apply table color
  const gameMain = elements.gameMain()
  if (gameMain) {
    gameMain.classList.remove('table-green', 'table-blue', 'table-red')
    if (settings.tableColor !== 'green') {
      gameMain.classList.add(`table-${settings.tableColor}`)
    }
  }

  // Apply deck count visibility
  updateDeckCount()

  // Apply volume from settings
  const savedVolume = localStorage.getItem('karateBlackjack_volume')
  if (savedVolume) {
    audioManager.setVolume(parseFloat(savedVolume))
  }
}

/**
 * Sets up settings panel event handlers.
 */
function setupSettingsPanel() {
  const settingsButton = elements.settingsButton()
  const settingsPanel = elements.settingsPanel()
  const settingsClose = elements.settingsClose()
  const settingsSave = elements.settingsSave()
  const resetStatsBtn = elements.resetStats()

  if (!settingsButton || !settingsPanel) return

  // Open settings
  settingsButton.addEventListener('click', () => {
    settingsPanel.classList.remove('hidden')
    // Populate current settings
    const volumeInput = document.getElementById('settingsVolume')
    const speedSelect = document.getElementById('animationSpeed')
    const colorSelect = document.getElementById('tableColor')
    const deckCountCheck = document.getElementById('showDeckCount')
    const tutorialCheck = document.getElementById('showTutorial')

    if (volumeInput) volumeInput.value = Math.round(audioManager.getVolume() * 100)
    if (speedSelect) speedSelect.value = settings.animationSpeed
    if (colorSelect) colorSelect.value = settings.tableColor
    if (deckCountCheck) deckCountCheck.checked = settings.showDeckCount
    if (tutorialCheck) tutorialCheck.checked = settings.showTutorial
  })

  // Close settings
  settingsClose?.addEventListener('click', () => {
    settingsPanel.classList.add('hidden')
  })

  // Save settings
  settingsSave?.addEventListener('click', () => {
    const volumeInput = document.getElementById('settingsVolume')
    const speedSelect = document.getElementById('animationSpeed')
    const colorSelect = document.getElementById('tableColor')
    const deckCountCheck = document.getElementById('showDeckCount')
    const tutorialCheck = document.getElementById('showTutorial')

    if (volumeInput) {
      const volume = parseInt(volumeInput.value) / 100
      audioManager.setVolume(volume)
      localStorage.setItem('karateBlackjack_volume', volume.toString())
      updateVolumeUI()
    }
    if (speedSelect) settings.animationSpeed = speedSelect.value
    if (colorSelect) settings.tableColor = colorSelect.value
    if (deckCountCheck) settings.showDeckCount = deckCountCheck.checked
    if (tutorialCheck) settings.showTutorial = tutorialCheck.checked

    saveSettings()
    applySettings()
    settingsPanel.classList.add('hidden')
  })

  // Reset stats
  resetStatsBtn?.addEventListener('click', () => {
    resetSessionStats()
  })

  // Close on backdrop click
  settingsPanel.addEventListener('click', (e) => {
    if (e.target === settingsPanel) {
      settingsPanel.classList.add('hidden')
    }
  })
}

// =============================================================================
// TUTORIAL OVERLAY
// =============================================================================

/**
 * Sets up tutorial overlay event handlers.
 */
function setupTutorialOverlay() {
  const tutorialOverlay = elements.tutorialOverlay()
  const tutorialClose = elements.tutorialClose()
  const tutorialStart = elements.tutorialStart()
  const dontShowAgain = elements.dontShowAgain()

  if (!tutorialOverlay) return

  const closeTutorial = () => {
    tutorialOverlay.classList.add('hidden')
    if (dontShowAgain?.checked) {
      localStorage.setItem('karateBlackjack_tutorialSeen', 'true')
      settings.showTutorial = false
      saveSettings()
    }
  }

  tutorialClose?.addEventListener('click', closeTutorial)
  tutorialStart?.addEventListener('click', closeTutorial)

  // Close on backdrop click
  tutorialOverlay.addEventListener('click', (e) => {
    if (e.target === tutorialOverlay) {
      closeTutorial()
    }
  })
}

// =============================================================================
// UNDO BET
// =============================================================================

/**
 * Undoes the last bet addition.
 */
function undoLastBet() {
  if (sessionStats.betHistory.length === 0) return

  const state = game.getState()
  if (state.phase !== GAME_PHASES.BETTING) return

  const lastBet = sessionStats.betHistory.pop()
  if (lastBet && currentBet >= lastBet) {
    // Refund the bet
    game._bettingSystem._balance += lastBet
    currentBet -= lastBet

    audioManager.play('buttonClick')
    updateUI()
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

  // Load settings from localStorage
  loadSettings()

  // Setup keyboard shortcuts
  setupKeyboardShortcuts()

  // Setup settings and tutorial handlers
  setupSettingsPanel()
  setupTutorialOverlay()

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
    },
    closeTutorial: () => {
      elements.tutorialOverlay()?.classList.add('hidden')
    }
  }

  // Show tutorial for first-time visitors (skip during E2E tests)
  // Check for playwright or test API to skip in test environment
  const isTestEnv = navigator.webdriver || window.playwright
  if (settings.showTutorial && !localStorage.getItem('karateBlackjack_tutorialSeen') && !isTestEnv) {
    elements.tutorialOverlay()?.classList.remove('hidden')
  }
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeGame)
} else {
  initializeGame()
}
