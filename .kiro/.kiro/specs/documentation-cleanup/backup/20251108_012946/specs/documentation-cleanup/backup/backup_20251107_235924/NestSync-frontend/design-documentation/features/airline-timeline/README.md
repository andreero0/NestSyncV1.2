---
title: Airline-Style Timeline Page Design
description: Comprehensive design system for vertical timeline with time machine scrolling animation
feature: airline-timeline
last-updated: 2025-09-11
version: 1.0.0
related-files: 
  - ../../design-system/style-guide.md
  - ./user-journey.md
  - ./component-specifications.md
  - ./interaction-design.md
  - ./implementation-guide.md
dependencies:
  - NestSync Design System
  - Psychology-driven UX principles
  - Traffic Light Status System
status: design
---

# Airline-Style Timeline Page Design

## Overview

The Airline-Style Timeline page transforms diaper management history into an intuitive, airport departure board-inspired interface. This design leverages familiar airline UX patterns while maintaining NestSync's psychology-driven design principles for stressed Canadian parents.

## Design Philosophy Integration

This timeline design builds upon NestSync's core principles:

- **Airline Recognition Patterns**: Familiar vertical layout with central timeline axis like flight status boards
- **Psychology-Driven Color Theory**: Traffic light system (red/amber/green) for instant status recognition
- **Stress-Reduction**: Smooth, calming animations with physics-based momentum scrolling
- **Canadian Trust Elements**: Cultural context and PIPEDA compliance messaging
- **Enhanced Accessibility**: 7:1 contrast ratios for tired parent usability

## Key Design Goals

### 1. Time Machine Navigation
- **Smooth momentum scrolling** with physics-based deceleration
- **Snap-to-event functionality** for precision navigation
- **Current time indicator** showing real-time "now" position
- **Time period headers** (Today, Yesterday, This Week, Last Month)

### 2. Airline-Inspired Visual Hierarchy
- **Central timeline axis** with professional departure board aesthetics
- **Event cards** positioned alternately left/right of timeline
- **Visual connectors** linking cards to timeline with clean lines
- **Status indicators** using familiar airline iconography adapted for diaper management

### 3. Psychology-Driven Event Categories

#### Diaper Changes (Success Green #059669)
- **Visual Treatment**: Clean checkmark icons with Success Green background
- **Card Content**: Time, size, notes, location context
- **Psychological Impact**: Builds confidence through completion visualization

#### Inventory Updates (Primary Blue #0891B2)  
- **Visual Treatment**: Cube/box icons with Primary Blue background
- **Card Content**: Items added/removed, quantities, source (purchase/delivery)
- **Psychological Impact**: Trust and reliability through institutional blue

#### Size Changes (Accent Orange #EA580C)
- **Visual Treatment**: Growth arrow icons with Orange background
- **Card Content**: Previous size → new size, date predicted vs actual
- **Psychological Impact**: Progress celebration without alarm

#### Feeding Events (Secondary Green #059669)
- **Visual Treatment**: Bottle/breast icons with gentle green tones
- **Card Content**: Time, type, duration, notes
- **Psychological Impact**: Nurturing associations through soft greens

## Timeline Components

### 1. Timeline Axis
**Visual Specifications**:
- **Width**: 4px central line using Primary Blue (#0891B2)
- **Height**: Full scroll height with subtle gradient fade at edges
- **Time Markers**: Every 2 hours with 12px/16px typography
- **Current Time Indicator**: Pulsing 16px circle with Primary Blue background

**Responsive Behavior**:
- Mobile: 3px width, simplified time markers
- Tablet: 4px width, standard markers
- Desktop: 5px width, enhanced markers with more detail

### 2. Event Cards
**Base Card Specifications**:
- **Dimensions**: 280px width × 88px height (mobile), scales proportionally
- **Corner Radius**: 12px (following NestSync standard)
- **Drop Shadow**: `0 4px 12px rgba(0,0,0,0.1)` for gentle elevation
- **Internal Padding**: 16px all sides (2 × base spacing unit)

**Card Positioning**:
- **Left Cards**: Right edge aligns to timeline axis minus 8px gap
- **Right Cards**: Left edge aligns to timeline axis plus 8px gap
- **Vertical Spacing**: 24px between cards (3 × base spacing unit)

**Connection Lines**:
- **Width**: 2px using card's background color at 60% opacity
- **Length**: 8px horizontal connection to timeline axis
- **Style**: Straight line with subtle anti-aliasing

### 3. Time Period Headers
**Visual Treatment**:
- **Background**: Neutral-100 (#F3F4F6) with subtle top border
- **Typography**: H5 style (18px/24px, 500 weight)
- **Positioning**: Sticky headers that remain visible during scroll
- **Spacing**: 32px top margin, 16px bottom margin

## Time Machine Scrolling Mechanics

### Physics-Based Momentum
**Scroll Behavior**:
- **Deceleration Curve**: `cubic-bezier(0.25, 0.46, 0.45, 0.94)` for natural feel
- **Momentum Duration**: 1.2-2.5 seconds based on initial velocity
- **Bounce Effect**: Subtle 5% overscroll with spring-back animation

### Snap-to-Event Functionality
**Trigger Conditions**:
- Scroll velocity drops below 50px/second
- User stops active scrolling for 300ms
- Manual tap on timeline area

**Snap Animation**:
- **Duration**: 400ms using ease-out timing
- **Target**: Nearest significant event or time marker
- **Visual Feedback**: Brief highlight of target event card

### Current Time Indicator
**Visual Design**:
- **Shape**: 16px circle with 2px border
- **Colors**: Primary Blue background, white border
- **Animation**: Gentle pulse every 2 seconds (0.95-1.05 scale)
- **Position**: Always visible, follows current time precisely

## Accessibility Excellence

### Enhanced WCAG AAA Compliance
**Contrast Ratios** (exceeding standard requirements):
- **Event Cards**: 8.2:1 minimum for all text on colored backgrounds
- **Timeline Markers**: 9.1:1 for time labels
- **Status Icons**: 7.5:1 minimum with alternative text descriptions

**Keyboard Navigation**:
- **Tab Order**: Timeline axis → Current time → Events chronologically
- **Arrow Keys**: Navigate between events with 200ms transition
- **Space/Enter**: Expand event cards for full details
- **Escape**: Return to timeline overview

**Screen Reader Support**:
- **Timeline Role**: `role="timeline"` with appropriate ARIA labels
- **Event Cards**: `role="article"` with descriptive time and action labels
- **Live Region**: Announces current time position during scroll
- **Alternative Navigation**: Skip links for efficient timeline browsing

### Touch Accessibility
**Touch Targets**:
- **Minimum Size**: 44×44px for all interactive elements
- **Event Cards**: Full card area tappable (280×88px minimum)
- **Timeline Markers**: 60×44px touch areas around markers
- **Scroll Handle**: Optional 48×48px drag handle for precise positioning

## Canadian Context Integration

### Cultural Sensitivity
**Timezone Awareness**:
- **Primary**: Eastern Time (Toronto) with automatic DST handling
- **Secondary**: Show local time for users in other Canadian provinces
- **Format**: 12-hour clock with AM/PM indicators

**Trust Elements**:
- **Privacy Indicator**: Subtle "Data stored in Canada" footer text
- **Cultural Icons**: Maple leaf accents in success celebrations (sparingly)
- **Supportive Microcopy**: Canadian politeness in error messages

### PIPEDA Compliance Messaging
**Privacy-First Design**:
- **Data Retention**: Clear indicators of timeline data retention policies
- **Export Options**: "Download your timeline" with clear Canadian privacy notice
- **Sharing Controls**: Granular permissions for timeline data sharing

## Animation & Motion Design

### Stress-Reducing Animation Principles
**Entry Animations**:
- **Timeline Axis**: Draws upward over 600ms with ease-out timing
- **Event Cards**: Stagger in from timeline axis, 100ms delay between cards
- **Headers**: Fade in after timeline is complete

**Interaction Feedback**:
- **Card Tap**: Gentle scale (0.98x) with 150ms duration
- **Scroll Start**: Subtle timeline axis brightening
- **Event Focus**: Soft glow effect using card's accent color

**Exit Animations**:
- **Scroll Away**: Smooth fade-out for off-screen elements
- **Navigation Away**: Timeline axis fades last for continuity

### Performance Optimization
**Hardware Acceleration**:
- All animations use `transform` and `opacity` properties only
- Maximum 60fps frame rate maintained
- Reduced motion respected via `prefers-reduced-motion` media query

## Integration with Existing Design System

### Color System Utilization
**Primary Applications**:
- Timeline axis and markers: Primary Blue (#0891B2)
- Success events: Success Green (#059669)
- Warning events: Amber (#D97706)
- Critical events: Critical Red (#DC2626)

**Background Treatments**:
- Card backgrounds: Neutral-50 (#F9FAFB) with colored accent bars
- Timeline background: Neutral-100 (#F3F4F6) gradient
- Active area: Primary Light (#E0F2FE) subtle highlighting

### Typography Integration
**Hierarchy Application**:
- **Event Titles**: H4 style (20px/28px, 500 weight)
- **Event Details**: Body style (16px/24px, 400 weight)
- **Time Stamps**: Body Small (14px/20px, 400 weight)
- **Time Headers**: H5 style (18px/24px, 500 weight)

### Spacing System Compliance
**All measurements derive from 8px base unit**:
- Card internal padding: 16px (2 × base)
- Card vertical spacing: 24px (3 × base)  
- Timeline axis gaps: 8px (1 × base)
- Section margins: 32px (4 × base)

## Next Steps

1. **[User Journey Design](./user-journey.md)** - Complete user flow analysis
2. **[Component Specifications](./component-specifications.md)** - Detailed component documentation
3. **[Interaction Design](./interaction-design.md)** - Animation and interaction specifications
4. **[Implementation Guide](./implementation-guide.md)** - React Native development guidance

## Quality Assurance Requirements

### Design System Compliance
- [ ] All colors match NestSync palette with proper contrast ratios
- [ ] Typography follows established hierarchy and scale  
- [ ] Spacing uses 8px systematic scale consistently
- [ ] Motion follows stress-reducing timing and easing standards

### User Experience Validation
- [ ] Timeline navigation intuitive for sleep-deprived parents
- [ ] Event categorization immediately recognizable
- [ ] Time machine scrolling feels natural and controlled
- [ ] Current time indicator always visible and clear
- [ ] Historical context preserved while emphasizing recent events

### Accessibility Excellence
- [ ] WCAG AAA compliance verified (7:1+ contrast ratios)
- [ ] Keyboard navigation complete and efficient
- [ ] Screen reader experience optimized for timeline structure
- [ ] Touch targets exceed minimum requirements
- [ ] Reduced motion alternatives implemented

## Last Updated
2025-09-11 - Initial airline-style timeline design specifications created