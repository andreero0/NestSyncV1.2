---
title: "React Native Web API Migration Guide"
date: 2025-11-10
category: "migration"
type: "implementation-report"
priority: "P1"
status: "resolved"
impact: "high"
platforms: ["ios", "android", "web"]
related_docs:
  - "../../test-reports/integration/react-native-web-deprecation-verification-20251110.md"
  - "../../test-reports/integration/react-native-web-deprecation-final-verification-20251110.md"
  - "../../../NestSync-frontend/docs/component-guidelines.md"
tags: ["migration", "react-native-web", "deprecation", "shadow-api"]
---

# React Native Web API Migration Guide

## Overview

This document describes the migration from deprecated React Native Web APIs to current standards, completed in November 2025.

## Background

React Native Web 0.19+ introduced deprecation warnings for certain style props that were inconsistent with web standards. These warnings appeared in the console during development and needed to be addressed for production readiness.

### Deprecation Warnings Resolved

```
[WARNING] "shadow*" style props are deprecated. Use "boxShadow".
[WARNING] "textShadow*" style props are deprecated. Use "textShadow".
```

## Migration Summary

### Statistics

- **Files Scanned**: 141 TypeScript/TSX files
- **Files Modified**: 23 files
- **Total Migrations**: 31 instances
  - Shadow props (boxShadow): 30 instances
  - Text shadow props (textShadow): 1 instance
  - TouchableWithoutFeedback: 0 instances (already using Pressable)
  - tintColor: 0 instances (already correct)
  - pointerEvents: 0 instances (already correct)

### Modified Files

```
app/test-charts.tsx
app/simple-chart-test.tsx
app/(tabs)/settings.tsx
app/(tabs)/planner.tsx
app/(auth)/onboarding.tsx
components/ui/UnitSegmentedControl.tsx
components/ui/RateLimitBanner.tsx
components/timeline/TimelineErrorBoundary.tsx
components/consent/JITConsentModal.tsx
components/consent/ConsentToggle.tsx
components/consent/ConsentGuard.tsx
components/modals/QuickLogModal.tsx
components/modals/EditInventoryModal.tsx
components/modals/AddInventoryModal.tsx
components/charts/SimpleUsageIndicator.tsx
components/charts/ParentFriendlyProgressCard.tsx
components/charts/ConsistencyCircle.tsx
components/analytics/YourBabysPatternsCard.tsx
components/analytics/SmartPredictionsCard.tsx
components/analytics/SmartInsightsCard.tsx
components/charts/web/AnalyticsPieChartWeb.tsx
components/charts/web/AnalyticsLineChartWeb.tsx
components/charts/web/AnalyticsBarChartWeb.tsx
```

## API Changes

### 1. Shadow Props → boxShadow

**Before (Deprecated)**:
```typescript
const styles = StyleSheet.create({
  card: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3, // Android
  },
});
```

**After (Current)**:
```typescript
const styles = StyleSheet.create({
  card: {
    boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    elevation: 3, // Preserved for Android
  },
});
```

**Key Points**:
- `boxShadow` uses CSS shadow syntax: `offsetX offsetY blurRadius color`
- Color and opacity are combined into rgba format
- `elevation` property is preserved for Android compatibility
- React Native Web automatically handles cross-platform rendering

### 2. Text Shadow Props → textShadow

**Before (Deprecated)**:
```typescript
const styles = StyleSheet.create({
  text: {
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 0.5 },
    textShadowRadius: 1,
  },
});
```

**After (Current)**:
```typescript
const styles = StyleSheet.create({
  text: {
    textShadow: '0px 0.5px 1px rgba(0, 0, 0, 0.1)',
  },
});
```

**Key Points**:
- `textShadow` uses CSS text-shadow syntax: `offsetX offsetY blurRadius color`
- Single string property instead of three separate properties
- Works consistently across web, iOS, and Android

### 3. TouchableWithoutFeedback → Pressable (Already Migrated)

The codebase was already using `Pressable` instead of the deprecated `TouchableWithoutFeedback` component. No changes were needed.

**Current Pattern**:
```typescript
import { Pressable } from 'react-native';

<Pressable
  onPress={handlePress}
  style={({ pressed }) => [
    styles.button,
    pressed && styles.pressed,
  ]}
>
  <Text>Press Me</Text>
</Pressable>
```

### 4. tintColor and pointerEvents (Already Correct)

The codebase was already using the correct patterns:
- `tintColor` as a prop (not in style)
- `pointerEvents` in style (not as a prop)

## Cross-Platform Compatibility

### Web
- `boxShadow` renders as CSS `box-shadow`
- `textShadow` renders as CSS `text-shadow`
- Full support for all shadow features

### iOS
- `boxShadow` is automatically converted to iOS shadow properties
- Native shadow rendering with proper performance
- `elevation` property is ignored (iOS-specific)

### Android
- `boxShadow` provides basic shadow support
- `elevation` property is used for Material Design shadows
- Both properties can coexist for optimal rendering

## Migration Script

### Location
`NestSync-frontend/scripts/migrate-deprecated-rn-web-apis.js`

### Usage

```bash
# Dry run (preview changes without modifying files)
node scripts/migrate-deprecated-rn-web-apis.js --dry-run

# Apply migrations
node scripts/migrate-deprecated-rn-web-apis.js

# Migrate specific directory
node scripts/migrate-deprecated-rn-web-apis.js --path=components/ui
```

### Features

- Automatically detects deprecated API usage
- Handles multi-line formatting
- Converts colors to rgba format
- Preserves `elevation` for Android
- Provides detailed migration report

## Testing Recommendations

### 1. Visual Regression Testing

Test all migrated components on each platform:

```bash
# Web
npx expo start --web

# iOS
npx expo start --ios

# Android
npx expo start --android
```

### 2. Shadow Rendering Verification

Check that shadows render correctly:
- Verify shadow color and opacity
- Check shadow offset (x, y)
- Confirm blur radius
- Test on light and dark backgrounds

### 3. Performance Testing

Monitor performance after migration:
- Shadow rendering should not impact frame rate
- No memory leaks from shadow calculations
- Smooth animations with shadows

## Troubleshooting

### Issue: Shadows not visible on Android

**Solution**: Ensure `elevation` property is present alongside `boxShadow`:

```typescript
style={{
  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
  elevation: 3, // Required for Android
}}
```

### Issue: Shadow color looks different on web vs native

**Solution**: Use rgba colors for consistent rendering:

```typescript
// ✅ Good - explicit rgba
boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)'

// ❌ Avoid - hex colors may render differently
boxShadow: '0px 2px 4px #00000019'
```

### Issue: Text shadow not rendering on Android

**Solution**: Text shadows have limited support on Android. Consider using:
- Stroke text for better visibility
- Background contrast instead of shadows
- Platform-specific styles if needed

```typescript
import { Platform } from 'react-native';

const styles = StyleSheet.create({
  text: {
    ...Platform.select({
      web: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      ios: {
        textShadow: '0px 1px 2px rgba(0, 0, 0, 0.1)',
      },
      android: {
        // Use alternative approach for Android
        // textShadow support is limited
      },
    }),
  },
});
```

## Future Considerations

### Monitoring for New Deprecations

Stay updated with React Native Web releases:
- Check release notes for new deprecations
- Monitor console warnings in development
- Update migration script as needed

### Automated Detection

Consider adding ESLint rules to prevent deprecated API usage:

```javascript
// .eslintrc.js
module.exports = {
  rules: {
    'react-native/no-deprecated-props': 'error',
  },
};
```

## References

- [React Native Web Documentation](https://necolas.github.io/react-native-web/)
- [React Native Shadow Props](https://reactnative.dev/docs/shadow-props)
- [CSS box-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/box-shadow)
- [CSS text-shadow](https://developer.mozilla.org/en-US/docs/Web/CSS/text-shadow)

## Related Documents

- [Component Guidelines](../../../NestSync-frontend/docs/component-guidelines.md)
- [JSX Structure Fixes Summary](../../fixes/ui-ux/jsx-structure-fixes-summary-20251110.md)
- [CLAUDE.md](../../../CLAUDE.md) - Development workflow patterns

---

**Migration Date**: November 10, 2025  
**Migration Script**: `scripts/migrate-deprecated-rn-web-apis.js`  
**Status**: ✅ Complete  
**Verified**: TypeScript compilation passing, no console warnings
