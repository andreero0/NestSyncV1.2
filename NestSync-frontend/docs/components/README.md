# Component Library Documentation

## Overview

NestSync frontend uses a component-based architecture with reusable, composable components following atomic design principles. This documentation covers the complete component library.

## Contents

- [Cards](./cards.md) - Card components for data display
- [Forms](./forms.md) - Form inputs and validation
- [Navigation](./navigation.md) - Navigation components and patterns
- [Modals](./modals.md) - Modal dialogs and overlays
- [Charts](./charts.md) - Data visualization components
- [UI Primitives](./ui-primitives.md) - Base UI components

## Component Categories

### Display Components
Components for displaying data and content:
- **Cards** - Traffic light cards, inventory cards, child profile cards
- **Lists** - Scrollable lists with pull-to-refresh
- **Charts** - Analytics charts and visualizations
- **Timeline** - Activity timeline components

### Input Components
Components for user input:
- **Forms** - Text inputs, selects, date pickers
- **Buttons** - Primary, secondary, icon buttons
- **Toggles** - Switches and checkboxes
- **Sliders** - Range inputs and sliders

### Navigation Components
Components for navigation:
- **Tab Bar** - Bottom tab navigation
- **Header** - Screen headers with actions
- **Drawer** - Side drawer navigation
- **FAB** - Floating action buttons

### Feedback Components
Components for user feedback:
- **Modals** - Dialog boxes and confirmations
- **Toasts** - Temporary notifications
- **Loading** - Loading indicators and skeletons
- **Empty States** - Empty state illustrations

## Design System Compliance

All components follow the NestSync design system:
- Consistent spacing (4px grid)
- Typography scale (heading1-6, body, caption)
- Color palette (primary, secondary, accent, semantic)
- Accessibility standards (WCAG 2.1 AA)

See [Design Documentation](../../../design-documentation/design-system/) for complete design system specifications.

## Component Patterns

### Composition Pattern
```tsx
<Card>
  <Card.Header>
    <Card.Title>Title</Card.Title>
  </Card.Header>
  <Card.Content>
    Content here
  </Card.Content>
</Card>
```

### Render Props Pattern
```tsx
<DataList
  data={items}
  renderItem={(item) => <ItemCard item={item} />}
  renderEmpty={() => <EmptyState />}
/>
```

### Hook-Based State
```tsx
const { data, loading, error } = useChildren();
```

## Accessibility

All components implement accessibility features:
- Semantic HTML/Native elements
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- Sufficient color contrast
- Touch target sizes (44x44pt minimum)

## Testing

Component testing strategies:
- Unit tests for logic
- Component tests for rendering
- Visual regression tests for UI
- Accessibility tests for a11y

See [Testing Documentation](../testing/) for detailed testing guides.

## Performance

Performance considerations:
- Memoization for expensive renders
- Virtualized lists for large datasets
- Lazy loading for heavy components
- Image optimization and caching

## Related Documentation

- [Design System](../../../design-documentation/design-system/) - Visual design specifications
- [Screens](../screens/) - Screen-level implementations
- [State Management](../state-management/) - State patterns

---

[← Back to Frontend Docs](../README.md)
