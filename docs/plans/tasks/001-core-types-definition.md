# Task 001: Core Data Types Definition

**Phase**: Phase 1 - Foundation
**Estimated Duration**: 2-3 hours
**Complexity**: Low

## Task Overview

Define all core data types used throughout the blackjack game. This task establishes the type system foundation that all other components depend on. Types are defined using JSDoc @typedef for JavaScript with runtime validation patterns.

**Key Responsibility**: Establish complete, documented type definitions before any game logic implementation.

## Acceptance Criteria

- AC-014 (partial): All GameState types defined and properly documented
- All types use JSDoc @typedef with full property documentation
- Type export path established for all components
- All types include validation patterns (type guards where applicable)
- No unused type definitions

## Files to Create/Modify

- [x] `js/types/index.js` (NEW - 150-200 lines)

## Implementation Steps (TDD: Red-Green-Refactor)

### 1. Red Phase: Type Definition Planning
- [x] List all types needed: Card, Suit, Rank, Hand, HandState, GamePhase, GameState, PlayerConfig, RoundResult
- [x] Document each type's properties and their purposes
- [x] Identify validation requirements for each type
- [x] Create failing type check example (optional: can be manual verification)

### 2. Green Phase: Type Definition Implementation
- [x] Create `js/types/index.js` file
- [x] Define Suit type (Hearts, Diamonds, Clubs, Spades)
- [x] Define Rank type (2-10, J, Q, K, A)
- [x] Define Card type (suit, rank, value calculation reference)
- [x] Define HandState type (cards array, value, isSoft, isBust)
- [x] Define GamePhase type (betting, dealing, playerTurn, dealerTurn, resolution, gameOver)
- [x] Define GameState type (phase, playerHands, dealerHand, playerBalance, currentBet)
- [x] Define PlayerConfig type (initialBalance, betAmounts)
- [x] Define RoundResult type (outcome, winnings, message)
- [x] Export all types explicitly

### 3. Refactor Phase: Documentation and Validation
- [x] Add comprehensive JSDoc comments for each type
- [x] Document all properties with @property annotations
- [x] Add example usage comments
- [x] Verify each type is exported
- [x] Verify no circular dependencies

## Completion Criteria

- [x] `js/types/index.js` exists with all required types
- [x] All types properly documented with JSDoc
- [x] Card type: suit, rank properties defined
- [x] HandState type: cards, value, isSoft, isBust properties defined
- [x] GamePhase enum values documented (6 phases)
- [x] GameState type: phase, hands, dealer, balance, bet properties complete
- [x] PlayerConfig type: initialBalance property defined
- [x] RoundResult type: outcome, winnings, message properties defined
- [x] No console warnings on file import
- [x] Manual type checking passes (verify using JSDoc syntax)

## Notes

**Impact Scope**:
- Direct: No existing code impacts (new file)
- Indirect: All subsequent game components import these types
- Change Area: New file only

**Constraints**:
- Must use JSDoc (not TypeScript) for compatibility with plain JavaScript project
- No runtime implementation in this file, only type definitions
- All types must be clearly documented for developers

**Verification Method**: L3 (Build Success)
- File imports without errors
- JSDoc syntax valid
- All exports accessible

**Dependencies**:
- None (Phase 1 foundation)

**Provides**:
- `js/types/index.js` → Used by Tasks 002-024
