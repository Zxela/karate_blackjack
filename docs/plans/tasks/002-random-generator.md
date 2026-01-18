# Task 002: RandomGenerator Implementation and Cryptographic Shuffling

**Phase**: Phase 1 - Foundation
**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium

## Task Overview

Implement cryptographically secure random number generation and array shuffling using the Web Crypto API. This component provides the foundation for card shuffling throughout the game.

**Key Responsibility**: Provide secure, testable randomization that passes statistical distribution tests.

## Acceptance Criteria

- AC-001 (implicit): Cryptographically secure randomness verified
- getRandomInt returns values within [min, max] range inclusive
- shuffle produces statistically random distributions
- Graceful fallback behavior if Crypto API unavailable
- 70% code coverage minimum on test suite

## Files to Create/Modify

- [x] `js/utils/RandomGenerator.js` (NEW - 50-80 lines)
- [x] `__tests__/utils/RandomGenerator.test.js` (NEW - 150-200 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test-First Definition
- [x] Create test file `__tests__/utils/RandomGenerator.test.js`
- [x] Write failing test: getRandomInt(0, 10) returns integer between 0-10
- [x] Write failing test: getRandomInt(1, 5) never returns 0 or 6
- [x] Write failing test: shuffle doesn't duplicate cards
- [x] Write failing test: shuffle produces different order on repeated calls
- [x] Write failing test: 100 shuffle calls never produce identical sequence
- [x] Run tests and confirm all fail

### 2. Green Phase: Minimal Implementation
- [x] Create `js/utils/RandomGenerator.js`
- [x] Implement RandomGenerator functions (getSecureRandom, getRandomInt, shuffle, shuffleCopy, isCryptoAvailable)
- [x] Implement getRandomInt(min, max):
  - Uses crypto.getRandomValues() for secure random bytes
  - Returns integer in [min, max] range
  - Falls back to Math.random() if Crypto API unavailable
- [x] Implement shuffle(array):
  - Implements Fisher-Yates shuffle algorithm
  - Uses getRandomInt internally
  - In-place shuffle + shuffleCopy for non-destructive version
- [x] Implement isCryptoAvailable() helper:
  - Returns true if crypto.getRandomValues exists
  - Used for graceful degradation
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality Improvements
- [x] Add comprehensive JSDoc comments
- [x] Verify boundary conditions (min=max, negative ranges)
- [x] Add entropy verification comments
- [x] Ensure shuffle has proper time complexity O(n)
- [x] Run tests again and confirm all still pass
- [x] Check coverage >= 70% (achieved: 94.47% statements, 100% functions)

## Completion Criteria

- [x] RandomGenerator functions export correctly (getSecureRandom, getRandomInt, shuffle, shuffleCopy, isCryptoAvailable)
- [x] getRandomInt(0, 10) returns values in range [0, 10]
- [x] getRandomInt(1, 1) returns 1
- [x] shuffle([1,2,3]) produces permutation of original array
- [x] shuffle never duplicates or removes elements
- [x] 10+ test cases passing (30 tests):
  - [x] Boundary values (min=max, min=0, max=52)
  - [x] Range validation (no values outside range)
  - [x] Shuffle randomness (multiple calls different)
  - [x] Statistical distribution (Chi-squared test setup, optional)
- [x] Code coverage >= 70% (achieved: 94.47%)
- [x] No console warnings or errors

## Notes

**Impact Scope**:
- Direct: Task 004 (CardDeck shuffling)
- Indirect: Any random number needs throughout game
- Change Area: New file only

**Constraints**:
- Must use Web Crypto API (not Math.random for main implementation)
- Must degrade gracefully if Crypto unavailable
- Must be compatible with browsers (IE11+)
- Shuffle must be non-destructive (not modify input array)

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%

**Technical Notes**:
- crypto.getRandomValues() is async-safe and suitable for browser
- Fisher-Yates algorithm ensures uniform distribution
- Fallback to Math.random() acceptable only if Crypto unavailable (add console warning)

**Dependencies**:
- None (Phase 1 foundation)

**Provides**:
- `js/utils/RandomGenerator.js` → Used by Task 004
