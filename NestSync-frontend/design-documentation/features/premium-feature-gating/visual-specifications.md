---
title: Visual Specifications & Design System Integration
description: Detailed visual hierarchy, component specifications, and design system integration
feature: premium-feature-gating
last-updated: 2025-01-09
version: 1.0.0
related-files: 
  - README.md
  - technical-implementation.md
  - user-journey.md
  - integration-strategy.md
dependencies:
  - ../../design-system/style-guide.md
  - NestSync existing design system
status: approved
---

# Visual Specifications & Design System Integration

## Overview

This document provides comprehensive visual specifications for premium feature gating components, ensuring seamless integration with NestSync's existing psychology-driven design system while maintaining stress-reduction focus for Canadian parents.

## Table of Contents

1. [Design System Foundation](#design-system-foundation)
2. [Premium Color Palette](#premium-color-palette)
3. [Typography Hierarchy](#typography-hierarchy)
4. [Component Specifications](#component-specifications)
5. [BlurView Visual Treatment](#blurview-visual-treatment)
6. [Responsive Design Guidelines](#responsive-design-guidelines)
7. [Accessibility Standards](#accessibility-standards)
8. [Animation Specifications](#animation-specifications)

## Design System Foundation

### Integration with Existing NestSync Design

**Base Design Tokens**
- Primary Blue: `#0891B2` (existing NestSync brand color)
- Background: `#FFFFFF` and `#F9FAFB` (existing neutrals)
- Text Hierarchy: `#1F2937`, `#374151`, `#6B7280` (existing grays)
- Border Radius: `12px` (consistent with existing components)
- Spacing Scale: `4px` base unit (existing spacing system)

**Enhanced Premium Additions**
- Premium Accent Green: `#10B981` (calming, positive growth)
- Premium Blue Light: `#E0F7FA` (subtle premium backgrounds)
- Gentle Warning: `#F59E0B` (warm, non-aggressive attention)
- Canadian Flag Red: `#FF0000` (cultural compliance indicators)

### Visual Hierarchy Principles

**Priority 1: Stress Reduction**
- Generous whitespace (minimum 16px between premium elements)
- Soft shadows and subtle elevation
- Calming color combinations
- Clear visual separation between free and premium

**Priority 2: Canadian Trust**
- Canadian flag integration (16x12px consistent sizing)
- PIPEDA compliance visual indicators
- Transparent pricing displays
- No aggressive sales colors (avoid reds for CTAs)

**Priority 3: Family Focus**
- Family-friendly iconography
- Supportive visual metaphors
- Parent-empowerment visual language
- Child-safe aesthetic choices

## Premium Color Palette

### Primary Colors

**Premium Accent Blue**
- Hex: `#0891B2`
- Usage: Premium badges, primary CTAs, brand elements
- Accessibility: 4.5:1 contrast on white background
- Psychology: Trust, reliability, Canadian professional services

**Premium Growth Green**
- Hex: `#10B981`
- Usage: Success states, premium benefits, positive actions
- Accessibility: 4.5:1 contrast on white background  
- Psychology: Growth, prosperity, family health

**Premium Light Blue**
- Hex: `#E0F7FA`
- Usage: Premium content background tints, subtle highlights
- Accessibility: Sufficient contrast for background use
- Psychology: Calm, spacious, breathing room

### Secondary Colors

**Gentle Warning Amber**
- Hex: `#F59E0B`
- Usage: Gentle attention, non-aggressive notifications
- Accessibility: 4.5:1 contrast on white background
- Psychology: Warmth, attention without stress

**Canadian Compliance Red**
- Hex: `#DC2626` 
- Usage: Canadian flag only, compliance indicators
- Accessibility: 7:1 contrast on white background
- Psychology: National identity, trust, regulation compliance

**Neutral Premium Grays**
- Light: `#F3F4F6` (background tints)
- Medium: `#9CA3AF` (supporting text)
- Dark: `#374151` (primary premium text)

### Semantic Colors

**Success Premium**
- Hex: `#059669`
- Usage: Successful subscription, premium activation
- Accessibility: AAA compliant contrast ratios

**Information Premium**
- Hex: `#0369A1`
- Usage: Premium feature explanations, help text
- Accessibility: AAA compliant contrast ratios

**Warning Premium (Soft)**
- Hex: `#D97706`
- Usage: Premium trial expiration, gentle reminders
- Accessibility: AAA compliant contrast ratios

## Typography Hierarchy

### Premium-Specific Typography Scale

**Premium Badge Text**
```
Font: Inter-SemiBold
Size: 12px
Line Height: 16px
Letter Spacing: 0.5px
Color: #0891B2
Transform: UPPERCASE
Usage: "COMING SOON FOR PREMIUM"
```

**Premium Feature Titles**
```
Font: Inter-SemiBold
Size: 18px
Line Height: 24px
Letter Spacing: -0.2px
Color: #1F2937
Usage: "Track Everything Your Family Needs"
```

**Premium Value Propositions**
```
Font: Inter-Medium
Size: 16px
Line Height: 24px
Letter Spacing: 0px
Color: #374151
Usage: Feature descriptions, benefit lists
```

**Premium Pricing**
```
Font: Inter-SemiBold
Size: 20px
Line Height: 28px
Letter Spacing: -0.2px
Color: #1F2937
Usage: "$4.99 CAD per month"
```

**Premium Support Text**
```
Font: Inter-Regular
Size: 14px
Line Height: 20px
Letter Spacing: 0px
Color: #6B7280
Usage: Terms, conditions, compliance text
```

**Canadian Compliance Text**
```
Font: Inter-Medium
Size: 14px
Line Height: 20px
Letter Spacing: 0px
Color: #374151
Usage: "🇨🇦 Data stored securely in Canada"
```

### Responsive Typography

**Mobile (320-667px)**
- Scale down 90% for headings
- Maintain readability minimums
- Increase line height by 10% for better touch targets

**Tablet (668-1023px)**
- Standard scale maintained
- Optimize for both portrait and landscape
- Consider split-screen usage scenarios

**Desktop (1024px+)**
- Standard scale maintained
- Account for cursor hover states
- Optimize for desktop subscription flows

## Component Specifications

### 1. Premium Badge Component

**Visual Specifications**
```
Dimensions: 18x18px
Background: #0891B220 (20% opacity)
Border Radius: 9px (perfect circle)
Icon: ⭐ (star emoji)
Icon Size: 10px
Icon Color: #0891B2
Position: Top-right of premium content
Margin: 8px from edges
```

**States**
- **Default**: 100% opacity
- **Hover**: Scale 110%, 150ms ease-out
- **Active**: Scale 95%, 100ms ease-in
- **Disabled**: 50% opacity, no interaction

**Accessibility**
- Screen reader: "Premium feature, requires subscription"
- Minimum 44x44px touch target (extended tap area)
- Focus indicator: 2px outline in #0891B2

### 2. Premium Feature Card

**Container Specifications**
```
Background: #FFFFFF
Border: 2px solid #E5E7EB
Border Radius: 12px
Padding: 16px
Margin: 8px vertical
Shadow: 0 1px 3px rgba(0, 0, 0, 0.1)
Min Height: 80px
```

**Content Layout**
```
Header Row:
  - Icon (24x24px) - left aligned
  - Premium Badge (18x18px) - right aligned
  - Space between: auto

Title:
  - Margin top: 8px
  - Font: Inter-SemiBold 16px
  - Color: #1F2937

Description:
  - Margin top: 4px
  - Font: Inter-Regular 14px
  - Color: #6B7280
  - Line height: 20px
```

**Interactive States**
- **Default**: No elevation
- **Hover**: Lift 2px, shadow increase
- **Press**: Scale 98%, 100ms duration
- **Focus**: 2px outline in #0891B2

### 3. BlurView Overlay Component

**Blur Configuration**
```
Type: 'light' (iOS), 'systemMaterial' (fallback)
Intensity: 25 (subtle preview)
Fallback Color: #F0F8FF80 (light blue, 50% opacity)
Border Radius: 12px (match content radius)
```

**Overlay Content**
```
Background: transparent
Padding: 24px horizontal, 20px vertical
Alignment: center
Max Width: 280px (mobile optimal)
```

**Content Hierarchy**
```
1. Premium Badge (top)
2. Title (center, primary)
3. CTA Button (bottom, prominent)
4. Spacing: 8px between elements
```

### 4. Premium Discovery Modal

**Modal Container**
```
Background: #FFFFFF
Border Radius: 16px (top corners only)
Max Height: 80vh
Min Height: 400px
Width: 100% (mobile), 420px (desktop)
Shadow: 0 10px 25px rgba(0, 0, 0, 0.25)
```

**Header Section**
```
Padding: 24px horizontal, 20px top
Close Button: 24x24px, top-right
Close Button Color: #6B7280
Title Alignment: center
```

**Content Section**
```
Padding: 0 24px
Scrollable: yes (if content exceeds height)
Feature List: 16px spacing between items
Checkmark Color: #10B981
```

**Footer Section**
```
Padding: 20px 24px 32px
Button Stack: vertical, 12px spacing
Primary Button: full width
Secondary Button: full width, ghost style
```

### 5. Subscription Flow Screens

**Plan Selection Card**
```
Background: #FFFFFF
Border: 2px solid #0891B2 (selected)
Border Radius: 12px
Padding: 20px
Margin: 12px vertical
```

**Pricing Display**
```
Currency: "CAD" always visible
Price Size: 24px, Inter-Bold
Billing Cycle: 16px, Inter-Medium, #6B7280
Tax Inclusion: 14px, Inter-Regular, #6B7280
```

**Feature List Styling**
```
Checkmark: ✓ Unicode character
Checkmark Color: #10B981
Feature Text: 16px, Inter-Regular, #374151
Line Height: 24px
Spacing: 12px between features
```

## BlurView Visual Treatment

### Blur Intensity Guidelines

**Discovery Phase (First Exposure)**
- Blur Amount: 20
- Purpose: Hint at content without revealing details
- User Experience: Curiosity without frustration

**Interest Phase (Learning More)**
- Blur Amount: 30
- Purpose: Clear premium boundary
- User Experience: Understand value before commitment

**Decision Phase (Subscription Flow)**
- Blur Amount: 0 (no blur)
- Purpose: Full transparency during payment
- User Experience: Complete clarity for conversion

### Content Visibility Strategy

**Visible Elements (Through Blur)**
- General layout structure
- Non-specific content shapes
- UI element positions
- Color scheme hints

**Hidden Elements (Blurred Out)**
- Specific product names
- Exact quantities
- Personal data
- Detailed functionality

### Platform Optimization

**iOS Implementation**
```
BlurView Props:
  blurType: 'light'
  blurAmount: 25
  reducedTransparencyFallbackColor: '#F0F8FF80'
  style: { borderRadius: 12 }
```

**Android Implementation**
```
BlurView Props:
  blurType: 'light'  
  blurAmount: 20 (reduced for performance)
  reducedTransparencyFallbackColor: '#F0F8FF80'
  style: { borderRadius: 12 }
```

**Web Fallback**
```
CSS Filter:
  filter: blur(8px) opacity(0.6)
  background: rgba(240, 248, 255, 0.8)
  backdrop-filter: blur(8px)
```

## Responsive Design Guidelines

### Mobile (320-767px)

**Premium Feature Cards**
- Width: 100% minus 16px margins
- Padding: 16px
- Font sizes: Standard scale
- Touch targets: Minimum 44x44px

**Modal Presentation**
- Full screen with safe area insets
- Slide up animation from bottom
- Swipe down to dismiss enabled
- Header height: 60px minimum

**BlurView Treatment**
- Reduced blur intensity (20) for performance
- Simplified overlay content
- Larger touch targets

### Tablet (768-1023px)

**Premium Feature Cards**
- Width: 48% for side-by-side layout
- Increased padding: 20px
- Maintain aspect ratio
- Enhanced shadows for depth

**Modal Presentation**
- Centered modal, max 420px width
- Scale animation from center
- Background overlay: 40% black
- Consider landscape orientation

**BlurView Treatment**
- Standard blur intensity (25)
- Full overlay content
- Optimized for touch and potential mouse

### Desktop (1024px+)

**Premium Feature Cards**
- Fixed max-width: 320px
- Grid layout: 3-4 columns
- Hover states enabled
- Cursor pointer on interactive elements

**Modal Presentation**
- Centered modal, 420px width
- Fade + scale animation
- Keyboard navigation support
- Mouse interaction optimization

**BlurView Treatment**
- Enhanced blur intensity (30)
- Desktop-optimized overlay
- Hover states for CTA buttons
- Keyboard accessibility

## Accessibility Standards

### WCAG 2.1 AA Compliance

**Color Contrast**
- Premium text on white: 4.5:1 minimum
- Premium badges: 4.5:1 minimum  
- Canadian flag elements: 7:1 (AAA)
- All interactive elements: 3:1 minimum

**Touch Target Requirements**
- Minimum size: 44x44px
- Premium badges: Extended invisible tap area
- Modal close buttons: 44x44px minimum
- CTA buttons: 48px height minimum

**Screen Reader Support**
```
Premium Badge ARIA:
  aria-label: "Premium feature, requires subscription"
  role: "img"

Premium Feature Card ARIA:
  aria-label: "Baby Bags - Premium feature, tap to learn more"
  role: "button"

Modal ARIA:
  aria-labelledby: "premium-modal-title"
  aria-describedby: "premium-modal-description"
  role: "dialog"
```

### Keyboard Navigation

**Tab Order**
1. Premium feature cards (logical reading order)
2. Modal triggers (CTA buttons)
3. Modal content (close, learn more, subscribe)
4. Subscription form fields (logical form order)

**Focus Management**
- Visible focus indicators (2px outline)
- Focus trapping within modals
- Return focus to trigger after modal close
- Skip links for premium content areas

**Keyboard Shortcuts**
- Escape: Close modal/return to previous screen
- Enter: Activate focused premium feature
- Space: Same as Enter for buttons
- Tab/Shift+Tab: Navigation

### Reduced Motion Support

**Animation Preferences**
```css
@media (prefers-reduced-motion: reduce) {
  .premium-modal {
    transition: opacity 150ms ease;
    transform: none; /* Remove scale/slide animations */
  }
  
  .blur-overlay {
    transition: opacity 200ms ease;
  }
  
  .premium-card:hover {
    transform: none; /* Remove hover lift effects */
  }
}
```

## Animation Specifications

### Modal Animations

**Entry Animation**
```
Duration: 300ms
Easing: cubic-bezier(0.0, 0, 0.2, 1)
Properties:
  - transform: translateY(100%) → translateY(0)
  - opacity: 0 → 1
  - backdrop blur: 0 → blur(8px)
```

**Exit Animation**
```
Duration: 250ms
Easing: cubic-bezier(0.4, 0, 1, 1)
Properties:
  - transform: translateY(0) → translateY(100%)
  - opacity: 1 → 0
  - backdrop blur: blur(8px) → 0
```

### Button Interactions

**Press Animation**
```
Duration: 150ms
Easing: cubic-bezier(0.4, 0, 0.2, 1)
Transform: scale(0.98)
Shadow: Reduced elevation
```

**Hover Animation (Desktop)**
```
Duration: 200ms
Easing: cubic-bezier(0.0, 0, 0.2, 1)
Transform: translateY(-2px)
Shadow: Increased elevation
```

### BlurView Transitions

**Blur In**
```
Duration: 400ms
Easing: ease-out
Properties:
  - blur: 0 → 25px
  - opacity: 0 → 1
  - overlay content: scale(0.95) → scale(1)
```

**Blur Out**
```
Duration: 300ms
Easing: ease-in
Properties:
  - blur: 25px → 0
  - opacity: 1 → 0
  - overlay content: scale(1) → scale(0.95)
```

### Loading States

**Premium Status Loading**
```
Skeleton Animation:
  - Background: linear gradient shimmer
  - Duration: 1.5s infinite
  - Colors: #F3F4F6 → #E5E7EB → #F3F4F6
```

**Subscription Processing**
```
Spinner Animation:
  - Duration: 1s infinite linear
  - Color: #0891B2
  - Size: 24px
  - Stroke width: 3px
```

## Implementation Notes

### CSS Custom Properties

```css
:root {
  /* Premium Color System */
  --premium-primary: #0891B2;
  --premium-green: #10B981;
  --premium-light-blue: #E0F7FA;
  --premium-amber: #F59E0B;
  --premium-canadian-red: #DC2626;
  
  /* Premium Typography */
  --premium-font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --premium-badge-size: 12px;
  --premium-title-size: 18px;
  --premium-pricing-size: 20px;
  
  /* Premium Spacing */
  --premium-padding: 16px;
  --premium-margin: 8px;
  --premium-border-radius: 12px;
  
  /* Premium Shadows */
  --premium-shadow-light: 0 1px 3px rgba(0, 0, 0, 0.1);
  --premium-shadow-medium: 0 4px 6px rgba(0, 0, 0, 0.1);
  --premium-shadow-heavy: 0 10px 25px rgba(0, 0, 0, 0.25);
  
  /* Premium Blur */
  --premium-blur-light: 20px;
  --premium-blur-medium: 25px;
  --premium-blur-heavy: 30px;
  
  /* Canadian Compliance */
  --canadian-flag-width: 16px;
  --canadian-flag-height: 12px;
}
```

### React Native StyleSheet

```typescript
export const premiumStyles = StyleSheet.create({
  // Premium Badge
  premiumBadge: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#0891B220',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Premium Feature Card
  premiumCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  
  // BlurView Container
  blurContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 12,
    overflow: 'hidden',
  },
  
  // Premium Modal
  premiumModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    minHeight: 400,
    maxHeight: '80%',
  },
});
```

## Quality Assurance Checklist

### Visual Consistency
- [ ] All premium components use consistent color palette
- [ ] Typography hierarchy matches specifications  
- [ ] Border radius consistent across components
- [ ] Spacing follows 4px base grid
- [ ] Canadian compliance elements properly styled

### Accessibility Compliance
- [ ] Color contrast ratios meet WCAG AA standards
- [ ] Touch targets minimum 44x44px
- [ ] Screen reader labels implemented
- [ ] Keyboard navigation functional
- [ ] Reduced motion preferences respected

### Performance Validation
- [ ] BlurView performance acceptable on older devices
- [ ] Animation frame rates maintain 60fps
- [ ] Modal loading times under 300ms
- [ ] Premium status checks cached appropriately
- [ ] Bundle size impact minimized

### Cross-Platform Consistency
- [ ] iOS and Android visual parity achieved
- [ ] Web fallbacks functional
- [ ] Responsive design breakpoints working
- [ ] Platform-specific optimizations applied
- [ ] Canadian compliance elements display correctly

## Related Documentation

- [Technical Implementation](technical-implementation.md) - Code specifications and examples
- [User Journey](user-journey.md) - Component usage in context
- [Messaging Framework](messaging-framework.md) - Copy and content guidelines
- [Integration Strategy](integration-strategy.md) - System integration approach

## Last Updated

This visual specification was created January 9, 2025, with comprehensive attention to Canadian cultural values, parental psychology, accessibility standards, and cross-platform mobile design best practices.