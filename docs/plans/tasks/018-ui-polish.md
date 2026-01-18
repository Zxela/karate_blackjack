# Task 018: Bet Presets and UI Polish

**Phase**: Phase 5 - Advanced Features and Multi-Hand Support
**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium

## Task Overview

Implement bet preset buttons and responsive UI refinements. Adds quick-select bet amounts, improves hand count selector, and polishes visual state feedback throughout game.

**Key Responsibility**: Enhance user experience with quick betting and clear visual feedback.

## Acceptance Criteria

- FR-016: Preset buttons set bet amount quickly
- FR-017: Hand selection interface visible and usable
- FR-018: Action buttons disabled appropriately based on state
- AC-012: All UI elements responsive at all breakpoints
- Smooth state transitions with clear feedback
- 70% code coverage minimum

## Files to Modify

- [ ] `index.html` (MODIFY - add preset buttons, ~20 lines new)
- [ ] `css/styles.css` (MODIFY - button styling, ~50 lines new)
- [ ] `js/ui/UIController.js` (MODIFY - handle presets, ~50 lines changes)
- [ ] `__tests__/ui/UIController.test.js` (ADD preset tests, ~50 lines new)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Design
- [ ] Write tests for preset buttons:
  - [ ] Preset buttons render ($10, $50, $100, $500)
  - [ ] Clicking preset places correct bet amount
  - [ ] Presets disabled outside betting phase
- [ ] Write tests for hand selector:
  - [ ] Visible during betting phase
  - [ ] Hidden during play phase
  - [ ] Buttons 1/2/3 clearly labeled
- [ ] Write tests for button states:
  - [ ] Disabled state visual clear
  - [ ] Enabled state distinct
  - [ ] Hover states for touch feedback
- [ ] Run tests and confirm failure

### 2. Green Phase: Implementation
- [ ] Modify index.html:
  - [ ] Add preset button section
  - [ ] Buttons: $10, $50, $100, $500
  - [ ] Label: "Quick Bet"
  - [ ] Preserve hand selector buttons
  - [ ] Maintain semantic HTML
- [ ] Modify css/styles.css:
  - [ ] Button styling for presets
  - [ ] Active/inactive states
  - [ ] Hover feedback (visual change)
  - [ ] Focus states for accessibility
  - [ ] Responsive sizing
  - [ ] Touch target >= 44x44px
- [ ] Modify UIController:
  - [ ] Add preset button event handlers
  - [ ] Clicking $10 preset: placeBet(0, 10)
  - [ ] Clicking $50 preset: placeBet(0, 50)
  - [ ] Clicking $100 preset: placeBet(0, 100)
  - [ ] Clicking $500 preset: placeBet(0, 500)
  - [ ] Update disableActions() to hide presets outside betting
  - [ ] Add visual feedback for button states
- [ ] Run tests and confirm all pass

### 3. Refactor Phase: Quality and Polish
- [ ] Verify responsive sizing:
  - [ ] Buttons scale appropriately
  - [ ] Touch targets maintained at all sizes
- [ ] Verify accessibility:
  - [ ] Color contrast sufficient
  - [ ] States visually distinct
  - [ ] Keyboard navigation (if applicable)
- [ ] Verify state transitions:
  - [ ] Smooth visibility changes
  - [ ] No jarring layout shifts
- [ ] Add CSS animations (optional):
  - [ ] Button press feedback
  - [ ] Smooth state transitions
- [ ] Run all tests
- [ ] Verify coverage >= 70%

## Completion Criteria

- [ ] Preset buttons ($10, $50, $100, $500) work correctly
- [ ] Hand selector (1/2/3) visible and functional
- [ ] Action buttons enable/disable based on valid actions
- [ ] UI responsive at 320px, 768px, 1200px breakpoints
- [ ] Touch targets verified as >= 44x44px
- [ ] No horizontal scroll required at any breakpoint
- [ ] Visual feedback clear for all button states
- [ ] 8+ test cases for preset functionality
- [ ] Code coverage >= 70%

## Notes

**Impact Scope**:
- Direct: Task 020 (testing), Task 021 (integration)
- Indirect: User interaction
- Change Area: UI layer

**Constraints**:
- Must be responsive at all breakpoints
- Must provide clear visual feedback
- Must maintain accessibility standards
- Must not break existing functionality

**Verification Method**: L1 (Functional)
- UI renders and responds to interactions
- Responsive design works

**Button States**:
- Default: Normal appearance
- Hover: Visual change (lighter, shadow, etc.)
- Active: Pressed appearance
- Disabled: Grayed out, no cursor change

**Preset Amounts**:
- $10: Small bet
- $50: Medium bet
- $100: Large bet
- $500: Very large bet

**Responsive Preset Layout**:
- Mobile (320px): Single row, wrapped if needed
- Tablet (768px): 2×2 grid or row
- Desktop (1200px): Full row

**Accessibility Considerations**:
- Color contrast >= 4.5:1
- Touch targets >= 44×44 pixels
- Clear visual states
- Keyboard navigation support (if mouse unavailable)

**Dependencies**:
- Task 013: UIController base
- Task 015: Multi-hand support (for hand selector)

**Provides**:
- Polish UIController with presets → Used by Tasks 020, 021
