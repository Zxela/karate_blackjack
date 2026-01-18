# Contributing to Karate Blackjack

Thank you for your interest in contributing to Karate Blackjack! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Commit Messages](#commit-messages)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment. Be kind, constructive, and professional in all interactions.

## Getting Started

### Finding Issues to Work On

- Check the [Issues](https://github.com/Zxela/karate_blackjack/issues) page for open tasks
- Look for issues labeled `good first issue` if you're new to the project
- Feel free to ask questions on any issue before starting work

### Reporting Bugs

When reporting bugs, please include:

1. **Description** - Clear description of the bug
2. **Steps to Reproduce** - Detailed steps to recreate the issue
3. **Expected Behavior** - What should happen
4. **Actual Behavior** - What actually happens
5. **Environment** - Browser, OS, screen size
6. **Screenshots** - If applicable

### Suggesting Features

Feature suggestions are welcome! Please include:

1. **Use Case** - Why is this feature needed?
2. **Proposed Solution** - How should it work?
3. **Alternatives** - Any other approaches considered?
4. **Mockups** - Visual examples if applicable

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Git

### Installation

```bash
# Fork the repository on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/karate_blackjack.git
cd karate_blackjack

# Add upstream remote
git remote add upstream https://github.com/Zxela/karate_blackjack.git

# Install dependencies
npm install

# Start development server
npm start
```

### Useful Commands

```bash
npm start          # Start dev server on localhost:3000
npm test           # Run unit tests
npm run test:watch # Run tests in watch mode
npm run test:e2e   # Run E2E tests
npm run lint       # Check for linting errors
npm run format     # Format code with Prettier
```

## Making Changes

### Branch Naming

Create a descriptive branch name:

- `feature/add-surrender-option`
- `fix/card-overlap-z-index`
- `docs/update-readme`
- `refactor/simplify-betting-system`

### Workflow

1. **Sync with upstream**
   ```bash
   git fetch upstream
   git checkout main
   git merge upstream/main
   ```

2. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

3. **Make your changes**
   - Write code
   - Add/update tests
   - Update documentation if needed

4. **Test your changes**
   ```bash
   npm test
   npm run test:e2e
   ```

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push and create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## Pull Request Process

### Before Submitting

- [ ] All tests pass (`npm test` and `npm run test:e2e`)
- [ ] Code is formatted (`npm run format`)
- [ ] No linting errors (`npm run lint`)
- [ ] Documentation updated if needed
- [ ] Commit messages follow conventions

### PR Description

Include in your PR description:

1. **What** - Summary of changes
2. **Why** - Motivation for the change
3. **How** - Brief technical explanation
4. **Testing** - How you tested the changes
5. **Screenshots** - For UI changes

### Review Process

1. Maintainers will review your PR
2. Address any requested changes
3. Once approved, your PR will be merged

## Coding Standards

### JavaScript

- Use ES6+ features (const/let, arrow functions, template literals)
- Use JSDoc comments for functions
- Keep functions small and focused
- Prefer descriptive variable names

```javascript
/**
 * Calculates the hand value according to blackjack rules.
 * @param {Card[]} cards - Array of cards in the hand
 * @returns {number} The calculated hand value
 */
function calculateHandValue(cards) {
  // Implementation
}
```

### CSS

- Use CSS custom properties for theming
- Follow mobile-first responsive design
- Use BEM-style class naming
- Group related properties together

```css
.card {
  /* Positioning */
  position: relative;

  /* Box model */
  width: var(--card-width);
  height: var(--card-height);

  /* Visual */
  background: var(--color-card-face);
  border-radius: var(--radius-md);

  /* Animation */
  transition: transform var(--transition-base);
}
```

### File Organization

- One component/class per file
- Group related files in directories
- Keep files under 500 lines when possible

## Testing Guidelines

### Unit Tests

- Test public APIs, not implementation details
- Use descriptive test names
- Follow Arrange-Act-Assert pattern

```javascript
describe('Hand', () => {
  describe('getValue', () => {
    it('returns 21 for blackjack (Ace + 10-value card)', () => {
      // Arrange
      const hand = new Hand()
      hand.addCard({ rank: 'A', suit: 'spades' })
      hand.addCard({ rank: 'K', suit: 'hearts' })

      // Act
      const value = hand.getValue()

      // Assert
      expect(value).toBe(21)
    })
  })
})
```

### E2E Tests

- Test user flows, not implementation
- Use stable selectors (IDs, data attributes)
- Handle async operations properly

```javascript
test('can place bet and deal cards', async ({ page }) => {
  await page.click('[data-bet="100"]')
  await page.click('#dealButton')

  await expect(page.locator('#playerCards0 .card')).toHaveCount(2)
  await expect(page.locator('#dealerHand .card')).toHaveCount(2)
})
```

### Test Coverage

- Aim for high coverage on game logic
- Critical paths must be tested
- Edge cases should be covered

## Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

### Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

### Examples

```
feat(audio): add volume persistence to localStorage

fix(cards): resolve z-index clipping on dealer hand

docs: update README with belt rank table

test(betting): add tests for max bet validation
```

## Questions?

If you have questions about contributing:

1. Check existing issues and discussions
2. Open a new issue with the `question` label
3. Be patient - maintainers are volunteers

Thank you for contributing to Karate Blackjack!
