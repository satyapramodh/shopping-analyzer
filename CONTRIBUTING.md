# Contributing to Costco Dashboard

Thank you for your interest in contributing! This document provides guidelines for contributing to the refactored Costco Dashboard codebase.

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Project Structure](#project-structure)
5. [Coding Standards](#coding-standards)
6. [Testing Requirements](#testing-requirements)
7. [Commit Guidelines](#commit-guidelines)
8. [Pull Request Process](#pull-request-process)

## Code of Conduct

- Be respectful and constructive in all interactions
- Focus on what is best for the community and project
- Show empathy towards other community members

## Getting Started

### Prerequisites

- Modern browser (Chrome 91+, Edge 91+, Firefox 89+, Safari 14+)
- Python 3.x (for development server)
- Git
- Text editor (VS Code recommended)

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd costco

# Start development server
python -m http.server 8000

# Open browser
# Application: http://localhost:8000/dashboard_comprehensive.html
# Tests: http://localhost:8000/test-runner.html
```

## Project Structure

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed architecture documentation.

```
src/
├── components/     # UI components (tabs)
├── core/           # Core logic (StateManager, DataNormalizer)
├── services/       # Service layer
├── utils/          # Utilities
└── main.js         # Entry point

tests/
├── utils/          # Utility tests
├── services/       # Service tests
├── core/           # Core tests
└── integration/    # Integration tests
```

## Coding Standards

### JavaScript Style Guide

#### 1. ES6 Modules

```javascript
// ✅ Good: Named exports
export class MyService { }
export function helperFunction() { }

// ✅ Good: Factory functions for singletons
let _instance = null;
export function getMyService() {
  if (!_instance) {
    _instance = new MyService();
  }
  return _instance;
}

// ❌ Avoid: Default exports
export default MyService;
```

#### 2. Pure Functions

```javascript
// ✅ Good: Pure function
function calculateTotal(items) {
  return items.reduce((sum, item) => sum + item.price, 0);
}

// ❌ Avoid: Side effects
let total = 0;
function calculateTotal(items) {
  items.forEach(item => {
    total += item.price; // Mutates external state
  });
}
```

#### 3. Error Handling

```javascript
// ✅ Good: Use custom error classes
import { DataValidationError } from './utils/errors.js';

function processData(data) {
  if (!Array.isArray(data)) {
    throw new DataValidationError('Data must be an array', { data });
  }
  // ...
}

// ✅ Good: Include context
try {
  processData(input);
} catch (error) {
  logger.error('Failed to process data', { error, input });
  throw error;
}
```

#### 4. JSDoc Comments

All public functions, classes, and methods **must** have JSDoc comments.

```javascript
/**
 * Calculate rewards based on spending
 * @param {number} amount - Total spending amount
 * @param {number} [rate=0.02] - Rewards rate (default 2%)
 * @returns {number} Calculated rewards
 * @throws {DataValidationError} If amount is negative
 * 
 * @example
 * const rewards = calculateRewards(10000); // Returns 200
 */
function calculateRewards(amount, rate = 0.02) {
  if (amount < 0) {
    throw new DataValidationError('Amount must be non-negative', { amount });
  }
  return amount * rate;
}
```

#### 5. Naming Conventions

```javascript
// Classes: PascalCase
class StateManager { }

// Functions/methods: camelCase
function calculateTotal() { }

// Constants: SCREAMING_SNAKE_CASE
const MAX_RETRIES = 3;

// Private members: _prefixed
class MyClass {
  _privateMethod() { }
}

// Boolean variables: is/has/should prefix
const isActive = true;
const hasErrors = false;
const shouldRetry = true;
```

#### 6. File Organization

```javascript
// 1. Imports (grouped and sorted)
import { stateAPI } from './external-lib.js';
import { logger } from '../utils/logger.js';
import { DataValidationError } from '../utils/errors.js';

// 2. Constants
const DEFAULT_TIMEOUT = 5000;

// 3. Private helper functions
function _helperFunction() { }

// 4. Main class/functions
export class MyService { }

// 5. Factory/singleton exports
export function getMyService() { }
```

### Design Pattern Guidelines

#### Singleton Pattern

```javascript
let _instance = null;

export class MyService {
  constructor() {
    if (_instance) {
      return _instance;
    }
    _instance = this;
  }
}

// Preferred: Factory function
export function getMyService() {
  if (!_instance) {
    _instance = new MyService();
  }
  return _instance;
}
```

#### Observer Pattern

```javascript
// Use StateManager for reactive state
import { getStateManager } from './core/StateManager.js';

const state = getStateManager();

// Subscribe to changes
state.subscribe('dataKey', (newValue, oldValue) => {
  // React to changes
});

// Update state (triggers subscribers)
state.set('dataKey', newData);
```

#### Strategy Pattern

```javascript
// Define strategies
export class YearFilter {
  constructor(year) {
    this.year = year;
  }
  
  apply(item) {
    return new Date(item.date).getFullYear() === this.year;
  }
}

// Compose strategies
const pipeline = new FilterPipeline();
pipeline.addFilter(new YearFilter(2024));
pipeline.addFilter(new LocationFilter('123'));
const filtered = pipeline.apply(data);
```

## Testing Requirements

### All Code Must Be Tested

1. **Unit Tests**: Test individual functions/classes in isolation
2. **Integration Tests**: Test cross-module interactions
3. **Edge Cases**: Test null, undefined, empty arrays, etc.

### Test Structure

```javascript
import { expect } from 'chai'; // Available globally in test-runner.html

describe('MyService', () => {
  let service;

  beforeEach(() => {
    service = new MyService();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('methodName', () => {
    it('should handle valid input', () => {
      const result = service.methodName('valid');
      expect(result).to.equal('expected');
    });

    it('should throw error for invalid input', () => {
      expect(() => service.methodName(null)).to.throw();
    });

    it('should handle edge cases', () => {
      expect(service.methodName('')).to.equal('default');
    });
  });
});
```

### Test Coverage Requirements

- **Minimum**: 80% coverage for new code
- **Critical Paths**: 100% coverage required
- **Error Handling**: All error paths tested

### Running Tests

```bash
# Start dev server
python -m http.server 8000

# Open test runner
http://localhost:8000/test-runner.html

# All tests must pass before submitting PR
```

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code refactoring
- `test`: Adding/updating tests
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `perf`: Performance improvements
- `chore`: Maintenance tasks

### Examples

```
feat(components): implement ProductSearch component

- Add search input with debouncing
- Add filters for category and price range
- Add virtual scrolling for large result sets
- Add unit tests for search logic

Closes #123
```

```
fix(services): correct rewards calculation for refunds

Previously, refunds were included in rewards calculation.
Now properly excludes refunded amounts.

Fixes #456
```

```
refactor(core): extract data normalization to separate service

- Create DataNormalizer class with Template Method pattern
- Add OnlineOrderNormalizer and WarehouseReceiptNormalizer
- Update StateManager integration
- Add comprehensive unit tests
```

### Commit Best Practices

- One logical change per commit
- Write clear, descriptive messages
- Reference issue numbers when applicable
- Keep commits atomic and focused

## Pull Request Process

### Before Submitting

1. **Run all tests**: Ensure 100% pass rate
2. **Run linter**: Fix all ESLint errors
3. **Update documentation**: Document new features/APIs
4. **Add tests**: Cover new functionality
5. **Manual testing**: Test in browser

### PR Template

```markdown
## Description
[Clear description of the change]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Refactoring
- [ ] Documentation
- [ ] Performance improvement

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] All tests passing
- [ ] Manual testing completed

## Documentation
- [ ] JSDoc comments added
- [ ] README updated (if needed)
- [ ] ARCHITECTURE.md updated (if needed)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] No console.log statements (use logger)
- [ ] No commented-out code
- [ ] ESLint passes with no errors

## Screenshots (if UI changes)
[Add screenshots]

## Related Issues
Closes #[issue number]
```

### Review Process

1. **Automated Checks**: ESLint, tests must pass
2. **Code Review**: At least one approving review required
3. **Documentation Review**: Verify docs are updated
4. **Manual Testing**: Reviewer tests changes locally

### After Approval

- Squash commits if multiple small commits
- Merge using "Squash and merge" or "Rebase and merge"
- Delete branch after merge

## Development Tips

### Performance

- Use memoization for expensive calculations
- Use debouncing for user input handlers
- Use virtual scrolling for large tables
- Profile before optimizing

### Debugging

```javascript
// Use structured logging
import { logger } from './utils/logger.js';
const log = logger.createChild('MyModule');

log.debug('Debug info', { data });
log.info('Important event', { details });
log.warn('Warning', { context });
log.error('Error occurred', { error });
```

### State Management

```javascript
// Always use StateManager for shared state
import { getStateManager } from './core/StateManager.js';

const state = getStateManager();

// Never use global variables
// ❌ Bad
window.globalData = data;

// ✅ Good
state.set('data', data);
```

### Error Handling

```javascript
// Always provide context in errors
throw new DataValidationError('Invalid format', {
  expected: 'array',
  received: typeof data,
  data
});
```

## Questions?

- Review [ARCHITECTURE.md](ARCHITECTURE.md) for technical details
- Check existing code for examples
- Ask questions in PR comments
- Reach out to maintainers

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.
