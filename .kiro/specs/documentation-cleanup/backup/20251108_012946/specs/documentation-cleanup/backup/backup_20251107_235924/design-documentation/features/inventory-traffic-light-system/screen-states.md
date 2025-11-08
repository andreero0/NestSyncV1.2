---
title: Screen States and Visual Hierarchy Specification
description: Complete visual design specifications for all inventory traffic light card states with psychology-driven hierarchy
feature: inventory-traffic-light-system
last-updated: 2025-01-22
version: 1.0.0
related-files:
  - README.md
  - psychology-messaging.md
  - accessibility.md
  - implementation.md
dependencies:
  - StatusOverviewCard component
  - NestSync color system
  - Theme context integration
status: draft
---

# Screen States and Visual Hierarchy Specification

## Overview

This document provides complete visual design specifications for the enhanced inventory traffic light cards, prioritizing days-remaining information over raw quantities and implementing psychology-driven visual hierarchy for stressed Canadian parents.

## Table of Contents

1. [Visual Hierarchy Transformation](#visual-hierarchy-transformation)
2. [Card Layout Specifications](#card-layout-specifications)
3. [Typography System](#typography-system)
4. [Color Psychology Application](#color-psychology-application)
5. [State-Specific Designs](#state-specific-designs)
6. [Responsive Behavior](#responsive-behavior)
7. [Animation and Transitions](#animation-and-transitions)

## Visual Hierarchy Transformation

### Current vs. New Hierarchy

#### Current Implementation (Quantity-Focused)
```
┌─────────────────────────────────┐
│  [Icon: 32px]                   │
│                                 │
│        "24"                     │ ← Prominent (36px bold)
│   Critical Items                │ ← Secondary (14px)
│                                 │
└─────────────────────────────────┘
```

#### New Implementation (Days-Focused)
```
┌─────────────────────────────────┐
│  [Icon: 32px]                   │
│                                 │
│      "3 days left"              │ ← Primary (30px bold)
│   Time to restock soon          │ ← Message (13px supportive)
│   (24 diapers remaining)        │ ← Context (11px muted)
│                                 │
└─────────────────────────────────┘
```

### Information Priority Restructure

#### Priority Level 1: Days Remaining (Primary Metric)
- **Size**: 30px bold
- **Color**: Theme text emphasis color
- **Purpose**: Immediate comprehension of time remaining
- **Examples**: "3 days left", "1 week left", "Help coming"

#### Priority Level 2: Psychology-Driven Message (Action Guidance)
- **Size**: 13px medium
- **Color**: Status-appropriate supportive color
- **Purpose**: Stress reduction and action guidance
- **Examples**: "Time to restock soon", "You're all set!"

#### Priority Level 3: Quantity Context (Supporting Detail)
- **Size**: 11px regular
- **Color**: Muted text color
- **Purpose**: Provide warehouse context without overwhelming
- **Examples**: "(24 diapers remaining)", "(3 packages)"

## Card Layout Specifications

### Base Card Dimensions
- **Width**: 160px (unchanged for layout consistency)
- **Height**: 120px (unchanged for layout consistency)
- **Border Radius**: 12px
- **Border Width**: 3px (status-colored)
- **Internal Padding**: 12px vertical, 8px horizontal

### Enhanced Content Layout
```
┌─────────────────────────────────┐ ← 160px width
│ ┌─ Icon Container (32x32) ─┐   │ ← 12px top padding
│ │     [Status Icon]          │   │
│ └───────────────────────────┘   │
│                                 │ ← 8px spacing
│     "3 days left"               │ ← Primary text (30px)
│                                 │ ← 4px spacing
│   Time to restock soon          │ ← Message text (13px)
│                                 │ ← 2px spacing
│  (24 diapers remaining)         │ ← Context text (11px)
│                                 │ ← 12px bottom padding
└─────────────────────────────────┘ ← 120px height
```

### Spacing System
- **Icon to Primary**: 8px
- **Primary to Message**: 4px
- **Message to Context**: 2px
- **Container Padding**: 12px vertical, 8px horizontal
- **Minimum Touch Target**: 44x44px (already exceeded at 160x120px)

## Typography System

### Primary Text (Days Remaining)
```css
font-size: 30px
font-weight: 700 (bold)
line-height: 32px
letter-spacing: -0.02em
text-align: center
color: theme.colors.textEmphasis
```

### Message Text (Psychology-Driven)
```css
font-size: 13px
font-weight: 500 (medium)
line-height: 16px
letter-spacing: 0
text-align: center
color: status-specific supportive color
```

### Context Text (Quantity Detail)
```css
font-size: 11px
font-weight: 400 (regular)
line-height: 13px
letter-spacing: 0.01em
text-align: center
color: theme.colors.textMuted
opacity: 0.8
```

### Typography Responsive Behavior
- **Large Text Settings**: Scale up proportionally while maintaining hierarchy
- **Small Text Settings**: Maintain minimum 11px for readability
- **Dynamic Type (iOS)**: Support system text size preferences
- **Line Height**: Automatic adjustment to prevent text clipping

## Color Psychology Application

### Critical Status (Red) - Supportive Urgency
```css
Border: #DC2626 (Critical Red)
Background: rgba(220, 38, 38, 0.05) light / rgba(220, 38, 38, 0.1) dark
Icon: #DC2626
Primary Text: theme.colors.textEmphasis
Message Text: #DC2626 (matching border for emphasis)
Context Text: theme.colors.textMuted
```

### Low Status (Amber) - Planning Mindset
```css
Border: #D97706 (Amber)
Background: rgba(217, 119, 6, 0.05) light / rgba(217, 119, 6, 0.1) dark
Icon: #D97706
Primary Text: theme.colors.textEmphasis
Message Text: #D97706 (warm, encouraging)
Context Text: theme.colors.textMuted
```

### Good Status (Green) - Confidence Building
```css
Border: #059669 (Confidence Green)
Background: rgba(5, 150, 105, 0.05) light / rgba(5, 150, 105, 0.1) dark
Icon: #059669
Primary Text: theme.colors.textEmphasis
Message Text: #059669 (calming, positive)
Context Text: theme.colors.textMuted
```

### Pending Status (Blue) - Hope and Trust
```css
Border: #0891B2 (Hope Blue)
Background: rgba(8, 145, 178, 0.05) light / rgba(8, 145, 178, 0.1) dark
Icon: #0891B2
Primary Text: theme.colors.textEmphasis
Message Text: #0891B2 (trustworthy, supportive)
Context Text: theme.colors.textMuted
```

## State-Specific Designs

### Critical Status - "3 days left"

#### Visual Design
```
┌─────────────────────────────────┐
│  [!] (Critical icon, red)       │
│                                 │
│       "3 days left"             │ ← 30px bold, theme emphasis
│    Time to restock soon         │ ← 13px medium, #DC2626
│   (24 diapers remaining)        │ ← 11px regular, muted
│                                 │
└─────────────────────────────────┘
Border: 3px solid #DC2626
Background: rgba(220, 38, 38, 0.05)
```

#### Psychology Implementation
- **Urgency Without Panic**: Red conveys importance without alarm
- **Clear Timeline**: "3 days left" provides specific planning window
- **Supportive Action**: "Time to restock soon" suggests preparation
- **Context Available**: Quantity shown but not prominent

#### Edge Cases
```
Out of Stock:
Primary: "Out of diapers"
Message: "Time to restock now"
Context: "(0 diapers remaining)"

Same Day:
Primary: "Today"
Message: "Quick trip needed"
Context: "(few diapers left)"
```

### Low Status - "6 days left"

#### Visual Design
```
┌─────────────────────────────────┐
│  [⏰] (Clock icon, amber)        │
│                                 │
│       "6 days left"             │ ← 30px bold, theme emphasis
│     Plan your next trip         │ ← 13px medium, #D97706
│   (48 diapers remaining)        │ ← 11px regular, muted
│                                 │
└─────────────────────────────────┘
Border: 3px solid #D97706
Background: rgba(217, 119, 6, 0.05)
```

#### Psychology Implementation
- **Planning Confidence**: Amber suggests preparation time available
- **Specific Timeline**: "6 days left" enables strategic planning
- **Encouraging Action**: "Plan your next trip" empowers parents
- **Quantity Context**: Shows sufficient stock for confidence

#### Variations
```
Weekend Planning (Friday):
Primary: "6 days left"
Message: "Perfect for weekend shop"
Context: "(48 diapers remaining)"

Weekday Planning:
Primary: "5 days left"
Message: "Great time to plan ahead"
Context: "(40 diapers remaining)"
```

### Good Status - "12 days left"

#### Visual Design
```
┌─────────────────────────────────┐
│  [✓] (Checkmark icon, green)    │
│                                 │
│      "12 days left"             │ ← 30px bold, theme emphasis
│      You're all set!            │ ← 13px medium, #059669
│   (96 diapers remaining)        │ ← 11px regular, muted
│                                 │
└─────────────────────────────────┘
Border: 3px solid #059669
Background: rgba(5, 150, 105, 0.05)
```

#### Psychology Implementation
- **Peace of Mind**: Green conveys safety and preparedness
- **Confidence Building**: "You're all set!" affirms parental capability
- **Relaxation Enabled**: Removes planning stress
- **Abundance Context**: Higher quantity reinforces security

#### Confidence Variations
```
Very Well Stocked (15+ days):
Primary: "15+ days left"
Message: "Beautifully prepared!"
Context: "(120+ diapers remaining)"

Moderately Stocked (8-14 days):
Primary: "10 days left"
Message: "You're all set!"
Context: "(80 diapers remaining)"
```

### Pending Status - "Help coming"

#### Visual Design
```
┌─────────────────────────────────┐
│  [📦] (Package icon, blue)       │
│                                 │
│       "Help coming"             │ ← 30px bold, theme emphasis
│      Order on the way           │ ← 13px medium, #0891B2
│   (Delivery expected soon)      │ ← 11px regular, muted
│                                 │
└─────────────────────────────────┘
Border: 3px solid #0891B2
Background: rgba(8, 145, 178, 0.05)
```

#### Psychology Implementation
- **Hope and Support**: Blue conveys trust and incoming help
- **Emotional Support**: "Help coming" provides reassurance
- **Delivery Confidence**: Focuses on solution rather than problem
- **Timeline Context**: "Soon" without specific pressure

#### Delivery Variations
```
Recent Order:
Primary: "Help coming"
Message: "Order on the way"
Context: "(Delivery expected soon)"

Multiple Orders:
Primary: "Help coming"
Message: "Orders arriving"
Context: "(Multiple deliveries)"

Urgent Delivery:
Primary: "Help coming"
Message: "Express delivery"
Context: "(Arriving today)"
```

## Responsive Behavior

### Large Screens (Tablet, Wide Phones)
- **Card Dimensions**: 160x120px (unchanged)
- **Typography**: Full size specifications
- **Content**: Complete hierarchy with all text elements
- **Spacing**: Standard 12px/8px padding system

### Standard Screens (Most Phones)
- **Card Dimensions**: 160x120px (unchanged)
- **Typography**: Standard size specifications
- **Content**: Complete hierarchy optimized for readability
- **Spacing**: Standard padding maintained

### Small/Compact Screens
- **Card Dimensions**: 160x120px (maintain touch targets)
- **Typography**: Minimum readable sizes enforced
- **Content**: Prioritize essential information
- **Spacing**: Optimized for content fit

### Accessibility Scaling
- **Large Text Mode**: Typography scales up proportionally
- **Dynamic Type**: iOS system text size support
- **High Contrast**: Enhanced color contrast ratios
- **Reduced Motion**: Static states without animations

## Animation and Transitions

### Card State Transitions
```css
transition: all 0.3s cubic-bezier(0.4, 0, 0.6, 1)
```

### Loading States
```
Loading Animation:
- Skeleton placeholder for text elements
- Subtle pulse animation on card background
- Icon remains static for visual anchor

Data Update:
- Gentle fade transition for text changes
- Color transition for status changes
- Maintain card position stability
```

### Interactive States

#### Hover State (Web/Desktop)
```css
transform: translateY(-2px)
box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
border-color: enhanced status color
```

#### Pressed State (Mobile)
```css
transform: scale(0.98)
opacity: 0.8
```

#### Focus State (Accessibility)
```css
outline: 3px solid theme.colors.focus
outline-offset: 2px
```

### Content Animation
- **Text Changes**: Crossfade transition (200ms)
- **Number Updates**: Count-up animation for increases
- **Status Changes**: Color transition (300ms)
- **Icon Changes**: Fade and scale transition

## Quality Assurance

### Visual Hierarchy Validation
- [ ] Days remaining is most prominent visual element
- [ ] Psychology message clearly visible and supportive
- [ ] Quantity context present but not overwhelming
- [ ] Status colors convey appropriate psychology

### Readability Testing
- [ ] All text readable in both light and dark themes
- [ ] Contrast ratios meet WCAG AAA standards (7:1)
- [ ] Typography scales appropriately with system settings
- [ ] Content fits within card boundaries at all scales

### Psychology Effectiveness
- [ ] Visual hierarchy reduces cognitive load
- [ ] Colors convey appropriate emotional response
- [ ] Messaging builds confidence rather than anxiety
- [ ] Canadian cultural context feels natural

### Technical Implementation
- [ ] All responsive breakpoints handled correctly
- [ ] Animation performance maintains 60fps
- [ ] Accessibility features fully functional
- [ ] Cross-platform consistency verified

## Implementation Notes

### Component Structure Enhancement
```typescript
interface EnhancedStatusOverviewCardProps {
  // Existing props maintained
  statusType: 'critical' | 'low' | 'stocked' | 'pending';
  title: string;
  count: number;

  // New psychology-driven props
  daysRemaining?: number;
  psychologyMessage: string;
  quantityContext: string;

  // Enhanced accessibility
  detailedAccessibilityLabel: string;
  contextualHint: string;
}
```

### Developer Handoff Requirements
- Typography system integration with existing theme
- Color psychology implementation within NestSync palette
- Animation system compatible with React Native Reanimated
- Accessibility compliance with iOS VoiceOver and Android TalkBack

## Last Updated

2025-01-22 - Complete visual hierarchy specification with psychology-driven design implementation and responsive behavior guidelines