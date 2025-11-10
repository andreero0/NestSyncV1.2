---
title: "User Feedback: Critical Design & UX Issues"
date: 2025-11-08
category: "user-feedback"
type: "issue-report"
status: "identified"
impact: "critical"
priority: "P0"
tags: ["ux-issues", "design-inconsistency", "navigation", "data-issues"]
---

# User Feedback: Critical Design & UX Issues

**Report Date**: 2025-11-08  
**Reporter**: User  
**Priority**: P0 (Critical)  
**Status**: Identified - Requires Immediate Action

## Executive Summary

User testing revealed multiple critical issues across the app that were not addressed in the design consistency work:

1. **Non-functional placeholder content** (Smart Order Suggestions card)
2. **Inconsistent plan display** vs previous work
3. **Child name display issues** (text wrapping/justification problems)
4. **Data disconnect** (child selection not persisting)
5. **Missing back buttons** on multiple screens
6. **Inconsistent button styling** (glass UI vs standard)
7. **Order card design inconsistency**

## Critical Issues by Screen

### 1. Dashboard - Smart Order Suggestions Card

**Issue**: Non-functional placeholder card with broken buttons

**Screenshot Reference**: Image 1, Image 8

**Problems Identified**:
- Card shows "Huggies Huggies Special Delivery newborn" with "Reorder Now" and "Compare Prices" buttons
- **Neither button is functional** - they appear to be placeholders
- "View All Suggestions" button shows loading state with "ML powered" badge
- Unclear if this is intentional placeholder or broken functionality
- Low confidence (1%) suggests this is mock data

**User Question**: 
> "Do you think that card even makes any sense that's there? If you look at it properly, you get to see 'Reorder Now' and 'Compare Prices'. None of those buttons are functional. Is this a placeholder to know how the AI would recommend based on pattern usage?"

**Root Cause**: 
- Likely placeholder/demo data showing what ML suggestions would look like
- Should either:
  - Be hidden until real data is available
  - Show clear "Demo Mode" indicator
  - Have functional buttons that explain the feature

**Recommended Fix**:
- Remove placeholder card if no real data exists
- OR add clear "Demo Preview" badge
- OR implement actual functionality
- Add empty state: "Start logging diaper changes to see AI-powered reorder suggestions"

---

### 2. Subscription Plans Display

**Issue**: Plan display doesn't match previous implementation work

**Screenshot Reference**: Image 2

**Problems Identified**:
- Shows Free, Standard (TRIAL), and Premium plans
- User expected different layout based on previous work
- "Cancel Subscription" fails with error: "Error Failed to Cancel Subscription, Please Try Again"
- Plan cards don't match the design system we've been implementing

**User Question**:
> "Is this how you intended for the plans to look like? I thought you had worked or reworked on it very quickly on Manage Plan."

**Root Cause**:
- Subscription management screen wasn't included in design consistency tasks
- Cancel subscription API call is failing
- Plan cards may be using old styling

**Recommended Fix**:
- Review subscription management screen against design system
- Fix cancel subscription API error
- Ensure plan cards match design tokens
- Add proper error handling with user-friendly messages

---

### 3. Dashboard - Child Name Display

**Issue**: Child name text is visually broken with poor formatting

**Screenshot Reference**: Image 3

**Problems Identified**:
- Child name "Damilare" is displayed as "Damil are" (split across lines)
- Age "3mo" is poorly positioned
- Text appears justified or wrapped incorrectly
- Overall visual appearance is unprofessional

**User Feedback**:
> "Visually it doesn't look or appear appropriate because the text is really messed up. You have the name spelled or multiple lines or justified, and the month or the age of the child has just been hit."

**Root Cause**:
- Text wrapping/justification issue in child selector component
- Likely flexbox or text layout problem
- May be related to container width constraints

**Recommended Fix**:
- Fix text wrapping to keep name on single line
- Adjust container width or use ellipsis for long names
- Improve spacing between name and age
- Review child selector component styling

---

### 4. Dashboard - Child Selection Disconnect

**Issue**: FAB shows "Please Select a Child" despite child being displayed

**Screenshot Reference**: Image 3

**Problems Identified**:
- Dashboard shows "Damilare" as selected child
- Floating Action Button (FAB) shows modal: "Please Select a Child"
- Clear disconnect between displayed state and actual state
- Suggests database or state management issue

**User Feedback**:
> "When you go further, when I click on the floating action button, it tells me 'Please Select the Child'. There's clearly a disconnect between that."

**Root Cause**:
- State management issue - child selection not persisting
- Possible database query issue
- Context/state not properly shared between components

**Recommended Fix**:
- Debug child selection state management
- Ensure selected child persists across components
- Fix database query or context provider
- Add proper error handling if no child is selected

---

### 5. Size Guide - Inconsistent Button Styling

**Issue**: "Back to Home" button has different styling (glass UI effect)

**Screenshot Reference**: Image 4

**Problems Identified**:
- "Back to Home" button appears to have glass/frosted UI effect
- Different from other navigation buttons
- User notes it looks like iOS 18 glass UI
- Inconsistent with design system

**User Feedback**:
> "I noticed that the 'Back to Home' button looks a bit different from the other buttons. It has a glass remind me of the new iOS training 6 think has glass UI which is cool. That's consistent across the board for two navigations."

**Root Cause**:
- Button component using different styling
- May be intentional design choice but inconsistent
- Not documented in design system

**Recommended Fix**:
- Decide on consistent button styling approach
- Either apply glass UI to all navigation buttons OR remove it
- Document button variants in design system
- Ensure consistency across all screens

---

### 6. Size Guide - Tab Navigation Rendering

**Issue**: Unclear if tabs (Calculator, Size Chart, Fit Guide, Brands) are rendering correctly

**Screenshot Reference**: Image 4

**Problems Identified**:
- User questions if tabs are rendering properly
- Horizontal scroll behavior may not be clear
- Tab styling may not match design system

**User Question**:
> "He also has calculator size chart feed guide and brands. I don't know if you are rendering them well. Is that how you want them to be? Since you have to slide through that portion of the screen."

**Recommended Fix**:
- Review tab component styling
- Ensure scroll indicators are visible
- Match tab styling to design system
- Consider adding scroll hints if needed

---

### 7. Size Guide - Personalized Recommendation Card

**Issue**: Card design may not match design patterns

**Screenshot Reference**: Image 4

**User Question**:
> "Personalized recommendation card again not sure if this is consistent with the design patterns."

**Recommended Fix**:
- Review recommendation card against design system
- Ensure card styling matches other cards in app
- Apply consistent spacing, typography, colors

---

### 8. Order History - Missing Back Buttons

**Issue**: Multiple screens missing back navigation buttons

**Screenshot Reference**: Images 5, 6, 7

**Problems Identified**:
- Order History screen: Has back button ✓
- Add Order screen: **Missing back button** ✗
- View All Items screen: **Missing back button** ✗
- Inconsistent navigation patterns

**User Feedback**:
> "The other page where you're supposed to add others, there's no back button there, which is missing. Similar with the other history page, the setup new item page, and view all item page."

**Root Cause**:
- Inconsistent header implementation across screens
- Some screens using Stack.Screen with headerShown: false
- Navigation not properly configured

**Recommended Fix**:
- Add back buttons to all screens that need them
- Ensure consistent header styling across app
- Use Stack.Screen options consistently
- Test navigation flow end-to-end

---

### 9. Order History - Order Card Design

**Issue**: Order cards with "PENDING" status may not match design system

**Screenshot Reference**: Image 5

**Problems Identified**:
- Orange "PENDING" badge styling
- Card layout and spacing
- May not match design system patterns

**User Question**:
> "The other cards, the ones that have pending, is that how they have to look like? Is this consistent with the design documentation?"

**Recommended Fix**:
- Review order card design against design system
- Ensure badge styling matches design tokens
- Apply consistent card patterns
- Review status badge colors and styling

---

## Summary of Issues by Priority

### P0 - Critical (Blocks User Flow)
1. ✗ Child selection disconnect (FAB shows "Please Select a Child")
2. ✗ Cancel subscription fails with error
3. ✗ Missing back buttons on multiple screens
4. ✗ Non-functional reorder buttons on dashboard

### P1 - High (Poor UX)
1. ✗ Child name display broken (text wrapping issue)
2. ✗ Inconsistent button styling (glass UI vs standard)
3. ✗ Placeholder content without clear indication

### P2 - Medium (Design Inconsistency)
1. ✗ Order card design may not match design system
2. ✗ Recommendation card design inconsistency
3. ✗ Tab navigation rendering unclear
4. ✗ Plan cards don't match expected design

## Screens Requiring Immediate Attention

1. **Dashboard (Home)**
   - Fix child name display
   - Fix child selection state
   - Remove or fix placeholder reorder card
   - Ensure consistent styling

2. **Subscription Management**
   - Fix cancel subscription error
   - Review plan card design
   - Ensure matches design system

3. **Navigation (Global)**
   - Add missing back buttons
   - Ensure consistent button styling
   - Fix header configuration

4. **Order History**
   - Review order card design
   - Ensure status badges match design system

5. **Size Guide**
   - Review tab navigation
   - Fix button styling inconsistency
   - Review recommendation card

6. **Add Order / View Items**
   - Add missing back buttons
   - Ensure consistent navigation

## Recommended Action Plan

### Phase 1: Critical Fixes (P0)
1. Fix child selection state management
2. Fix cancel subscription API error
3. Add missing back buttons to all screens
4. Remove or properly implement reorder card functionality

### Phase 2: UX Improvements (P1)
1. Fix child name text wrapping/display
2. Standardize button styling (glass UI decision)
3. Add proper empty states and placeholders

### Phase 3: Design Consistency (P2)
1. Review all card designs against design system
2. Ensure tab navigation matches patterns
3. Update plan cards to match design system
4. Comprehensive visual audit

## Questions for User

1. **Reorder Card**: Should we remove the placeholder card entirely, or implement actual functionality?
2. **Glass UI Buttons**: Do you want glass UI effect on all navigation buttons, or remove it entirely?
3. **Plan Display**: Can you share what the previous plan design looked like that you expected?
4. **Priority**: Which issues should we tackle first?

## Next Steps

1. Create new tasks for critical fixes
2. Debug child selection state management
3. Add missing back buttons
4. Fix subscription cancellation
5. Review and fix text display issues
6. Conduct comprehensive navigation audit

---

**Status**: Awaiting user input on priorities and design decisions  
**Estimated Effort**: 2-3 days for P0 fixes, 1 week for complete resolution
