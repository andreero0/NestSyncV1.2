# NestSync Design System Documentation

## Project Design Overview

This documentation provides comprehensive design specifications for NestSync, a Canadian diaper planning mobile application built with psychology-driven UX design principles for stressed parents.

## Architecture

- **Frontend**: React Native with Expo SDK ~53, TypeScript
- **Design Philosophy**: Psychology-driven UX for sleep-deprived Canadian parents
- **Compliance**: PIPEDA-compliant with Canadian data residency requirements
- **Accessibility**: Enhanced WCAG AAA standards (7:1 contrast ratios)

## Navigation

### Core Design System
- [Design System Overview](./design-system/README.md) - Complete design system philosophy and principles
- [Style Guide](./design-system/style-guide.md) - Comprehensive style specifications
- [Color Palette](./design-system/tokens/colors.md) - Psychology-driven color system
- [Typography System](./design-system/tokens/typography.md) - Readable hierarchy for tired parents
- [Component Library](./design-system/components/README.md) - Reusable component specifications

### Feature-Specific Design
- [Dashboard Traffic Light System](./features/dashboard-traffic-light/README.md) - 4-card status overview system
- [Inventory Management](./features/inventory-management/README.md) - Complete inventory UX flow
- [Airline Timeline Interface](./features/airline-timeline/README.md) - Time machine scrolling with departure board aesthetics

### Accessibility & Compliance
- [Accessibility Guidelines](./accessibility/guidelines.md) - WCAG AAA compliance standards
- [Canadian Context Integration](./accessibility/compliance.md) - PIPEDA and cultural considerations

## Design Principles

### Psychology-Driven UX for Stressed Parents
1. **Traffic Light Recognition**: Instant visual status comprehension through red/yellow/green system
2. **Calming Color Psychology**: Stress-reduction through medical trust blues and wellness greens  
3. **Low Cognitive Load**: Minimal text, clear visual hierarchy, supportive microcopy
4. **Canadian Trust Elements**: Cultural context and compliance indicators
5. **Enhanced Accessibility**: 7:1 contrast ratios for tired parent usability

### Core UX Principles
- **Bold simplicity** with intuitive navigation creating frictionless experiences
- **Breathable whitespace** complemented by strategic color accents for visual hierarchy
- **Content-first layouts** prioritizing user objectives over decorative elements
- **Accessibility-driven** contrast ratios paired with intuitive navigation patterns
- **Systematic color theory** applied through psychology-based palettes

## Technical Integration

### Theme Integration
- Seamless integration with existing `contexts/ThemeContext.tsx`
- Compatible with `constants/Colors.ts` psychology-driven color system
- Light/dark mode support with consistent brand identity

### Component Architecture
- TypeScript interfaces for type safety
- Responsive design patterns (mobile-first approach)
- Integration with existing component library patterns
- Performance-optimized with React Native best practices

## File Organization Standards

All design documentation follows consistent naming conventions:
- **kebab-case** for directories and files
- **Cross-referencing** with relative markdown links
- **Version control** with timestamps and change logs
- **Developer handoff** notes with implementation guidance

## Last Updated
2025-09-10 - Initial design system documentation structure created