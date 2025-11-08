# Screen Documentation

## Overview

NestSync frontend is organized into screens that represent distinct user-facing views. This documentation covers screen architecture, implementation patterns, and navigation flows.

## Contents

- [Dashboard](./dashboard.md) - Main dashboard with traffic light system
- [Timeline](./timeline.md) - Activity timeline and history
- [Profile](./profile.md) - User profile and settings
- [Inventory](./inventory.md) - Inventory management screens
- [Subscription](./subscription.md) - Subscription and payment screens

## Screen Architecture

### Screen Structure
Each screen follows a consistent structure:
```
screens/
├── ScreenName.tsx          # Main screen component
├── components/             # Screen-specific components
├── hooks/                  # Screen-specific hooks
└── utils/                  # Screen-specific utilities
```

### Screen Lifecycle
1. **Mount** - Load initial data, set up subscriptions
2. **Render** - Display UI with loading/error states
3. **Interaction** - Handle user actions and updates
4. **Unmount** - Clean up subscriptions and timers

## Core Screens

### Dashboard (`/(tabs)/index.tsx`)
Main dashboard featuring:
- Traffic light inventory status cards
- Quick actions (Add Item, Reorder)
- Family context switcher
- Trial banner for free users

**Key Features**:
- Real-time inventory status
- Color-coded status indicators (green/yellow/red)
- Responsive grid layout
- Pull-to-refresh

### Timeline (`/(tabs)/timeline.tsx`)
Activity timeline showing:
- Usage events
- Inventory changes
- Reorder activities
- Growth milestones

**Key Features**:
- Chronological event list
- Filterable by child and event type
- Infinite scroll pagination
- Event grouping by date

### Profile (`/(tabs)/profile.tsx`)
User profile and settings:
- User information
- Family management
- Notification preferences
- Subscription status
- App settings

**Key Features**:
- Profile editing
- Family member management
- Notification configuration
- Theme selection

### Inventory Management
Inventory-related screens:
- Inventory list view
- Add/edit inventory item
- Item details
- Reorder suggestions

**Key Features**:
- Searchable inventory list
- Category filtering
- Size tracking
- Usage history

### Subscription Management
Subscription and payment screens:
- Subscription plans
- Payment methods
- Billing history
- Trial information

**Key Features**:
- Plan comparison
- Secure payment processing
- Subscription management
- Trial countdown

## Navigation Patterns

### Tab Navigation
Bottom tab bar with main sections:
- Dashboard (Home)
- Timeline (Activity)
- Profile (Settings)

### Stack Navigation
Nested navigation within tabs:
- Modal presentations
- Detail screens
- Form screens

### Deep Linking
Support for deep links:
- `/inventory/:id` - Inventory item details
- `/subscription/upgrade` - Subscription upgrade
- `/profile/settings` - Settings screen

## State Management

### Screen-Level State
- Local UI state (form inputs, modals)
- Loading and error states
- Pagination state

### Global State
- User authentication
- Family context
- Subscription status
- App preferences

See [State Management](../state-management/) for detailed patterns.

## Data Loading

### Initial Load
```tsx
const { data, loading, error } = useQuery(GET_CHILDREN);

if (loading) return <LoadingScreen />;
if (error) return <ErrorScreen error={error} />;
return <ScreenContent data={data} />;
```

### Refresh
```tsx
const [refreshing, setRefreshing] = useState(false);

const onRefresh = async () => {
  setRefreshing(true);
  await refetch();
  setRefreshing(false);
};
```

## Error Handling

### Error States
- Network errors
- Authentication errors
- Validation errors
- Server errors

### Error UI
- Inline error messages
- Error screens with retry
- Toast notifications
- Form validation feedback

## Performance

### Optimization Strategies
- Lazy loading for heavy screens
- Memoization for expensive renders
- Virtualized lists for large datasets
- Image optimization and caching
- Code splitting by route

## Accessibility

### Screen Accessibility
- Semantic navigation structure
- Focus management
- Screen reader announcements
- Keyboard navigation support

## Testing

### Screen Testing
- E2E tests for user flows
- Component tests for screen logic
- Visual regression tests
- Accessibility tests

See [Testing Documentation](../testing/) for detailed guides.

## Related Documentation

- [Components](../components/) - Reusable component library
- [State Management](../state-management/) - State patterns
- [Design Documentation](../../../design-documentation/features/) - Feature designs

---

[← Back to Frontend Docs](../README.md)
