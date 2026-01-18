# Task 006: Betting System Implementation

**Phase**: Phase 2 - Core Game Logic
**Estimated Duration**: 3-4 hours
**Complexity**: Low

## Task Overview

Implement BettingSystem class for balance management, bet placement, and payout calculation. Handles player's chip balance and all betting operations throughout the game.

**Key Responsibility**: Accurately track player balance and calculate payouts according to blackjack payout rules.

## Acceptance Criteria

- AC-009: Starting balance of 1000 chips
- AC-009: Balance decreased when bet placed
- AC-009: Correct payout calculation (2:1 for normal wins, 3:2 for blackjack)
- AC-009: Balance returned on push (tie)
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/game/BettingSystem.js` (NEW - 100-150 lines)
- [x] `__tests__/game/BettingSystem.test.js` (NEW - 200-250 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test-First Specification
- [x] Create test file `__tests__/game/BettingSystem.test.js`
- [x] Write tests for balance management:
  - [x] Initial balance = 1000
  - [x] getBalance() returns current balance
  - [x] placeBet(100) reduces balance by 100
  - [x] getBalance() after bet = 900
  - [x] placeBet(50) reduces balance by additional 50
  - [x] Multiple sequential bets reduce balance correctly
- [x] Write tests for bet validation:
  - [x] canAfford(100) = true when balance >= 100
  - [x] canAfford(100) = false when balance < 100
  - [x] placeBet throws when insufficient balance
- [x] Write tests for payout calculation:
  - [x] payout(100, 2.0) adds 200 to balance (normal win)
  - [x] payout(100, 1.5) adds 150 to balance (blackjack)
  - [x] payout(100, 1.0) adds 100 to balance (push/tie)
  - [x] payout(100, 0) adds 0 to balance (loss)
- [x] Write tests for bet cancellation:
  - [x] cancelBet(50) returns 50 to balance
  - [x] cancelBet returns amount correctly
- [x] Write tests for reset:
  - [x] reset() restores balance to 1000
- [x] Run all tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/game/BettingSystem.js`
- [x] Implement BettingSystem class:
  - [x] Implement constructor(initialBalance=1000):
    - Set balance to initialBalance
    - Store original balance for reset
  - [x] Implement getBalance():
    - Return current balance
  - [x] Implement placeBet(amount):
    - Check canAfford(amount) - throw if not
    - Reduce balance by amount
    - Return amount (for confirmation)
  - [x] Implement cancelBet(amount):
    - Add amount back to balance
    - Return new balance
  - [x] Implement canAfford(amount):
    - Return true if balance >= amount
    - Return false otherwise
  - [x] Implement payout(amount, multiplier):
    - Add (amount × multiplier) to balance
    - Return new balance
    - Examples: payout(100, 2.0) adds 200
  - [x] Implement reset():
    - Restore balance to original initial value
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality Improvements
- [x] Add comprehensive JSDoc comments
- [x] Verify payout multiplier logic:
  - [x] Normal win = 2.0 (doubles bet)
  - [x] Blackjack = 1.5 (3:2 payout)
  - [x] Push/tie = 1.0 (returns original bet)
  - [x] Loss = 0 (no payout)
- [x] Verify edge cases:
  - [x] Bet when balance = bet amount (allowed)
  - [x] Bet more than balance (rejected)
  - [x] Payout when balance near zero
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] Initial balance set to 1000
- [x] placeBet(100) reduces balance to 900
- [x] payout(100, 2.0) adds 200 to balance
- [x] payout(100, 1.5) adds 150 to balance (blackjack)
- [x] payout(100, 1.0) adds 100 to balance (push)
- [x] canAfford(x) returns false when x > balance
- [x] cancelBet() returns amount to balance
- [x] reset() restores 1000 balance
- [x] 15+ test cases passing (75 tests)
- [x] Code coverage >= 70% (100% for BettingSystem.js)

## Notes

**Impact Scope**:
- Direct: Task 009 (GameEngine uses payout), Task 015 (multi-hand uses), Task 017 (resolution uses)
- Indirect: Any balance update
- Change Area: New game component

**Constraints**:
- Must start with 1000 chips
- Payouts use multiplier pattern (2.0 = double, 1.5 = 3:2, etc.)
- Must prevent betting more than balance
- Must track balance accurately across multiple bets

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%
- Payout calculations verified

**Payout Reference**:
- Normal win (player 21 vs dealer < 21): bet × 2.0
- Blackjack (Ace + 10): bet × 1.5 (3:2 payout)
- Push (same total): bet × 1.0 (return original)
- Loss (dealer >= player or player bust): bet × 0 (no return)

**Dependencies**:
- None (independent core component)

**Provides**:
- `js/game/BettingSystem.js` → Used by Tasks 009, 015, 017, 020
