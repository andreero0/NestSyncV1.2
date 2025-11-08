# NestSync Design System Style Guide

## Overview

NestSync's design system prioritizes psychology-driven UX for Canadian parents managing diaper inventory. Every design decision reduces stress while maintaining professional reliability and Canadian cultural context.

## Design Philosophy

Our design philosophy embodies:

- **Bold simplicity** with intuitive navigation creating frictionless experiences
- **Psychology-driven color theory** reducing stress through medical trust associations
- **Strategic whitespace** calibrated for cognitive breathing room and content prioritization
- **Enhanced accessibility** with 7:1 contrast ratios for tired parent usability
- **Canadian trust elements** building confidence through cultural context and compliance

## Color System

### Psychology-Driven Color Palette

Our color system uses research-backed color psychology specifically designed for stressed Canadian parents:

#### Primary Colors (Trust & Reliability)
- **Primary Blue**: `#0891B2` – Main CTAs, brand elements, Canadian trust messaging
- **Primary Dark**: `#0E7490` – Hover states, emphasis, active interactions
- **Primary Light**: `#E0F2FE` – Subtle backgrounds, selected states, highlights

**Psychology**: Medical trust, institutional reliability, water-like calming associations

#### Traffic Light System (Status Communication)
- **Critical Red**: `#DC2626` – Items ≤3 days remaining (urgent but not alarming)
- **Low Stock Amber**: `#D97706` – Items 4-7 days remaining (attention without panic)  
- **Well Stocked Green**: `#059669` – Items >7 days remaining (reassurance and calm)
- **Pending Orders Blue**: `#0891B2` – Incoming inventory (hope and progress)

**Psychology**: Universal traffic light recognition for instant status comprehension

#### Secondary Colors (Growth & Wellness)
- **Success Green**: `#059669` – Confirmations, positive feedback, growth indicators
- **Green Light**: `#D1FAE5` – Success message backgrounds, positive highlights
- **Green Pale**: `#F0FDF4` – Subtle success backgrounds, gentle positive states

#### Accent Colors (Attention Without Alarm)
- **Orange**: `#EA580C` – Important actions, reorder notifications (non-urgent)
- **Amber**: `#D97706` – Warnings, attention states, size change predictions
- **Purple**: `#7C3AED` – Premium features, special states, advanced options

#### Neutral Palette (Hierarchy & Readability)
- **Neutral-50**: `#F9FAFB` – Backgrounds, subtle dividers
- **Neutral-100**: `#F3F4F6` – Card backgrounds, input fields
- **Neutral-200**: `#E5E7EB` – Borders, dividers
- **Neutral-300**: `#D1D5DB` – Placeholders, disabled states
- **Neutral-400**: `#9CA3AF` – Secondary text, icons (4.6:1 contrast)
- **Neutral-500**: `#6B7280` – Primary text color (7.8:1 contrast)
- **Neutral-600**: `#4B5563` – Headings, emphasis (10.4:1 contrast)
- **Neutral-700**: `#374151` – High emphasis text (13.2:1 contrast)
- **Neutral-800**: `#1F2937` – Maximum contrast text (16.8:1 contrast)
- **Neutral-900**: `#111827` – Reserved for critical emphasis (19.3:1 contrast)

### Accessibility Standards

**Enhanced WCAG AAA Compliance**:
- Minimum 7:1 contrast ratios for critical interactions (exceeding standard requirements)
- Color-blind friendly palette verification
- Never rely on color alone for meaning
- All interactive states include non-color indicators (icons, text, borders)

## Typography System

### Font Stack
- **Primary**: `System font, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif`
- **Monospace**: `SF Mono, Consolas, JetBrains Mono, monospace`

### Font Weights
- **Light**: 300 (rarely used, only for large displays)
- **Regular**: 400 (body text, standard UI elements)
- **Medium**: 500 (emphasized body text, card titles)
- **Semibold**: 600 (headings, important labels)
- **Bold**: 700 (critical emphasis, major headings)

### Type Scale (Optimized for Tired Parent Readability)

#### Headings
- **H1**: `32px/40px, 700, -0.02em` – Page titles, major sections
- **H2**: `28px/36px, 600, -0.01em` – Section headers, modal titles
- **H3**: `24px/32px, 600, -0.01em` – Subsection headers, card group titles
- **H4**: `20px/28px, 500, 0em` – Card titles, form section headers
- **H5**: `18px/24px, 500, 0em` – Minor headers, list section titles

#### Body Text
- **Body Large**: `18px/28px, 400` – Primary reading text, important descriptions
- **Body**: `16px/24px, 400` – Standard UI text, form inputs, button labels
- **Body Small**: `14px/20px, 400` – Secondary information, metadata
- **Caption**: `12px/16px, 400` – Timestamps, fine print, legal text

#### Special Purpose
- **Label**: `14px/20px, 500, uppercase, 0.05em` – Form labels, category headers
- **Code**: `14px/20px, monospace, 400` – Technical text, data values

### Responsive Typography

#### Mobile (320-767px)
- Base font size: 16px
- Scale factor: 0.9x for headings
- Line height: +20% for better readability on small screens

#### Tablet (768-1023px)
- Base font size: 16px
- Standard scale factors
- Optimal line lengths for comfortable reading

#### Desktop (1024px+)
- Base font size: 16px
- Full scale implementation
- Maximum content width for optimal reading

## Spacing & Layout System

### Base Unit
**8px** – All spacing derives from this base unit for consistent rhythm

### Spacing Scale
- **xs**: `4px` (0.5 × base) – Micro spacing between related elements
- **sm**: `8px` (1 × base) – Small spacing, internal padding
- **md**: `16px` (2 × base) – Default spacing, standard margins
- **lg**: `24px` (3 × base) – Medium spacing between sections
- **xl**: `32px` (4 × base) – Large spacing, major section separation
- **2xl**: `48px` (6 × base) – Extra large spacing, screen padding
- **3xl**: `64px` (8 × base) – Huge spacing, hero sections

### Grid System

#### Mobile (320-767px)
- **Columns**: 4-column grid
- **Gutters**: 16px between columns
- **Margins**: 16px side margins
- **Container**: Full width minus margins

#### Tablet (768-1023px)
- **Columns**: 8-column grid
- **Gutters**: 24px between columns
- **Margins**: 32px side margins
- **Container**: Full width minus margins

#### Desktop (1024px+)
- **Columns**: 12-column grid
- **Gutters**: 24px between columns
- **Margins**: 48px side margins (min)
- **Container**: 1200px maximum width, centered

### Responsive Breakpoints
- **Mobile**: `320px – 767px`
- **Tablet**: `768px – 1023px`
- **Desktop**: `1024px – 1439px`
- **Wide**: `1440px+`

## Motion & Animation System

### Psychology-Based Animation Principles
- **Purpose-Driven**: Every animation serves a functional purpose
- **Stress-Reducing**: Gentle, non-jarring transitions that calm rather than excite
- **Performance-Optimized**: 60fps minimum, hardware acceleration preferred
- **Accessibility-Conscious**: Respects `prefers-reduced-motion` user preferences

### Timing Functions
- **Ease-out**: `cubic-bezier(0.0, 0, 0.2, 1)` – Entrances, expansions, status reveals
- **Ease-in-out**: `cubic-bezier(0.4, 0, 0.6, 1)` – Transitions, tab switches, content changes
- **Spring**: Custom physics-based easing – Playful interactions, FAB transforms

### Duration Scale
- **Micro**: `100–150ms` – State changes, hover effects, color transitions
- **Short**: `200–300ms` – Local transitions, dropdown reveals, card flips
- **Medium**: `400–500ms` – Page transitions, modal presentations, drawer slides
- **Long**: `600–800ms` – Complex animations, onboarding flows, celebration states

## Canadian Context Integration

### Trust Elements
- **Canadian Flag Colors**: Reserved for national identity context only
- **Trust Messaging**: "Data stored in Canada" indicators using Primary Blue
- **Cultural Sensitivity**: Warm, supportive tone throughout microcopy
- **PIPEDA Compliance**: Privacy-conscious design elements that build confidence

### Supportive Microcopy Guidelines

#### Traffic Light System Messaging
- **Critical Items**: "Items need attention soon" (not "URGENT" or "CRITICAL")
- **Low Stock**: "Plan to restock these items" (proactive, not reactive)
- **Well Stocked**: "You're prepared!" (confidence building)
- **Pending Orders**: "Help is on the way" (reassuring)

#### General Tone Guidelines
- **Empathetic**: Acknowledges the challenges of parenting
- **Supportive**: Builds confidence in planning abilities
- **Clear**: Eliminates ambiguity that could cause stress
- **Warm**: Professional yet approachable
- **Canadian**: Subtle cultural references and polite phrasing

## Implementation Standards

### Component Development
- All components must support light/dark modes
- TypeScript interfaces required for all props
- Accessibility props (ARIA labels, roles) mandatory
- Responsive behavior documented and tested
- Performance impact documented (rendering cost, memory usage)

### Quality Assurance Checklist

#### Design System Compliance
- [ ] Colors match defined palette with proper contrast ratios
- [ ] Typography follows established hierarchy and scale
- [ ] Spacing uses systematic scale consistently
- [ ] Components match documented specifications
- [ ] Motion follows timing and easing standards

#### Accessibility Compliance
- [ ] WCAG AAA compliance verified (7:1 contrast minimum)
- [ ] Keyboard navigation complete and logical
- [ ] Screen reader experience optimized
- [ ] Touch targets meet minimum size requirements (44×44px)
- [ ] Focus indicators visible and consistent
- [ ] Motion respects user preferences

#### Psychology & User Experience
- [ ] Reduces cognitive load for tired parents
- [ ] Builds confidence through supportive messaging
- [ ] Uses calming color associations appropriately
- [ ] Maintains Canadian cultural context
- [ ] Supports stress-reduction goals

## Last Updated
2025-09-10 - Complete design system style guide established