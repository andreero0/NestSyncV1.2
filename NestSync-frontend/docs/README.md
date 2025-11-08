# NestSync Frontend Documentation

## Overview

This directory contains technical documentation for the NestSync frontend application, including component documentation, screen implementations, state management patterns, and testing strategies. The frontend is built with React Native, Expo, and TypeScript, providing a cross-platform mobile experience for iOS, Android, and web.

## Quick Navigation

### Core Documentation
- [Components](./components/) - Reusable component library documentation
- [Screens](./screens/) - Screen-level implementation details
- [State Management](./state-management/) - Zustand stores and Apollo cache patterns
- [Testing](./testing/) - Testing strategies and test documentation
- [Archives](./archives/) - Historical implementation reports and fixes

### Most Referenced Documents
- [Dashboard Screen](./screens/dashboard.md) - Traffic light inventory system
- [Card Components](./components/cards.md) - Traffic light cards and inventory cards
- [Zustand Stores](./state-management/zustand-stores.md) - App-wide state management
- [Playwright Testing](./testing/playwright.md) - End-to-end test patterns
- [Design System Compliance](./archives/implementation-reports/design-system/) - Design system implementation

### Cross-References
- [Design Documentation](../../design-documentation/) - **Authoritative design specifications**
- [Backend API Documentation](../../NestSync-backend/docs/) - GraphQL API and backend services
- [Root Documentation](../../docs/) - Project-wide setup and architecture
- [Project Documentation](../../project-documentation/) - Business strategy and architecture

## Documentation Structure

### 📦 Components (`components/`)
Reusable component library documentation following atomic design principles.

**What's Inside**:
- **[Cards](./components/cards.md)** - Traffic light cards, inventory cards, child profile cards
- **[Forms](./components/forms.md)** - Form inputs, validation, and submission patterns
- **[Navigation](./components/navigation.md)** - Tab bar, headers, drawers, and FAB components
- **[Modals](./components/modals.md)** - Dialog boxes, confirmations, and overlays
- **[Charts](./components/charts.md)** - Analytics visualizations and data displays
- **[UI Primitives](./components/ui-primitives.md)** - Base components (buttons, text, containers)

**Design Reference**: All components implement the [NestSync Design System](../../design-documentation/design-system/)

### 📱 Screens (`screens/`)
Screen-level implementation details and navigation flows.

**What's Inside**:
- **[Dashboard](./screens/dashboard.md)** - Main dashboard with traffic light inventory status
- **[Timeline](./screens/timeline.md)** - Activity timeline and usage history
- **[Profile](./screens/profile.md)** - User profile, settings, and family management
- **[Inventory](./screens/inventory.md)** - Inventory list, add/edit, and reorder screens
- **[Subscription](./screens/subscription.md)** - Subscription plans and payment management

**Design Reference**: Screen designs are documented in [Feature Documentation](../../design-documentation/features/)

### 🔄 State Management (`state-management/`)
State management patterns using Zustand, Apollo Client, and MMKV.

**What's Inside**:
- **[Zustand Stores](./state-management/zustand-stores.md)** - App-wide state management patterns
- **[Apollo Cache](./state-management/apollo-cache.md)** - GraphQL cache management and optimistic updates
- **[Storage Patterns](./state-management/storage.md)** - MMKV local storage and persistence
- **[State Synchronization](./state-management/synchronization.md)** - Sync strategies between local and server state

**Architecture Reference**: See [State Management Architecture](../../project-documentation/mmkv-architecture-analysis.md)

### 🧪 Testing (`testing/`)
Testing strategies, guides, and best practices.

**What's Inside**:
- **[Playwright](./testing/playwright.md)** - End-to-end testing with Playwright
- **[Unit Tests](./testing/unit-tests.md)** - Component and hook testing with Jest
- **[Visual Regression](./testing/visual-regression.md)** - Visual testing and screenshot comparison
- **[Accessibility Testing](./testing/accessibility.md)** - A11y testing and WCAG compliance

**Test Reports**: Historical test results are in [Archives - Test Reports](./archives/)

### 📚 Archives (`archives/`)
Historical documentation for reference and context.

**What's Inside**:
- **[Implementation Reports](./archives/implementation-reports/)** - Feature implementations and UI enhancements
  - [Premium Subscription UI](./archives/implementation-reports/subscription-ui/)
  - [Design System Compliance](./archives/implementation-reports/design-system/)
  - [Traffic Light Dashboard](./archives/implementation-reports/traffic-light-dashboard/)
  - [Payment System](./archives/implementation-reports/payment-system/)
- **Test Reports** - Historical test execution results (see [Root Archives - Test Reports](../../docs/archives/test-reports/))
- **Fixes** - Bug fixes and issue resolutions (see [Root Archives - Fixes](../../docs/archives/fixes/))

**Note**: Frontend-specific test reports and fixes are also archived in the [root archives](../../docs/archives/) for project-wide visibility.

## Getting Started

### For New Frontend Developers
1. **Environment Setup**: Follow [Root Setup Documentation](../../docs/setup/) for development environment
2. **Architecture Overview**: Read [Frontend Architecture](../../project-documentation/feature-architecture-analysis.md)
3. **Component Library**: Review [Components](./components/) to understand available UI components
4. **Screen Architecture**: Study [Screens](./screens/) to understand navigation and screen structure
5. **State Patterns**: Check [State Management](./state-management/) for data flow and state patterns
6. **Testing Practices**: Review [Testing Guide](./testing/) for testing standards
7. **Design System**: Familiarize yourself with [Design Documentation](../../design-documentation/) - the authoritative design source

**Quick Start Checklist**:
- [ ] Clone repository and install dependencies
- [ ] Set up environment variables (`.env.local`)
- [ ] Run `npm start` to start Expo development server
- [ ] Review [Dashboard Screen](./screens/dashboard.md) as a reference implementation
- [ ] Read [Zustand Stores](./state-management/zustand-stores.md) for state patterns

### For UI/UX Designers
1. **Design System**: Start with [Design Documentation](../../design-documentation/) - **this is the authoritative source**
2. **Implemented Components**: Review [Component Documentation](./components/) for what's built
3. **Screen Implementations**: Check [Screen Documentation](./screens/) for current UI implementations
4. **Design Compliance**: See [Design System Compliance Report](./archives/implementation-reports/design-system/) for implementation status
5. **Feature Designs**: Review [Feature Documentation](../../design-documentation/features/) for feature-specific designs

**Design Authority**: The [design-documentation](../../design-documentation/) directory is the single source of truth for all design decisions. Implementation reports document how designs were built, but do not override design specifications.

### For QA Engineers
1. **Testing Overview**: Review [Testing Documentation](./testing/)
2. **E2E Testing**: Check [Playwright Tests](./testing/playwright.md) for end-to-end test patterns
3. **Visual Testing**: Review [Visual Regression](./testing/visual-regression.md) for UI testing
4. **Test Reports**: Browse [Archives](./archives/) for historical test results
5. **Manual Testing**: See [Manual Testing Guide](../../NestSync-frontend/MANUAL_TESTING_GUIDE.md) for manual test scenarios

**Test Execution**:
- E2E tests: `npm run test:e2e`
- Unit tests: `npm test`
- Visual regression: `npm run test:visual`

### For Backend Developers
1. **API Integration**: Review [Backend API Documentation](../../NestSync-backend/docs/api/)
2. **GraphQL Schema**: Check [GraphQL Schema](../../NestSync-backend/docs/schema.graphql)
3. **State Management**: See [Apollo Cache](./state-management/apollo-cache.md) for how frontend consumes GraphQL
4. **Authentication**: Review [Auth Context](./state-management/zustand-stores.md#auth-store) for frontend auth flow

## Technology Stack

### Core Framework
- **React Native** - Cross-platform mobile framework
- **Expo** - Development and build tooling
- **TypeScript** - Type-safe development

### UI & Styling
- **NativeWind** - Tailwind CSS for React Native
- **React Native Paper** - Material Design components
- **Expo Router** - File-based routing

### State Management
- **Zustand** - Lightweight state management
- **Apollo Client** - GraphQL client and cache
- **MMKV** - Fast, encrypted local storage

### Testing
- **Playwright** - End-to-end testing
- **Jest** - Unit testing
- **React Native Testing Library** - Component testing

## Architecture Patterns

### Component Architecture
- Atomic design principles
- Composition over inheritance
- Prop-driven components
- Controlled vs uncontrolled patterns

### State Management
- Local state for UI concerns
- Zustand for app-wide state
- Apollo cache for server data
- MMKV for persistent storage

### Navigation
- File-based routing with Expo Router
- Type-safe navigation
- Deep linking support
- Authentication guards

## Key Features & Documentation

### Traffic Light Inventory System
The core feature of NestSync - visual inventory status using color-coded cards.

**Documentation**:
- **Design**: [Traffic Light Dashboard Design](../../design-documentation/features/dashboard-traffic-light/)
- **Implementation**: [Dashboard Screen](./screens/dashboard.md)
- **Components**: [Traffic Light Cards](./components/cards.md)
- **State**: [Inventory Traffic Light Hook](./state-management/zustand-stores.md#inventory-store)
- **Archive**: [Implementation Report](./archives/implementation-reports/traffic-light-dashboard/)

### Premium Subscription System
Subscription management with Stripe integration for iOS, Android, and web.

**Documentation**:
- **Design**: [Subscription Feature Design](../../design-documentation/features/subscription/)
- **Implementation**: [Subscription Screen](./screens/subscription.md)
- **Payment Flow**: [Payment System Archive](./archives/implementation-reports/payment-system/)
- **Backend Integration**: [Backend Subscription API](../../NestSync-backend/docs/api/)

### Timeline & Analytics
Activity tracking and usage analytics for parents.

**Documentation**:
- **Design**: [Timeline Feature Design](../../design-documentation/features/timeline/)
- **Implementation**: [Timeline Screen](./screens/timeline.md)
- **Charts**: [Chart Components](./components/charts.md)
- **Architecture**: [Analytics Architecture](../../project-documentation/analytics-dashboard-architecture.md)

### Family Collaboration
Multi-caregiver support with role-based access.

**Documentation**:
- **Design**: [Collaboration Feature Design](../../design-documentation/features/collaboration/)
- **State**: [Collaboration Store](./state-management/zustand-stores.md#collaboration-store)
- **Architecture**: [Collaboration Architecture](../../project-documentation/caregiver-collaboration-architecture.md)

## Related Documentation

### Design Documentation (Authoritative)
- **[Design System](../../design-documentation/design-system/)** - Visual design system, typography, colors, spacing
- **[Features](../../design-documentation/features/)** - Feature-specific design specifications
- **[Accessibility](../../design-documentation/accessibility/)** - Accessibility guidelines and WCAG compliance
- **[Implementation Guides](../../design-documentation/implementation/)** - Design implementation guidance

**Important**: Design documentation is the authoritative source for all design decisions. Implementation reports document execution but do not override design specifications.

### Backend Documentation
- **[API Documentation](../../NestSync-backend/docs/api/)** - GraphQL API, resolvers, and mutations
- **[Database Schema](../../NestSync-backend/docs/database/)** - Database structure and relationships
- **[Deployment](../../NestSync-backend/docs/deployment/)** - Backend deployment and configuration

### Project Documentation
- **[Architecture](../../project-documentation/)** - System architecture and technical decisions
- **[Business Strategy](../../project-documentation/)** - Product strategy and business logic
- **[Analytics Architecture](../../project-documentation/analytics-dashboard-architecture.md)** - Analytics system design

### Root Documentation
- **[Setup Guides](../../docs/setup/)** - Development environment setup
- **[Troubleshooting](../../docs/troubleshooting/)** - Common issues and solutions
- **[Testing](../../docs/testing/)** - Project-wide testing strategies
- **[Compliance](../../docs/compliance/)** - PIPEDA and security compliance
- **[Archives](../../docs/archives/)** - Project-wide historical documentation

## Documentation Standards

### File Organization
- **Components**: Place in `components/` with descriptive names (e.g., `cards.md`, `forms.md`)
- **Screens**: Place in `screens/` matching screen names (e.g., `dashboard.md`, `timeline.md`)
- **State Management**: Place in `state-management/` by pattern (e.g., `zustand-stores.md`, `apollo-cache.md`)
- **Testing**: Place in `testing/` by test type (e.g., `playwright.md`, `unit-tests.md`)
- **Archives**: Historical reports go in `archives/` organized by category

### Documentation Format
Each documentation file should include:
- **Overview** - Brief description of the topic
- **Contents** - Table of contents for navigation
- **Implementation Details** - Technical details and code examples
- **Related Documentation** - Cross-references to related docs
- **Back Link** - Link back to this README

### Cross-Referencing
- Use relative paths for all internal links
- Reference design documentation as the authoritative source
- Link to backend documentation for API details
- Include links to archived implementation reports for historical context

### Archiving Guidelines
Archive documentation when:
- Implementation report is complete and feature is stable
- Test report is historical (not current testing guide)
- Bug fix is resolved and documented
- UI/UX improvement is implemented and validated

**Do Not Archive**:
- Active component documentation
- Current screen documentation
- Active testing guides
- Design documentation (always keep in design-documentation/)

## Contributing

### Adding New Documentation
1. Create documentation in appropriate directory
2. Follow documentation format standards
3. Add cross-references to related docs
4. Update this README with new sections
5. Validate all links work correctly

### Updating Existing Documentation
1. Update the relevant documentation file
2. Update "Last Updated" date in file
3. Update cross-references if structure changes
4. Validate links still work

### Archiving Documentation
1. Move completed implementation reports to `archives/implementation-reports/`
2. Update archive README with new entry
3. Add cross-references from active docs to archived docs
4. Remove archived content from active documentation

## Maintenance

This documentation is actively maintained by the frontend development team. 

**Documentation Owner**: Frontend Development Team  
**Review Cycle**: Monthly review of active documentation  
**Archive Policy**: Implementation reports archived after feature completion

### Quick Maintenance Checklist
- [ ] All links resolve correctly
- [ ] New features have documentation
- [ ] Completed features archived appropriately
- [ ] Cross-references are up to date
- [ ] Design documentation remains authoritative
- [ ] Testing guides reflect current practices

## Need Help?

- **Setup Issues**: See [Root Setup Documentation](../../docs/setup/)
- **Technical Questions**: Check [Troubleshooting](../../docs/troubleshooting/)
- **Design Questions**: Refer to [Design Documentation](../../design-documentation/)
- **API Questions**: See [Backend Documentation](../../NestSync-backend/docs/)
- **Historical Context**: Browse [Archives](./archives/)

---

**Last Updated**: 2025-11-08  
**Maintained By**: Frontend Development Team  
**Documentation Version**: 2.0

[← Back to Root Documentation](../../docs/) | [Design Documentation](../../design-documentation/) | [Backend Documentation](../../NestSync-backend/docs/)
