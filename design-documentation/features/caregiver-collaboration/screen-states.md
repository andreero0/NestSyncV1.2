# Caregiver Collaboration Screen States

Comprehensive wireframe specifications and visual design documentation for all caregiver collaboration screens, including multi-user interfaces, permission management, professional dashboards, and real-time coordination views.

---
title: Caregiver Collaboration Screen States
description: Detailed wireframe specifications for family sharing and professional caregiver coordination interfaces
feature: Caregiver Collaboration
last-updated: 2025-09-04
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - NativeBase UI components
  - Real-time subscription patterns
  - Role-based permission system
  - Canadian privacy compliance
status: approved
---

## Screen State Overview

The caregiver collaboration system consists of **8 primary screen categories** with **32 distinct states** designed to accommodate different user roles, permission levels, and collaboration scenarios while maintaining Canadian privacy compliance.

**Screen Categories**:
1. **Collaboration Dashboard** - Real-time coordination hub
2. **Caregiver Management** - Family member and professional caregiver administration
3. **Permission Control** - Granular access and sharing management
4. **Professional Dashboard** - Specialized interface for professional caregivers
5. **Activity Feed** - Real-time activity sharing and communication
6. **Conflict Resolution** - Smart conflict detection and resolution interface
7. **Handoff Management** - Caregiver transition and shift management
8. **Emergency Access** - Emergency contact and critical information access

## 1. Collaboration Dashboard Screen

### 1.1 Default State - Multi-Caregiver Active

**Purpose**: Central coordination hub showing current caregiver presence and recent activities
**User Context**: Parent or caregiver checking current care status
**Data Requirements**: Real-time caregiver presence, recent activity feed, active conflicts

**Layout Structure**:
```
┌─────────────────────────────┐
│ 🏠 Dashboard    👤 Sarah ↓  │  Header: App navigation + user profile
├─────────────────────────────┤
│ 👥 Active Caregivers (3)    │  Section: Current caregiver presence
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │Mike │ │Lisa │ │Gran │    │  Caregiver Cards: Profile pics + status
│ │🟢On │ │🟡Pro│ │🔵Fam│    │  Status indicators: Online(green), Professional(yellow), Family(blue)
│ └─────┘ └─────┘ └─────┘    │
├─────────────────────────────┤
│ 📱 Quick Actions            │  Section: Immediate action buttons
│ [Log Activity] [View All]   │  Primary CTAs: Main user actions
├─────────────────────────────┤
│ 📋 Recent Activity          │  Section: Activity feed preview
│ ┌─ 2:30 PM - Mike ─────────┐│
│ │ 🍼 Fed Emma 120ml        ││  Activity Item: Icon, time, caregiver, description
│ │ Location: Living room     ││  Context: Location or additional details
│ └───────────────────────────┘│
│ ┌─ 1:45 PM - Lisa ─────────┐│
│ │ 👶 Changed diaper - wet   ││  Activity Item: Type, outcome, attribution
│ │ Note: Very active today   ││  Additional: Notes or observations
│ └───────────────────────────┘│
│ ┌─ 1:20 PM - Mike ─────────┐│
│ │ 😴 Emma fell asleep      ││  Activity Item: Sleep/wake tracking
│ │ Duration: 25 minutes     ││  Derived data: Calculated information
│ └───────────────────────────┘│
├─────────────────────────────┤
│ ⚠️  Coordination Alerts (1)  │  Section: Conflict/coordination issues
│ ┌─────────────────────────┐ │
│ │ 🔄 Possible duplicate    │ │  Alert Item: Conflict type icon + description
│ │ Mike & Lisa both logged  │ │  Details: Specific conflict information
│ │ diaper change at 1:45PM  │ │  
│ │ [Review] [Auto-resolve]  │ │  Actions: User resolution options
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🔐 Privacy Status: 🇨🇦      │  Footer: Canadian data compliance indicator
└─────────────────────────────┘
```

**Visual Design Specifications**:

**Active Caregiver Cards**:
- **Dimensions**: 80×100px per card, 8px spacing between cards
- **Background**: White with 2px colored border based on role type
- **Profile Image**: 48×48px circular avatar with online status indicator
- **Status Indicator**: 12×12px circle, positioned bottom-right of avatar
  - Green (#10B981): Currently active/online
  - Yellow (#F59E0B): Professional caregiver on duty
  - Blue (#0891B2): Family member available
  - Gray (#6B7280): Offline/unavailable
- **Name Label**: 12px Medium, centered below avatar
- **Role Badge**: 8px height, rounded, positioned top-right

**Activity Feed Items**:
- **Container**: Full width, 16px horizontal padding, 12px vertical padding
- **Background**: White with 1px bottom border (#F3F4F6)
- **Icon Area**: 32×32px circular background with activity type icon
- **Content Area**: Flex-grow layout with timestamp, caregiver name, description
- **Timestamp**: 12px Regular, #6B7280 (muted text)
- **Caregiver Name**: 14px Medium, colored by role type
- **Description**: 16px Regular, #1F2937 (primary text)
- **Additional Context**: 14px Regular, #6B7280 (secondary text)

**Conflict Alert Design**:
- **Container**: 16px margin, 12px padding, rounded 8px background
- **Background**: #FEF3C7 (warning yellow background)
- **Border**: 1px #F59E0B (warning border)
- **Icon**: 20×20px warning/conflict icon in #D97706
- **Text Content**: 14px Medium for title, 14px Regular for description
- **Action Buttons**: 
  - Primary: #0891B2 background, white text, 32px height
  - Secondary: White background, #0891B2 border and text

**Interaction Specifications**:

**Caregiver Card Interactions**:
- **Tap Action**: Navigate to individual caregiver detail view
- **Long Press**: Context menu with quick actions (message, view permissions, remove access)
- **Swipe Left**: Quick access to messaging or temporary access controls
- **Hover State** (tablet): Subtle shadow elevation and border color intensification

**Activity Feed Interactions**:
- **Tap Activity**: Expand to show full details, edit options, and reactions
- **Swipe Right**: Quick reaction (👍, ❤️, 👀) for acknowledgment
- **Swipe Left**: More actions (edit, delete, ask question)
- **Pull to Refresh**: Refresh activity feed with real-time updates

### 1.2 Loading State - Fetching Real-Time Data

**Purpose**: Loading state while establishing real-time connections and fetching collaboration data
**User Context**: Initial screen load or network reconnection
**Data Requirements**: WebSocket connection establishment, permission verification

**Layout Structure**:
```
┌─────────────────────────────┐
│ 🏠 Dashboard    👤 Sarah ↓  │  Header: Static header while loading
├─────────────────────────────┤
│ 👥 Active Caregivers        │  Section header: Loading state
│ ┌─────┐ ┌─────┐ ┌─────┐    │
│ │ ⚪⚪ │ │ ⚪⚪ │ │ ⚪⚪ │    │  Skeleton Cards: Animated placeholder content
│ │ ⚪⚪ │ │ ⚪⚪ │ │ ⚪⚪ │    │  Shimmer Animation: Subtle loading animation
│ └─────┘ └─────┘ └─────┘    │
├─────────────────────────────┤
│ 📋 Loading activity feed... │  Loading message: Clear status communication
│ ┌───────────────────────────┐│
│ │ ⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ ││  Skeleton Items: Activity feed placeholders
│ │ ⚪⚪⚪⚪⚪⚪⚪⚪         ││  
│ └───────────────────────────┘│
│ ┌───────────────────────────┐│
│ │ ⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪⚪ ││  Multiple skeleton rows
│ │ ⚪⚪⚪⚪⚪⚪             ││
│ └───────────────────────────┘│
├─────────────────────────────┤
│ 🔐 Establishing secure       │  Footer: Connection status
│    Canadian connection... 🇨🇦 │
└─────────────────────────────┘
```

**Animation Specifications**:
- **Skeleton Animation**: Subtle shimmer effect using linear gradient sweep
- **Duration**: 1.5 seconds loop with 0.5 second pause
- **Color Progression**: #F3F4F6 → #E5E7EB → #F3F4F6
- **Loading Spinner**: Custom NestSync spinner with 60fps rotation
- **Stagger Effect**: Skeleton items load with 100ms stagger for natural feel

### 1.3 Error State - Connection Failed

**Purpose**: Error handling when real-time collaboration features are unavailable
**User Context**: Network issues, server problems, or permission errors
**Data Requirements**: Error details, retry mechanisms, offline capabilities

**Layout Structure**:
```
┌─────────────────────────────┐
│ 🏠 Dashboard    👤 Sarah ↓  │  Header: Functional navigation maintained
├─────────────────────────────┤
│ ⚠️  Connection Issue         │  Error Section: Clear problem identification
│ ┌─────────────────────────┐ │
│ │ 🔌 Can't connect to      │ │  Error Card: Specific error message
│ │    collaboration service │ │
│ │                         │ │
│ │ Real-time updates are   │ │  Explanation: What's affected
│ │ temporarily unavailable │ │
│ │                         │ │
│ │ [Try Again] [Use Offline]│ │  Actions: Recovery options
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📱 Available Actions        │  Offline Section: What still works
│ [Log Activity] [View History]│  Limited CTAs: Offline-capable actions
├─────────────────────────────┤
│ 💾 Offline Activity (2)     │  Offline Queue: Pending sync activities
│ ┌─ Pending - You ─────────┐ │
│ │ 🍼 Fed Emma 100ml        │ │  Queued Item: Will sync when connection restored
│ │ Will sync when online    │ │  Status: Clear sync status
│ └───────────────────────────┘│
├─────────────────────────────┤
│ 🔐 Privacy Status: 🇨🇦      │  Footer: Privacy compliance maintained
│    Offline mode active     │
└─────────────────────────────┘
```

**Error Handling Specifications**:
- **Error Types**: Network failure, permission denied, server unavailable, rate limiting
- **Recovery Actions**: Automatic retry with exponential backoff, manual retry, offline mode
- **Graceful Degradation**: Core logging functionality maintained, collaboration features disabled
- **User Communication**: Clear, non-technical language explaining impact and solutions

## 2. Caregiver Management Screen

### 2.1 Default State - Family Overview

**Purpose**: Central management of all family members and professional caregivers with permissions overview
**User Context**: Parent managing family sharing and caregiver access
**Data Requirements**: All family members, professional caregivers, permission summaries

**Layout Structure**:
```
┌─────────────────────────────┐
│ ← Caregivers   [+ Add New]  │  Header: Back navigation + primary CTA
├─────────────────────────────┤
│ 👨‍👩‍👧‍👦 Family Members (4)      │  Section: Core family
│ ┌─────────────────────────┐ │
│ │ 👤 Mike Thompson        │ │  Family Card: Name + relationship
│ │ 🏠 Parent • Full Access │ │  Role: Relationship + permission level
│ │ 📱 Active • 2 hours ago │ │  Status: Activity status + last seen
│ │ [Manage] 🔒︎ 🔔 ⚙️       │ │  Actions: Manage, lock, notifications, settings
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👵 Janet Thompson       │ │  Extended Family: Different visual treatment
│ │ 🏠 Grandmother • View   │ │  Limited Access: Clear permission indication
│ │ 📱 Online now           │ │  Real-time Status: Live presence
│ │ [Manage] 🔒︎ 🔔 ⚙️       │ │  Consistent Actions: Same action pattern
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 👔 Professional Caregivers  │  Section: Professional staff
│ ┌─────────────────────────┐ │
│ │ 👩‍⚕️ Lisa Rodriguez       │ │  Professional Card: Name + verification
│ │ 🎓 Nanny • ✅ Verified   │ │  Credentials: Role + verification status
│ │ 📅 Monday-Friday 9-5    │ │  Schedule: Availability or schedule
│ │ ⭐ 4.9 (23 reviews)     │ │  Ratings: Professional rating system
│ │ [Manage] 💼 🔔 ⚙️       │ │  Pro Actions: Professional-specific actions
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🏫 Institutional Care       │  Section: Daycare/institutions
│ ┌─────────────────────────┐ │
│ │ 🏫 Sunshine Daycare     │ │  Institution Card: Name + license
│ │ 📋 Licensed • ID #12345 │ │  Credentials: License verification
│ │ 👥 3 staff members      │ │  Staff: Number of associated staff
│ │ 📞 (555) 123-4567      │ │  Contact: Primary contact information
│ │ [Manage] 🏢 🔔 ⚙️       │ │  Institutional Actions: Institution-specific
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⏱️ Temporary Access (1)     │  Section: Time-limited access
│ ┌─────────────────────────┐ │
│ │ 👤 Sarah's Mom          │ │  Temporary Card: Name + temp indicator
│ │ 🕐 Expires in 2 days    │ │  Expiry: Clear time remaining
│ │ 👀 View Only • Photos   │ │  Limited Scope: Specific permissions
│ │ [Extend] [Revoke]       │ │  Temp Actions: Extend or revoke access
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Visual Design Specifications**:

**Caregiver Category Headers**:
- **Typography**: 18px Semibold, 24px line height
- **Color**: #1F2937 (primary text)
- **Spacing**: 24px top margin, 12px bottom margin
- **Icon**: 20×20px category icon, 8px right margin

**Caregiver Cards**:
- **Container**: Full width, 16px horizontal padding, 16px vertical padding
- **Background**: White with 1px border (#E5E7EB), 8px border radius
- **Shadow**: Subtle elevation (0px 1px 2px rgba(0, 0, 0, 0.05))
- **Spacing**: 12px bottom margin between cards

**Card Content Layout**:
- **Profile Section**: Avatar (48×48px) + name/role info
- **Status Section**: Activity indicators and last seen information
- **Action Section**: Icon buttons for quick actions
- **Trust Indicators**: Verification badges and security indicators

**Role-Based Visual Coding**:
- **Parents**: Blue accent (#0891B2) border-left (4px)
- **Family Members**: Purple accent (#8B5CF6) border-left
- **Professional**: Teal accent (#14B8A6) border-left
- **Institutional**: Indigo accent (#6366F1) border-left
- **Temporary**: Orange accent (#F59E0B) border-left

**Action Button Specifications**:
- **Size**: 32×32px touch target
- **Spacing**: 8px between buttons
- **Primary Actions**: Filled buttons with role-appropriate colors
- **Secondary Actions**: Outline buttons with neutral styling
- **Disabled State**: 50% opacity with non-interactive cursor

### 2.2 Add New Caregiver State

**Purpose**: Guided flow for adding family members or professional caregivers with appropriate permissions
**User Context**: Parent inviting new caregiver to join family sharing
**Data Requirements**: Contact methods, relationship options, permission templates

**Layout Structure**:
```
┌─────────────────────────────┐
│ ← Add Caregiver    [Skip]   │  Header: Back + skip option
├─────────────────────────────┤
│ 👥 Who are you adding?      │  Step 1: Relationship identification
│                             │
│ ○ Family Member             │  Option: Family relationship
│   👨‍👩‍👧‍👦 Partner, grandparent,  │  Description: Examples of family
│      or relative            │
│                             │
│ ○ Professional Caregiver    │  Option: Professional relationship
│   👔 Nanny, babysitter, or  │  Description: Professional examples
│      childcare provider     │
│                             │
│ ○ Institutional Care        │  Option: Institution
│   🏫 Daycare center or      │  Description: Institutional examples
│      childcare facility     │
├─────────────────────────────┤
│ 📧 Invitation Method        │  Step 2: Contact method
│                             │
│ ┌─────────────────────────┐ │
│ │ 📧 Email Address        │ │  Input: Email invitation
│ │ [example@email.com    ] │ │  Field: Email input with validation
│ └─────────────────────────┘ │
│                             │
│ ┌─────────────────────────┐ │
│ │ 📱 Phone Number         │ │  Input: SMS invitation
│ │ [+1 (555) 123-4567   ] │ │  Field: Phone with international support
│ └─────────────────────────┘ │
│                             │
│ ○ Share invitation link     │  Option: Link sharing
├─────────────────────────────┤
│ 🔐 Initial Permissions     │  Step 3: Permission setup
│                             │
│ ● View Only                 │  Template: Read-only access
│   Can see activities but    │  Description: What this includes
│   cannot add or edit        │
│                             │
│ ○ Basic Logging             │  Template: Standard logging
│   Can log activities and    │  Description: Core functionality
│   view family feed          │
│                             │
│ ○ Full Collaboration        │  Template: Complete access
│   Can log, edit, manage     │  Description: Full capabilities
│   other caregivers          │
│                             │
│ ○ Custom Permissions...     │  Option: Granular control
├─────────────────────────────┤
│ [Cancel]      [Send Invite] │  Actions: Cancel or proceed
└─────────────────────────────┘
```

**Interaction Flow Specifications**:

**Step 1 - Relationship Selection**:
- **Single Choice**: Radio button selection with visual feedback
- **Auto-advance**: Automatic progression to next step on selection
- **Visual Feedback**: Selected option highlights with role-appropriate color
- **Help Text**: Expandable descriptions for each relationship type

**Step 2 - Contact Method**:
- **Input Validation**: Real-time validation for email/phone formats
- **Multiple Methods**: Allow multiple contact methods for reliability
- **International Support**: Phone number formatting with country codes
- **Link Generation**: Secure invitation link with expiration

**Step 3 - Permission Templates**:
- **Template Selection**: Pre-defined permission sets for common scenarios
- **Visual Hierarchy**: Clear indication of permission levels (minimal → full)
- **Custom Option**: Advanced users can define granular permissions
- **Security Indicators**: Clear indication of data access levels

**Invitation Process**:
- **Immediate Send**: Invitation sent upon confirmation
- **Tracking**: Invitation status tracking (sent, opened, accepted, expired)
- **Reminder System**: Automated reminders for pending invitations
- **Revocation**: Ability to cancel pending invitations

## 3. Permission Control Screen

### 3.1 Default State - Granular Permission Management

**Purpose**: Detailed permission control for individual caregivers with Canadian privacy compliance
**User Context**: Parent fine-tuning data sharing permissions for specific caregiver
**Data Requirements**: Current permissions, available permission options, audit history

**Layout Structure**:
```
┌─────────────────────────────┐
│ ← Lisa Rodriguez            │  Header: Caregiver name
│    👩‍⚕️ Professional Nanny     │  Subheader: Role identification
├─────────────────────────────┤
│ 🔐 Permission Overview      │  Section: Current access summary
│ ┌─────────────────────────┐ │
│ │ ✅ Can log activities    │ │  Permission Item: Granted permission
│ │ ✅ Can view photos      │ │  Visual Indicator: Checkmark for granted
│ │ ✅ Can add notes        │ │  
│ │ ❌ Cannot edit others'  │ │  Restriction: X mark for denied
│ │    activities           │ │
│ │ ❌ Cannot invite new    │ │  
│ │    caregivers           │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📋 Activity Permissions     │  Category: Activity-related permissions
│ ┌─────────────────────────┐ │
│ │ View Activities    [🔘] │ │  Toggle: Binary permission control
│ │ Log New Activities [🔘] │ │  Active State: Blue filled toggle
│ │ Edit Own Activities[🔘] │ │  
│ │ Edit Others' Acts. [🔳] │ │  Inactive State: Gray outline toggle
│ │ Delete Activities  [🔳] │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📸 Media Permissions        │  Category: Photo and media sharing
│ ┌─────────────────────────┐ │
│ │ View Photos        [🔘] │ │  Toggle: Media viewing access
│ │ Add Photos         [🔘] │ │  
│ │ Download Photos    [🔳] │ │  Restricted: Download capability
│ │ Share Photos       [🔳] │ │  External Sharing: High-risk permission
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 👥 Collaboration Perms      │  Category: Multi-caregiver features
│ ┌─────────────────────────┐ │
│ │ Message Caregivers [🔘] │ │  Communication: Internal messaging
│ │ View Other Caregivers[🔘]│ │  Visibility: See other family members
│ │ Invite Caregivers  [🔳] │ │  Administrative: Invite others
│ │ Modify Permissions [🔳] │ │  Administrative: Change others' access
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📊 Data Access              │  Category: Analytics and reporting
│ ┌─────────────────────────┐ │
│ │ View Analytics     [🔳] │ │  Analytics: Usage patterns and insights
│ │ Export Data        [🔳] │ │  Export: Download personal data
│ │ Professional Report[🔘] │ │  Professional: Generate care reports
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⏱️ Access Duration          │  Section: Time-based access control
│ ┌─────────────────────────┐ │
│ │ ● Permanent Access      │ │  Option: Ongoing access
│ │ ○ Temporary Access      │ │  Option: Time-limited access
│ │                         │ │
│ │ [Set End Date...]       │ │  Control: Expiration date picker
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🇨🇦 Privacy Compliance      │  Section: Canadian privacy controls
│ ┌─────────────────────────┐ │
│ │ ✅ Data stays in Canada │ │  Compliance: Canadian data residency
│ │ ✅ PIPEDA compliant     │ │  Standard: Privacy legislation compliance
│ │ 📋 Consent recorded     │ │  Documentation: Consent audit trail
│ │ 🕐 Last updated: Today  │ │  Tracking: Recent permission changes
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Reset to Default] [Save]   │  Actions: Reset or save changes
└─────────────────────────────┘
```

**Permission Control Specifications**:

**Toggle Switch Design**:
- **Active State**: #0891B2 background, white circle, smooth animation
- **Inactive State**: #D1D5DB background, white circle
- **Disabled State**: #F3F4F6 background, #9CA3AF circle, 50% opacity
- **Animation**: 200ms ease-out transition for state changes
- **Touch Target**: 44×24px minimum for accessibility

**Permission Categories**:
- **Visual Grouping**: Each category has distinct background color (#F9FAFB)
- **Category Icons**: 20×20px icons with role-appropriate colors
- **Hierarchy**: More sensitive permissions lower in the layout
- **Dependencies**: Visual indication when permissions depend on others

**Canadian Privacy Compliance**:
- **Visual Prominence**: Canadian flag emoji and distinct styling
- **Compliance Indicators**: Green checkmarks for met requirements
- **Audit Information**: Timestamp and consent tracking
- **Legal Language**: Clear, plain-language explanations of privacy rights

### 3.2 Permission Request State

**Purpose**: Interface for caregivers to request additional permissions from parents
**User Context**: Professional caregiver needs access to additional features
**Data Requirements**: Available permissions, request justification options, approval workflow

**Layout Structure**:
```
┌─────────────────────────────┐
│ ← Permission Request        │  Header: Clear intent
├─────────────────────────────┤
│ 📝 Request Additional Access│  Section: Request explanation
│                             │
│ You currently have Basic    │  Current Status: What user currently has
│ Logging permissions.        │
│                             │
│ What additional access do   │  Question: Clear ask
│ you need?                   │
├─────────────────────────────┤
│ 📸 Media Permissions        │  Category: Grouped permission requests
│ ┌─────────────────────────┐ │
│ │ ☐ View Photos           │ │  Checkbox: Multi-select permissions
│ │ ☐ Add Photos            │ │  
│ │ ☐ Download Photos       │ │  Higher Risk: Visual indication
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📊 Analytics Access         │  Category: Data access permissions
│ ┌─────────────────────────┐ │
│ │ ☐ View Usage Analytics  │ │  Professional Feature: Relevant to role
│ │ ☐ Generate Reports      │ │  
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 💬 Justification            │  Section: Reason for request
│ ┌─────────────────────────┐ │
│ │ Why do you need this    │ │  Text Area: Explanation field
│ │ access?                 │ │  
│ │                         │ │  Placeholder: Guidance text
│ │ [I need photo access to │ │  
│ │ document Emma's daily   │ │
│ │ activities for my       │ │
│ │ professional reports...] │ │
│ │                         │ │
│ │ 150/500 characters      │ │  Counter: Character limit
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⏱️ Access Duration Request   │  Section: Time-based access
│ ┌─────────────────────────┐ │
│ │ ● Permanent (ongoing)   │ │  Option: Ongoing access request
│ │ ○ Temporary             │ │  Option: Limited time request
│ │   ┌─────────────────┐   │ │
│ │   │ Until: [Date]   │   │ │  Date Picker: Specific end date
│ │   └─────────────────┘   │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ℹ️ Request Information       │  Section: Process explanation
│ ┌─────────────────────────┐ │
│ │ • Parents will be       │ │  Process: How approval works
│ │   notified immediately  │ │
│ │ • You'll receive a      │ │  Timeline: When to expect response
│ │   response within 24hrs │ │
│ │ • Access is granted     │ │  Security: When access begins
│ │   after approval        │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Cancel]    [Submit Request]│  Actions: Cancel or submit
└─────────────────────────────┘
```

**Request Flow Specifications**:

**Permission Selection**:
- **Multi-select**: Checkbox interface allowing multiple permission requests
- **Visual Hierarchy**: More sensitive permissions clearly indicated
- **Help Text**: Hover/tap explanations for each permission type
- **Dependency Indication**: Show when certain permissions require others

**Justification Requirements**:
- **Character Limits**: 150-500 characters to encourage thoughtful requests
- **Placeholder Guidance**: Examples of good justifications
- **Professional Context**: Templates for common professional scenarios
- **Plain Language**: Avoid technical jargon in explanations

**Duration Selection**:
- **Default to Temporary**: Encourage time-limited access for security
- **Date Picker**: Calendar interface for selecting end dates
- **Maximum Duration**: System limits on temporary access length
- **Renewal Process**: Clear process for extending temporary access

## 4. Professional Dashboard Screen

### 4.1 Professional Caregiver Dashboard

**Purpose**: Specialized interface for professional caregivers managing multiple children or institutional responsibilities
**User Context**: Professional nanny, babysitter, or institutional staff during work hours
**Data Requirements**: Assigned children, professional tools, parent communication

**Layout Structure**:
```
┌─────────────────────────────┐
│ 👔 Lisa Rodriguez          │  Header: Professional identification
│   💼 Professional Nanny     │  Role: Clear professional designation
│   📅 Mon-Fri • 9AM-5PM     │  Schedule: Current schedule or availability
├─────────────────────────────┤
│ 👶 Active Care (2)          │  Section: Currently assigned children
│ ┌─────────────────────────┐ │
│ │ 👧 Emma Thompson        │ │  Child Card: Name and key info
│ │ 🕐 Started: 9:15 AM     │ │  Shift Info: When care began
│ │ 📝 Last: Fed at 11:30AM │ │  Recent Activity: Most recent action
│ │ [Quick Log] [View All]  │ │  Actions: Quick actions for this child
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👦 James Wilson         │ │  Multiple Children: Professional managing multiple
│ │ 🕐 Started: 10:00 AM    │ │  Different Timing: Staggered care start
│ │ 📝 Last: Nap at 12:00PM │ │  Individual Tracking: Per-child recent activity
│ │ [Quick Log] [View All]  │ │  Consistent Actions: Same action pattern
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📋 Professional Tools       │  Section: Professional-specific features
│ ┌─────────────────────────┐ │
│ │ 📊 Daily Report         │ │  Tool: Professional reporting
│ │ Generate today's        │ │  Description: What this tool does
│ │ activity summary        │ │  
│ │ [Generate Report]       │ │  Action: Create professional report
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👨‍👩‍👧‍👦 Parent Updates     │ │  Tool: Communication management
│ │ Send status update to   │ │  Description: Parent communication
│ │ parents                 │ │
│ │ [Send Update]           │ │  Action: Communicate with parents
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 💬 Messages (3)             │  Section: Professional communication
│ ┌─────────────────────────┐ │
│ │ 👤 Emma's Mom           │ │  Message: From parent
│ │ "How is Emma's mood     │ │  Content: Parent question/concern
│ │ today? She was fussy    │ │  
│ │ this morning."          │ │
│ │ 🕐 2 hours ago          │ │  Timestamp: When message was sent
│ │ [Reply]                 │ │  Action: Respond to parent
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📅 Schedule & Handoffs      │  Section: Professional scheduling
│ ┌─────────────────────────┐ │
│ │ 🔄 Next Shift Handoff   │ │  Handoff: Upcoming transition
│ │ 5:00 PM - Parent return │ │  Details: Who's taking over
│ │ [Prepare Handoff Notes] │ │  Action: Prepare transition summary
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🔐 Professional Status      │  Footer: Professional verification
│ ✅ Verified • 🇨🇦 Compliant │  Status: Verification and compliance
└─────────────────────────────┘
```

**Professional Feature Specifications**:

**Child Management Cards**:
- **Multi-Child Support**: Clear visual separation for managing multiple children
- **Shift Tracking**: Start/end times for professional accountability
- **Recent Activity Summary**: Quick overview of recent care activities
- **Quick Action Access**: Fast access to common professional actions

**Professional Tools Section**:
- **Report Generation**: One-click daily report creation for parents
- **Parent Communication**: Structured communication tools for professional updates
- **Documentation**: Professional-quality record keeping
- **Compliance Tracking**: Ensure professional standards are met

**Communication Management**:
- **Parent Messages**: Dedicated inbox for parent communication
- **Professional Templates**: Pre-written responses for common situations
- **Priority Handling**: Important messages highlighted appropriately
- **Professional Tone**: Interface encourages professional communication standards

### 4.2 Institutional Dashboard State

**Purpose**: Dashboard for daycare centers and institutional childcare providers managing multiple families
**User Context**: Daycare staff or administrators managing institutional care responsibilities
**Data Requirements**: Multiple enrolled children, staff management, regulatory compliance

**Layout Structure**:
```
┌─────────────────────────────┐
│ 🏫 Sunshine Daycare         │  Header: Institution identification
│   📋 Licensed Childcare     │  Credentials: License and accreditation
│   👥 3 staff • 12 children  │  Capacity: Current staffing and enrollment
├─────────────────────────────┤
│ 👥 Today's Attendance (8)   │  Section: Daily attendance tracking
│ ┌─────────────────────────┐ │
│ │ ✅ Emma T. • 8:30 AM    │ │  Attendance Item: Check-in status and time
│ │ ✅ James W. • 9:15 AM   │ │  
│ │ ✅ Sophie M. • 8:45 AM  │ │
│ │ ⏰ Pending: Alex K.     │ │  Pending: Expected but not yet arrived
│ │ [Mark Present] [Absent] │ │  Actions: Update attendance status
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 👩‍🏫 Staff Assignments        │  Section: Staff scheduling and assignments
│ ┌─────────────────────────┐ │
│ │ 👩‍🏫 Sarah - Lead Teacher│ │  Staff Member: Role and assignment
│ │ 👶 Infant Room (4)      │ │  Assignment: Room and child count
│ │ 🕐 8:00 AM - 4:00 PM    │ │  Schedule: Shift timing
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👨‍🏫 Mike - Assistant    │ │  
│ │ 🧒 Toddler Room (6)     │ │
│ │ 🕐 9:00 AM - 5:00 PM    │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📋 Daily Activities         │  Section: Institutional activity tracking
│ ┌─────────────────────────┐ │
│ │ 🍼 Feeding Time         │ │  Activity Block: Group activity
│ │ 11:30 AM - Infant Room  │ │  Schedule: Time and location
│ │ 4 children fed          │ │  Completion: How many participated
│ │ [Update Status]         │ │  Action: Mark completion status
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🎨 Art Activity         │ │  
│ │ 2:00 PM - Toddler Room  │ │
│ │ In progress...          │ │  Status: Current activity status
│ │ [Add Details]           │ │  Action: Add activity details
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📱 Parent Communications   │  Section: Parent notification management
│ ┌─────────────────────────┐ │
│ │ 📧 Daily Reports (8)    │ │  Reports: Automated daily summaries
│ │ Scheduled: 5:00 PM      │ │  Timing: When reports will be sent
│ │ [Preview] [Send Now]    │ │  Actions: Review or immediate send
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🚨 Incident Report      │ │  Special: Important notifications
│ │ Emma - minor bump       │ │  Details: What happened
│ │ Parents notified ✅     │ │  Status: Communication completed
│ │ [View Details]          │ │  Action: Full incident details
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📊 Institutional Tools     │  Section: Professional administrative tools
│ [Attendance Report]         │  Tool: Daily attendance summaries
│ [Staff Schedule]            │  Tool: Staff management
│ [Regulatory Compliance]     │  Tool: Compliance tracking
│ [Parent Portal]             │  Tool: Parent communication hub
└─────────────────────────────┘
```

**Institutional Feature Specifications**:

**Multi-Child Management**:
- **Batch Operations**: Ability to update multiple children simultaneously
- **Group Activities**: Track activities for groups rather than individuals
- **Attendance Tracking**: Streamlined check-in/check-out processes
- **Staff-to-Child Ratios**: Automatic monitoring of regulatory ratios

**Regulatory Compliance**:
- **License Tracking**: Monitor license status and renewal requirements
- **Documentation Standards**: Ensure all required documentation is completed
- **Incident Reporting**: Structured incident reporting with parent notification
- **Audit Trails**: Complete activity logs for regulatory compliance

**Professional Communication**:
- **Bulk Parent Updates**: Send updates to multiple parents simultaneously
- **Template System**: Pre-written templates for common communications
- **Scheduled Reports**: Automated daily summary reports to parents
- **Emergency Notifications**: Priority alert system for urgent situations

## 5. Activity Feed Screen

### 5.1 Real-Time Collaboration Feed

**Purpose**: Live activity stream showing all caregiver activities with real-time updates and collaboration features
**User Context**: Any family member monitoring ongoing care activities across multiple caregivers
**Data Requirements**: Real-time activity stream, caregiver attribution, collaboration metadata

**Layout Structure**:
```
┌─────────────────────────────┐
│ 📋 Family Activity     🔄   │  Header: Activity feed + refresh indicator
│ 🔴 Live • 3 caregivers     │  Status: Live connection + active caregiver count
├─────────────────────────────┤
│ 🕐 Now - Mike               │  Timestamp: Real-time or just posted
│ ┌─────────────────────────┐ │
│ │ 🍼 Feeding Emma         │ │  Activity: Current or recent activity
│ │ Started bottle feeding  │ │  Description: What's happening
│ │ 120ml formula           │ │  Details: Specific information
│ │                         │ │
│ │ 👀 Lisa is watching     │ │  Collaboration: Other caregiver awareness
│ │ [👍] [❤️] [💬] [📷]     │ │  Actions: React, comment, photo, share
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🕐 2 minutes ago - Lisa     │  Recent: Activity with timestamp
│ ┌─────────────────────────┐ │
│ │ 📝 Added note           │ │  Activity Type: Note or observation
│ │ "Emma seems extra       │ │  Content: Note text
│ │ alert and happy today!" │ │  
│ │                         │ │
│ │ 👍 Mike reacted         │ │  Social: Other caregiver reaction
│ │ [👍] [❤️] [💬] [📷]     │ │  Actions: Same action pattern
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🕐 15 minutes ago - You     │  Own Activity: User's own past activity
│ ┌─────────────────────────┐ │
│ │ 👶 Diaper change        │ │  Self Activity: Own logged activity
│ │ Wet • Used size 2       │ │  Details: Specific care information
│ │ Brand: Pampers          │ │  Metadata: Brand and product info
│ │                         │ │
│ │ ✅ Lisa acknowledged    │ │  Acknowledgment: Other caregiver saw this
│ │ [Edit] [Delete] [📷]    │ │  Own Actions: Edit/delete own activities
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🔄 Sync Conflict Detected   │  Alert: Coordination issue
│ ┌─────────────────────────┐ │
│ │ ⚠️ Duplicate Activity    │ │  Conflict Type: What kind of conflict
│ │ Both you and Lisa       │ │  Description: Who was involved
│ │ logged diaper change    │ │  
│ │ at 2:45 PM             │ │  
│ │                         │ │
│ │ [Keep Both] [Merge]     │ │  Resolution: Conflict resolution options
│ │ [Review Details]        │ │  Action: Get more information
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🕐 1 hour ago - Grandma     │  Extended Family: Family member activity
│ ┌─────────────────────────┐ │
│ │ 📷 Added photo          │ │  Media: Photo sharing
│ │ "Emma's first smile     │ │  Caption: Photo description
│ │ of the day! 😊"         │ │
│ │                         │ │
│ │ [View Photo] [Download] │ │  Media Actions: View and save options
│ │ 👍❤️ Mike, Lisa reacted │ │  Social Proof: Multiple reactions
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [+ Quick Log Activity]      │  Quick Action: Fast activity logging
└─────────────────────────────┘
```

**Real-Time Update Specifications**:

**Live Activity Indicators**:
- **Red Dot**: Live indicator for currently active feed
- **Animation**: Gentle pulse animation on live activities
- **Timestamp Updates**: Real-time timestamp updates ("now", "1m ago", etc.)
- **Caregiver Count**: Dynamic count of currently active caregivers

**Collaboration Metadata**:
- **Awareness Indicators**: "Lisa is watching" for other caregivers viewing same activity
- **Social Reactions**: Emoji reactions from other caregivers
- **Acknowledgments**: Visual confirmation that other caregivers saw the activity
- **Edit History**: Indication when activities have been modified

**Conflict Resolution UI**:
- **Inline Resolution**: Conflicts resolved directly in the activity feed
- **Visual Prominence**: Conflicts stand out with warning colors and icons
- **Quick Actions**: One-tap resolution for common conflict types
- **Detail Access**: Ability to examine conflicts in detail before resolving

**Activity Interaction Patterns**:

**Tap Actions**:
- **Single Tap**: Expand activity to show full details and options
- **Double Tap**: Quick like/acknowledge reaction
- **Long Press**: Context menu with additional actions

**Swipe Actions**:
- **Swipe Right**: Quick positive reaction (👍)
- **Swipe Left**: Quick action menu (edit, delete, share, etc.)

**Pull Gestures**:
- **Pull to Refresh**: Refresh activity feed with latest updates
- **Pull Down from Top**: Manual refresh with visual feedback

## 6. Conflict Resolution Screen

### 6.1 Conflict Detection and Resolution

**Purpose**: Smart interface for detecting and resolving coordination conflicts between multiple caregivers
**User Context**: System-detected conflicts requiring user intervention or confirmation
**Data Requirements**: Conflicting activities, resolution options, caregiver preferences

**Layout Structure**:
```
┌─────────────────────────────┐
│ ← Resolve Conflict          │  Header: Clear navigation back
├─────────────────────────────┤
│ ⚠️ Coordination Conflict     │  Alert: Conflict identification
│ 🔄 Duplicate Activity       │  Type: Specific conflict category
├─────────────────────────────┤
│ 📅 Timeline Review          │  Section: What happened when
│ ┌─────────────────────────┐ │
│ │ 🕐 2:45 PM              │ │  Timeline Entry: Precise timing
│ │ 👤 You logged:          │ │  Attribution: Who logged what
│ │ 👶 Diaper change - wet  │ │  Activity: What was recorded
│ │ Location: Nursery       │ │  Details: Additional context
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🕐 2:47 PM (2 min later)│ │  Timeline Entry: Conflicting time
│ │ 👩‍⚕️ Lisa logged:         │ │  Other Caregiver: Professional caregiver
│ │ 👶 Diaper change - wet  │ │  Duplicate: Same activity type
│ │ Location: Living room   │ │  Discrepancy: Different location
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🤖 AI Analysis             │  Section: System analysis
│ ┌─────────────────────────┐ │
│ │ 🎯 Confidence: 85%      │ │  Confidence: AI certainty level
│ │ These appear to be      │ │  Assessment: What system thinks
│ │ duplicate entries for   │ │  
│ │ the same diaper change. │ │
│ │                         │ │
│ │ 📍 Location discrepancy │ │  Notable: Key differences
│ │ may indicate different  │ │  Analysis: Potential explanations
│ │ children or timing.     │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ✅ Recommended Resolution   │  Section: Suggested solution
│ ┌─────────────────────────┐ │
│ │ 🔀 Merge Activities     │ │  Option: Combine duplicate entries
│ │ Keep your entry with    │ │  Details: What will happen
│ │ Lisa's location detail  │ │  Specifics: How merge will work
│ │                         │ │
│ │ ✅ Notify both parties  │ │  Communication: Who will be informed
│ │ ✅ Preserve both notes  │ │  Data Preservation: What gets saved
│ │                         │ │
│ │ [Accept Merge]          │ │  Action: Implement recommendation
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 🔧 Other Options           │  Section: Alternative resolutions
│ ┌─────────────────────────┐ │
│ │ 📋 Keep Both Entries    │ │  Option: No merge, keep separate
│ │ Mark as separate events │ │  Result: Both activities remain
│ │ [Keep Separate]         │ │  Action: Choose this option
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ❌ Delete Duplicate     │ │  Option: Remove one entry
│ │ Remove Lisa's entry     │ │  Specific: Which one to remove
│ │ [Delete Lisa's Entry]   │ │  Action: Destructive action
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 💬 Ask for Clarification│ │  Option: Get more information
│ │ Message both caregivers │ │  Communication: Involve both parties
│ │ [Send Message]          │ │  Action: Request clarification
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ [Cancel] [Resolve Later]    │  Actions: Defer or cancel resolution
└─────────────────────────────┘
```

**Conflict Analysis Specifications**:

**AI Confidence Scoring**:
- **High Confidence (80-100%)**: Clear recommendations with auto-resolve options
- **Medium Confidence (60-79%)**: Suggestions with human review required
- **Low Confidence (0-59%)**: Present options without strong recommendation
- **Visual Indicators**: Color-coded confidence levels (green, amber, red)

**Resolution Option Hierarchy**:
1. **Merge Activities**: Combine duplicate or similar entries intelligently
2. **Keep Separate**: Maintain both entries as distinct events
3. **Delete Duplicate**: Remove clearly erroneous entries
4. **Clarify with Users**: Request additional information from involved parties

**Communication Integration**:
- **Automatic Notifications**: Inform all involved parties of resolution
- **Explanation Messages**: Clear communication about what was resolved and why
- **Consent Tracking**: Record who approved what resolution approach
- **Appeal Process**: Allow users to contest automatic resolutions

### 6.2 Multi-Caregiver Coordination View

**Purpose**: Overview of all current caregivers and their activities to prevent coordination issues
**User Context**: Busy periods with multiple active caregivers needing coordination
**Data Requirements**: Active caregiver locations, current activities, upcoming scheduled activities

**Layout Structure**:
```
┌─────────────────────────────┐
│ 👥 Caregiver Coordination   │  Header: Coordination focus
│ 🔴 Live • 3 active         │  Status: Real-time with active count
├─────────────────────────────┤
│ 🗺️ Current Locations       │  Section: Where everyone is
│ ┌─────────────────────────┐ │
│ │ 🏠 Home                 │ │  Location Header: Primary location
│ │ 👤 You - Kitchen        │ │  Person Location: Specific room/area
│ │ 👩‍⚕️ Lisa - Nursery       │ │  Professional: Professional caregiver
│ │ 👵 Grandma - Living Room│ │  Family: Extended family member
│ │ 👶 Emma - Nursery       │ │  Child Location: Where child is
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⚡ Current Activities       │  Section: What everyone is doing now
│ ┌─────────────────────────┐ │
│ │ 🍼 Lisa: Feeding Emma   │ │  Active Activity: Who is doing what
│ │ Started 5 minutes ago   │ │  Timing: How long it's been going
│ │ [View Details]          │ │  Action: Get more information
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🎵 You: Playing music   │ │  Supporting Activity: Complementary care
│ │ Lullabies in background │ │  Details: What specifically
│ │ [Stop] [Change Music]   │ │  Controls: Direct activity control
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📅 Upcoming Schedule        │  Section: What's planned next
│ ┌─────────────────────────┐ │
│ │ 🕐 3:30 PM (15 min)     │ │  Schedule Item: Time and countdown
│ │ 😴 Naptime scheduled    │ │  Activity: What's supposed to happen
│ │ 👩‍⚕️ Lisa will handle     │ │  Assignment: Who's responsible
│ │ [Confirm] [Reschedule]  │ │  Actions: Confirm or modify
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⚠️ Coordination Alerts      │  Section: Things needing attention
│ ┌─────────────────────────┐ │
│ │ 🔔 Feeding due soon     │ │  Alert: Upcoming need
│ │ Next feeding in 20 min  │ │  Timing: When attention needed
│ │ Who will handle this?   │ │  Question: Coordination needed
│ │ [I'll do it] [Lisa?]    │ │  Assignment: Quick role assignment
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 💬 Quick Communication     │  Section: Fast caregiver messaging
│ ┌─────────────────────────┐ │
│ │ [All] [Lisa] [Grandma]  │ │  Recipients: Message targeting
│ │ "Emma is getting sleepy │ │  Message: Quick status update
│ │ for her nap 😴"         │ │
│ │ [Send Update]           │ │  Action: Send to selected caregivers
│ └─────────────────────────┘ │
└─────────────────────────────┘
```

**Coordination Feature Specifications**:

**Location Tracking**:
- **Manual Check-ins**: Caregivers can update their location within the home
- **Activity-Based Location**: Automatically infer location from activities
- **Privacy Controls**: Location sharing can be disabled by user preference
- **Child Location Priority**: Always show where the child is currently located

**Activity Coordination**:
- **Real-Time Activity Status**: Live updates of ongoing activities
- **Activity Handoffs**: Smooth transitions between caregivers
- **Duplicate Prevention**: Warnings when multiple caregivers attempt same activity
- **Activity Dependencies**: Show when activities affect or enable other activities

**Schedule Coordination**:
- **Shared Calendar View**: Upcoming scheduled activities visible to all
- **Role Assignment**: Clear assignment of who handles what activities
- **Schedule Conflicts**: Detection and resolution of scheduling conflicts
- **Flexible Rescheduling**: Easy modification of scheduled activities

## 7. Emergency Access Screen

### 7.1 Emergency Information Dashboard

**Purpose**: Quick access to critical information and emergency contacts during urgent situations
**User Context**: Emergency situations requiring immediate access to child and family information
**Data Requirements**: Emergency contacts, medical information, current caregiver locations

**Layout Structure**:
```
┌─────────────────────────────┐
│ 🚨 EMERGENCY ACCESS         │  Header: Clear emergency designation
│ 👶 Emma Thompson            │  Child: Specific child identification
├─────────────────────────────┤
│ 🏥 CALL 911 IMMEDIATELY     │  Priority: Primary emergency action
│ ┌─────────────────────────┐ │
│ │ 📞 [CALL 911]           │ │  Emergency Services: One-tap emergency call
│ │ 🚑 [CALL AMBULANCE]     │ │  Medical Emergency: Direct ambulance call
│ │ 👮 [CALL POLICE]        │ │  Safety Emergency: Direct police call
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 👨‍👩‍👧‍👦 FAMILY CONTACTS        │  Section: Family emergency contacts
│ ┌─────────────────────────┐ │
│ │ 👤 Sarah (Mom)          │ │  Primary Contact: Mother
│ │ 📱 (555) 123-4567      │ │  Phone: Direct contact number
│ │ [CALL] [TEXT]           │ │  Actions: Call or text options
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 👤 Mike (Dad)           │ │  Secondary Contact: Father
│ │ 📱 (555) 987-6543      │ │  Phone: Alternative contact
│ │ [CALL] [TEXT]           │ │  Actions: Same communication options
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ ⚕️ MEDICAL INFORMATION      │  Section: Critical medical info
│ ┌─────────────────────────┐ │
│ │ 🩺 Pediatrician         │ │  Medical Contact: Primary doctor
│ │ Dr. Johnson             │ │  Name: Doctor identification
│ │ 📞 (555) 456-7890      │ │  Contact: Medical office number
│ │ [CALL DOCTOR]           │ │  Action: Direct medical contact
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 💊 Allergies: None      │ │  Allergies: Critical safety info
│ │ 💉 Medications: None    │ │  Medications: Current prescriptions
│ │ 🩸 Blood Type: O+       │ │  Blood Type: Emergency medical info
│ │ 🏥 Hospital: Children's │ │  Preferred: Preferred emergency hospital
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📍 CURRENT LOCATION         │  Section: Child and caregiver location
│ ┌─────────────────────────┐ │
│ │ 🏠 123 Maple Street     │ │  Address: Current physical location
│ │ Toronto, ON M5V 1A1     │ │  Full Address: Complete location info
│ │ 👶 Emma: Nursery        │ │  Child Location: Where child is now
│ │ 👩‍⚕️ Lisa: With Emma      │ │  Caregiver: Who is with child
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📋 EMERGENCY NOTES          │  Section: Additional critical info
│ ┌─────────────────────────┐ │
│ │ • Emma is teething      │ │  Recent: Recent health notes
│ │ • Last feeding: 2:30 PM │ │  Recent Care: Recent care activities
│ │ • No unusual symptoms  │ │  Status: Current health status
│ │ • Contact pediatrician  │ │  Instructions: Parent instructions
│ │   for any concerns      │ │
│ └─────────────────────────┘ │
├─────────────────────────────┤
│ 📞 [CALL ALL PARENTS]       │  Action: Group call to all parents
└─────────────────────────────┘
```

**Emergency Access Specifications**:

**Critical Action Priority**:
1. **Emergency Services (911)**: Largest, most prominent button
2. **Family Contacts**: Quick access to parents/guardians
3. **Medical Contacts**: Pediatrician and medical team
4. **Location Information**: Where the child currently is
5. **Medical Information**: Allergies, medications, blood type

**One-Tap Emergency Actions**:
- **Auto-Dial Numbers**: Direct dialing without additional confirmations
- **Conference Calling**: Ability to call multiple family members simultaneously
- **Location Sharing**: Automatic location sharing with emergency contacts
- **Medical Information Display**: Critical medical info readily visible

**Privacy and Access Controls**:
- **Emergency Override**: Emergency information accessible even with limited permissions
- **Audit Logging**: All emergency access is logged for security
- **Time-Limited Access**: Emergency access may be time-limited for temporary caregivers
- **Parental Notification**: Parents notified when emergency information is accessed

This comprehensive screen state documentation provides detailed wireframes and specifications for all caregiver collaboration interfaces, ensuring consistent implementation across the family sharing and professional caregiver coordination system while maintaining Canadian privacy compliance and optimal user experience.