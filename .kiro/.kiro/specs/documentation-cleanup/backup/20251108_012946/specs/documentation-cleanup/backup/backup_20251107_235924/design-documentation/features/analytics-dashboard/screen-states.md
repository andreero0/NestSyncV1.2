# Analytics Dashboard Screen States & Wireframes

Detailed ASCII wireframes and state specifications for analytics dashboard screens with data visualization, predictive insights, and privacy-first design methodology optimized for stressed Canadian parents.

---
title: Analytics Dashboard Screen States & Wireframes
description: Complete visual specifications for analytics, insights, and export screens with psychological rationale
feature: Analytics Dashboard
last-updated: 2025-09-04
version: 1.0.0
related-files: 
  - README.md
  - user-journey.md
  - interactions.md
dependencies:
  - Victory Charts (React Native)
  - NativeBase components
  - React Native Reanimated v3
  - TensorFlow Lite
status: approved
---

## Screen State Overview

Each analytics screen state includes:
- **ASCII Wireframe**: Visual layout with exact positioning and data visualization
- **Component Specifications**: Victory Charts and NativeBase integration details
- **Psychological Rationale**: Why each insight is positioned and presented
- **Data Privacy**: Canadian PIPEDA compliance in every interface element
- **Responsive Adaptations**: How layouts adapt for different screen sizes and data sets

---

## Analytics Overview Dashboard

### State: Default Analytics Dashboard

**Purpose**: Provide immediate confidence-building insights and reassurance to stressed parents about baby's patterns and upcoming needs.

**Psychological Focus**: Transform raw data into stress-reducing, actionable intelligence.

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 Data stored in Canada │ ← Status Bar (44px)
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Analytics        [CHART] [📊] [📤]          Emma (8w)    │ ← Header (60px)
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │ ← 16px margin
│  📈 Your Baby's Patterns                               │ ← Section Header (28px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                    This Week                        │ │ ← Time Period (140px)
│  │                                                     │ │
│  │    Average Daily Changes: 8.2                      │ │ ← Key Metric (36px text)
│  │    ✅ Excellent consistency (92% regularity)        │ │ ← Confidence Building
│  │                                                     │ │
│  │    ●●●●●●●○ Pattern Chart (Last 7 Days)            │ │ ← Visual Pattern
│  │    Mon Tue Wed Thu Fri Sat Sun                     │ │
│  │     9   8   7   9   8  10   8                      │ │ ← Daily Counts
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← 20px spacing
│  🔮 Smart Predictions                                   │ ← Section Header (28px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [TARGET] Size Change Likely                             │ │ ← Prediction Card (100px)
│  │                                                     │ │
│  │ Jan 25-30: Consider Size 3 diapers                │ │ ← Prediction Details
│  │ Confidence: 87% (Based on growth pattern)         │ │ ← Confidence Score
│  │                                                     │ │
│  │ [🛍️ View Options]              [📅 Set Reminder]   │ │ ← Actions (40px)
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Smart Insights                                     │ ← Section Header (28px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ • Peak hours: 7-9am, 2-4pm, 8-10pm                │ │ ← Insights List (80px)
│  │ • Weekend usage 15% higher (normal for baby's age) │ │
│  │ • Current diaper efficiency: 95% (excellent!)      │ │
│  │ • Monthly cost tracking: $47.32 (within budget)   │ │ ← Cost Insight
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← 20px spacing
│  📋 Quick Actions                                       │ ← Section Header (28px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [📊 View Detailed Charts] [📤 Export Report] [⚙️ Settings] │ │ ← Action Buttons (48px)
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← Flexible space
│                                              [FAB] [📈]   │ ← FAB (56px, 24px margins)
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │ ← Tab Bar (80px)
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

**Component Specifications**:

**Privacy Trust Indicator (Top Bar)**:
- **Background**: Subtle Canadian red with maple leaf icon
- **Text**: "🇨🇦 Data stored in Canada" - 12px medium
- **Psychology**: Constant privacy reassurance without overwhelming
- **Touch Target**: Tappable for privacy details

**Pattern Visualization**:
- **Chart Type**: Simple dot chart with connecting lines
- **Colors**: Primary blue dots, connecting lines in Neutral-400
- **Interactive**: Tap dots to see detailed day breakdown
- **Accessibility**: Voice description of trends available
- **Animation**: Smooth reveal of pattern over 800ms

**Key Metrics Display**:
- **Typography**: 
  - Value: 32px bold, Primary blue
  - Label: 16px medium, Neutral-700
  - Status: 16px medium with appropriate status color
- **Layout**: Centered alignment, generous white space
- **Psychology**: Large numbers build confidence, check marks provide validation

**Prediction Cards**:
- **Background**: Light blue gradient (95% white, 5% primary)
- **Border**: 1px Primary blue, subtle
- **Icon**: Appropriate emoji for quick recognition
- **Confidence Score**: Displayed prominently with explanation
- **Actions**: Primary button style, 48px height

### State: Data Privacy Mode (Canadian Compliance)

**Trigger**: User accesses privacy settings or data handling information
**Purpose**: Full transparency about PIPEDA compliance and user control

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 PIPEDA Compliant │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔒 Your Data Privacy                                   │ ← Privacy Header
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🇨🇦 Canadian Data Protection                          │ ← Section (24px)
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ All data stored in Canadian data centers         │ │ ← Trust Indicators
│  │ ✅ Full PIPEDA compliance and protection           │ │
│  │ ✅ No data sharing with US or international        │ │
│  │ ✅ Your consent required for any data use          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📊 Analytics Data Usage                               │ ← Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ What we analyze:                                   │ │ ← Clear Explanations
│  │ • Diaper change frequency and timing               │ │
│  │ • Growth pattern predictions                       │ │
│  │ • Cost optimization opportunities                  │ │
│  │                                                     │ │
│  │ What we DON'T store:                              │ │
│  │ • Photos of your baby                             │ │
│  │ • Location data or tracking                       │ │ ← Privacy Assurances
│  │ • Personal identifiers beyond necessary           │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ⚙️ Your Privacy Controls                               │ ← Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Analytics for app improvement      [●○]            │ │ ← Toggle Controls
│  │ Predictive modeling               [●○]            │ │
│  │ Cost optimization suggestions     [●○]            │ │
│  │ Healthcare provider sharing       [○●]            │ │ ← Explicit Consent
│  │                                                     │ │
│  │ Data retention: [365 days ▼]                      │ │ ← Retention Control
│  │                                                     │ │
│  │ [📤 Export My Data]    [🗑️ Delete All Data]        │ │ ← User Rights
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📋 Privacy Audit Trail                                │ ← Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Recent data access:                                │ │ ← Transparency Log
│  │ • Analytics computation: Jan 12, 2:30 PM          │ │
│  │ • Prediction model update: Jan 11, 8:15 AM        │ │
│  │ • Export requested: Jan 10, 4:22 PM               │ │ ← Full Audit Trail
│  │                                                     │ │
│  │ [View Complete Log]                                │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [🔒]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

---

## Detailed Analytics View

### State: Advanced Charts and Trends

**Purpose**: Deep-dive analytics for data-driven parents and healthcare provider documentation
**User Type**: Primarily Mike (efficiency dad) and Lisa (professional caregiver)

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 Data stored in Canada │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Detailed Analytics    [7d] [30d] [90d] [1y]    Emma    │ ← Time Range Selector
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📈 Usage Trends (Last 30 Days)                        │ ← Main Chart Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Changes │                                           │ │ ← Chart Area (180px)
│  │    12   │    ●                                      │ │
│  │    10   │  ●   ●   ●       ●   ●                    │ │ ← Line Chart
│  │     8   │●   ●   ●   ●   ●   ●   ●   ●   ●         │ │
│  │     6   │                  ●               ●       │ │
│  │     4   │                                          │ │
│  │     2   │                                          │ │
│  │     0   └─────────────────────────────────────────── │ │
│  │         Week1  Week2  Week3  Week4  Week5          │ │ ← X-Axis Labels
│  │                                                     │ │
│  │ Trend: Stable (±0.3 changes/day variance)         │ │ ← Trend Analysis
│  │ Average: 8.2 changes/day (normal for 8-week-old)  │ │ ← Context
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  ⏰ Daily Patterns                                      │ ← Pattern Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Peak Hours Analysis                                 │ │ ← Timing Analysis (120px)
│  │                                                     │ │
│  │  Changes                                           │ │
│  │    3 │    ██                    ██    ██           │ │ ← Bar Chart
│  │    2 │ ██ ██ ██          ██ ██ ██ ██ ██ ██       │ │
│  │    1 │ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██       │ │
│  │    0 └─────────────────────────────────────────── │ │
│  │       6  8 10 12  2  4  6  8 10 12  2  4 (hours) │ │
│  │                                                     │ │
│  │ Most active: 7-9am (34%), 2-4pm (28%), 8-10pm (31%) │ │ ← Insights
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  💰 Cost Analysis                                       │ ← Financial Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Monthly Spending Breakdown                          │ │ ← Cost Analysis (100px)
│  │                                                     │ │
│  │ Total this month: $47.32 CAD                       │ │ ← Key Metrics
│  │ Cost per change: $0.19 CAD                        │ │
│  │ Efficiency vs target: 96% (excellent!)            │ │ ← Efficiency Score
│  │                                                     │ │
│  │ 💡 Optimization: Bulk purchase could save $89/year │ │ ← Savings Suggestion
│  │                                                     │ │
│  │ [View Savings Plan]                                │ │ ← Action
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [📊]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

**Advanced Visualization Components**:

**Victory Chart Integration**:
```typescript
// Line chart configuration
const chartConfig = {
  area: {
    style: {
      data: { fill: "rgba(8, 145, 178, 0.1)", stroke: "#0891B2", strokeWidth: 2 }
    }
  },
  axis: {
    style: {
      tickLabels: { fontSize: 12, fill: "#6B7280" },
      grid: { stroke: "#E5E7EB" }
    }
  },
  width: 350,
  height: 140,
  padding: { left: 40, right: 20, top: 20, bottom: 40 }
};
```

**Time Range Toggle**:
- **Selected State**: Primary blue background, white text
- **Unselected State**: Neutral-100 background, Neutral-600 text  
- **Animation**: Smooth sliding indicator between selections
- **Accessibility**: Clear labels and focus states

### State: Predictive Insights (Premium)

**Trigger**: Advanced AI predictions available for premium users
**Purpose**: Machine learning-powered insights for optimal planning

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 ML Processing in Canada │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🔮 AI Predictions [PREMIUM]           Emma (8 weeks)   │ ← Premium Header
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🍼 Size Change Prediction                              │ ← Prediction Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                   Next Size Change                  │ │ ← Size Prediction (140px)
│  │                                                     │ │
│  │        Size 2 → Size 3                             │ │ ← Visual Transition
│  │        📅 Jan 25-30, 2024                          │ │ ← Date Range
│  │                                                     │ │
│  │    Confidence: ████████░░ 87%                      │ │ ← Confidence Bar
│  │                                                     │ │
│  │    Based on:                                       │ │ ← Explanation
│  │    • Growth velocity: +2.1cm/week                  │ │
│  │    • Current fit efficiency: 95%                   │ │ ← Data Points
│  │    • Similar babies' patterns                      │ │
│  │                                                     │ │
│  │    [🛍️ Pre-order Size 3]    [📅 Set Size Reminder] │ │ ← Actions
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📦 Reorder Optimization                               │ ← Ordering Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Smart Reorder Plan                     │ │ ← Order Planning (120px)
│  │                                                     │ │
│  │    Next order: January 15, 2024                    │ │ ← Optimal Date
│  │    Quantity: 144 count (18-day supply)             │ │ ← Quantity
│  │    Cost: $39.99 CAD (Amazon.ca)                    │ │ ← Best Price
│  │                                                     │ │
│  │    💡 Alternative: Wait until Jan 22                │ │ ← Alternative
│  │       Bulk discount: $36.99 CAD (Save $3.00)      │ │ ← Savings
│  │                                                     │ │
│  │    [Order Now]           [Schedule for Jan 22]     │ │ ← Action Choice
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📊 Pattern Analysis                                    │ ← Analysis Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              Baby's Unique Pattern                  │ │ ← Personalized (100px)
│  │                                                     │ │
│  │    • Emma's rhythm: Every 2.8 hours average        │ │ ← Personal Metrics
│  │    • More active on weekends (+18%)                │ │
│  │    • Sleep correlation: 6-hour stretches normal    │ │ ← Sleep Integration
│  │    • Growth acceleration: Above average (healthy!) │ │ ← Health Context
│  │                                                     │ │
│  │    All patterns normal for 8-week-old babies ✅    │ │ ← Reassurance
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🏥 Healthcare Integration                              │ ← Professional Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │          Professional Summary                       │ │ ← Healthcare (80px)
│  │                                                     │ │
│  │    Last 30 days: Consistent, healthy patterns      │ │ ← Clinical Summary
│  │    Recommendations for pediatrician visit ready    │ │
│  │                                                     │ │
│  │    [📄 Generate Report]      [📧 Email to Dr.]     │ │ ← Professional Actions
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [🔮]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

---

## Export and Sharing Screens

### State: Healthcare Provider Export

**Purpose**: Generate professional reports for pediatricians and healthcare providers
**Focus**: Clinical relevance and professional formatting

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 PIPEDA Secure Export │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📤 Export for Healthcare                    Emma (8w)   │ ← Export Header
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏥 Report Type Selection                               │ ← Report Type Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [●] Pediatrician Visit Report (Standard)           │ │ ← Report Options (120px)
│  │     • 30-day summary with key metrics              │ │
│  │     • Growth indicators and patterns               │ │
│  │     • Recommended discussion points                │ │
│  │                                                     │ │
│  │ [○] Detailed Clinical Report (Premium)             │ │
│  │     • Complete 90-day analysis                     │ │ ← Premium Option
│  │     • Advanced pattern recognition                 │ │
│  │     • Comparative age-based benchmarks            │ │
│  │                                                     │ │
│  │ [○] Custom Date Range Report                       │ │
│  │     • Select specific time period                  │ │ ← Custom Option
│  │     • Focused on particular concerns               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📅 Date Range                                          │ ← Date Selection
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ From: [Dec 13, 2023 ▼]  To: [Jan 12, 2024 ▼]      │ │ ← Date Pickers (60px)
│  │                                                     │ │
│  │ Data points: 847 changes over 30 days              │ │ ← Data Summary
│  │ Completeness: 96% (excellent data quality)         │ │ ← Quality Indicator
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🔒 Privacy Settings                                   │ ← Privacy Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Include in report:                                  │ │ ← Privacy Controls (100px)
│  │                                                     │ │
│  │ [✓] Daily usage patterns and trends                │ │ ← Checkboxes
│  │ [✓] Growth velocity and size changes               │ │
│  │ [✓] Sleep correlation analysis                     │ │
│  │ [○] Detailed timing of each change                 │ │ ← Optional Detail
│  │ [○] Personal notes and observations               │ │
│  │                                                     │ │
│  │ Healthcare provider: Dr. Sarah Chen                │ │ ← Provider Info
│  │ Clinic: Toronto Pediatric Associates              │ │
│  │                                                     │ │
│  │ [Add Provider Email] [Remove Access After Visit]   │ │ ← Access Control
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📄 Export Options                                      │ ← Export Format
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Format: [PDF Report ▼]                             │ │ ← Format Selection (80px)
│  │         • PDF Report (recommended for doctors)      │ │
│  │         • CSV Data (for analysis software)         │ │ ← Format Options
│  │         • Email Summary (quick overview)           │ │
│  │                                                     │ │
│  │ Delivery: [📧 Email to provider] [💾 Save to device] │ │ ← Delivery Options
│  │                                                     │ │
│  │ [🔍 Preview Report]                                 │ │ ← Preview Action
│  └─────────────────────────────────────────────────────┘ │
│                                                         │ ← 20px spacing
│                                                         │
│     [Cancel]                       [Generate Report]    │ ← Action Buttons (48px)
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

### State: Report Generation Progress

**Trigger**: User taps "Generate Report" 
**Purpose**: Show professional report creation with privacy assurance

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 Secure Processing │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📤 Generating Healthcare Report                        │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                                                     │ │ ← Progress Card (200px)
│  │              🏥 Creating Report                     │ │
│  │                                                     │ │
│  │               Dr. Sarah Chen                        │ │ ← Provider Name
│  │         Toronto Pediatric Associates               │ │
│  │                                                     │ │
│  │    ████████████░░░░░░░░ 60%                        │ │ ← Progress Bar
│  │                                                     │ │
│  │         Processing 30 days of data...              │ │ ← Status Text
│  │                                                     │ │
│  │    ✅ Data analysis complete                        │ │ ← Completed Steps
│  │    ✅ Privacy filters applied                      │ │
│  │    🔄 Generating clinical summary...               │ │ ← Current Step
│  │    ⏳ Creating PDF document                         │ │ ← Pending Steps
│  │    ⏳ Applying security measures                    │ │
│  │                                                     │ │
│  │         🔒 All processing in Canada                 │ │ ← Privacy Assurance
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                                         │
│  Estimated completion: 15 seconds                      │ ← Time Estimate
│                                                         │
│                                                         │
│                 [Cancel Generation]                     │ ← Cancel Option
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

### State: Export Success with Preview

**Purpose**: Confirmation of successful export with preview and sharing options
**Focus**: User control and professional presentation

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 Report Generated Securely │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ✅ Healthcare Report Ready                             │
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  🏥 Report for Dr. Sarah Chen                          │ ← Provider Context
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │                 📄 Report Preview                   │ │ ← Preview Section (150px)
│  │                                                     │ │
│  │    ┌─────────────────────────────────────────────┐ │ │
│  │    │ PEDIATRIC DIAPER ANALYSIS REPORT            │ │ │ ← PDF Preview
│  │    │                                             │ │ │
│  │    │ Patient: Emma T. (8 weeks old)             │ │ │
│  │    │ Period: Dec 13, 2023 - Jan 12, 2024       │ │ │
│  │    │                                             │ │ │ ← Mini PDF View
│  │    │ EXECUTIVE SUMMARY                           │ │ │
│  │    │ • Average daily changes: 8.2                │ │ │
│  │    │ • Pattern consistency: 92%                  │ │ │
│  │    │ • Growth indicators: Normal                 │ │ │
│  │    │ • Recommendations: [Click to view full]     │ │ │
│  │    └─────────────────────────────────────────────┘ │ │
│  │                                                     │ │
│  │ [🔍 View Full Report]        [📧 Email Now]         │ │ ← Preview Actions
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📤 Sharing Options                                     │ ← Sharing Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [📧] Email to Dr. Chen (schen@torontopediatric.ca) │ │ ← Email Option (100px)
│  │     ✅ Secure, encrypted delivery                   │ │
│  │     📅 Access expires after 30 days                │ │ ← Security Info
│  │                                                     │ │
│  │ [💾] Save to Device                                 │ │ ← Save Option
│  │     📱 Stored in secure folder                      │ │
│  │     🔒 Password protected PDF                       │ │
│  │                                                     │ │
│  │ [📋] Copy Shareable Link                            │ │ ← Link Option
│  │     🔗 Expires in 7 days                           │ │
│  │     🔐 Password: baby2024                          │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🔒 Privacy Summary                                     │ ← Privacy Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ✅ All data processed in Canada (PIPEDA compliant) │ │ ← Compliance (60px)
│  │ ✅ No personal identifiers beyond necessary        │ │
│  │ ✅ Provider access logged and time-limited         │ │ ← Access Control
│  │                                                     │ │
│  │ [Revoke Access]             [View Privacy Log]     │ │ ← Privacy Actions
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [📤]   │
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

---

## Multi-Child Analytics (Premium)

### State: Comparative Analytics Dashboard

**Purpose**: Professional caregivers and families with multiple children
**Focus**: Efficient comparison and bulk optimization

```ascii
┌─────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                            🇨🇦 [PREMIUM] Multi-Child Analytics │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  👨‍👩‍👧‍👦 Family Analytics    [Emma] [Alex] [Sam] [+ Add] │ ← Child Selector
│                                                         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  📊 Family Overview                                     │ ← Family Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │              This Week Summary                      │ │ ← Summary Card (120px)
│  │                                                     │ │
│  │  Emma (8w):  ████████░░░░ 8.2/day  Size 2  ⚠️3 days │ │ ← Child Status Rows
│  │  Alex (18m): ████░░░░░░░░ 4.1/day  Size 4  ✅8 days │ │
│  │  Sam (3y):   ██░░░░░░░░░░ 2.3/day  Size 6  ✅12 days │ │ ← Visual Progress Bars
│  │                                                     │ │
│  │  Total changes this week: 103 (all children)       │ │ ← Total Metrics
│  │  Monthly cost: $127.45 CAD                         │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  💡 Smart Family Insights                               │ ← Insights Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ 🎯 Bulk Purchase Opportunity                        │ │ ← Optimization (100px)
│  │                                                     │ │
│  │ Order Size 2 + Size 4 together on Jan 15          │ │ ← Recommendation
│  │ Combined shipping saves $8.99                      │ │
│  │ Timing optimal for both children's needs           │ │ ← Timing Logic
│  │                                                     │ │
│  │ [🛍️ Setup Bulk Order]         [📅 Schedule for Later] │ │ ← Actions
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  📈 Comparative Trends                                  │ ← Trends Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │        Usage Trends (All Children)                 │ │ ← Comparison Chart (140px)
│  │                                                     │ │
│  │  Changes                                           │ │
│  │    10 │ ●●●●●●●● Emma (8w)                         │ │ ← Multi-line Chart
│  │     8 │                                            │ │
│  │     6 │       ●●●●●● Alex (18m)                    │ │
│  │     4 │                                            │ │
│  │     2 │              ●●●● Sam (3y)                 │ │ ← Different Colors
│  │     0 └─────────────────────────────────────────── │ │
│  │       Mon  Tue  Wed  Thu  Fri  Sat  Sun           │ │
│  │                                                     │ │
│  │ Pattern: Emma's frequency normal, Alex stable      │ │ ← Insights
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  🏥 Professional Features                               │ ← Professional Section
│                                                         │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ [📊 Individual Reports] [📋 Combined Summary]        │ │ ← Export Options (60px)
│  │                                                     │ │
│  │ [👨‍⚕️ Pediatrician Export] [📧 Share with Partner]    │ │ ← Sharing Options
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│                                              [FAB] [👥]   │ ← Multi-child FAB
│                                                         │
├─────────────────────────────────────────────────────────┤
│   [[HOME]]        [[ANALYTICS]]●      [[SETTINGS]]                         │
│   Home           Analytics      Settings                │
└─────────────────────────────────────────────────────────┘
```

---

## Responsive Design Adaptations

### Tablet View: Analytics Dashboard (768px+)

```ascii
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ [●●●] 9:41 AM                                    🇨🇦 Data stored in Canada           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  Analytics Dashboard                                    Emma (8 weeks)         📊📤⚙️│
│                                                                                     │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│  ┌─────────────────────────────────┐    ┌─────────────────────────────────────────┐ │
│  │        📈 Usage Trends          │    │          🔮 Smart Predictions          │ │
│  │                                 │    │                                         │ │
│  │   Average: 8.2 changes/day     │    │   Size Change: Jan 25-30 (87% conf)   │ │ ← Two-column layout
│  │   Consistency: 92% excellent    │    │   Next Order: Jan 15 recommended       │ │
│  │                                 │    │                                         │ │
│  │ Changes                         │    │   💰 Cost Optimization:                │ │
│  │   12│     ●                     │    │   Current: $47.32/month                │ │
│  │   10│   ●   ●   ●               │    │   Optimized: $38.99/month              │ │
│  │    8│ ●   ●   ●   ●   ●         │    │   Potential savings: $100/year         │ │
│  │    6│                           │    │                                         │ │
│  │    4│                           │    │   [🛍️ View Options] [📅 Set Reminder]  │ │
│  │    0└─────────────────────────── │    │                                         │ │
│  │     Mon Tue Wed Thu Fri Sat Sun │    └─────────────────────────────────────────┘ │
│  └─────────────────────────────────┘                                              │ │
│                                                                                     │ │
│  ┌─────────────────────────────────────────────────────────────────────────────┐   │ │
│  │                           💡 Daily Pattern Analysis                         │   │ │ ← Full-width section
│  │                                                                             │   │ │
│  │  Peak Hours: 7-9am (34%) | 2-4pm (28%) | 8-10pm (31%)                    │   │ │
│  │                                                                             │   │ │
│  │  Changes                                                                    │   │ │
│  │    3 │    ██                    ██    ██                                   │   │ │
│  │    2 │ ██ ██ ██          ██ ██ ██ ██ ██ ██                               │   │ │
│  │    1 │ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██ ██                               │   │ │
│  │    0 └───────────────────────────────────────────────────────────────── │   │ │
│  │       6  8 10 12  2  4  6  8 10 12  2  4  (hours)                       │   │ │
│  │                                                                             │   │ │
│  │  Weekend usage 15% higher (normal for baby's age) • All patterns healthy  │   │ │
│  └─────────────────────────────────────────────────────────────────────────────┘   │ │
│                                                             [FAB] [📊]           │
├─────────────────────────────────────────────────────────────────────────────────────┤
│              [[HOME]]                    [[ANALYTICS]]●                  [[SETTINGS]]                  │
│              Home                       Analytics                    Settings                │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Accessibility Implementation

### Screen Reader Optimizations for Data

**Chart Accessibility Labels**:
```typescript
// Usage trend chart accessibility
<VictoryChart
  accessibilityLabel="Usage trend chart showing 7 days of diaper changes"
  accessibilityDescription="Line chart with daily change counts from Monday to Sunday. Monday: 9 changes, Tuesday: 8 changes, Wednesday: 7 changes, Thursday: 9 changes, Friday: 8 changes, Saturday: 10 changes, Sunday: 8 changes. Overall trend is stable with slight weekend increase."
>
  <VictoryLine 
    data={chartData}
    accessibilityLabel="Daily change data"
  />
</VictoryChart>

// Metric cards accessibility
<View
  accessibilityRole="text"
  accessibilityLabel="Average daily changes: 8.2. This is excellent consistency at 92% regularity, which is normal for an 8-week-old baby."
>
  {metricCard}
</View>
```

### Voice Navigation Support

**Voice-Friendly Navigation**:
- "Show usage trends" → Navigate to detailed charts
- "What are my predictions?" → Open predictions screen  
- "Export report for doctor" → Launch healthcare export
- "How much am I spending?" → Show cost analysis
- "Compare with other babies" → Show normalization data

### Focus Management for Complex Data

**Logical Tab Order**:
1. Time range selectors (7d, 30d, 90d, 1y)
2. Main chart area (with voice description)
3. Key metric cards (left to right, top to bottom)
4. Action buttons (View Details, Export, etc.)
5. Secondary insights sections
6. FAB for additional actions

This comprehensive screen state documentation provides exact specifications for implementing analytics dashboard screens with psychological methodology, ensuring optimal data presentation for stressed Canadian parents while maintaining technical excellence through Victory Charts integration and strict privacy compliance.