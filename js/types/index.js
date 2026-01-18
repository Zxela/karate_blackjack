/**
 * @fileoverview Core type definitions for Karate Blackjack game.
 *
 * This module defines all game types using JSDoc @typedef for JavaScript with
 * runtime validation patterns. These types establish the foundation that all
 * other game components depend on.
 *
 * @module types
 * @version 1.0.0
 */

// =============================================================================
// CONSTANT DEFINITIONS
// =============================================================================

/**
 * Valid suit values for cards.
 * @readonly
 * @enum {string}
 */
export const SUITS = Object.freeze({
  HEARTS: 'hearts',
  DIAMONDS: 'diamonds',
  CLUBS: 'clubs',
  SPADES: 'spades'
})

/**
 * Array of all valid suit values for iteration.
 * @type {readonly string[]}
 */
export const SUIT_VALUES = Object.freeze(Object.values(SUITS))

/**
 * Valid rank values for cards.
 * Numeric ranks are stored as numbers (2-10), face cards as strings.
 * @readonly
 * @enum {number|string}
 */
export const RANKS = Object.freeze({
  TWO: 2,
  THREE: 3,
  FOUR: 4,
  FIVE: 5,
  SIX: 6,
  SEVEN: 7,
  EIGHT: 8,
  NINE: 9,
  TEN: 10,
  JACK: 'J',
  QUEEN: 'Q',
  KING: 'K',
  ACE: 'A'
})

/**
 * Array of all valid rank values for iteration.
 * @type {readonly (number|string)[]}
 */
export const RANK_VALUES = Object.freeze(Object.values(RANKS))

/**
 * Valid game phase values.
 * @readonly
 * @enum {string}
 */
export const GAME_PHASES = Object.freeze({
  BETTING: 'betting',
  DEALING: 'dealing',
  INSURANCE_CHECK: 'insuranceCheck',
  PLAYER_TURN: 'playerTurn',
  DEALER_TURN: 'dealerTurn',
  RESOLUTION: 'resolution',
  GAME_OVER: 'gameOver'
})

/**
 * Array of all valid game phase values for iteration.
 * @type {readonly string[]}
 */
export const GAME_PHASE_VALUES = Object.freeze(Object.values(GAME_PHASES))

/**
 * Valid round outcome values.
 * @readonly
 * @enum {string}
 */
export const OUTCOMES = Object.freeze({
  WIN: 'win',
  LOSE: 'lose',
  PUSH: 'push',
  BLACKJACK: 'blackjack'
})

/**
 * Array of all valid outcome values for iteration.
 * @type {readonly string[]}
 */
export const OUTCOME_VALUES = Object.freeze(Object.values(OUTCOMES))

/**
 * Default player configuration values.
 * @readonly
 */
export const DEFAULTS = Object.freeze({
  INITIAL_BALANCE: 1000,
  MIN_BET: 10,
  MAX_BET: 500,
  DECK_COUNT: 6  // Standard casino shoe (6 decks = 312 cards)
})

// =============================================================================
// TYPE DEFINITIONS (JSDoc @typedef)
// =============================================================================

/**
 * Card suit representing one of the four standard playing card suits.
 *
 * @typedef {'hearts' | 'diamonds' | 'clubs' | 'spades'} Suit
 *
 * @example
 * // Valid suit values
 * const heartsSuit = 'hearts'
 * const diamondsSuit = 'diamonds'
 */

/**
 * Card rank representing the value of a card.
 * Number cards (2-10) are represented as numbers.
 * Face cards (J, Q, K) and Ace (A) are represented as strings.
 *
 * @typedef {2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 'J' | 'Q' | 'K' | 'A'} Rank
 *
 * @example
 * // Valid rank values
 * const numericRank = 7
 * const faceRank = 'K'
 * const aceRank = 'A'
 */

/**
 * A playing card with suit, rank, and unique identifier.
 *
 * @typedef {Object} Card
 * @property {Suit} suit - The suit of the card (hearts, diamonds, clubs, spades)
 * @property {Rank} rank - The rank of the card (2-10, J, Q, K, A)
 * @property {string} id - Unique identifier for the card (e.g., 'hearts-A', 'spades-10')
 *
 * @example
 * // Creating a card object
 * const aceOfSpades = {
 *   suit: 'spades',
 *   rank: 'A',
 *   id: 'spades-A'
 * }
 *
 * const sevenOfHearts = {
 *   suit: 'hearts',
 *   rank: 7,
 *   id: 'hearts-7'
 * }
 */

/**
 * State of a player's or dealer's hand during the game.
 *
 * @typedef {Object} HandState
 * @property {Card[]} cards - Array of cards currently in the hand
 * @property {number} value - Current calculated value of the hand (best non-bust value)
 * @property {boolean} isSoft - True if the hand contains an Ace counted as 11
 * @property {boolean} isBust - True if the hand value exceeds 21
 * @property {boolean} isBlackjack - True if the hand is a natural blackjack (Ace + 10-value card, 2 cards only)
 * @property {boolean} isStanding - True if the player has chosen to stand on this hand
 * @property {boolean} isDoubled - True if the player has doubled down on this hand
 * @property {boolean} isSplit - True if this hand was created from a split
 * @property {number} bet - The bet amount placed on this hand
 *
 * @example
 * // Initial hand state
 * const initialHandState = {
 *   cards: [],
 *   value: 0,
 *   isSoft: false,
 *   isBust: false,
 *   isBlackjack: false,
 *   isStanding: false,
 *   isDoubled: false,
 *   isSplit: false,
 *   bet: 0
 * }
 *
 * // Hand with a soft 17 (Ace + 6)
 * const softSeventeen = {
 *   cards: [
 *     { suit: 'hearts', rank: 'A', id: 'hearts-A' },
 *     { suit: 'clubs', rank: 6, id: 'clubs-6' }
 *   ],
 *   value: 17,
 *   isSoft: true,
 *   isBust: false,
 *   isBlackjack: false,
 *   isStanding: false,
 *   isDoubled: false,
 *   isSplit: false,
 *   bet: 100
 * }
 */

/**
 * Current phase of the game, controlling valid player actions and game flow.
 *
 * Phases:
 * - 'betting': Players place bets before cards are dealt
 * - 'dealing': Initial cards are being dealt to players and dealer
 * - 'insuranceCheck': Dealer shows Ace, players decide on insurance
 * - 'playerTurn': Players take actions (hit, stand, double, split)
 * - 'dealerTurn': Dealer reveals hole card and plays according to rules
 * - 'resolution': Round outcomes are calculated and payouts processed
 * - 'gameOver': Player has lost all chips, game cannot continue
 *
 * @typedef {'betting' | 'dealing' | 'insuranceCheck' | 'playerTurn' | 'dealerTurn' | 'resolution' | 'gameOver'} GamePhase
 *
 * @example
 * // Valid phase values
 * const currentPhase = 'playerTurn'
 */

/**
 * Complete game state at any point in time.
 * This is the central state object that represents the entire game.
 *
 * @typedef {Object} GameState
 * @property {GamePhase} phase - Current phase of the game
 * @property {HandState[]} playerHands - Array of player hands (1-3 hands supported)
 * @property {HandState} dealerHand - The dealer's hand state
 * @property {number} balance - Player's current chip balance
 * @property {number[]} bets - Array of bet amounts for each hand (aligned with playerHands)
 * @property {number} insuranceBet - Amount bet on insurance (0 if not taken)
 * @property {number} currentHandIndex - Index of the currently active player hand (0-2)
 * @property {boolean} insuranceOffered - True if insurance is currently being offered
 * @property {boolean} insuranceTaken - True if player accepted insurance
 * @property {string[]} messages - Array of game messages for display to the player
 *
 * @example
 * // Initial game state
 * const initialGameState = {
 *   phase: 'betting',
 *   playerHands: [],
 *   dealerHand: {
 *     cards: [],
 *     value: 0,
 *     isSoft: false,
 *     isBust: false,
 *     isBlackjack: false,
 *     isStanding: false,
 *     isDoubled: false,
 *     isSplit: false,
 *     bet: 0
 *   },
 *   balance: 1000,
 *   bets: [],
 *   insuranceBet: 0,
 *   currentHandIndex: 0,
 *   insuranceOffered: false,
 *   insuranceTaken: false,
 *   messages: []
 * }
 */

/**
 * Configuration options for initializing a player's game session.
 *
 * @typedef {Object} PlayerConfig
 * @property {number} initialBalance - Starting chip balance (default: 1000)
 * @property {number} [minBet] - Minimum allowed bet amount (default: 10)
 * @property {number} [maxBet] - Maximum allowed bet amount (default: 500)
 *
 * @example
 * // Default configuration
 * const defaultConfig = {
 *   initialBalance: 1000,
 *   minBet: 10,
 *   maxBet: 500
 * }
 *
 * // Custom configuration
 * const customConfig = {
 *   initialBalance: 5000,
 *   minBet: 25,
 *   maxBet: 1000
 * }
 */

/**
 * Result of a completed round for a single hand.
 *
 * @typedef {Object} RoundResult
 * @property {number} handIndex - Index of the hand this result applies to (0-2)
 * @property {'win' | 'lose' | 'push' | 'blackjack'} outcome - The outcome type
 * @property {number} winnings - Net amount won or lost (negative for losses)
 * @property {string} message - Human-readable description of the outcome
 *
 * @example
 * // Player wins with blackjack (3:2 payout)
 * const blackjackWin = {
 *   handIndex: 0,
 *   outcome: 'blackjack',
 *   winnings: 150, // 100 bet returns 250 (bet + 1.5x)
 *   message: 'Blackjack! You win 3:2!'
 * }
 *
 * // Player wins normally (1:1 payout)
 * const normalWin = {
 *   handIndex: 0,
 *   outcome: 'win',
 *   winnings: 100,
 *   message: 'You win!'
 * }
 *
 * // Push (tie)
 * const pushResult = {
 *   handIndex: 0,
 *   outcome: 'push',
 *   winnings: 0,
 *   message: 'Push - bet returned'
 * }
 *
 * // Player loses
 * const loseResult = {
 *   handIndex: 0,
 *   outcome: 'lose',
 *   winnings: -100,
 *   message: 'Dealer wins'
 * }
 */

// =============================================================================
// TYPE GUARDS AND VALIDATION FUNCTIONS
// =============================================================================

/**
 * Checks if a value is a valid Suit.
 *
 * @param {unknown} value - The value to check
 * @returns {value is Suit} True if the value is a valid suit
 *
 * @example
 * isSuit('hearts')  // true
 * isSuit('invalid') // false
 * isSuit(123)       // false
 */
export function isSuit(value) {
  return typeof value === 'string' && SUIT_VALUES.includes(value)
}

/**
 * Checks if a value is a valid Rank.
 *
 * @param {unknown} value - The value to check
 * @returns {value is Rank} True if the value is a valid rank
 *
 * @example
 * isRank(7)     // true
 * isRank('K')   // true
 * isRank('A')   // true
 * isRank(11)    // false
 * isRank('X')   // false
 */
export function isRank(value) {
  return RANK_VALUES.includes(value)
}

/**
 * Checks if an object is a valid Card.
 *
 * @param {unknown} value - The value to check
 * @returns {value is Card} True if the value is a valid Card object
 *
 * @example
 * isCard({ suit: 'hearts', rank: 'A', id: 'hearts-A' }) // true
 * isCard({ suit: 'hearts', rank: 'A' })                 // false (missing id)
 * isCard({ suit: 'invalid', rank: 'A', id: 'x-A' })     // false (invalid suit)
 */
export function isCard(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const card = /** @type {Record<string, unknown>} */ (value)
  return isSuit(card.suit) && isRank(card.rank) && typeof card.id === 'string' && card.id.length > 0
}

/**
 * Checks if a value is a valid GamePhase.
 *
 * @param {unknown} value - The value to check
 * @returns {value is GamePhase} True if the value is a valid game phase
 *
 * @example
 * isGamePhase('betting')     // true
 * isGamePhase('playerTurn')  // true
 * isGamePhase('invalid')     // false
 */
export function isGamePhase(value) {
  return typeof value === 'string' && GAME_PHASE_VALUES.includes(value)
}

/**
 * Checks if a value is a valid outcome.
 *
 * @param {unknown} value - The value to check
 * @returns {value is 'win' | 'lose' | 'push' | 'blackjack'} True if the value is a valid outcome
 *
 * @example
 * isOutcome('win')       // true
 * isOutcome('blackjack') // true
 * isOutcome('invalid')   // false
 */
export function isOutcome(value) {
  return typeof value === 'string' && OUTCOME_VALUES.includes(value)
}

/**
 * Checks if an object is a valid HandState.
 * Performs structural validation of all required properties.
 *
 * @param {unknown} value - The value to check
 * @returns {value is HandState} True if the value is a valid HandState object
 *
 * @example
 * const validHand = {
 *   cards: [],
 *   value: 0,
 *   isSoft: false,
 *   isBust: false,
 *   isBlackjack: false,
 *   isStanding: false,
 *   isDoubled: false,
 *   isSplit: false,
 *   bet: 0
 * }
 * isHandState(validHand) // true
 */
export function isHandState(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const hand = /** @type {Record<string, unknown>} */ (value)
  return (
    Array.isArray(hand.cards) &&
    hand.cards.every(isCard) &&
    typeof hand.value === 'number' &&
    typeof hand.isSoft === 'boolean' &&
    typeof hand.isBust === 'boolean' &&
    typeof hand.isBlackjack === 'boolean' &&
    typeof hand.isStanding === 'boolean' &&
    typeof hand.isDoubled === 'boolean' &&
    typeof hand.isSplit === 'boolean' &&
    typeof hand.bet === 'number'
  )
}

/**
 * Checks if an object is a valid PlayerConfig.
 *
 * @param {unknown} value - The value to check
 * @returns {value is PlayerConfig} True if the value is a valid PlayerConfig object
 *
 * @example
 * isPlayerConfig({ initialBalance: 1000 }) // true
 * isPlayerConfig({ initialBalance: 1000, minBet: 10, maxBet: 500 }) // true
 * isPlayerConfig({ balance: 1000 }) // false (wrong property name)
 */
export function isPlayerConfig(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const config = /** @type {Record<string, unknown>} */ (value)
  if (typeof config.initialBalance !== 'number' || config.initialBalance < 0) {
    return false
  }
  if (config.minBet !== undefined && typeof config.minBet !== 'number') {
    return false
  }
  if (config.maxBet !== undefined && typeof config.maxBet !== 'number') {
    return false
  }
  return true
}

/**
 * Checks if an object is a valid RoundResult.
 *
 * @param {unknown} value - The value to check
 * @returns {value is RoundResult} True if the value is a valid RoundResult object
 *
 * @example
 * const validResult = {
 *   handIndex: 0,
 *   outcome: 'win',
 *   winnings: 100,
 *   message: 'You win!'
 * }
 * isRoundResult(validResult) // true
 */
export function isRoundResult(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const result = /** @type {Record<string, unknown>} */ (value)
  return (
    typeof result.handIndex === 'number' &&
    result.handIndex >= 0 &&
    result.handIndex <= 2 &&
    isOutcome(result.outcome) &&
    typeof result.winnings === 'number' &&
    typeof result.message === 'string'
  )
}

/**
 * Checks if an object is a valid GameState.
 * Performs deep validation of all nested structures.
 *
 * @param {unknown} value - The value to check
 * @returns {value is GameState} True if the value is a valid GameState object
 *
 * @example
 * isGameState(initialGameState) // true (if properly structured)
 */
export function isGameState(value) {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const state = /** @type {Record<string, unknown>} */ (value)
  return (
    isGamePhase(state.phase) &&
    Array.isArray(state.playerHands) &&
    state.playerHands.every(isHandState) &&
    isHandState(state.dealerHand) &&
    typeof state.balance === 'number' &&
    state.balance >= 0 &&
    Array.isArray(state.bets) &&
    state.bets.every((/** @type {unknown} */ bet) => typeof bet === 'number') &&
    typeof state.insuranceBet === 'number' &&
    typeof state.currentHandIndex === 'number' &&
    state.currentHandIndex >= 0 &&
    typeof state.insuranceOffered === 'boolean' &&
    typeof state.insuranceTaken === 'boolean' &&
    Array.isArray(state.messages) &&
    state.messages.every((/** @type {unknown} */ msg) => typeof msg === 'string')
  )
}

// =============================================================================
// FACTORY FUNCTIONS
// =============================================================================

/**
 * Creates a new Card object with automatic ID generation.
 *
 * @param {Suit} suit - The suit of the card
 * @param {Rank} rank - The rank of the card
 * @returns {Card} A new Card object
 * @throws {Error} If suit or rank is invalid
 *
 * @example
 * const card = createCard('hearts', 'A')
 * // { suit: 'hearts', rank: 'A', id: 'hearts-A' }
 */
export function createCard(suit, rank) {
  if (!isSuit(suit)) {
    throw new Error(`Invalid suit: ${suit}`)
  }
  if (!isRank(rank)) {
    throw new Error(`Invalid rank: ${rank}`)
  }
  return {
    suit,
    rank,
    id: `${suit}-${rank}`
  }
}

/**
 * Creates an initial empty HandState object.
 *
 * @param {number} [bet=0] - Initial bet amount for the hand
 * @returns {HandState} A new empty HandState object
 *
 * @example
 * const hand = createEmptyHandState(100)
 * // { cards: [], value: 0, isSoft: false, ... bet: 100 }
 */
export function createEmptyHandState(bet = 0) {
  return {
    cards: [],
    value: 0,
    isSoft: false,
    isBust: false,
    isBlackjack: false,
    isStanding: false,
    isDoubled: false,
    isSplit: false,
    bet
  }
}

/**
 * Creates an initial GameState object with default values.
 *
 * @param {PlayerConfig} [config] - Optional player configuration
 * @returns {GameState} A new initial GameState object
 *
 * @example
 * const state = createInitialGameState()
 * // { phase: 'betting', balance: 1000, ... }
 *
 * const customState = createInitialGameState({ initialBalance: 5000 })
 * // { phase: 'betting', balance: 5000, ... }
 */
export function createInitialGameState(config) {
  const balance = config?.initialBalance ?? DEFAULTS.INITIAL_BALANCE
  return {
    phase: /** @type {GamePhase} */ (GAME_PHASES.BETTING),
    playerHands: [],
    dealerHand: createEmptyHandState(),
    balance,
    bets: [],
    insuranceBet: 0,
    currentHandIndex: 0,
    insuranceOffered: false,
    insuranceTaken: false,
    messages: []
  }
}

/**
 * Creates a RoundResult object.
 *
 * @param {number} handIndex - Index of the hand (0-2)
 * @param {'win' | 'lose' | 'push' | 'blackjack'} outcome - The outcome type
 * @param {number} winnings - Net amount won or lost
 * @param {string} message - Human-readable message
 * @returns {RoundResult} A new RoundResult object
 *
 * @example
 * const result = createRoundResult(0, 'win', 100, 'You win!')
 */
export function createRoundResult(handIndex, outcome, winnings, message) {
  if (handIndex < 0 || handIndex > 2) {
    throw new Error(`Invalid handIndex: ${handIndex}. Must be 0-2.`)
  }
  if (!isOutcome(outcome)) {
    throw new Error(`Invalid outcome: ${outcome}`)
  }
  return {
    handIndex,
    outcome,
    winnings,
    message
  }
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Gets the numeric value of a card for hand calculation.
 * Face cards (J, Q, K) are worth 10.
 * Ace is worth 11 by default (caller must handle soft/hard logic).
 * Number cards (2-10) are worth their face value.
 *
 * @param {Rank} rank - The rank to get the value for
 * @returns {number} The numeric value of the rank
 *
 * @example
 * getCardValue(7)   // 7
 * getCardValue('K') // 10
 * getCardValue('A') // 11
 */
export function getCardValue(rank) {
  if (typeof rank === 'number') {
    return rank
  }
  if (rank === 'A') {
    return 11
  }
  // J, Q, K all worth 10
  return 10
}

/**
 * Generates a unique card ID from suit and rank.
 *
 * @param {Suit} suit - The suit of the card
 * @param {Rank} rank - The rank of the card
 * @returns {string} The unique card ID
 *
 * @example
 * generateCardId('hearts', 'A') // 'hearts-A'
 * generateCardId('spades', 10)  // 'spades-10'
 */
export function generateCardId(suit, rank) {
  return `${suit}-${rank}`
}

/**
 * Parses a card ID back into suit and rank components.
 *
 * @param {string} id - The card ID to parse
 * @returns {{ suit: Suit, rank: Rank } | null} The parsed components, or null if invalid
 *
 * @example
 * parseCardId('hearts-A')  // { suit: 'hearts', rank: 'A' }
 * parseCardId('spades-10') // { suit: 'spades', rank: 10 }
 * parseCardId('invalid')   // null
 */
export function parseCardId(id) {
  const lastDashIndex = id.lastIndexOf('-')
  if (lastDashIndex === -1) {
    return null
  }

  const suitPart = id.substring(0, lastDashIndex)
  const rankPart = id.substring(lastDashIndex + 1)

  if (!isSuit(suitPart)) {
    return null
  }

  // Try parsing as number first
  const numericRank = Number.parseInt(rankPart, 10)
  const rank = Number.isNaN(numericRank) ? rankPart : numericRank

  if (!isRank(rank)) {
    return null
  }

  return {
    suit: /** @type {Suit} */ (suitPart),
    rank: /** @type {Rank} */ (rank)
  }
}
