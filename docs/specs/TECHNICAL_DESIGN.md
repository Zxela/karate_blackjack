# Technical Design: UI/UX Improvements

## Architecture Overview

Changes will be made to:
1. `css/styles.css` - New classes and animations
2. `js/main.js` - Apply classes based on game state in `updateUI()`

No changes to game engine, animation coordinator (except possibly result display), or other modules.

## Implementation Details

### 1. Active Hand Indicator

**CSS Changes:**
```css
.player-hand.active {
  box-shadow: 0 0 20px 5px var(--color-accent);
  border: 2px solid var(--color-accent);
  transform: scale(1.02);
  transition: all 0.3s ease;
}

.player-hand:not(.active) {
  opacity: 0.6;
  filter: grayscale(20%);
}

.player-hand.active .hand-label::after {
  content: " - Playing";
  color: var(--color-accent);
}
```

**JS Changes in updateUI():**
- Already applies `.active` class based on `activeHandIndex`
- Verify it's being applied during PLAYER_TURN phase only

### 2. Result Feedback

**CSS Changes:**
```css
.hand-result {
  position: absolute;
  /* existing positioning */
}

.hand-result.result-win {
  background: rgba(34, 197, 94, 0.9);
  animation: resultPulse 0.5s ease-out;
}

.hand-result.result-lose {
  background: rgba(239, 68, 68, 0.8);
  animation: resultShake 0.4s ease-out;
}

.hand-result.result-push {
  background: rgba(234, 179, 8, 0.9);
  border: 3px solid #fbbf24;
  animation: resultPulse 0.5s ease-out;
}

.hand-result.result-blackjack {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  animation: blackjackGlow 1s ease-in-out;
  font-weight: bold;
}

@keyframes resultPulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}
```

**JS Changes in displayResults():**
- Add result type class to `.hand-result` element
- Ensure class is cleared on new round

### 3. Hand Value Display

**CSS Changes:**
```css
.hand-value.soft::before {
  content: "♠";
  margin-right: 4px;
  color: var(--color-accent);
}

.hand-value.soft {
  color: var(--color-success);
  font-style: italic;
}
```

**JS Changes in updateUI():**
- Add `.soft` class when `hand.isSoft && hand.value <= 21`
- Already displays "Soft X" text

## Data Flow

```
Game State Change
      │
      ▼
  updateUI()
      │
      ├─► Check phase === PLAYER_TURN
      │         │
      │         ▼
      │   Apply .active to current hand
      │   Remove .active from others
      │
      ├─► Check hand.isSoft
      │         │
      │         ▼
      │   Toggle .soft class on value element
      │
      └─► displayResults() (on RESOLUTION/GAME_OVER)
                │
                ▼
          Apply result classes (.result-win, etc.)
```

## Testing Strategy

1. **Visual Testing:** Manual inspection of all states
2. **Unit Tests:** Verify class application logic
3. **E2E Tests:** Existing tests should pass; add tests for:
   - Active hand class during multi-hand play
   - Result classes applied correctly

## Security Considerations

None - purely visual changes with no user input handling.

## Dependencies

- Existing CSS custom properties (--color-accent, --color-success, etc.)
- Existing JS update flow (updateUI, displayResults)
