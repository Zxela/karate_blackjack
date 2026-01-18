# Task 011: Card Asset System with Placeholder Support

**Phase**: Phase 4 - Presentation Layer
**Estimated Duration**: 3-4 hours
**Complexity**: Low

## Task Overview

Implement card asset loading system with placeholder fallback. Allows development to proceed with card rendering while design creates final karate-themed artwork. Placeholders are colored rectangles with text overlay.

**Key Responsibility**: Provide reliable card asset loading with graceful fallback to development placeholders.

## Acceptance Criteria

- AC-011: Cards display with clear suit and value identification
- Placeholder cards render with suit color coding
- Asset failure handling: render placeholder instead of error
- Responsive sizing at all breakpoints
- No unhandled asset load errors

## Files to Create/Modify

- [x] `js/ui/AssetLoader.js` (NEW - 100-150 lines)
- [x] `__tests__/ui/AssetLoader.test.js` (NEW - 150-200 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Test Design
- [x] Create test file `__tests__/ui/AssetLoader.test.js`
- [x] Write tests for placeholder generation:
  - [x] generatePlaceholder(suit, rank) returns canvas-compatible image
  - [x] Placeholder includes readable rank text
  - [x] Placeholder includes suit color (red=hearts/diamonds, black=clubs/spades)
- [x] Write tests for color mapping:
  - [x] Hearts = red
  - [x] Diamonds = blue
  - [x] Clubs = black
  - [x] Spades = black
- [x] Write tests for asset loading:
  - [x] loadAsset(path) returns promise
  - [x] Success: returns image/canvas
  - [x] Failure: returns placeholder
  - [x] No unhandled rejection
- [x] Run tests and confirm failure

### 2. Green Phase: Implementation
- [x] Create `js/ui/AssetLoader.js`
- [x] Implement AssetLoader class:
  - [x] Implement constructor():
    - Initialize cache object
  - [x] Implement generatePlaceholder(suit, rank):
    - Create canvas element
    - Set size (e.g., 100x150)
    - Fill with suit color
    - Draw text (rank and suit symbol)
    - Return canvas as image data/URL
    - Suit colors: Hearts=red, Diamonds=blue, Clubs=black, Spades=black
  - [x] Implement loadAsset(path):
    - Return promise
    - Try loading image from path
    - On success: return image
    - On error: return placeholder for this card
    - Cache result
  - [x] Implement getSuitColor(suit):
    - Return color for suit
  - [x] Implement getSuitSymbol(suit):
    - Return text symbol (♥, ♦, ♣, ♠)
- [x] Run tests and confirm all pass

### 3. Refactor Phase: Quality
- [x] Verify placeholder readability:
  - [x] Text visible on backgrounds
  - [x] Size sufficient for canvas rendering
- [x] Verify error handling:
  - [x] No network errors thrown
  - [x] Graceful degradation
- [x] Add JSDoc comments
- [x] Verify caching works
- [x] Run all tests
- [x] Verify coverage >= 70%

## Completion Criteria

- [x] Placeholder card generation working
- [x] Suit colors correctly displayed
- [x] Rank text visible and readable
- [x] Failed asset loading produces placeholder (not error)
- [x] Cards render with clear identification
- [x] 10+ test cases passing (47 tests)
- [x] Code coverage >= 70% (98.11% for AssetLoader.js)

## Notes

**Impact Scope**:
- Direct: Task 012 (CardRenderer uses)
- Indirect: All card rendering
- Change Area: New UI component

**Constraints**:
- Must not crash on asset load failure
- Must provide readable placeholders
- Must support both image and canvas formats
- Responsive sizing for different screen sizes

**Verification Method**: L2 (Test Operation)
- All unit tests passing
- Coverage >= 70%

**Asset Integration Strategy**:
- Development: Uses placeholders automatically
- Production (Task 019): Replace placeholder paths with real card images
- No code changes needed for transition

**Placeholder Design**:
- Colored background (suit color)
- Suit symbol (♥, ♦, ♣, ♠) at top-left and bottom-right
- Rank text large in center
- White text for readability

**Dependencies**:
- None (Phase 4 foundation)

**Provides**:
- `js/ui/AssetLoader.js` → Used by Task 012
