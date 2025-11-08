# Core Navigation Screen States & Wireframes

Detailed ASCII wireframes and state specifications for all three primary screens with context-aware FAB behavior and psychological design methodology.

---
title: Core Navigation Screen States & Wireframes
description: Complete visual specifications for Home, Planner, and Settings screens with psychological rationale
feature: Core Navigation
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - NativeBase components
  - React Native Reanimated
  - Expo Haptics
status: approved
---

## Screen State Overview

Each screen state includes:
- **ASCII Wireframe**: Visual layout with exact positioning
- **Component Specifications**: NativeBase integration details
- **Psychological Rationale**: Why each element is positioned and styled
- **Interaction Patterns**: Touch targets, animations, feedback
- **Responsive Adaptations**: How layout changes across screen sizes

---

## Home Screen States

### State: Default Home Screen

**Purpose**: Provide immediate situational awareness and reassurance to stressed parents about diaper supply status.

**Psychological Focus**: Anxiety reduction through clear status communication and immediate access to primary actions.

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │ ← Status Bar (44px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NestSync         [[USER]] [[BELL]] [[SETTINGS]]                      │ ← Header (60px)
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │ ← 16px margin
│  [BABY] Emma (8 weeks)                            [▼]       │ ← Child Selector (44px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │ 
│  │                                                     │ │ ← Status Card (120px)
│  │        [BOX] Days of Cover                             │ │
│  │                                                     │ │
│  │             3 days                                  │ │ ← Primary status (48px)
│  │                                                     │ │
│  │        [WARNING] Reorder Soon                             │ │ ← Secondary status
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← 24px spacing
│  Recent Activity                                        │ ← Section Header (24px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 2:30 PM    [WET] Wet change         [Emma]           │ │ ← Activity Item (56px)
│  ├─────────────────────────────────────────────────────┤ │
│  │ 11:15 AM   [SOILED] Soiled change      [Emma]           │ │ ← Activity Item (56px)
│  ├─────────────────────────────────────────────────────┤ │
│  │ 9:45 AM    [WET][SOILED] Both change      [Emma]           │ │ ← Activity Item (56px)
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← 24px spacing
│  Quick Action                                           │ ← Section Header (24px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [TARGET] Order Size 2 diapers soon                       │ │ ← Recommendation (80px)
│  │    Best price: $39.99 at Amazon.ca                 │ │
│  │    [Shop Now]                   [Remind Me Later]  │ │ ← Actions (48px height)
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                                         │ ← Flexible space
│                                              [FAB] [EDIT]   │ ← FAB (56px, 24px margins)
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]        [[SETTINGS]]                         │ ← Tab Bar (80px)
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Component Specifications**:

**Header (60px height)**:
- **Background**: White with subtle shadow (2dp)
- **Title**: "NestSync", 20px semibold, Primary blue
- **Actions**: 24px icons, 44x44px touch targets
- **Padding**: 16px horizontal, 12px vertical

**Child Selector (44px height when single child)**:
- **Typography**: 18px medium, Neutral-700
- **Icon**: 24px baby emoji or icon
- **Dropdown**: Chevron down, only visible for premium multi-child
- **Touch Target**: Full width, 44px minimum height
- **Psychology**: Personal connection through child name and age

**Status Card (120px height)**:
- **Background**: Primary blue gradient (subtle)
- **Border Radius**: 12px
- **Padding**: 20px
- **Typography**: 
  - "Days of Cover": 16px medium, white
  - "3 days": 32px bold, white
  - "Reorder Soon": 14px medium, Accent orange
- **Psychology**: Most important information gets maximum visual weight

**Recent Activity List**:
- **Item Height**: 56px each
- **Background**: White cards with 1px Neutral-200 border
- **Border Radius**: 8px
- **Spacing**: 8px between items
- **Content Structure**:
  - Time: 14px medium, Neutral-500
  - Type: Icon + text, 16px regular
  - Child: 14px medium, Neutral-400 (for multi-child)

**Quick Action Card**:
- **Height**: 80px
- **Background**: Accent orange light (5% opacity)
- **Border**: 1px Accent orange
- **Border Radius**: 8px
- **Button Heights**: 48px (primary action sizing)
- **Psychology**: Urgent but not alarming color treatment

### State: Critical Alert Home Screen

**Trigger**: 0-1 days of cover remaining
**Purpose**: Immediate attention without panic

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NestSync         [[USER]] [[BELL]] [[SETTINGS]]                      │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [BABY] Emma (8 weeks)                            [▼]       │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │
│  │        [ALERT] Critical: Order Today                     │ │ ← Red background
│  │                                                     │ │
│  │           < 1 day left                              │ │ ← Large warning text
│  │                                                     │ │
│  │     [🛒 Order Now]    [[PHONE] Set Reminder]           │ │ ← Action buttons
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ⚡ Emergency Retailers                                 │ ← Priority section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [STORE] Local Stores                                    │ │
│  │ Walmart: 2.3km - In stock - $42.99                │ │ ← Nearest options
│  │ Loblaws: 1.8km - In stock - $44.99               │ │
│  │                                                     │ │
│  │ [BOX] Same-Day Delivery                              │ │
│  │ Amazon.ca: $39.99 + $9.99 delivery               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [EDIT]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]●       [[CALENDAR]]        [[SETTINGS]]                         │ ← Red dot badge
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Psychological Design Notes**:
- **Controlled Urgency**: Red used sparingly, balanced with solution-focused content
- **Solution-Oriented**: Immediate actions provided, not just problem statement
- **Local Context**: Canadian retailers with distance and pricing
- **Reduced Anxiety**: "Order Today" vs "Emergency" - urgent but manageable

### State: Multi-Child Home Screen (Premium)

**Trigger**: Premium subscription with multiple children
**Purpose**: Efficient management of multiple children's needs

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  NestSync [PREMIUM]      [[USER]] [[BELL]] [[SETTINGS]]                      │ ← Premium indicator
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [[BABY] Emma] [[BABY] Alex] [[BABY] Sam]              [+ Add]     │ ← Child tabs
│                                                         │
│  [CHART] Family Overview                                     │ ← Consolidated view
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Emma (8w):    3 days  [WARNING]                          │ │ ← Child status rows
│  │ Alex (18m):   8 days  ✅                          │ │
│  │ Sam (3y):    12 days  ✅                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [TARGET] Smart Recommendations                              │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Bulk opportunity: Order Size 2 & 4 together        │ │ ← Combined ordering
│  │ Save $12.99 with bulk purchase                     │ │
│  │                                                     │ │
│  │ [Shop Combined Order]         [Individual Orders]  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  Recent Activity (All Children)                        │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 2:30 PM    [WET] Emma - Wet change                    │ │
│  │ 1:45 PM    [SOILED] Alex - Soiled change                 │ │
│  │ 12:15 PM   [WET][SOILED] Sam - Both change                  │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [EDIT]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]        [[SETTINGS]]                         │
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Premium Features**:
- **Child Tabs**: Horizontal scrollable selection
- **Consolidated Status**: All children at a glance
- **Bulk Recommendations**: Cost optimization across children
- **Unified Activity**: Combined recent changes
- **Smart Suggestions**: AI-driven bulk purchase opportunities

---

## Planner Screen States

### State: Default Planner Screen

**Purpose**: Future-focused planning with predictive analytics and purchase optimization
**User Type**: Primarily Mike (efficiency dad) but approachable for all users

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Planner          [[CALENDAR]] [[CHART]] [[SEARCH]]                       │ ← Header with view toggles
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [BABY] Emma's Timeline                                     │ ← Child context
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Today - Jan 12                                      │ │ ← Daily usage view
│  │ ●●●●●●○○ 6 changes so far                         │ │ ← Visual progress
│  │ Average: 8.2/day  Target: 8-10                     │ │ ← Data context
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [TARGET] Upcoming Actions                                   │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ⏰ Action Needed                                    │ │
│  │                                                     │ │
│  │ Order diapers in 2 days                           │ │
│  │ Current stock will run out Jan 15                 │ │
│  │                                                     │ │
│  │ [View Options]              [Set Reminder]        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [CHART] Predictions & Insights                             │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 📏 Size Change Likely                              │ │ ← Predictive insights
│  │ Jan 20-25: Consider Size 3                        │ │
│  │ Based on growth pattern                            │ │
│  │                                                     │ │
│  │ [MONEY] Bulk Purchase Opportunity                       │ │
│  │ Feb 1: Order 280ct for 15% savings               │ │
│  │ Estimated need: 6 weeks supply                    │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [BOX] Current Inventory                                  │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Size 2 Diapers                                     │ │
│  │                                                     │ │
│  │ Pampers: ████████░░░░ 24 count (3 days)          │ │ ← Visual inventory
│  │ Huggies: ░░░░░░░░░░░░ 0 count                     │ │
│  │                                                     │ │
│  │ [Edit Inventory]                                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [BOX]   │ ← Add inventory/order
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]●       [[SETTINGS]]                         │ ← Orange attention badge
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Component Specifications**:

**Header View Toggles**:
- **Calendar**: [CALENDAR] Timeline view (default)
- **Chart**: [CHART] Analytics view 
- **Search**: [SEARCH] Search/filter view
- **Size**: 24px icons, 44x44px touch targets
- **Active State**: Primary blue background, white icon

**Daily Usage Visualization**:
- **Progress Dots**: 8px diameter, Primary blue (completed), Neutral-300 (remaining)
- **Spacing**: 4px between dots
- **Animation**: Fill animation as day progresses
- **Psychology**: Visual progress reduces uncertainty

**Action Cards**:
- **Priority Coloring**: Orange border for attention needed
- **Typography Hierarchy**: 
  - Title: 18px semibold
  - Description: 16px regular
  - Details: 14px medium, Neutral-600
- **Button Styling**: Standard 48px height, consistent with system

**Inventory Visualization**:
- **Progress Bars**: Visual representation of remaining quantity
- **Color Coding**: 
  - Green: >7 days supply
  - Orange: 3-7 days supply  
  - Red: <3 days supply
- **Typography**: Brand + quantity clearly readable

### State: Analytics View (Premium)

**Trigger**: Chart icon tapped in header
**Purpose**: Detailed usage analytics for data-driven parents

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Analytics [PREMIUM]     [[CALENDAR]] [[CHART]] [[SEARCH]]                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [CHART] Usage Trends (Last 30 Days)                       │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │     10 ┌─●─────●─────●─●───●                       │ │ ← Simple line chart
│  │      8 ●─────●─────●───────●─●                     │ │
│  │      6         ●─●───────●───────●                 │ │
│  │      4                                             │ │
│  │      2                                             │ │
│  │      0 ┌─────┬─────┬─────┬─────┬─────┐             │ │
│  │        Week1 Week2 Week3 Week4 Week5               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [CHART] Key Insights                                       │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ • Daily average: 8.2 changes (↑0.3 from last week)│ │
│  │ • Peak times: 7-9am, 2-4pm, 8-10pm                │ │
│  │ • Size 2 efficiency: 92% (excellent fit)          │ │
│  │ • Leak incidents: 2% (within normal range)        │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [MONEY] Cost Analysis                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Monthly spending: $47.32                           │ │
│  │ Cost per change: $0.19                            │ │
│  │ Projected annual: $568                            │ │
│  │                                                     │ │
│  │ 💡 Optimization opportunity:                       │ │
│  │ Bulk purchasing could save $89/year               │ │
│  │                                                     │ │
│  │ [View Savings Plan]                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📋 Export Options                                     │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Share with pediatrician or partner                 │ │
│  │                                                     │ │
│  │ [📧 Email Report]      [📄 PDF Export]            │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [BOX]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]●       [[SETTINGS]]                         │
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Advanced Features**:
- **Simple Charts**: Line graphs with clear data points, not complex visualizations
- **Actionable Insights**: Data presented with recommendations
- **Cost Analysis**: Canadian dollar amounts, annual projections
- **Export Functionality**: Share with healthcare providers or family
- **Optimization Suggestions**: AI-driven savings opportunities

---

## Settings Screen States

### State: Default Settings Screen

**Purpose**: Account management, privacy controls, and Canadian compliance features
**Focus**: Trust building through transparency and user control

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Settings                                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [USER] Account                                            │ ← Section headers (20px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [USER] Sarah Thompson                                  │ │ ← User profile (60px)
│  │    sarah@email.com                                 │ │
│  │    Member since Dec 2023                          │ │
│  │                                    [Edit Profile] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [BABY] Children                                           │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [BABY] Emma Thompson                                   │ │ ← Child management
│  │    Born Dec 2023 • Size 2 • 8 weeks              │ │
│  │    [Edit]    [Share Access]    [Archive]         │ │ (60px height)
│  ├─────────────────────────────────────────────────────┤ │
│  │ ➕ Add Another Child                               │ │ ← Premium upsell
│  │    [PREMIUM] Premium feature - Manage multiple children   │ │
│  │    [Learn More]                                   │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🇨🇦 Privacy & Data                                   │ ← Canadian focus
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🔒 Your data is stored in Canada                  │ │ ← Trust indicator
│  │    Compliant with PIPEDA privacy laws             │ │ (80px height)
│  │                                                     │ │
│  │ [CHART] Data Usage Preferences                         │ │
│  │ Analytics for app improvement    [●○]             │ │ ← Toggle switches
│  │ Marketing communications         [○●]             │ │
│  │                                                     │ │
│  │ 📤 Your Rights                                    │ │
│  │ [Export My Data]     [Delete Account]            │ │ ← PIPEDA rights
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [BELL] Notifications                                      │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [BELL] Reorder alerts               [●○]              │ │ ← Notification prefs
│  │ ⏰ Alert timing: 2 days before  [▼]              │ │ (48px per row)
│  │ [PHONE] Push notifications           [●○]              │ │
│  │ 📧 Email reminders             [○●]              │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] 👥   │ ← Add/share context
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]        [[SETTINGS]]                         │
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Canadian Context Design Elements**:

**Privacy Section**:
- **Flag Emoji**: 🇨🇦 Canadian flag for national context
- **PIPEDA Messaging**: Legal compliance clearly communicated
- **Data Location**: "Your data is stored in Canada" trust building
- **User Rights**: Export and deletion clearly accessible

**Toggle Components**:
- **Size**: 44x24px (NativeBase Switch component)
- **Colors**: Primary blue when enabled, Neutral-300 when disabled
- **Labels**: Clear, non-technical language
- **Touch Targets**: Full row clickable (not just switch)

### State: Premium Upgrade Settings

**Trigger**: Non-premium user accessing premium features
**Purpose**: Value-driven upgrade prompts without aggressive sales tactics

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            [[BATTERY]] [[SIGNAL]] [[PHONE]] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Settings                                               │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  [PREMIUM] Upgrade to Premium                                 │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                   ✨ NestSync Pro                   │ │ ← Premium branding
│  │                                                     │ │ (120px height)
│  │    Unlock advanced features for busy families      │ │
│  │                                                     │ │
│  │    ✓ Multiple children tracking                    │ │
│  │    ✓ Caregiver sharing & collaboration            │ │
│  │    ✓ Advanced analytics & insights                │ │
│  │    ✓ Bulk purchase optimization                   │ │
│  │    ✓ Priority customer support                    │ │
│  │                                                     │ │
│  │    $8.99 CAD/month • Cancel anytime               │ │
│  │                                                     │ │
│  │    [Start Free Trial]        [Learn More]         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [USER] Account (Free Plan)                               │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [USER] Sarah Thompson                                  │ │
│  │    sarah@email.com                                 │ │
│  │    Free plan • 1 child limit                      │ │
│  │                                    [Edit Profile] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [BABY] Children (1/1 used)                               │ ← Usage indicator
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [BABY] Emma Thompson                                   │ │
│  │    Born Dec 2023 • Size 2 • 8 weeks              │ │
│  │    [Edit]    [Share Access [PREMIUM]]   [Archive]       │ │ ← Premium badge
│  ├─────────────────────────────────────────────────────┤ │
│  │ ➕ Add Another Child                               │ │ ← Locked feature
│  │    [PREMIUM] Premium feature                              │ │
│  │    [Upgrade to Add]                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [Rest of settings continue normally...]               │
│                                                         │
│                                              [FAB] 👥   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[CALENDAR]]        [[SETTINGS]]                         │
│   Home      Planner    Settings                         │
└─────────────────────────────────────────────────────────┘
```

**Premium Conversion Psychology**:
- **Value-First Presentation**: Benefits clearly listed before price
- **Canadian Pricing**: CAD currency, transparent monthly cost
- **Free Trial**: Low-commitment entry point
- **Feature Previews**: Shows locked features contextually
- **No Pressure**: "Learn More" option for hesitant users

---

## Quick Logging Modal States

### State: Default Quick Log Modal

**Trigger**: FAB tapped from any screen
**Purpose**: Sub-10 second diaper change logging
**Critical Success Factor**: Eliminate typing for 90% of use cases

```ascii
┌─────────────────────────────────────────────────────────┐
│                                                         │
│               Log Change for Emma                       │ ← Modal title (44px)
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  When did this happen?                                  │ ← Question (20px)
│                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐                  │ ← Time chips (44px)
│  │ Now │ │ 1h  │ │ 2h  │ │ Custom  │                  │ (60px wide min)
│  └─────┘ └─────┘ └─────┘ └─────────┘                  │
│    ●       ○       ○         ○                         │ ← Selection indicators
│                                                         │
│  What type of change?                                   │ ← Question (20px)
│                                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                  │ ← Type chips (80px)
│  │   [WET]    │ │   [SOILED]    │ │  [WET][SOILED]   │                  │ (100px wide)
│  │   Wet   │ │ Soiled  │ │  Both   │                  │
│  └─────────┘ └─────────┘ └─────────┘                  │
│      ○           ●           ○                         │ ← Selection indicators
│                                                         │
│  Notes (optional)                                       │ ← Optional field
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Tap to add notes about this change...              │ │ ← Placeholder text
│  └─────────────────────────────────────────────────────┘ │ (48px height)
│                                                         │
│                                                         │ ← 24px spacing
│     [Cancel]                          [Save] ✓         │ ← Action buttons
│                                                         │ (48px height)
└─────────────────────────────────────────────────────────┘
```

**Interaction Specifications**:

**Time Chips**:
- **Selected State**: Primary blue background, white text
- **Unselected State**: Neutral-100 background, Neutral-600 text
- **Touch Feedback**: Scale 1.05 → 1.0, haptic light
- **Custom Option**: Opens time picker (native iOS/Android)

**Type Selection**:
- **Visual Design**: Large emoji + text for quick recognition
- **Selection State**: Primary blue border + background tint
- **Touch Target**: Full chip area (100x80px)
- **Psychology**: Visual icons reduce cognitive load

**Modal Animation**:
- **Entrance**: Scale 0.9 → 1.0 + fade in (250ms)
- **Background**: Overlay fade to 50% opacity
- **Exit**: Scale 0.95 + fade out (200ms)
- **Keyboard**: Auto-adjusts for notes field

**Success Flow**:
1. **Save Button**: Shows loading spinner
2. **Success Feedback**: Haptic medium + visual confirmation
3. **Modal Dismissal**: Automatic after 1 second
4. **Parent Screen Update**: Days of cover updates immediately

### State: Custom Time Selection

**Trigger**: "Custom" time chip selected
**Purpose**: Handle edge cases while maintaining speed

```ascii
┌─────────────────────────────────────────────────────────┐
│                                                         │
│               Log Change for Emma                       │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  When did this happen?                                  │
│                                                         │
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────────┐                  │
│  │ Now │ │ 1h  │ │ 2h  │ │ Custom  │                  │ ← Custom selected
│  └─────┘ └─────┘ └─────┘ └─────────┘                  │
│    ○       ○       ○         ●                         │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │               Custom Time                           │ │ ← Time picker
│  │                                                     │ │ (Native picker)
│  │         ┌───┐  :  ┌───┐     ┌─────┐                │ │
│  │         │ 2 │     │ 30 │     │ PM  │                │ │ ← iOS-style
│  │         └───┘     └───┘     └─────┘                │ │
│  │                                                     │ │
│  │                                                     │ │
│  │       Today, January 12, 2024                      │ │ ← Date context
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  What type of change?                                   │
│  [Type selection continues normally...]                 │
│                                                         │
│     [Cancel]                          [Save] ✓         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Custom Time Features**:
- **Native Pickers**: iOS date/time wheel, Android material picker
- **Smart Defaults**: Current time minus reasonable intervals
- **Date Validation**: Prevents future dates, excessive past dates
- **Quick Return**: Tap outside picker to return to chip selection

---

## Responsive Design Adaptations

### Mobile Landscape Adaptations

**Home Screen Landscape**:
```ascii
┌─────────────────────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                                    [[BATTERY]] [[SIGNAL]] [[PHONE]]         │
├─────────────────────────────────────────────────────────────────────────┤
│  NestSync  [[USER]][[BELL]][[SETTINGS]]      [BABY] Emma (8w)  [▼]                        │ ← Compressed header
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ ┌─────────────────────┐  ┌──────────────────────┐  ┌──────────────────┐ │
│ │    [BOX] Days Cover    │  │   Recent Activity    │  │   Quick Action   │ │ ← Three columns
│ │        3 days       │  │ 2:30 PM  [WET] Wet     │  │  [TARGET] Order Soon   │ │
│ │    [WARNING] Reorder Soon │  │ 11:15 AM [SOILED] Soiled  │  │  $39.99 Amazon   │ │
│ └─────────────────────┘  │ 9:45 AM  [WET][SOILED] Both  │  │  [Shop Now]     │ │
│                          └──────────────────────┘  └──────────────────┘ │
│                                                             [FAB] [EDIT]    │ ← Repositioned FAB
├─────────────────────────────────────────────────────────────────────────┤
│        [[HOME]]               [[CALENDAR]]               [[SETTINGS]]                      │ ← Bottom tabs
│        Home             Planner           Settings                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tablet Adaptations (768px+)

**Home Screen Tablet**:
```ascii
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                                                    [[BATTERY]] [[SIGNAL]] [[PHONE]]     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  NestSync              [[USER]] [[BELL]] [[SETTINGS]]          [BABY] Emma (8 weeks)         [▼]     │
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │          Status Overview         │    │           Recent Activity              │ │
│  │                                 │    │                                         │ │
│  │       [BOX] Days of Cover          │    │  ┌─────────────────────────────────────┐ │ │
│  │                                 │    │  │ 2:30 PM    [WET] Wet      [Emma]     │ │ │
│  │           3 days                │    │  │ 11:15 AM   [SOILED] Soiled   [Emma]     │ │ │
│  │                                 │    │  │ 9:45 AM    [WET][SOILED] Both    [Emma]     │ │ │
│  │       [WARNING] Reorder Soon          │    │  └─────────────────────────────────────┘ │ │
│  │                                 │    │                                         │ │
│  └─────────────────────────────────┘    │  Quick Recommendations                 │ │
│                                          │                                         │ │
│  ┌─────────────────────────────────────────────────────────────────────────────┐ │ │
│  │                      Purchase Recommendations                               │ │ │
│  │                                                                             │ │ │
│  │  [TARGET] Order Size 2 diapers soon                                             │ │ │
│  │     Best price: $39.99 at Amazon.ca                                       │ │ │
│  │     Alternative: $41.99 at Walmart.ca (Same-day pickup available)         │ │ │
│  │                                                                             │ │ │
│  │     [Shop Amazon]    [Shop Walmart]    [Compare More]    [Remind Later]   │ │ │
│  └─────────────────────────────────────────────────────────────────────────────┘ │ │
│  │                                         │                                         │ │
│  └─────────────────────────────────────────┘                                         │ │
│                                                                  [FAB] [EDIT]           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│              [[HOME]]                    [[CALENDAR]]                    [[SETTINGS]]                   │
│              Home                  Planner                Settings                   │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

**Tablet Enhancement Features**:
- **Two-Column Layout**: More efficient use of horizontal space
- **Expanded Recommendations**: Multiple retailer options visible simultaneously
- **Enhanced Touch Targets**: Larger buttons for tablet interaction patterns
- **Master-Detail Views**: Consider split-screen for Planner screen

---

## Accessibility Implementation

### Screen Reader Optimizations

**Home Screen Accessibility Labels**:
```typescript
// Status card accessibility
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Current diaper supply status"
  accessibilityValue={{ text: "3 days of cover remaining, reorder soon" }}
  accessibilityHint="Tap to view detailed supply information"
>
  {statusCard}
</Pressable>

// FAB accessibility
<Pressable
  accessibilityRole="button"
  accessibilityLabel="Log diaper change"
  accessibilityHint="Opens quick logging form"
  onPress={handleFABPress}
>
  {fabIcon}
</Pressable>

// Recent activity accessibility
<FlatList
  data={recentLogs}
  accessibilityLabel="Recent diaper changes"
  renderItem={({item}) => (
    <View 
      accessibilityRole="text"
      accessibilityLabel={`${formatTime(item.time)}, ${item.type} change for ${item.child}`}
    >
      {logItem}
    </View>
  )}
/>
```

### Keyboard Navigation

**Focus Management**:
- Tab navigation moves through interactive elements in logical order
- FAB receives focus after main content
- Modal dialogs trap focus within modal content
- Back navigation returns focus to trigger element

**Focus Indicators**:
- 4px Primary blue outline for focused elements
- Increased contrast for better visibility
- Consistent focus styling across all screens
- Skip links for lengthy content areas

This comprehensive screen state documentation provides exact specifications for implementing each screen with psychological methodology, ensuring optimal user experience for stressed Canadian parents while maintaining technical excellence through NativeBase integration and accessibility compliance.