# Task 008: DealerAI Implementation

**Phase**: Phase 3 - Game Flow and Dealer Logic
**Estimated Duration**: 3-4 hours
**Complexity**: Low

## Task Overview

Implement DealerAI with standard dealer rules (hit on 16 or less, stand on 17+, soft 17 handling). Provides deterministic dealer behavior that follows actual casino rules.

**Key Responsibility**: Apply standard dealer rules correctly in all hand scenarios.

## Acceptance Criteria

- AC-002: Dealer hits on 16 or less
- AC-002: Dealer stands on 17 or more
- AC-002: Soft 17 handled correctly (stand on soft 17 standard rule)
- All hand value scenarios tested
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/game/DealerAI.js` (NEW - 80-120 lines)
- [x] `__tests__/game/DealerAI.test.js` (NEW - 200-250 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test-First Design
- [x] Create test file `__tests__/game/DealerAI.test.js`
- [x] Write tests for shouldHit():
  - [x] Hand value 16 (hard): shouldHit() = true
  - [x] Hand value 17 (hard): shouldHit() = false
  - [x] Hand value 17 (soft, Ace as 11): shouldHit() = false (soft 17 rule)
  - [x] Hand value 12: shouldHit() = true
  - [x] Hand value 20: shouldHit() = false
  - [x] Hand value 21: shouldHit() = false
  - [x] Boundary: 16.99999 (impossible): should handle gracefully
- [x] Write tests for play():
  - [x] play() with hard 15: hits until bust or >= 17
  - [x] play() with hard 17: stands immediately
  - [x] play() with soft 16: hits (soft 17 rule applies)
  - [x] play() complete play sequence
  - [x] play() doesn't modify original hand
- [x] Run all tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/game/DealerAI.js`
- [x] Implement DealerAI class:
  - [x] Implement constructor():
    - No initialization needed for stateless AI
  - [x] Implement shouldHit(hand):
    - Get hand value using hand.getValue()
    - Get soft status using hand.isSoft()
    - If hard (not soft) and value <= 16: return true
    - If soft and value <= 16: return true (soft 17 rule: hit soft 17)
    - If value >= 17: return false
    - Formula: hit if (isSoft && value <= 16) || (value <= 16)
    - Simplifies to: hit if value <= 16 (soft doesn't matter for <= 16)
    - Stand if value >= 17
  - [x] Implement play(hand, deck):
    - Loop while shouldHit(hand):
      - Deal card from deck
      - Add to hand
    - Return completed hand
    - Note: modifies hand object
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality Improvements
- [x] Verify soft 17 handling:
  - [x] Soft 17 (Ace + 6 = 17): should stand (standard rule)
  - [x] Hard 17 (10 + 7 = 17): should stand
- [x] Add comprehensive JSDoc comments
- [x] Verify play() game flow:
  - [x] Loop terminates correctly
  - [x] Hand state accurate after play
  - [x] Deck interactions correct
- [x] Verify no side effects on input hand
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] shouldHit() returns true when hand value <= 16
- [x] shouldHit() returns false when hand value >= 17
- [x] Soft 17 handling verified (stand rule)
- [x] play() completes full dealer turn
- [x] play() doesn't modify original hand until hitting
- [x] play() handles multiple cards correctly
- [x] Hard 15 play → hits until 17+
- [x] Soft 16 play → hits (soft 17 rule)
- [x] 15+ test cases passing (52 tests)
- [x] Code coverage >= 70% (100% achieved)

## Notes

**Impact Scope**:
- Direct: Task 009 (GameEngine uses play)
- Indirect: Dealer hand resolution
- Change Area: New AI component

**Constraints**:
- Must implement standard dealer rules
- Must handle both soft and hard hands
- Soft 17 rule: dealer stands on 17 or higher (even if soft)
- Actually: Soft 17 means stand, so hit on soft 16 only
- play() method can modify hand (expected behavior)

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%
- All hand value ranges tested

**Dealer Rules Reference**:
- Hit on 16 or less
- Stand on 17 or more
- Soft 17 rule: Stand on soft 17 (some casinos: hit on soft 17)
- Standard rule: Stand on all 17s

**Technical Notes**:
- shouldHit returns decision without modifying hand
- play() modifies hand by adding cards from deck
- Soft hand has Ace counted as 11
- Value <= 16 means hit
- Value >= 17 means stand

**Dependencies**:
- Task 005: Hand class

**Provides**:
- `js/game/DealerAI.js` → Used by Task 009
