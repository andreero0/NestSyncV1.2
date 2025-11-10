# Button Usage Guidelines

**Last Updated**: 2025-01-09  
**Component**: `components/ui/Button.tsx`

## Overview

The standardized Button component provides consistent styling, accessibility, and behavior across the NestSync application. All buttons should use this component to ensure design system compliance.

## Basic Usage

```tsx
import { Button } from '@/components/ui/Button';

// Primary button
<Button
  title="Save Changes"
  onPress={handleSave}
  variant="primary"
  size="medium"
/>

// Secondary button
<Button
  title="Cancel"
  onPress={handleCancel}
  variant="secondary"
  size="medium"
/>

// Danger button
<Button
  title="Delete"
  onPress={handleDelete}
  variant="danger"
  size="medium"
/>
```

## Button Variants

### Primary
Use for the main action on a screen.

```tsx
<Button
  title="Continue"
  onPress={handleContinue}
  variant="primary"
/>
```

**Styling**:
- Background: `NestSyncColors.primary.blue` (#0891B2)
- Text: White (#FFFFFF)
- Border: `NestSyncColors.primary.blue`

**When to use**:
- Main call-to-action
- Form submissions
- Confirmation actions
- Navigation to next step

### Secondary
Use for alternative actions or less prominent buttons.

```tsx
<Button
  title="Cancel"
  onPress={handleCancel}
  variant="secondary"
/>
```

**Styling**:
- Background: Transparent
- Text: `colors.text` (theme-aware)
- Border: `colors.border`

**When to use**:
- Cancel actions
- Alternative options
- Navigation back
- Less important actions

### Danger
Use for destructive or irreversible actions.

```tsx
<Button
  title="Delete Account"
  onPress={handleDelete}
  variant="danger"
/>
```

**Styling**:
- Background: Transparent
- Text: `colors.error` (#DC2626)
- Border: `colors.error`

**When to use**:
- Delete actions
- Cancel subscriptions
- Remove items
- Irreversible operations

### Success
Use for positive confirmations or completion actions.

```tsx
<Button
  title="Confirm Order"
  onPress={handleConfirm}
  variant="success"
/>
```

**Styling**:
- Background: `NestSyncColors.secondary.green` (#059669)
- Text: White (#FFFFFF)
- Border: `NestSyncColors.secondary.green`

**When to use**:
- Successful completions
- Positive confirmations
- "Yes" in dialogs
- Approval actions

### Ghost
Use for tertiary actions or inline links.

```tsx
<Button
  title="Learn More"
  onPress={handleLearnMore}
  variant="ghost"
/>
```

**Styling**:
- Background: Transparent
- Text: `NestSyncColors.primary.blue`
- Border: Transparent

**When to use**:
- Tertiary actions
- Inline links
- Less prominent options
- Supplementary actions

## Button Sizes

### Small
Use for compact UIs or secondary actions.

```tsx
<Button
  title="Edit"
  onPress={handleEdit}
  variant="secondary"
  size="small"
/>
```

**Dimensions**:
- Min Height: 40px
- Padding: 8px vertical, 16px horizontal
- Font Size: 14px

**When to use**:
- Table actions
- Card actions
- Inline actions
- Space-constrained UIs

### Medium (Default)
Use for most buttons in the application.

```tsx
<Button
  title="Save"
  onPress={handleSave}
  variant="primary"
  size="medium"
/>
```

**Dimensions**:
- Min Height: 48px (WCAG AA compliant)
- Padding: 12px vertical, 20px horizontal
- Font Size: 16px

**When to use**:
- Form buttons
- Modal actions
- Primary actions
- Most use cases

### Large
Use for prominent actions or hero sections.

```tsx
<Button
  title="Get Started"
  onPress={handleGetStarted}
  variant="primary"
  size="large"
/>
```

**Dimensions**:
- Min Height: 56px
- Padding: 16px vertical, 24px horizontal
- Font Size: 16px

**When to use**:
- Hero CTAs
- Onboarding actions
- Prominent actions
- Empty states

## Button States

### Loading
Show a spinner while an async operation is in progress.

```tsx
<Button
  title="Saving..."
  onPress={handleSave}
  variant="primary"
  loading={isSaving}
/>
```

**Behavior**:
- Replaces text with ActivityIndicator
- Button is automatically disabled
- Maintains button dimensions

### Disabled
Disable button when action is not available.

```tsx
<Button
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
  disabled={!isValid}
/>
```

**Behavior**:
- Opacity reduced to 0.5
- onPress handler not called
- Accessibility state updated

## Icons

### Icon Position
Add icons to buttons for better visual communication.

```tsx
// Icon on left (default)
<Button
  title="Add Item"
  onPress={handleAdd}
  variant="primary"
  icon={<IconSymbol name="plus.circle.fill" size={20} color="#FFFFFF" />}
  iconPosition="left"
/>

// Icon on right
<Button
  title="Next"
  onPress={handleNext}
  variant="primary"
  icon={<IconSymbol name="chevron.right" size={20} color="#FFFFFF" />}
  iconPosition="right"
/>
```

**Guidelines**:
- Icon size: 20px for medium buttons, 18px for small, 24px for large
- Icon color should match text color
- Use SF Symbols via IconSymbol component
- Keep icons simple and recognizable

## Full Width Buttons

Use full-width buttons for mobile-first layouts.

```tsx
<Button
  title="Continue"
  onPress={handleContinue}
  variant="primary"
  fullWidth
/>
```

**When to use**:
- Mobile layouts
- Modal actions
- Form submissions
- Bottom sheets

## Button Groups

Use ButtonGroup to display multiple buttons with consistent spacing.

```tsx
import { Button, ButtonGroup } from '@/components/ui/Button';

// Horizontal button group
<ButtonGroup direction="row" gap={12}>
  <Button
    title="Cancel"
    onPress={handleCancel}
    variant="secondary"
    style={{ flex: 1 }}
  />
  <Button
    title="Save"
    onPress={handleSave}
    variant="primary"
    style={{ flex: 1 }}
  />
</ButtonGroup>

// Vertical button group
<ButtonGroup direction="column" gap={12}>
  <Button title="Option 1" onPress={handleOption1} variant="secondary" fullWidth />
  <Button title="Option 2" onPress={handleOption2} variant="secondary" fullWidth />
  <Button title="Option 3" onPress={handleOption3} variant="secondary" fullWidth />
</ButtonGroup>
```

## Accessibility

### Labels and Hints

Always provide accessibility labels and hints for screen readers.

```tsx
<Button
  title="Delete"
  onPress={handleDelete}
  variant="danger"
  accessibilityLabel="Delete item"
  accessibilityHint="Permanently removes this item from your inventory"
/>
```

### Touch Targets

All buttons meet WCAG AA minimum touch target size (48px).

- Small buttons: 40px (use sparingly)
- Medium buttons: 48px (default)
- Large buttons: 56px

### Keyboard Navigation

Buttons support keyboard navigation on web platforms automatically.

## Custom Styling

Override styles when necessary, but prefer using variants and sizes.

```tsx
<Button
  title="Custom"
  onPress={handleCustom}
  variant="primary"
  style={{
    marginTop: 16,
    borderRadius: 8, // Override border radius
  }}
  textStyle={{
    fontSize: 18, // Override font size
  }}
/>
```

**Guidelines**:
- Use sparingly
- Maintain accessibility standards
- Document why custom styling is needed
- Consider adding a new variant instead

## Testing

### Test IDs

Add testID for automated testing.

```tsx
<Button
  title="Submit"
  onPress={handleSubmit}
  variant="primary"
  testID="submit-button"
/>
```

### Example Tests

```tsx
import { render, fireEvent } from '@testing-library/react-native';
import { Button } from '@/components/ui/Button';

test('calls onPress when pressed', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button title="Test" onPress={onPress} variant="primary" />
  );
  
  fireEvent.press(getByText('Test'));
  expect(onPress).toHaveBeenCalledTimes(1);
});

test('does not call onPress when disabled', () => {
  const onPress = jest.fn();
  const { getByText } = render(
    <Button title="Test" onPress={onPress} variant="primary" disabled />
  );
  
  fireEvent.press(getByText('Test'));
  expect(onPress).not.toHaveBeenCalled();
});

test('shows loading indicator when loading', () => {
  const { getByTestId } = render(
    <Button title="Test" onPress={() => {}} variant="primary" loading testID="test-button" />
  );
  
  expect(getByTestId('test-button')).toBeTruthy();
  // ActivityIndicator should be visible
});
```

## Common Patterns

### Modal Actions

```tsx
<ButtonGroup direction="row" gap={12}>
  <Button
    title="Cancel"
    onPress={onClose}
    variant="secondary"
    style={{ flex: 1 }}
  />
  <Button
    title="Confirm"
    onPress={onConfirm}
    variant="primary"
    loading={isLoading}
    style={{ flex: 1 }}
  />
</ButtonGroup>
```

### Form Submission

```tsx
<Button
  title="Save Changes"
  onPress={handleSubmit}
  variant="primary"
  size="large"
  fullWidth
  disabled={!isValid}
  loading={isSubmitting}
/>
```

### Destructive Confirmation

```tsx
<ButtonGroup direction="column" gap={12}>
  <Button
    title="Yes, Delete"
    onPress={handleDelete}
    variant="danger"
    fullWidth
    loading={isDeleting}
    style={{ backgroundColor: colors.error, borderColor: colors.error }}
    textStyle={{ color: '#FFFFFF' }}
  />
  <Button
    title="Cancel"
    onPress={onClose}
    variant="secondary"
    fullWidth
  />
</ButtonGroup>
```

### Action List

```tsx
<ButtonGroup direction="column" gap={12}>
  <Button
    title="Emergency Order"
    onPress={handleEmergency}
    variant="danger"
    fullWidth
    icon={<Ionicons name="flash" size={20} color="#FFFFFF" />}
    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
    textStyle={{ color: '#FFFFFF' }}
  />
  <Button
    title="View All Items"
    onPress={handleViewAll}
    variant="secondary"
    fullWidth
    icon={<Ionicons name="list" size={20} color={colors.text} />}
  />
  <Button
    title="Setup New Item"
    onPress={handleSetup}
    variant="secondary"
    fullWidth
    icon={<Ionicons name="add-circle-outline" size={20} color={colors.text} />}
  />
</ButtonGroup>
```

## Migration Guide

### Before (Old Pattern)

```tsx
<TouchableOpacity
  onPress={handleSave}
  style={[
    styles.saveButton,
    { backgroundColor: colors.tint, opacity: pressed ? 0.8 : 1 }
  ]}
>
  <Text style={styles.saveButtonText}>Save</Text>
</TouchableOpacity>

const styles = StyleSheet.create({
  saveButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
```

### After (New Pattern)

```tsx
<Button
  title="Save"
  onPress={handleSave}
  variant="primary"
  size="medium"
/>
```

## Best Practices

### Do's ✅

- Use Button component for all clickable actions
- Choose appropriate variant for action type
- Use medium size as default
- Add accessibility labels for screen readers
- Use loading state for async operations
- Group related buttons with ButtonGroup
- Use icons to enhance understanding
- Test on both iOS and Android

### Don'ts ❌

- Don't use TouchableOpacity directly for buttons
- Don't hardcode colors (use variants)
- Don't create buttons below 48px height (except small size)
- Don't use more than 2 primary buttons on one screen
- Don't nest buttons inside buttons
- Don't use buttons for navigation (use Link or router)
- Don't override styles excessively
- Don't forget accessibility labels

## Related Documentation

- [Design System Tokens](../../design-documentation/design-system/tokens.md)
- [Accessibility Guidelines](../../design-documentation/accessibility/guidelines.md)
- [Button Styling Audit](../button-styling-audit.md)
- [Color System](../../constants/Colors.ts)

---

**Questions or Issues?**  
Contact the design system team or open an issue in the repository.
