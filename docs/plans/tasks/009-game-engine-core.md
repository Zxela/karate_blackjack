# Task 009: GameEngine Core Implementation

**Phase**: Phase 3 - Game Flow and Dealer Logic
**Estimated Duration**: 6-8 hours
**Complexity**: High

## Task Overview

Implement GameEngine core game loop coordinating all components (CardDeck, Hand, BettingSystem, DealerAI, GameStateMachine). This is the central orchestrator of all game logic.

**Key Responsibility**: Coordinate all game systems to enable playable single-hand blackjack games.

## Acceptance Criteria

- AC-003: Hit action adds card and recalculates value
- AC-004: Stand action ends player turn
- AC-005: Double down doubles bet and deals single card
- AC-006: Split creates separate hands
- AC-007: Insurance offer when dealer shows Ace
- AC-014: State display updates within 100ms
- Single-hand game playable through completion
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/game/GameEngine.js` (NEW - 300-400 lines)
- [x] `__tests__/game/GameEngine.test.js` (NEW - 400-500 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Game Flow Specification
- [x] Create test file `__tests__/game/GameEngine.test.js`
- [x] Plan complete round test sequence:
  - [x] Round sequence: bet → deal → hit → stand → resolution
- [x] Write tests for initialization:
  - [x] constructor(config) initializes with balance
  - [x] getState() returns initial game state
  - [x] Can subscribe to state changes
- [x] Write tests for round setup:
  - [x] startNewRound() initializes fresh round
  - [x] getState() shows betting phase
  - [x] No cards dealt yet
- [x] Write tests for betting:
  - [x] placeBet(handIndex, amount) decreases balance
  - [x] placeBet(handIndex, amount) stores bet amount
  - [x] Multiple bets in sequence (multi-hand later)
- [x] Write tests for dealing:
  - [x] After bet, player receives 2 cards
  - [x] Dealer receives 1 card face up
  - [x] State transitions to playerTurn
- [x] Write tests for player actions:
  - [x] hit(handIndex) adds card to hand
  - [x] Hand value recalculates after hit
  - [x] stand(handIndex) completes hand (no more hits)
  - [x] Double down available only with 2 cards
  - [x] doubleDown(handIndex) doubles bet and adds 1 card
  - [x] split(handIndex) available only for matching ranks
  - [x] split(handIndex) creates two hands
- [x] Write tests for dealer actions:
  - [x] Dealer plays automatically after player done
  - [x] Dealer follows hit/stand rules (DealerAI)
- [x] Write tests for resolution:
  - [x] Round compares hands and determines outcome
  - [x] Balance updates correctly
  - [x] State transitions to gameOver
- [x] Write tests for insurance:
  - [x] Insurance offered when dealer shows Ace
  - [x] Insurance side bet placed
  - [x] Insurance pays 2:1 on dealer blackjack
- [x] Run all tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/game/GameEngine.js`
- [x] Implement GameEngine class:
  - [x] Implement constructor(config):
    - Initialize CardDeck with shuffled cards
    - Initialize BettingSystem with balance
    - Initialize GameStateMachine
    - Initialize DealerAI
    - Initialize playerHands array (start empty)
    - Initialize dealerHand
    - Initialize subscriptions support
  - [x] Implement getState():
    - Return game state object:
      - phase: from GameStateMachine
      - playerHands: array of player hands
      - dealerHand: dealer's hand
      - balance: current balance
      - currentBets: array of bet amounts
      - dealerShowsAce: for insurance offer
  - [x] Implement subscribe(callback):
    - Subscribe to GameStateMachine changes
    - Also notify on state changes
  - [x] Implement startNewRound():
    - Reset hands
    - Transition to "betting" phase
    - Prepare for new bets
  - [x] Implement placeBet(handIndex, amount):
    - Verify betting phase
    - Call BettingSystem.placeBet(amount)
    - Store bet for this hand
    - When all bets placed, proceed to dealing
  - [x] Implement dealCards():
    - Deal 2 cards to player
    - Deal 1 card to dealer (face up)
    - Transition to playerTurn
    - Check for blackjacks/insurance
  - [x] Implement hit(handIndex):
    - Verify playerTurn phase
    - Add card to specified hand
    - Check for bust
    - If bust, auto-stand this hand
  - [x] Implement stand(handIndex):
    - Verify playerTurn phase
    - Mark hand complete
    - Move to next hand or dealer turn
  - [x] Implement doubleDown(handIndex):
    - Verify 2-card hand
    - Verify sufficient balance
    - Double bet for this hand
    - Deal 1 card
    - Auto-stand this hand
  - [x] Implement split(handIndex):
    - Verify 2 matching cards
    - Verify sufficient balance for second bet
    - Create second hand with one card
    - First hand gets one card
    - Both hands require bets and play
  - [x] Implement takeInsurance():
    - Place insurance bet (half of main bet)
    - Mark insurance taken
  - [x] Implement declineInsurance():
    - Skip insurance
  - [x] Implement playDealerTurn():
    - Dealer plays hand using DealerAI
    - Transition to resolution
  - [x] Implement resolveRound():
    - Compare each player hand to dealer hand
    - Calculate outcomes
    - Update balance with payouts
    - Transition to gameOver
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Edge Cases and Optimization
- [x] Handle edge cases:
  - [x] Blackjack on deal (21 with 2 cards)
  - [x] Bust handling (auto-stand)
  - [x] Multiple hands (preparation for Task 015)
  - [x] Insurance with dealer blackjack
- [x] Verify state machine transitions:
  - [x] Correct phase after each action
  - [x] No invalid state transitions
- [x] Verify timing constraints:
  - [x] State updates within 100ms
  - [x] No significant delays
- [x] Add comprehensive JSDoc comments
- [x] Verify game flow end-to-end
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] startNewRound() initializes game state
- [x] placeBet() decreases balance and records bet
- [x] hit() adds card without standing
- [x] stand() completes current hand
- [x] doubleDown() doubles bet and deals one card
- [x] split() creates two hands from pair
- [x] Dealer plays hand correctly (using DealerAI)
- [x] Balance updates correctly after round
- [x] State transitions valid throughout game
- [x] Insurance offered when dealer shows Ace
- [x] Complete single-hand game playable (no UI needed)
- [x] 30+ test cases covering action sequences (100 tests)
- [x] Code coverage >= 70% (88.63% achieved)

## Integration Test (Full Round)

Single integration test covering complete game:
```
1. startNewRound()
2. placeBet(0, 100)
3. Verify dealing phase
4. hit(0)
5. stand(0)
6. Verify dealer plays
7. resolveRound()
8. Verify balance updated
```

## Notes

**Impact Scope**:
- Direct: Task 013 (UIController uses), Tasks 015-017 (extensions), Task 010 (StorageManager saves)
- Indirect: All game flow
- Change Area: Core game engine (large file, significant logic)

**Constraints**:
- Must coordinate multiple systems
- Must enforce game rules correctly
- Must maintain valid state transitions
- Must be extensible for multi-hand (Task 015)
- Must be persistable (Task 010)

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Full round integration test passing
- Coverage >= 70%

**System Coordination**:
- CardDeck: Manages cards
- Hand: Tracks hand value and status
- BettingSystem: Manages balance and bets
- DealerAI: Controls dealer actions
- GameStateMachine: Manages state transitions

**Dependencies**:
- Task 001: Card, GameState types
- Task 004: CardDeck
- Task 005: Hand
- Task 006: BettingSystem
- Task 007: GameStateMachine
- Task 008: DealerAI

**Provides**:
- `js/game/GameEngine.js` → Used by Tasks 013, 015, 016, 017, 020, 021
