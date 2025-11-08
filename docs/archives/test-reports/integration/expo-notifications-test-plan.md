---
title: "Expo Notifications Conditional Import Test Plan"
date: 2025-11-04
category: "integration-testing"
priority: "P0"
status: "test-plan"
impact: "critical"
platforms: ["android", "ios", "web"]
test_type: "integration"
test_environment: "development"
test_credentials: "parents@nestsync.com"
related_docs:
  - "NestSync-frontend/components/settings/NotificationPreferences.tsx"
  - "docs/troubleshooting/expo-notifications.md"
tags: ["expo-notifications", "conditional-import", "test-plan", "android-sdk-53"]
test_scenarios:
  - "expo-go-android"
  - "expo-go-ios"
  - "development-build"
  - "web-platform"
  - "regression-testing"
---

# Expo Notifications Conditional Import Test Plan

## Overview
This test plan verifies the conditional import fix for expo-notifications module unavailability in Expo Go for Android SDK 53+.

## Pre-Test Setup

### Development Environment
- Ensure both backend and frontend servers are running
- Backend: `cd NestSync-backend && source venv/bin/activate && uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
- Frontend: `cd NestSync-frontend && npx expo start --port 8082`

### Test Account
- Email: parents@nestsync.com
- Password: Shazam11#

## Test Scenarios

### Scenario 1: Expo Go Android Testing (SDK 53+)

**Test Platform**: Android device or emulator with Expo Go

**Steps**:
1. Launch app in Expo Go
2. Log in with test credentials
3. Navigate to Settings → Notification Preferences
4. Observe the UI

**Expected Results**:
- ✅ No application crash
- ✅ Orange warning banner appears at top of screen
- ✅ Warning text reads: "Push Notifications Unavailable"
- ✅ Explanation text: "Push notifications are not available in Expo Go for Android SDK 53+. To enable notifications, create a Development Build using EAS Build."
- ✅ Push notification toggle is disabled and grayed out
- ✅ Push notification description reads: "Requires Development Build (unavailable in Expo Go)"
- ✅ All other notification settings remain functional (email, quiet hours, etc.)
- ✅ Console shows: `[NotificationPreferences] expo-notifications not available in current environment (Expo Go)`
- ✅ Console shows: `[NotificationPreferences] Push notifications require a Development Build`
- ✅ Console shows: `[NotificationPreferences] Skipping push notification registration - module not available`

**Error Condition Checks**:
- ❌ NO crash on component mount
- ❌ NO "ERROR expo-notifications" in console
- ❌ NO "Module not found" errors
- ❌ NO infinite loading states

### Scenario 2: iOS Expo Go Testing (SDK 53+)

**Test Platform**: iOS device or simulator with Expo Go

**Steps**:
1. Launch app in Expo Go
2. Log in with test credentials
3. Navigate to Settings → Notification Preferences
4. Observe the UI

**Expected Results**:
- ✅ Application loads successfully
- ✅ No warning banner appears (expo-notifications may be available on iOS)
- ✅ Push notification toggle is active (if available) or disabled (if unavailable)
- ✅ All notification settings functional

**Note**: iOS behavior may differ - expo-notifications availability depends on Expo Go version and SDK compatibility.

### Scenario 3: Development Build Testing

**Test Platform**: Physical device with Development Build installed

**Prerequisites**:
1. Create Development Build: `eas build --profile development --platform android`
2. Install build on device

**Steps**:
1. Launch app in Development Build
2. Log in with test credentials
3. Navigate to Settings → Notification Preferences
4. Interact with all notification settings

**Expected Results**:
- ✅ No warning banner appears
- ✅ Push notification toggle is active and functional
- ✅ Tapping push notification toggle prompts for system permissions
- ✅ After granting permissions, device token is retrieved
- ✅ Push notification description reads: "Device registered for push notifications" (after registration)
- ✅ All notification types can be enabled/disabled
- ✅ Quiet hours time pickers work correctly
- ✅ Test notification button sends notification successfully (in __DEV__ mode)

### Scenario 4: Web Platform Testing

**Test Platform**: Web browser

**Steps**:
1. Launch app: `npx expo start --web`
2. Log in with test credentials
3. Navigate to Settings → Notification Preferences
4. Observe notification settings

**Expected Results**:
- ✅ Application loads without crashes
- ✅ Warning banner appears (expo-notifications not available in web)
- ✅ Push notification toggle is disabled
- ✅ Email notifications remain functional
- ✅ All non-push notification settings work correctly

### Scenario 5: Regression Testing - All Platforms

**Test Platforms**: Android Expo Go, iOS Expo Go, Development Build, Web

**Steps**:
1. Launch app on each platform
2. Navigate to Settings → Notification Preferences
3. Test each notification type toggle:
   - Enable Notifications (master switch)
   - Quiet Hours toggle
   - Critical Alerts
   - Important Notifications
   - Optional Notifications
   - Email Notifications
   - Stock Alerts
   - Change Reminders
   - Expiry Warnings
   - Health Tips
4. Test quiet hours time pickers
5. Test PIPEDA consent toggles

**Expected Results**:
- ✅ All toggles respond correctly (except push on unavailable platforms)
- ✅ Settings persist after navigation away and back
- ✅ GraphQL mutations succeed for all updates
- ✅ Success messages appear for setting changes
- ✅ Time pickers display correct values
- ✅ PIPEDA consent dates display correctly

## Console Log Verification

### Expected Console Messages (Expo Go Android)
```
[NotificationPreferences] expo-notifications not available in current environment (Expo Go)
[NotificationPreferences] Push notifications require a Development Build
[NotificationPreferences] Skipping push notification registration - module not available
```

### Expected Console Messages (Development Build)
```
(No special notification messages - module loads successfully)
```

### Unexpected Console Messages (Should NOT Appear)
```
ERROR expo-notifications: Android Push notifications functionality was removed from Expo Go with SDK 53
Module not found: expo-notifications
Cannot read property 'getPermissionsAsync' of null
TypeError: Notifications is null
```

## Performance Verification

### Loading Performance
- Component should render in < 2 seconds
- No blocking operations during conditional import
- Settings screen remains responsive

### Memory Usage
- No memory leaks from failed module imports
- Conditional import cleanup happens correctly
- Component unmount cleans up all listeners

## UI/UX Validation

### Visual Consistency
- Warning banner uses theme colors (warning color or fallback #FFA500)
- Icon properly aligned with text
- Disabled toggles use correct opacity/color
- Text remains readable in both light and dark themes

### Accessibility
- Warning text is accessible via screen readers
- Disabled toggles announce disabled state
- All interactive elements have proper touch targets
- Keyboard navigation works correctly (web)

## Rollback Plan

If issues are discovered during testing:

1. **Revert Commit**: Restore original implementation
2. **Apply Hotfix**: Use alternative conditional import strategy
3. **Notify Team**: Alert about notification functionality limitations
4. **Update Documentation**: Mark notifications as "Development Build Only"

## Success Criteria

### Critical (Must Pass)
- ✅ No application crashes on any platform
- ✅ Clear user communication about unavailable features
- ✅ All non-push notification features remain functional
- ✅ Development Build has full notification functionality

### Important (Should Pass)
- ✅ Console logs are clean and informative
- ✅ UI gracefully handles missing module
- ✅ Performance impact is negligible
- ✅ Code passes linting without errors/warnings

### Nice-to-Have
- ✅ Warning banner design matches app theme
- ✅ Helpful instructions for enabling notifications
- ✅ Documentation is comprehensive and clear

## Post-Deployment Monitoring

### Metrics to Track
- Crash rate in Expo Go vs Development Builds
- User feedback about notification setup confusion
- Adoption rate of Development Builds
- Push notification registration success rate

### Error Monitoring
- Watch for any module loading errors
- Monitor for null reference exceptions
- Track GraphQL mutation failures related to notifications
- Alert on unexpected console errors

## Documentation Updates Required

1. Update CLAUDE.md with conditional import pattern
2. Add to troubleshooting guide for team reference
3. Document Development Build requirement for notifications
4. Create user-facing FAQ about notification availability
