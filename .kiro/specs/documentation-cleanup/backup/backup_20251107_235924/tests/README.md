# NestSync Reorder Flow Integration Tests

Comprehensive integration testing for the reorder flow feature using Playwright automation.

## Test Architecture

### Overview
This test suite validates the complete reorder flow functionality across all platforms (iOS, Android, web) with focus on:
- End-to-end user journeys from suggestion to order completion
- Premium feature gating and subscription management
- Canadian compliance (PIPEDA, tax calculations)
- Real-time functionality and GraphQL subscriptions
- Cross-platform consistency and performance

### Test Structure

```
tests/
├── reorder-flow/
│   ├── e2e-complete-flow.spec.ts          # Full reorder journey
│   ├── premium-gating.spec.ts             # Subscription validation
│   ├── cross-platform.spec.ts             # Platform consistency
│   ├── real-time-tracking.spec.ts         # WebSocket functionality
│   ├── canadian-compliance.spec.ts        # PIPEDA and tax validation
│   ├── performance-benchmarks.spec.ts     # Performance validation
│   └── security-validation.spec.ts        # Security testing
├── fixtures/
│   ├── auth.ts                            # Authentication helpers
│   ├── test-data.ts                       # Test data generators
│   └── canadian-tax.ts                    # Tax calculation helpers
├── utils/
│   ├── stripe-helpers.ts                  # Stripe test utilities
│   ├── graphql-helpers.ts                 # GraphQL testing utilities
│   └── platform-helpers.ts               # Cross-platform utilities
└── config/
    ├── playwright.config.ts               # Playwright configuration
    └── environments.ts                    # Environment settings
```

## Test Data

### Test Accounts
- **Primary Test User**: parents@nestsync.com / Shazam11#
- **Premium User**: Created during subscription tests
- **Professional User**: Multi-child management testing

### Test Environment
- **Backend**: http://localhost:8001/graphql
- **Frontend**: http://localhost:8082
- **Database**: Test data with realistic consumption patterns
- **Payment**: Stripe test mode with Canadian test cards

## Platform Coverage

### Desktop Browsers
- Chrome (Canadian locale)
- Firefox (Canadian locale)
- Safari (Canadian locale)

### Mobile Emulation
- iPhone 12 (iOS Safari)
- Pixel 5 (Android Chrome)
- iPad (responsive testing)

### Viewport Testing
- 320px (mobile portrait)
- 768px (tablet)
- 1440px+ (desktop)

## Key Test Scenarios

### 1. Complete Reorder Flow (Happy Path)
- User authentication with test account
- ML prediction generation and confidence scoring
- Multi-retailer comparison with Canadian pricing
- Premium subscription validation and upgrade flow
- Order creation and real-time tracking
- Email confirmation and audit trail validation

### 2. Premium Feature Gating
- Free tier user accessing reorder suggestions
- Premium feature discovery and value presentation
- Stripe PaymentSheet integration with Canadian test cards
- Subscription activation and feature unlock
- Premium-only features accessibility validation

### 3. Cross-Platform Consistency
- Same user flow across iOS simulator, Android emulator, and web browser
- Cross-platform storage synchronization
- Responsive design validation at different viewport sizes
- Performance benchmarking across platforms

### 4. Real-Time Functionality
- GraphQL subscription connection establishment
- Live order status updates and WebSocket messaging
- Network interruption and reconnection handling
- Offline queue functionality and sync on reconnection

### 5. Canadian Compliance Validation
- PIPEDA consent flow and data retention notices
- Canadian tax calculation accuracy (GST/PST/HST)
- Data residency validation and cross-border protection
- Audit trail completeness and retention compliance

### 6. Error Handling and Edge Cases
- Network failures during order processing
- ML prediction service unavailability
- Retailer API timeout and fallback handling
- Invalid payment method and retry flows
- Subscription cancellation and downgrade flows

## Performance Requirements

### ML Prediction Performance
- Consumption forecasting: < 2 seconds
- Prophet model inference: Measured and validated
- Prediction confidence scoring: Accuracy verified

### GraphQL Performance
- Query response times: < 500ms for reorder suggestions
- Subscription connection: < 1 second establishment
- Real-time update latency: < 100ms

### UI Performance
- Component render times: < 16ms for 60fps animations
- Cross-platform storage access: < 100ms
- Premium feature activation: < 2 seconds

## Security Testing

### Payment Security (PCI DSS)
- Stripe integration with Canadian test cards
- Payment method BOLA protection testing
- Secure token handling and storage

### Data Protection (PIPEDA)
- GraphQL query complexity limiting
- Business flow protection against manipulation
- Audit trail validation and completeness

### Access Control
- User authentication and session management
- Premium feature access control validation
- Multi-tenant data isolation testing

## Test Execution

### Prerequisites
```bash
# Install dependencies
npm install @playwright/test
npx playwright install --with-deps

# Start development environment
./docker/docker-dev.sh up

# Verify services are running
curl http://localhost:8001/health
curl http://localhost:8082
```

### Running Tests
```bash
# Run all reorder flow tests
npx playwright test tests/reorder-flow/

# Run specific test suite
npx playwright test tests/reorder-flow/e2e-complete-flow.spec.ts

# Run with UI mode for debugging
npx playwright test --ui

# Run tests on specific browser
npx playwright test --project=chromium

# Run with Canadian locale
npx playwright test --project=canadian-chrome
```

### Test Reports
```bash
# Generate HTML report
npx playwright show-report

# Generate performance report
npm run test:performance-report

# Generate compliance report
npm run test:compliance-report
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Run Reorder Flow Tests
  run: |
    npx playwright test tests/reorder-flow/
    npx playwright-report
```

### Test Artifacts
- Screenshots of test failures
- Video recordings of test execution
- Performance metrics and benchmarks
- Compliance validation reports

## Development Guidelines

### Writing Tests
1. Use descriptive test names that explain the scenario
2. Follow AAA pattern (Arrange, Act, Assert)
3. Include accessibility testing in all UI tests
4. Validate Canadian compliance in payment flows
5. Test error scenarios and edge cases

### Test Data Management
1. Use realistic test data that reflects actual usage patterns
2. Include Canadian addresses and postal codes
3. Use appropriate tax rates for different provinces
4. Generate test data dynamically when possible

### Performance Testing
1. Measure and validate all performance requirements
2. Include network throttling for realistic conditions
3. Test under various load conditions
4. Monitor memory usage and resource consumption

## Troubleshooting

### Common Issues
1. **Network Timeouts**: Increase timeout values for slow operations
2. **Authentication Failures**: Verify test credentials and session management
3. **Cross-Platform Differences**: Use platform-specific selectors when needed
4. **Payment Integration**: Ensure Stripe test mode is configured correctly

### Debug Mode
```bash
# Run with debug output
DEBUG=pw:api npx playwright test

# Run in headed mode
npx playwright test --headed

# Pause execution for debugging
await page.pause()
```

## Compliance and Security Notes

### PIPEDA Compliance
- All tests validate Canadian data privacy requirements
- Test data uses realistic Canadian addresses and information
- Consent flows are thoroughly validated
- Data retention policies are tested and verified

### Security Testing
- Payment flows use Stripe test mode exclusively
- No real payment methods or personal information
- Security headers and protection mechanisms validated
- Access control and authorization thoroughly tested

This comprehensive test suite ensures the reorder flow feature meets all requirements for production deployment while maintaining compliance with Canadian regulations and security standards.