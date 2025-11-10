# EmptyState and DemoBadge Usage Guidelines

**Last Updated**: 2025-01-09  
**Components**: `components/ui/EmptyState.tsx`, `components/ui/DemoBadge.tsx`

## Overview

The EmptyState and DemoBadge components provide consistent patterns for displaying empty states and marking demo/placeholder content across the NestSync application.

## EmptyState Component

### Purpose

EmptyState provides a consistent, user-friendly way to display when no data is available. It helps users understand why content is missing and provides clear actions to resolve the empty state.

### Basic Usage

```tsx
import { EmptyState } from '@/components/ui/EmptyState';

<EmptyState
  icon="cube.box"
  title="No Items"
  description="Add your first item to get started"
  actionLabel="Add Item"
  onAction={handleAddItem}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | required | SF Symbol icon name |
| `iconSize` | `number` | `48` | Icon size in pixels |
| `title` | `string` | required | Main title text |
| `description` | `string` | required | Description text |
| `actionLabel` | `string` | optional | Primary action button label |
| `onAction` | `() => void` | optional | Primary action handler |
| `secondaryActionLabel` | `string` | optional | Secondary action button label |
| `onSecondaryAction` | `() => void` | optional | Secondary action handler |
| `style` | `ViewStyle` | optional | Custom style override |
| `testID` | `string` | optional | Test ID for testing |

### Preset Empty States

The component includes preset configurations for common scenarios:

#### NoChildrenEmptyState

```tsx
import { NoChildrenEmptyState } from '@/components/ui/EmptyState';

<NoChildrenEmptyState onAddChild={handleAddChild} />
```

**Use when**: User has no children added to their account.

#### NoInventoryEmptyState

```tsx
import { NoInventoryEmptyState } from '@/components/ui/EmptyState';

<NoInventoryEmptyState onAddItem={handleAddItem} />
```

**Use when**: User has no inventory items.

#### NoActivityEmptyState

```tsx
import { NoActivityEmptyState } from '@/components/ui/EmptyState';

<NoActivityEmptyState onLogChange={handleLogChange} />
```

**Use when**: User has no recent activity to display.

#### NoOrdersEmptyState

```tsx
import { NoOrdersEmptyState } from '@/components/ui/EmptyState';

<NoOrdersEmptyState onCreateOrder={handleCreateOrder} />
```

**Use when**: User has no upcoming orders.

#### NoDataEmptyState

```tsx
import { NoDataEmptyState } from '@/components/ui/EmptyState';

<NoDataEmptyState />
```

**Use when**: Generic no data scenario (no action needed).

### Multiple Actions

```tsx
<EmptyState
  icon="chart.bar"
  title="No Analytics Data"
  description="Start tracking to see analytics"
  actionLabel="Log Change"
  onAction={handleLogChange}
  secondaryActionLabel="Learn More"
  onSecondaryAction={handleLearnMore}
/>
```

### Custom Styling

```tsx
<EmptyState
  icon="cube.box"
  title="Custom Empty State"
  description="With custom styling"
  actionLabel="Action"
  onAction={handleAction}
  style={{
    marginVertical: 40,
    padding: 48,
  }}
/>
```

## DemoBadge Component

### Purpose

DemoBadge marks demo, placeholder, sample, or test content to help users distinguish between real data and temporary content.

### Basic Usage

```tsx
import { DemoBadge } from '@/components/ui/DemoBadge';

<DemoBadge variant="demo" />
<DemoBadge variant="sample" text="Sample Data" />
<DemoBadge variant="placeholder" inline />
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'demo' \| 'sample' \| 'placeholder' \| 'test'` | `'demo'` | Badge variant |
| `text` | `string` | optional | Custom text (overrides default) |
| `showIcon` | `boolean` | `true` | Show icon |
| `inline` | `boolean` | `false` | Inline display (smaller) |
| `style` | `ViewStyle` | optional | Custom style override |
| `textStyle` | `TextStyle` | optional | Custom text style override |
| `testID` | `string` | optional | Test ID for testing |

### Variants

#### Demo Variant

```tsx
<DemoBadge variant="demo" />
// Displays: "DEMO" with eye icon
// Color: Amber (#D97706)
```

**Use when**: Content is for demonstration purposes.

#### Sample Variant

```tsx
<DemoBadge variant="sample" />
// Displays: "SAMPLE" with document icon
// Color: Blue (#0891B2)
```

**Use when**: Content is sample data to show features.

#### Placeholder Variant

```tsx
<DemoBadge variant="placeholder" />
// Displays: "PLACEHOLDER" with dashed square icon
// Color: Gray (textSecondary)
```

**Use when**: Content is a placeholder waiting for real data.

#### Test Variant

```tsx
<DemoBadge variant="test" />
// Displays: "TEST" with wrench icon
// Color: Purple (#7C3AED)
```

**Use when**: Content is test data for development.

### Inline Display

For compact UIs, use the inline prop:

```tsx
<View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
  <Text>Order #1234</Text>
  <DemoBadge variant="demo" inline />
</View>
```

### Custom Text

```tsx
<DemoBadge variant="sample" text="PREVIEW" />
<DemoBadge variant="demo" text="COMING SOON" />
```

### Preset Badges

```tsx
import {
  DemoContentBadge,
  SampleDataBadge,
  PlaceholderBadge,
  TestDataBadge,
} from '@/components/ui/DemoBadge';

<DemoContentBadge />
<SampleDataBadge />
<PlaceholderBadge />
<TestDataBadge />
```

## DemoBanner Component

### Purpose

DemoBanner provides a full-width banner for marking entire sections as demo content. More prominent than a badge.

### Basic Usage

```tsx
import { DemoBanner } from '@/components/ui/DemoBadge';

<DemoBanner variant="demo" />
<DemoBanner
  variant="sample"
  message="This feature is in preview mode"
  dismissible
  onDismiss={handleDismiss}
/>
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'demo' \| 'sample' \| 'placeholder' \| 'test'` | `'demo'` | Banner variant |
| `message` | `string` | optional | Custom message |
| `dismissible` | `boolean` | `false` | Show dismiss button |
| `onDismiss` | `() => void` | optional | Dismiss handler |
| `style` | `ViewStyle` | optional | Custom style override |
| `testID` | `string` | optional | Test ID for testing |

### Examples

#### Basic Banner

```tsx
<DemoBanner variant="demo" />
// Displays: "This is demo content for preview purposes"
```

#### Custom Message

```tsx
<DemoBanner
  variant="sample"
  message="This is sample data to help you explore features"
/>
```

#### Dismissible Banner

```tsx
const [showBanner, setShowBanner] = useState(true);

{showBanner && (
  <DemoBanner
    variant="demo"
    dismissible
    onDismiss={() => setShowBanner(false)}
  />
)}
```

## Common Patterns

### Empty State with Loading

```tsx
{isLoading ? (
  <ActivityIndicator size="large" color={colors.tint} />
) : data.length === 0 ? (
  <NoDataEmptyState />
) : (
  <DataList data={data} />
)}
```

### Empty State with Error

```tsx
{error ? (
  <EmptyState
    icon="exclamationmark.triangle"
    title="Error Loading Data"
    description={error.message}
    actionLabel="Try Again"
    onAction={handleRetry}
  />
) : data.length === 0 ? (
  <NoDataEmptyState />
) : (
  <DataList data={data} />
)}
```

### Demo Badge on Card

```tsx
<View style={styles.card}>
  <View style={styles.cardHeader}>
    <Text style={styles.cardTitle}>Feature Name</Text>
    <DemoBadge variant="demo" inline />
  </View>
  <Text style={styles.cardContent}>
    This is demo content...
  </Text>
</View>
```

### Demo Banner at Top of Screen

```tsx
<ScrollView>
  <DemoBanner
    variant="sample"
    message="You're viewing sample data. Add your own to get started."
    dismissible
    onDismiss={handleDismissBanner}
  />
  
  {/* Rest of content */}
</ScrollView>
```

### Conditional Demo Badge

```tsx
<View style={styles.item}>
  <Text style={styles.itemName}>{item.name}</Text>
  {item.isDemo && <DemoBadge variant="demo" inline />}
</View>
```

## Design System Compliance

### EmptyState

- **Spacing**: Uses 4px base unit (padding: 32px, gap: 16px)
- **Border Radius**: 16px (design system standard)
- **Typography**: Title (20px, 700), Body (16px, 400)
- **Colors**: Uses design tokens (colors.surface, colors.border, colors.text)
- **Touch Targets**: Buttons meet 48px minimum

### DemoBadge

- **Spacing**: Uses 4px base unit (padding: 4-10px, gap: 4-6px)
- **Border Radius**: 4-6px (small elements)
- **Typography**: Caption (11px, 600), Extra Small (10px, 600)
- **Colors**: Uses NestSyncColors design tokens
- **Variants**: Consistent color coding across app

### DemoBanner

- **Spacing**: Uses 4px base unit (padding: 12px, gap: 12px)
- **Border Radius**: 8px (medium elements)
- **Typography**: Body (14px, 500)
- **Colors**: Uses NestSyncColors design tokens
- **Touch Targets**: Dismiss button meets 48px minimum

## Accessibility

### EmptyState

- ✅ Semantic structure with clear hierarchy
- ✅ Descriptive text for screen readers
- ✅ Action buttons have proper accessibility labels
- ✅ Touch targets meet WCAG AA (48px minimum)
- ✅ Color contrast meets WCAG AA (4.5:1 minimum)

### DemoBadge

- ✅ Accessibility role="text"
- ✅ Accessibility label describes content type
- ✅ Icon + text provides redundant information
- ✅ Color is not the only indicator (icon + text)

### DemoBanner

- ✅ Accessibility role="alert" for prominence
- ✅ Accessibility label describes message
- ✅ Dismiss button has proper accessibility label
- ✅ Touch target meets WCAG AA (48px minimum)

## Testing

### EmptyState Tests

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { EmptyState } from '@/components/ui/EmptyState';

test('renders empty state with action', () => {
  const onAction = jest.fn();
  const { getByText } = render(
    <EmptyState
      icon="cube.box"
      title="No Items"
      description="Add items to get started"
      actionLabel="Add Item"
      onAction={onAction}
    />
  );
  
  expect(getByText('No Items')).toBeTruthy();
  expect(getByText('Add items to get started')).toBeTruthy();
  
  fireEvent.press(getByText('Add Item'));
  expect(onAction).toHaveBeenCalledTimes(1);
});

test('renders preset empty state', () => {
  const onAddChild = jest.fn();
  const { getByText } = render(
    <NoChildrenEmptyState onAddChild={onAddChild} />
  );
  
  expect(getByText('No Children Added')).toBeTruthy();
  fireEvent.press(getByText('Add Child'));
  expect(onAddChild).toHaveBeenCalledTimes(1);
});
```

### DemoBadge Tests

```tsx
import { render } from '@testing-library/react-native';
import { DemoBadge } from '@/components/ui/DemoBadge';

test('renders demo badge', () => {
  const { getByText } = render(<DemoBadge variant="demo" />);
  expect(getByText('DEMO')).toBeTruthy();
});

test('renders custom text', () => {
  const { getByText } = render(
    <DemoBadge variant="demo" text="PREVIEW" />
  );
  expect(getByText('PREVIEW')).toBeTruthy();
});

test('renders inline badge', () => {
  const { getByText } = render(
    <DemoBadge variant="demo" inline />
  );
  const badge = getByText('DEMO');
  expect(badge).toBeTruthy();
  // Check for inline styles
});
```

## Best Practices

### Do's ✅

- Use EmptyState for all no-data scenarios
- Use preset empty states when available
- Provide clear, actionable descriptions
- Use DemoBadge to mark all demo/placeholder content
- Choose appropriate variant for content type
- Use inline badges for compact UIs
- Use DemoBanner for page-level indicators
- Test empty states with screen readers
- Provide actions to resolve empty states

### Don'ts ❌

- Don't show empty states while loading
- Don't use vague descriptions ("No data")
- Don't forget to provide actions when possible
- Don't use demo badges on real user data
- Don't rely on color alone (use icon + text)
- Don't create custom empty state components
- Don't skip accessibility labels
- Don't use demo content in production without badges

## Migration Guide

### Before (Old Pattern)

```tsx
{data.length === 0 && (
  <View style={styles.emptyContainer}>
    <Text style={styles.emptyTitle}>No Items</Text>
    <Text style={styles.emptyText}>Add items to get started</Text>
    <TouchableOpacity onPress={handleAdd}>
      <Text>Add Item</Text>
    </TouchableOpacity>
  </View>
)}
```

### After (New Pattern)

```tsx
{data.length === 0 && (
  <EmptyState
    icon="cube.box"
    title="No Items"
    description="Add items to get started"
    actionLabel="Add Item"
    onAction={handleAdd}
  />
)}
```

## Related Documentation

- [Button Usage Guidelines](./button-usage-guidelines.md)
- [Design System Tokens](../../design-documentation/design-system/tokens.md)
- [Accessibility Guidelines](../../design-documentation/accessibility/guidelines.md)
- [Color System](../../constants/Colors.ts)

---

**Questions or Issues?**  
Contact the design system team or open an issue in the repository.
