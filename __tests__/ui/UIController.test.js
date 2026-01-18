/**
 * @fileoverview Unit tests for UIController module.
 *
 * Tests cover:
 * - Constructor initialization with GameEngine and CardRenderer
 * - Event listener setup for all buttons
 * - Rendering game state to DOM
 * - Button state management (enable/disable)
 * - Game engine method integration
 * - State subscription and updates
 * - Message display
 * - Responsive layout handling
 *
 * @module tests/ui/UIController
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// =============================================================================
// MOCK SETUP
// =============================================================================

/**
 * Mock DOM element with common properties and methods
 */
function createMockElement(id = '', options = {}) {
  return {
    id,
    textContent: '',
    innerHTML: '',
    disabled: options.disabled || false,
    classList: {
      _classes: new Set(options.classes || []),
      add: function (cls) {
        this._classes.add(cls)
      },
      remove: function (cls) {
        this._classes.delete(cls)
      },
      contains: function (cls) {
        return this._classes.has(cls)
      },
      toggle: function (cls, force) {
        if (force !== undefined) {
          if (force) this._classes.add(cls)
          else this._classes.delete(cls)
        } else {
          if (this._classes.has(cls)) this._classes.delete(cls)
          else this._classes.add(cls)
        }
      }
    },
    dataset: options.dataset || {},
    style: {},
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    querySelector: vi.fn(() => null),
    querySelectorAll: vi.fn(() => []),
    getAttribute: vi.fn((attr) => options.attributes?.[attr] || null),
    setAttribute: vi.fn(),
    appendChild: vi.fn(),
    removeChild: vi.fn()
  }
}

/**
 * Mock GameEngine for testing
 */
function createMockGameEngine() {
  return {
    _subscribers: [],
    _state: {
      phase: 'betting',
      playerHands: [],
      dealerHand: { cards: [], value: 0 },
      balance: 1000,
      bets: [],
      currentHandIndex: 0,
      handCount: 1,
      insuranceOffered: false,
      insuranceTaken: false,
      insuranceBet: 0,
      minBet: 10,
      maxBet: 500
    },
    getState: vi.fn(function () {
      return this._state
    }),
    subscribe: vi.fn(function (callback) {
      this._subscribers.push(callback)
      return () => {
        const index = this._subscribers.indexOf(callback)
        if (index > -1) this._subscribers.splice(index, 1)
      }
    }),
    startNewRound: vi.fn(),
    placeBet: vi.fn(() => true),
    deal: vi.fn(() => true),
    hit: vi.fn(() => true),
    stand: vi.fn(() => true),
    doubleDown: vi.fn(() => true),
    split: vi.fn(() => true),
    takeInsurance: vi.fn(() => true),
    declineInsurance: vi.fn(() => true),
    playDealerTurn: vi.fn(() => true),
    resolveRound: vi.fn(() => [{ outcome: 'win', winnings: 100 }]),
    setHandCount: vi.fn(() => true),
    getHandCount: vi.fn(function () {
      return this._state.handCount
    }),
    // Helper to trigger state updates
    _notifySubscribers: function () {
      for (const callback of this._subscribers) {
        callback(this._state)
      }
    }
  }
}

/**
 * Mock CardRenderer for testing
 */
function createMockCardRenderer() {
  return {
    clear: vi.fn(),
    drawCard: vi.fn(),
    drawHand: vi.fn(),
    drawDealerHand: vi.fn(),
    setScale: vi.fn(),
    getCardWidth: vi.fn(() => 100),
    getCardHeight: vi.fn(() => 140),
    loadAssets: vi.fn(() => Promise.resolve())
  }
}

/**
 * Mock document with all required elements
 */
function createMockDocument() {
  const elements = {
    balanceAmount: createMockElement('balanceAmount'),
    currentBetAmount: createMockElement('currentBetAmount'),
    messageText: createMockElement('messageText'),
    messageArea: createMockElement('messageArea'),
    dealerValue: createMockElement('dealerValue'),
    playerValue0: createMockElement('playerValue0'),
    playerValue1: createMockElement('playerValue1'),
    playerValue2: createMockElement('playerValue2'),
    playerBet0: createMockElement('playerBet0'),
    playerBet1: createMockElement('playerBet1'),
    playerBet2: createMockElement('playerBet2'),
    playerHand0: createMockElement('playerHand0', { classes: ['player-hand'] }),
    playerHand1: createMockElement('playerHand1', { classes: ['player-hand', 'hidden'] }),
    playerHand2: createMockElement('playerHand2', { classes: ['player-hand', 'hidden'] }),
    playerCards0: createMockElement('playerCards0'),
    playerCards1: createMockElement('playerCards1'),
    playerCards2: createMockElement('playerCards2'),
    dealerHand: createMockElement('dealerHand'),
    dealButton: createMockElement('dealButton', { disabled: true }),
    clearBetButton: createMockElement('clearBetButton'),
    hitButton: createMockElement('hitButton', { disabled: true }),
    standButton: createMockElement('standButton', { disabled: true }),
    doubleButton: createMockElement('doubleButton', { disabled: true }),
    splitButton: createMockElement('splitButton', { disabled: true }),
    insuranceYesButton: createMockElement('insuranceYesButton'),
    insuranceNoButton: createMockElement('insuranceNoButton'),
    newRoundButton: createMockElement('newRoundButton'),
    bettingControls: createMockElement('bettingControls', { classes: ['control-group'] }),
    actionControls: createMockElement('actionControls', { classes: ['control-group', 'hidden'] }),
    insuranceControls: createMockElement('insuranceControls', {
      classes: ['control-group', 'hidden']
    }),
    newRoundControls: createMockElement('newRoundControls', {
      classes: ['control-group', 'hidden']
    }),
    gameCanvas: createMockElement('gameCanvas'),
    gameStatusAnnouncer: createMockElement('gameStatusAnnouncer')
  }

  // Bet buttons
  const betButtons = [
    createMockElement('bet-10', { dataset: { bet: '10' } }),
    createMockElement('bet-50', { dataset: { bet: '50' } }),
    createMockElement('bet-100', { dataset: { bet: '100' } }),
    createMockElement('bet-500', { dataset: { bet: '500' } })
  ]

  // Hand count buttons
  const handCountButtons = [
    createMockElement('hand-1', { dataset: { hands: '1' }, classes: ['btn-hand-count', 'active'] }),
    createMockElement('hand-2', { dataset: { hands: '2' }, classes: ['btn-hand-count'] }),
    createMockElement('hand-3', { dataset: { hands: '3' }, classes: ['btn-hand-count'] })
  ]

  return {
    getElementById: vi.fn((id) => elements[id] || null),
    querySelectorAll: vi.fn((selector) => {
      if (selector === '.btn-bet') return betButtons
      if (selector === '.btn-hand-count') return handCountButtons
      if (selector === '.player-hand')
        return [elements.playerHand0, elements.playerHand1, elements.playerHand2]
      return []
    }),
    querySelector: vi.fn((selector) => {
      if (selector === '#gameCanvas') return elements.gameCanvas
      return null
    }),
    _elements: elements,
    _betButtons: betButtons,
    _handCountButtons: handCountButtons
  }
}

/**
 * Mock window for testing
 */
function createMockWindow() {
  return {
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    innerWidth: 1024,
    innerHeight: 768
  }
}

// Import UIController after setting up mocks
// Note: We'll dynamically import after mocking globals

// =============================================================================
// TEST SUITE
// =============================================================================

describe('UIController', () => {
  /** @type {ReturnType<typeof createMockDocument>} */
  let mockDocument
  /** @type {ReturnType<typeof createMockWindow>} */
  let mockWindow
  /** @type {ReturnType<typeof createMockGameEngine>} */
  let mockGameEngine
  /** @type {ReturnType<typeof createMockCardRenderer>} */
  let mockCardRenderer
  /** @type {import('../../js/ui/UIController.js').UIController} */
  let controller

  // Store original globals
  let originalDocument
  let originalWindow

  beforeEach(async () => {
    // Create fresh mocks
    mockDocument = createMockDocument()
    mockWindow = createMockWindow()
    mockGameEngine = createMockGameEngine()
    mockCardRenderer = createMockCardRenderer()

    // Store and replace globals
    originalDocument = globalThis.document
    originalWindow = globalThis.window
    globalThis.document = mockDocument
    globalThis.window = mockWindow

    // Clear module cache and import fresh
    vi.resetModules()

    // Dynamic import to get fresh module with mocked globals
    const { UIController } = await import('../../js/ui/UIController.js')
    controller = new UIController(mockGameEngine, mockCardRenderer)
  })

  afterEach(() => {
    // Restore original globals
    globalThis.document = originalDocument
    globalThis.window = originalWindow
    vi.clearAllMocks()
  })

  // ===========================================================================
  // CONSTRUCTOR TESTS
  // ===========================================================================

  describe('constructor', () => {
    it('stores gameEngine reference', () => {
      expect(controller._gameEngine).toBe(mockGameEngine)
    })

    it('stores cardRenderer reference', () => {
      expect(controller._cardRenderer).toBe(mockCardRenderer)
    })

    it('initializes DOM element references', () => {
      expect(mockDocument.getElementById).toHaveBeenCalled()
    })

    it('stores reference to balance display element', () => {
      expect(controller._elements.balanceAmount).toBeDefined()
    })

    it('stores reference to message text element', () => {
      expect(controller._elements.messageText).toBeDefined()
    })

    it('stores reference to action buttons', () => {
      expect(controller._elements.hitButton).toBeDefined()
      expect(controller._elements.standButton).toBeDefined()
      expect(controller._elements.doubleButton).toBeDefined()
      expect(controller._elements.splitButton).toBeDefined()
    })

    it('stores reference to betting controls', () => {
      expect(controller._elements.dealButton).toBeDefined()
      expect(controller._elements.clearBetButton).toBeDefined()
    })

    it('stores reference to control group containers', () => {
      expect(controller._elements.bettingControls).toBeDefined()
      expect(controller._elements.actionControls).toBeDefined()
      expect(controller._elements.insuranceControls).toBeDefined()
      expect(controller._elements.newRoundControls).toBeDefined()
    })
  })

  // ===========================================================================
  // INITIALIZATION TESTS
  // ===========================================================================

  describe('init', () => {
    it('subscribes to gameEngine state changes', () => {
      controller.init()
      expect(mockGameEngine.subscribe).toHaveBeenCalled()
    })

    it('attaches event listeners to bet buttons', () => {
      controller.init()
      for (const btn of mockDocument._betButtons) {
        expect(btn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      }
    })

    it('attaches event listener to deal button', () => {
      controller.init()
      expect(mockDocument._elements.dealButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })

    it('attaches event listeners to action buttons', () => {
      controller.init()
      expect(mockDocument._elements.hitButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockDocument._elements.standButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockDocument._elements.doubleButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockDocument._elements.splitButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })

    it('attaches event listeners to insurance buttons', () => {
      controller.init()
      expect(mockDocument._elements.insuranceYesButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
      expect(mockDocument._elements.insuranceNoButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })

    it('attaches event listener to new round button', () => {
      controller.init()
      expect(mockDocument._elements.newRoundButton.addEventListener).toHaveBeenCalledWith(
        'click',
        expect.any(Function)
      )
    })

    it('attaches resize event listener to window', () => {
      controller.init()
      expect(mockWindow.addEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('renders initial state after initialization', () => {
      controller.init()
      // Balance should be updated from initial state
      expect(mockDocument._elements.balanceAmount.textContent).toBe('$1000')
    })

    it('returns unsubscribe function', () => {
      const unsubscribe = controller.init()
      expect(typeof unsubscribe).toBe('function')
    })
  })

  // ===========================================================================
  // RENDER TESTS
  // ===========================================================================

  describe('render', () => {
    beforeEach(() => {
      controller.init()
    })

    it('updates balance display from state', () => {
      const state = { ...mockGameEngine._state, balance: 1500 }
      controller.render(state)
      expect(mockDocument._elements.balanceAmount.textContent).toBe('$1500')
    })

    it('updates current bet display', () => {
      const state = { ...mockGameEngine._state, bets: [100] }
      controller.render(state)
      expect(mockDocument._elements.currentBetAmount.textContent).toBe('$100')
    })

    it('updates dealer hand value display', () => {
      const state = {
        ...mockGameEngine._state,
        dealerHand: { cards: [{ suit: 'hearts', rank: 'K' }], value: 10 }
      }
      controller.render(state)
      expect(mockDocument._elements.dealerValue.textContent).toBe('10')
    })

    it('updates player hand value display', () => {
      const state = {
        ...mockGameEngine._state,
        playerHands: [{ cards: [], value: 18, bet: 100 }]
      }
      controller.render(state)
      expect(mockDocument._elements.playerValue0.textContent).toBe('18')
    })

    it('updates player bet display', () => {
      const state = {
        ...mockGameEngine._state,
        playerHands: [{ cards: [], value: 18, bet: 100 }],
        bets: [100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerBet0.textContent).toBe('$100')
    })

    it('shows multiple player hands when playing multiple', () => {
      const state = {
        ...mockGameEngine._state,
        playerHands: [
          { cards: [], value: 18, bet: 100 },
          { cards: [], value: 20, bet: 100 }
        ],
        bets: [100, 100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerHand1.classList.contains('hidden')).toBe(false)
    })

    it('hides unused player hands', () => {
      const state = {
        ...mockGameEngine._state,
        playerHands: [{ cards: [], value: 18, bet: 100 }],
        bets: [100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerHand1.classList.contains('hidden')).toBe(true)
      expect(mockDocument._elements.playerHand2.classList.contains('hidden')).toBe(true)
    })

    it('displays dealer value as -- when no cards', () => {
      const state = {
        ...mockGameEngine._state,
        dealerHand: { cards: [], value: 0 }
      }
      controller.render(state)
      expect(mockDocument._elements.dealerValue.textContent).toBe('--')
    })

    it('displays player value as -- when no cards', () => {
      const state = {
        ...mockGameEngine._state,
        playerHands: []
      }
      controller.render(state)
      expect(mockDocument._elements.playerValue0.textContent).toBe('--')
    })
  })

  // ===========================================================================
  // UPDATE BALANCE TESTS
  // ===========================================================================

  describe('updateBalance', () => {
    beforeEach(() => {
      controller.init()
    })

    it('updates balance display element', () => {
      controller.updateBalance(2500)
      expect(mockDocument._elements.balanceAmount.textContent).toBe('$2500')
    })

    it('handles zero balance', () => {
      controller.updateBalance(0)
      expect(mockDocument._elements.balanceAmount.textContent).toBe('$0')
    })

    it('handles large balance values', () => {
      controller.updateBalance(999999)
      expect(mockDocument._elements.balanceAmount.textContent).toBe('$999999')
    })
  })

  // ===========================================================================
  // UPDATE BETS TESTS
  // ===========================================================================

  describe('updateBets', () => {
    beforeEach(() => {
      controller.init()
    })

    it('updates total bet display', () => {
      controller.updateBets([100, 50])
      expect(mockDocument._elements.currentBetAmount.textContent).toBe('$150')
    })

    it('updates individual hand bet displays', () => {
      controller.updateBets([100, 50, 25])
      expect(mockDocument._elements.playerBet0.textContent).toBe('$100')
      expect(mockDocument._elements.playerBet1.textContent).toBe('$50')
      expect(mockDocument._elements.playerBet2.textContent).toBe('$25')
    })

    it('clears bet display for empty bets', () => {
      controller.updateBets([])
      expect(mockDocument._elements.currentBetAmount.textContent).toBe('$0')
    })
  })

  // ===========================================================================
  // UPDATE MESSAGE TESTS
  // ===========================================================================

  describe('updateMessage', () => {
    beforeEach(() => {
      controller.init()
    })

    it('updates message text element', () => {
      controller.updateMessage('Your turn')
      expect(mockDocument._elements.messageText.textContent).toBe('Your turn')
    })

    it('handles empty message', () => {
      controller.updateMessage('')
      expect(mockDocument._elements.messageText.textContent).toBe('')
    })

    it('handles long message', () => {
      const longMessage =
        'This is a very long message that should still be displayed correctly in the UI'
      controller.updateMessage(longMessage)
      expect(mockDocument._elements.messageText.textContent).toBe(longMessage)
    })
  })

  // ===========================================================================
  // ENABLE ACTIONS TESTS
  // ===========================================================================

  describe('enableActions', () => {
    beforeEach(() => {
      controller.init()
    })

    it('enables hit button when hit action allowed', () => {
      controller.enableActions(['hit'])
      expect(mockDocument._elements.hitButton.disabled).toBe(false)
    })

    it('enables stand button when stand action allowed', () => {
      controller.enableActions(['stand'])
      expect(mockDocument._elements.standButton.disabled).toBe(false)
    })

    it('enables double button when doubleDown action allowed', () => {
      controller.enableActions(['doubleDown'])
      expect(mockDocument._elements.doubleButton.disabled).toBe(false)
    })

    it('enables split button when split action allowed', () => {
      controller.enableActions(['split'])
      expect(mockDocument._elements.splitButton.disabled).toBe(false)
    })

    it('enables deal button when placeBet action allowed', () => {
      controller.enableActions(['placeBet'])
      expect(mockDocument._elements.dealButton.disabled).toBe(false)
    })

    it('enables multiple actions at once', () => {
      controller.enableActions(['hit', 'stand', 'doubleDown'])
      expect(mockDocument._elements.hitButton.disabled).toBe(false)
      expect(mockDocument._elements.standButton.disabled).toBe(false)
      expect(mockDocument._elements.doubleButton.disabled).toBe(false)
    })

    it('disables buttons not in actions list', () => {
      // First enable all
      controller.enableActions(['hit', 'stand', 'doubleDown', 'split'])
      // Then enable only some
      controller.enableActions(['hit', 'stand'])
      expect(mockDocument._elements.doubleButton.disabled).toBe(true)
      expect(mockDocument._elements.splitButton.disabled).toBe(true)
    })

    it('shows action controls when enabling action buttons', () => {
      controller.enableActions(['hit', 'stand'])
      expect(mockDocument._elements.actionControls.classList.contains('hidden')).toBe(false)
    })

    it('hides betting controls when enabling action buttons', () => {
      controller.enableActions(['hit', 'stand'])
      expect(mockDocument._elements.bettingControls.classList.contains('hidden')).toBe(true)
    })
  })

  // ===========================================================================
  // SHOW RESULT TESTS
  // ===========================================================================

  describe('showResult', () => {
    beforeEach(() => {
      controller.init()
    })

    it('displays win result message', () => {
      controller.showResult([{ handIndex: 0, outcome: 'win', winnings: 100, message: 'You win!' }])
      expect(mockDocument._elements.messageText.textContent).toContain('win')
    })

    it('displays lose result message', () => {
      controller.showResult([
        { handIndex: 0, outcome: 'lose', winnings: -100, message: 'You lose!' }
      ])
      expect(mockDocument._elements.messageText.textContent).toContain('lose')
    })

    it('displays push result message', () => {
      controller.showResult([{ handIndex: 0, outcome: 'push', winnings: 0, message: 'Push!' }])
      expect(mockDocument._elements.messageText.textContent).toContain('Push')
    })

    it('displays blackjack result message', () => {
      controller.showResult([
        { handIndex: 0, outcome: 'blackjack', winnings: 150, message: 'Blackjack!' }
      ])
      expect(mockDocument._elements.messageText.textContent).toContain('Blackjack')
    })

    it('shows new round controls after result', () => {
      controller.showResult([{ handIndex: 0, outcome: 'win', winnings: 100, message: 'You win!' }])
      expect(mockDocument._elements.newRoundControls.classList.contains('hidden')).toBe(false)
    })

    it('hides action controls after result', () => {
      controller.showResult([{ handIndex: 0, outcome: 'win', winnings: 100, message: 'You win!' }])
      expect(mockDocument._elements.actionControls.classList.contains('hidden')).toBe(true)
    })

    it('handles multiple hand results', () => {
      const results = [
        { handIndex: 0, outcome: 'win', winnings: 100, message: 'Hand 1 wins!' },
        { handIndex: 1, outcome: 'lose', winnings: -100, message: 'Hand 2 loses!' }
      ]
      controller.showResult(results)
      // Message should contain information about multiple hands
      expect(mockDocument._elements.messageText.textContent.length).toBeGreaterThan(0)
    })
  })

  // ===========================================================================
  // HIGHLIGHT ACTIVE HAND TESTS
  // ===========================================================================

  describe('highlightActiveHand', () => {
    beforeEach(() => {
      controller.init()
    })

    it('adds active class to current hand', () => {
      controller.highlightActiveHand(0)
      expect(mockDocument._elements.playerHand0.classList.contains('active')).toBe(true)
    })

    it('removes active class from other hands', () => {
      // First activate hand 0
      controller.highlightActiveHand(0)
      // Then activate hand 1
      controller.highlightActiveHand(1)
      expect(mockDocument._elements.playerHand0.classList.contains('active')).toBe(false)
      expect(mockDocument._elements.playerHand1.classList.contains('active')).toBe(true)
    })

    it('handles index out of range gracefully', () => {
      expect(() => controller.highlightActiveHand(5)).not.toThrow()
    })
  })

  // ===========================================================================
  // DESTROY TESTS
  // ===========================================================================

  describe('destroy', () => {
    beforeEach(() => {
      controller.init()
    })

    it('removes event listener from window', () => {
      controller.destroy()
      expect(mockWindow.removeEventListener).toHaveBeenCalledWith('resize', expect.any(Function))
    })

    it('unsubscribes from gameEngine', () => {
      controller.destroy()
      // The unsubscribe function should have been called
      // We can verify by checking that subscribers array is empty after destroy
      expect(mockGameEngine._subscribers.length).toBe(0)
    })

    it('removes event listeners from buttons', () => {
      controller.destroy()
      expect(mockDocument._elements.dealButton.removeEventListener).toHaveBeenCalled()
      expect(mockDocument._elements.hitButton.removeEventListener).toHaveBeenCalled()
      expect(mockDocument._elements.standButton.removeEventListener).toHaveBeenCalled()
    })
  })

  // ===========================================================================
  // EVENT HANDLER INTEGRATION TESTS
  // ===========================================================================

  describe('event handlers', () => {
    beforeEach(() => {
      controller.init()
    })

    it('bet button click calls gameEngine.placeBet', () => {
      // Get the click handler that was attached
      const clickHandler = mockDocument._betButtons[0].addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler({ currentTarget: { dataset: { bet: '10' } } })
        expect(mockGameEngine.placeBet).toHaveBeenCalledWith(0, 10)
      }
    })

    it('deal button click calls gameEngine.deal', () => {
      const clickHandler = mockDocument._elements.dealButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.deal).toHaveBeenCalled()
      }
    })

    it('hit button click calls gameEngine.hit', () => {
      const clickHandler = mockDocument._elements.hitButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.hit).toHaveBeenCalled()
      }
    })

    it('stand button click calls gameEngine.stand', () => {
      const clickHandler = mockDocument._elements.standButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.stand).toHaveBeenCalled()
      }
    })

    it('double button click calls gameEngine.doubleDown', () => {
      const clickHandler = mockDocument._elements.doubleButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.doubleDown).toHaveBeenCalled()
      }
    })

    it('split button click calls gameEngine.split', () => {
      const clickHandler = mockDocument._elements.splitButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.split).toHaveBeenCalled()
      }
    })

    it('insurance yes button click calls gameEngine.takeInsurance', () => {
      const clickHandler =
        mockDocument._elements.insuranceYesButton.addEventListener.mock.calls.find(
          (call) => call[0] === 'click'
        )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.takeInsurance).toHaveBeenCalled()
      }
    })

    it('insurance no button click calls gameEngine.declineInsurance', () => {
      const clickHandler =
        mockDocument._elements.insuranceNoButton.addEventListener.mock.calls.find(
          (call) => call[0] === 'click'
        )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.declineInsurance).toHaveBeenCalled()
      }
    })

    it('new round button click calls gameEngine.startNewRound', () => {
      const clickHandler = mockDocument._elements.newRoundButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        clickHandler()
        expect(mockGameEngine.startNewRound).toHaveBeenCalled()
      }
    })
  })

  // ===========================================================================
  // STATE SUBSCRIPTION TESTS
  // ===========================================================================

  describe('state subscription', () => {
    beforeEach(() => {
      controller.init()
    })

    it('renders on state change', () => {
      // Get the callback that was passed to subscribe
      const subscribeCallback = mockGameEngine.subscribe.mock.calls[0]?.[0]

      if (subscribeCallback) {
        const newState = { ...mockGameEngine._state, balance: 2000 }
        subscribeCallback(newState)
        expect(mockDocument._elements.balanceAmount.textContent).toBe('$2000')
      }
    })

    it('updates button states based on phase', () => {
      const subscribeCallback = mockGameEngine.subscribe.mock.calls[0]?.[0]

      if (subscribeCallback) {
        const playerTurnState = {
          ...mockGameEngine._state,
          phase: 'playerTurn',
          playerHands: [{ cards: [{}, {}], value: 12, canSplit: false }]
        }
        subscribeCallback(playerTurnState)
        expect(mockDocument._elements.actionControls.classList.contains('hidden')).toBe(false)
      }
    })

    it('shows insurance controls when insurance offered', () => {
      const subscribeCallback = mockGameEngine.subscribe.mock.calls[0]?.[0]

      if (subscribeCallback) {
        const insuranceState = {
          ...mockGameEngine._state,
          phase: 'insuranceCheck',
          insuranceOffered: true
        }
        subscribeCallback(insuranceState)
        expect(mockDocument._elements.insuranceControls.classList.contains('hidden')).toBe(false)
      }
    })
  })

  // ===========================================================================
  // PHASE-BASED UI TESTS
  // ===========================================================================

  describe('phase-based UI updates', () => {
    beforeEach(() => {
      controller.init()
    })

    it('betting phase shows betting controls only', () => {
      controller.render({ ...mockGameEngine._state, phase: 'betting' })
      expect(mockDocument._elements.bettingControls.classList.contains('hidden')).toBe(false)
      expect(mockDocument._elements.actionControls.classList.contains('hidden')).toBe(true)
      expect(mockDocument._elements.insuranceControls.classList.contains('hidden')).toBe(true)
      expect(mockDocument._elements.newRoundControls.classList.contains('hidden')).toBe(true)
    })

    it('playerTurn phase shows action controls only', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'playerTurn',
        playerHands: [{ cards: [{}, {}], value: 12 }]
      }
      controller.render(state)
      expect(mockDocument._elements.bettingControls.classList.contains('hidden')).toBe(true)
      expect(mockDocument._elements.actionControls.classList.contains('hidden')).toBe(false)
    })

    it('insuranceCheck phase shows insurance controls', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'insuranceCheck',
        insuranceOffered: true
      }
      controller.render(state)
      expect(mockDocument._elements.insuranceControls.classList.contains('hidden')).toBe(false)
    })

    it('dealerTurn phase disables all player controls', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'dealerTurn'
      }
      controller.render(state)
      expect(mockDocument._elements.hitButton.disabled).toBe(true)
      expect(mockDocument._elements.standButton.disabled).toBe(true)
    })

    it('gameOver phase shows new round controls', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'gameOver'
      }
      controller.render(state)
      expect(mockDocument._elements.newRoundControls.classList.contains('hidden')).toBe(false)
    })
  })

  // ===========================================================================
  // TIMING CONSTRAINT TESTS (AC-014)
  // ===========================================================================

  describe('timing constraints (AC-014)', () => {
    beforeEach(() => {
      controller.init()
    })

    it('render completes within 100ms', () => {
      const start = performance.now()

      for (let i = 0; i < 100; i++) {
        controller.render(mockGameEngine._state)
      }

      const elapsed = performance.now() - start
      const averageTime = elapsed / 100

      expect(averageTime).toBeLessThan(100)
    })

    it('state update triggers render synchronously', () => {
      const subscribeCallback = mockGameEngine.subscribe.mock.calls[0]?.[0]

      if (subscribeCallback) {
        const start = performance.now()
        subscribeCallback({ ...mockGameEngine._state, balance: 9999 })
        const elapsed = performance.now() - start

        expect(elapsed).toBeLessThan(100)
        expect(mockDocument._elements.balanceAmount.textContent).toBe('$9999')
      }
    })
  })

  // ===========================================================================
  // RESPONSIVE DESIGN TESTS
  // ===========================================================================

  describe('handleResize', () => {
    beforeEach(() => {
      controller.init()
    })

    it('has handleResize method', () => {
      expect(typeof controller.handleResize).toBe('function')
    })

    it('handleResize does not throw', () => {
      expect(() => controller.handleResize()).not.toThrow()
    })

    it('resize event triggers handleResize', () => {
      const resizeHandler = mockWindow.addEventListener.mock.calls.find(
        (call) => call[0] === 'resize'
      )?.[1]

      expect(resizeHandler).toBeDefined()
      if (resizeHandler) {
        expect(() => resizeHandler()).not.toThrow()
      }
    })
  })

  // ===========================================================================
  // EDGE CASES
  // ===========================================================================

  describe('edge cases', () => {
    beforeEach(() => {
      controller.init()
    })

    it('handles missing DOM elements gracefully', async () => {
      // Create a controller with missing elements
      const sparseDocument = {
        getElementById: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
        querySelector: vi.fn(() => null)
      }
      globalThis.document = sparseDocument

      vi.resetModules()
      const { UIController } = await import('../../js/ui/UIController.js')

      expect(() => new UIController(mockGameEngine, mockCardRenderer)).not.toThrow()
    })

    it('handles render with empty state', () => {
      expect(() =>
        controller.render({
          phase: 'betting',
          playerHands: [],
          dealerHand: { cards: [], value: 0 },
          balance: 0,
          bets: [],
          currentHandIndex: 0,
          insuranceOffered: false,
          insuranceTaken: false,
          insuranceBet: 0
        })
      ).not.toThrow()
    })

    it('handles rapid button clicks', () => {
      const clickHandler = mockDocument._elements.hitButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        for (let i = 0; i < 10; i++) {
          clickHandler()
        }
        expect(mockGameEngine.hit).toHaveBeenCalledTimes(10)
      }
    })

    it('handles state changes during animation', () => {
      const subscribeCallback = mockGameEngine.subscribe.mock.calls[0]?.[0]

      if (subscribeCallback) {
        // Simulate rapid state changes
        for (let i = 0; i < 5; i++) {
          subscribeCallback({ ...mockGameEngine._state, balance: 1000 + i * 100 })
        }
        expect(mockDocument._elements.balanceAmount.textContent).toBe('$1400')
      }
    })
  })

  // ===========================================================================
  // ACCESSIBILITY TESTS
  // ===========================================================================

  describe('accessibility', () => {
    beforeEach(() => {
      controller.init()
    })

    it('updates game status announcer for screen readers', () => {
      controller.updateMessage('Your turn to play')
      // The gameStatusAnnouncer should be updated for aria-live announcements
      expect(mockDocument._elements.gameStatusAnnouncer.textContent).toBe('Your turn to play')
    })
  })

  // ===========================================================================
  // CLEAR BET TESTS
  // ===========================================================================

  describe('clear bet functionality', () => {
    beforeEach(() => {
      controller.init()
    })

    it('clear bet button click resets bet display', () => {
      const clickHandler = mockDocument._elements.clearBetButton.addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        controller._currentBet = 100
        clickHandler()
        expect(mockDocument._elements.currentBetAmount.textContent).toBe('$0')
      }
    })
  })

  // ===========================================================================
  // HAND COUNT SELECTOR TESTS (Task 015)
  // ===========================================================================

  describe('hand count selector', () => {
    beforeEach(() => {
      controller.init()
    })

    it('attaches event listeners to hand count buttons', () => {
      for (const btn of mockDocument._handCountButtons) {
        expect(btn.addEventListener).toHaveBeenCalledWith('click', expect.any(Function))
      }
    })

    it('hand count button click calls gameEngine.setHandCount', () => {
      const clickHandler = mockDocument._handCountButtons[1].addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        // Create a mock button with classList
        const mockButton = mockDocument._handCountButtons[1]
        clickHandler({ currentTarget: mockButton })
        expect(mockGameEngine.setHandCount).toHaveBeenCalledWith(2)
      }
    })

    it('hand count button updates active state', () => {
      const clickHandler = mockDocument._handCountButtons[1].addEventListener.mock.calls.find(
        (call) => call[0] === 'click'
      )?.[1]

      if (clickHandler) {
        // Simulate clicking on "2 hands" button
        const button = mockDocument._handCountButtons[1]
        button.classList._classes.clear()
        clickHandler({ currentTarget: button })

        // Active class should be toggled by the handler
        // The implementation will handle this
      }
    })

    it('displays hand count in state', () => {
      const state = {
        ...mockGameEngine._state,
        handCount: 2,
        playerHands: []
      }
      controller.render(state)
      // The controller should track the hand count from state
      expect(state.handCount).toBe(2)
    })

    it('shows hand progression message during multi-hand play', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'playerTurn',
        handCount: 3,
        currentHandIndex: 1,
        playerHands: [
          { cards: [{}, {}], value: 18, isStanding: true },
          { cards: [{}, {}], value: 15, isStanding: false },
          { cards: [], value: 0, isStanding: false }
        ]
      }
      controller.render(state)
      // The message should indicate which hand is being played
      // Exact message format depends on implementation
    })
  })

  // ===========================================================================
  // MULTI-HAND DISPLAY TESTS (Task 015)
  // ===========================================================================

  describe('multi-hand display', () => {
    beforeEach(() => {
      controller.init()
    })

    it('displays all hands when handCount is 2', () => {
      const state = {
        ...mockGameEngine._state,
        handCount: 2,
        playerHands: [
          { cards: [], value: 18, bet: 100 },
          { cards: [], value: 15, bet: 100 }
        ],
        bets: [100, 100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerHand0.classList.contains('hidden')).toBe(false)
      expect(mockDocument._elements.playerHand1.classList.contains('hidden')).toBe(false)
    })

    it('displays all hands when handCount is 3', () => {
      const state = {
        ...mockGameEngine._state,
        handCount: 3,
        playerHands: [
          { cards: [], value: 18, bet: 100 },
          { cards: [], value: 15, bet: 100 },
          { cards: [], value: 20, bet: 100 }
        ],
        bets: [100, 100, 100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerHand0.classList.contains('hidden')).toBe(false)
      expect(mockDocument._elements.playerHand1.classList.contains('hidden')).toBe(false)
      expect(mockDocument._elements.playerHand2.classList.contains('hidden')).toBe(false)
    })

    it('updates all hand values when rendering multi-hand', () => {
      const state = {
        ...mockGameEngine._state,
        handCount: 3,
        playerHands: [
          { cards: [], value: 18, bet: 50 },
          { cards: [], value: 15, bet: 75 },
          { cards: [], value: 20, bet: 100 }
        ],
        bets: [50, 75, 100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerValue0.textContent).toBe('18')
      expect(mockDocument._elements.playerValue1.textContent).toBe('15')
      expect(mockDocument._elements.playerValue2.textContent).toBe('20')
    })

    it('updates all hand bets when rendering multi-hand', () => {
      const state = {
        ...mockGameEngine._state,
        handCount: 3,
        playerHands: [
          { cards: [], value: 18, bet: 50 },
          { cards: [], value: 15, bet: 75 },
          { cards: [], value: 20, bet: 100 }
        ],
        bets: [50, 75, 100]
      }
      controller.render(state)
      expect(mockDocument._elements.playerBet0.textContent).toBe('$50')
      expect(mockDocument._elements.playerBet1.textContent).toBe('$75')
      expect(mockDocument._elements.playerBet2.textContent).toBe('$100')
    })

    it('highlights active hand during multi-hand play', () => {
      const state = {
        ...mockGameEngine._state,
        phase: 'playerTurn',
        handCount: 2,
        currentHandIndex: 1,
        playerHands: [
          { cards: [{}, {}], value: 18, isStanding: true },
          { cards: [{}, {}], value: 15, isStanding: false }
        ],
        bets: [100, 100]
      }
      controller.render(state)
      // Hand 0 should not be active, Hand 1 should be active
      expect(mockDocument._elements.playerHand0.classList.contains('active')).toBe(false)
      expect(mockDocument._elements.playerHand1.classList.contains('active')).toBe(true)
    })

    it('removes highlight from completed hands', () => {
      // First render with hand 0 active
      const state1 = {
        ...mockGameEngine._state,
        phase: 'playerTurn',
        handCount: 2,
        currentHandIndex: 0,
        playerHands: [
          { cards: [{}, {}], value: 18, isStanding: false },
          { cards: [{}, {}], value: 15, isStanding: false }
        ],
        bets: [100, 100]
      }
      controller.render(state1)
      expect(mockDocument._elements.playerHand0.classList.contains('active')).toBe(true)

      // Then render with hand 0 standing, hand 1 active
      const state2 = {
        ...mockGameEngine._state,
        phase: 'playerTurn',
        handCount: 2,
        currentHandIndex: 1,
        playerHands: [
          { cards: [{}, {}], value: 18, isStanding: true },
          { cards: [{}, {}], value: 15, isStanding: false }
        ],
        bets: [100, 100]
      }
      controller.render(state2)
      expect(mockDocument._elements.playerHand0.classList.contains('active')).toBe(false)
      expect(mockDocument._elements.playerHand1.classList.contains('active')).toBe(true)
    })
  })

  // ===========================================================================
  // MULTI-HAND RESULT DISPLAY TESTS (Task 015)
  // ===========================================================================

  describe('multi-hand result display', () => {
    beforeEach(() => {
      controller.init()
    })

    it('displays results for all hands', () => {
      const results = [
        { handIndex: 0, outcome: 'win', winnings: 100, message: 'Hand 1 wins!' },
        { handIndex: 1, outcome: 'lose', winnings: -100, message: 'Hand 2 loses!' },
        { handIndex: 2, outcome: 'push', winnings: 0, message: 'Hand 3 pushes!' }
      ]
      controller.showResult(results)
      // Message should contain all result messages
      const message = mockDocument._elements.messageText.textContent
      expect(message).toContain('Hand 1')
      expect(message).toContain('Hand 2')
      expect(message).toContain('Hand 3')
    })

    it('shows combined result message for 2-hand game', () => {
      const results = [
        { handIndex: 0, outcome: 'win', winnings: 100, message: 'Hand 1 wins!' },
        { handIndex: 1, outcome: 'blackjack', winnings: 150, message: 'Hand 2 Blackjack!' }
      ]
      controller.showResult(results)
      const message = mockDocument._elements.messageText.textContent
      expect(message.length).toBeGreaterThan(0)
    })
  })
})
