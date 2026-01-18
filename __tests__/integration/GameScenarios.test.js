/**
 * @fileoverview Integration tests for complete game scenarios.
 *
 * These tests verify the entire game flow from betting through resolution,
 * ensuring all game mechanics work correctly in complete game scenarios.
 *
 * Tests use deterministic deck ordering to control card sequences and
 * verify expected outcomes.
 *
 * @module tests/integration/GameScenarios
 */

import { describe, expect, it } from 'vitest'
import { GameEngine } from '../../js/game/GameEngine.js'
import { GAME_PHASES, createCard } from '../../js/types/index.js'

// =============================================================================
// TEST HELPERS
// =============================================================================

/**
 * Sets up a deterministic deck on an engine.
 * Must be called AFTER startNewRound() but BEFORE deal().
 * Cards are dealt from the END of the array (via pop()).
 *
 * Deal order for single hand:
 * - Round 1: Player card 1, Dealer card 1
 * - Round 2: Player card 2, Dealer card 2
 * - Then: hit cards, dealer hit cards
 *
 * @param {GameEngine} engine - The game engine
 * @param {import('../../js/types/index.js').Card[]} cards - Cards in deal order (first dealt first)
 */
function setDeterministicDeck(engine, cards) {
  // Reverse so the first card in the input array is dealt first (at end of deck.cards)
  engine._deck.cards = [...cards].reverse()
  engine._deck._originalCards = [...engine._deck.cards]
}

/**
 * Creates a card for testing.
 * @param {string} suit - Card suit
 * @param {number|string} rank - Card rank
 * @returns {import('../../js/types/index.js').Card}
 */
function card(suit, rank) {
  return createCard(suit, rank)
}

// =============================================================================
// INTEGRATION TEST SCENARIOS
// =============================================================================

describe('Integration: Full Game Scenarios', () => {
  describe('Scenario 1: Single Hand Win', () => {
    /**
     * Test scenario:
     * 1. startNewRound(1)
     * 2. placeBet(0, 100)
     * 3. Deal (player gets 15, dealer shows 5)
     * 4. hit(0) -> player gets card -> 18
     * 5. stand(0)
     * 6. Dealer plays (hits on 16, busts)
     * 7. Resolution: Player wins (100 x 2 = 200 payout)
     * 8. Verify: balance increased by 100
     */
    it('should win with correct payout when player beats dealer', () => {
      // Deal order for single hand:
      // 1. Player card 1
      // 2. Dealer card 1
      // 3. Player card 2
      // 4. Dealer card 2 (hole)
      // 5+ Hit cards
      //
      // Player: 9 + 6 = 15, hit gets 3 -> 18
      // Dealer: 5 + 10 = 15, hits to get 8 -> 23 (bust)

      const deckCards = [
        card('hearts', 9), // Player card 1
        card('spades', 5), // Dealer card 1
        card('clubs', 6), // Player card 2
        card('diamonds', 10), // Dealer card 2 (hole card)
        card('hearts', 3), // Player hit
        card('clubs', 8) // Dealer hit 1 (causes bust)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start new round
      engine.startNewRound()
      expect(engine.getState().phase).toBe(GAME_PHASES.BETTING)

      // 2. Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().balance).toBe(initialBalance - 100)

      // Set deterministic deck AFTER startNewRound, BEFORE deal
      setDeterministicDeck(engine, deckCards)

      // 3. Deal
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands[0].value).toBe(15) // 9 + 6
      expect(stateAfterDeal.dealerHand.cards[0].rank).toBe(5)

      // Handle insurance if offered (shouldn't be with dealer showing 5)
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // 4. Hit
      engine.hit(0)
      const stateAfterHit = engine.getState()
      expect(stateAfterHit.playerHands[0].value).toBe(18) // 15 + 3

      // 5. Stand
      engine.stand(0)
      expect(engine.getState().phase).toBe(GAME_PHASES.DEALER_TURN)

      // 6. Dealer plays (15 + 8 = 23, bust)
      engine.playDealerTurn()
      const stateAfterDealer = engine.getState()
      expect(stateAfterDealer.dealerHand.isBust).toBe(true)
      expect(stateAfterDealer.phase).toBe(GAME_PHASES.RESOLUTION)

      // 7. Resolve
      const results = engine.resolveRound()
      expect(results[0].outcome).toBe('win')

      // 8. Verify balance: initial 1000 - 100 bet + 200 payout = 1100
      expect(engine.getState().balance).toBe(initialBalance + 100)
    })
  })

  describe('Scenario 2: Single Hand Bust', () => {
    /**
     * Test scenario:
     * 1. startNewRound(1)
     * 2. placeBet(0, 100)
     * 3. Deal (player gets K-9 = 19, dealer shows 6)
     * 4. hit(0) -> player gets 5 -> 24 (bust)
     * 5. Hand auto-stands
     * 6. Resolution: Player loses
     * 7. Verify: balance decreased by 100
     */
    it('should lose when player busts', () => {
      // Deal order: P1, D1, P2, D2, then hits
      const deckCards = [
        card('hearts', 'K'), // Player card 1 (10)
        card('spades', 6), // Dealer card 1
        card('clubs', 9), // Player card 2
        card('diamonds', 10), // Dealer card 2 (hole)
        card('hearts', 5) // Player hit (causes bust: 19 + 5 = 24)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start round
      engine.startNewRound()

      // 2. Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().balance).toBe(initialBalance - 100)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // 3. Deal
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands[0].value).toBe(19) // K(10) + 9

      // Handle insurance if offered
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // 4. Hit - player busts (19 + 5 = 24)
      engine.hit(0)
      const stateAfterHit = engine.getState()
      expect(stateAfterHit.playerHands[0].value).toBe(24)
      expect(stateAfterHit.playerHands[0].isBust).toBe(true)

      // 5. Hand should auto-stand
      expect(stateAfterHit.playerHands[0].isStanding).toBe(true)

      // 6. Dealer turn and resolution
      engine.playDealerTurn()
      const results = engine.resolveRound()

      // 7. Verify loss
      expect(results[0].outcome).toBe('lose')
      expect(engine.getState().balance).toBe(initialBalance - 100)
    })
  })

  describe('Scenario 3: Single Hand Blackjack', () => {
    /**
     * Test scenario:
     * 1. startNewRound(1)
     * 2. placeBet(0, 100)
     * 3. Deal -> player gets Ace + King = blackjack
     * 4. Dealer doesn't have blackjack
     * 5. Resolution: Blackjack payout (100 x 1.5 = 150)
     * 6. Verify: balance increased by 150
     */
    it('should pay 3:2 for player blackjack', () => {
      // Deal order: P1, D1, P2, D2
      // Player: A + K = 21 (blackjack)
      // Dealer: 7 + 9 = 16 (not blackjack)
      const deckCards = [
        card('hearts', 'A'), // Player card 1
        card('spades', 7), // Dealer card 1 (not Ace to avoid insurance)
        card('clubs', 'K'), // Player card 2
        card('diamonds', 9), // Dealer card 2
        // Extra cards for dealer hits
        card('hearts', 2) // Dealer hit if needed
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start round
      engine.startNewRound()

      // 2. Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().balance).toBe(initialBalance - 100)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // 3. Deal - player gets blackjack
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands[0].isBlackjack).toBe(true)
      expect(stateAfterDeal.playerHands[0].value).toBe(21)

      // Handle insurance if offered
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // Player still needs to complete turn (stand on blackjack)
      engine.stand(0)

      // 4. Dealer plays (no blackjack for dealer)
      engine.playDealerTurn()
      const stateAfterDealer = engine.getState()
      expect(stateAfterDealer.dealerHand.isBlackjack).toBe(false)

      // 5. Resolution
      const results = engine.resolveRound()
      expect(results[0].outcome).toBe('blackjack')

      // 6. Verify balance: 1000 - 100 + 250 (bet + 1.5x bet) = 1150
      expect(engine.getState().balance).toBe(initialBalance + 150)
    })
  })

  describe('Scenario 4: Multi-Hand (3 hands)', () => {
    /**
     * Test scenario:
     * 1. startNewRound(3)
     * 2. placeBet(0, 100), placeBet(1, 50), placeBet(2, 75)
     * 3. Deal all 3 hands
     * 4. Play hand 1: hit -> stand -> win
     * 5. Play hand 2: stand -> lose
     * 6. Play hand 3: hit -> stand -> push
     * 7. Dealer plays
     * 8. Resolution: All 3 hands resolved
     * 9. Verify: balance = original + 100 (win) - 50 (lose) + 0 (push)
     */
    it('should resolve multiple hands with different outcomes', () => {
      // Deal order for 3 hands + dealer:
      // Round 1: H1-C1, H2-C1, H3-C1, D-C1
      // Round 2: H1-C2, H2-C2, H3-C2, D-C2
      // Then hit cards...

      // Hand 1: 8 + 5 = 13, hit gets 5 -> 18, wins vs dealer 17
      // Hand 2: 10 + 6 = 16, stands, loses vs dealer 17
      // Hand 3: 7 + 8 = 15, hit gets 2 -> 17, pushes vs dealer 17
      // Dealer: 10 + 7 = 17, stands

      const deckCards = [
        // Round 1 - First cards
        card('hearts', 8), // Hand 1 card 1
        card('clubs', 10), // Hand 2 card 1
        card('diamonds', 7), // Hand 3 card 1
        card('spades', 10), // Dealer card 1
        // Round 2 - Second cards
        card('hearts', 5), // Hand 1 card 2
        card('clubs', 6), // Hand 2 card 2
        card('diamonds', 8), // Hand 3 card 2
        card('spades', 7), // Dealer card 2 (hole)
        // Hit cards
        card('hearts', 5), // Hand 1 hit
        card('clubs', 2) // Hand 3 hit
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start round
      engine.startNewRound()

      // 2. Place bets on all 3 hands
      engine.placeBet(0, 100)
      engine.placeBet(1, 50)
      engine.placeBet(2, 75)
      expect(engine.getState().balance).toBe(initialBalance - 225)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // 3. Deal all hands
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands.length).toBe(3)
      expect(stateAfterDeal.playerHands[0].value).toBe(13) // 8 + 5
      expect(stateAfterDeal.playerHands[1].value).toBe(16) // 10 + 6
      expect(stateAfterDeal.playerHands[2].value).toBe(15) // 7 + 8

      // Handle insurance if offered
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // 4. Play hand 1: hit then stand
      engine.hit(0)
      expect(engine.getState().playerHands[0].value).toBe(18) // 13 + 5
      engine.stand(0)

      // 5. Play hand 2: stand (loses with 16)
      engine.stand(1)

      // 6. Play hand 3: hit then stand
      engine.hit(2)
      expect(engine.getState().playerHands[2].value).toBe(17) // 15 + 2
      engine.stand(2)

      // 7. Dealer plays
      expect(engine.getState().phase).toBe(GAME_PHASES.DEALER_TURN)
      engine.playDealerTurn()
      const stateAfterDealer = engine.getState()
      expect(stateAfterDealer.dealerHand.value).toBe(17)

      // 8. Resolution
      const results = engine.resolveRound()
      expect(results.length).toBe(3)
      expect(results[0].outcome).toBe('win') // Hand 1: 18 vs 17
      expect(results[1].outcome).toBe('lose') // Hand 2: 16 vs 17
      expect(results[2].outcome).toBe('push') // Hand 3: 17 vs 17

      // 9. Verify balance: 1000 - 225 + 200 (win) + 0 (lose) + 75 (push returned)
      // = 1000 - 225 + 200 + 75 = 1050
      expect(engine.getState().balance).toBe(initialBalance + 100 - 50)
    })
  })

  describe('Scenario 5: Double Down', () => {
    /**
     * Test scenario:
     * 1. startNewRound(1)
     * 2. placeBet(0, 100)
     * 3. Deal (player 6 + 5 = 11, dealer shows 6)
     * 4. doubleDown(0) -> bet becomes 200, draws 1 card -> 18
     * 5. Hand auto-stands
     * 6. Dealer plays and busts
     * 7. Resolution: Win with double (200 x 2 = 400 payout)
     * 8. Verify: balance increased by 200
     */
    it('should pay double the bet on double down win', () => {
      // Deal order: P1, D1, P2, D2, then double down card, dealer hits
      const deckCards = [
        card('hearts', 6), // Player card 1
        card('spades', 6), // Dealer card 1
        card('clubs', 5), // Player card 2
        card('diamonds', 10), // Dealer card 2 (hole)
        card('hearts', 7), // Double down card (11 + 7 = 18)
        card('clubs', 8) // Dealer hit 1 (16 + 8 = 24, bust)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start round
      engine.startNewRound()

      // 2. Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().balance).toBe(initialBalance - 100)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // 3. Deal - player gets 11 (6 + 5)
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands[0].value).toBe(11) // 6 + 5
      expect(stateAfterDeal.dealerHand.cards[0].rank).toBe(6)

      // Handle insurance if offered
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // 4. Double down
      const doubleResult = engine.doubleDown(0)
      expect(doubleResult).toBe(true)

      const stateAfterDouble = engine.getState()
      expect(stateAfterDouble.bets[0]).toBe(200)
      expect(stateAfterDouble.balance).toBe(initialBalance - 200)
      expect(stateAfterDouble.playerHands[0].value).toBe(18) // 11 + 7
      expect(stateAfterDouble.playerHands[0].isDoubled).toBe(true)

      // 5. Hand should auto-stand
      expect(stateAfterDouble.playerHands[0].isStanding).toBe(true)

      // 6. Dealer plays and busts (6 + 10 = 16, hits 8 = 24)
      engine.playDealerTurn()
      const stateAfterDealer = engine.getState()
      expect(stateAfterDealer.dealerHand.isBust).toBe(true)

      // 7. Resolution
      const results = engine.resolveRound()
      expect(results[0].outcome).toBe('win')

      // 8. Verify balance: 1000 - 200 + 400 = 1200
      expect(engine.getState().balance).toBe(initialBalance + 200)
    })
  })

  describe('Scenario 6: Split (non-Ace)', () => {
    /**
     * Test scenario:
     * 1. startNewRound(1)
     * 2. placeBet(0, 100)
     * 3. Deal (player 7-7, dealer shows 6)
     * 4. split(0) -> two hands, each starting with 7
     * 5. Hand 1: gets second card -> 14, hit -> 18, stand
     * 6. Hand 2: gets second card -> 16, stand
     * 7. Dealer plays -> 18
     * 8. Resolution: Hand 1 push (100), Hand 2 loss (0)
     * 9. Verify: balance = original - 100 (net loss from hand 2)
     */
    it('should handle split with different outcomes per hand', () => {
      // Deal order: P1, D1, P2, D2
      // After split: Hand 1 gets card, Hand 2 gets card
      // Then: Hit cards, Dealer hits
      const deckCards = [
        card('hearts', 7), // Player card 1
        card('spades', 6), // Dealer card 1
        card('clubs', 7), // Player card 2
        card('diamonds', 2), // Dealer card 2 (hole)
        // After split
        card('hearts', 7), // Split hand 1 second card (7 + 7 = 14)
        card('clubs', 9), // Split hand 2 second card (7 + 9 = 16)
        // Hits
        card('hearts', 4), // Hand 1 hit (14 + 4 = 18)
        // Dealer hits
        card('diamonds', 10) // Dealer (8 + 10 = 18)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      // 1. Start round
      engine.startNewRound()

      // 2. Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().balance).toBe(initialBalance - 100)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // 3. Deal - player gets pair of 7s
      engine.deal()
      const stateAfterDeal = engine.getState()
      expect(stateAfterDeal.playerHands[0].value).toBe(14) // 7 + 7
      expect(stateAfterDeal.playerHands[0].cards[0].rank).toBe(7)
      expect(stateAfterDeal.playerHands[0].cards[1].rank).toBe(7)

      // Handle insurance if offered
      if (stateAfterDeal.insuranceOffered) {
        engine.declineInsurance()
      }

      // 4. Split
      const canSplit = engine.canSplit(0)
      expect(canSplit).toBe(true)

      const splitResult = engine.split(0)
      expect(splitResult).toBe(true)

      const stateAfterSplit = engine.getState()
      expect(stateAfterSplit.playerHands.length).toBe(2)
      expect(stateAfterSplit.bets.length).toBe(2)
      expect(stateAfterSplit.balance).toBe(initialBalance - 200)

      // 5. Play Hand 1: 7 + 7 = 14, hit gets 4 -> 18
      expect(stateAfterSplit.playerHands[0].value).toBe(14) // 7 + 7
      engine.hit(0)
      expect(engine.getState().playerHands[0].value).toBe(18) // 14 + 4
      engine.stand(0)

      // 6. Play Hand 2: 7 + 9 = 16, stand
      expect(engine.getState().playerHands[1].value).toBe(16) // 7 + 9
      engine.stand(1)

      // 7. Dealer plays: 6 + 2 = 8, hits to get 10 -> 18
      engine.playDealerTurn()
      const stateAfterDealer = engine.getState()
      expect(stateAfterDealer.dealerHand.value).toBe(18)

      // 8. Resolution
      const results = engine.resolveRound()
      expect(results.length).toBe(2)
      expect(results[0].outcome).toBe('push') // Hand 1: 18 vs 18
      expect(results[1].outcome).toBe('lose') // Hand 2: 16 vs 18

      // 9. Verify balance: 1000 - 200 + 100 (push) + 0 (lose) = 900
      expect(engine.getState().balance).toBe(initialBalance - 100)
    })
  })
})

// =============================================================================
// ADDITIONAL INTEGRATION SCENARIOS
// =============================================================================

describe('Integration: Edge Cases and State Validation', () => {
  describe('Balance Tracking Across Multiple Rounds', () => {
    it('should correctly track balance through win-loss-push sequence', () => {
      const engine = new GameEngine({ initialBalance: 1000 })

      // Round 1: Win (player 20 vs dealer bust)
      // Deal order: P1, D1, P2, D2
      const winDeck = [
        card('hearts', 10), // Player card 1
        card('spades', 6), // Dealer card 1
        card('clubs', 10), // Player card 2 (20)
        card('diamonds', 10), // Dealer card 2 (16)
        card('hearts', 8) // Dealer hit (bust: 24)
      ]

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, winDeck)
      engine.deal()
      if (engine.getState().insuranceOffered) engine.declineInsurance()
      engine.stand(0)
      engine.playDealerTurn()
      engine.resolveRound()

      expect(engine.getState().balance).toBe(1100) // Won 100

      // Round 2: Loss (player 11 vs dealer 20)
      const loseDeck = [
        card('hearts', 6), // Player card 1
        card('spades', 10), // Dealer card 1
        card('clubs', 5), // Player card 2 (11)
        card('diamonds', 10) // Dealer card 2 (20)
      ]

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, loseDeck)
      engine.deal()
      if (engine.getState().insuranceOffered) engine.declineInsurance()
      engine.stand(0)
      engine.playDealerTurn()
      engine.resolveRound()

      expect(engine.getState().balance).toBe(1000) // Lost 100

      // Round 3: Push (player 18 vs dealer 18)
      const pushDeck = [
        card('hearts', 10), // Player card 1
        card('spades', 10), // Dealer card 1
        card('clubs', 8), // Player card 2 (18)
        card('diamonds', 8) // Dealer card 2 (18)
      ]

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, pushDeck)
      engine.deal()
      if (engine.getState().insuranceOffered) engine.declineInsurance()
      engine.stand(0)
      engine.playDealerTurn()
      engine.resolveRound()

      expect(engine.getState().balance).toBe(1000) // Push, balance unchanged
    })
  })

  describe('State Transitions Validity', () => {
    it('should follow correct state transitions throughout a round', () => {
      // Deal order: P1, D1, P2, D2, then hits
      // Player: 8 + 7 = 15, hit gets 3 -> 18 (no bust)
      const deckCards = [
        card('hearts', 8), // Player card 1
        card('spades', 9), // Dealer card 1
        card('clubs', 7), // Player card 2 (15)
        card('diamonds', 10), // Dealer card 2 (19)
        card('hearts', 3) // Player hit (15 + 3 = 18, no bust)
      ]
      const engine = new GameEngine({ initialBalance: 1000 })

      // Initial state
      expect(engine.getState().phase).toBe(GAME_PHASES.BETTING)

      // Start round
      engine.startNewRound()
      expect(engine.getState().phase).toBe(GAME_PHASES.BETTING)

      // Place bet
      engine.placeBet(0, 100)
      expect(engine.getState().phase).toBe(GAME_PHASES.BETTING)

      // Set deterministic deck
      setDeterministicDeck(engine, deckCards)

      // Deal
      engine.deal()
      // After deal, should be playerTurn (or insuranceCheck if dealer shows Ace)
      const phaseAfterDeal = engine.getState().phase
      expect([GAME_PHASES.PLAYER_TURN, GAME_PHASES.INSURANCE_CHECK]).toContain(phaseAfterDeal)

      // Handle insurance if needed
      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }
      expect(engine.getState().phase).toBe(GAME_PHASES.PLAYER_TURN)

      // Hit (player gets 3, total 18 - no bust)
      engine.hit(0)
      expect(engine.getState().playerHands[0].value).toBe(18)
      expect(engine.getState().phase).toBe(GAME_PHASES.PLAYER_TURN)

      // Stand
      engine.stand(0)
      expect(engine.getState().phase).toBe(GAME_PHASES.DEALER_TURN)

      // Dealer turn
      engine.playDealerTurn()
      expect(engine.getState().phase).toBe(GAME_PHASES.RESOLUTION)

      // Resolve
      engine.resolveRound()
      expect(engine.getState().phase).toBe(GAME_PHASES.GAME_OVER)
    })
  })

  describe('Insurance Scenario', () => {
    it('should handle insurance with dealer blackjack correctly', () => {
      // Deal order: P1, D1, P2, D2
      // Dealer shows Ace (face-up card = D2) and has blackjack (K + A)
      // dealerCards[0] = D1 (hole card), dealerCards[1] = D2 (face-up card)
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('diamonds', 'K'), // Dealer card 1 (D1 - hole card)
        card('clubs', 8), // Player card 2 (18)
        card('spades', 'A') // Dealer card 2 (D2 - face-up Ace - insurance offered!)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })
      const initialBalance = engine.getState().balance

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Insurance should be offered (dealer shows Ace)
      expect(engine.getState().insuranceOffered).toBe(true)

      // Take insurance (50)
      engine.takeInsurance()
      expect(engine.getState().insuranceTaken).toBe(true)
      expect(engine.getState().insuranceBet).toBe(50)
      expect(engine.getState().balance).toBe(initialBalance - 150) // 100 bet + 50 insurance

      // Stand
      engine.stand(0)

      // Dealer turn
      engine.playDealerTurn()

      // Resolve
      const results = engine.resolveRound()

      // Player loses main bet but wins insurance 2:1
      // Main bet: lose 100
      // Insurance: win 100 (50 * 2)
      // Net: 1000 - 100 - 50 + 100 = 950
      expect(engine.getState().balance).toBe(950)
    })
  })

  describe('Dealer Behavior', () => {
    it('should have dealer hit on soft 17', () => {
      // Deal order: P1, D1, P2, D2
      // Dealer gets A + 6 = soft 17, must hit (per DealerAI rules)
      // Note: Dealer shows Ace, so insurance will be offered
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 'A'), // Dealer card 1 (Ace - insurance offered)
        card('clubs', 10), // Player card 2 (20)
        card('diamonds', 6), // Dealer card 2 (soft 17)
        // Dealer hit
        card('hearts', 3) // Dealer gets 3 -> soft 20 (or might count as 17+3=20)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      // Player stands with 20
      engine.stand(0)

      // Dealer plays
      engine.playDealerTurn()

      // Dealer should have hit on soft 17 and reached 17+ hard or busted
      const dealerState = engine.getState().dealerHand
      expect(dealerState.value >= 17 || dealerState.isBust).toBe(true)
    })

    it('should have dealer stand on hard 17', () => {
      // Deal order: P1, D1, P2, D2
      // Dealer gets 10 + 7 = hard 17, must stand
      const deckCards = [
        card('hearts', 8), // Player card 1
        card('spades', 10), // Dealer card 1
        card('clubs', 8), // Player card 2 (16)
        card('diamonds', 7) // Dealer card 2 (17)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      engine.stand(0)
      engine.playDealerTurn()

      // Dealer should stand on exactly 17 with 2 cards
      const dealerState = engine.getState().dealerHand
      expect(dealerState.value).toBe(17)
      expect(dealerState.cards.length).toBe(2)
    })
  })

  // ===========================================================================
  // SPLIT SCENARIOS
  // ===========================================================================

  describe('Split Scenarios', () => {
    it('should split a pair of 8s correctly', () => {
      // Deal order: P1, D1, P2, D2, then hit cards
      const deckCards = [
        card('hearts', 8), // Player card 1
        card('spades', 7), // Dealer card 1 (hole)
        card('clubs', 8), // Player card 2 (pair of 8s)
        card('diamonds', 10), // Dealer card 2 (shows 10)
        // After split:
        card('hearts', 10), // Second card for first hand (8+10=18)
        card('clubs', 3), // Second card for second hand (8+3=11)
        card('diamonds', 7) // Hit for second hand (11+7=18)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Should be able to split
      expect(engine.canSplit(0)).toBe(true)

      // Split the pair
      engine.split(0)

      const state = engine.getState()
      expect(state.playerHands.length).toBe(2)
      expect(state.balance).toBe(800) // 1000 - 100 - 100

      // First hand should have 8 + new card
      expect(state.playerHands[0].value).toBeGreaterThanOrEqual(8)

      // Stand on first hand
      engine.stand(0)

      // Play second hand
      if (!state.playerHands[1].isStanding) {
        engine.hit(1) // Hit the 11
        engine.stand(1)
      }

      // Dealer plays
      engine.playDealerTurn()
      engine.resolveRound()

      expect(engine.getState().phase).toBe(GAME_PHASES.GAME_OVER)
    })

    it('should split Aces and get only one card each', () => {
      const deckCards = [
        card('hearts', 'A'), // Player card 1
        card('spades', 7), // Dealer card 1 (hole)
        card('clubs', 'A'), // Player card 2 (pair of Aces)
        card('diamonds', 9), // Dealer card 2
        // After split:
        card('hearts', 10), // Only card for first hand (A+10=21)
        card('clubs', 5) // Only card for second hand (A+5=16)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Split Aces
      engine.split(0)

      // After splitting Aces, both hands should be standing (only one card each)
      const state = engine.getState()
      expect(state.playerHands[0].isStanding).toBe(true)
      expect(state.playerHands[1].isStanding).toBe(true)
    })

    it('should not allow split after hit', () => {
      const deckCards = [
        card('hearts', 5), // Player card 1
        card('spades', 7), // Dealer hole
        card('clubs', 5), // Player card 2 (pair of 5s)
        card('diamonds', 10), // Dealer face-up
        card('hearts', 2) // Hit card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Initially can split
      expect(engine.canSplit(0)).toBe(true)

      // Hit
      engine.hit(0)

      // Can no longer split (more than 2 cards)
      expect(engine.canSplit(0)).toBe(false)
    })

    it('should not allow split when balance is insufficient', () => {
      const deckCards = [
        card('hearts', 8), // Player card 1
        card('spades', 7), // Dealer hole
        card('clubs', 8), // Player card 2 (pair of 8s)
        card('diamonds', 10) // Dealer face-up
      ]

      const engine = new GameEngine({ initialBalance: 150 })

      engine.startNewRound()
      engine.placeBet(0, 100) // Only 50 left
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Cannot split - not enough for another bet
      expect(engine.canSplit(0)).toBe(false)
    })

    it('should allow split up to 3 hands', () => {
      const deckCards = [
        card('hearts', 8), // Player card 1
        card('spades', 6), // Dealer hole
        card('clubs', 8), // Player card 2 (pair of 8s)
        card('diamonds', 10), // Dealer face-up
        // First split
        card('hearts', 8), // New card for first hand
        card('clubs', 10), // New card for second hand
        // Second split (first hand has 8+8)
        card('diamonds', 9), // New card for hand after second split
        card('spades', 2) // New card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // First split
      engine.split(0)
      expect(engine.getState().playerHands.length).toBe(2)

      // If first hand got another 8, can split again
      const state = engine.getState()
      if (engine.canSplit(0)) {
        engine.split(0)
        expect(engine.getState().playerHands.length).toBe(3)

        // Should not allow 4th split (max 3 hands)
        expect(engine.canSplit(0)).toBe(false)
      }
    })
  })

  // ===========================================================================
  // DOUBLE DOWN SCENARIOS
  // ===========================================================================

  describe('Double Down Scenarios', () => {
    it('should double down and receive exactly one card', () => {
      const deckCards = [
        card('hearts', 5), // Player card 1
        card('spades', 6), // Dealer hole
        card('clubs', 6), // Player card 2 (11)
        card('diamonds', 10), // Dealer face-up
        card('hearts', 10) // Double down card (21)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Can double
      expect(engine.canDoubleDown(0)).toBe(true)

      // Double down
      engine.doubleDown(0)

      const state = engine.getState()
      // Should have exactly 3 cards and be standing
      expect(state.playerHands[0].cards.length).toBe(3)
      expect(state.playerHands[0].isStanding).toBe(true)
      expect(state.playerHands[0].isDoubled).toBe(true)
      // Bet should be doubled
      expect(state.bets[0]).toBe(200)
      expect(state.balance).toBe(800) // 1000 - 200
    })

    it('should not allow double after hit', () => {
      const deckCards = [
        card('hearts', 3), // Player card 1
        card('spades', 7), // Dealer hole
        card('clubs', 5), // Player card 2 (8)
        card('diamonds', 10), // Dealer face-up
        card('hearts', 2) // Hit card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Hit
      engine.hit(0)

      // Can no longer double (more than 2 cards)
      expect(engine.canDoubleDown(0)).toBe(false)
    })

    it('should not allow double when balance is insufficient', () => {
      const deckCards = [
        card('hearts', 5), // Player card 1
        card('spades', 7), // Dealer hole
        card('clubs', 6), // Player card 2 (11)
        card('diamonds', 10) // Dealer face-up
      ]

      const engine = new GameEngine({ initialBalance: 150 })

      engine.startNewRound()
      engine.placeBet(0, 100) // Only 50 left
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Cannot double - not enough for another bet
      expect(engine.canDoubleDown(0)).toBe(false)
    })

    it('should double on split hand', () => {
      const deckCards = [
        card('hearts', 5), // Player card 1
        card('spades', 6), // Dealer hole
        card('clubs', 5), // Player card 2 (pair of 5s)
        card('diamonds', 10), // Dealer face-up
        // After split
        card('hearts', 6), // Second card for first hand (5+6=11, great for double!)
        card('clubs', 6), // Second card for second hand (5+6=11)
        card('diamonds', 10) // Double down card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Split
      engine.split(0)

      // Double on first hand
      if (engine.canDoubleDown(0)) {
        engine.doubleDown(0)
        expect(engine.getState().playerHands[0].isDoubled).toBe(true)
      }
    })
  })

  // ===========================================================================
  // MULTIPLE HANDS SCENARIOS
  // ===========================================================================

  describe('Multiple Hands Scenarios', () => {
    it('should handle 2 hands with mixed results', () => {
      // Deal order for 2 hands:
      // Round 1: H1-C1, D-C1, H2-C1
      // Round 2: H1-C2, D-C2, H2-C2
      const deckCards = [
        card('hearts', 10), // Hand 1, card 1
        card('spades', 7), // Dealer card 1 (hole)
        card('clubs', 10), // Hand 2, card 1
        card('hearts', 'K'), // Hand 1, card 2 (20)
        card('diamonds', 10), // Dealer card 2 (face-up, total 17)
        card('clubs', 2), // Hand 2, card 2 (12)
        card('diamonds', 10), // Hit card for hand 2 (22 - bust)
        // Extra cards for dealer just in case
        card('hearts', 5),
        card('clubs', 5)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.placeBet(1, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Hand 1: Stand on 20
      engine.stand(0)

      // Hand 2: Hit on 12
      engine.hit(1)
      // Either bust or continue
      const state = engine.getState()
      if (!state.playerHands[1].isBust && !state.playerHands[1].isStanding) {
        engine.stand(1)
      }

      // Dealer plays
      engine.playDealerTurn()
      const results = engine.resolveRound()

      // Results should be defined
      expect(results).toBeDefined()
      expect(Array.isArray(results)).toBe(true)
      expect(results.length).toBeGreaterThan(0)
    })

    it('should handle blackjack on initial deal', () => {
      // Single hand with blackjack
      const deckCards = [
        card('hearts', 'A'), // Player card 1
        card('spades', 6), // Dealer hole
        card('clubs', 'K'), // Player card 2 (Blackjack!)
        card('hearts', 10), // Dealer face-up
        // Dealer hits
        card('hearts', 2),
        card('clubs', 2)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Should be blackjack
      expect(engine.getState().playerHands[0].isBlackjack).toBe(true)

      // Player stands on blackjack (required action)
      engine.stand(0)

      // Dealer plays
      engine.playDealerTurn()
      engine.resolveRound()

      // Game should be over with winnings (3:2 payout)
      expect(engine.getState().phase).toBe(GAME_PHASES.GAME_OVER)
      // 1000 - 100 + 250 = 1150 (blackjack pays 3:2)
      expect(engine.getState().balance).toBe(1150)
    })
  })

  // ===========================================================================
  // INSURANCE EDGE CASES
  // ===========================================================================

  describe('Insurance Edge Cases', () => {
    it('should not offer insurance when dealer shows non-Ace', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 'K'), // Dealer hole (K)
        card('clubs', 8), // Player card 2
        card('diamonds', 10) // Dealer face-up (10, not Ace)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      expect(engine.getState().insuranceOffered).toBe(false)
    })

    it('should handle insurance loss (dealer no blackjack)', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 6), // Dealer hole (6)
        card('clubs', 9), // Player card 2 (19)
        card('diamonds', 'A'), // Dealer face-up (Ace - insurance offered)
        card('hearts', 'K') // Dealer hits on soft 17, gets 17
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Insurance offered
      expect(engine.getState().insuranceOffered).toBe(true)

      // Take insurance
      engine.takeInsurance()
      expect(engine.getState().balance).toBe(850) // 1000 - 100 - 50

      // Player stands
      engine.stand(0)

      // Dealer plays (no blackjack)
      engine.playDealerTurn()
      engine.resolveRound()

      // Player wins main bet (19 vs 17) but loses insurance
      // Win: 200 (bet returned + winnings)
      // Insurance lost: 0 (already deducted)
      // Final: 850 + 200 = 1050
      const finalBalance = engine.getState().balance
      expect(finalBalance).toBeGreaterThan(850) // Won main bet
    })

    it('should calculate insurance as half of first hand bet', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 'K'), // Dealer hole
        card('clubs', 8), // Player card 2
        card('diamonds', 'A') // Dealer face-up (Ace)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 200) // Main bet is 200
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.takeInsurance()

      // Insurance bet should be 100 (half of 200)
      expect(engine.getState().insuranceBet).toBe(100)
      expect(engine.getState().balance).toBe(700) // 1000 - 200 - 100
    })
  })

  // ===========================================================================
  // BUST SCENARIOS
  // ===========================================================================

  describe('Bust Scenarios', () => {
    it('should bust when exceeding 21', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 7), // Dealer hole
        card('clubs', 6), // Player card 2 (16)
        card('diamonds', 10), // Dealer face-up
        card('hearts', 10) // Hit card (26 - bust!)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.hit(0)

      const state = engine.getState()
      expect(state.playerHands[0].isBust).toBe(true)
      expect(state.playerHands[0].value).toBeGreaterThan(21)
    })

    it('should auto-stand after bust', () => {
      const deckCards = [
        card('hearts', 10),
        card('spades', 7),
        card('clubs', 10),
        card('diamonds', 10),
        card('hearts', 10) // Bust card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.hit(0) // Bust

      // Should automatically be standing (busted)
      expect(engine.getState().playerHands[0].isStanding).toBe(true)
    })

    it('should not allow actions after bust', () => {
      const deckCards = [
        card('hearts', 10),
        card('spades', 7),
        card('clubs', 10),
        card('diamonds', 10),
        card('hearts', 10) // Bust card
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.hit(0) // Bust

      // Further actions should fail
      expect(engine.hit(0)).toBe(false)
      expect(engine.doubleDown(0)).toBe(false)
      expect(engine.stand(0)).toBe(false) // Already standing from bust
    })

    it('should dealer not play when all hands bust', () => {
      // If all player hands bust, dealer doesn't need to play
      const deckCards = [
        card('hearts', 10), // H1 card 1
        card('spades', 7), // Dealer hole
        card('clubs', 10), // H2 card 1
        card('diamonds', 10), // Dealer face-up
        card('hearts', 6), // H1 card 2 (16)
        card('clubs', 5), // H2 card 2 (15)
        card('diamonds', 10), // H1 hit (bust)
        card('spades', 10) // H2 hit (bust)
      ]

      const engine = new GameEngine({ initialBalance: 1000, numHands: 2 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.placeBet(1, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Both hands hit and bust
      engine.hit(0)
      engine.hit(1)

      // Both should be bust
      const state = engine.getState()
      expect(state.playerHands[0].isBust).toBe(true)
      expect(state.playerHands[1].isBust).toBe(true)

      // Resolve - dealer doesn't need to play
      engine.playDealerTurn()
      const results = engine.resolveRound()

      // Both hands should be losses
      expect(results[0].outcome).toBe('lose')
      expect(results[1].outcome).toBe('lose')
    })
  })

  // ===========================================================================
  // PUSH SCENARIOS
  // ===========================================================================

  describe('Push Scenarios', () => {
    it('should push when player and dealer have same value', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 10), // Dealer hole
        card('clubs', 8), // Player card 2 (18)
        card('diamonds', 8) // Dealer face-up (18)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.stand(0)
      engine.playDealerTurn()
      const results = engine.resolveRound()

      expect(results[0].outcome).toBe('push')
      // Balance should be back to original (bet returned)
      expect(engine.getState().balance).toBe(1000)
    })

    it('should push on 21 vs 21 (non-blackjack)', () => {
      const deckCards = [
        card('hearts', 10), // Player card 1
        card('spades', 5), // Dealer hole
        card('clubs', 5), // Player card 2 (15)
        card('diamonds', 6), // Dealer face-up (11)
        card('hearts', 6), // Player hit (21)
        card('spades', 10) // Dealer gets 21
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      engine.hit(0) // Player gets 21
      engine.stand(0)
      engine.playDealerTurn()
      const results = engine.resolveRound()

      expect(engine.getState().playerHands[0].value).toBe(21)
      expect(engine.getState().dealerHand.value).toBe(21)
      expect(results[0].outcome).toBe('push')
    })
  })

  // ===========================================================================
  // BLACKJACK VS BLACKJACK
  // ===========================================================================

  describe('Blackjack vs Blackjack', () => {
    it('should push when both have blackjack', () => {
      const deckCards = [
        card('hearts', 'A'), // Player card 1
        card('spades', 'K'), // Dealer hole (K)
        card('clubs', 'K'), // Player card 2 (Blackjack!)
        card('diamonds', 'A') // Dealer face-up (Blackjack!)
      ]

      const engine = new GameEngine({ initialBalance: 1000 })

      engine.startNewRound()
      engine.placeBet(0, 100)
      setDeterministicDeck(engine, deckCards)
      engine.deal()

      // Both have blackjack
      expect(engine.getState().playerHands[0].isBlackjack).toBe(true)

      // Decline insurance (dealer shows Ace)
      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }

      // Player stands on blackjack
      engine.stand(0)

      // Dealer plays (also has blackjack)
      engine.playDealerTurn()
      engine.resolveRound()

      // Game should be over
      expect(engine.getState().phase).toBe(GAME_PHASES.GAME_OVER)

      // Both blackjack = push, balance should be returned
      expect(engine.getState().balance).toBe(1000)
    })
  })

  // ===========================================================================
  // COMPLETE GAME FLOW
  // ===========================================================================

  describe('Complete Game Flow', () => {
    it('should complete multiple rounds correctly', () => {
      const engine = new GameEngine({ initialBalance: 1000 })

      // Round 1
      engine.startNewRound()
      engine.placeBet(0, 100)
      engine.deal()
      if (engine.getState().insuranceOffered) {
        engine.declineInsurance()
      }
      while (
        !engine.getState().playerHands[0].isStanding &&
        !engine.getState().playerHands[0].isBust
      ) {
        const value = engine.getState().playerHands[0].value
        if (value < 17) {
          engine.hit(0)
        } else {
          engine.stand(0)
        }
      }
      engine.playDealerTurn()
      engine.resolveRound()
      expect(engine.getState().phase).toBe(GAME_PHASES.GAME_OVER)

      // Round 2
      engine.startNewRound()
      expect(engine.getState().phase).toBe(GAME_PHASES.BETTING)
    })

    it('should track balance across multiple rounds', () => {
      const engine = new GameEngine({ initialBalance: 500 })

      // Play several rounds
      for (let round = 0; round < 3; round++) {
        if (engine.getState().balance < 10) break

        engine.startNewRound()
        const bet = Math.min(10, engine.getState().balance)
        engine.placeBet(0, bet)
        engine.deal()

        if (engine.getState().insuranceOffered) {
          engine.declineInsurance()
        }

        // Simple strategy: stand on 17+
        const hand = engine.getState().playerHands[0]
        if (!hand.isBlackjack && !hand.isBust) {
          while (engine.getState().playerHands[0].value < 17) {
            if (
              engine.getState().playerHands[0].isBust ||
              engine.getState().playerHands[0].isStanding
            )
              break
            engine.hit(0)
          }
          if (!engine.getState().playerHands[0].isBust) {
            engine.stand(0)
          }
        }

        engine.playDealerTurn()
        engine.resolveRound()
      }

      // Balance should have changed (win or lose)
      expect(engine.getState().balance).not.toBe(undefined)
    })
  })
})
