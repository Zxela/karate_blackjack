/**
 * @fileoverview Unit tests for BettingSystem module.
 *
 * Tests cover:
 * - Balance management (initial balance, getBalance)
 * - Bet placement (placeBet, balance deduction)
 * - Bet validation (canAfford, min/max limits)
 * - Payout calculation with multipliers
 * - Bet cancellation
 * - Reset functionality
 * - Multi-hand betting scenarios
 * - Edge cases and boundary conditions
 *
 * @module tests/game/BettingSystem
 */

import { beforeEach, describe, expect, it } from 'vitest'
import { BettingSystem } from '../../js/game/BettingSystem.js'
import { DEFAULTS } from '../../js/types/index.js'

describe('BettingSystem', () => {
  let betting

  beforeEach(() => {
    betting = new BettingSystem()
  })

  describe('constructor', () => {
    it('creates a system with default initial balance of 1000', () => {
      expect(betting.getBalance()).toBe(1000)
    })

    it('creates a system with custom initial balance', () => {
      const customBetting = new BettingSystem(5000)
      expect(customBetting.getBalance()).toBe(5000)
    })

    it('creates a system with default min bet of 10', () => {
      expect(betting.getMinBet()).toBe(10)
    })

    it('creates a system with default max bet of 500', () => {
      expect(betting.getMaxBet()).toBe(500)
    })

    it('creates a system with custom min and max bet', () => {
      const customBetting = new BettingSystem(1000, 25, 1000)
      expect(customBetting.getMinBet()).toBe(25)
      expect(customBetting.getMaxBet()).toBe(1000)
    })

    it('starts with no active bets', () => {
      expect(betting.getBetsTotal()).toBe(0)
    })
  })

  describe('getBalance', () => {
    it('returns current balance', () => {
      expect(betting.getBalance()).toBe(1000)
    })

    it('returns updated balance after bet placed', () => {
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(900)
    })

    it('returns updated balance after multiple bets', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      expect(betting.getBalance()).toBe(850)
    })
  })

  describe('getMinBet', () => {
    it('returns minimum bet amount', () => {
      expect(betting.getMinBet()).toBe(DEFAULTS.MIN_BET)
    })

    it('returns custom minimum bet', () => {
      const customBetting = new BettingSystem(1000, 50, 500)
      expect(customBetting.getMinBet()).toBe(50)
    })
  })

  describe('getMaxBet', () => {
    it('returns maximum bet amount', () => {
      expect(betting.getMaxBet()).toBe(DEFAULTS.MAX_BET)
    })

    it('returns custom maximum bet', () => {
      const customBetting = new BettingSystem(1000, 10, 2000)
      expect(customBetting.getMaxBet()).toBe(2000)
    })
  })

  describe('placeBet', () => {
    it('reduces balance by bet amount', () => {
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(900)
    })

    it('reduces balance by additional amount for second bet', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      expect(betting.getBalance()).toBe(850)
    })

    it('returns true when bet is successfully placed', () => {
      const result = betting.placeBet(100)
      expect(result).toBe(true)
    })

    it('returns false when bet amount exceeds balance', () => {
      const result = betting.placeBet(1500)
      expect(result).toBe(false)
    })

    it('does not reduce balance when bet fails', () => {
      betting.placeBet(1500)
      expect(betting.getBalance()).toBe(1000)
    })

    it('returns false when bet amount is below minimum', () => {
      const result = betting.placeBet(5)
      expect(result).toBe(false)
    })

    it('returns false when bet amount exceeds maximum', () => {
      const result = betting.placeBet(600)
      expect(result).toBe(false)
    })

    it('allows bet exactly at minimum', () => {
      const result = betting.placeBet(10)
      expect(result).toBe(true)
      expect(betting.getBalance()).toBe(990)
    })

    it('allows bet exactly at maximum', () => {
      const result = betting.placeBet(500)
      expect(result).toBe(true)
      expect(betting.getBalance()).toBe(500)
    })

    it('allows betting entire balance when within limits', () => {
      const smallBetting = new BettingSystem(100, 10, 500)
      const result = smallBetting.placeBet(100)
      expect(result).toBe(true)
      expect(smallBetting.getBalance()).toBe(0)
    })

    it('tracks bet amounts', () => {
      betting.placeBet(100)
      expect(betting.getBetsTotal()).toBe(100)
    })

    it('tracks multiple bets', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      expect(betting.getBetsTotal()).toBe(150)
    })

    it('returns false for zero bet amount', () => {
      const result = betting.placeBet(0)
      expect(result).toBe(false)
    })

    it('returns false for negative bet amount', () => {
      const result = betting.placeBet(-100)
      expect(result).toBe(false)
    })
  })

  describe('canBet', () => {
    it('returns true when balance >= amount and within limits', () => {
      expect(betting.canBet(100)).toBe(true)
    })

    it('returns false when amount exceeds balance', () => {
      expect(betting.canBet(1500)).toBe(false)
    })

    it('returns true when bet equals balance and within limits', () => {
      const smallBetting = new BettingSystem(100, 10, 500)
      expect(smallBetting.canBet(100)).toBe(true)
    })

    it('returns false when bet is below minimum', () => {
      expect(betting.canBet(5)).toBe(false)
    })

    it('returns false when bet exceeds maximum', () => {
      expect(betting.canBet(600)).toBe(false)
    })

    it('returns true for bet at minimum limit', () => {
      expect(betting.canBet(10)).toBe(true)
    })

    it('returns true for bet at maximum limit', () => {
      expect(betting.canBet(500)).toBe(true)
    })

    it('returns false for zero amount', () => {
      expect(betting.canBet(0)).toBe(false)
    })

    it('returns false for negative amount', () => {
      expect(betting.canBet(-100)).toBe(false)
    })

    it('considers current balance after bets placed', () => {
      betting.placeBet(500) // Max bet, leaves 500 remaining
      expect(betting.canBet(500)).toBe(true) // Can bet remaining balance
      betting.placeBet(400) // Leaves 100 remaining
      expect(betting.canBet(200)).toBe(false) // Exceeds remaining balance
      expect(betting.canBet(100)).toBe(true) // Equals remaining balance
    })
  })

  describe('payout', () => {
    it('adds amount to balance for normal win (2.0 multiplier)', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.payout(100, 2.0)
      // Bet 100, balance now 900, payout 100*2.0=200, new balance 1100
      expect(betting.getBalance()).toBe(balanceBefore + 200)
    })

    it('adds amount to balance for blackjack win (1.5 multiplier)', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.payout(100, 1.5)
      // Payout 100*1.5=150
      expect(betting.getBalance()).toBe(balanceBefore + 150)
    })

    it('returns original bet for push (1.0 multiplier)', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.payout(100, 1.0)
      // Payout 100*1.0=100 (bet returned)
      expect(betting.getBalance()).toBe(balanceBefore + 100)
    })

    it('adds nothing for loss (0 multiplier)', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.payout(100, 0)
      // Payout 100*0=0
      expect(betting.getBalance()).toBe(balanceBefore)
    })

    it('returns the new balance', () => {
      betting.placeBet(100)
      const newBalance = betting.payout(100, 2.0)
      expect(newBalance).toBe(1100)
    })

    it('handles payout on zero balance', () => {
      const smallBetting = new BettingSystem(100, 10, 500)
      smallBetting.placeBet(100)
      expect(smallBetting.getBalance()).toBe(0)
      smallBetting.payout(100, 2.0)
      expect(smallBetting.getBalance()).toBe(200)
    })

    it('handles 2:1 insurance payout (2.0 multiplier)', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      // Insurance bet typically half the original bet
      betting.payout(50, 2.0)
      expect(betting.getBalance()).toBe(balanceBefore + 100)
    })

    it('handles 3:2 blackjack payout correctly (bet + 1.5x bet)', () => {
      // For 3:2 blackjack: player gets back bet + 1.5*bet
      // Using multiplier 2.5 for total return (1 + 1.5)
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.payout(100, 2.5)
      // Payout = 100 * 2.5 = 250 (original bet + 1.5x winnings)
      expect(betting.getBalance()).toBe(balanceBefore + 250)
    })
  })

  describe('reset', () => {
    it('restores balance to initial value', () => {
      betting.placeBet(500)
      expect(betting.getBalance()).toBe(500)
      betting.reset()
      expect(betting.getBalance()).toBe(1000)
    })

    it('restores custom initial balance', () => {
      const customBetting = new BettingSystem(5000)
      customBetting.placeBet(3000)
      customBetting.reset()
      expect(customBetting.getBalance()).toBe(5000)
    })

    it('allows resetting with new initial balance', () => {
      betting.reset(2000)
      expect(betting.getBalance()).toBe(2000)
    })

    it('clears all active bets', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      betting.reset()
      expect(betting.getBetsTotal()).toBe(0)
    })
  })

  describe('getBetsTotal', () => {
    it('returns 0 when no bets placed', () => {
      expect(betting.getBetsTotal()).toBe(0)
    })

    it('returns sum of all active bets', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      betting.placeBet(25)
      expect(betting.getBetsTotal()).toBe(175)
    })

    it('returns 0 after bets cleared', () => {
      betting.placeBet(100)
      betting.clearBets()
      expect(betting.getBetsTotal()).toBe(0)
    })
  })

  describe('clearBets', () => {
    it('clears all active bets', () => {
      betting.placeBet(100)
      betting.placeBet(50)
      betting.clearBets()
      expect(betting.getBetsTotal()).toBe(0)
    })

    it('does not affect balance', () => {
      betting.placeBet(100)
      const balanceBefore = betting.getBalance()
      betting.clearBets()
      expect(betting.getBalance()).toBe(balanceBefore)
    })
  })

  describe('multi-hand betting scenarios', () => {
    it('tracks bets for multiple hands', () => {
      betting.placeBet(100) // Hand 1
      betting.placeBet(100) // Hand 2
      expect(betting.getBetsTotal()).toBe(200)
      expect(betting.getBalance()).toBe(800)
    })

    it('allows three hands with bets', () => {
      betting.placeBet(100)
      betting.placeBet(100)
      betting.placeBet(100)
      expect(betting.getBetsTotal()).toBe(300)
      expect(betting.getBalance()).toBe(700)
    })

    it('validates each bet individually', () => {
      const result1 = betting.placeBet(400)
      const result2 = betting.placeBet(400)
      const result3 = betting.placeBet(400)
      expect(result1).toBe(true)
      expect(result2).toBe(true)
      expect(result3).toBe(false) // Only 200 left, below 400
    })

    it('handles multiple payouts', () => {
      betting.placeBet(100)
      betting.placeBet(100)
      betting.payout(100, 2.0) // Win on hand 1
      betting.payout(100, 0) // Lose on hand 2
      expect(betting.getBalance()).toBe(1000) // 800 + 200 + 0
    })

    it('handles split scenario with doubled bet', () => {
      betting.placeBet(100) // Original hand
      betting.placeBet(100) // Split hand (same bet)
      expect(betting.getBetsTotal()).toBe(200)
      expect(betting.getBalance()).toBe(800)
    })
  })

  describe('edge cases', () => {
    it('handles zero balance', () => {
      const zeroBetting = new BettingSystem(0, 10, 500)
      expect(zeroBetting.getBalance()).toBe(0)
      expect(zeroBetting.canBet(10)).toBe(false)
    })

    it('handles exact balance match with bet', () => {
      const exactBetting = new BettingSystem(100, 10, 500)
      const result = exactBetting.placeBet(100)
      expect(result).toBe(true)
      expect(exactBetting.getBalance()).toBe(0)
    })

    it('rejects bet one chip over balance', () => {
      const limitBetting = new BettingSystem(100, 10, 500)
      expect(limitBetting.canBet(101)).toBe(false)
    })

    it('handles floating point bet amounts', () => {
      // Bets should typically be whole numbers, but handle gracefully
      const result = betting.placeBet(100.5)
      expect(result).toBe(true)
      expect(betting.getBalance()).toBe(899.5)
    })

    it('handles large payout multipliers', () => {
      betting.placeBet(100)
      betting.payout(100, 10.0)
      expect(betting.getBalance()).toBe(1900) // 900 + 1000
    })

    it('handles consecutive wins', () => {
      betting.placeBet(100)
      betting.payout(100, 2.0)
      betting.clearBets()
      betting.placeBet(200)
      betting.payout(200, 2.0)
      // 1000-100=900, +200=1100, -200=900, +400=1300
      expect(betting.getBalance()).toBe(1300)
    })

    it('handles payout when balance near zero', () => {
      const lowBetting = new BettingSystem(50, 10, 500)
      lowBetting.placeBet(50)
      expect(lowBetting.getBalance()).toBe(0)
      lowBetting.payout(50, 2.5)
      expect(lowBetting.getBalance()).toBe(125)
    })
  })

  describe('bet limits with balance constraint', () => {
    it('constrains max bet to balance when balance < maxBet', () => {
      const limitedBetting = new BettingSystem(200, 10, 500)
      // Max bet is 500, but balance is only 200
      expect(limitedBetting.canBet(200)).toBe(true)
      expect(limitedBetting.canBet(201)).toBe(false)
    })

    it('allows full max bet when balance allows', () => {
      expect(betting.canBet(500)).toBe(true)
    })
  })

  describe('integration scenarios', () => {
    it('simulates a full round with win', () => {
      // Place bet
      expect(betting.placeBet(100)).toBe(true)
      expect(betting.getBalance()).toBe(900)
      expect(betting.getBetsTotal()).toBe(100)

      // Win 1:1
      betting.payout(100, 2.0)
      expect(betting.getBalance()).toBe(1100)

      // Clear bets for next round
      betting.clearBets()
      expect(betting.getBetsTotal()).toBe(0)
    })

    it('simulates a full round with blackjack', () => {
      expect(betting.placeBet(100)).toBe(true)
      expect(betting.getBalance()).toBe(900)

      // Blackjack pays 3:2 (bet + 1.5x bet = 2.5x total)
      betting.payout(100, 2.5)
      expect(betting.getBalance()).toBe(1150)
    })

    it('simulates a full round with push', () => {
      expect(betting.placeBet(100)).toBe(true)
      expect(betting.getBalance()).toBe(900)

      // Push returns original bet
      betting.payout(100, 1.0)
      expect(betting.getBalance()).toBe(1000)
    })

    it('simulates a full round with loss', () => {
      expect(betting.placeBet(100)).toBe(true)
      expect(betting.getBalance()).toBe(900)

      // Loss, no payout
      betting.payout(100, 0)
      expect(betting.getBalance()).toBe(900)

      betting.clearBets()
      expect(betting.getBetsTotal()).toBe(0)
    })

    it('simulates multiple rounds of play', () => {
      // Round 1: Win
      betting.placeBet(100)
      betting.payout(100, 2.0)
      betting.clearBets()
      expect(betting.getBalance()).toBe(1100)

      // Round 2: Lose
      betting.placeBet(200)
      betting.payout(200, 0)
      betting.clearBets()
      expect(betting.getBalance()).toBe(900)

      // Round 3: Push
      betting.placeBet(100)
      betting.payout(100, 1.0)
      betting.clearBets()
      expect(betting.getBalance()).toBe(900)

      // Round 4: Blackjack
      betting.placeBet(100)
      betting.payout(100, 2.5)
      betting.clearBets()
      expect(betting.getBalance()).toBe(1050)
    })

    it('simulates split hand scenario', () => {
      // Initial bet
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(900)
      expect(betting.getBetsTotal()).toBe(100)

      // Split creates second hand with equal bet
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(800)
      expect(betting.getBetsTotal()).toBe(200)

      // Hand 1 wins, Hand 2 loses
      betting.payout(100, 2.0) // +200
      betting.payout(100, 0) // +0
      expect(betting.getBalance()).toBe(1000)
    })

    it('simulates double down scenario', () => {
      // Initial bet
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(900)

      // Double down adds equal bet
      betting.placeBet(100)
      expect(betting.getBalance()).toBe(800)
      expect(betting.getBetsTotal()).toBe(200)

      // Win on doubled bet (payout on full amount)
      betting.payout(200, 2.0)
      expect(betting.getBalance()).toBe(1200)
    })
  })
})
