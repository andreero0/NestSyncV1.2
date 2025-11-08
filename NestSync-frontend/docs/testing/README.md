# Testing Documentation

## Overview

NestSync frontend uses a comprehensive testing strategy covering unit tests, component tests, end-to-end tests, visual regression tests, and accessibility tests.

## Contents

- [Playwright](./playwright.md) - End-to-end testing with Playwright
- [Unit Tests](./unit-tests.md) - Unit testing patterns
- [Component Tests](./component-tests.md) - Component testing strategies
- [Visual Regression](./visual-regression.md) - Visual testing and screenshots
- [Accessibility](./accessibility.md) - Accessibility testing

## Testing Strategy

### Testing Pyramid
```
        /\
       /  \  E2E Tests (Playwright)
      /____\
     /      \  Integration Tests
    /________\
   /          \  Unit Tests
  /__________\
```

### Test Types

#### Unit Tests
**Purpose**: Test individual functions and utilities
**Tools**: Jest
**Coverage**: Utility functions, hooks, helpers

#### Component Tests
**Purpose**: Test component rendering and behavior
**Tools**: React Native Testing Library, Jest
**Coverage**: Component logic, props, events

#### Integration Tests
**Purpose**: Test component interactions and data flow
**Tools**: React Native Testing Library, Apollo MockedProvider
**Coverage**: Screen flows, state management, API integration

#### E2E Tests
**Purpose**: Test complete user journeys
**Tools**: Playwright
**Coverage**: Critical user flows, cross-platform scenarios

#### Visual Regression Tests
**Purpose**: Detect unintended UI changes
**Tools**: Playwright screenshots
**Coverage**: Key screens, component variations

#### Accessibility Tests
**Purpose**: Ensure accessibility compliance
**Tools**: React Native Testing Library, axe
**Coverage**: WCAG 2.1 AA compliance

## Test Organization

### Directory Structure
```
tests/
├── unit/                   # Unit tests
│   ├── utils/
│   └── hooks/
├── components/             # Component tests
│   ├── cards/
│   └── forms/
├── integration/            # Integration tests
│   ├── screens/
│   └── flows/
├── e2e/                    # E2E tests (Playwright)
│   ├── auth/
│   ├── inventory/
│   └── subscription/
└── fixtures/               # Test data and mocks
```

## Running Tests

### Unit and Component Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- path/to/test.test.ts
```

### E2E Tests
```bash
# Run Playwright tests
npm run test:e2e

# Run in headed mode
npm run test:e2e -- --headed

# Run specific test
npm run test:e2e -- tests/e2e/auth/login.spec.ts

# Debug mode
npm run test:e2e -- --debug
```

### Visual Regression Tests
```bash
# Run visual tests
npm run test:visual

# Update snapshots
npm run test:visual -- --update-snapshots
```

## Writing Tests

### Unit Test Example
```tsx
import { formatDate } from '@/utils/date';

describe('formatDate', () => {
  it('formats date correctly', () => {
    const date = new Date('2025-01-15');
    expect(formatDate(date)).toBe('Jan 15, 2025');
  });
});
```

### Component Test Example
```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

describe('Button', () => {
  it('calls onPress when pressed', () => {
    const onPress = jest.fn();
    const { getByText } = render(
      <Button onPress={onPress}>Click Me</Button>
    );
    
    fireEvent.press(getByText('Click Me'));
    expect(onPress).toHaveBeenCalled();
  });
});
```

### E2E Test Example
```tsx
import { test, expect } from '@playwright/test';

test('user can login', async ({ page }) => {
  await page.goto('/');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page).toHaveURL('/dashboard');
});
```

## Test Data Management

### Fixtures
```tsx
// fixtures/users.ts
export const testUser = {
  id: '1',
  email: 'test@example.com',
  name: 'Test User',
};
```

### Mocks
```tsx
// mocks/apollo.ts
export const childrenMock = {
  request: { query: GET_CHILDREN },
  result: {
    data: {
      myChildren: [
        { id: '1', name: 'Child 1' },
      ],
    },
  },
};
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run tests
  run: npm test -- --ci --coverage

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Coverage Goals

### Target Coverage
- **Unit Tests**: 80% coverage
- **Component Tests**: 70% coverage
- **E2E Tests**: Critical paths covered
- **Visual Tests**: Key screens covered

### Coverage Reports
```bash
# Generate coverage report
npm test -- --coverage

# View HTML report
open coverage/lcov-report/index.html
```

## Best Practices

### Test Naming
- Use descriptive test names
- Follow "should" or "it" pattern
- Group related tests with `describe`

### Test Independence
- Each test should be independent
- Clean up after tests
- Don't rely on test execution order

### Test Data
- Use fixtures for consistent data
- Mock external dependencies
- Avoid hardcoded values

### Assertions
- Use specific assertions
- Test one thing per test
- Provide clear error messages

## Debugging Tests

### Debug Unit Tests
```bash
# Run with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Debug E2E Tests
```bash
# Run in headed mode with slow motion
npm run test:e2e -- --headed --slow-mo=1000

# Use Playwright Inspector
npm run test:e2e -- --debug
```

## Related Documentation

- [Components](../components/) - Component documentation
- [Screens](../screens/) - Screen documentation
- [Root Testing Guide](../../../docs/testing/) - Project-wide testing strategy

---

[← Back to Frontend Docs](../README.md)
