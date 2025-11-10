# Design System Compliance Checklist

**Purpose:** Ensure all screens and components adhere to the NestSync design system
**Last Updated:** 2025-01-09
**Status:** Active

---

## Quick Reference

### Design Token Files
- **Colors:** `NestSync-frontend/constants/Colors.ts`
- **Glass UI:** `NestSync-frontend/constants/GlassUI.ts`
- **Button Component:** `NestSync-frontend/components/ui/Button.tsx`

### Reference Screens (Properly Implemented)
- ✅ Dashboard Home: `app/(tabs)/index.tsx`
- ✅ Settings: `app/profile-settings.tsx`

### Screens Requiring Updates
- ⚠️ Premium Upgrade: `app/(subscription)/subscription-management.tsx`
- ⚠️ Reorder Flow: `app/reorder-suggestions-simple.tsx`
- ⚠️ Size Prediction: `app/size-guide.tsx`

---

## Color Compliance Checklist

### Primary Colors
- [ ] All primary buttons use `NestSyncColors.primary.blue` (#0891B2)
- [ ] All hover states use `NestSyncColors.primary.blueDark` (#0E7490)
- [ ] All selected states use `NestSyncColors.primary.blueLight` (#E0F2FE)
- [ ] No hardcoded blue values (e.g., #3B82F6, #2563EB)

### Secondary Colors
- [ ] All success states use `NestSyncColors.secondary.green` (#059669)
- [ ] All success backgrounds use `NestSyncColors.secondary.greenLight` (#D1FAE5)
- [ ] No hardcoded green values

### Neutral Colors
- [ ] Screen backgrounds use `NestSyncColors.neutral[50]` (#F9FAFB)
- [ ] Card backgrounds use `NestSyncColors.neutral[100]` (#F3F4F6)
- [ ] Borders use `NestSyncColors.neutral[200]` (#E5E7EB)
- [ ] Body text uses `NestSyncColors.neutral[500]` (#6B7280)
- [ ] Headings use `NestSyncColors.neutral[600]` (#4B5563)
- [ ] No hardcoded gray values (e.g., #666666, #CCCCCC, #F5F5F5)

### Accent Colors
- [ ] Warning states use `NestSyncColors.accent.amber` (#D97706)
- [ ] Important actions use `NestSyncColors.accent.orange` (#EA580C)
- [ ] Premium features use `NestSyncColors.accent.purple` (#7C3AED)

---

## Typography Compliance Checklist

### Font Sizes
- [ ] Large titles use 28px
- [ ] Titles use 20px
- [ ] Subtitles use 16px
- [ ] Body text uses 14px
- [ ] Small text uses 12px
- [ ] Captions use 11px
- [ ] No custom font sizes (e.g., 13px, 15px, 17px)

### Font Weights
- [ ] Body text uses 400 (regular)
- [ ] Labels use 500 (medium)
- [ ] Headings use 600 (semibold)
- [ ] Large titles use 700 (bold)
- [ ] No custom font weights

### Line Height
- [ ] Body text has 1.4-1.5 line height ratio
- [ ] Headings have 1.2-1.3 line height ratio
- [ ] Consistent line height across similar elements

---

## Spacing Compliance Checklist

### Base Unit System (4px)
- [ ] All margins are multiples of 4px
- [ ] All padding is multiples of 4px
- [ ] All gaps are multiples of 4px
- [ ] No spacing values like 10px, 14px, 18px, 22px

### Common Spacing Values
- [ ] Card padding: 16px (4 units)
- [ ] Card margins: 16px (4 units)
- [ ] Button padding horizontal: 16px (4 units)
- [ ] Button padding vertical: 12px (3 units)
- [ ] Section padding: 20px or 24px (5-6 units)
- [ ] Element gaps: 8px or 12px (2-3 units)

### Spacing Patterns
- [ ] Related elements: 8px gap
- [ ] Unrelated elements: 16px gap
- [ ] Section spacing: 24px margin
- [ ] Screen padding: 20px horizontal

---

## Border Radius Compliance Checklist

### Border Radius Values
- [ ] Cards use 12px (large)
- [ ] Buttons use 12px (large)
- [ ] Input fields use 8px (medium)
- [ ] Badges use 6px (small)
- [ ] No custom radius values (e.g., 10px, 14px)

### Consistency
- [ ] All cards have same border radius
- [ ] All buttons have same border radius
- [ ] All input fields have same border radius

---

## Shadow Compliance Checklist

### Shadow Values
- [ ] Cards use small shadow (offset 0,1 / opacity 0.05 / radius 2 / elevation 1)
- [ ] Elevated cards use medium shadow (offset 0,2 / opacity 0.1 / radius 4 / elevation 2)
- [ ] Modals use large shadow (offset 0,4 / opacity 0.15 / radius 8 / elevation 4)
- [ ] No custom shadow values

### Shadow Consistency
- [ ] All cards at same level have same shadow
- [ ] Shadows match design system tokens
- [ ] Android elevation values match iOS shadows

---

## Touch Target Compliance Checklist

### Minimum Size (WCAG AA)
- [ ] All buttons have minimum 48px height
- [ ] All interactive elements have minimum 48px touch area
- [ ] Icon buttons are 48px × 48px
- [ ] List items have minimum 48px height

### Button Sizing
- [ ] Primary buttons: minHeight 48px, paddingVertical 12px
- [ ] Secondary buttons: minHeight 48px, paddingVertical 12px
- [ ] Icon buttons: width 48px, height 48px
- [ ] Tab buttons: minHeight 48px

### Spacing for Touch
- [ ] Buttons have adequate spacing between them (minimum 8px)
- [ ] Interactive elements don't overlap
- [ ] Touch areas don't conflict

---

## Accessibility Compliance Checklist

### Color Contrast (WCAG AA)
- [ ] Body text has minimum 4.5:1 contrast ratio
- [ ] Large text has minimum 3:1 contrast ratio
- [ ] Interactive elements have minimum 3:1 contrast ratio
- [ ] No low-contrast text (e.g., light gray on white)

### Screen Reader Support
- [ ] All buttons have `accessibilityRole="button"`
- [ ] All buttons have `accessibilityLabel` describing action
- [ ] All buttons have `accessibilityHint` describing result
- [ ] All images have `accessibilityLabel` or `accessibilityRole="none"`

### Keyboard Navigation (Web)
- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical
- [ ] Focus indicators are visible
- [ ] No keyboard traps

### Motion and Animation
- [ ] Animations respect `reducedMotion` preference
- [ ] No auto-playing animations longer than 5 seconds
- [ ] Users can pause/stop animations

---

## Component-Specific Checklists

### Button Checklist
- [ ] Uses `NestSyncColors` for background
- [ ] Has minimum 48px height
- [ ] Uses 14px font size (body)
- [ ] Uses 600 font weight (semibold)
- [ ] Has 12px border radius
- [ ] Has 16px horizontal padding
- [ ] Has 12px vertical padding
- [ ] Has appropriate shadow
- [ ] Has accessibility labels

### Card Checklist
- [ ] Uses `NestSyncColors.neutral[100]` background
- [ ] Has 12px border radius
- [ ] Has 16px padding
- [ ] Has 1px border with `NestSyncColors.neutral[200]`
- [ ] Has small shadow (elevation 1)
- [ ] Has 16px bottom margin
- [ ] Header uses 20px font size (title)
- [ ] Body uses 14px font size (body)

### Input Field Checklist
- [ ] Uses `NestSyncColors.neutral[50]` background
- [ ] Has 8px border radius
- [ ] Has 12px padding
- [ ] Has minimum 48px height
- [ ] Uses 14px font size (body)
- [ ] Has 1px border with `NestSyncColors.neutral[200]`
- [ ] Label uses 12px font size (small)
- [ ] Label has 8px bottom margin

### Section Header Checklist
- [ ] Uses 16px font size (subtitle)
- [ ] Uses 600 font weight (semibold)
- [ ] Uses `NestSyncColors.neutral[600]` color
- [ ] Has 12px bottom margin
- [ ] Has 24px top margin (between sections)

---

## Screen-Specific Checklists

### Premium Upgrade Flow
- [ ] All buttons use design system colors
- [ ] All buttons have 48px minimum height
- [ ] All spacing uses 4px base unit
- [ ] All cards have 12px border radius
- [ ] All text uses design system sizes
- [ ] No hardcoded colors
- [ ] Matches visual style of Dashboard Home

### Reorder Flow
- [ ] Card spacing is 16px (not 14px)
- [ ] Button text is 14px (not 12px)
- [ ] Shadows match design system
- [ ] All colors use design tokens
- [ ] Touch targets meet 48px minimum
- [ ] Matches visual style of Dashboard Home

### Size Prediction Interface
- [ ] All spacing uses 4px base unit (not 15px, 18px)
- [ ] Tab buttons have 48px minimum height
- [ ] All colors use design tokens (no #F5F5F5, #CCCCCC)
- [ ] Font sizes match design system (no 13px, 15px)
- [ ] Border radius matches design system
- [ ] Matches visual style of Settings screen

---

## Testing Checklist

### Visual Testing
- [ ] Screenshot comparison with reference screens
- [ ] Side-by-side comparison of similar elements
- [ ] Color picker verification of token usage
- [ ] Spacing measurement verification

### Automated Testing
- [ ] Playwright visual regression tests pass
- [ ] Design token usage tests pass
- [ ] Accessibility tests pass (axe-core)
- [ ] Touch target size tests pass

### Manual Testing
- [ ] Test on iOS physical device
- [ ] Test on Android physical device
- [ ] Test on web browser
- [ ] Test with screen reader
- [ ] Test with keyboard navigation
- [ ] Test with reduced motion enabled

### Cross-Platform Testing
- [ ] Visual consistency across iOS, Android, Web
- [ ] Touch targets work on all platforms
- [ ] Colors render correctly on all platforms
- [ ] Typography renders correctly on all platforms

---

## Validation Process

### Before Committing Code

1. **Self-Review**
   - [ ] Run through relevant checklist sections
   - [ ] Compare visually with reference screens
   - [ ] Verify all design tokens used

2. **Automated Checks**
   - [ ] Run ESLint (if design system rules configured)
   - [ ] Run Playwright tests
   - [ ] Run accessibility tests

3. **Manual Verification**
   - [ ] Test on at least one physical device
   - [ ] Verify touch targets are adequate
   - [ ] Check color contrast

### During Code Review

1. **Reviewer Checks**
   - [ ] Verify design token usage
   - [ ] Check for hardcoded values
   - [ ] Verify touch target sizes
   - [ ] Compare with reference screens

2. **Design Review**
   - [ ] Visual consistency verified
   - [ ] Accessibility requirements met
   - [ ] Brand guidelines followed

---

## Common Violations and Fixes

### Violation: Hardcoded Colors

**Bad:**
```typescript
backgroundColor: '#3B82F6',
color: '#666666',
borderColor: '#CCCCCC',
```

**Good:**
```typescript
backgroundColor: NestSyncColors.primary.blue,
color: NestSyncColors.neutral[500],
borderColor: NestSyncColors.neutral[200],
```

### Violation: Non-Standard Spacing

**Bad:**
```typescript
padding: 14,
margin: 10,
gap: 18,
```

**Good:**
```typescript
padding: 16,  // 4 × 4px
margin: 12,   // 3 × 4px
gap: 16,      // 4 × 4px
```

### Violation: Touch Targets Too Small

**Bad:**
```typescript
height: 40,
paddingVertical: 8,
```

**Good:**
```typescript
minHeight: 48,
paddingVertical: 12,
```

### Violation: Non-Standard Font Sizes

**Bad:**
```typescript
fontSize: 15,
fontSize: 13,
```

**Good:**
```typescript
fontSize: 16,  // subtitle
fontSize: 12,  // small
```

### Violation: Custom Border Radius

**Bad:**
```typescript
borderRadius: 10,
borderRadius: 14,
```

**Good:**
```typescript
borderRadius: 12,  // large (for cards/buttons)
borderRadius: 8,   // medium (for inputs)
```

---

## Maintenance

### Regular Audits

- **Weekly:** Spot-check new features for compliance
- **Monthly:** Full design system audit of all screens
- **Quarterly:** Update design tokens and documentation

### Continuous Improvement

- Document new patterns as they emerge
- Update checklist based on common violations
- Add automated checks for frequent issues
- Share learnings with team

---

## Resources

### Documentation
- [Design System Audit Report](./design-audit-report.md)
- [Design Tokens Extracted](./design-tokens-extracted.md)
- [Design Audit Instructions](./design-audit-instructions.md)

### Tools
- Playwright MCP for screenshot capture
- Color contrast checker
- Spacing measurement tools
- Accessibility testing tools (axe-core)

### Support
- Design System Team
- Accessibility Team
- Frontend Engineering Team

---

**Checklist Status:** Active
**Next Review:** After design system updates
**Feedback:** Submit issues or suggestions to Design System Team
