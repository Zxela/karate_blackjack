# Architecture Decision Record: UI/UX Improvements

## Context

The blackjack game uses:
- Vanilla CSS with CSS custom properties for theming
- JavaScript for dynamic UI updates via `updateUI()` in main.js
- Canvas-based animations via AnimationCoordinator.js
- CSS animations/keyframes for result effects

We need to add visual enhancements without major architectural changes.

## Decision Drivers

- Maintain consistency with existing karate theme
- Keep changes isolated to CSS and minimal JS updates
- Avoid breaking existing animations or game flow
- Support reduced-motion preferences

## Options Considered

### Option 1: CSS-Only Enhancements (Recommended)
Add new CSS classes and animations for:
- `.active-hand` with glow effect
- `.result-win`, `.result-lose`, `.result-push`, `.result-blackjack` overlays
- `.soft-hand` indicator styling

**Pros:** Minimal JS changes, performant, easy to maintain
**Cons:** Limited dynamic control

### Option 2: Canvas-Based Result Overlays
Render result animations on the existing game canvas.

**Pros:** More control over animations
**Cons:** Complex, mixes concerns, harder to maintain

### Option 3: New Overlay Component
Create a dedicated result overlay DOM element with full animations.

**Pros:** Full control, separation of concerns
**Cons:** More complex, potential z-index issues

## Decision

**Option 1: CSS-Only Enhancements** with minimal JS to apply/remove classes.

## Consequences

### Positive
- Quick implementation
- Easy to test and adjust
- Follows existing patterns
- Good performance

### Negative
- Some animation limitations
- Need to ensure CSS doesn't conflict with existing styles
