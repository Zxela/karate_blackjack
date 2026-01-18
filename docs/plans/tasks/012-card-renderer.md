# Task 012: CardRenderer Implementation

**Phase**: Phase 4 - Presentation Layer
**Estimated Duration**: 4-5 hours
**Complexity**: Medium

## Task Overview

Implement canvas-based card rendering with animation support. Renders cards at specified positions with optional face-up/face-down display and dealing animations.

**Key Responsibility**: Provide reliable card rendering on canvas with responsive scaling.

## Acceptance Criteria

- AC-011: Karate-themed cards render correctly (use placeholder until art ready)
- AC-012: Responsive layout at all breakpoints
- Cards render at correct canvas coordinates
- Face-up and face-down rendering
- Animation framework support
- 70% code coverage minimum

## Files to Create/Modify

- [x] `js/ui/CardRenderer.js` (NEW - 150-200 lines)
- [x] `__tests__/ui/CardRenderer.test.js` (NEW - 200-250 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Design
- [x] Create test file `__tests__/ui/CardRenderer.test.js`
- [x] Write tests for initialization:
  - [x] constructor(canvas, assetLoader) stores references
  - [x] loadAssets() loads all 52 cards + back
- [x] Write tests for rendering:
  - [x] renderCard(card, x, y, true) renders face-up
  - [x] renderCard(card, x, y, false) renders face-down
  - [x] Card rendered at correct coordinates
  - [x] Multiple cards don't overlap
- [x] Write tests for card back:
  - [x] renderCardBack(x, y) renders card back image
  - [x] Card back visually distinct from face cards
- [x] Write tests for clear:
  - [x] clear() clears canvas
- [x] Write tests for animation preparation:
  - [x] animateCardDeal() signature correct
- [x] Run tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/ui/CardRenderer.js`
- [x] Implement CardRenderer class:
  - [x] Implement constructor(canvas, assetLoader):
    - Store canvas reference
    - Get 2D context
    - Store assetLoader
    - Initialize assets cache
  - [x] Implement loadAssets():
    - Load all 52 card assets via assetLoader
    - Load card back asset
    - Cache locally
  - [x] Implement renderCard(card, x, y, faceUp):
    - If faceUp: render card image
    - If !faceUp: render card back
    - Draw at coordinates (x, y)
    - Handle missing assets with placeholder
  - [x] Implement renderCardBack(x, y):
    - Render back design at coordinates
  - [x] Implement clear():
    - Clear canvas context
    - ctx.clearRect(0, 0, canvas.width, canvas.height)
  - [x] Implement animateCardDeal(card, fromX, fromY, toX, toY, duration):
    - Setup for animation (Task 014)
    - Return animation promise
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality
- [x] Verify canvas rendering:
  - [x] No rendering artifacts
  - [x] Scaling correct at different card sizes
- [x] Verify coordinate accuracy:
  - [x] Cards render exactly at specified positions
- [x] Verify responsive sizing:
  - [x] Card size adjusts for different canvas sizes
- [x] Add JSDoc comments
- [x] Verify asset caching
- [x] Run all tests
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] Cards render with suit and rank visible
- [x] Card back renders correctly
- [x] Cards scale responsively
- [x] No canvas rendering errors
- [x] Multiple cards render without overlap
- [x] Face-up/face-down toggle works
- [x] clear() properly clears canvas
- [x] 8+ test cases passing (54 tests passing)
- [x] Code coverage >= 70% (95.78% statement coverage)

## Notes

**Impact Scope**:
- Direct: Task 013 (UIController uses), Task 014 (AnimationManager coordinates)
- Indirect: All visual card display
- Change Area: Core rendering component

**Constraints**:
- Must use HTML5 canvas (2D context)
- Must render at correct coordinates
- Must support responsive sizing
- Must handle asset loading failures gracefully
- Coordinate system: (0,0) at top-left

**Verification Method**: L1 (Functional)
- Cards render visibly on canvas
- No console errors

**Responsive Scaling Strategy**:
- Card dimensions: width x height pixels
- Adjust size based on viewport/container
- Maintain aspect ratio

**Canvas Coordinate System**:
- Origin (0,0) at top-left
- X increases rightward
- Y increases downward
- Use drawImage(image, x, y, width, height)

**Dependencies**:
- Task 011: AssetLoader

**Provides**:
- `js/ui/CardRenderer.js` → Used by Tasks 013, 014, 020
