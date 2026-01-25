---
id: "003"
title: "Add CSS styles for soft hand indicator"
status: pending
depends_on: ["001"]
test_file: null
no_test_reason: "CSS-only changes, verified by visual inspection and E2E in task 005"
---

# 003: Add CSS styles for soft hand indicator

## Objective

Add visual styling to distinguish soft hands (Ace counted as 11) from hard hands, reinforcing the "Soft X" text already displayed.

## Acceptance Criteria

- [ ] `.hand-value.soft` has distinct styling (green tint, italic)
- [ ] Optional ace icon before soft value text
- [ ] Styling is subtle but noticeable
- [ ] Works with existing hand value layout

## Technical Notes

From TECHNICAL_DESIGN.md - add to `css/styles.css`:

```css
.hand-value.soft {
  color: var(--color-success);
  font-style: italic;
}

.hand-value.soft::before {
  content: "♠ ";
  color: var(--color-accent);
  font-style: normal;
}
```

Note: The text already shows "Soft X" from the JS `formatHandValue()` function. This CSS adds visual reinforcement.

## Files to Modify

- `css/styles.css` - Add soft hand styles near existing `.hand-value` rules
