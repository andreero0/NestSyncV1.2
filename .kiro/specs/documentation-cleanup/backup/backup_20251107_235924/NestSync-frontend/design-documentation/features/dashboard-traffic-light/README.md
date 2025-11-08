# Dashboard Traffic Light System - Feature Design Overview

## Feature Summary

The Dashboard Traffic Light System transforms NestSync's basic 3-metric display into a psychology-driven 4-card status overview system. This feature uses universal traffic light recognition patterns to provide instant inventory status comprehension for sleep-deprived Canadian parents.

## Current State vs Target State

### Current Implementation
- Simple 3-metric display: "Days of Cover: 12, Diapers Left: 24, Today: 5"
- Basic numerical information without visual hierarchy
- No immediate status recognition or stress-reduction elements

### Target Implementation
- **4-card visual status system** with traffic light psychology
- **Instant recognition** through color-coded status indicators
- **Supportive messaging** that builds confidence rather than creates alarm
- **Responsive grid layout** optimized for mobile and tablet viewing

## User Experience Goals

### Primary Objectives
1. **Reduce Cognitive Load**: Instant visual status recognition without requiring number interpretation
2. **Stress Reduction**: Calming color psychology and supportive messaging
3. **Confidence Building**: Clear action guidance and reassuring status indicators
4. **Canadian Context**: Trust indicators and cultural sensitivity

### Success Metrics
- **Recognition Speed**: <2 seconds to understand inventory status
- **Stress Reduction**: Calming colors reduce anxiety compared to traditional red/yellow/green systems
- **Action Clarity**: Users understand next steps from card content alone
- **Accessibility Compliance**: All status information available to screen readers and color-blind users

## Card System Overview

### Critical Items Card
- **Border Color**: `#DC2626` (Critical Red)
- **Purpose**: Items with ≤3 days remaining
- **Psychology**: Urgent but not alarming, warm red that suggests action needed
- **Messaging**: "Items need attention soon" (supportive, not panicked)
- **Icon**: Alert triangle with exclamation (not harsh warning symbols)

### Low Stock Card
- **Border Color**: `#D97706` (Low Stock Amber)
- **Purpose**: Items with 4-7 days remaining
- **Psychology**: Attention without panic, warm amber that suggests planning
- **Messaging**: "Plan to restock these items" (proactive planning approach)
- **Icon**: Clock or calendar (time-based planning cue)

### Well Stocked Card
- **Border Color**: `#059669` (Well Stocked Green)
- **Purpose**: Items with >7 days remaining
- **Psychology**: Reassurance and calm, medical/wellness green
- **Messaging**: "You're prepared!" (confidence building)
- **Icon**: Checkmark or heart (positive affirmation symbols)

### Pending Orders Card
- **Border Color**: `#0891B2` (Pending Orders Blue)
- **Purpose**: Incoming inventory tracking
- **Psychology**: Hope and progress, trust-building institutional blue
- **Messaging**: "Help is on the way" (reassuring, support incoming)
- **Icon**: Package or delivery truck (clear fulfillment context)

## Design Specifications

### Visual Hierarchy
1. **Card Count** (largest element): 48px/56px bold typography
2. **Card Title** (secondary): 16px/24px medium weight
3. **Status Message** (tertiary): 14px/20px regular weight
4. **Icon** (supporting): 24×24px with 8px margin from text

### Card Dimensions
- **Mobile**: 156×120px per card (2×2 grid with 16px gutters)
- **Tablet**: 180×120px per card (4×1 horizontal layout with 24px gutters)
- **Desktop**: 200×140px per card (4×1 horizontal layout with 24px gutters)

### Spacing & Padding
- **Internal Padding**: 16px all sides (mobile), 20px all sides (tablet+)
- **Card Gutters**: 16px (mobile), 24px (tablet+)
- **Border Width**: 3px solid color (status indicator)
- **Border Radius**: 12px (modern, approachable feeling)

### Responsive Behavior

#### Mobile Layout (320-767px)
- **Grid**: 2×2 layout
- **Card Order**: Critical (top-left), Low Stock (top-right), Well Stocked (bottom-left), Pending (bottom-right)
- **Spacing**: 16px container padding, 16px card gutters
- **Touch Targets**: Full card clickable (minimum 44×44px compliance)

#### Tablet Layout (768-1023px)
- **Grid**: 4×1 horizontal layout
- **Card Order**: Critical, Low Stock, Well Stocked, Pending (left to right)
- **Spacing**: 32px container padding, 24px card gutters
- **Interaction**: Hover states enabled for hybrid devices

#### Desktop Layout (1024px+)
- **Grid**: 4×1 horizontal layout with enhanced spacing
- **Card Order**: Same as tablet
- **Spacing**: 48px container padding, 24px card gutters
- **Enhanced States**: Full hover/focus interaction support

## Implementation References

### Related Design System Components
- [Style Guide](../../design-system/style-guide.md) - Complete color and typography specifications
- [Color Palette](../../design-system/tokens/colors.md) - Traffic light color psychology
- [Component Library](../../design-system/components/README.md) - Reusable component patterns

### Technical Integration
- **Theme Context**: Seamless integration with `contexts/ThemeContext.tsx`
- **Color System**: Uses established `constants/Colors.ts` psychology-driven palette
- **Component Architecture**: Compatible with existing React Native component patterns
- **TypeScript**: Full type safety with defined interfaces

### Accessibility Requirements
- **WCAG AAA Compliance**: 7:1 contrast ratios for all text/background combinations
- **Screen Reader Support**: Comprehensive ARIA labels and semantic structure
- **Keyboard Navigation**: Logical tab order and keyboard interaction support
- **Color Independence**: Status never communicated by color alone (icons + text + borders)
- **Touch Targets**: Minimum 44×44px with proper spacing

## Development Priorities

### Phase 1: Core Component Development
1. StatusOverviewCard component with all variants
2. Responsive grid system implementation
3. Basic interaction states (default, pressed)

### Phase 2: Enhanced UX Polish
1. Micro-animations for status changes
2. Loading states for real-time updates
3. Enhanced accessibility features

### Phase 3: Advanced Features
1. Card tap interactions for detailed views
2. Animation choreography for status transitions
3. Performance optimization and testing

## Quality Assurance Standards

### Design Verification
- [ ] Colors match traffic light psychology specifications
- [ ] Typography hierarchy supports quick scanning
- [ ] Spacing follows 8px base unit system
- [ ] Responsive layouts function across all breakpoints
- [ ] Canadian trust elements appropriately integrated

### Accessibility Testing
- [ ] Screen reader navigation optimized
- [ ] Color contrast ratios verified (7:1 minimum)
- [ ] Keyboard interaction complete
- [ ] Touch target sizes verified
- [ ] Reduced motion preferences respected

### User Experience Validation
- [ ] Recognition speed <2 seconds measured
- [ ] Stress-reduction messaging validated
- [ ] Cultural sensitivity verified for Canadian context
- [ ] Confidence-building tone confirmed

## Last Updated
2025-09-10 - Feature design overview and specifications established