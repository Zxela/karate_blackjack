---
id: "002"
title: "Add CSS styles for result feedback (WIN/LOSE/PUSH/BLACKJACK)"
status: pending
depends_on: ["001"]
test_file: null
no_test_reason: "CSS-only changes, verified by visual inspection and E2E in task 005"
---

# 002: Add CSS styles for result feedback

## Objective

Add distinct visual styles for each game result type (WIN, LOSE, PUSH, BLACKJACK) to make outcomes immediately clear without reading text.

## Acceptance Criteria

- [ ] `.result-win` has green background with pulse animation
- [ ] `.result-lose` has red background with subtle shake animation
- [ ] `.result-push` has amber/yellow background with distinct border (not confused with win)
- [ ] `.result-blackjack` has gold gradient with special glow animation
- [ ] All result animations complete within 0.5-1s
- [ ] Animations respect `prefers-reduced-motion`

## Technical Notes

From TECHNICAL_DESIGN.md - add to `css/styles.css`:

```css
.hand-result.result-win {
  background: rgba(34, 197, 94, 0.9);
  color: white;
  animation: resultPulse 0.5s ease-out;
}

.hand-result.result-lose {
  background: rgba(239, 68, 68, 0.85);
  color: white;
  animation: resultShake 0.4s ease-out;
}

.hand-result.result-push {
  background: rgba(234, 179, 8, 0.9);
  border: 3px solid #fbbf24;
  color: #1a1a2e;
  animation: resultPulse 0.5s ease-out;
}

.hand-result.result-blackjack {
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1a1a2e;
  font-weight: bold;
  animation: blackjackGlow 1s ease-in-out;
}

@keyframes resultPulse {
  0% { transform: scale(0.8); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
}

@keyframes resultShake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}

@keyframes blackjackGlow {
  0%, 100% { box-shadow: 0 0 10px #fbbf24; }
  50% { box-shadow: 0 0 25px #fbbf24, 0 0 40px #f59e0b; }
}

@media (prefers-reduced-motion: reduce) {
  .hand-result {
    animation: none;
  }
}
```

## Files to Modify

- `css/styles.css` - Add result styles near existing `.hand-result` rules
