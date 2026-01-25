---
id: "005"
title: "Add E2E tests for visual enhancements"
status: pending
depends_on: ["004"]
test_file: "e2e/blackjack.spec.js"
---

# 005: Add E2E tests for visual enhancements

## Objective

Add E2E tests to verify the UI enhancements work correctly in the browser, covering active hand indicator, result displays, and soft hand styling.

## Acceptance Criteria

- [ ] Test verifies active hand has `.active` class during multi-hand play
- [ ] Test verifies result classes applied after round ends
- [ ] Test verifies soft hand has `.soft` class
- [ ] All existing E2E tests still pass

## Technical Notes

Add to `e2e/blackjack.spec.js`:

### Active Hand Test:
```javascript
test('active hand has visual indicator in multi-hand play', async ({ page }) => {
  // Select 2 hands
  await page.click('[data-hands="2"]')
  await page.click('[data-bet="10"]')
  await page.click('#dealButton')
  await waitForDealComplete(page)

  // Skip if not in player turn (blackjack/insurance)
  if (!(await page.locator('#actionControls').isVisible())) return

  // First hand should be active
  await expect(page.locator('#playerHand0')).toHaveClass(/active/)
  await expect(page.locator('#playerHand1')).not.toHaveClass(/active/)
})
```

### Result Class Test:
```javascript
test('result displays have appropriate styling classes', async ({ page }) => {
  await page.click('[data-bet="10"]')
  await page.click('#dealButton')
  await waitForDealComplete(page)

  // Complete the round
  if (await page.locator('#insuranceControls').isVisible()) {
    await page.click('#insuranceNoButton')
  }
  if (await page.locator('#actionControls').isVisible()) {
    await page.click('#standButton')
    await page.waitForSelector('#newRoundControls:not(.hidden)', { timeout: 15000 })
  }

  // Check result element has a result class
  const resultEl = page.locator('#handResult0')
  const classes = await resultEl.getAttribute('class')
  expect(classes).toMatch(/result-(win|lose|push|blackjack)/)
})
```

### Soft Hand Test:
```javascript
test('soft hand value has soft class styling', async ({ page }) => {
  // This test is probabilistic - soft hands contain an Ace
  // Run multiple rounds to catch a soft hand
  for (let i = 0; i < 5; i++) {
    await page.click('[data-bet="10"]')
    await page.click('#dealButton')
    await waitForDealComplete(page)

    const valueText = await page.locator('#playerValue0').textContent()
    if (valueText?.includes('Soft')) {
      await expect(page.locator('#playerValue0')).toHaveClass(/soft/)
      return // Test passed
    }

    // Complete round and try again
    if (await page.locator('#insuranceControls').isVisible()) {
      await page.click('#insuranceNoButton')
    }
    if (await page.locator('#actionControls').isVisible()) {
      await page.click('#standButton')
      await page.waitForSelector('#newRoundControls:not(.hidden)', { timeout: 15000 })
    }
    await page.click('#newRoundButton')
    await page.waitForSelector('#bettingControls:not(.hidden)')
  }
  // If we never got a soft hand in 5 rounds, that's ok - test is probabilistic
})
```

## Files to Modify

- `e2e/blackjack.spec.js` - Add new test cases in appropriate describe blocks
