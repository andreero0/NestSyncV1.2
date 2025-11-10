# Requirements Document

## Introduction

This specification addresses critical user-reported issues and design inconsistencies across the NestSync React Native/Expo application. The system currently has reference screens (home, settings, onboarding) that demonstrate proper design system implementation, but other screens (premium upgrade, reorder flow, size prediction, payments) deviate from established design patterns. Additionally, several critical user experience issues are blocking core functionality including child selection state management, subscription cancellation, and navigation problems.

## Glossary

- **Design System**: The collection of reusable design tokens, components, and patterns that define the visual language of the application
- **Design Token**: A named variable representing a design decision (color, spacing, typography, shadow, border radius)
- **Trial Banner**: A UI component that displays subscription status and trial countdown information
- **Free Trial User**: A user who has not yet subscribed to a paid plan but is within their trial period
- **Subscribed Trial User**: A user who has subscribed to a paid plan but whose subscription has not yet activated (still in trial period)
- **Active Paid User**: A user with an active, paid subscription
- **Touch Target**: The interactive area of a UI element that responds to user input
- **FAB**: Floating Action Button - a circular button that floats above content
- **P0 Issue**: Priority 0 - Critical issue that blocks core functionality
- **P1 Issue**: Priority 1 - High priority issue that significantly degrades user experience
- **P2 Issue**: Priority 2 - Medium priority issue that causes minor inconsistencies
- **Provincial Tax**: Canadian sales tax that varies by province (GST, PST, HST)
- **Playwright MCP**: Model Context Protocol integration for Playwright browser automation and testing
- **Visual Regression Test**: Automated test that compares screenshots to detect unintended visual changes

## Requirements

### Requirement 1: Critical User Issue Resolution

**User Story:** As a user of the NestSync application, I want all critical functionality to work correctly so that I can manage my children's profiles, subscriptions, and navigate the application without errors.

#### Acceptance Criteria

1. WHEN a user selects a child on the Dashboard, THE Application SHALL maintain that child selection state across all components including the FAB modal
2. WHEN a user clicks the "Cancel Subscription" button on the Subscription Management screen, THE Application SHALL successfully process the cancellation request and display appropriate confirmation or error messages
3. WHEN a user navigates to the Add Order screen, View All Items screen, or Setup New Item screen, THE Application SHALL display a functional back button that returns the user to the previous screen
4. WHEN a user views the Smart Order Suggestions card on the Dashboard, THE Application SHALL either display functional "Reorder Now" and "Compare Prices" buttons or display a clear "Demo Mode" indicator

### Requirement 2: User Experience Improvements

**User Story:** As a user of the NestSync application, I want consistent and polished user interface elements so that the application feels professional and is easy to use.

#### Acceptance Criteria

1. WHEN a child's name is displayed in the child selector component, THE Application SHALL render the full name without inappropriate line breaks or truncation
2. WHEN a user interacts with buttons across different screens, THE Application SHALL present consistent button styling that matches the design system
3. WHEN a user views placeholder or demo content, THE Application SHALL display clear indicators distinguishing demo content from real data
4. WHEN a user views order cards with "PENDING" status, THE Application SHALL display badge styling that matches the design system tokens
5. WHEN a user views the Size Guide screen tabs, THE Application SHALL render tab navigation with clear scroll indicators and consistent styling

### Requirement 3: Trial Banner Logic Separation

**User Story:** As a developer maintaining the NestSync application, I want trial banner display logic separated from presentation components so that the logic is reusable, testable, and maintainable.

#### Acceptance Criteria

1. THE Application SHALL provide a TrialBannerLogic module that exports a determineBannerType function accepting subscription state and returning the appropriate banner type
2. THE TrialBannerLogic module SHALL provide type guard functions isFreeTrialUser, isSubscribedTrialUser, and isActivePaidUser that accept subscription state and return boolean values
3. THE TrialBannerLogic module SHALL include comprehensive TypeScript interfaces defining all subscription state types
4. THE TrialBannerLogic module SHALL include JSDoc documentation for all exported functions describing parameters, return values, and usage examples

### Requirement 4: Subscribed Trial User Banner Display

**User Story:** As a user who has subscribed during my trial period, I want to see a success-themed banner showing when my paid plan will activate so that I understand my subscription status clearly.

#### Acceptance Criteria

1. WHEN a subscribed trial user views screens with trial banners, THE Application SHALL display a SubscribedTrialBanner component with success-themed styling including a green gradient background
2. THE SubscribedTrialBanner component SHALL display a checkmark icon indicating successful subscription
3. THE SubscribedTrialBanner component SHALL display activation countdown messaging showing the number of days until the paid plan activates
4. THE SubscribedTrialBanner component SHALL display the subscribed plan name and pricing information with tax-inclusive amounts
5. THE SubscribedTrialBanner component SHALL display provincial tax breakdown showing GST, PST, or HST percentages based on the user's province
6. THE SubscribedTrialBanner component SHALL provide a "Manage" button with a minimum 48px touch target that navigates to subscription management
7. THE SubscribedTrialBanner component SHALL include accessibility labels and hints for screen reader support

### Requirement 5: Trial Banner Component Refactoring

**User Story:** As a user of the NestSync application, I want to see accurate trial banner information based on my subscription state so that I am not confused by contradictory messages.

#### Acceptance Criteria

1. THE TrialCountdownBanner component SHALL import and use the TrialBannerLogic module to determine banner visibility
2. WHEN a free trial user views the banner, THE TrialCountdownBanner component SHALL display upgrade messaging with a minimum 48px touch target upgrade button
3. WHEN a subscribed trial user views the banner, THE TrialCountdownBanner component SHALL render the SubscribedTrialBanner component instead of upgrade messaging
4. WHEN an active paid user views screens with trial banners, THE Application SHALL not display any trial banner
5. THE TrialCountdownBanner component SHALL display tax-inclusive pricing with Canadian provincial tax calculations showing GST, PST, or HST
6. THE TrialCountdownBanner component SHALL include accessibility attributes including accessibilityRole, accessibilityLabel, and accessibilityHint for all interactive elements

### Requirement 6: Design System Compliance

**User Story:** As a user of the NestSync application, I want all screens to have consistent visual design so that the application feels cohesive and professional.

#### Acceptance Criteria

1. THE Application SHALL apply design system tokens for colors, typography, spacing, shadows, and border radius to all premium upgrade flow components
2. THE Application SHALL apply design system tokens for colors, typography, spacing, shadows, and border radius to all reorder flow components
3. THE Application SHALL apply design system tokens for colors, typography, spacing, shadows, and border radius to all size prediction interface components
4. THE Application SHALL apply design system tokens for colors, typography, spacing, shadows, and border radius to all payment-related screen components
5. THE Application SHALL use a 4px base unit spacing system consistently across all components
6. THE Application SHALL ensure all interactive buttons have a minimum 48px touch target size
7. THE Application SHALL use consistent icon sizing and colors matching the core navigation patterns

### Requirement 7: Design System Documentation and Validation

**User Story:** As a developer maintaining the NestSync application, I want comprehensive design system documentation and automated validation so that future features maintain design consistency.

#### Acceptance Criteria

1. THE Application SHALL provide a design system compliance checklist documenting all design tokens with specific values for colors, typography, spacing, shadows, and borders
2. THE Application SHALL provide component usage guidelines with examples of correct design system application
3. THE Application SHALL archive before and after screenshots to the design-documentation/validation directory
4. THE Application SHALL provide a comprehensive design audit report comparing inconsistent screens against reference screen tokens
5. THE Application SHALL document lessons learned for maintaining design consistency in future feature development

### Requirement 8: Automated Visual Regression Testing

**User Story:** As a developer maintaining the NestSync application, I want automated visual regression tests so that design consistency is maintained and regressions are caught early.

#### Acceptance Criteria

1. THE Application SHALL provide Playwright visual regression tests that capture screenshots of trial banner states including free trial, subscribed trial, active paid, and expired trial scenarios
2. THE Application SHALL provide Playwright visual regression tests that capture screenshots of premium upgrade flow screens, reorder flow screens, and size prediction screens
3. THE Application SHALL validate color usage against design tokens in automated tests
4. THE Application SHALL validate typography against design system specifications in automated tests
5. THE Application SHALL validate spacing against the 4px base unit system in automated tests
6. THE Application SHALL validate touch target sizes meet the minimum 48px requirement in automated tests
7. THE Application SHALL test Canadian tax calculations for all provinces in automated tests

### Requirement 9: Accessibility Compliance

**User Story:** As a user with accessibility needs, I want the NestSync application to support screen readers and provide adequate touch targets so that I can use the application effectively.

#### Acceptance Criteria

1. THE Application SHALL provide accessibility labels for all interactive elements that describe their purpose to screen reader users
2. THE Application SHALL provide accessibility hints for all interactive elements that describe the result of interaction
3. THE Application SHALL ensure all interactive elements have a minimum 48px touch target size for users with motor impairments
4. THE Application SHALL support keyboard navigation for all interactive elements on web platforms
5. THE Application SHALL meet WCAG AA compliance standards for color contrast, text sizing, and interactive element spacing

### Requirement 10: Canadian Tax Display

**User Story:** As a Canadian user of the NestSync application, I want to see tax-inclusive pricing with provincial tax breakdown so that I understand the total cost of my subscription.

#### Acceptance Criteria

1. WHEN a user views subscription pricing, THE Application SHALL display tax-inclusive amounts that include applicable provincial taxes
2. THE Application SHALL display the provincial tax name (GST, PST, or HST) based on the user's province
3. THE Application SHALL display the provincial tax percentage based on the user's province
4. THE Application SHALL provide a fallback tax display for users in provinces with unknown tax configurations
5. THE Application SHALL calculate combined GST and PST for provinces that use both tax types
