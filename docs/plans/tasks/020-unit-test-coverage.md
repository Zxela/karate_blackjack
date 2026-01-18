# Task 020: Unit Test Coverage Completion

**Phase**: Phase 7 - Quality Assurance and Testing
**Estimated Duration**: 3-4 hours
**Complexity**: Low-Medium

## Task Overview

Verify 70% code coverage across all game components. Review coverage reports, identify gaps, and add additional test cases as needed. Coverage includes all game logic, utilities, and state management (excludes UI rendering tested in L1).

**Key Responsibility**: Achieve and verify 70% code coverage across all testable components.

## Acceptance Criteria

- Code coverage: 70% minimum (statements, branches, functions, lines)
- All critical paths covered
- Boundary cases tested
- All tests passing
- No skipped or pending tests

## Files to Review/Modify

- [ ] `__tests__/` directory (comprehensive test review)
- [ ] Each component test file (add tests as needed)
- [ ] Coverage report generation verification

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Coverage Analysis
- [ ] Run coverage report:
  - [ ] Command: `npm run test:coverage`
  - [ ] Generate coverage report
  - [ ] Identify uncovered lines/branches
- [ ] Analyze gaps by component:
  - [ ] RandomGenerator: Verify all boundary values
  - [ ] CardDeck: Verify shuffle coverage
  - [ ] Hand: Verify all hand combinations
  - [ ] BettingSystem: Verify all balance operations
  - [ ] GameStateMachine: Verify state transition matrix
  - [ ] DealerAI: Verify hit/stand decisions
  - [ ] GameEngine: Verify all actions and flows
  - [ ] StorageManager: Verify save/load/error cases
- [ ] Identify critical gaps:
  - [ ] Error paths
  - [ ] Edge cases
  - [ ] Boundary values

### 2. Green Phase: Gap Coverage
- [ ] For each uncovered area:
  - [ ] Write test case covering the gap
  - [ ] Run test and confirm it passes
  - [ ] Verify coverage increased
- [ ] Focus areas:
  - [ ] Error handling paths
  - [ ] Boundary conditions
  - [ ] State transitions
  - [ ] Integration points
- [ ] Run full test suite:
  - [ ] Confirm all tests passing
  - [ ] Verify no test failures

### 3. Refactor Phase: Coverage Verification
- [ ] Generate final coverage report
- [ ] Verify >= 70% on all metrics:
  - [ ] Statements: >= 70%
  - [ ] Branches: >= 70%
  - [ ] Functions: >= 70%
  - [ ] Lines: >= 70%
- [ ] Review coverage report:
  - [ ] No critical gaps remain
  - [ ] High-impact code covered
- [ ] Commit coverage report:
  - [ ] Document coverage metrics
  - [ ] Note any intentional gaps (UI rendering, etc.)

## Completion Criteria

- [ ] Coverage report shows >= 70% across all metrics
- [ ] All unit tests passing
- [ ] No skipped or pending tests
- [ ] Coverage report artifact generated
- [ ] Coverage goals document created
- [ ] All critical paths tested

## Notes

**Impact Scope**:
- Direct: Quality assurance verification
- Indirect: Code quality confidence
- Change Area: Test coverage improvements

**Constraints**:
- Must achieve 70% minimum across all metrics
- Must not disable coverage checks
- Must maintain test quality (not just quantity)

**Verification Method**: L2 (Test Operation)
- Coverage report >= 70%
- All tests passing

**Coverage Metrics**:
- **Statements**: % of code lines executed
- **Branches**: % of conditional branches taken
- **Functions**: % of functions called
- **Lines**: % of code lines hit during testing

**Excluded from Coverage**:
- UI rendering (tested separately in L1)
- Browser APIs (tested through mocks)
- External library code

**Tools**:
- `npm run test:coverage` generates report
- Coverage report in `coverage/` directory
- HTML report for visual inspection

**Testing Strategy for Gaps**:
1. Error paths: Mock failures, test recovery
2. Edge cases: Boundary values (0, max, negative)
3. State transitions: All valid/invalid combinations
4. Integration: Multiple component interactions

**Documentation**:
- Record coverage percentage by component
- Note intentional gaps (e.g., UI not covered)
- Link to coverage report

**Dependencies**:
- All previous tasks (all code implemented)

**Provides**:
- Coverage report and verification → Quality assurance confirmation
