# UI Wireframes: Visual Improvements

## 1. Active Hand Indicator (Multi-Hand Play)

### Before (Current State)
```
┌─────────────────────────────────────────────────────────┐
│                    DEALER AREA                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ┌─────────┐     ┌─────────┐     ┌─────────┐         │
│   │ Hand 1  │     │ Hand 2  │     │ Hand 3  │         │
│   │   15    │     │   18    │     │   12    │         │
│   │ [cards] │     │ [cards] │     │ [cards] │         │
│   │  $10    │     │  $10    │     │  $10    │         │
│   └─────────┘     └─────────┘     └─────────┘         │
│        ↑                                               │
│   (no clear indicator which is active)                 │
└─────────────────────────────────────────────────────────┘
```

### After (With Active Indicator)
```
┌─────────────────────────────────────────────────────────┐
│                    DEALER AREA                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│   ╔═════════╗     ┌─────────┐     ┌─────────┐         │
│   ║ Hand 1  ║     │ Hand 2  │     │ Hand 3  │         │
│   ║ Playing ║     │   18    │     │   12    │  (dim)  │
│   ║   15    ║     │ [cards] │     │ [cards] │         │
│   ║ [cards] ║     │  $10    │     │  $10    │         │
│   ║  $10    ║     └─────────┘     └─────────┘         │
│   ╚═════════╝                                          │
│   ↑ GLOWING                                            │
│     BORDER                                             │
└─────────────────────────────────────────────────────────┘
```

## 2. Result Display

### WIN Result
```
┌─────────────────┐
│    Hand 1       │
│      19         │
│    [cards]      │
│                 │
│ ╔═════════════╗ │
│ ║   ✓ WIN!    ║ │  ← Green background
│ ║   +$10      ║ │    Pulse animation
│ ╚═════════════╝ │
│      $10        │
└─────────────────┘
```

### LOSE Result
```
┌─────────────────┐
│    Hand 1       │
│      16         │
│    [cards]      │
│                 │
│ ╔═════════════╗ │
│ ║   ✗ LOSE    ║ │  ← Red background
│ ║   -$10      ║ │    Shake animation
│ ╚═════════════╝ │
│      $10        │
└─────────────────┘
```

### PUSH Result
```
┌─────────────────┐
│    Hand 1       │
│      18         │
│    [cards]      │
│                 │
│ ╔═════════════╗ │
│ ║   ⟷ PUSH    ║ │  ← Yellow/Amber background
│ ║    $0       ║ │    Distinct from win/lose
│ ╚═════════════╝ │    Border highlight
│      $10        │
└─────────────────┘
```

### BLACKJACK Result
```
┌─────────────────┐
│    Hand 1       │
│      21         │
│    [A♠] [K♥]    │
│                 │
│ ╔═════════════╗ │
│ ║ ★BLACKJACK★ ║ │  ← Gold gradient
│ ║   +$15      ║ │    Glow animation
│ ╚═════════════╝ │    Special styling
│      $10        │
└─────────────────┘
```

## 3. Soft Hand Indicator

### Hard Hand (Current)
```
┌─────────────────┐
│    Hand 1       │
│      17         │  ← Plain number
│    [7♠] [Q♦]    │
└─────────────────┘
```

### Soft Hand (Enhanced)
```
┌─────────────────┐
│    Hand 1       │
│   ♠ Soft 17     │  ← Ace icon + "Soft" label
│    [A♠] [6♥]    │    Green/italic styling
└─────────────────┘
```

## 4. Color Scheme Reference

| Element        | Color                  | Hex Code  |
|----------------|------------------------|-----------|
| Active Glow    | Karate Red (accent)    | #c41e3a   |
| Win            | Success Green          | #22c55e   |
| Lose           | Error Red              | #ef4444   |
| Push           | Warning Amber          | #eab308   |
| Blackjack      | Gold Gradient          | #fbbf24   |
| Soft Hand      | Success Green (subtle) | #22c55e   |
| Inactive Hand  | Dimmed (60% opacity)   | -         |
