# Task 016: Advanced Actions Implementation

**Phase**: Phase 5 - Advanced Features and Multi-Hand Support
**Estimated Duration**: 5-6 hours
**Complexity**: High

## Task Overview

Implement complete player actions with all validation rules: Double Down, Split (including Ace splits), and Insurance. All actions respect multi-hand contexts and betting rules.

**Key Responsibility**: Correctly implement all advanced blackjack actions with proper validation.

## Acceptance Criteria

- AC-005: Double down only with 2 cards and sufficient balance
- AC-005: Doubled hand receives exactly 1 card (stand automatic)
- AC-006: Split only available with matching card values
- AC-006: Split Aces get 1 card each (no further actions)
- AC-007: Insurance available when dealer shows Ace
- AC-007: Insurance pays 2:1 on dealer blackjack
- All action validations tested
- 70% code coverage minimum

## Files to Modify

- [ ] `js/game/GameEngine.js` (MODIFY - enhance action methods, ~200 lines changes)
- [ ] `__tests__/game/GameEngine.test.js` (ADD action tests, ~300 lines new)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Specification
- [ ] Write tests for double down:
  - [ ] canDoubleDown(handIndex) returns true with 2 cards
  - [ ] canDoubleDown(handIndex) returns false with 1 card
  - [ ] canDoubleDown(handIndex) returns false with 3+ cards
  - [ ] canDoubleDown(handIndex) returns false if insufficient balance
  - [ ] doubleDown(handIndex) doubles bet
  - [ ] doubleDown(handIndex) deals exactly 1 card
  - [ ] doubleDown(handIndex) auto-stands after
- [ ] Write tests for split:
  - [ ] canSplit(handIndex) returns true for pair (same rank)
  - [ ] canSplit(handIndex) returns true for 10/J/Q/K (value equivalence)
  - [ ] canSplit(handIndex) returns false for non-matching
  - [ ] canSplit(handIndex) returns false if insufficient balance
  - [ ] split(handIndex) creates two hands
  - [ ] Each split hand gets one original card
  - [ ] Each split hand receives one new card
  - [ ] Split Aces: each gets exactly 1 card (locked, no further actions)
- [ ] Write tests for split Ace special rules:
  - [ ] After split Aces, cannot hit/stand (auto-stand)
  - [ ] Cannot double after split Aces
- [ ] Write tests for insurance:
  - [ ] insurance available only when dealer shows Ace
  - [ ] Insurance bet = original bet / 2
  - [ ] takeInsurance() places insurance bet
  - [ ] declineInsurance() skips insurance
  - [ ] Insurance pays 2:1 if dealer blackjack
  - [ ] Insurance loses if dealer no blackjack
- [ ] Run tests and confirm failure

### 2. Green Phase: Implementation
- [ ] Enhance GameEngine doubleDown:
  - [ ] Implement canDoubleDown(handIndex):
    - [ ] Check hand has exactly 2 cards
    - [ ] Check balance >= current bet
    - [ ] Return boolean
  - [ ] Enhance doubleDown(handIndex):
    - [ ] Call canDoubleDown() - throw if false
    - [ ] Double the bet for this hand
    - [ ] Deal exactly 1 card
    - [ ] Auto-stand this hand
    - [ ] Move to next hand
- [ ] Enhance GameEngine split:
  - [ ] Implement canSplit(handIndex):
    - [ ] Check exactly 2 cards
    - [ ] Check cards have same rank OR same value (J/Q/K)
    - [ ] Check balance >= current bet
    - [ ] Return boolean
  - [ ] Enhance split(handIndex):
    - [ ] Call canSplit() - throw if false
    - [ ] Create second hand with one card from original
    - [ ] Original hand keeps other card
    - [ ] Both hands need bets (equal to original)
    - [ ] Special: If split Aces:
      - [ ] Each hand gets exactly 1 additional card
      - [ ] Cannot hit/double/split further (locked)
      - [ ] Auto-stand both hands
- [ ] Enhance GameEngine insurance:
  - [ ] Implement takeInsurance():
    - [ ] Check dealer shows Ace
    - [ ] Place insurance bet = current bet / 2
    - [ ] Deduct from balance
  - [ ] Implement declineInsurance():
    - [ ] Skip insurance
  - [ ] During resolution:
    - [ ] If insurance taken and dealer blackjack:
      - [ ] Insurance wins 2:1
    - [ ] If insurance taken and dealer not blackjack:
      - [ ] Insurance loses (already deducted)
- [ ] Run tests and confirm all pass

### 3. Refactor Phase: Quality
- [ ] Verify action validation:
  - [ ] All edge cases covered
  - [ ] Balance checks accurate
  - [ ] Hand restrictions enforced
- [ ] Verify split Ace special handling:
  - [ ] Correct card distribution
  - [ ] Proper lockdown of further actions
- [ ] Verify insurance mechanics:
  - [ ] Correct payout calculation
  - [ ] Correct loss handling
- [ ] Add JSDoc comments
- [ ] Run all tests
- [ ] Verify coverage >= 70%

## Completion Criteria

- [ ] Double down button enabled only with 2 cards
- [ ] Double down action doubles bet correctly
- [ ] Split creates two hands with independent play
- [ ] Split Aces receive 1 card each (locked)
- [ ] Insurance offered when dealer shows Ace
- [ ] Insurance payout correct (2:1)
- [ ] All action validations working
- [ ] All edge cases handled
- [ ] 20+ test cases covering all action scenarios
- [ ] Code coverage >= 70%

## Notes

**Impact Scope**:
- Direct: Task 017 (resolution depends on action state)
- Indirect: All advanced gameplay
- Change Area: GameEngine action methods

**Constraints**:
- Must validate all actions before executing
- Must respect hand state (can't double after hit)
- Must enforce Ace split restrictions
- Must track insurance properly for resolution

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%

**Action Eligibility Matrix**:
| Action | Requirement | After | Locked |
|--------|------------|-------|--------|
| Hit | Any | Any | Split Aces |
| Stand | Any | Any | Never |
| DoubleDown | 2 cards, balance | Auto-stand | After |
| Split | 2 matching, balance | Each needs bet | After Split Aces |
| Insurance | Dealer Ace | Any | Never |

**Split Ace Special Behavior**:
- Each Ace hand: Gets exactly 1 additional card
- Cannot hit again
- Cannot double
- Cannot split further
- Auto-stand after card dealt

**Dependencies**:
- Task 009: GameEngine core
- Task 015: Multi-hand support

**Provides**:
- Enhanced GameEngine with advanced actions → Used by Tasks 017, 020, 021
