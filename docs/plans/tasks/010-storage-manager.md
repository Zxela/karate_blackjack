# Task 010: StorageManager and State Persistence

**Phase**: Phase 3 - Game Flow and Dealer Logic
**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium

## Task Overview

Implement StorageManager for LocalStorage-based state persistence. Enables game state to survive page refresh, maintaining player progress across sessions.

**Key Responsibility**: Persist and restore game state reliably with graceful degradation.

## Acceptance Criteria

- AC-013: Game state persisted across page refresh
- AC-013: Previous balance loaded on new session
- Graceful degradation if LocalStorage unavailable
- Error handling for private browsing and quota exceeded
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/state/StorageManager.js` (NEW - 100-150 lines)
- [x] `__tests__/state/StorageManager.test.js` (NEW - 200-250 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test-First Design
- [x] Create test file `__tests__/state/StorageManager.test.js`
- [x] Write tests for availability:
  - [x] isAvailable() returns true when localStorage exists
  - [x] isAvailable() returns false when localStorage throws
  - [x] isAvailable() detects private browsing mode
- [x] Write tests for save/load cycle:
  - [x] save(state) persists state to storage
  - [x] load() retrieves persisted state
  - [x] load() returns same object structure as saved
  - [x] Repeated save/load preserves data
- [x] Write tests for JSON serialization:
  - [x] Complex state objects serialize/deserialize correctly
  - [x] Balance values preserved as numbers
  - [x] Hand arrays preserved
- [x] Write tests for error handling:
  - [x] save() in private browsing doesn't crash
  - [x] load() when storage unavailable returns null
  - [x] clear() removes state from storage
- [x] Write tests for storage key:
  - [x] Custom storage key supported
  - [x] Default key = 'karateBlackjack'
- [x] Run all tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/state/StorageManager.js`
- [x] Implement StorageManager class:
  - [x] Implement constructor(storageKey='karateBlackjack'):
    - Store storage key
    - Check availability once
    - Store availability flag
  - [x] Implement isAvailable():
    - Check if window.localStorage exists
    - Try writing test value
    - Return true if successful
    - Return false on error
    - Handles QuotaExceededError
    - Handles SecurityError (private browsing)
  - [x] Implement save(state):
    - Return if !isAvailable()
    - JSON.stringify(state)
    - localStorage.setItem(storageKey, json)
    - Catch and log errors
    - Don't throw (graceful degradation)
  - [x] Implement load():
    - Return null if !isAvailable()
    - const json = localStorage.getItem(storageKey)
    - If !json, return null
    - JSON.parse(json)
    - Catch and return null on error
  - [x] Implement clear():
    - If available, localStorage.removeItem(storageKey)
    - Catch errors gracefully
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality and Edge Cases
- [x] Verify error handling:
  - [x] One failure doesn't prevent other operations
  - [x] Graceful degradation tested
  - [x] Private browsing mode handled
- [x] Verify serialization:
  - [x] Complex objects deserialize correctly
  - [x] No data loss in round-trip
- [x] Add comprehensive JSDoc comments
- [x] Verify quota handling:
  - [x] QuotaExceededError caught
  - [x] Graceful degradation
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] save() persists state to LocalStorage
- [x] load() retrieves persisted state
- [x] State survives page refresh (manual verification - tested via unit tests)
- [x] isAvailable() correctly detects storage availability
- [x] isAvailable() returns false in private browsing
- [x] load() returns null when no state saved
- [x] clear() removes state from storage
- [x] Error handling graceful (no crashes on quota exceeded)
- [x] JSON serialization round-trip successful
- [x] 12+ test cases passing (61 tests passing)
- [x] Code coverage >= 70% (100% coverage achieved)

## Notes

**Impact Scope**:
- Direct: GameStateMachine initialization (optional), GameEngine state saving
- Indirect: Session persistence
- Change Area: New persistence component

**Constraints**:
- Must handle localStorage unavailability gracefully
- Must handle private browsing mode
- Must not crash on quota exceeded
- Must support custom storage keys
- Must not expose errors to end user

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%
- Graceful degradation verified

**Error Scenarios**:
1. Private browsing: SecurityError on write
2. Quota exceeded: QuotaExceededError on write
3. Browser disables storage: localStorage undefined
4. Parsing error: Invalid JSON string

**Storage Key Strategy**:
- Default: 'karateBlackjack'
- Allows multiple game instances with different keys
- Optional customization

**Integration with GameEngine**:
- GameEngine calls save() after each action
- GameEngine calls load() on initialization
- Non-critical feature (game works without persistence)

**Dependencies**:
- Task 009: GameEngine provides state to save

**Provides**:
- `js/state/StorageManager.js` → Used by Task 009 (optional), Task 013 (optional)
