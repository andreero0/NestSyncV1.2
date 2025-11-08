# NestSync Testing Documentation

## Overview

This directory contains active testing guides, strategies, and methodologies for NestSync development. For historical test reports and validation results, see the [Test Reports Archive](../archives/test-reports/README.md).

---

## Quick Navigation

### Active Testing Guides
- **[Emergency Flows Test Strategy](./emergency-flows-test-strategy.md)** - Comprehensive testing strategy for emergency features
- **[Screenshot Capture User Journey Map](./screenshot-capture-user-journey-map.md)** - Visual testing and user journey documentation

### Recent Test Reports
- **[Comprehensive Feature Testing Report](./COMPREHENSIVE_FEATURE_TESTING_REPORT.md)** - Family collaboration and child management testing
- **[Emergency Order Flow Test Report](./EMERGENCY_ORDER_FLOW_TEST_REPORT.md)** - Emergency ordering functionality validation
- **[Stripe Integration Playwright Validation](./STRIPE_INTEGRATION_PLAYWRIGHT_VALIDATION.md)** - Payment system testing
- **[Stripe Endpoints Test Report](./STRIPE_ENDPOINTS_TEST_REPORT.md)** - Backend payment endpoint validation

### Test Artifacts
- **[baseline-screenshots/](./baseline-screenshots/)** - Visual regression baseline images
- **[playwright-report/](./playwright-report/)** - Playwright test execution reports
- **[test-results/](./test-results/)** - Test execution results and evidence

---

## Testing Methodology

### Testing Pyramid

```
                    /\
                   /  \
                  / E2E \
                 /--------\
                /          \
               / Integration \
              /--------------\
             /                \
            /   Unit Tests     \
           /____________________\
```

**Unit Tests** (Base Layer)
- Fast, isolated component testing
- Business logic validation
- Model and utility function testing

**Integration Tests** (Middle Layer)
- API endpoint testing
- Database operation validation
- GraphQL resolver testing
- Cross-component interaction

**End-to-End Tests** (Top Layer)
- Full user journey validation
- Cross-platform testing
- Real browser automation with Playwright

---

## Test Categories

### 1. Unit Tests

**Location**: Component-specific test files
- `NestSync-backend/tests/unit/` - Backend unit tests
- `NestSync-frontend/tests/unit/` - Frontend unit tests

**Focus Areas**:
- Model validation and business logic
- Utility functions and helpers
- Data transformation and formatting
- State management logic

**Tools**:
- **Backend**: pytest, pytest-asyncio
- **Frontend**: Jest, React Testing Library

**Example**:
```python
# Backend unit test
def test_emergency_access_token_generation():
    access = EmergencyAccess.create_emergency_access(
        family_id=uuid4(),
        child_id=uuid4(),
        created_by=uuid4()
    )
    assert access.access_token is not None
    assert len(access.access_code) == 6
```

---

### 2. Integration Tests

**Location**: 
- `NestSync-backend/tests/integration/` - Backend integration tests
- `docs/testing/` - Integration test reports

**Focus Areas**:
- GraphQL API endpoints
- Database operations and migrations
- Authentication and authorization flows
- Third-party service integrations (Stripe, Supabase)

**Tools**:
- **Backend**: pytest with test database
- **API Testing**: GraphQL queries with test client
- **Database**: Alembic migrations with test fixtures

**Archived Reports**:
- [API Contract Validation](../archives/test-reports/integration/api-contract-validation-20250904.md)
- [Comprehensive Backend Testing](../archives/test-reports/integration/comprehensive-backend-testing-20250904.md)
- [Production Readiness Report](../archives/test-reports/integration/production-readiness-20250904.md)

---

### 3. End-to-End (E2E) Tests

**Location**:
- `tests/` - Root-level E2E test suites
- `NestSync-frontend/tests/` - Frontend E2E tests

**Focus Areas**:
- Complete user journeys
- Cross-platform functionality (web, iOS, Android)
- Real browser automation
- Visual regression testing

**Tools**:
- **Playwright** - Primary E2E testing framework
- **Playwright MCP** - Browser automation for development
- **Expo Go** - Mobile platform testing

**Test Credentials**:
- **Email**: `parents@nestsync.com`
- **Password**: `Shazam11#`

**Archived Reports**:
- [Comprehensive User Journey Test](../archives/test-reports/e2e/comprehensive-user-journey-test-20250904.md)
- [Notification System E2E Test](../archives/test-reports/e2e/notification-system-e2e-test.md)
- [Trial Banner Visibility Test](../archives/test-reports/e2e/trial-banner-visibility-final-test.md)

---

### 4. Visual Regression Tests

**Location**: `docs/testing/baseline-screenshots/`

**Focus Areas**:
- UI component rendering consistency
- Cross-platform visual parity
- Design system compliance
- Layout and spacing validation

**Tools**:
- **Playwright Screenshots** - Automated screenshot capture
- **Visual Comparison** - Baseline vs current comparison

**Archived Reports**:
- [Inventory Grid Test Report](../archives/test-reports/visual/inventory-grid-test-report.md)
- [Layout Verification Report](../archives/test-reports/visual/layout-verification-report.md)
- [Playwright Visual Validation](../archives/test-reports/visual/playwright-visual-validation-report.md)

---

### 5. Performance Tests

**Focus Areas**:
- API response times (<100ms for critical operations)
- Database query optimization
- Frontend rendering performance
- Offline functionality speed

**Critical Benchmarks**:
- Emergency data access: <100ms
- GraphQL query response: <200ms
- Token validation: <50ms
- Offline data sync: <500ms initial, <100ms subsequent

**See Also**:
- [Emergency Flows Test Strategy](./emergency-flows-test-strategy.md#performance-tests)
- [Performance Test Reports Archive](../archives/test-reports/performance/README.md)

---

### 6. Compliance Tests

**Focus Areas**:
- PIPEDA data residency validation
- Consent management flows
- Data isolation and RLS policies
- Audit trail verification

**Tools**:
- Custom compliance validation scripts
- Database policy testing
- Consent flow automation

**See Also**:
- [PIPEDA Compliance Documentation](../compliance/pipeda/README.md)
- [Compliance Test Reports Archive](../archives/test-reports/compliance/README.md)

---

## Testing Tools & Frameworks

### Backend Testing Stack

**pytest** - Primary testing framework
```bash
cd NestSync-backend
pytest tests/unit/
pytest tests/integration/
pytest --cov=app tests/  # With coverage
```

**pytest-asyncio** - Async test support
```python
@pytest.mark.asyncio
async def test_async_resolver():
    result = await get_emergency_contacts(child_id)
    assert result is not None
```

**Factory Boy** - Test data generation
```python
child = ChildFactory.create(name="Test Child")
family = FamilyFactory.create()
```

---

### Frontend Testing Stack

**Playwright** - E2E testing framework
```bash
cd tests
npx playwright test
npx playwright test --ui  # Interactive mode
npx playwright show-report  # View results
```

**Playwright MCP** - Development testing
- Real browser automation during development
- Interactive debugging and inspection
- Screenshot and video capture

**Jest + React Testing Library** - Component testing
```bash
cd NestSync-frontend
npm test
npm test -- --coverage
```

---

### Testing Environments

**Local Development**
- Backend: `http://localhost:8001`
- Frontend: `http://localhost:8082`
- Database: Local Supabase instance

**Staging/Cloud**
- Backend: Railway deployment
- Frontend: Expo hosted
- Database: Supabase cloud instance

**Test Data**
- Test user: `parents@nestsync.com`
- Test family: Pre-configured with child profiles
- Test inventory: Sample diaper and clothing items

---

## Test Execution

### Running All Tests

**Backend Tests**:
```bash
cd NestSync-backend
source venv/bin/activate

# Run all tests
pytest

# Run specific test category
pytest tests/unit/
pytest tests/integration/

# Run with coverage
pytest --cov=app --cov-report=html tests/

# Run specific test file
pytest tests/unit/test_emergency_access.py
```

**Frontend Tests**:
```bash
cd NestSync-frontend

# Run Jest tests
npm test

# Run Playwright E2E tests
cd ../tests
npx playwright test

# Run specific test suite
npx playwright test emergency-flows.spec.ts
```

---

### Test Development Workflow

1. **Write Test First** (TDD approach)
   - Define expected behavior
   - Write failing test
   - Implement feature
   - Verify test passes

2. **Test Incrementally**
   - Test during development, not just at the end
   - Use Playwright MCP for interactive testing
   - Collect evidence (screenshots, logs)

3. **Validate Comprehensively**
   - Unit tests for business logic
   - Integration tests for API endpoints
   - E2E tests for user journeys
   - Visual tests for UI consistency

4. **Document Results**
   - Create test reports for significant features
   - Archive historical test results
   - Update test strategies based on findings

---

## Test Data Management

### Test Credentials
**Primary Test Account**:
- Email: `parents@nestsync.com`
- Password: `Shazam11#`
- Family: Pre-configured with child profiles
- Inventory: Sample items for testing

### Test Database
**Setup**:
```bash
cd NestSync-backend
alembic upgrade head  # Apply migrations
python scripts/seed_test_data.py  # Seed test data
```

**Reset**:
```bash
alembic downgrade base
alembic upgrade head
python scripts/seed_test_data.py
```

### Test Fixtures
**Backend Fixtures**: `NestSync-backend/tests/conftest.py`
- Database session fixtures
- Test user and family fixtures
- Mock service fixtures

**Frontend Fixtures**: `tests/fixtures/`
- Mock API responses
- Test data generators
- Authentication mocks

---

## Continuous Integration

### CI/CD Pipeline Tests

**Pre-commit Checks**:
- Linting (ESLint, Pylint)
- Type checking (TypeScript, mypy)
- Unit tests (fast tests only)

**Pull Request Checks**:
- Full unit test suite
- Integration tests
- Code coverage validation (>80%)

**Deployment Checks**:
- E2E test suite
- Visual regression tests
- Performance benchmarks
- Compliance validation

### GitHub Actions Workflows
```yaml
# .github/workflows/test.yml
name: Test Suite
on: [push, pull_request]
jobs:
  backend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run pytest
        run: |
          cd NestSync-backend
          pip install -r requirements.txt
          pytest --cov=app tests/

  frontend-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run Jest
        run: |
          cd NestSync-frontend
          npm install
          npm test
```

---

## Test Coverage

### Coverage Goals
- **Unit Tests**: >80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: All critical user journeys covered
- **Visual Tests**: All major UI components covered

### Coverage Reports
```bash
# Backend coverage
cd NestSync-backend
pytest --cov=app --cov-report=html tests/
open htmlcov/index.html

# Frontend coverage
cd NestSync-frontend
npm test -- --coverage
open coverage/lcov-report/index.html
```

### Coverage Monitoring
- Track coverage trends over time
- Identify untested code paths
- Prioritize testing for critical features
- Maintain coverage above threshold

---

## Testing Best Practices

### General Principles
1. **Test Behavior, Not Implementation** - Focus on what the code does, not how
2. **Keep Tests Independent** - Each test should run in isolation
3. **Use Descriptive Names** - Test names should explain what they verify
4. **Follow AAA Pattern** - Arrange, Act, Assert
5. **Test Edge Cases** - Include boundary conditions and error scenarios

### Backend Testing
- Use async/await consistently
- Mock external services (Stripe, Supabase)
- Test database transactions and rollbacks
- Validate GraphQL schema compliance
- Test RLS policies and data isolation

### Frontend Testing
- Test user interactions, not implementation details
- Use semantic queries (getByRole, getByLabelText)
- Test accessibility (ARIA labels, keyboard navigation)
- Mock API calls consistently
- Test cross-platform compatibility

### E2E Testing
- Use stable selectors (data-testid, role, text)
- Wait for elements properly (avoid arbitrary timeouts)
- Capture screenshots on failure
- Test critical paths first
- Keep tests maintainable and readable

---

## Debugging Failed Tests

### Common Issues

**Backend Test Failures**:
```bash
# Database connection issues
export DATABASE_URL="postgresql://..."
alembic upgrade head

# Missing dependencies
pip install -r requirements.txt

# Async test issues
# Ensure @pytest.mark.asyncio decorator is present
```

**Frontend Test Failures**:
```bash
# Clear caches
npx expo start --clear
rm -rf node_modules/.cache

# Update snapshots
npm test -- -u

# Debug specific test
npm test -- --watch test-file.spec.ts
```

**Playwright Test Failures**:
```bash
# Run in headed mode
npx playwright test --headed

# Debug mode
npx playwright test --debug

# View trace
npx playwright show-trace trace.zip
```

### Debugging Tools
- **Backend**: pdb, pytest --pdb
- **Frontend**: Chrome DevTools, React DevTools
- **E2E**: Playwright Inspector, trace viewer
- **Database**: psql, Supabase Studio

---

## Test Report Archives

For historical test reports and validation results:

### By Test Type
- [E2E Test Reports](../archives/test-reports/e2e/README.md) - End-to-end test validation
- [Integration Test Reports](../archives/test-reports/integration/README.md) - API and backend testing
- [Visual Test Reports](../archives/test-reports/visual/README.md) - UI and layout validation
- [Compliance Test Reports](../archives/test-reports/compliance/README.md) - PIPEDA and security testing
- [Performance Test Reports](../archives/test-reports/performance/README.md) - Speed and optimization testing

### Recent Archived Reports
1. [Comprehensive User Journey Test (2025-09-04)](../archives/test-reports/e2e/comprehensive-user-journey-test-20250904.md)
2. [API Contract Validation (2025-09-04)](../archives/test-reports/integration/api-contract-validation-20250904.md)
3. [Comprehensive Backend Testing (2025-09-04)](../archives/test-reports/integration/comprehensive-backend-testing-20250904.md)

---

## Related Documentation

### Testing Resources
- **[Troubleshooting Guide](../troubleshooting/README.md)** - Debugging and issue resolution
- **[Development Bottlenecks](../troubleshooting/bottlenecks.md)** - Common testing issues and solutions

### Component-Specific Testing
- **[Backend Testing](../../NestSync-backend/docs/testing/)** - Backend-specific test documentation
- **[Frontend Testing](../../NestSync-frontend/docs/testing/README.md)** - Frontend-specific test documentation

### Architecture & Design
- **[Architecture Documentation](../architecture/README.md)** - System architecture overview
- **[Design Documentation](../../design-documentation/README.md)** - UX and design specifications

---

## Contributing to Tests

### Adding New Tests

1. **Identify Test Category** - Unit, integration, E2E, visual, or compliance
2. **Create Test File** - Follow naming conventions (`test_*.py`, `*.spec.ts`)
3. **Write Test Cases** - Use descriptive names and AAA pattern
4. **Verify Test Passes** - Run locally before committing
5. **Document Test** - Add comments explaining complex test logic

### Test Naming Conventions

**Backend**:
```python
# test_emergency_access.py
def test_emergency_access_token_generation():
    """Test that emergency access tokens are generated correctly"""
    pass

def test_emergency_access_expiration():
    """Test that expired access tokens are properly validated"""
    pass
```

**Frontend**:
```typescript
// emergency-flows.spec.ts
test('should generate emergency access token', async ({ page }) => {
  // Test implementation
});

test('should display emergency contacts', async ({ page }) => {
  // Test implementation
});
```

### Test Review Checklist
- [ ] Test has descriptive name
- [ ] Test is independent and isolated
- [ ] Test uses appropriate assertions
- [ ] Test handles async operations correctly
- [ ] Test includes error scenarios
- [ ] Test is documented with comments
- [ ] Test passes locally
- [ ] Test is added to appropriate test suite

---

*Last Updated: 2025-11-08*
*For historical test reports, see [Test Reports Archive](../archives/test-reports/README.md)*
