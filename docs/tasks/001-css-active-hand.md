---
id: "001"
title: "Add CSS styles for active hand indicator"
status: pending
depends_on: []
test_file: null
no_test_reason: "CSS-only changes, verified by visual inspection and E2E in task 005"
---

# 001: Add CSS styles for active hand indicator

## Objective

Add CSS classes and styles to visually distinguish the active hand during multi-hand play, making it immediately obvious which hand the player is currently controlling.

## Acceptance Criteria

- [ ] `.player-hand.active` has glowing border effect using `--color-accent`
- [ ] `.player-hand.active` has subtle scale transform (1.02x)
- [ ] `.player-hand:not(.active)` is dimmed (opacity 0.6, slight grayscale)
- [ ] Smooth transition (0.3s) between active/inactive states
- [ ] Respects `prefers-reduced-motion` for accessibility

## Technical Notes

From TECHNICAL_DESIGN.md - add to `css/styles.css`:

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
  transition: all 0.3s ease;
}

@media (prefers-reduced-motion: reduce) {
  .player-hand {
    transition: none;
    transform: none;
  }
}
```

## Files to Modify

- `css/styles.css` - Add active hand styles near existing `.player-hand` rules
