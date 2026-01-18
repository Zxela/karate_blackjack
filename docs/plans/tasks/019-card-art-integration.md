# Task 019: Card Art Asset Integration

**Phase**: Phase 6 - Karate-Themed Card Art
**Estimated Duration**: 2-3 hours
**Complexity**: Low

## Task Overview

Replace placeholder cards with final karate-themed art assets. This is a drop-in replacement for the placeholder system created in Task 011. No code changes needed if AssetLoader is properly designed.

**Key Responsibility**: Integrate final artwork with zero code changes to existing components.

## Acceptance Criteria

- AC-009, AC-010, AC-011: Karate-themed artwork visible on all cards
- All cards display with clear suit and rank identification
- Card back design matches spec
- No asset loading errors
- All 52 cards + back image present and loading correctly
- 70% code coverage minimum (unchanged from Task 011)

## Files to Create/Modify

- [ ] `assets/cards/hearts-A.png` through `hearts-K.png` (12 files)
- [ ] `assets/cards/diamonds-A.png` through `diamonds-K.png` (12 files)
- [ ] `assets/cards/clubs-A.png` through `clubs-K.png` (12 files)
- [ ] `assets/cards/spades-A.png` through `spades-K.png` (12 files)
- [ ] `assets/cards/back.png` (1 file)
- [ ] Optional: `.gitignore` updates if assets are version-controlled

## Implementation Steps

### 1. Red Phase: Asset Preparation
- [ ] Verify asset requirements:
  - [ ] 52 unique card images (4 suits × 13 ranks)
  - [ ] 1 card back image
  - [ ] Consistent dimensions (recommended 100×150px or similar)
  - [ ] PNG format (supports transparency)
  - [ ] Clear suit and rank identification
- [ ] Plan directory structure:
  - [ ] `assets/cards/` directory
  - [ ] Naming: `{suit}-{rank}.png` (e.g., hearts-A.png, spades-K.png)
  - [ ] Back image: `back.png`

### 2. Green Phase: Asset Integration
- [ ] Create `assets/cards/` directory
- [ ] Place all 52 card images:
  - [ ] Hearts: A, 2-10, J, Q, K
  - [ ] Diamonds: A, 2-10, J, Q, K
  - [ ] Clubs: A, 2-10, J, Q, K
  - [ ] Spades: A, 2-10, J, Q, K
- [ ] Place card back image: `back.png`
- [ ] Verify all files present:
  - [ ] `npm run build` succeeds
  - [ ] No 404 errors in browser console
  - [ ] All cards render with artwork

### 3. Refactor Phase: Verification
- [ ] Verify asset loading:
  - [ ] No network errors
  - [ ] All cards render without fallback
  - [ ] Card back renders correctly
- [ ] Verify visual quality:
  - [ ] Suit and rank clearly visible
  - [ ] Art consistent across all cards
  - [ ] Karate theme identifiable
- [ ] Verify file sizes:
  - [ ] Total bundle size acceptable
  - [ ] No excessively large individual files
- [ ] Optional optimization:
  - [ ] Spritesheet creation (if performance issue)
  - [ ] WebP format alternative (if needed)

## Completion Criteria

- [ ] All 52 unique cards + back image present
- [ ] Images load and render correctly
- [ ] No asset loading errors in console
- [ ] Art clearly shows suit and rank
- [ ] Karate theme visible and identifiable
- [ ] Cards render faster than placeholder generation (optional but likely)
- [ ] All previous tests still passing (coverage unchanged)

## Notes

**Impact Scope**:
- Direct: Card rendering (Task 012 uses assetLoader)
- Indirect: All visual card display
- Change Area: Asset files only (no code changes)

**Constraints**:
- Must be 52 unique cards (no duplicates)
- Naming convention: `{suit-letter}-{rank}.png`
- Suit letters: hearts, diamonds, clubs, spades
- Rank values: A, 2-10, J, Q, K
- Consistent dimensions recommended

**Verification Method**: L1 (Functional)
- All cards render without error
- Art loads within performance budget
- No console errors for asset loading

**Asset Path Mapping**:
```
assets/
└── cards/
    ├── hearts-A.png through hearts-K.png
    ├── diamonds-A.png through diamonds-K.png
    ├── clubs-A.png through clubs-K.png
    ├── spades-A.png through spades-K.png
    └── back.png
```

**No Code Changes Required**:
- AssetLoader designed to accept card images
- Path pattern: `assets/cards/{suit}-{rank}.png`
- CardRenderer uses assetLoader unchanged
- UIController uses CardRenderer unchanged
- Drop-in replacement works transparently

**Optional Enhancements** (post-MVP):
- Spritesheet for faster loading
- Lazy loading of card images
- WebP format for smaller file sizes
- Image compression optimization

**Dependencies**:
- Task 011: AssetLoader system
- Task 012: CardRenderer using assets
- Task 013: UIController displaying cards

**Provides**:
- Final karate-themed card artwork → Complete visual game
