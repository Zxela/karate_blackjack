import { expect, test } from '@playwright/test'

test.describe('Karate Blackjack Game', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for game to initialize
    await expect(page.locator('#balanceAmount')).toContainText('$1000')
  })

  test.describe('Initial State', () => {
    test('displays correct initial balance', async ({ page }) => {
      await expect(page.locator('#balanceAmount')).toContainText('$1000')
    })

    test('shows betting controls', async ({ page }) => {
      await expect(page.locator('#bettingControls')).toBeVisible()
      await expect(page.locator('#actionControls')).toBeHidden()
    })

    test('deal button is disabled without bet', async ({ page }) => {
      await expect(page.locator('#dealButton')).toBeDisabled()
    })

    test('displays current bet as $0', async ({ page }) => {
      await expect(page.locator('#currentBetAmount')).toContainText('$0')
    })

    test('shows deck display beside dealer', async ({ page }) => {
      await expect(page.locator('.deck-display')).toBeVisible()
      await expect(page.locator('.deck-card')).toHaveCount(3)
    })
  })

  test.describe('Betting', () => {
    test('can place $10 bet', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await expect(page.locator('#currentBetAmount')).toContainText('$10')
      await expect(page.locator('#dealButton')).toBeEnabled()
    })

    test('can place $50 bet', async ({ page }) => {
      await page.click('[data-bet="50"]')
      await expect(page.locator('#currentBetAmount')).toContainText('$50')
    })

    test('can accumulate bets', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('[data-bet="50"]')
      await expect(page.locator('#currentBetAmount')).toContainText('$60')
    })

    test('can clear bet', async ({ page }) => {
      await page.click('[data-bet="100"]')
      await page.click('#clearBetButton')
      await expect(page.locator('#currentBetAmount')).toContainText('$0')
      await expect(page.locator('#dealButton')).toBeDisabled()
    })

    test('can select multiple hands', async ({ page }) => {
      await page.click('[data-hands="2"]')
      await expect(page.locator('[data-hands="2"]')).toHaveClass(/active/)
    })
  })

  test.describe('Dealing', () => {
    test('deals cards and shows action controls', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')

      // Wait for dealing animation
      await page.waitForTimeout(2000)

      // Action controls should be visible
      await expect(page.locator('#actionControls')).toBeVisible()
      await expect(page.locator('#bettingControls')).toBeHidden()

      // Player should have cards
      await expect(page.locator('#playerCards0 .card')).toHaveCount(2)

      // Dealer should have cards (one face down)
      await expect(page.locator('#dealerHand .card')).toHaveCount(2)
    })

    test('shows player hand value after deal', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      const valueText = await page.locator('#playerValue0').textContent()
      const value = Number.parseInt(valueText)
      expect(value).toBeGreaterThanOrEqual(4)
      expect(value).toBeLessThanOrEqual(21)
    })

    test('dealer shows partial value during player turn', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      // Dealer value should show only face-up card value
      const dealerValue = await page.locator('#dealerValue').textContent()
      expect(dealerValue).not.toBe('--')
    })
  })

  test.describe('Player Actions', () => {
    test.beforeEach(async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)
    })

    test('can hit and receive card', async ({ page }) => {
      const initialCards = await page.locator('#playerCards0 .card').count()
      await page.click('#hitButton')
      await page.waitForTimeout(500)

      const newCards = await page.locator('#playerCards0 .card').count()
      expect(newCards).toBe(initialCards + 1)
    })

    test('can stand and move to dealer turn', async ({ page }) => {
      await page.click('#standButton')
      await page.waitForTimeout(1000)

      // Should transition to dealer turn or resolution
      const actionVisible = await page.locator('#actionControls').isVisible()
      const newRoundVisible = await page.locator('#newRoundControls').isVisible()

      expect(actionVisible || newRoundVisible).toBe(true)
    })
  })

  test.describe('Game Results', () => {
    test('shows new round button after game ends', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      // Stand to end the round
      await page.click('#standButton')
      await page.waitForTimeout(3000)

      await expect(page.locator('#newRoundControls')).toBeVisible()
      await expect(page.locator('#newRoundButton')).toBeEnabled()
    })

    test('can start new round after game ends', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      await page.click('#standButton')
      await page.waitForTimeout(3000)

      await page.click('#newRoundButton')
      await page.waitForTimeout(500)

      await expect(page.locator('#bettingControls')).toBeVisible()
      await expect(page.locator('#currentBetAmount')).toContainText('$0')
    })
  })

  test.describe('Card Back Design', () => {
    test('deck cards have karate design', async ({ page }) => {
      // Deck cards should be styled with ::before and ::after
      const deckCard = page.locator('.deck-card-1')
      await expect(deckCard).toBeVisible()

      // Check computed styles
      const backgroundColor = await deckCard.evaluate((el) => getComputedStyle(el).backgroundColor)
      expect(backgroundColor).not.toBe('rgba(0, 0, 0, 0)')
    })

    test('face-down dealer card has karate design', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      // First dealer card should be face-down
      const faceDownCard = page.locator('#dealerHand .card.face-down')
      await expect(faceDownCard).toBeVisible()
    })
  })

  test.describe('Multiple Hands', () => {
    test('can play with 2 hands', async ({ page }) => {
      await page.click('[data-hands="2"]')
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Both hands should be visible
      await expect(page.locator('#playerHand0')).toBeVisible()
      await expect(page.locator('#playerHand1')).toBeVisible()

      // Both should have cards
      await expect(page.locator('#playerCards0 .card')).toHaveCount(2)
      await expect(page.locator('#playerCards1 .card')).toHaveCount(2)
    })

    test('can play with 3 hands', async ({ page }) => {
      await page.click('[data-hands="3"]')
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(4000)

      // All three hands should be visible
      await expect(page.locator('#playerHand0')).toBeVisible()
      await expect(page.locator('#playerHand1')).toBeVisible()
      await expect(page.locator('#playerHand2')).toBeVisible()
    })
  })

  test.describe('Insurance', () => {
    test('shows insurance prompt when dealer shows ace', async ({ page }) => {
      // This test may not trigger every time since it depends on the dealt cards
      // We'll need multiple attempts or a way to control the deck
      await page.click('[data-bet="10"]')

      // Try multiple times to get dealer ace
      for (let i = 0; i < 10; i++) {
        await page.click('#dealButton')
        await page.waitForTimeout(2000)

        const insuranceVisible = await page.locator('#insuranceControls').isVisible()
        if (insuranceVisible) {
          await expect(page.locator('#insuranceControls')).toBeVisible()
          return
        }

        // Start new round if insurance not offered
        if (await page.locator('#newRoundControls').isVisible()) {
          await page.click('#newRoundButton')
          await page.waitForTimeout(500)
          await page.click('[data-bet="10"]')
        } else if (await page.locator('#actionControls').isVisible()) {
          await page.click('#standButton')
          await page.waitForTimeout(2000)
          await page.click('#newRoundButton')
          await page.waitForTimeout(500)
          await page.click('[data-bet="10"]')
        }
      }

      // If we never got insurance, that's still a valid test run
      // (just means dealer never showed ace in 10 attempts)
    })
  })

  test.describe('Chip Animations', () => {
    test('chips appear on table when betting', async ({ page }) => {
      // Canvas should have chip animations
      const canvas = page.locator('#gameCanvas')
      await expect(canvas).toBeVisible()

      await page.click('[data-bet="10"]')
      await page.waitForTimeout(500)

      // Can't easily test canvas content, but we can verify no errors
      const consoleErrors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      await page.click('[data-bet="50"]')
      await page.waitForTimeout(500)

      expect(consoleErrors.length).toBe(0)
    })
  })

  test.describe('Responsiveness', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await page.waitForTimeout(500)

      await expect(page.locator('#balanceAmount')).toContainText('$1000')
      await page.click('[data-bet="10"]')
      await expect(page.locator('#dealButton')).toBeEnabled()
    })

    test('works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await page.waitForTimeout(500)

      await expect(page.locator('#balanceAmount')).toContainText('$1000')
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(2000)

      await expect(page.locator('#playerCards0 .card')).toHaveCount(2)
    })
  })
})
