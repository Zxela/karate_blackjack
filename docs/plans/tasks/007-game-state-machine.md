# Task 007: GameStateMachine Implementation

**Phase**: Phase 3 - Game Flow and Dealer Logic
**Estimated Duration**: 4-5 hours
**Complexity**: Medium

## Task Overview

Implement GameStateMachine for state validation and transitions. Manages valid state transitions and notifies subscribers of state changes. Critical for ensuring game flow follows valid rules.

**Key Responsibility**: Enforce valid game state transitions and coordinate component updates through subscriptions.

## Acceptance Criteria

- AC-014: All game phases properly modeled (betting, playing, resolution)
- Valid state transition validation: only allowed actions for current state
- State changes trigger subscriber notifications
- Persisted state loading support
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/state/GameStateMachine.js` (NEW - 150-200 lines)
- [x] `__tests__/state/GameStateMachine.test.js` (NEW - 250-300 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: State Transition Specification
- [x] Create test file `__tests__/state/GameStateMachine.test.js`
- [x] Write tests for state management:
  - [x] Initial state = "betting"
  - [x] getState() returns current state
  - [x] setState(state) changes current state (internal helper)
- [x] Write tests for valid transitions:
  - [x] From "betting" -> "dealing" allowed
  - [x] From "dealing" -> "playerTurn" allowed
  - [x] From "playerTurn" -> "dealerTurn" allowed
  - [x] From "dealerTurn" -> "resolution" allowed
  - [x] From "resolution" -> "gameOver" allowed
  - [x] From "gameOver" -> "betting" allowed (new round)
- [x] Write tests for invalid transitions:
  - [x] From "betting" -> "dealerTurn" rejected
  - [x] From "playerTurn" -> "betting" rejected
  - [x] From any state -> invalid state rejected
- [x] Write tests for canTransition():
  - [x] canTransition("dealing") = true from "betting"
  - [x] canTransition("dealerTurn") = false from "betting"
  - [x] Returns boolean (not throwing)
- [x] Write tests for transition():
  - [x] transition("dealing") succeeds from "betting"
  - [x] Throws error on invalid transition
- [x] Write tests for subscriptions:
  - [x] subscribe(callback) registers callback
  - [x] Multiple subscribers registered
  - [x] Unsubscribe returns function
  - [x] State change triggers all callbacks
  - [x] Callbacks receive new state
- [x] Run all tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/state/GameStateMachine.js`
- [x] Define valid state transitions:
  ```
  betting -> dealing -> playerTurn -> dealerTurn -> resolution -> gameOver
  gameOver -> betting (new round)
  ```
- [x] Implement GameStateMachine class:
  - [x] Implement constructor(storageManager=null):
    - Initialize current state = "betting"
    - Initialize subscribers array = []
    - Store storageManager reference
  - [x] Implement getState():
    - Return current state string
  - [x] Implement canTransition(action):
    - Check if action is valid from current state
    - Return boolean (don't throw)
  - [x] Implement transition(action):
    - Verify canTransition(action)
    - Throw error if invalid
    - Update current state
    - Notify all subscribers
    - Return new state
  - [x] Implement subscribe(callback):
    - Add callback to subscribers array
    - Return unsubscribe function
  - [x] Implement notify subscribers:
    - Call each callback with new state
    - Handle callback errors gracefully
  - [x] Implement loadPersistedState():
    - If storageManager exists, load state
    - Otherwise return current state
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality and Edge Cases
- [x] Handle subscriber callback errors:
  - [x] One failing callback doesn't prevent others
  - [x] Log errors but continue
- [x] Verify all transitions covered:
  - [x] Create state transition diagram
  - [x] Confirm no orphaned states
- [x] Add comprehensive JSDoc comments
- [x] Verify subscription cleanup:
  - [x] Unsubscribe removes callback
  - [x] No memory leaks from subscriptions
- [x] Run all tests again
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] canTransition() returns true for valid actions
- [x] canTransition() returns false for invalid actions
- [x] transition() moves to correct next state
- [x] transition() throws on invalid transition
- [x] Subscribers notified on state change
- [x] subscribe() returns unsubscribe function
- [x] Multiple subscribers all receive notifications
- [x] State transitions match game flow:
  - [x] betting -> dealing -> playerTurn -> dealerTurn -> resolution -> gameOver -> betting
  - [x] No shortcuts or skips allowed
- [x] 20+ test cases covering state matrix
- [x] Code coverage >= 70%

## Notes

**Impact Scope**:
- Direct: Task 010 (StorageManager uses), Task 009 (GameEngine uses), Task 013 (UIController subscribes)
- Indirect: Any component needing to track game phase
- Change Area: New state management component

**Constraints**:
- Must enforce sequential state transitions (no jumping states)
- Must not allow invalid transitions
- Must notify all subscribers of changes
- Must be testable without storage manager

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%
- State transition matrix verified

**State Transition Diagram**:
```
betting
  |
dealing (cards dealt, initial state set)
  |
playerTurn (player makes actions)
  |
dealerTurn (dealer plays hand)
  |
resolution (outcomes calculated)
  |
gameOver (results displayed)
  |
betting (ready for new round)
```

**Valid Transitions Only**:
- From each state, only one or two next states allowed
- No backwards transitions
- gameOver -> betting enables next round

**Dependencies**:
- Task 001: GamePhase type

**Provides**:
- `js/state/GameStateMachine.js` -> Used by Tasks 009, 010, 013, 020
