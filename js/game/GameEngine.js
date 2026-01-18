/**
 * @fileoverview GameEngine core implementation for Karate Blackjack game.
 *
 * This module provides the GameEngine class that orchestrates all game components
 * including CardDeck, Hand, BettingSystem, GameStateMachine, and DealerAI.
 * It manages the complete game flow from betting through resolution.
 *
 * @module game/GameEngine
 * @version 1.0.0
 */

import { GameStateMachine } from '../state/GameStateMachine.js'
import { DEFAULTS, GAME_PHASES, createRoundResult } from '../types/index.js'
import { BettingSystem } from './BettingSystem.js'
import { CardDeck } from './CardDeck.js'
import { DealerAI } from './DealerAI.js'
import { Hand } from './Hand.js'

// =============================================================================
// CONSTANTS
// =============================================================================

/**
 * Maximum number of player hands supported.
 * @type {number}
 */
const MAX_HANDS = 3

/**
 * Payout multipliers for different outcomes.
 * @type {Object}
 */
const PAYOUT_MULTIPLIERS = Object.freeze({
  WIN: 2.0, // 1:1 payout (bet + winnings)
  BLACKJACK: 2.5, // 3:2 payout (bet + 1.5x bet)
  PUSH: 1.0, // Return original bet
  LOSE: 0 // No payout
})

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Creates a hand state object from a Hand instance.
 * @param {import('./Hand.js').Hand} hand - The Hand instance
 * @param {number} bet - The bet amount for this hand
 * @returns {import('../types/index.js').HandState}
 */
function createHandState(hand, bet = 0) {
  return {
    cards: hand.getCards(),
    value: hand.getValue(),
    isSoft: hand.isSoft(),
    isBust: hand.isBust(),
    isBlackjack: hand.isBlackjack(),
    isStanding: false,
    isDoubled: false,
    isSplit: false,
    canSplit: hand.canSplit(),
    bet
  }
}

/**
 * Creates an empty hand state.
 * @returns {import('../types/index.js').HandState}
 */
function createEmptyHandState() {
  return {
    cards: [],
    value: 0,
    isSoft: false,
    isBust: false,
    isBlackjack: false,
    isStanding: false,
    isDoubled: false,
    isSplit: false,
    canSplit: false,
    bet: 0
  }
}

// =============================================================================
// GAME ENGINE CLASS
// =============================================================================

/**
 * GameEngine orchestrates all game components and manages the complete game flow.
 *
 * The GameEngine coordinates:
 * - CardDeck: Manages the deck of cards
 * - Hand: Tracks player and dealer hands
 * - BettingSystem: Handles balance and bets
 * - GameStateMachine: Manages game phase transitions
 * - DealerAI: Controls dealer decisions
 *
 * @class GameEngine
 *
 * @example
 * // Create a new game engine with default settings
 * const engine = new GameEngine()
 *
 * // Start a new round
 * engine.startNewRound()
 *
 * // Place a bet
 * engine.placeBet(0, 100)
 *
 * // Deal cards
 * engine.deal()
 *
 * // Player actions
 * engine.hit(0)
 * engine.stand(0)
 *
 * // Dealer plays
 * engine.playDealerTurn()
 *
 * // Resolve round
 * const results = engine.resolveRound()
 */
export class GameEngine {
  /**
   * Creates a new GameEngine instance.
   *
   * @param {Object} [config] - Game configuration
   * @param {number} [config.initialBalance=1000] - Starting chip balance
   * @param {number} [config.minBet=10] - Minimum allowed bet
   * @param {number} [config.maxBet=500] - Maximum allowed bet
   *
   * @example
   * // Default configuration
   * const engine = new GameEngine()
   *
   * // Custom configuration
   * const highRoller = new GameEngine({
   *   initialBalance: 10000,
   *   minBet: 100,
   *   maxBet: 5000
   * })
   */
  constructor(config = {}) {
    const {
      initialBalance = DEFAULTS.INITIAL_BALANCE,
      minBet = DEFAULTS.MIN_BET,
      maxBet = DEFAULTS.MAX_BET
    } = config

    /**
     * Card deck for dealing.
     * @type {CardDeck}
     * @private
     */
    this._deck = new CardDeck()
    this._deck.createStandardDeck().shuffle()

    /**
     * Betting system for balance management.
     * @type {BettingSystem}
     * @private
     */
    this._bettingSystem = new BettingSystem(initialBalance, minBet, maxBet)

    /**
     * Game state machine for phase management.
     * @type {GameStateMachine}
     * @private
     */
    this._stateMachine = new GameStateMachine()

    /**
     * Dealer AI for automated dealer decisions.
     * @type {DealerAI}
     * @private
     */
    this._dealerAI = new DealerAI()

    /**
     * Array of player Hand instances.
     * @type {Hand[]}
     * @private
     */
    this._playerHands = []

    /**
     * Dealer's Hand instance.
     * @type {Hand}
     * @private
     */
    this._dealerHand = new Hand()

    /**
     * Array of bet amounts corresponding to player hands.
     * @type {number[]}
     * @private
     */
    this._bets = []

    /**
     * Index of the currently active player hand.
     * @type {number}
     * @private
     */
    this._currentHandIndex = 0

    /**
     * Whether insurance is currently being offered.
     * @type {boolean}
     * @private
     */
    this._insuranceOffered = false

    /**
     * Whether player has taken insurance.
     * @type {boolean}
     * @private
     */
    this._insuranceTaken = false

    /**
     * Insurance bet amount.
     * @type {number}
     * @private
     */
    this._insuranceBet = 0

    /**
     * Array of standing status for each hand.
     * @type {boolean[]}
     * @private
     */
    this._handStanding = []

    /**
     * Array of doubled status for each hand.
     * @type {boolean[]}
     * @private
     */
    this._handDoubled = []

    /**
     * Array of split status for each hand.
     * @type {boolean[]}
     * @private
     */
    this._handSplit = []

    /**
     * Array of subscriber callbacks.
     * @type {Function[]}
     * @private
     */
    this._subscribers = []

    /**
     * Minimum bet amount.
     * @type {number}
     * @private
     */
    this._minBet = minBet

    /**
     * Maximum bet amount.
     * @type {number}
     * @private
     */
    this._maxBet = maxBet

    /**
     * Test flag to force dealer to show Ace.
     * @type {boolean}
     * @private
     */
    this._testDealerShowsAce = false

    /**
     * Test flag to force player to get a splittable pair.
     * @type {boolean}
     * @private
     */
    this._testForcePair = false

    /**
     * Test rank for forced pair (e.g., '8' for two 8s).
     * @type {string|null}
     * @private
     */
    this._testPairRank = null

    /**
     * Number of hands to play (1-3).
     * @type {number}
     * @private
     */
    this._handCount = 1
  }

  // ===========================================================================
  // STATE MANAGEMENT
  // ===========================================================================

  /**
   * Returns the current game state.
   *
   * @returns {Object} The complete game state object
   *
   * @example
   * const state = engine.getState()
   * console.log(state.phase) // 'betting'
   * console.log(state.balance) // 1000
   */
  getState() {
    return {
      phase: this._stateMachine.getPhase(),
      playerHands: this._getPlayerHandStates(),
      dealerHand: this._getDealerHandState(),
      balance: this._bettingSystem.getBalance(),
      bets: [...this._bets],
      currentHandIndex: this._currentHandIndex,
      handCount: this._handCount,
      insuranceOffered: this._insuranceOffered,
      insuranceTaken: this._insuranceTaken,
      insuranceBet: this._insuranceBet,
      minBet: this._minBet,
      maxBet: this._maxBet
    }
  }

  /**
   * Subscribes to state changes.
   *
   * @param {Function} callback - Function called with new state on changes
   * @returns {Function} Unsubscribe function
   *
   * @example
   * const unsubscribe = engine.subscribe((state) => {
   *   console.log('New state:', state)
   * })
   * // Later: unsubscribe()
   */
  subscribe(callback) {
    this._subscribers.push(callback)

    return () => {
      const index = this._subscribers.indexOf(callback)
      if (index > -1) {
        this._subscribers.splice(index, 1)
      }
    }
  }

  /**
   * Notifies all subscribers of state change.
   * @private
   */
  _notifySubscribers() {
    const state = this.getState()
    for (const callback of this._subscribers) {
      try {
        callback(state)
      } catch (error) {
        console.error('Error in state subscriber:', error)
      }
    }
  }

  /**
   * Gets player hand states for serialization.
   * @returns {import('../types/index.js').HandState[]}
   * @private
   */
  _getPlayerHandStates() {
    return this._playerHands.map((hand, index) => ({
      cards: hand.getCards(),
      value: hand.getValue(),
      isSoft: hand.isSoft(),
      isBust: hand.isBust(),
      isBlackjack: hand.isBlackjack(),
      isStanding: this._handStanding[index] || false,
      isDoubled: this._handDoubled[index] || false,
      isSplit: this._handSplit[index] || false,
      canSplit: hand.canSplit(),
      bet: this._bets[index] || 0
    }))
  }

  /**
   * Gets dealer hand state for serialization.
   * @returns {import('../types/index.js').HandState}
   * @private
   */
  _getDealerHandState() {
    return {
      cards: this._dealerHand.getCards(),
      value: this._dealerHand.getValue(),
      isSoft: this._dealerHand.isSoft(),
      isBust: this._dealerHand.isBust(),
      isBlackjack: this._dealerHand.isBlackjack(),
      isStanding: false,
      isDoubled: false,
      isSplit: false,
      canSplit: false,
      bet: 0
    }
  }

  // ===========================================================================
  // ROUND MANAGEMENT
  // ===========================================================================

  /**
   * Starts a new round, resetting game state for fresh betting.
   *
   * @returns {void}
   *
   * @example
   * engine.startNewRound()
   * // Now in betting phase, ready for bets
   */
  startNewRound() {
    // Reset hands
    this._playerHands = []
    this._dealerHand = new Hand()

    // Reset bets
    this._bets = []
    this._bettingSystem.clearBets()

    // Reset hand status
    this._handStanding = []
    this._handDoubled = []
    this._handSplit = []

    // Reset current hand index
    this._currentHandIndex = 0

    // Reset hand count to 1
    this._handCount = 1

    // Reset insurance
    this._insuranceOffered = false
    this._insuranceTaken = false
    this._insuranceBet = 0

    // Reset state machine
    this._stateMachine.reset()

    // Check if deck needs reshuffle (less than 15 cards)
    if (this._deck.getCount() < 15) {
      this._deck.reset().shuffle()
    }

    this._notifySubscribers()
  }

  /**
   * Sets the number of hands to play (1-3).
   *
   * Must be called during betting phase before placing bets.
   *
   * @param {number} count - Number of hands (1, 2, or 3)
   * @returns {boolean} True if hand count was set successfully
   *
   * @example
   * engine.startNewRound()
   * engine.setHandCount(2) // Play 2 hands
   */
  setHandCount(count) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.BETTING) {
      return false
    }

    // Validate count
    if (count < 1 || count > MAX_HANDS) {
      return false
    }

    this._handCount = count
    this._notifySubscribers()
    return true
  }

  /**
   * Gets the current hand count setting.
   *
   * @returns {number} The number of hands to play (1-3)
   *
   * @example
   * const count = engine.getHandCount()
   * console.log(count) // 2
   */
  getHandCount() {
    return this._handCount
  }

  // ===========================================================================
  // BETTING
  // ===========================================================================

  /**
   * Places a bet on a specific hand.
   *
   * @param {number} handIndex - Index of the hand (0-2)
   * @param {number} amount - Bet amount
   * @returns {boolean} True if bet was placed successfully
   *
   * @example
   * engine.startNewRound()
   * engine.placeBet(0, 100) // Returns true, balance now 900
   */
  placeBet(handIndex, amount) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.BETTING) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= MAX_HANDS) {
      return false
    }

    // Validate bet amount
    if (!this._bettingSystem.canBet(amount)) {
      return false
    }

    // Place bet
    this._bettingSystem.placeBet(amount)

    // Ensure arrays are large enough
    while (this._playerHands.length <= handIndex) {
      this._playerHands.push(new Hand())
      this._bets.push(0)
      this._handStanding.push(false)
      this._handDoubled.push(false)
      this._handSplit.push(false)
    }

    this._bets[handIndex] = amount

    this._notifySubscribers()
    return true
  }

  // ===========================================================================
  // DEALING
  // ===========================================================================

  /**
   * Deals initial cards to all hands.
   *
   * Deals 2 cards to each player hand and 2 cards to the dealer.
   * Checks for insurance opportunity (dealer shows Ace).
   *
   * @returns {boolean} True if deal was successful
   *
   * @example
   * engine.startNewRound()
   * engine.placeBet(0, 100)
   * engine.deal() // Deals cards, transitions to playerTurn
   */
  deal() {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.BETTING) {
      return false
    }

    // Validate at least one bet placed
    if (this._bets.every((bet) => bet === 0)) {
      return false
    }

    // Filter to only hands with bets
    const activeHands = []
    const activeBets = []
    const activeStanding = []
    const activeDoubled = []
    const activeSplit = []

    for (let i = 0; i < this._playerHands.length; i++) {
      if (this._bets[i] > 0) {
        activeHands.push(this._playerHands[i])
        activeBets.push(this._bets[i])
        activeStanding.push(false)
        activeDoubled.push(false)
        activeSplit.push(false)
      }
    }

    this._playerHands = activeHands
    this._bets = activeBets
    this._handStanding = activeStanding
    this._handDoubled = activeDoubled
    this._handSplit = activeSplit

    // Deal cards: 2 rounds
    for (let round = 0; round < 2; round++) {
      // Deal to each player hand
      for (let i = 0; i < this._playerHands.length; i++) {
        const hand = this._playerHands[i]
        // For testing: force pair on first hand
        if (this._testForcePair && i === 0 && this._testPairRank) {
          const forcedCard = this._findCardByRankInDeck(this._testPairRank)
          if (forcedCard) {
            hand.addCard(forcedCard)
          } else {
            this._dealCardToHand(hand)
          }
        } else {
          this._dealCardToHand(hand)
        }
      }

      // Deal to dealer
      if (round === 1 && this._testDealerShowsAce) {
        // For testing: force Ace as face-up card (cards[1]) for insurance testing
        this._dealerHand.addCard(this._findAceInDeck() || this._deck.deal())
      } else {
        this._dealCardToHand(this._dealerHand)
      }
    }

    // Check for insurance opportunity (dealer's face-up card is Ace)
    // dealerCards[0] is hole card (face down), dealerCards[1] is face-up card
    const dealerCards = this._dealerHand.getCards()
    if (dealerCards.length > 1 && dealerCards[1].rank === 'A') {
      this._insuranceOffered = true
    }

    // Transition to dealing then player turn
    this._stateMachine.transition(GAME_PHASES.DEALING)

    // Mark blackjack hands as standing (they can't take any action)
    for (let i = 0; i < this._playerHands.length; i++) {
      if (this._playerHands[i].isBlackjack()) {
        this._handStanding[i] = true
      }
    }

    // Check for blackjacks and handle insurance
    if (this._insuranceOffered) {
      this._stateMachine.transition(GAME_PHASES.INSURANCE_CHECK)
    } else {
      this._stateMachine.transition(GAME_PHASES.PLAYER_TURN)
      // Check if all hands are complete (e.g., all have blackjack)
      this._checkAllHandsCompleteAfterDeal()
    }

    this._notifySubscribers()
    return true
  }

  /**
   * Checks if all hands are complete after initial deal.
   * Unlike _checkAllHandsComplete(), this finds the first active hand from index 0.
   * @private
   */
  _checkAllHandsCompleteAfterDeal() {
    const allComplete = this._handStanding.every((standing) => standing)

    if (allComplete) {
      this._stateMachine.transition(GAME_PHASES.DEALER_TURN)
    } else {
      // Find first active hand starting from 0
      for (let i = 0; i < this._handStanding.length; i++) {
        if (!this._handStanding[i]) {
          this._currentHandIndex = i
          return
        }
      }
    }
  }

  /**
   * Deals a card from the deck to a hand.
   * @param {Hand} hand - The hand to deal to
   * @private
   */
  _dealCardToHand(hand) {
    if (this._deck.isEmpty()) {
      this._deck.reset().shuffle()
    }
    hand.addCard(this._deck.deal())
  }

  /**
   * Finds an Ace in the deck (for testing purposes).
   * @returns {import('../types/index.js').Card | null}
   * @private
   */
  _findAceInDeck() {
    const cards = this._deck.cards
    for (let i = cards.length - 1; i >= 0; i--) {
      if (cards[i].rank === 'A') {
        return cards.splice(i, 1)[0]
      }
    }
    return null
  }

  /**
   * Sets the test flag for dealer showing Ace (testing only).
   * @param {boolean} value - Whether to force dealer Ace
   */
  _testSetDealerShowsAce(value) {
    this._testDealerShowsAce = value
  }

  /**
   * Sets up a forced pair for player (testing only).
   * @param {string|null} rank - The rank for the pair (e.g., '8'), or null to disable
   */
  _testSetForcePair(rank) {
    this._testForcePair = rank !== null
    this._testPairRank = rank
  }

  /**
   * Finds and removes a card with the specified rank from the deck (testing only).
   * @param {string} rank - The rank to find
   * @returns {import('../types/index.js').Card | null}
   * @private
   */
  _findCardByRankInDeck(rank) {
    const cards = this._deck.cards
    for (let i = cards.length - 1; i >= 0; i--) {
      if (cards[i].rank === rank) {
        return cards.splice(i, 1)[0]
      }
    }
    return null
  }

  // ===========================================================================
  // PLAYER ACTIONS
  // ===========================================================================

  /**
   * Adds a card to the specified player hand (hit).
   *
   * @param {number} handIndex - Index of the hand to hit
   * @returns {boolean} True if hit was successful
   *
   * @example
   * engine.hit(0) // Adds card to first hand
   */
  hit(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if hand is already standing
    if (this._handStanding[handIndex]) {
      return false
    }

    // Deal card
    this._dealCardToHand(this._playerHands[handIndex])

    // Check for bust - auto stand if bust
    if (this._playerHands[handIndex].isBust()) {
      this._handStanding[handIndex] = true
      this._checkAllHandsComplete()
    }

    this._notifySubscribers()
    return true
  }

  /**
   * Stands on the specified player hand.
   *
   * @param {number} handIndex - Index of the hand to stand
   * @returns {boolean} True if stand was successful
   *
   * @example
   * engine.stand(0) // Stands on first hand
   */
  stand(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if hand is already standing
    if (this._handStanding[handIndex]) {
      return false
    }

    // Mark as standing
    this._handStanding[handIndex] = true

    // Move to next hand or dealer turn
    this._checkAllHandsComplete()

    this._notifySubscribers()
    return true
  }

  /**
   * Checks if double down is valid for the specified hand.
   *
   * @param {number} handIndex - Index of the hand to check
   * @returns {boolean} True if double down is allowed
   *
   * @example
   * if (engine.canDoubleDown(0)) {
   *   engine.doubleDown(0)
   * }
   */
  canDoubleDown(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if hand has exactly 2 cards
    if (this._playerHands[handIndex].getCardCount() !== 2) {
      return false
    }

    // Check if hand is already standing
    if (this._handStanding[handIndex]) {
      return false
    }

    // Check if balance allows doubling
    const additionalBet = this._bets[handIndex]
    if (!this._bettingSystem.canBet(additionalBet)) {
      return false
    }

    return true
  }

  /**
   * Doubles down on the specified player hand.
   *
   * Doubles the bet, deals exactly one card, and auto-stands.
   *
   * @param {number} handIndex - Index of the hand to double
   * @returns {boolean} True if double down was successful
   *
   * @example
   * engine.doubleDown(0) // Doubles bet, gets one card, stands
   */
  doubleDown(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if hand has exactly 2 cards
    if (this._playerHands[handIndex].getCardCount() !== 2) {
      return false
    }

    // Check if hand is already standing
    if (this._handStanding[handIndex]) {
      return false
    }

    // Check if balance allows doubling
    const additionalBet = this._bets[handIndex]
    if (!this._bettingSystem.canBet(additionalBet)) {
      return false
    }

    // Double the bet
    this._bettingSystem.placeBet(additionalBet)
    this._bets[handIndex] *= 2

    // Deal exactly one card
    this._dealCardToHand(this._playerHands[handIndex])

    // Mark as doubled and standing
    this._handDoubled[handIndex] = true
    this._handStanding[handIndex] = true

    // Check if all hands complete
    this._checkAllHandsComplete()

    this._notifySubscribers()
    return true
  }

  /**
   * Checks if a hand can be split.
   *
   * A hand can be split if:
   * - Game is in player turn phase
   * - Hand has exactly 2 cards
   * - Cards have the same rank OR both have value 10 (10/J/Q/K)
   * - Balance allows for another bet
   * - Not at max hands (3)
   *
   * @param {number} handIndex - Index of the hand to check
   * @returns {boolean} True if split is allowed
   *
   * @example
   * if (engine.canSplit(0)) {
   *   engine.split(0)
   * }
   */
  canSplit(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if max hands reached
    if (this._playerHands.length >= MAX_HANDS) {
      return false
    }

    // Check if hand has exactly 2 cards
    const hand = this._playerHands[handIndex]
    if (hand.getCardCount() !== 2) {
      return false
    }

    // Check if cards can be split (same rank OR same value for 10/J/Q/K)
    const cards = hand.getCards()
    const sameRank = cards[0].rank === cards[1].rank
    const tenValueCards = [10, 'J', 'Q', 'K']
    const bothTenValue =
      tenValueCards.includes(cards[0].rank) && tenValueCards.includes(cards[1].rank)

    if (!sameRank && !bothTenValue) {
      return false
    }

    // Check if balance allows splitting
    const additionalBet = this._bets[handIndex]
    if (!this._bettingSystem.canBet(additionalBet)) {
      return false
    }

    return true
  }

  /**
   * Splits the specified player hand into two hands.
   *
   * @param {number} handIndex - Index of the hand to split
   * @returns {boolean} True if split was successful
   *
   * @example
   * // If hand has two matching cards
   * engine.split(0) // Creates two hands from pair
   */
  split(handIndex) {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.PLAYER_TURN) {
      return false
    }

    // Validate hand index
    if (handIndex < 0 || handIndex >= this._playerHands.length) {
      return false
    }

    // Check if hand can be split
    if (!this._playerHands[handIndex].canSplit()) {
      return false
    }

    // Check if max hands reached
    if (this._playerHands.length >= MAX_HANDS) {
      return false
    }

    // Check if balance allows splitting
    const additionalBet = this._bets[handIndex]
    if (!this._bettingSystem.canBet(additionalBet)) {
      return false
    }

    // Get the original hand's cards
    const originalHand = this._playerHands[handIndex]
    const card1 = originalHand.getCards()[0]
    const card2 = originalHand.getCards()[1]

    // Clear original hand and create two new hands
    originalHand.clear()
    originalHand.addCard(card1)
    this._dealCardToHand(originalHand) // Deal second card

    // Create new hand with second card
    const newHand = new Hand()
    newHand.addCard(card2)
    this._dealCardToHand(newHand) // Deal second card

    // Place bet for new hand
    this._bettingSystem.placeBet(additionalBet)

    // Insert new hand after current hand
    const insertIndex = handIndex + 1
    this._playerHands.splice(insertIndex, 0, newHand)
    this._bets.splice(insertIndex, 0, additionalBet)
    this._handStanding.splice(insertIndex, 0, false)
    this._handDoubled.splice(insertIndex, 0, false)
    this._handSplit.splice(insertIndex, 0, true)

    // Mark original hand as split
    this._handSplit[handIndex] = true

    // Check for split Aces (special rule: only one card each)
    if (card1.rank === 'A') {
      this._handStanding[handIndex] = true
      this._handStanding[insertIndex] = true
      // Check if all hands complete (split Aces auto-stand)
      this._checkAllHandsComplete()
    }

    this._notifySubscribers()
    return true
  }

  /**
   * Checks if all player hands are complete and transitions if so.
   * @private
   */
  _checkAllHandsComplete() {
    const allComplete = this._handStanding.every((standing) => standing)

    if (allComplete) {
      this._stateMachine.transition(GAME_PHASES.DEALER_TURN)
    } else {
      // Find next active hand starting from current + 1
      for (let i = this._currentHandIndex + 1; i < this._handStanding.length; i++) {
        if (!this._handStanding[i]) {
          this._currentHandIndex = i
          return
        }
      }
      // If no hand found after current, wrap around from start
      for (let i = 0; i <= this._currentHandIndex; i++) {
        if (!this._handStanding[i]) {
          this._currentHandIndex = i
          return
        }
      }
    }
  }

  // ===========================================================================
  // INSURANCE
  // ===========================================================================

  /**
   * Takes insurance bet.
   *
   * @returns {boolean} True if insurance was taken successfully
   *
   * @example
   * if (state.insuranceOffered) {
   *   engine.takeInsurance()
   * }
   */
  takeInsurance() {
    // Validate insurance is offered
    if (!this._insuranceOffered) {
      return false
    }

    // Validate phase
    const phase = this._stateMachine.getPhase()
    if (phase !== GAME_PHASES.INSURANCE_CHECK) {
      return false
    }

    // Calculate insurance bet (half of main bet)
    const mainBet = this._bets[0] || 0
    const insuranceAmount = Math.floor(mainBet / 2)

    // Check if balance allows
    if (!this._bettingSystem.canBet(insuranceAmount)) {
      return false
    }

    // Place insurance bet
    this._bettingSystem.placeBet(insuranceAmount)
    this._insuranceBet = insuranceAmount
    this._insuranceTaken = true

    // Transition to player turn
    this._stateMachine.transition(GAME_PHASES.PLAYER_TURN)

    // Check if all hands are complete (e.g., all have blackjack)
    this._checkAllHandsCompleteAfterDeal()

    this._notifySubscribers()
    return true
  }

  /**
   * Declines insurance.
   *
   * @returns {boolean} True if insurance was declined successfully
   *
   * @example
   * if (state.insuranceOffered) {
   *   engine.declineInsurance()
   * }
   */
  declineInsurance() {
    // Validate insurance is offered
    if (!this._insuranceOffered) {
      return false
    }

    // Validate phase
    const phase = this._stateMachine.getPhase()
    if (phase !== GAME_PHASES.INSURANCE_CHECK) {
      return false
    }

    // Transition to player turn
    this._stateMachine.transition(GAME_PHASES.PLAYER_TURN)

    // Check if all hands are complete (e.g., all have blackjack)
    this._checkAllHandsCompleteAfterDeal()

    this._notifySubscribers()
    return true
  }

  // ===========================================================================
  // DEALER TURN
  // ===========================================================================

  /**
   * Executes the dealer's turn.
   *
   * The dealer plays according to standard rules (hit on 16 or less,
   * stand on 17 or more).
   *
   * @returns {boolean} True if dealer turn was executed successfully
   *
   * @example
   * engine.stand(0)
   * engine.playDealerTurn() // Dealer plays, transitions to resolution
   */
  playDealerTurn() {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.DEALER_TURN) {
      return false
    }

    // Check if all player hands are bust
    const allBust = this._playerHands.every((hand) => hand.isBust())

    if (!allBust) {
      // Dealer plays
      this._dealerAI.playTurn(this._dealerHand, this._deck)
    }

    // Transition to resolution
    this._stateMachine.transition(GAME_PHASES.RESOLUTION)

    this._notifySubscribers()
    return true
  }

  // ===========================================================================
  // ROUND RESOLUTION
  // ===========================================================================

  /**
   * Resolves the round, determining outcomes and payouts.
   *
   * @returns {import('../types/index.js').RoundResult[] | false} Array of results or false if invalid phase
   *
   * @example
   * const results = engine.resolveRound()
   * for (const result of results) {
   *   console.log(result.outcome, result.winnings)
   * }
   */
  resolveRound() {
    // Validate phase
    if (this._stateMachine.getPhase() !== GAME_PHASES.RESOLUTION) {
      return false
    }

    const results = []
    const dealerValue = this._dealerHand.getValue()
    const dealerBlackjack = this._dealerHand.isBlackjack()
    const dealerBust = this._dealerHand.isBust()

    // Handle insurance payout first
    if (this._insuranceTaken && dealerBlackjack) {
      // Insurance pays 2:1
      const insuranceWinnings = this._insuranceBet * 2
      this._bettingSystem.payout(this._insuranceBet, 2)
    }

    // Resolve each player hand
    for (let i = 0; i < this._playerHands.length; i++) {
      const hand = this._playerHands[i]
      const bet = this._bets[i]
      const playerValue = hand.getValue()
      const playerBlackjack = hand.isBlackjack()
      const playerBust = hand.isBust()

      let outcome
      let winnings
      let message

      if (playerBust) {
        // Player bust - loses
        outcome = 'lose'
        winnings = -bet
        message = 'Bust! You lose.'
      } else if (dealerBlackjack && playerBlackjack) {
        // Both blackjack - push
        outcome = 'push'
        winnings = 0
        this._bettingSystem.payout(bet, PAYOUT_MULTIPLIERS.PUSH)
        message = 'Push - both have blackjack.'
      } else if (dealerBlackjack) {
        // Dealer blackjack - player loses
        outcome = 'lose'
        winnings = -bet
        message = 'Dealer has blackjack!'
      } else if (playerBlackjack) {
        // Player blackjack - pays 3:2
        outcome = 'blackjack'
        winnings = bet * 1.5
        this._bettingSystem.payout(bet, PAYOUT_MULTIPLIERS.BLACKJACK)
        message = 'Blackjack! You win 3:2!'
      } else if (dealerBust) {
        // Dealer bust - player wins
        outcome = 'win'
        winnings = bet
        this._bettingSystem.payout(bet, PAYOUT_MULTIPLIERS.WIN)
        message = 'Dealer busts! You win!'
      } else if (playerValue > dealerValue) {
        // Player higher - wins
        outcome = 'win'
        winnings = bet
        this._bettingSystem.payout(bet, PAYOUT_MULTIPLIERS.WIN)
        message = 'You win!'
      } else if (playerValue < dealerValue) {
        // Dealer higher - player loses
        outcome = 'lose'
        winnings = -bet
        message = 'Dealer wins.'
      } else {
        // Same value - push
        outcome = 'push'
        winnings = 0
        this._bettingSystem.payout(bet, PAYOUT_MULTIPLIERS.PUSH)
        message = 'Push - bet returned.'
      }

      results.push(createRoundResult(i, outcome, winnings, message))
    }

    // Transition to game over
    this._stateMachine.transition(GAME_PHASES.GAME_OVER)

    this._notifySubscribers()
    return results
  }
}
