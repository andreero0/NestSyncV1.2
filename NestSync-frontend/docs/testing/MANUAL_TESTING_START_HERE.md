---
title: "Manual Testing - Start Here"
date: 2025-11-09
category: "testing"
type: "guide"
status: "active"
platforms: ["ios", "android"]
---

# Manual Device Testing - Start Here

## Quick Start Guide

This guide will help you get started with manual device testing for the Design Consistency and User Issues specification.

## What You Need

### Hardware
- ✅ iOS device (iPhone running iOS 14+)
- ✅ Android device (running Android 10+)
- ✅ Computer with development environment set up

### Software
- ✅ Xcode (for iOS builds)
- ✅ Android Studio (for Android builds)
- ✅ Expo CLI installed
- ✅ NestSync backend running (or access to staging environment)

### Test Accounts
You'll need accounts in different subscription states:
- Free trial user (no subscription)
- Subscribed trial user (subscription in "trialing" status)
- Active paid user (active subscription)
- Expired trial user (optional)

## Step-by-Step Process

### Step 1: Build the Application

**For iOS**:
```bash
cd NestSync-frontend
npx expo run:ios --device
```

**For Android**:
```bash
cd NestSync-frontend
npx expo run:android --device
```

### Step 2: Choose Your Testing Approach

**Option A: Comprehensive Testing** (Recommended)
- Use the full guide: `MANUAL_DEVICE_TESTING_GUIDE.md`
- Estimated time: 2-3 hours per platform
- Tests all requirements thoroughly

**Option B: Quick Validation**
- Use the quick checklist: `MANUAL_TESTING_QUICK_CHECKLIST.md`
- Estimated time: 30-45 minutes per platform
- Tests critical functionality only

### Step 3: Record Your Results

Use the template: `MANUAL_TESTING_RESULTS_TEMPLATE.md`

1. Copy the template to a new file:
   ```bash
   cp MANUAL_TESTING_RESULTS_TEMPLATE.md MANUAL_TESTING_RESULTS_$(date +%Y%m%d).md
   ```

2. Fill in the template as you test
3. Mark each test as: ✅ PASS | ❌ FAIL | ⚠️ PARTIAL | 🔄 BLOCKED

### Step 4: Report Issues

For any bugs found, create an issue with:
- Clear description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- Device info (model, OS version)

### Step 5: Complete Testing

After finishing all tests:
1. Calculate pass rates
2. Summarize critical issues
3. Make release recommendation
4. Share results with team
5. Update task status in tasks.md

## Testing Priority

If you have limited time, test in this order:

### Priority 1: Critical User Issues (P0)
1. Child selection state management
2. Subscription cancellation
3. Back button navigation
4. Placeholder card removal

### Priority 2: Trial Banners
1. Free trial banner
2. Subscribed trial banner
3. Active paid user (no banner)

### Priority 3: User Experience
1. Child name display
2. Button consistency
3. Demo indicators

### Priority 4: Design System
1. Premium upgrade flow
2. Reorder flow
3. Payment screens

### Priority 5: Accessibility
1. Touch target sizes
2. Screen reader support

### Priority 6: Regression Testing
1. Existing functionality
2. Performance

## Common Issues to Watch For

### Child Selection
- ❌ FAB modal shows "Please Select a Child" when child is selected
- ❌ Selection resets after app restart
- ❌ Selection doesn't persist across screens

### Subscription Cancellation
- ❌ "Failed to Cancel Subscription" error
- ❌ No confirmation dialog
- ❌ No loading state
- ❌ Poor error messages

### Trial Banners
- ❌ Wrong banner type for subscription state
- ❌ "Already subscribed" message for free trial users
- ❌ Missing tax information
- ❌ Incorrect tax calculations

### Design Consistency
- ❌ Buttons with different styles across screens
- ❌ Inconsistent colors (not using design tokens)
- ❌ Spacing not using 4px base unit
- ❌ Touch targets smaller than 48px

### Text Display
- ❌ Child names breaking across lines (e.g., "Damil are")
- ❌ Text truncation issues
- ❌ Overlapping text

## Tips for Effective Testing

### 1. Test Systematically
- Follow the checklist in order
- Don't skip steps
- Document everything

### 2. Test Edge Cases
- Very long names
- No network connection
- Multiple rapid taps
- App backgrounding/foregrounding

### 3. Compare Platforms
- Note differences between iOS and Android
- Test platform-specific features (hardware back button on Android)

### 4. Use Accessibility Tools
- Enable VoiceOver (iOS) or TalkBack (Android)
- Test with larger text sizes
- Test with reduced motion

### 5. Take Screenshots
- Capture issues visually
- Compare before/after if possible
- Document design inconsistencies

### 6. Test Performance
- Navigate quickly between screens
- Test with poor network
- Monitor battery usage
- Check memory usage

## Troubleshooting

### Build Issues

**iOS build fails**:
```bash
cd ios
pod install
cd ..
npx expo run:ios --device
```

**Android build fails**:
```bash
cd android
./gradlew clean
cd ..
npx expo run:android --device
```

### App Crashes

1. Check device logs:
   - iOS: Xcode > Window > Devices and Simulators
   - Android: `adb logcat`

2. Clear app data and retry

3. Rebuild the app

### Test Account Issues

If you can't create test accounts:
1. Use existing demo accounts
2. Manually modify subscription status in database (development only)
3. Contact backend team for test account setup

## Quick Reference

### Document Locations

- **Full Guide**: `MANUAL_DEVICE_TESTING_GUIDE.md`
- **Quick Checklist**: `MANUAL_TESTING_QUICK_CHECKLIST.md`
- **Results Template**: `MANUAL_TESTING_RESULTS_TEMPLATE.md`
- **Requirements**: `../../../.kiro/specs/design-consistency-and-user-issues/requirements.md`
- **Design**: `../../../.kiro/specs/design-consistency-and-user-issues/design.md`

### Related Tests

- **Visual Regression**: `VISUAL_REGRESSION_TESTS.md`
- **Accessibility**: `ACCESSIBILITY_COMPLIANCE_TESTS.md`
- **Design Compliance**: `DESIGN_COMPLIANCE_TESTS_SUMMARY.md`

## Questions?

If you encounter issues or have questions:
1. Check the full testing guide for detailed instructions
2. Review the requirements and design documents
3. Consult with the development team
4. Document blockers in the results template

## Ready to Start?

1. ✅ Build app on devices
2. ✅ Prepare test accounts
3. ✅ Open testing guide or checklist
4. ✅ Open results template
5. ✅ Start testing!

---

**Good luck with testing!** 🚀

Remember: Thorough testing now prevents issues in production later.
