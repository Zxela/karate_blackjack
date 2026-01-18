# Task 021: Integration Testing - Full Game Rounds

**Phase**: Phase 7 - Quality Assurance and Testing
**Estimated Duration**: 4-5 hours
**Complexity**: High

## Task Overview

Execute full game scenarios end-to-end, verifying complete game flows from betting through resolution. Tests validate the entire system working together with realistic game sequences.

**Key Responsibility**: Verify all game mechanics work correctly in complete game scenarios.

## Acceptance Criteria

- All 6 scenarios play without error
- Balance updates correctly after each round
- State transitions valid throughout
- Outcomes calculated correctly
- Multi-hand scenarios work correctly

## Files to Create/Modify

- [ ] `__tests__/integration/` (NEW - integration test suite)
- [ ] `__tests__/integration/GameScenarios.test.js` (NEW - ~400 lines)

## Implementation Steps (Red-Green-Refactor)

### 1. Red Phase: Scenario Definition
- [ ] Define 6 integration test scenarios:

**Scenario 1: Single Hand Win**
```
1. startNewRound(1)
2. placeBet(0, 100)
3. Deal (player gets 15, dealer shows 5)
4. hit(0) → player gets card → 18
5. stand(0)
6. Dealer plays (hits on 16, busts)
7. Resolution: Player wins (100 × 2 = 200 payout)
8. Verify: balance increased by 100
```

**Scenario 2: Single Hand Bust**
```
1. startNewRound(1)
2. placeBet(0, 100)
3. Deal (player gets K-9, dealer shows 6)
4. hit(0) → player gets 7 → 26 (bust)
5. Hand auto-stands
6. Resolution: Player loses
7. Verify: balance decreased by 100
```

**Scenario 3: Single Hand Blackjack**
```
1. startNewRound(1)
2. placeBet(0, 100)
3. Deal → player gets Ace + King = blackjack
4. Dealer doesn't have blackjack
5. Resolution: Blackjack payout (100 × 1.5 = 150)
6. Verify: balance increased by 50
```

**Scenario 4: Multi-Hand (3 hands)**
```
1. startNewRound(3)
2. placeBet(0, 100), placeBet(1, 50), placeBet(2, 75)
3. Deal all 3 hands
4. Play hand 1: hit → stand → win (100 × 2)
5. Play hand 2: stand → lose (0)
6. Play hand 3: hit → stand → push (75)
7. Dealer plays
8. Resolution: All 3 hands resolved
9. Verify: balance = original + 100 + 0 + 75
```

**Scenario 5: Double Down**
```
1. startNewRound(1)
2. placeBet(0, 100)
3. Deal (player 6 + 5 = 11, dealer shows 6)
4. doubleDown(0) → bet becomes 200, draws 1 card → 18
5. Hand auto-stands
6. Dealer plays and busts
7. Resolution: Win with double (200 × 2 = 400 payout)
8. Verify: balance increased by 200
```

**Scenario 6: Split (non-Ace)**
```
1. startNewRound(1)
2. placeBet(0, 100)
3. Deal (player 7-7, dealer shows 6)
4. split(0) → two hands, each 7
5. Hand 1: add card → 14, hit → 18, stand
6. Hand 2: add card → 16, stand
7. Dealer plays → 18
8. Resolution: Hand 1 push (100), Hand 2 loss (0)
9. Verify: balance = original - 0 (push returns original bet)
```

- [ ] Write test implementations for all 6 scenarios
- [ ] Run tests and confirm failure

### 2. Green Phase: Integration Test Implementation
- [ ] Create `__tests__/integration/GameScenarios.test.js`
- [ ] Implement test helper:
  - [ ] Helper to set up GameEngine with deterministic deck
  - [ ] Helper to verify balance changes
  - [ ] Helper to verify game state progression
- [ ] Implement scenario 1 test:
  - [ ] Initialize GameEngine
  - [ ] startNewRound(1)
  - [ ] placeBet(0, 100)
  - [ ] Simulate dealing
  - [ ] Execute hit action
  - [ ] Stand
  - [ ] Verify dealer plays
  - [ ] Verify outcome: win
  - [ ] Verify balance: +100
- [ ] Implement scenarios 2-6 similarly
- [ ] Run tests and confirm all pass

### 3. Refactor Phase: Edge Cases
- [ ] Add bonus scenarios (optional):
  - [ ] Push scenario
  - [ ] Split Aces scenario
  - [ ] Insurance scenario
- [ ] Verify state consistency throughout:
  - [ ] No orphaned state
  - [ ] Valid transitions only
  - [ ] Balance always accurate
- [ ] Add comprehensive assertions:
  - [ ] Verify all state changes
  - [ ] Verify balance calculations
  - [ ] Verify hand outcomes
- [ ] Run all tests
- [ ] Verify all integration tests passing

## Completion Criteria

- [ ] 6 full game scenarios complete successfully
- [ ] Balance calculations correct for all outcomes
- [ ] No state errors during play
- [ ] All state transitions valid
- [ ] Win/loss/push outcomes correct
- [ ] Double down mechanics verified
- [ ] Split mechanics verified
- [ ] Multi-hand scenarios working
- [ ] All tests passing

## Notes

**Impact Scope**:
- Direct: System-level verification
- Indirect: Component interaction validation
- Change Area: New integration test suite

**Constraints**:
- Must test realistic game flows
- Must verify balance accuracy
- Must not require UI interaction
- Must be fast enough for CI/CD

**Verification Method**: L2 (Test Operation)
- All integration tests passing
- All scenarios complete without error

**Test Structure**:
```typescript
describe('Game Scenario: Single Hand Win', () => {
  it('should win with correct payout', async () => {
    const engine = new GameEngine(config);
    engine.startNewRound(1);
    engine.placeBet(0, 100);
    // ... actions ...
    expect(engine.getState().balance).toBe(1100);
  });
});
```

**Deterministic Testing**:
- Use mocked RandomGenerator to control deck order
- Ensure consistent card dealing for reproducible tests
- Verify outcomes against known sequences

**Balance Verification**:
```
Starting: 1000
After bet: 900
After win (×2): 1100
After loss (×0): 900
After push (×1): 1000
```

**Dependencies**:
- All previous implementation tasks
- Task 009: GameEngine core
- Task 015-017: Advanced features

**Provides**:
- Integration test suite confirming system works end-to-end
