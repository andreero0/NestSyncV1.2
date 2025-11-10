---
title: "Manual Testing Quick Checklist"
date: 2025-11-09
category: "testing"
type: "checklist"
status: "active"
platforms: ["ios", "android"]
---

# Manual Testing Quick Checklist

**Print this page for quick reference during testing**

## Pre-Test Setup
- [ ] Build app on iOS device
- [ ] Build app on Android device
- [ ] Prepare test accounts (free trial, subscribed trial, active paid, expired)
- [ ] Create child profiles with various name lengths
- [ ] Set up different provincial addresses

---

## P0 Critical Issues

### Child Selection (Req 1.1)
- [ ] iOS: Select child → Check FAB modal → Restart app → Verify persistence
- [ ] Android: Select child → Check FAB modal → Force stop → Verify persistence
- [ ] Edge: Delete selected child → Verify auto-selection

### Subscription Cancellation (Req 1.2)
- [ ] iOS: Cancel subscription → Verify confirmation → Check loading → Verify success
- [ ] Android: Cancel subscription → Verify confirmation → Check loading → Verify success
- [ ] Error: Test with no network → Verify error message

### Back Buttons (Req 1.3)
- [ ] iOS: Check Add Order, View All Items, Setup New Item screens
- [ ] Android: Check same screens + hardware back button

### Placeholder Card (Req 1.4)
- [ ] iOS: Verify Smart Order Suggestions card removed
- [ ] Android: Verify Smart Order Suggestions card removed

---

## P1 User Experience

### Child Name Display (Req 2.1)
- [ ] iOS: Test names: "Max", "Emma", "Damilare", "Christopher", "Alexander James"
- [ ] Android: Test same names
- [ ] Verify no line breaks within names

### Button Consistency (Req 2.2)
- [ ] iOS: Check all screens for consistent button styling
- [ ] Android: Check all screens for consistent button styling
- [ ] Verify 48px minimum height on all buttons

### Demo Indicators (Req 2.3)
- [ ] iOS: Verify demo content clearly marked
- [ ] Android: Verify demo content clearly marked

---

## Trial Banners

### Free Trial User (Req 5.2)
- [ ] iOS: Login as free trial → Verify upgrade banner → Check tax display
- [ ] Android: Login as free trial → Verify upgrade banner → Check tax display

### Subscribed Trial User (Req 4.1-4.7)
- [ ] iOS: Login as subscribed trial → Verify green success banner → Check activation countdown
- [ ] Android: Login as subscribed trial → Verify green success banner → Check activation countdown
- [ ] Verify: Checkmark icon, plan name, tax breakdown, "Manage" button

### Active Paid User (Req 5.4)
- [ ] iOS: Login as active paid → Verify NO banner
- [ ] Android: Login as active paid → Verify NO banner

---

## Canadian Tax (Req 10.1-10.5)

- [ ] Ontario: Verify "13% HST"
- [ ] BC: Verify "12% GST + PST"
- [ ] Alberta: Verify "5% GST"
- [ ] Quebec: Verify "14.98% GST + QST"
- [ ] Unknown: Verify fallback message

---

## Design System Compliance

### Premium Upgrade (Req 6.1)
- [ ] iOS: Check colors, typography, spacing, shadows, borders
- [ ] Android: Check colors, typography, spacing, shadows, borders

### Reorder Flow (Req 6.2)
- [ ] iOS: Check design consistency
- [ ] Android: Check design consistency

### Size Prediction (Req 6.3)
- [ ] iOS: Check design consistency
- [ ] Android: Check design consistency

### Payment Screens (Req 6.4)
- [ ] iOS: Check design consistency
- [ ] Android: Check design consistency

---

## Accessibility

### Touch Targets (Req 9.3)
- [ ] iOS: Test all buttons are easily tappable
- [ ] Android: Test all buttons are easily tappable

### Screen Readers (Req 9.1-9.2)
- [ ] iOS: Enable VoiceOver → Test all screens
- [ ] Android: Enable TalkBack → Test all screens

### Keyboard Navigation (Req 9.4)
- [ ] Web: Test Tab navigation and focus indicators

---

## Regression Testing

### Core Features
- [ ] iOS: Inventory, Children, Activities, Settings, Auth
- [ ] Android: Inventory, Children, Activities, Settings, Auth

### Performance
- [ ] iOS: Test navigation speed, animations, offline handling
- [ ] Android: Test navigation speed, animations, offline handling

---

## Test Results Summary

**iOS Device**: _________________ **OS**: _______
**Tests Passed**: _____ / _____
**Critical Issues**: _____

**Android Device**: _________________ **OS**: _______
**Tests Passed**: _____ / _____
**Critical Issues**: _____

**Overall Status**: 
- [ ] Ready for production
- [ ] Needs fixes
- [ ] Major issues found

**Date**: _________________ **Tester**: _________________

---

**For detailed instructions, see**: MANUAL_DEVICE_TESTING_GUIDE.md
