# Task 015: Multi-Hand Support (1-3 Hands)

**Phase**: Phase 5 - Advanced Features and Multi-Hand Support
**Estimated Duration**: 5-6 hours
**Complexity**: High

## Task Overview

Extend GameEngine and UIController to support 1-3 simultaneous hands. Players can select hand count before round, play hands sequentially left to right with independent betting.

**Key Responsibility**: Enable multi-hand gameplay while maintaining game flow and balance accuracy.

## Acceptance Criteria

- AC-008: Player selects 1-3 hands before round
- AC-008: Hands process sequentially left to right
- AC-008: Active hand visually highlighted
- AC-009: Each hand has independent betting
- Game logic correctly handles all hand combinations
- 70% code coverage minimum

## Files to Modify

- [x] `js/game/GameEngine.js` (MODIFY - add multi-hand methods, ~150 lines new)
- [x] `js/ui/UIController.js` (MODIFY - add hand selector UI, ~100 lines new)
- [x] `__tests__/game/GameEngine.test.js` (ADD multi-hand tests, ~200 lines new)
- [x] `__tests__/ui/UIController.test.js` (ADD selector tests, ~100 lines new)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Specification
- [x] Add GameEngine tests for multi-hand:
  - [x] startNewRound(handCount=1) initializes 1 hand
  - [x] startNewRound(handCount=2) initializes 2 hands
  - [x] startNewRound(handCount=3) initializes 3 hands
  - [x] getState() returns handCount in state
  - [x] placeBet(handIndex, amount) places bet on correct hand
  - [x] hit(handIndex) affects only specified hand
  - [x] stand(handIndex) completes only that hand
- [x] Add UIController tests for hand selector:
  - [x] Hand selector UI renders (1, 2, 3 buttons)
  - [x] Clicking selector calls startNewRound(count)
  - [x] Active hand highlighted visually
  - [x] Hand indicators show progression
- [x] Run tests and confirm failure

### 2. Green Phase: Implementation
- [x] Modify GameEngine:
  - [x] Update constructor: add handCount parameter
  - [x] Update startNewRound(handCount=1):
    - [x] Create handCount Hand objects
    - [x] Initialize currentHandIndex = 0
    - [x] Store handCount in state
  - [x] Update getState():
    - [x] Add handCount field
    - [x] Add currentHandIndex field
    - [x] Add allHandsData array
  - [x] Update placeBet(handIndex, amount):
    - [x] Validate handIndex < handCount
    - [x] Track all bets independently
  - [x] Update hit/stand/doubleDown/split:
    - [x] Ensure handIndex correctly specified
    - [x] Move to next hand after stand
  - [x] Update dealCards():
    - [x] Deal 2 cards to each hand
  - [x] Add getCurrentHandIndex():
    - [x] Return currently active hand
  - [x] Add moveToNextHand():
    - [x] Increment handIndex
    - [x] Transition to dealerTurn if all hands done
- [x] Modify UIController:
  - [x] Add hand selector UI:
    - [x] Three buttons: "1 Hand", "2 Hands", "3 Hands"
    - [x] Visible during betting phase
    - [x] Click triggers gameEngine.startNewRound(count)
  - [x] Update render():
    - [x] Highlight active hand (CSS class)
    - [x] Show hand progression (e.g., "Hand 1 of 3")
    - [x] Show hand status (playing, complete)
  - [x] Update button management:
    - [x] Disable actions for non-active hands
    - [x] Enable only current hand actions
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality
- [x] Verify hand sequencing:
  - [x] Hands play in order (left to right)
  - [x] No hand skipped
  - [x] Dealer plays after all hands complete
- [x] Verify betting independence:
  - [x] Each hand separate balance deduction
  - [x] Each hand separate payout
  - [x] Total balance correct after round
- [x] Verify UI consistency:
  - [x] Hand highlighting consistent
  - [x] Hand count selector clear
  - [x] All hand values visible
- [x] Add JSDoc comments
- [x] Run all tests
- [x] Verify coverage >= 70% (achieved: 96.07%)

## Completion Criteria

- [x] Hand count selector renders in UI
- [x] 1-3 hands initialize with betting positions
- [x] Hands play sequentially without mixing logic
- [x] Active hand clearly highlighted
- [x] Each hand has independent bet
- [x] Balance updates correctly for all hands
- [x] Dealer plays after all hands complete
- [x] All hand values displayed
- [x] 12+ test cases for multi-hand scenarios (35 new tests added)
- [x] Code coverage >= 70% (achieved: 96.07%)
- [x] Game playable with 2 and 3 hands

## Notes

**Impact Scope**:
- Direct: Task 016 (advanced actions), Task 017 (resolution)
- Indirect: All multi-hand features
- Change Area: GameEngine and UIController modifications

**Constraints**:
- Must maintain backward compatibility (single hand = original behavior)
- Must sequence hands strictly left-to-right
- Must track bets independently
- Must be playable without UI for testing

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%

**Hand Sequencing**:
1. Player selects hand count (1, 2, or 3)
2. Hand selector hidden, betting phase
3. Player places bets on each hand (left to right)
4. Dealer deals to all hands
5. Player plays hands sequentially
6. Hand 1 → Hand 2 → Hand 3 (if exists) → Dealer
7. Resolution for all hands
8. Ready for new round

**Multi-Hand State Structure**:
```
playerHands: [Hand, Hand, Hand] (1-3 elements)
currentHandIndex: 0
bets: [100, 100, 100]
handStates: ['playing', 'complete', 'pending']
```

**Dependencies**:
- Task 009: GameEngine core
- Task 013: UIController

**Provides**:
- Extended GameEngine with multi-hand support → Used by Tasks 016, 017, 020, 021
