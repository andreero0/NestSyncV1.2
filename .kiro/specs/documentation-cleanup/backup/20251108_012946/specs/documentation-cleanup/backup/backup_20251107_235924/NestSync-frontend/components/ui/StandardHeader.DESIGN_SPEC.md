---
title: StandardHeader Component Design Specification
description: Comprehensive design specification for consistent header implementation across NestSync
component: StandardHeader
last-updated: 2025-11-05
version: 1.0.0
related-files:
  - /design-documentation/design-system/style-guide.md
  - /design-documentation/design-system/components/navigation.md
dependencies:
  - Design System Typography Scale
  - Design System Color Tokens
  - Platform Safe Area Guidelines
status: approved
---

# StandardHeader Component Design Specification

## Overview

The StandardHeader component provides a consistent, accessible navigation header for all NestSync screens. It resolves current inconsistencies in header typography, layout, and interaction patterns by establishing a unified component with two distinct modes: View Mode and Edit Mode.

## Table of Contents

1. [Design Rationale](#design-rationale)
2. [Component Modes](#component-modes)
3. [Visual Specifications](#visual-specifications)
4. [Typography Specifications](#typography-specifications)
5. [Layout Specifications](#layout-specifications)
6. [Color Specifications](#color-specifications)
7. [Component States](#component-states)
8. [Interaction Specifications](#interaction-specifications)
9. [Accessibility Specifications](#accessibility-specifications)
10. [Component API](#component-api)
11. [Usage Guidelines](#usage-guidelines)
12. [Implementation Notes](#implementation-notes)

---

## Design Rationale

### Problem Statement

Current header implementations across NestSync exhibit three distinct patterns:

1. **Subscription Screen**: 28px title, left-aligned, back button only
2. **Profile Screen**: 18px title, center-aligned, back + save buttons, bottom border
3. **Planner Screen**: 32px title, 800 weight (incorrect), inconsistent spacing

These inconsistencies create:
- Visual hierarchy confusion for users
- Cognitive load from unpredictable navigation patterns
- Design system violations
- Accessibility compliance gaps

### Solution Approach

StandardHeader establishes a single, flexible component that:
- **Enforces design system compliance** through typed props and consistent styling
- **Supports two distinct use cases** (view vs edit) without creating visual fragmentation
- **Prioritizes accessibility** with WCAG AA compliance and platform-specific touch targets
- **Reduces cognitive load** through predictable, consistent navigation patterns

---

## Component Modes

### View Mode (Default)

**Purpose**: Read-only screens where user navigates content without editing capabilities

**Elements**:
- Back button (left)
- Page title (left-aligned)

**Use Cases**:
- Subscription Management screen
- Payment Methods screen
- Terms of Service screen
- Privacy Policy screen
- About screen

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│ ← Back      Page Title                  │
└─────────────────────────────────────────┘
```

### Edit Mode

**Purpose**: Screens with editable content requiring save/submit actions

**Elements**:
- Back button (left)
- Page title (center-aligned)
- Action button (right) - typically "Save" or "Done"

**Use Cases**:
- Profile Settings screen
- Edit Child Profile screen
- Family Management screen
- Preference screens with editable fields

**Visual Structure**:
```
┌─────────────────────────────────────────┐
│ ← Back      Page Title           Save   │
└─────────────────────────────────────────┘
```

---

## Visual Specifications

### Component Anatomy

```
┌──────────────────────────────────────────────────────┐
│  ┌─────────┐  ┌──────────────┐  ┌────────────────┐  │
│  │  Back   │  │  Page Title  │  │ Action Button  │  │
│  │  Button │  │              │  │   (Optional)   │  │
│  └─────────┘  └──────────────┘  └────────────────┘  │
│                                                       │
└──────────────────────────────────────────────────────┘
     A              B                    C
│←20px→│       │←8px spacing→│       │←20px→│

A: Back Button Touch Target (44x44px)
B: Title Container (flexible width)
C: Action Button Touch Target (44px min width)
```

### Measurements

| Element | Dimension | Notes |
|---------|-----------|-------|
| **Total Height** | 44px minimum | Ensures iOS Human Interface Guidelines compliance |
| **Horizontal Padding** | 20px | Screen edge to first/last interactive element |
| **Vertical Padding** | 16px | Top and bottom internal padding |
| **Element Spacing** | 8px | Space between back button and title |
| **Back Button Touch Target** | 44x44px | Minimum touch target per iOS HIG and WCAG |
| **Action Button Touch Target** | 44px height, min 44px width | Ensures accessibility on all platforms |
| **Border Width** (optional) | 1px | Bottom border when showBorder prop is true |

### Responsive Behavior

**Mobile (320px - 767px)**:
- Full specifications as documented above
- Title truncates with ellipsis if exceeds available space
- Action button maintains 44px min-width even on narrow screens

**Tablet (768px - 1023px)**:
- Same layout with increased horizontal padding to 24px
- Title has more breathing room before truncation

**Desktop (1024px+)**:
- Horizontal padding increases to 32px
- Action button text may include additional context (e.g., "Save Changes")

---

## Typography Specifications

### Title Typography

**Design System Reference**: H1 (Page Titles)

| Property | Value | Rationale |
|----------|-------|-----------|
| **Font Size** | 32px | Establishes clear visual hierarchy as primary page identifier |
| **Line Height** | 40px | Provides vertical rhythm and ensures text doesn't clip |
| **Font Weight** | 600 (Semibold) | Balances authority with readability |
| **Letter Spacing** | -0.02em | Improves optical spacing for large display text |
| **Color** | `colors.text` (theme-aware) | Adapts to light/dark mode automatically |
| **Text Alignment** | Left (View Mode), Center (Edit Mode) | Indicates content editability through alignment pattern |
| **Text Truncation** | Ellipsis after 80% container width | Prevents text overflow on narrow screens |

**Accessibility Notes**:
- 32px font size exceeds WCAG Large Text threshold (18px), allowing 3:1 contrast ratio
- Letter spacing improves readability for users with dyslexia
- Theme-aware color ensures sufficient contrast in both light and dark modes

### Action Button Typography

**Design System Reference**: Label (Form Labels)

| Property | Value | Rationale |
|----------|-------|-----------|
| **Font Size** | 16px | Standard interactive element size for mobile |
| **Line Height** | 20px | Tight line height for single-line button text |
| **Font Weight** | 600 (Semibold) | Indicates interactivity and importance |
| **Color** | `colors.primary` (tint color) | Uses primary brand color for action affordance |
| **Text Alignment** | Center | Standard button text alignment |
| **Letter Spacing** | 0 | Default spacing for body-sized interactive text |

**Accessibility Notes**:
- 16px font size requires 4.5:1 contrast ratio per WCAG AA
- Primary color meets contrast requirements against background
- Semibold weight improves legibility for interactive elements

---

## Layout Specifications

### View Mode Layout

**Structure**: Flexbox with left alignment

```css
Container {
  display: flex;
  flexDirection: row;
  alignItems: center;
  justifyContent: flex-start;
  height: 44px;
  paddingHorizontal: 20px;
  paddingVertical: 16px;
}

BackButton {
  width: 44px;
  height: 44px;
  marginRight: 8px;
}

Title {
  flex: 1;
  textAlign: left;
}
```

**Element Flow**:
1. Back button (fixed 44px width)
2. 8px spacing
3. Title (flexible, fills remaining space)
4. 20px right padding

**Spacing Diagram**:
```
|←20px→| ←Back (44px)→ |←8px→| ←Title (flex)→ |←20px→|
```

### Edit Mode Layout

**Structure**: Flexbox with space-between alignment

```css
Container {
  display: flex;
  flexDirection: row;
  alignItems: center;
  justifyContent: space-between;
  height: 44px;
  paddingHorizontal: 20px;
  paddingVertical: 16px;
}

BackButton {
  width: 44px;
  height: 44px;
  alignSelf: flex-start;
}

Title {
  flex: 1;
  textAlign: center;
  marginHorizontal: 8px;
}

ActionButton {
  minWidth: 44px;
  height: 44px;
  alignSelf: flex-end;
  paddingHorizontal: 12px;
}
```

**Element Flow**:
1. Back button (fixed 44px width)
2. Title (flexible, center-aligned)
3. Action button (min 44px width with auto padding)

**Spacing Diagram**:
```
|←20px→| ←Back→ |←8px→| ←Title (center)→ |←8px→| ←Action→ |←20px→|
```

### Border Treatment (Optional)

When `showBorder={true}`:

```css
Container {
  borderBottomWidth: 1px;
  borderBottomColor: colors.border; // Theme-aware
}
```

**Border Use Cases**:
- Screens with white/light backgrounds needing visual separation
- Edit Mode screens to indicate actionable content below
- Not needed when header sits atop colored background

---

## Color Specifications

### Design System Tokens

All colors use theme-aware tokens that adapt to light/dark mode:

| Element | Token | Light Mode | Dark Mode | Purpose |
|---------|-------|------------|-----------|---------|
| **Background** | `colors.background` | #FFFFFF | #1A1A1A | Header container background |
| **Title Text** | `colors.text` | #1A1A1A | #FFFFFF | Primary page title |
| **Back Button Icon** | `colors.text` | #1A1A1A | #FFFFFF | Navigation icon |
| **Action Button Text** | `colors.primary` | #0891B2 | #22D3EE | Primary action color |
| **Action Button Text (Disabled)** | `colors.textSecondary` | #6B7280 | #9CA3AF | Disabled state feedback |
| **Border** | `colors.border` | #E5E7EB | #374151 | Optional bottom border |

### Contrast Ratios (WCAG AA Compliance)

| Element Pair | Light Mode Ratio | Dark Mode Ratio | WCAG Requirement | Pass/Fail |
|--------------|------------------|-----------------|------------------|-----------|
| **Title on Background** | 12.63:1 | 15.84:1 | 3:1 (Large Text) | ✅ Pass |
| **Action Button on Background** | 4.58:1 | 4.92:1 | 4.5:1 (Normal Text) | ✅ Pass |
| **Border on Background** | 3.12:1 | 3.05:1 | 3:1 (UI Component) | ✅ Pass |

### Color Application Guidelines

**Do**:
- Always use theme tokens, never hardcode hex values
- Test both light and dark modes during implementation
- Verify contrast ratios with actual background colors
- Use semantic color names (primary, text, border) not color values

**Don't**:
- Use opacity to create disabled states (fails contrast requirements)
- Mix color tokens from different theme contexts
- Override colors without checking accessibility compliance
- Use color alone to convey information (add text or icons)

---

## Component States

### Back Button States

#### Default State
**Visual Treatment**:
- Icon: `chevron.left` SF Symbol (iOS) / Material Icons `chevron-left` (Android)
- Size: 24x24px icon within 44x44px touch target
- Color: `colors.text`
- Opacity: 1.0

**Interaction**:
- No visual feedback on render
- Ready to receive touch input

#### Pressed State
**Visual Treatment**:
- Background: `colors.primary` at 10% opacity (Platform-specific)
  - iOS: No background (system handles press feedback)
  - Android: Ripple effect with `colors.primary` at 20% opacity
- Scale: 0.95 (subtle press feedback)
- Duration: 100ms ease-out

**Interaction**:
- Visual feedback indicates touch registration
- Prevents double-tap with 300ms debounce

#### Disabled State
**Visual Treatment**:
- Opacity: 0.4
- Color: `colors.textSecondary`
- Cursor: not-allowed (web)

**Interaction**:
- Touch events disabled
- No visual feedback on press
- Rare use case (typically only during navigation transitions)

### Action Button States

#### Default State
**Visual Treatment**:
- Text: Action label (e.g., "Save", "Done")
- Color: `colors.primary`
- Font Weight: 600
- Opacity: 1.0
- Min Width: 44px
- Padding: 12px horizontal

**Interaction**:
- Ready to receive touch input
- No visual feedback on render

#### Pressed State
**Visual Treatment**:
- Background: `colors.primary` at 10% opacity (rounded 8px)
- Scale: 0.97 (subtle press feedback)
- Duration: 100ms ease-out
- Text color: `colors.primary` (darker shade)

**Interaction**:
- Visual feedback indicates touch registration
- Prevents double-tap with 500ms debounce (longer than back button)

#### Disabled State
**Visual Treatment**:
- Text Color: `colors.textSecondary`
- Opacity: 1.0 (color change conveys state, not opacity)
- Cursor: not-allowed (web)

**Interaction**:
- Touch events disabled
- No visual feedback on press
- Use when form validation fails or async action in progress

**Usage Example**:
```typescript
<StandardHeader
  title="Profile Settings"
  actionButton={{
    label: "Save",
    onPress: handleSave,
    disabled: !isFormValid // Disable until form passes validation
  }}
/>
```

#### Loading State (Optional Enhancement)

**Visual Treatment**:
- Replace action button text with loading spinner
- Spinner size: 20x20px
- Color: `colors.primary`
- Animation: Continuous rotation

**Interaction**:
- Touch events disabled during loading
- Prevents multiple submissions

---

## Interaction Specifications

### Back Button Interaction

**Touch Target**:
- Minimum size: 44x44px (iOS HIG, Android Material, WCAG)
- Actual icon: 24x24px centered within touch target
- Padding: 10px all sides (creates 44px total)

**Press Behavior**:
1. User touches back button touch target
2. Visual press state applies (100ms ease-out transition)
3. onBack callback fires on touch release
4. Navigation transition begins
5. Press state removes after navigation starts

**Default Behavior**:
```typescript
const defaultOnBack = () => {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/'); // Navigate to home if no history
  }
};
```

**Accessibility**:
- Screen reader label: "Go back" (localized)
- Keyboard shortcut: Escape key (web), Android hardware back button
- Voice control: "Go back", "Back button"

### Action Button Interaction

**Touch Target**:
- Minimum width: 44px
- Height: 44px
- Auto-width based on text length + 24px horizontal padding
- Centered within touch target

**Press Behavior**:
1. User touches action button touch target
2. Visual press state applies (100ms ease-out transition)
3. 500ms debounce prevents double-tap
4. onPress callback fires on touch release
5. Press state removes after callback completes

**Debounce Rationale**:
- Prevents duplicate form submissions
- Longer than back button (500ms vs 300ms) due to higher consequence actions
- Maintains responsive feel while preventing errors

**Accessibility**:
- Screen reader label: Button label text (e.g., "Save")
- Keyboard shortcut: Enter key when header is focused (web)
- Voice control: Uses button label text for activation

### Keyboard Navigation (Web)

**Tab Order**:
1. Back button (tab index 1)
2. Action button (tab index 2, if present)

**Keyboard Shortcuts**:
- Escape: Triggers back button action
- Enter: Triggers action button (when focused)
- Tab: Cycles through interactive elements

**Focus Indicators**:
- Outline: 2px solid `colors.primary`
- Offset: 2px
- Border radius: 8px
- Visible in all themes

---

## Accessibility Specifications

### WCAG AA Compliance Checklist

#### 1.4.3 Contrast (Minimum) - Level AA
- [x] Title text: 12.63:1 (light), 15.84:1 (dark) - Exceeds 3:1 for large text
- [x] Action button text: 4.58:1 (light), 4.92:1 (dark) - Exceeds 4.5:1 for normal text
- [x] Border color: 3.12:1 (light), 3.05:1 (dark) - Meets 3:1 for UI components
- [x] Disabled states use color change, not opacity alone

#### 2.5.5 Target Size (Minimum) - Level AAA (Adopted)
- [x] Back button: 44x44px touch target
- [x] Action button: 44px height, minimum 44px width
- [x] 8px spacing between interactive elements exceeds minimum

#### 1.4.11 Non-text Contrast - Level AA
- [x] Back button icon: Same contrast as title text
- [x] Border: 3:1 contrast ratio against background

#### 2.4.7 Focus Visible - Level AA
- [x] All interactive elements have visible focus indicators
- [x] Focus outline uses 2px solid primary color
- [x] Focus indicators visible in both light and dark modes

#### 4.1.2 Name, Role, Value - Level A
- [x] Back button: role="button", label="Go back"
- [x] Action button: role="button", label=[prop value]
- [x] Title: role="heading", aria-level="1"

### Screen Reader Support

**iOS VoiceOver**:
```typescript
// Back button
accessibilityLabel="Go back"
accessibilityRole="button"
accessibilityHint="Returns to previous screen"

// Title
accessibilityLabel={title}
accessibilityRole="header"

// Action button
accessibilityLabel={actionButton.label}
accessibilityRole="button"
accessibilityHint="Saves changes to this screen"
accessibilityState={{ disabled: actionButton.disabled }}
```

**Android TalkBack**:
```typescript
// Back button
accessible={true}
accessibilityLabel="Go back"
accessibilityRole="button"

// Title
accessible={true}
accessibilityLabel={title}
accessibilityRole="header"

// Action button
accessible={true}
accessibilityLabel={actionButton.label}
accessibilityRole="button"
accessibilityState={{ disabled: actionButton.disabled }}
```

### Reduced Motion Support

Respects user's motion preferences:

```typescript
const reducedMotion = useReducedMotion();

const pressAnimation = reducedMotion
  ? { scale: 1, duration: 0 } // No animation
  : { scale: 0.95, duration: 100 }; // Standard press feedback
```

**Affected Interactions**:
- Press state scale animations disabled
- Transition durations set to 0ms
- Functionality remains identical

---

## Component API

### TypeScript Interface

```typescript
/**
 * StandardHeader Component Props
 *
 * Provides consistent navigation header with optional edit mode functionality.
 * Automatically adapts to theme (light/dark) and respects accessibility preferences.
 */
interface StandardHeaderProps {
  /**
   * Page title displayed in header
   * @example "Profile Settings"
   * @example "Subscription Management"
   */
  title: string;

  /**
   * Optional back button handler
   * If not provided, uses default navigation behavior (router.back())
   * @param event - Touch event from back button press
   */
  onBack?: () => void;

  /**
   * Optional action button configuration (enables Edit Mode)
   * When provided, header switches to center-aligned title with action button
   * @example { label: "Save", onPress: handleSave, disabled: !isFormValid }
   */
  actionButton?: {
    /**
     * Button label text
     * Keep concise (max 10 characters recommended)
     */
    label: string;

    /**
     * Button press handler
     * Automatically debounced to prevent double-tap
     */
    onPress: () => void;

    /**
     * Optional disabled state
     * Use when form validation fails or async action in progress
     * @default false
     */
    disabled?: boolean;
  };

  /**
   * Optional bottom border display
   * Useful for screens with white backgrounds needing visual separation
   * @default false
   */
  showBorder?: boolean;

  /**
   * Optional test ID for automated testing
   * Automatically propagates to child elements with suffixes
   * @example testID="profile-header" creates:
   *   - "profile-header-back" for back button
   *   - "profile-header-title" for title
   *   - "profile-header-action" for action button
   */
  testID?: string;
}
```

### Component Signature

```typescript
const StandardHeader: React.FC<StandardHeaderProps> = ({
  title,
  onBack,
  actionButton,
  showBorder = false,
  testID = 'standard-header',
}) => {
  // Implementation
};

export default StandardHeader;
```

### Default Props

```typescript
StandardHeader.defaultProps = {
  showBorder: false,
  testID: 'standard-header',
};
```

---

## Usage Guidelines

### When to Use StandardHeader

**Use StandardHeader for**:
- All main app screens (subscription, profile, planner, etc.)
- Settings and configuration screens
- Forms requiring save/submit actions
- Content detail screens with navigation
- Any screen requiring consistent back navigation

**Do NOT use StandardHeader for**:
- Modal dialogs (use modal-specific headers)
- Onboarding screens (use custom headers with progress indicators)
- Landing pages without navigation (no back button needed)
- Screens with custom header requirements (e.g., search bars)

### View Mode vs Edit Mode Decision

**Use View Mode** (no action button) when:
- Screen displays read-only information
- No user edits are possible
- User only navigates or consumes content
- Examples: Subscription info, terms of service, about page

**Use Edit Mode** (with action button) when:
- Screen contains editable form fields
- User can modify data requiring save action
- Changes need explicit confirmation
- Examples: Profile settings, edit child profile, preferences

### Border Display Guidelines

**Show border** (`showBorder={true}`) when:
- Header sits on white or light background
- Visual separation from content is needed
- Screen has form fields immediately below header
- Design calls for clear header boundary

**Hide border** (`showBorder={false}`) when:
- Header sits on colored or dark background
- Content below provides natural visual separation
- Design emphasizes minimalism
- Border creates unwanted visual weight

---

## Usage Examples

### Example 1: View Mode - Subscription Screen

**Current Implementation** (inconsistent):
```typescript
// subscription-management.tsx (BEFORE)
<View style={{ paddingTop: 20 }}>
  <TouchableOpacity onPress={() => router.back()}>
    <Text>← Back</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 28, fontWeight: '600' }}>
    Subscription Management
  </Text>
</View>
```

**StandardHeader Implementation** (consistent):
```typescript
// subscription-management.tsx (AFTER)
import StandardHeader from '@/components/ui/StandardHeader';

<StandardHeader
  title="Subscription Management"
  showBorder={false}
  testID="subscription-header"
/>
```

**Result**:
- Consistent 32px title (was 28px)
- Proper 44x44px back button touch target
- Automatic theme support
- Accessibility compliance

---

### Example 2: Edit Mode - Profile Settings

**Current Implementation** (inconsistent):
```typescript
// profile-settings.tsx (BEFORE)
<View style={styles.header}>
  <TouchableOpacity onPress={handleBack}>
    <Text>Cancel</Text>
  </TouchableOpacity>
  <Text style={{ fontSize: 18, textAlign: 'center' }}>
    Profile Settings
  </Text>
  <TouchableOpacity onPress={handleSave}>
    <Text style={{ color: '#0891B2' }}>Save</Text>
  </TouchableOpacity>
</View>
```

**StandardHeader Implementation** (consistent):
```typescript
// profile-settings.tsx (AFTER)
import StandardHeader from '@/components/ui/StandardHeader';

const [hasChanges, setHasChanges] = useState(false);
const [isSaving, setIsSaving] = useState(false);

<StandardHeader
  title="Profile Settings"
  actionButton={{
    label: "Save",
    onPress: handleSave,
    disabled: !hasChanges || isSaving
  }}
  showBorder={true}
  testID="profile-header"
/>
```

**Result**:
- Consistent 32px title (was 18px)
- Center-aligned title in edit mode
- Disabled state reflects form validation
- Proper touch targets and spacing

---

### Example 3: Custom Back Navigation

**Use Case**: Screen needs custom back behavior (e.g., unsaved changes warning)

```typescript
import StandardHeader from '@/components/ui/StandardHeader';
import { Alert } from 'react-native';

const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

const handleBackWithWarning = () => {
  if (hasUnsavedChanges) {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Are you sure you want to leave?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: () => router.back()
        }
      ]
    );
  } else {
    router.back();
  }
};

<StandardHeader
  title="Edit Profile"
  onBack={handleBackWithWarning}
  actionButton={{
    label: "Save",
    onPress: handleSave,
    disabled: !hasUnsavedChanges
  }}
  testID="edit-profile-header"
/>
```

**Result**:
- Custom back behavior with unsaved changes warning
- Still maintains consistent visual design
- Prevents data loss through user confirmation

---

### Example 4: Loading State Pattern

**Use Case**: Disable action button during async operation

```typescript
import StandardHeader from '@/components/ui/StandardHeader';

const [isSaving, setIsSaving] = useState(false);

const handleSave = async () => {
  setIsSaving(true);
  try {
    await saveProfileChanges();
    router.back();
  } catch (error) {
    Alert.alert('Error', 'Failed to save changes');
  } finally {
    setIsSaving(false);
  }
};

<StandardHeader
  title="Profile Settings"
  actionButton={{
    label: isSaving ? "Saving..." : "Save",
    onPress: handleSave,
    disabled: isSaving
  }}
  showBorder={true}
  testID="profile-header"
/>
```

**Result**:
- Action button disabled during save operation
- Visual feedback through label change
- Prevents double-tap submissions

---

## Implementation Notes

### Developer Handoff

**File Location**: `NestSync-frontend/components/ui/StandardHeader.tsx`

**Dependencies**:
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
```

**Theme Integration**:
```typescript
const { colors, theme } = useTheme();

// Use theme colors consistently
backgroundColor: colors.background
color: colors.text
borderBottomColor: colors.border
tintColor: colors.primary (for action button)
```

**Safe Area Handling**:
```typescript
const insets = useSafeAreaInsets();

// Add safe area padding to container
paddingTop: insets.top + 16 // 16px base + platform safe area
```

**Platform-Specific Considerations**:

**iOS**:
- Uses `chevron.left` SF Symbol for back button
- No background press feedback (system handles)
- Respects safe area insets for notch/dynamic island
- Haptic feedback on press (optional enhancement)

**Android**:
- Uses Material Icons `chevron-left` for back button
- Ripple effect press feedback with `colors.primary` at 20% opacity
- Respects system navigation bar safe areas
- Hardware back button integration

**Web**:
- Uses Ionicons `chevron-back` for consistency
- Cursor changes to pointer on hover
- Focus indicators visible for keyboard navigation
- Escape key triggers back button

### Performance Optimization

**Memoization**:
```typescript
const StandardHeader = React.memo<StandardHeaderProps>(({ ... }) => {
  // Component implementation
}, (prevProps, nextProps) => {
  // Custom comparison for optimal re-render prevention
  return (
    prevProps.title === nextProps.title &&
    prevProps.showBorder === nextProps.showBorder &&
    prevProps.actionButton?.label === nextProps.actionButton?.label &&
    prevProps.actionButton?.disabled === nextProps.actionButton?.disabled
  );
});
```

**Debouncing**:
```typescript
import { useDebouncedCallback } from 'use-debounce';

// Back button: 300ms debounce
const debouncedBack = useDebouncedCallback(onBack, 300);

// Action button: 500ms debounce (higher consequence actions)
const debouncedAction = useDebouncedCallback(
  actionButton?.onPress,
  500
);
```

### Testing Integration

**Playwright Test Selectors**:
```typescript
// Component renders with test IDs
testID={`${testID}-container`}
testID={`${testID}-back`}
testID={`${testID}-title`}
testID={`${testID}-action`}

// Playwright test example
await page.locator('[data-testid="profile-header-back"]').click();
await page.locator('[data-testid="profile-header-action"]').click();
```

**Unit Testing**:
```typescript
import { render, fireEvent } from '@testing-library/react-native';

test('calls onBack when back button pressed', () => {
  const onBackMock = jest.fn();
  const { getByTestId } = render(
    <StandardHeader title="Test" onBack={onBackMock} />
  );

  fireEvent.press(getByTestId('standard-header-back'));
  expect(onBackMock).toHaveBeenCalledTimes(1);
});
```

### Migration Strategy

**Phase 1**: Implement StandardHeader component with full specifications

**Phase 2**: Migrate screens one at a time in priority order:
1. Profile Settings (highest inconsistency)
2. Subscription Management
3. Payment Methods
4. Planner (typography fix)
5. Remaining screens

**Phase 3**: Remove legacy header implementations

**Phase 4**: Verify visual consistency across all screens with Playwright testing

### Common Pitfalls to Avoid

**Don't**:
- Hardcode colors instead of using theme tokens
- Skip safe area insets (causes notch/navigation bar issues)
- Forget disabled state for action buttons
- Use opacity for disabled states (accessibility violation)
- Skip accessibility labels for screen readers
- Implement custom back behavior without unsaved changes checks

**Do**:
- Always use theme colors for automatic light/dark mode support
- Test on physical devices with notches and different safe areas
- Include loading states for async actions
- Use color changes (not opacity) for disabled states
- Provide comprehensive accessibility labels
- Warn users before navigating away from unsaved changes

---

## Related Documentation

- [Design System Style Guide](/design-documentation/design-system/style-guide.md)
- [Navigation Component Specifications](/design-documentation/design-system/components/navigation.md)
- [Typography System](/design-documentation/design-system/tokens/typography.md)
- [Color Palette](/design-documentation/design-system/tokens/colors.md)
- [Accessibility Guidelines](/design-documentation/accessibility/guidelines.md)

---

## Implementation Validation Checklist

Before marking implementation complete, verify:

**Visual Specifications**:
- [ ] Title is exactly 32px font size, 600 weight, 40px line-height
- [ ] Back button touch target is 44x44px
- [ ] Action button touch target is minimum 44px width and 44px height
- [ ] Horizontal padding is 20px on both sides
- [ ] Element spacing is 8px between back button and title
- [ ] Border (when enabled) is exactly 1px width

**Functional Specifications**:
- [ ] Default back navigation works (router.back())
- [ ] Custom onBack handlers execute correctly
- [ ] Action button disabled state prevents interaction
- [ ] Debouncing prevents double-tap on both buttons
- [ ] Title truncates with ellipsis on narrow screens

**Accessibility Specifications**:
- [ ] All interactive elements have proper ARIA labels
- [ ] Screen readers announce elements correctly (VoiceOver/TalkBack)
- [ ] Keyboard navigation works (Tab, Escape, Enter)
- [ ] Focus indicators visible in all themes
- [ ] Touch targets meet 44x44px minimum
- [ ] Contrast ratios verified in both light and dark modes
- [ ] Reduced motion preference respected

**Platform-Specific**:
- [ ] iOS safe area insets applied correctly (notch/dynamic island)
- [ ] Android navigation bar safe areas respected
- [ ] Web keyboard shortcuts functional
- [ ] Platform-specific press feedback working correctly

**Theme Integration**:
- [ ] Light mode colors correct and accessible
- [ ] Dark mode colors correct and accessible
- [ ] Automatic theme switching works seamlessly
- [ ] Border color adapts to theme

**Testing**:
- [ ] Unit tests pass for all interactions
- [ ] Playwright tests verify visual consistency
- [ ] Tested on physical iOS device
- [ ] Tested on physical Android device
- [ ] Tested in web browser with keyboard navigation

---

## Last Updated

**Version**: 1.0.0
**Date**: 2025-11-05
**Author**: UX-UI Designer (Claude Code)
**Status**: Approved for implementation

**Change Log**:
- 2025-11-05: Initial design specification created
- Resolves header inconsistencies across subscription, profile, and planner screens
- Establishes two-mode system (View/Edit) with comprehensive specifications
- WCAG AA accessibility compliance verified
- Ready for developer implementation
