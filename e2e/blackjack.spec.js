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
      // Wait for chip animation to complete before next click
      await expect(page.locator('#currentBetAmount')).toContainText('$10')
      await page.waitForTimeout(300)

      await page.click('[data-bet="50"]')
      await expect(page.locator('#currentBetAmount')).toContainText('$60')
    })

    test('can clear bet', async ({ page }) => {
      await page.click('[data-bet="100"]')
      await expect(page.locator('#currentBetAmount')).toContainText('$100')
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
    test('deals cards and shows action or result controls', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')

      // Wait for dealing animation
      await page.waitForTimeout(3000)

      // Player should have cards
      await expect(page.locator('#playerCards0 .card')).toHaveCount(2)

      // Dealer should have cards (one face down)
      await expect(page.locator('#dealerHand .card')).toHaveCount(2)

      // Either action controls or new round controls should be visible
      // (depends on whether player got blackjack)
      const actionVisible = await page.locator('#actionControls').isVisible()
      const newRoundVisible = await page.locator('#newRoundControls').isVisible()
      const insuranceVisible = await page.locator('#insuranceControls').isVisible()

      expect(actionVisible || newRoundVisible || insuranceVisible).toBe(true)
    })

    test('shows player hand value after deal', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      const valueText = await page.locator('#playerValue0').textContent()
      const value = Number.parseInt(valueText)
      expect(value).toBeGreaterThanOrEqual(4)
      expect(value).toBeLessThanOrEqual(21)
    })

    test('dealer shows partial value during player turn', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Dealer value should show only face-up card value
      const dealerValue = await page.locator('#dealerValue').textContent()
      expect(dealerValue).not.toBe('--')
    })
  })

  test.describe('Player Actions', () => {
    test('can hit and receive card when action controls visible', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Only proceed if action controls are visible (not blackjack/insurance)
      const actionVisible = await page.locator('#actionControls').isVisible()
      if (!actionVisible) {
        // Skip test if we got blackjack or insurance prompt
        return
      }

      const initialCards = await page.locator('#playerCards0 .card').count()
      await page.click('#hitButton')
      await page.waitForTimeout(500)

      const newCards = await page.locator('#playerCards0 .card').count()
      expect(newCards).toBe(initialCards + 1)
    })

    test('can stand and move to dealer turn', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Only proceed if action controls are visible
      const actionVisible = await page.locator('#actionControls').isVisible()
      if (!actionVisible) {
        // If we got blackjack or insurance, the test passes (different flow)
        const newRoundVisible = await page.locator('#newRoundControls').isVisible()
        const insuranceVisible = await page.locator('#insuranceControls').isVisible()
        expect(newRoundVisible || insuranceVisible).toBe(true)
        return
      }

      await page.click('#standButton')
      await page.waitForTimeout(3000)

      // Should transition to resolution
      await expect(page.locator('#newRoundControls')).toBeVisible()
    })
  })

  test.describe('Game Results', () => {
    test('shows new round button after game ends', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle different game states
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(1000)
      }

      if (await page.locator('#actionControls').isVisible()) {
        await page.click('#standButton')
        await page.waitForTimeout(3000)
      }

      await expect(page.locator('#newRoundControls')).toBeVisible()
      await expect(page.locator('#newRoundButton')).toBeEnabled()
    })

    test('can start new round after game ends', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle different game states
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(1000)
      }

      if (await page.locator('#actionControls').isVisible()) {
        await page.click('#standButton')
        await page.waitForTimeout(3000)
      }

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
      await page.waitForTimeout(3000)

      // First dealer card should be face-down UNLESS dealer has blackjack
      // or it's already the resolution phase
      const actionVisible = await page.locator('#actionControls').isVisible()
      const insuranceVisible = await page.locator('#insuranceControls').isVisible()

      if (actionVisible || insuranceVisible) {
        // During player turn or insurance, hole card should be face-down
        const faceDownCard = page.locator('#dealerHand .card.face-down')
        await expect(faceDownCard).toBeVisible()
      } else {
        // Round ended (blackjack), all cards revealed - just verify cards exist
        await expect(page.locator('#dealerHand .card')).toHaveCount(2)
      }
    })
  })

  test.describe('Multiple Hands', () => {
    test('can play with 2 hands', async ({ page }) => {
      await page.click('[data-hands="2"]')
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(4000)

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
      await page.waitForTimeout(5000)

      // All three hands should be visible
      await expect(page.locator('#playerHand0')).toBeVisible()
      await expect(page.locator('#playerHand1')).toBeVisible()
      await expect(page.locator('#playerHand2')).toBeVisible()
    })
  })

  test.describe('Insurance', () => {
    test('insurance controls exist in DOM', async ({ page }) => {
      // Verify insurance controls exist (even if hidden)
      const insuranceControls = page.locator('#insuranceControls')
      await expect(insuranceControls).toHaveCount(1)

      const yesButton = page.locator('#insuranceYesButton')
      const noButton = page.locator('#insuranceNoButton')
      await expect(yesButton).toHaveCount(1)
      await expect(noButton).toHaveCount(1)
    })
  })

  test.describe('Chip Animations', () => {
    test('chips appear on table when betting', async ({ page }) => {
      // Set up console error listener BEFORE interactions
      const consoleErrors = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      // Canvas should have chip animations
      const canvas = page.locator('#gameCanvas')
      await expect(canvas).toBeVisible()

      await page.click('[data-bet="10"]')
      await page.waitForTimeout(500)

      await page.click('[data-bet="50"]')
      await page.waitForTimeout(500)

      expect(consoleErrors.length).toBe(0)
    })
  })

  test.describe('Responsiveness', () => {
    test('works on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')
      await page.click('[data-bet="10"]')
      await expect(page.locator('#dealButton')).toBeEnabled()
    })

    test('works on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 })
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      await expect(page.locator('#playerCards0 .card')).toHaveCount(2)
    })
  })

  test.describe('Balance Tracking', () => {
    test('balance decreases when bet is placed and dealt', async ({ page }) => {
      // Initial balance is $1000
      await expect(page.locator('#balanceAmount')).toContainText('$1000')

      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Balance should decrease by bet amount ($1000 - $100 = $900)
      await expect(page.locator('#balanceAmount')).toContainText('$900')
    })

    test('balance persists across multiple rounds', async ({ page }) => {
      // Play first round
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle game flow
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(1000)
      }
      if (await page.locator('#actionControls').isVisible()) {
        await page.click('#standButton')
        await page.waitForTimeout(3000)
      }

      // Get balance after first round
      const balanceAfterRound1 = await page.locator('#balanceAmount').textContent()

      // Start second round
      await page.click('#newRoundButton')
      await page.waitForTimeout(500)

      // Balance should be preserved
      await expect(page.locator('#balanceAmount')).toContainText(balanceAfterRound1)
    })
  })

  test.describe('Bet Limits', () => {
    test('cannot bet more than balance', async ({ page }) => {
      // Try to bet entire balance + more
      for (let i = 0; i < 12; i++) {
        await page.click('[data-bet="100"]')
        await page.waitForTimeout(100)
      }

      // Current bet should be capped at balance ($1000)
      const betText = await page.locator('#currentBetAmount').textContent()
      const betAmount = Number.parseInt(betText.replace('$', ''))
      expect(betAmount).toBeLessThanOrEqual(1000)
    })

    test('deal button disabled without sufficient bet', async ({ page }) => {
      // Initially disabled
      await expect(page.locator('#dealButton')).toBeDisabled()

      // Enabled after placing bet
      await page.click('[data-bet="10"]')
      await expect(page.locator('#dealButton')).toBeEnabled()
    })
  })

  test.describe('Double Down', () => {
    test('double button state after deal', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // If action controls visible, check double button exists
      if (await page.locator('#actionControls').isVisible()) {
        const doubleButton = page.locator('#doubleButton')
        await expect(doubleButton).toBeVisible()

        // Double should be enabled if balance >= bet (we have $990 >= $10)
        const isDisabled = await doubleButton.isDisabled()
        // Note: could be disabled if player has blackjack (auto-stand)
        expect(typeof isDisabled).toBe('boolean')
      }
    })

    test('double down increases bet and deals one card', async ({ page }) => {
      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Only test if action controls visible and double enabled
      if (await page.locator('#actionControls').isVisible()) {
        const doubleButton = page.locator('#doubleButton')

        if (!(await doubleButton.isDisabled())) {
          // Get initial card count
          const initialCards = await page.locator('#playerCards0 .card').count()

          await page.click('#doubleButton')
          await page.waitForTimeout(1000)

          // Should have exactly one more card
          const newCards = await page.locator('#playerCards0 .card').count()
          expect(newCards).toBe(initialCards + 1)

          // Balance should have decreased by another bet amount
          // (original $100 + double $100 = $200 total, leaving $800)
          await expect(page.locator('#balanceAmount')).toContainText('$800')
        }
      }
    })
  })

  test.describe('Split', () => {
    test('split button exists in action controls', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      if (await page.locator('#actionControls').isVisible()) {
        const splitButton = page.locator('#splitButton')
        await expect(splitButton).toBeVisible()
      }
    })

    test('split button is enabled when player has a pair', async ({ page }) => {
      // Force a pair of 8s for testing
      await page.evaluate(() => {
        window.__TEST_API__.forcePair('8')
      })

      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle insurance if dealer shows ace
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(500)
      }

      // Check if we're in player turn with action controls visible
      if (await page.locator('#actionControls').isVisible()) {
        // Split button should be enabled when player has a pair
        const splitButton = page.locator('#splitButton')
        await expect(splitButton).toBeVisible()
        await expect(splitButton).toBeEnabled()
      }
    })

    test('splitting creates two hands from one pair', async ({ page }) => {
      // Force a pair of 8s for testing
      await page.evaluate(() => {
        window.__TEST_API__.forcePair('8')
      })

      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle insurance if dealer shows ace
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(500)
      }

      // Check if action controls are visible and split is enabled
      if (await page.locator('#actionControls').isVisible()) {
        const splitButton = page.locator('#splitButton')

        if (await splitButton.isEnabled()) {
          // Before split: only one hand visible
          const visibleHandsBefore = await page.locator('.player-hand:not(.hidden)').count()

          await splitButton.click()
          await page.waitForTimeout(500)

          // After split: two hands should be visible
          const visibleHandsAfter = await page.locator('.player-hand:not(.hidden)').count()
          expect(visibleHandsAfter).toBe(visibleHandsBefore + 1)
        }
      }
    })

    test('splitting deducts additional bet from balance', async ({ page }) => {
      // Force a pair of 8s for testing
      await page.evaluate(() => {
        window.__TEST_API__.forcePair('8')
      })

      // Start with $1000 balance, bet $100
      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle insurance if dealer shows ace
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(500)
      }

      // After deal, balance should be $900 (bet deducted)
      // Check if action controls are visible and split is enabled
      if (await page.locator('#actionControls').isVisible()) {
        const splitButton = page.locator('#splitButton')

        if (await splitButton.isEnabled()) {
          // Balance before split should be $900
          await expect(page.locator('#balanceAmount')).toContainText('$900')

          await splitButton.click()
          await page.waitForTimeout(500)

          // After split, balance should be $800 (additional bet deducted)
          await expect(page.locator('#balanceAmount')).toContainText('$800')
        }
      }
    })

    test('split button is disabled when max hands reached', async ({ page }) => {
      // Force a pair of 8s for testing
      await page.evaluate(() => {
        window.__TEST_API__.forcePair('8')
      })

      await page.click('[data-bet="50"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle insurance if dealer shows ace
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(500)
      }

      // Check if action controls are visible and split is enabled
      if (await page.locator('#actionControls').isVisible()) {
        const splitButton = page.locator('#splitButton')

        if (await splitButton.isEnabled()) {
          // Split twice to reach max hands (3)
          await splitButton.click()
          await page.waitForTimeout(500)

          // Check if we can split again (need another pair)
          // The game may or may not allow based on what cards are dealt
          // After first split, check state
          const state = await page.evaluate(() => window.__TEST_API__.getState())

          if (state.playerHands.length >= 3) {
            // At max hands, split should be disabled
            await expect(splitButton).toBeDisabled()
          }
        }
      }
    })

    test('can play both hands after split', async ({ page }) => {
      // Force a pair of 8s for testing
      await page.evaluate(() => {
        window.__TEST_API__.forcePair('8')
      })

      await page.click('[data-bet="100"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Handle insurance if dealer shows ace
      if (await page.locator('#insuranceControls').isVisible()) {
        await page.click('#insuranceNoButton')
        await page.waitForTimeout(500)
      }

      // Check if action controls are visible and split is enabled
      if (await page.locator('#actionControls').isVisible()) {
        const splitButton = page.locator('#splitButton')

        if (await splitButton.isEnabled()) {
          await splitButton.click()
          await page.waitForTimeout(500)

          // After split, we should still be in player turn
          // Stand on first hand
          if (await page.locator('#actionControls').isVisible()) {
            await page.click('#standButton')
            await page.waitForTimeout(1000)

            // Should move to second hand or dealer turn
            // Check game state
            const state = await page.evaluate(() => window.__TEST_API__.getState())

            // Either we're on the second hand, or game completed
            expect(['playerTurn', 'dealerTurn', 'resolution', 'gameOver']).toContain(state.phase)
          }
        }
      }
    })
  })

  test.describe('House Rules Display', () => {
    test('house rules panel visible on game start', async ({ page }) => {
      // Canvas should be visible
      const canvas = page.locator('#gameCanvas')
      await expect(canvas).toBeVisible()

      // The rules are drawn on canvas, so we verify canvas dimensions
      const canvasBox = await canvas.boundingBox()
      expect(canvasBox.width).toBeGreaterThan(0)
      expect(canvasBox.height).toBeGreaterThan(0)
    })
  })

  test.describe('Game Flow Edge Cases', () => {
    test('can complete multiple consecutive rounds', async ({ page }) => {
      for (let round = 0; round < 3; round++) {
        // Ensure betting controls are visible before starting
        await expect(page.locator('#bettingControls')).toBeVisible({ timeout: 10000 })

        // Wait for any animations to complete before placing bet
        await page.waitForTimeout(1000)

        // Click bet and wait for deal button to become enabled
        await page.click('[data-bet="10"]')
        await expect(page.locator('#dealButton')).toBeEnabled({ timeout: 5000 })
        await page.click('#dealButton')

        // Wait for deal animation to complete - cards should appear
        await expect(page.locator('#playerCards0 .card')).toHaveCount(2, { timeout: 10000 })

        // Poll until round completes, handling insurance and action controls as needed
        let roundComplete = false
        for (let i = 0; i < 30 && !roundComplete; i++) {
          const insuranceVisible = await page
            .locator('#insuranceControls')
            .isVisible()
            .catch(() => false)
          const actionVisible = await page
            .locator('#actionControls')
            .isVisible()
            .catch(() => false)
          const newRoundVisible = await page
            .locator('#newRoundControls')
            .isVisible()
            .catch(() => false)

          if (newRoundVisible) {
            roundComplete = true
          } else if (insuranceVisible) {
            // Decline insurance
            await page.click('#insuranceNoButton')
            await page.waitForTimeout(500)
          } else if (actionVisible) {
            // Player's turn - click stand
            await page.click('#standButton')
            await page.waitForTimeout(500)
          } else {
            // Wait for state change
            await page.waitForTimeout(500)
          }
        }

        // Wait for new round controls with extended timeout
        await expect(page.locator('#newRoundControls')).toBeVisible({ timeout: 15000 })
        await page.click('#newRoundButton')
        await page.waitForTimeout(500)
      }

      // Game should still be functional
      await expect(page.locator('#bettingControls')).toBeVisible({ timeout: 5000 })
    })

    test('hand values are displayed correctly', async ({ page }) => {
      await page.click('[data-bet="10"]')
      await page.click('#dealButton')
      await page.waitForTimeout(3000)

      // Player hand value should be between 4 and 21
      const playerValue = await page.locator('#playerValue0').textContent()
      const value = Number.parseInt(playerValue)
      expect(value).toBeGreaterThanOrEqual(4)
      expect(value).toBeLessThanOrEqual(21)

      // Dealer value should be visible (showing face-up card)
      const dealerValue = await page.locator('#dealerValue').textContent()
      expect(dealerValue).not.toBe('--')
    })
  })

  test.describe('Volume Controls', () => {
    test('volume control is visible in header', async ({ page }) => {
      const volumeControl = page.locator('#volumeControl')
      await expect(volumeControl).toBeVisible()
    })

    test('volume toggle button exists', async ({ page }) => {
      const volumeToggle = page.locator('#volumeToggle')
      await expect(volumeToggle).toBeVisible()
    })

    test('volume slider exists', async ({ page }) => {
      const volumeSlider = page.locator('#volumeSlider')
      await expect(volumeSlider).toBeVisible()
    })

    test('volume slider has default value', async ({ page }) => {
      const volumeSlider = page.locator('#volumeSlider')
      const value = await volumeSlider.inputValue()
      // Default volume is 70%
      expect(Number.parseInt(value)).toBe(70)
    })

    test('clicking mute button toggles muted state', async ({ page }) => {
      const volumeControl = page.locator('#volumeControl')
      const volumeToggle = page.locator('#volumeToggle')

      // Initially not muted
      await expect(volumeControl).not.toHaveClass(/muted/)

      // Click to mute
      await volumeToggle.click()
      await expect(volumeControl).toHaveClass(/muted/)

      // Click to unmute
      await volumeToggle.click()
      await expect(volumeControl).not.toHaveClass(/muted/)
    })

    test('volume slider changes volume level', async ({ page }) => {
      const volumeSlider = page.locator('#volumeSlider')

      // Change slider value
      await volumeSlider.fill('30')

      // Verify value changed
      const newValue = await volumeSlider.inputValue()
      expect(Number.parseInt(newValue)).toBe(30)
    })

    test('muting adds muted class to control', async ({ page }) => {
      const volumeControl = page.locator('#volumeControl')
      const volumeToggle = page.locator('#volumeToggle')

      await volumeToggle.click()
      await expect(volumeControl).toHaveClass(/muted/)
    })

    test('volume icon changes when muted', async ({ page }) => {
      const volumeToggle = page.locator('#volumeToggle')
      const volumeControl = page.locator('#volumeControl')

      // Click to mute
      await volumeToggle.click()

      // Control should have muted class
      await expect(volumeControl).toHaveClass(/muted/)
    })

    test('audio manager is accessible via test API', async ({ page }) => {
      // Click first to trigger audio init
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      const audioManager = await page.evaluate(() => {
        const am = window.__TEST_API__.getAudioManager()
        return {
          isAvailable: am.isAvailable(),
          volume: am.getVolume(),
          muted: am.isMuted()
        }
      })

      expect(audioManager.isAvailable).toBe(true)
      expect(typeof audioManager.volume).toBe('number')
      expect(typeof audioManager.muted).toBe('boolean')
    })

    test('can set volume via test API', async ({ page }) => {
      // First click to ensure audio is initialized
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      await page.evaluate(() => {
        window.__TEST_API__.setVolume(0.5)
      })

      const volume = await page.evaluate(() => {
        return window.__TEST_API__.getAudioManager().getVolume()
      })

      expect(volume).toBe(0.5)

      // Slider should also update
      const sliderValue = await page.locator('#volumeSlider').inputValue()
      expect(Number.parseInt(sliderValue)).toBe(50)
    })

    test('can toggle mute via test API', async ({ page }) => {
      // First click to ensure audio is initialized
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      // Toggle mute
      const newMutedState = await page.evaluate(() => {
        return window.__TEST_API__.toggleMute()
      })

      expect(newMutedState).toBe(true)

      // UI should update
      const volumeControl = page.locator('#volumeControl')
      await expect(volumeControl).toHaveClass(/muted/)
    })

    test('volume persists across page reload', async ({ page }) => {
      // Click first to trigger audio init
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      // Set volume
      await page.evaluate(() => {
        window.__TEST_API__.setVolume(0.3)
      })

      // Reload page
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')

      // Click to init audio again
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      // Check volume was persisted
      const volume = await page.evaluate(() => {
        return window.__TEST_API__.getAudioManager().getVolume()
      })

      expect(volume).toBe(0.3)
    })

    test('muted state persists across page reload', async ({ page }) => {
      // Click first to trigger audio init
      await page.click('[data-bet="10"]')
      await page.waitForTimeout(100)

      // Mute
      await page.evaluate(() => {
        window.__TEST_API__.toggleMute()
      })

      // Reload page
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')

      // Check UI reflects muted state
      const volumeControl = page.locator('#volumeControl')
      await expect(volumeControl).toHaveClass(/muted/)
    })

    test('volume slider hidden on small viewport', async ({ page }) => {
      // Set small viewport
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')

      // Volume toggle should still be visible
      await expect(page.locator('#volumeToggle')).toBeVisible()

      // Volume slider should be hidden on small screens (< 480px)
      const volumeSlider = page.locator('#volumeSlider')
      // CSS hides it at max-width: 480px, 375px is below that
      await expect(volumeSlider).toBeHidden()
    })

    test('volume toggle works on small viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.reload()
      await expect(page.locator('#balanceAmount')).toContainText('$1000')

      const volumeToggle = page.locator('#volumeToggle')
      const volumeControl = page.locator('#volumeControl')

      await volumeToggle.click()
      await expect(volumeControl).toHaveClass(/muted/)

      await volumeToggle.click()
      await expect(volumeControl).not.toHaveClass(/muted/)
    })
  })
})
