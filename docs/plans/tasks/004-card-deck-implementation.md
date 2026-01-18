# Task 004: Card Deck Implementation

**Phase**: Phase 2 - Core Game Logic
**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium

## Task Overview

Implement CardDeck class with standard 52-card initialization, Fisher-Yates shuffle using RandomGenerator, and card dealing operations. This is the fundamental component for card management throughout the game.

**Key Responsibility**: Provide a reliable, shuffleable card deck that deals cards in random order.

## Acceptance Criteria

- AC-001: Standard 52-card deck initialization (4 suits × 13 ranks)
- All cards created with correct suit/rank combinations
- Shuffle produces valid random order (no duplicates, no missing cards)
- Each card unique and properly tracked
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/game/CardDeck.js` (NEW - 100-150 lines)
- [x] `__tests__/game/CardDeck.test.js` (NEW - 200-250 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test-First Design
- [x] Create test file `__tests__/game/CardDeck.test.js`
- [x] Write failing test: constructor creates 52 unique cards
- [x] Write failing test: each suit (Hearts, Diamonds, Clubs, Spades) has 13 cards
- [x] Write failing test: each rank (2-10, J, Q, K, A) present in each suit
- [x] Write failing test: shuffle() changes card order
- [x] Write failing test: shuffle() doesn't duplicate or remove cards
- [x] Write failing test: deal() removes card from deck and returns it
- [x] Write failing test: deal() throws when deck empty
- [x] Write failing test: getRemaining() returns accurate count
- [x] Write failing test: reset() restores original deck state
- [x] Run all tests and confirm failure

### 2. Green Phase: Minimal Implementation
- [x] Create `js/game/CardDeck.js`
- [x] Implement CardDeck class:
  - [x] Import Card type from types/index.js
  - [x] Import RandomGenerator from utils/RandomGenerator.js
  - [x] Implement constructor(deckCount=1):
    - Initialize cards array with 52 x deckCount cards
    - Create all suit/rank combinations
    - Store original state for reset()
  - [x] Implement shuffle():
    - Use RandomGenerator.shuffle() for Fisher-Yates
    - Don't shuffle original state
  - [x] Implement deal():
    - Remove top card from deck
    - Return that card
    - Throw error if deck empty
  - [x] Implement getRemaining():
    - Return current deck length
  - [x] Implement reset():
    - Restore original deck state
    - Reset index to 0
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality Improvements
- [x] Add comprehensive JSDoc comments
- [x] Verify card creation efficiency
- [x] Add error handling for edge cases
- [x] Verify shuffle algorithm correctness
- [x] Ensure immutability of original deck state
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] CardDeck initializes with exactly 52 unique cards
- [x] Suit count: 13 cards per suit (4 suits total)
- [x] Rank count: 4 cards per rank (13 ranks total)
- [x] shuffle() produces different card order on repeated calls
- [x] deal() returns cards in sequence after shuffle
- [x] deal() thrown when attempting to deal from empty deck
- [x] getRemaining() returns accurate count (52, then 51, 50, etc.)
- [x] reset() restores full deck state
- [x] Multiple shuffles never produce identical sequence
- [x] 15+ test cases passing (54 tests)
- [x] Code coverage >= 70% (100% achieved)

## Notes

**Impact Scope**:
- Direct: Task 009 (GameEngine uses deal())
- Indirect: Any card distribution needs
- Change Area: New game component

**Constraints**:
- Must create exactly 52 unique cards (standard deck)
- Must support multi-deck configuration (deckCount parameter)
- Shuffle must be non-destructive to internal state until reset
- Must not modify RandomGenerator behavior

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%
- Shuffle distribution verified (no patterns)

**Technical Notes**:
- Each card must be unique object (not reference duplicates)
- Suit and Rank must come from types defined in Task 001
- Use RandomGenerator for secure shuffling
- Keep track of dealt vs. remaining cards

**Dependencies**:
- Task 001: Card type definition
- Task 002: RandomGenerator

**Provides**:
- `js/game/CardDeck.js` → Used by Task 009
