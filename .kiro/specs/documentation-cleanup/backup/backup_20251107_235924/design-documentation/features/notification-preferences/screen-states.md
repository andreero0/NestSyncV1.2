# Notification Preferences - Screen States

Detailed wireframe specifications for notification preference screens including granular controls, quiet hours setup, priority configurations, and notification history management.

---
title: Notification Preferences Screen States
description: Comprehensive wireframe specifications for notification management interfaces
feature: Notification Preferences
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - NativeBase component library
  - Expo Notifications API
  - React Native Switch components
  - Custom time picker components
status: approved
---

## Screen Architecture Overview

### Navigation Structure
```
Settings Screen → Notification Preferences
├── Main Preferences (Primary Screen)
├── Quiet Hours Setup (Modal/Slide-up)
├── Priority Configuration (Full Screen)
├── Category Management (Full Screen) 
├── Caregiver Coordination (Full Screen)
├── Professional Settings (Full Screen)
├── Notification History (Full Screen)
├── Test Notifications (Modal)
└── Privacy Controls (Full Screen)
```

## Primary Screen: Main Notification Preferences

### Layout Structure

**Header Section** (Fixed, 72px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back    Notification Settings           Test   │
│                                                      │
│  Smart notifications that respect your schedule      │
└─────────────────────────────────────────────────────┘
```

**Status Overview Card** (120px height, rounded 12px)
```
┌─────────────────────────────────────────────────────┐
│  Notification Health Score: 87/100              │
│                                                     │
│  ✓ Quiet hours active     3 priority types on   │
│  ✓ 2 caregivers synced    Learning your habits │
└─────────────────────────────────────────────────────┘
```

**Quick Actions Section** (200px height)
```
┌─────────────────────────────────────────────────────┐
│  Quick Setup                                        │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  Quiet   │  │  Priority │  │  Family   │ │
│  │   Hours     │  │   Levels    │  │   Sync       │ │
│  │   Setup     │  │             │  │              │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  History │  │  Test    │  │  Privacy  │ │
│  │   & Logs    │  │   Settings  │  │   Controls   │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Notification Categories** (Expandable sections, 60px each collapsed)
```
┌─────────────────────────────────────────────────────┐
│  Notification Types                                 │
│                                                     │
│  Diaper Reminders                    ✓ ON       │
│      Every 3 hours • High priority                 │
│                                                     │
│  Inventory Alerts                    ✓ ON       │
│      2 days before empty • Standard priority       │
│                                                     │
│  Milestone Updates                   ✓ ON       │
│      Real-time celebrations • Standard priority    │
│                                                     │
│  Family Coordination                 ✓ ON       │
│      Caregiver handoffs • High priority           │
│                                                     │
│  System Updates                     ✓ ON       │
│      Weekly digest • Low priority                  │
└─────────────────────────────────────────────────────┘
```

**Emergency Override Section** (100px height, warning styling)
```
┌─────────────────────────────────────────────────────┐
│  Emergency Overrides                             │
│                                                     │
│  ✓ Medical alerts break through quiet hours        │
│  ✓ Critical system failures override all settings  │
│  ✓ Emergency contacts can reach you anytime        │
│                                        Configure →  │
└─────────────────────────────────────────────────────┘
```

### Visual Design Specifications

**Color Scheme:**
- Background: `Neutral-50` (#FAFAFA)
- Card backgrounds: `White` with 2px border `Neutral-200`
- Active toggles: `Primary-500` (#3B82F6)
- Priority indicators: Emergency `Error-500`, High `Warning-500`, Standard `Primary-300`, Low `Neutral-400`
- Status indicators: Green `Success-500` for healthy, Orange `Warning-500` for attention needed

**Typography:**
- Screen title: `H3` (24px, Semibold, Neutral-900)
- Subtitle: `Body` (16px, Regular, Neutral-600)
- Category names: `Body Large` (18px, Medium, Neutral-900)
- Setting descriptions: `Body Small` (14px, Regular, Neutral-600)
- Status text: `Caption` (12px, Medium, color-coded by status)

**Spacing:**
- Screen padding: `24px` horizontal, `16px` vertical
- Card internal padding: `20px` 
- Section spacing: `24px` vertical between major sections
- Element spacing: `12px` vertical between related elements
- Button spacing: `16px` between action buttons

## Modal Screen: Quiet Hours Setup

### Layout Structure (Slide-up modal, 70% screen height)

**Modal Header** (60px height)
```
┌─────────────────────────────────────────────────────┐
│                 Quiet Hours                      │
│                                                     │
│  ✕                                            Save  │
└─────────────────────────────────────────────────────┘
```

**Smart Detection Toggle** (80px height)
```
┌─────────────────────────────────────────────────────┐
│  Smart Sleep Detection               ✓ ON       │
│                                                     │
│  Let NestSync learn your sleep patterns and        │
│  automatically adjust quiet hours                  │
└─────────────────────────────────────────────────────┘
```

**Manual Schedule Section** (Conditional display when smart detection OFF)
```
┌─────────────────────────────────────────────────────┐
│  Weekly Schedule                                 │
│                                                     │
│  Weekdays (Mon-Fri)                                │
│  ┌─────────────┐        ┌─────────────┐            │
│  │   10:00 PM  │   to   │   7:00 AM   │            │
│  └─────────────┘        └─────────────┘            │
│                                                     │
│  Weekends (Sat-Sun)                                │
│  ┌─────────────┐        ┌─────────────┐            │
│  │   11:00 PM  │   to   │   8:00 AM   │            │
│  └─────────────┘        └─────────────┘            │
└─────────────────────────────────────────────────────┘
```

**Current Status Display** (100px height)
```
┌─────────────────────────────────────────────────────┐
│  Your Sleep Pattern (Last 7 Days)               │
│                                                     │
│  Average bedtime: 10:23 PM                         │
│  Average wake time: 6:47 AM                        │
│  Sleep quality score: 7.2/10                       │
│                                                     │
│  Suggested quiet hours: 10:00 PM - 7:00 AM      │
└─────────────────────────────────────────────────────┘
```

**Emergency Override Options** (120px height)
```
┌─────────────────────────────────────────────────────┐
│  What can wake you during quiet hours?          │
│                                                     │
│  ✓ Medical emergencies & safety alerts             │
│  ✓ Emergency contacts calling multiple times       │
│  ✓ Critical system failures requiring action       │
│  ✗ Regular diaper reminders                        │
│  ✗ Inventory alerts                                │
│  ✗ Social notifications                            │
└─────────────────────────────────────────────────────┘
```

## Full Screen: Priority Configuration

### Layout Structure

**Header with Current Status** (100px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back      Priority Levels              Test   │
│                                                     │
│  Control which notifications are most important     │
│                                                     │
│  Current: 2 Emergency • 4 High • 8 Standard • 3 Low│
└─────────────────────────────────────────────────────┘
```

**Priority Level Cards** (Each 140px height)

**Emergency Priority Card** (Red accent border)
```
┌─────────────────────────────────────────────────────┐
│  EMERGENCY - Always Delivered                   │
│                                                     │
│  Breaks through all quiet hours and filters        │
│                                                     │
│  Current notifications in this category:           │
│  • Medical alerts & safety warnings                │
│  • Emergency contact attempts (3+ calls)           │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Add Type  │  │  Configure  │  │    Test      │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

**High Priority Card** (Orange accent border)
```
┌─────────────────────────────────────────────────────┐
│  HIGH PRIORITY - Important & Timely             │
│                                                     │
│  Delayed during quiet hours but delivered early AM │
│                                                     │
│  Current notifications in this category:           │
│  • Low diaper supply (< 2 days remaining)          │
│  • Missed feeding window (> 4 hours)               │
│  • Caregiver handoff requests                      │
│  • Medication reminders                            │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Add Type  │  │  Configure  │  │    Test      │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Standard Priority Card** (Blue accent border)
```
┌─────────────────────────────────────────────────────┐
│  STANDARD - Regular Updates                     │
│                                                     │
│  Delivered at appropriate times, batched if needed │
│                                                     │
│  Current notifications in this category:           │
│  • Regular diaper change reminders                 │
│  • Milestone celebrations                          │
│  • Family sharing notifications                    │
│  • Weekly summary reports                          │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Add Type  │  │  Configure  │  │    Test      │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Low Priority Card** (Gray accent border)
```
┌─────────────────────────────────────────────────────┐
│  LOW PRIORITY - When Convenient                 │
│                                                     │
│  Bundled into daily/weekly digests                 │
│                                                     │
│  Current notifications in this category:           │
│  • Tips and suggestions                            │
│  • Community updates                               │
│  • App feature announcements                       │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │   Add Type  │  │  Configure  │  │    Test      │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

## Full Screen: Caregiver Coordination

### Layout Structure

**Header with Family Status** (120px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back     Family Coordination                     │
│                                                     │
│  Coordinate notifications across family members     │
│                                                     │
│  Connected: Sarah (You), Mike, Grandma Pat      │
│  🎯 Active caregiver: Sarah (since 2:00 PM today)  │
└─────────────────────────────────────────────────────┘
```

**Active Caregiver Section** (160px height)
```
┌─────────────────────────────────────────────────────┐
│  🎯 Who's On Duty Right Now?                       │
│                                                     │
│  ┌─────────────────┐    Currently Active           │
│  │     Sarah       │    Receiving all alerts    │
│  │   (You)         │    Since 2:00 PM today     │
│  └─────────────────┘    At home                 │
│                                                     │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐ │
│  │  Hand Off   │  │   Take      │  │   Schedule   │ │
│  │   to Mike   │  │   Break     │  │    Shifts    │ │
│  └─────────────┘  └─────────────┘  └──────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Family Member Cards** (Each 100px height)

**Sarah (Current User) Card**
```
┌─────────────────────────────────────────────────────┐
│  👑 Sarah (You) - Primary Caregiver                │
│                                                     │
│  Status: Active • Location: Home • Battery: 67%    │
│  Notifications: All types • Quiet: 10 PM - 7 AM    │
│                                                     │
│  Configure Settings                              │
└─────────────────────────────────────────────────────┘
```

**Mike (Partner) Card**
```
┌─────────────────────────────────────────────────────┐
│  Mike - Partner                                  │
│                                                     │
│  Status: Backup • Location: Work • Battery: 45%    │
│  Notifications: High priority only • Quiet: 11-6   │
│                                                     │
│  Send Handoff Request                           │
└─────────────────────────────────────────────────────┘
```

**Grandma Pat (Extended Family) Card**
```
┌─────────────────────────────────────────────────────┐
│  Grandma Pat - Emergency Contact                │
│                                                     │
│  Status: Emergency only • Location: Unknown        │
│  Notifications: Emergency + Medical only           │
│                                                     │
│  Emergency Contact Settings                     │
└─────────────────────────────────────────────────────┘
```

**Handoff Coordination** (180px height)
```
┌─────────────────────────────────────────────────────┐
│  Smooth Handoff System                          │
│                                                     │
│  When you hand off caregiving responsibilities:    │
│                                                     │
│  ✓ New caregiver gets current status summary       │
│  ✓ Recent activities and timing shared             │
│  ✓ Upcoming needs and reminders transferred        │
│  ✓ Previous caregiver stops getting routine alerts │
│                                                     │
│  Handoff includes:                                 │
│  • Last diaper change: 1:30 PM (wet)               │
│  • Next feeding due: 4:00 PM                       │
│  • Current mood: Happy & playful                   │
│  • Special notes: Teething, give frozen washcloth  │
└─────────────────────────────────────────────────────┘
```

## Full Screen: Notification History

### Layout Structure

**Header with Filters** (100px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back      Notification History         Filter │
│                                                     │
│  Last 30 days: 147 delivered • 89% engaged with │
│                                                     │
│  [All Types ▼] [Last 7 Days ▼] [All Caregivers ▼]  │
└─────────────────────────────────────────────────────┘
```

**Stats Overview Cards** (120px height)
```
┌─────────────────────────────────────────────────────┐
│  Your Notification Insights                     │
│                                                     │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌────────────┐ │
│  │   89%   │ │  6.2min │ │   12    │ │   3.7/5    │ │
│  │Response │ │ Avg     │ │ Quiet   │ │ Stress     │ │
│  │  Rate   │ │Response │ │ Hours   │ │  Level     │ │
│  │         │ │  Time   │ │Respected│ │  Impact    │ │
│  └─────────┘ └─────────┘ └─────────┘ └────────────┘ │
└─────────────────────────────────────────────────────┘
```

**Notification Timeline** (Scrollable list, each item 80px)

**Today Section**
```
┌─────────────────────────────────────────────────────┐
│  Today - January 21, 2025                          │
│                                                     │
│  3:45 PM  Diaper Change Reminder    ✓ Acted  │
│              High Priority • Delivered immediately │
│                                                     │
│  1:30 PM  Milestone: First Laugh!   ✓ Viewed │
│              Standard Priority • Delivered on time │
│                                                     │
│  9:00 AM  Diaper Supply Low         ✓ Acted  │
│              High Priority • Woke you early        │
└─────────────────────────────────────────────────────┘
```

**Yesterday Section**
```
┌─────────────────────────────────────────────────────┐
│  Yesterday - January 20, 2025                      │
│                                                     │
│  11:30 PM Quiet hours started      Auto      │
│              System • 6 notifications queued       │
│                                                     │
│  6:45 PM  Mike took over caregiving ✓ Viewed │
│              High Priority • Handoff completed     │
│                                                     │
│  2:15 PM  Diaper Change Reminder    Missed │
│              Standard Priority • No response (nap) │
└─────────────────────────────────────────────────────┘
```

**Detailed Notification Item** (Expandable to 140px on tap)
```
┌─────────────────────────────────────────────────────┐
│  3:45 PM  Diaper Change Reminder    ✓ Acted  │
│              High Priority • Delivered immediately │
│                                                     │
│  ▼ Expanded Details                                 │
│  Triggered: 3 hours since last change           │
│  🎯 Delivered to: Sarah (primary caregiver)        │
│  Priority: High (child comfort threshold)       │
│  Response: Logged change at 3:47 PM             │
│  🧠 AI Note: Pattern consistent with usual timing  │
│                                                     │
│  Actions: [View Log Entry] [Similar Notifications] │
└─────────────────────────────────────────────────────┘
```

## Modal Screen: Test Notifications

### Layout Structure (Bottom sheet, 60% screen height)

**Header** (60px height)
```
┌─────────────────────────────────────────────────────┐
│              Test Your Settings                  │
│                                                     │
│  ✕                                          Done    │
└─────────────────────────────────────────────────────┘
```

**Test Categories** (Each 100px height)
```
┌─────────────────────────────────────────────────────┐
│  Try your notification settings safely              │
│                                                     │
│  Emergency Alert Test                           │
│  See how emergency notifications break through     │
│  [Send Test Emergency] [Last tested: Never]        │
│                                                     │
│  High Priority Test                              │
│  Test important notifications during quiet hours   │
│  [Send Test High] [Last tested: 2 days ago]        │
│                                                     │
│  Standard Notification Test                     │
│  Test regular notifications and batching           │
│  [Send Test Standard] [Last tested: Just now]      │
│                                                     │
│  Quiet Hours Respect Test                       │
│  Verify notifications wait during sleep time       │
│  [Send Test Quiet] [Will deliver at 7:00 AM]       │
└─────────────────────────────────────────────────────┘
```

**Test Results Display** (120px height, appears after test)
```
┌─────────────────────────────────────────────────────┐
│  Test Results - Standard Notification            │
│                                                     │
│  Delivered: Immediately (not quiet hours)       │
│  🔊 Sound: Default notification sound               │
│  📳 Vibration: Two gentle pulses                    │
│  📺 Display: Banner + badge on app icon             │
│  🎯 Recipient: You (primary caregiver)              │
│                                                     │
│  Tip: This would be batched with similar        │
│      notifications if received within 15 minutes   │
└─────────────────────────────────────────────────────┘
```

## Full Screen: Professional Settings

### Layout Structure

**Header** (80px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back    Professional Integration                 │
│                                                     │
│  Connect with daycare and healthcare providers      │
└─────────────────────────────────────────────────────┘
```

**Daycare Integration Section** (200px height)
```
┌─────────────────────────────────────────────────────┐
│  Daycare Provider Settings                      │
│                                                     │
│  Provider: Little Steps Learning Centre             │
│  Contact: Ms. Jennifer (jennifer@littlesteps.ca)   │
│  Status: ✓ Connected                                │
│                                                     │
│  Notification Preferences:                         │
│  ✓ Daily summary at pickup time (4:30 PM)          │
│  ✓ Emergency alerts immediately                    │
│  ✓ Behavior/milestone updates real-time            │
│  ✗ Feeding/diaper logs (handled by daycare)        │
│                                                     │
│  Privacy Level: Standard (summary data only)       │
│                                                     │
│  [Configure Settings] [View Shared Data] [Disconnect]│
└─────────────────────────────────────────────────────┘
```

**Healthcare Integration Section** (200px height)
```
┌─────────────────────────────────────────────────────┐
│  Healthcare Provider Settings                   │
│                                                     │
│  Pediatrician: Dr. Sarah Chen, Family Care Clinic  │
│  Contact: admin@familycarebc.ca                     │
│  Status: Pending your consent                    │
│                                                     │
│  Potential Notifications:                          │
│  ⏰ Appointment reminders (24h + 1h before)         │
│  💉 Vaccination schedule updates                    │
│  Growth milestone sharing (with consent)         │
│  Emergency medical information access            │
│                                                     │
│  Privacy Level: Minimal (appointments only)        │
│                                                     │
│  [Grant Consent] [Configure Access] [Learn More]   │
└─────────────────────────────────────────────────────┘
```

**Emergency Contacts** (160px height)
```
┌─────────────────────────────────────────────────────┐
│  Emergency Contact Notifications                │
│                                                     │
│  These contacts can override quiet hours in        │
│  emergencies (3+ calls within 15 minutes):         │
│                                                     │
│  Grandma Pat      +1 (604) 555-0123  [Remove]   │
│  Dr. Chen Office  +1 (604) 555-4567  [Remove]   │
│  Children's Hosp. +1 (604) 555-8900  [Remove]   │
│                                                     │
│  [+ Add Emergency Contact]                          │
│                                                     │
│  Emergency Override Settings                     │
└─────────────────────────────────────────────────────┘
```

## Full Screen: Privacy Controls

### Layout Structure

**Header with Privacy Score** (100px height)
```
┌─────────────────────────────────────────────────────┐
│  ← Back       Privacy Controls                      │
│                                                     │
│  Privacy Score: A+ (Maximum Protection)          │
│  Your notification data is secure and minimal      │
└─────────────────────────────────────────────────────┘
```

**Data Collection Controls** (240px height)
```
┌─────────────────────────────────────────────────────┐
│  What We Collect About Your Notifications       │
│                                                     │
│  Behavioral Pattern Analysis            ✓ ON       │
│  Improves timing and reduces overwhelm             │
│  Data stays on your device                         │
│                                                     │
│  Sleep Schedule Detection              ✓ ON        │
│  Protects your quiet hours automatically           │
│  Encrypted and never shared                        │
│                                                     │
│  Notification Response Tracking        ✓ ON        │
│  Learns which alerts are most helpful to you       │
│  Anonymous analytics only                          │
│                                                     │
│  Cross-Device Synchronization          ✓ ON        │
│  Keeps family members' settings in sync            │
│  End-to-end encrypted between devices              │
│                                                     │
│  [Learn More About Our Privacy Practices]          │
└─────────────────────────────────────────────────────┘
```

**Canadian Privacy Rights** (200px height)
```
┌─────────────────────────────────────────────────────┐
│  Your Canadian Privacy Rights (PIPEDA)          │
│                                                     │
│  ✓ Right to know what data we collect               │
│  ✓ Right to access your data anytime                │
│  ✓ Right to correct inaccurate information          │
│  ✓ Right to delete your data completely             │
│  ✓ Right to data portability (export format)       │
│                                                     │
│  Data Location: All stored on Canadian servers      │
│  Retention: Auto-deleted after 2 years inactive    │
│  Sharing: Never sold, minimal necessary sharing     │
│                                                     │
│  [Export My Data] [Delete All Data] [Contact DPO]   │
└─────────────────────────────────────────────────────┘
```

**Consent Management** (160px height)
```
┌─────────────────────────────────────────────────────┐
│  Consent & Agreement History                     │
│                                                     │
│  Privacy Policy v3.1    ✓ Agreed Jan 15, 2025     │
│  Terms of Service v2.4  ✓ Agreed Jan 15, 2025     │
│  AI Learning Consent    ✓ Agreed Jan 15, 2025     │
│  Healthcare Integration ⏳ Pending your decision    │
│  Marketing Communications ✗ Declined               │
│                                                     │
│  Next Review Due: July 15, 2025 (6 months)        │
│                                                     │
│  [Review Agreements] [Update Preferences]          │
└─────────────────────────────────────────────────────┘
```

## Responsive Design Adaptations

### Mobile (320px - 767px)

**Adaptations:**
- Single column layout throughout
- Quick action cards stack vertically (1 column instead of 3x2)
- Category settings collapse to show only name and toggle initially
- Modal screens use full height instead of partial overlay
- Touch targets minimum 44px height for accessibility
- Simplified typography hierarchy for small screens

**Navigation:**
- Bottom sheet modals for secondary screens
- Back button prominently displayed in top-left
- Swipe gestures for modal dismissal
- Tab navigation maintained for primary sections

### Tablet (768px - 1023px)

**Adaptations:**
- Two-column layout where appropriate (settings + details)
- Quick action cards in 2x3 grid layout
- Side-by-side modal presentations for settings flows
- Larger touch targets (48px minimum)
- Enhanced typography with better hierarchy

**Navigation:**
- Slide-over modals that don't cover entire screen
- Master-detail view for notification history
- Splitview capability for comparing settings
- Enhanced keyboard navigation support

### Desktop/Web (1024px+)

**Adaptations:**
- Three-column layout for complex screens (nav + content + details)
- Hover states for all interactive elements
- Keyboard shortcuts and navigation
- Larger content areas with better use of whitespace
- Enhanced data visualization for notification analytics

**Navigation:**
- Traditional modal overlays with backdrop
- Breadcrumb navigation for deeper sections  
- Keyboard focus management and tab order
- Enhanced accessibility features for screen readers

## Accessibility Specifications

### Screen Reader Support
- All toggle states announced clearly ("Quiet hours enabled" vs "Quiet hours disabled")
- Priority levels announced with context ("High priority, breaks through quiet hours")
- Time selections announced in user's preferred format
- Caregiver status changes announced immediately
- Test notification results announced with full context

### Keyboard Navigation
- Tab order follows logical visual hierarchy
- All interactive elements reachable via keyboard
- Modal focus trapping implemented correctly
- Escape key dismisses modals and returns focus appropriately
- Enter/Space activate buttons and toggles consistently

### Visual Accessibility
- High contrast mode support with enhanced color differentiation
- Large text mode support with responsive typography scaling
- Motion reduction support for users sensitive to animations
- Color-blind friendly palette for priority level indicators
- Clear focus indicators for keyboard navigation (2px outline, high contrast)

### Cognitive Accessibility
- Consistent interaction patterns across all screens
- Clear, jargon-free language throughout interface
- Visual icons paired with text labels
- Progress indicators for multi-step processes
- Confirmation dialogs for destructive actions (delete, reset)
- Help text and tooltips for complex features