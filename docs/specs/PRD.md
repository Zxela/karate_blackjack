# Product Requirements Document: UI/UX Improvements

## Problem Statement

The Karate Blackjack game has functional gameplay but lacks visual clarity in three key areas:

1. **Multi-hand play confusion** - When playing 2-3 hands, it's unclear which hand is currently active
2. **Result feedback** - PUSH results are easy to miss, and WIN/LOSE states could be more prominent
3. **Hand value ambiguity** - Soft hands (Ace counted as 11) aren't clearly distinguished from hard hands

## Goals

1. Make the active hand immediately obvious during multi-hand play
2. Improve result visibility with clear, distinct visual feedback for WIN/LOSE/PUSH/BLACKJACK
3. Enhance hand value display to clearly show soft vs hard hands

## Non-Goals

- Changing game logic or rules
- Adding new game features (splits, side bets, etc.)
- Major redesign of the karate theme
- Performance optimizations
- Mobile-specific redesign

## User Stories

### US-1: Active Hand Indicator
**As a** player with multiple hands
**I want** to clearly see which hand I'm currently playing
**So that** I can make decisions without confusion

**Acceptance Criteria:**
- Active hand has a visible glow/border effect
- Non-active hands are visually dimmed
- Hand label shows "Playing" or similar indicator
- Transition between hands is animated

### US-2: Result Clarity
**As a** player who just finished a round
**I want** to immediately understand each hand's result
**So that** I know what happened without reading small text

**Acceptance Criteria:**
- WIN shows green overlay/animation
- LOSE shows red overlay/animation
- PUSH shows distinct yellow/amber indicator (not easily confused with win/lose)
- BLACKJACK shows special gold/animated effect
- BUST shows red with screen shake (already implemented)

### US-3: Hand Value Display
**As a** player
**I want** to easily distinguish soft hands from hard hands
**So that** I can make better strategic decisions

**Acceptance Criteria:**
- Soft hands display "Soft X" with visual indicator (already shows text)
- Add subtle icon or color to reinforce soft hand status
- Dealer's showing card value is prominent
- Hand value updates smoothly without flash

## Success Metrics

- Visual inspection confirms all acceptance criteria
- E2E tests pass for all scenarios
- No regression in existing functionality
