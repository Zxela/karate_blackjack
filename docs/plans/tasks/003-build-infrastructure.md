# Task 003: Build Infrastructure and Project Structure

**Phase**: Phase 1 - Foundation
**Estimated Duration**: 2-3 hours
**Complexity**: Low

## Task Overview

Establish project build configuration, HTML scaffold, CSS grid layout foundation, and main application entry point. Creates the responsive layout foundation for all UI components.

**Key Responsibility**: Provide working HTML/CSS/JS infrastructure ready for game development.

## Acceptance Criteria

- AC-013 (responsive): Responsive breakpoints configured (320px-1920px)
- AC-012: Touch targets minimum 44x44px in mobile CSS
- AC-014: Game phase display CSS classes prepared
- HTML validates without critical errors
- CSS passes Biome linting
- Project builds successfully

## Files to Create/Modify

- [x] `index.html` (NEW - 100-150 lines)
- [x] `css/styles.css` (NEW - 200-300 lines)
- [x] `js/main.js` (NEW - 30-50 lines)
- [x] `package.json` (NEW or UPDATE - check if exists)

## Implementation Steps (Red-Green-Refactor)

### 1. Red Phase: Structure Planning
- [x] Create HTML skeleton with semantic elements
- [x] Plan CSS Grid layout for table, dealer area, player area
- [x] Define responsive breakpoints (320px, 768px, 1200px)
- [x] Plan CSS variables for responsive scaling
- [x] Verify no build infrastructure exists yet

### 2. Green Phase: Implementation
- [x] Create `index.html`:
  - [x] DOCTYPE and meta tags (viewport, charset)
  - [x] Semantic HTML structure (header, main, footer)
  - [x] Div containers for: dealer-hand, player-hands, action-buttons, balance-display, message-area
  - [x] Canvas element for card rendering (id="gameCanvas")
  - [x] Script tag linking to js/main.js
  - [x] CSS link to styles.css
  - [x] No game logic in HTML (purely structure)

- [x] Create `css/styles.css`:
  - [x] CSS variables for colors, sizing, breakpoints
  - [x] Mobile-first approach (default 320px, then media queries)
  - [x] CSS Grid for table layout
  - [x] Flexbox for card arrangement
  - [x] Button styling with 44x44px minimum touch targets
  - [x] Responsive font sizing
  - [x] Responsive margin/padding using clamp()
  - [x] Card container sizing (responsive)
  - [x] Game state display classes (hidden, visible, active)

- [x] Create `js/main.js`:
  - [x] Basic entry point that logs "Game initialized"
  - [x] Placeholder for future GameEngine initialization
  - [x] Window load event handler

- [x] Create/verify `package.json`:
  - [x] Name: "karate-blackjack"
  - [x] Scripts: build, check (Biome), test
  - [x] Check project structure exists

### 3. Refactor Phase: Polish and Validation
- [x] Add comprehensive comments to CSS Grid structure
- [x] Verify responsive scaling with clamp() functions
- [x] Test button accessibility (color contrast, size)
- [x] Add CSS classes for game phases
- [x] Verify HTML structure (no missing closing tags)
- [x] Run Biome check on CSS (biome format)
- [x] Verify all breakpoints functional

## Completion Criteria

- [x] index.html loads successfully in browser
- [x] CSS Grid layout appears without layout shift
- [x] CSS variables defined and usable
- [x] Responsive design works at 320px width
- [x] Responsive design works at 768px width
- [x] Responsive design works at 1200px width
- [x] Touch targets >= 44x44px verified (with DevTools)
- [x] No horizontal scroll at any breakpoint
- [x] Canvas element renders on page
- [x] `npm run check` passes (no Biome errors)
- [x] Main app loads without console errors

## Notes

**Impact Scope**:
- Direct: UI foundation for all Phase 4 components
- Indirect: Layout container for all visual elements
- Change Area: New files (html, css, js/main.js)

**Constraints**:
- Must be mobile-first responsive (320px minimum)
- Must use CSS Grid for table layout
- Must not include any game logic
- CSS must be semantic and maintainable
- No framework dependencies (vanilla CSS/JS)

**Verification Method**: L3 (Build Success)
- HTML validates
- CSS lints clean
- Page loads without errors
- Manual responsive testing at breakpoints

**Responsive Design Approach**:
```
320px - 767px: Mobile (single column, stacked)
768px - 1199px: Tablet (flexible layout)
1200px+: Desktop (full layout)
```

**Dependencies**:
- None (Phase 1 foundation)

**Provides**:
- HTML/CSS structure → Used by Task 013 (UIController)
- Responsive layout foundation → Used by Phase 4-5
