# Task 013: UIController Implementation

**Phase**: Phase 4 - Presentation Layer
**Estimated Duration**: 5-6 hours
**Complexity**: Medium-High

## Task Overview

Implement DOM controller for game state display and user interactions. Renders game state to HTML, manages button states, and handles user input events.

**Key Responsibility**: Translate GameEngine state to visual UI and convert user interactions to GameEngine actions.

## Acceptance Criteria

- AC-014: Display updates within 100ms of state change
- AC-014: Hand values and balance displayed
- AC-014: Current phase clearly indicated
- AC-012: Responsive layout all screen sizes
- Button states enable/disable based on game rules
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/ui/UIController.js` (NEW - 250-350 lines)
- [x] `__tests__/ui/UIController.test.js` (NEW - 250-350 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Design
- [x] Create test file `__tests__/ui/UIController.test.js`
- [x] Write tests for initialization:
  - [x] constructor(gameEngine, cardRenderer) stores references
  - [x] init() sets up event listeners
- [x] Write tests for rendering:
  - [x] render(state) updates DOM
  - [x] Balance displayed correctly
  - [x] Hand values shown
  - [x] Phase displayed
- [x] Write tests for button management:
  - [x] enableActions(['hit']) enables hit button
  - [x] disableActions(['hit']) disables hit button
  - [x] Button events trigger GameEngine methods
- [x] Write tests for state updates:
  - [x] subscribe to GameEngine
  - [x] render called on state change
  - [x] Update within 100ms (timing test)
- [x] Write tests for responsive:
  - [x] handleResize() adjusts layout
- [x] Run tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/ui/UIController.js`
- [x] Implement UIController class:
  - [x] Implement constructor(gameEngine, cardRenderer):
    - Store references
    - Find DOM elements (balance, phase, cards, buttons)
  - [x] Implement init():
    - Subscribe to gameEngine state changes
    - Attach event listeners to buttons
    - Attach resize listener
    - Render initial state
  - [x] Implement render(state):
    - Update balance display: state.balance
    - Update phase display: state.phase
    - Render player hands: call cardRenderer for each card
    - Render dealer hand: dealer cards
    - Update hand values: state.playerHands[i].getValue()
    - Call enableActions with valid actions for current state
  - [x] Implement enableActions(actions):
    - Enable buttons corresponding to action names
    - Valid actions: ['hit', 'stand', 'doubleDown', 'split', 'placeBet']
  - [x] Implement disableActions(actions):
    - Disable buttons for action names
  - [x] Implement button event handlers:
    - Hit button: gameEngine.hit(currentHandIndex)
    - Stand button: gameEngine.stand(currentHandIndex)
    - DoubleDown button: gameEngine.doubleDown(currentHandIndex)
    - Split button: gameEngine.split(currentHandIndex)
    - Bet buttons: gameEngine.placeBet(handIndex, amount)
  - [x] Implement showMessage(message):
    - Display message in message area
    - Auto-hide after timeout
  - [x] Implement handleResize():
    - Adjust layout for current viewport
    - Recalculate responsive sizing
    - Trigger re-render
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality
- [x] Verify timing:
  - [x] State updates within 100ms
  - [x] No debouncing delays
- [x] Verify responsive design:
  - [x] Layout works at 320px, 768px, 1200px
- [x] Verify accessibility:
  - [x] Buttons have labels
  - [x] Touch targets >= 44x44px
- [x] Add JSDoc comments
- [x] Verify event binding cleanup (no memory leaks)
- [x] Run all tests
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] Button states update correctly per game state
- [x] Balance display updates on state change
- [x] Hand values display correctly
- [x] Phase display shows current game state
- [x] Responsive layout verified at 320px, 768px, 1200px
- [x] Event listeners trigger GameEngine methods
- [x] State updates within 100ms
- [x] No console errors
- [x] 15+ test cases passing (85 tests passing)
- [x] Code coverage >= 70% (98.68% achieved)

## Notes

**Impact Scope**:
- Direct: Task 015 (multi-hand updates), Task 018 (UI polish updates)
- Indirect: All UI interactions
- Change Area: UI coordination component

**Constraints**:
- Must update state within 100ms
- Must be responsive at all breakpoints
- Must handle game state correctly
- Must be testable with mocked GameEngine

**Verification Method**: L1 (Functional)
- UI renders and responds to interactions
- Responsive design works

**Button State Logic**:
- Betting phase: Only bet/play buttons
- PlayerTurn: Hit, Stand, DoubleDown (if 2 cards), Split (if pair)
- DealerTurn: No buttons (disabled)
- Resolution: Only new round button

**Dependencies**:
- Task 009: GameEngine
- Task 012: CardRenderer

**Provides**:
- `js/ui/UIController.js` → Used by Tasks 015, 018, 020, 021
