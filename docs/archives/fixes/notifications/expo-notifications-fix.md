---
title: "Expo Notifications Conditional Import Fix"
date: 2025-11-05
category: "notifications"
priority: "P1"
status: "resolved"
impact: "high"
platforms: ["android", "ios"]
related_docs:
  - "NestSync-frontend/components/settings/NotificationPreferences.tsx"
  - "docs/troubleshooting/expo-sdk-53-changes.md"
tags: ["expo-notifications", "sdk-53", "conditional-import", "android", "development-build"]
original_location: "NestSync-frontend/EXPO_NOTIFICATIONS_FIX_REPORT.md"
---

# Expo Notifications Conditional Import Fix Report

## Problem Statement

**Error**: `ERROR expo-notifications: Android Push notifications functionality was removed from Expo Go with SDK 53`

**Location**: `NestSync-frontend/components/settings/NotificationPreferences.tsx:23`

**Impact**: Application crashed in Expo Go for Android when navigating to notification preferences due to unconditional import of expo-notifications module.

## Root Cause Analysis

The expo-notifications module is not available in Expo Go for Android SDK 53+ due to security and functionality restrictions. The original implementation used an unconditional import statement:

```typescript
import * as Notifications from 'expo-notifications';
```

This caused the application to crash immediately when the module couldn't be loaded in Expo Go.

## Solution Implemented

### 1. Conditional Import Pattern

Replaced the static import with a dynamic require wrapped in try-catch:

```typescript
// Conditional import for expo-notifications
// This module is not available in Expo Go for Android SDK 53+
let Notifications: any = null;
let isNotificationsAvailable = false;

try {
  Notifications = require('expo-notifications');
  isNotificationsAvailable = true;
} catch (error) {
  console.log('[NotificationPreferences] expo-notifications not available in current environment (Expo Go)');
  console.log('[NotificationPreferences] Push notifications require a Development Build');
}
```

### 2. Registration Function Guard

Added availability check to prevent registration attempts when module is unavailable:

```typescript
const registerForPushNotifications = async () => {
  // Check if expo-notifications is available
  if (!isNotificationsAvailable) {
    console.log('[NotificationPreferences] Skipping push notification registration - module not available');
    return;
  }

  // ... rest of registration logic
};
```

### 3. User-Friendly UI Feedback

Added prominent notice banner when notifications are unavailable:

```typescript
{!isNotificationsAvailable && (
  <View style={[styles.unavailableNotice, { backgroundColor: colors.warning || '#FFA500', borderColor: colors.border }]}>
    <IconSymbol name="exclamationmark.triangle.fill" size={24} color="#FFFFFF" />
    <View style={styles.unavailableNoticeContent}>
      <Text style={styles.unavailableNoticeTitle}>
        Push Notifications Unavailable
      </Text>
      <Text style={styles.unavailableNoticeDescription}>
        Push notifications are not available in Expo Go for Android SDK 53+.
        To enable notifications, create a Development Build using EAS Build.
      </Text>
    </View>
  </View>
)}
```

### 4. Disabled Push Notification Toggle

Updated the push notification switch to show unavailable state:

```typescript
<Switch
  value={preferences.pushNotifications && isNotificationsAvailable}
  onValueChange={(value) => handleToggle('pushNotifications', value)}
  trackColor={{ false: colors.border, true: colors.tint }}
  thumbColor={preferences.pushNotifications ? '#FFFFFF' : colors.background}
  disabled={updating || !preferences.notificationsEnabled || !isNotificationsAvailable}
/>
```

### 5. Updated UI Text

Changed push notification description to reflect availability:

```typescript
<ThemedText style={[styles.settingDescription, { color: colors.textSecondary }]}>
  {!isNotificationsAvailable
    ? 'Requires Development Build (unavailable in Expo Go)'
    : deviceToken
      ? 'Device registered for push notifications'
      : 'Device not registered'
  }
</ThemedText>
```

## Files Modified

1. **NestSync-frontend/components/settings/NotificationPreferences.tsx**
   - Added Platform import
   - Implemented conditional import with try-catch
   - Added isNotificationsAvailable flag
   - Added registration guard
   - Added unavailable notice UI
   - Updated push notification toggle
   - Added styles for unavailable notice

## Testing Recommendations

### Expo Go Testing (Android SDK 53+)
1. Launch app in Expo Go
2. Navigate to Settings → Notification Preferences
3. Verify:
   - No crash occurs
   - Orange warning banner appears at top
   - Push notification toggle is disabled and grayed out
   - Description text shows "Requires Development Build"
   - Console shows: `[NotificationPreferences] expo-notifications not available in current environment`

### Development Build Testing
1. Create Development Build with `eas build --profile development`
2. Install build on physical device
3. Navigate to Notification Preferences
4. Verify:
   - No warning banner appears
   - All notification toggles are functional
   - Push notification registration works
   - Device token is retrieved successfully

## Expected Behavior

### In Expo Go (Android SDK 53+)
- Application loads without crashes
- Warning banner clearly explains limitations
- Push notification toggle is disabled with explanation
- All other notification settings (email, quiet hours) remain functional
- User understands they need Development Build for push notifications

### In Development Build
- Full notification functionality available
- All toggles active and functional
- Push notification registration works
- No warning banners or restrictions

## Benefits

1. **No More Crashes**: Graceful handling of missing module
2. **Clear Communication**: Users understand why feature is unavailable
3. **Preserved Functionality**: All non-push notification features work
4. **Development Guidance**: Clear path to enable functionality (Development Build)
5. **Professional UX**: Disabled state with helpful messaging instead of crash

## Related Documentation

- **Expo Notifications SDK 53 Changes**: https://docs.expo.dev/versions/latest/sdk/notifications/
- **Development Builds**: https://docs.expo.dev/develop/development-builds/introduction/
- **Platform-Specific Module Loading**: React Native conditional imports best practices

## Code Quality Notes

- Added proper TypeScript typing (Notifications: any)
- Included console logging for debugging
- Maintained PIPEDA compliance UI patterns
- Preserved all existing functionality when module IS available
- Follows React Native best practices for conditional module loading

## Prevention Strategy

For future modules that may not be available in Expo Go:

1. Always check Expo SDK release notes for Expo Go limitations
2. Implement conditional imports for native modules
3. Add availability flags for feature detection
4. Provide user-friendly UI feedback when features are unavailable
5. Test in both Expo Go and Development Build environments
