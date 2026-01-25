---
id: "004"
title: "Update JS to apply UI enhancement classes"
status: pending
depends_on: ["001", "002", "003"]
test_file: "__tests__/ui/UIEnhancements.test.js"
---

# 004: Update JS to apply UI enhancement classes

## Objective

Modify `main.js` to apply the new CSS classes based on game state:
1. `.active` class on current hand during PLAYER_TURN
2. `.soft` class on hand value when hand is soft
3. Result classes (`.result-win`, etc.) in displayResults()

## Acceptance Criteria

- [ ] Active hand gets `.active` class during PLAYER_TURN phase only
- [ ] Non-active hands do NOT have `.active` class
- [ ] `.soft` class applied to hand value when `hand.isSoft && hand.value <= 21`
- [ ] Result classes applied based on outcome: win, lose, push, blackjack
- [ ] Classes cleared appropriately on new round

## Technical Notes

### In updateUI() - Active Hand:
The code already applies `.active` class at line 547-550. Verify it only applies during PLAYER_TURN:
```javascript
handEl.classList.toggle(
  'active',
  i === activeHandIndex && state.phase === GAME_PHASES.PLAYER_TURN
)
```

### In updateUI() - Soft Hand:
Add after line 554 where playerValue is set:
```javascript
elements.playerValue(i).classList.toggle('soft', hand.isSoft && hand.value <= 21)
```

### In displayResults() - Result Classes:
Modify to add result type classes:
```javascript
const resultType = result.outcome.toLowerCase().replace(' ', '-')
const resultClass = `result-${resultType === 'dealer-bust' ? 'win' : resultType}`
resultEl.classList.add(resultClass)
```

### In newRound() or startNewRound():
Clear result classes:
```javascript
for (let i = 0; i < 3; i++) {
  const resultEl = elements.handResult(i)
  if (resultEl) {
    resultEl.classList.remove('result-win', 'result-lose', 'result-push', 'result-blackjack')
  }
}
```

## Test Requirements

Create `__tests__/ui/UIEnhancements.test.js`:
- Test `.active` class applied only to activeHandIndex during PLAYER_TURN
- Test `.soft` class applied when hand is soft
- Test result classes applied correctly for each outcome type
- Test classes cleared on new round

## Files to Modify

- `js/main.js` - updateUI(), displayResults(), newRound()
- `__tests__/ui/UIEnhancements.test.js` - New test file
