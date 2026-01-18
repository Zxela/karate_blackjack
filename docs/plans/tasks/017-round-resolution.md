# Task 017: Round Resolution and Outcome Calculation

**Phase**: Phase 5 - Advanced Features and Multi-Hand Support
**Estimated Duration**: 4-5 hours
**Complexity**: High

## Task Overview

Implement complete round resolution with all outcome types: player win, dealer win, push, blackjack, and insurance payouts. Correctly calculates and distributes payouts for all hand combinations.

**Key Responsibility**: Accurately determine outcomes and calculate final balance for all hand scenarios.

## Acceptance Criteria

- AC-010: Blackjack pays 3:2
- AC-010: Push when both have same total
- AC-009: Balance updated correctly for all outcomes
- AC-015: Outcomes calculated and displayed for all hands
- Multi-hand outcomes handled independently
- Insurance payouts correct
- 70% code coverage minimum

## Files to Modify

- [ ] `js/game/GameEngine.js` (MODIFY - enhance resolution, ~150 lines changes)
- [ ] `__tests__/game/GameEngine.test.js` (ADD resolution tests, ~250 lines new)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Specification
- [ ] Write tests for outcome determination:
  - [ ] Player bust: loss (bet × 0)
  - [ ] Dealer bust, player not: win (bet × 2)
  - [ ] Player 21, dealer < 21: win (bet × 2)
  - [ ] Player blackjack (2 cards = 21), dealer not: blackjack (bet × 1.5)
  - [ ] Dealer blackjack, player not: loss (bet × 0)
  - [ ] Both blackjack: push (bet × 1.0)
  - [ ] Same total: push (bet × 1.0)
  - [ ] Player > dealer: win (bet × 2)
  - [ ] Player < dealer: loss (bet × 0)
- [ ] Write tests for balance updates:
  - [ ] Win: balance += bet × 2
  - [ ] Blackjack: balance += bet × 1.5
  - [ ] Push: balance += bet × 1.0 (return original)
  - [ ] Loss: no payout
- [ ] Write tests for insurance payouts:
  - [ ] Insurance taken, dealer blackjack: insurance × 2
  - [ ] Insurance taken, dealer not blackjack: insurance lost (already deducted)
- [ ] Write tests for multi-hand resolution:
  - [ ] Each hand resolved independently
  - [ ] All payouts summed
  - [ ] Final balance correct
- [ ] Write tests for outcome messages:
  - [ ] Each outcome has descriptive message
- [ ] Run tests and confirm failure

### 2. Green Phase: Implementation
- [ ] Enhance GameEngine resolution:
  - [ ] Implement determineOutcome(playerHand, dealerHand, playerBet):
    - [ ] Check for bust:
      - [ ] If playerBust && dealerBust: push (both busted)
      - [ ] If playerBust: loss
      - [ ] If dealerBust: win
    - [ ] Check for blackjack:
      - [ ] If playerBlackjack && !dealerBlackjack: blackjack (3:2)
      - [ ] If dealerBlackjack && !playerBlackjack: loss
      - [ ] If both blackjack: push
    - [ ] Compare values:
      - [ ] If playerValue > dealerValue: win
      - [ ] If playerValue === dealerValue: push
      - [ ] If playerValue < dealerValue: loss
    - [ ] Return { outcome, multiplier, message }
  - [ ] Implement calculatePayout(bet, outcome):
    - [ ] Loss: 0
    - [ ] Win: bet × 2.0
    - [ ] Blackjack: bet × 1.5
    - [ ] Push: bet × 1.0 (return original)
    - [ ] Return payout amount
  - [ ] Enhance resolveRound():
    - [ ] For each player hand:
      - [ ] Determine outcome vs dealer
      - [ ] Calculate payout
      - [ ] Add to balance via BettingSystem.payout()
    - [ ] Handle insurance:
      - [ ] If insurance taken and dealer blackjack:
        - [ ] payout(insuranceBet, 2.0)
    - [ ] Compile round result:
      - [ ] All hand outcomes
      - [ ] Total balance change
      - [ ] Final balance
    - [ ] Transition to gameOver
    - [ ] Return result

## Completion Criteria

- [ ] Player blackjack pays 3:2
- [ ] Dealer blackjack beats player 21
- [ ] Push returns original bet
- [ ] Balance updates correctly for all outcomes
- [ ] Multi-hand outcomes independent
- [ ] Insurance payouts correct (2:1)
- [ ] Outcome messages descriptive
- [ ] 15+ test cases for outcome combinations
- [ ] Code coverage >= 70%

## Notes

**Impact Scope**:
- Direct: Task 018 (UI displays outcomes), Task 020 (testing)
- Indirect: All balance calculations
- Change Area: GameEngine resolution

**Constraints**:
- Must handle all outcome combinations
- Must calculate payouts accurately
- Must update balance correctly
- Must maintain game integrity

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%

**Outcome Determination Logic**:
```
If playerBust:
  If dealerBust: PUSH
  Else: LOSS
Else if dealerBust:
  WIN
Else if playerBlackjack && !dealerBlackjack:
  BLACKJACK (3:2)
Else if dealerBlackjack:
  LOSS
Else if playerValue > dealerValue:
  WIN
Else if playerValue === dealerValue:
  PUSH
Else:
  LOSS
```

**Payout Multipliers**:
- Loss: 0× (no payout)
- Push: 1× (return original bet)
- Win: 2× (double bet)
- Blackjack: 1.5× (3:2 payout)
- Insurance Win: 2× (on insurance amount)

**Multi-Hand Handling**:
1. Resolve each hand independently
2. Calculate payout for each
3. Sum all payouts
4. Update balance once
5. Display all outcomes

**Dependencies**:
- Task 009: GameEngine core
- Task 015: Multi-hand support
- Task 016: Advanced actions (insurance)

**Provides**:
- Complete GameEngine with resolution → Used by Tasks 018, 020, 021
