---
title: Premium Upgrade Flow - Screen States and Wireframe Specifications
description: Detailed wireframe specifications for all premium upgrade flow screens including pricing displays, feature comparisons, trial offerings, and payment processing interfaces
feature: premium-upgrade-flow
last-updated: 2025-01-15
version: 1.0.0
related-files:
  - README.md
  - user-journey.md
  - interactions.md
  - ../../design-system/components/buttons.md
  - ../../design-system/components/forms.md
dependencies:
  - Design system color tokens
  - Typography scale definitions
  - Spacing system implementation
status: approved
---

# Premium Upgrade Flow - Screen States and Wireframe Specifications

## Overview

This document provides comprehensive wireframe specifications for all screens in the premium upgrade flow, designed specifically for value-conscious Canadian families. Each screen state includes detailed layout specifications, content requirements, interaction elements, and responsive design considerations.

## Table of Contents

1. [Screen Architecture Overview](#screen-architecture-overview)
2. [Discovery Phase Screens](#discovery-phase-screens)
3. [Feature Comparison Screens](#feature-comparison-screens)
4. [Trial Experience Screens](#trial-experience-screens)
5. [Pricing and Payment Screens](#pricing-and-payment-screens)
6. [Confirmation and Activation Screens](#confirmation-and-activation-screens)
7. [Account Management Screens](#account-management-screens)
8. [Error and Edge Case Screens](#error-and-edge-case-screens)
9. [Responsive Design Specifications](#responsive-design-specifications)

## Screen Architecture Overview

### Screen Flow Hierarchy
```
Premium Upgrade Flow
├── Discovery Screens
│   ├── Feature Limit Notification
│   ├── Premium Feature Showcase
│   └── Value Proposition Overview
├── Comparison Screens
│   ├── Feature Comparison Table
│   ├── Tier Selection
│   └── Canadian Pricing Display
├── Trial Screens
│   ├── Trial Activation
│   ├── Trial Onboarding
│   ├── Trial Progress Tracking
│   └── Trial Conversion Prompt
├── Payment Screens
│   ├── Subscription Selection
│   ├── Payment Information
│   ├── Canadian Tax Calculation
│   ├── Billing Address Collection
│   └── Payment Confirmation
├── Activation Screens
│   ├── Purchase Success
│   ├── Premium Feature Activation
│   └── Welcome to Premium
└── Management Screens
    ├── Subscription Dashboard
    ├── Billing History
    ├── Family Sharing Setup
    └── Cancellation Flow
```

### Global Design Specifications

#### Layout Container
- **Mobile**: 20px horizontal padding, full-width content areas
- **Tablet**: 32px horizontal padding, max-width 768px centered
- **Desktop**: 48px horizontal padding, max-width 1200px centered

#### Color Palette Application
- **Primary Actions**: `Primary-600` for upgrade CTAs and conversion buttons
- **Secondary Actions**: `Neutral-200` borders with `Neutral-700` text
- **Success States**: `Success-500` for confirmations and positive feedback
- **Warning States**: `Warning-500` for trial expiration and payment issues
- **Error States**: `Error-500` for failed payments and system errors
- **Canadian Pricing**: `Accent-Primary` for CAD currency displays

#### Typography Hierarchy
- **Screen Titles**: H2 (32px/38px, Semibold-600)
- **Section Headers**: H3 (24px/30px, Medium-500)
- **Feature Names**: H4 (18px/24px, Medium-500)
- **Body Content**: Body (16px/24px, Regular-400)
- **Pricing**: H3 (24px/30px, Bold-700) for amounts, Body Small (14px/20px) for currency
- **Legal Text**: Caption (12px/16px, Regular-400)

## Discovery Phase Screens

### Screen: Feature Limit Notification

#### Purpose
Natural introduction to premium features when users encounter free tier limitations.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Feature Limit Reached                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│    🚧 You've reached your free plan limit             │
│                                                        │
│    You're trying to add more than 3 family members    │
│    to your NestSync account.                           │
│                                                        │
│    ┌─ Premium Solution ──────────────────────────┐     │
│    │                                             │     │
│    │  Family Plan unlocks:                      │     │
│    │  • Unlimited family members                │     │
│    │  • Advanced calendar sync                  │     │
│    │  • Real-time collaboration                 │     │
│    │  • Emergency contact management            │     │
│    │                                             │     │
│    │  Starting at $19.99/month CAD             │     │
│    │  ┌─ Start Free Trial ─┐  ┌─ Learn More ─┐  │     │
│    │  │                   │  │              │  │     │
│    │  └───────────────────┘  └──────────────┘  │     │
│    └─────────────────────────────────────────────┘     │
│                                                        │
│    Continue with Free Plan                             │
│    (Limited to 3 family members)                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default
**Visual Specifications**:
- **Container**: Full-screen modal with `Neutral-50` background
- **Limit Icon**: Warning icon in `Warning-500` color, 48px size
- **Problem Statement**: Body Large (18px/26px) in `Neutral-900`
- **Solution Card**: `White` background with `Primary-100` border, 16px padding, 8px border radius
- **Feature List**: Checkmark icons in `Success-500`, Body text in `Neutral-700`
- **Pricing**: CAD amount in `Primary-600`, H3 typography
- **CTA Buttons**: Primary button for trial, Secondary button for learn more
- **Free Continue**: Text link in `Neutral-500`, Caption typography

**Interaction Elements**:
- **Start Free Trial**: Primary button, full-width on mobile, fixed-width on desktop
- **Learn More**: Secondary button, opens feature comparison screen
- **Continue with Free**: Text button, confirms user wants to stay with limitations
- **Close Modal**: X button in top-right corner, returns to previous screen

#### State: Loading
**Visual Changes**:
- **CTA Button**: Shows spinner animation, text changes to "Starting Trial..."
- **Other Buttons**: Disabled state with reduced opacity
- **Background**: Semi-transparent overlay prevents interaction

#### State: Error
**Visual Changes**:
- **Error Message**: Red error banner appears below pricing section
- **Error Text**: "Unable to start trial. Please check your connection and try again."
- **CTA Button**: Returns to default state, allows retry

### Screen: Premium Feature Showcase

#### Purpose
Educational overview of premium features without sales pressure, focusing on family value.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Premium Features                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Supercharge Your Family Organization                  │
│  See how Canadian families save 5+ hours per week     │
│                                                        │
│  ┌─ Feature Category: Organization ────────────────┐   │
│  │                                                 │   │
│  │  📅 Advanced Calendar Sync                     │   │
│  │  Two-way sync with all family calendars        │   │
│  │                                                 │   │
│  │  🔄 Smart Conflict Detection                   │   │
│  │  Automatically catch scheduling overlaps       │   │
│  │                                                 │   │
│  │  📊 Family Analytics                           │   │
│  │  See patterns and optimize your schedule       │   │
│  │                                                 │   │
│  │  > See Sarah's Story: "Saved 8 hours/week"    │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Feature Category: Collaboration ──────────────┐   │
│  │                                                 │   │
│  │  👥 Real-time Family Sync                      │   │
│  │  Instant updates across all devices            │   │
│  │                                                 │   │
│  │  💬 Family Communication Hub                   │   │
│  │  Integrated messaging and coordination         │   │
│  │                                                 │   │
│  │  🔐 Role-based Permissions                     │   │
│  │  Control what each family member can see       │   │
│  │                                                 │   │
│  │  > See Michael's Story: "Better coordination"  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Feature Category: Safety ──────────────────────┐   │
│  │                                                 │   │
│  │  🆘 Emergency Management                       │   │
│  │  Complete emergency contact system             │   │
│  │                                                 │   │
│  │  📍 Family Location Sharing                    │   │
│  │  Optional safety coordination tools            │   │
│  │                                                 │   │
│  │  🏥 Medical Information Hub                    │   │
│  │  Secure family medical information storage     │   │
│  │                                                 │   │
│  └─────────────────────────────────────────────────┘   │
│                                                        │
│  ┌─ Try Premium Free for 14 Days ─┐ ┌─ Compare Plans ─┐ │
│  │                                │ │                 │ │
│  └────────────────────────────────┘ └─────────────────┘ │
│                                                        │
│  All premium features • No credit card required       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default
**Visual Specifications**:
- **Header Section**: Centered title with subtitle, 32px bottom margin
- **Feature Categories**: White cards with `Neutral-100` borders, 24px padding
- **Category Icons**: 32px colored icons representing each feature category
- **Feature Items**: 16px bottom margin between items, bullet-style layout
- **Feature Icons**: 24px icons in `Primary-500` color
- **Feature Descriptions**: Body text in `Neutral-600`
- **Success Stories**: Expandable links in `Primary-600` with chevron icons
- **CTA Section**: Centered buttons with 16px spacing between
- **Disclaimer Text**: Caption in `Neutral-500`, centered

**Interaction Elements**:
- **Success Story Links**: Expand to show testimonial cards with family photos
- **Try Premium Button**: Primary button, opens trial activation flow
- **Compare Plans Button**: Secondary button, opens feature comparison screen
- **Feature Item Taps**: Mobile-only, shows detailed feature explanations

#### State: Success Story Expanded
**Visual Changes**:
- **Testimonial Card**: Appears below clicked success story link
- **Card Content**: Family photo, name, location (city, province), detailed testimonial
- **Card Background**: `Success-50` with `Success-200` border
- **Close Button**: X button to collapse testimonial

#### State: Loading (Background Data)
**Visual Changes**:
- **Skeleton Loading**: Feature categories show skeleton placeholders
- **Success Stories**: Show loading spinners while testimonial data loads
- **CTA Buttons**: Remain interactive with instant feedback

## Feature Comparison Screens

### Screen: Feature Comparison Table

#### Purpose
Clear, honest comparison between free and premium tiers with Canadian pricing.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Compare Plans                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│  Choose the Right Plan for Your Family                 │
│  All plans include core family organization features   │
│                                                        │
│  ┌─ Plan Comparison ──────────────────────────────────┐ │
│  │                                                   │ │
│  │         FREE      FAMILY     PROFESSIONAL        │ │
│  │        ┌────┐    ┌──────┐    ┌─────────────┐     │ │
│  │        │ $0 │    │$19.99│    │   $34.99    │     │ │
│  │        │/mo │    │ /mo  │    │    /mo      │     │ │
│  │        │CAD │    │ CAD  │    │    CAD      │     │ │
│  │        └────┘    └──────┘    └─────────────┘     │ │
│  │                                                   │ │
│  │  Family Members                                   │ │
│  │    Up to 3        Unlimited    Unlimited         │ │
│  │                                                   │ │
│  │  Calendar Sync                                    │ │
│  │    Basic          Advanced     Advanced + AI     │ │
│  │                                                   │ │
│  │  Task Management                                  │ │
│  │    ✓              ✓            ✓ + Automation    │ │
│  │                                                   │ │
│  │  Emergency Contacts                               │ │
│  │    3 contacts     Unlimited    Unlimited + Med   │ │
│  │                                                   │ │
│  │  Family Communication                             │ │
│  │    Basic notes    ✓ Chat       ✓ Advanced       │ │
│  │                                                   │ │
│  │  Analytics & Reports                              │ │
│  │    ✗              Basic        ✓ Advanced        │ │
│  │                                                   │ │
│  │  Priority Support                                 │ │
│  │    ✗              ✓            ✓ + Phone         │ │
│  │                                                   │ │
│  │  Canadian Tax Receipt                             │ │
│  │    ✗              ✓            ✓ + Business      │ │
│  │                                                   │ │
│  │  ┌─ Current ─┐  ┌─ Try Free ─┐  ┌─ Try Free ─┐   │ │
│  │  │   Plan   │  │  14 Days  │  │  14 Days  │   │ │
│  │  └──────────┘  └───────────┘  └───────────┘   │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  📍 Prices shown in Canadian dollars                   │
│  📋 Tax included in displayed price                    │
│  🔒 Cancel anytime, no hidden fees                     │
│  📞 Canadian customer support                          │
│                                                        │
│  ❓ Questions? See our FAQ or chat with support       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default
**Visual Specifications**:
- **Plan Cards**: Three columns with emphasized Family plan (most popular)
- **Most Popular Badge**: `Primary-500` background on Family plan card
- **Pricing Display**: Large CAD amounts with prominent currency indicators
- **Feature Rows**: Alternating `White` and `Neutral-50` backgrounds
- **Check/X Icons**: `Success-500` for included, `Neutral-400` for not included
- **Feature Descriptions**: Body text with hover tooltips for clarification
- **CTA Buttons**: Primary for Family/Professional, Secondary for current plan
- **Canadian Indicators**: Maple leaf icons next to Canadian-specific features
- **Trust Elements**: Icons with brief descriptions in `Neutral-600`

**Interaction Elements**:
- **Plan Selection**: Buttons trigger trial activation or immediate upgrade
- **Feature Tooltips**: Hover/tap to show detailed feature explanations
- **FAQ Link**: Opens FAQ modal or navigates to support page
- **Chat Support**: Opens live chat widget with Canadian support

#### State: Mobile Responsive
**Visual Changes**:
- **Horizontal Scroll**: Plans displayed in horizontal scrollable cards
- **Sticky Pricing**: Price information sticks to top of card during scroll
- **Collapsed Features**: Feature comparison in accordion format
- **Emphasized CTA**: Single prominent CTA button per card

#### State: Loading Price Calculation
**Visual Changes**:
- **Price Shimmer**: Animated loading placeholder for pricing information
- **Tax Calculation**: "Calculating taxes for your province..." message
- **CTA Disabled**: Buttons disabled until price calculation completes

### Screen: Tier Selection with Canadian Pricing

#### Purpose
Focused tier selection with transparent Canadian pricing and tax breakdown.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Select Your Plan                              │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📍 Pricing for Ontario, Canada                        │
│  [Change Province ▼]                                   │
│                                                        │
│  ┌─ Family Plan (Recommended) ───────────────────────┐  │
│  │                                    MOST POPULAR   │  │
│  │  Perfect for growing families                     │  │
│  │                                                   │  │
│  │  💰 Pricing Breakdown                            │  │
│  │  Base Price:           $19.99 CAD                │  │
│  │  HST (13%):            $2.60 CAD                 │  │
│  │  ────────────────────  ─────────                 │  │
│  │  Total Monthly:        $22.59 CAD                │  │
│  │                                                   │  │
│  │  ✨ Key Features                                  │  │
│  │  • Unlimited family members                      │  │
│  │  • Advanced calendar sync                        │  │
│  │  • Real-time collaboration                       │  │
│  │  • Emergency management                          │  │
│  │  • Canadian tax receipts                         │  │
│  │                                                   │  │
│  │  ⏱️ Free Trial: 14 days, no credit card required │  │
│  │                                                   │  │
│  │  ┌─ Start Free Trial ────────────────────────────┐ │  │
│  │  │                                               │ │  │
│  │  └───────────────────────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────┘  │
│                                                        │
│  ┌─ Professional Plan ─────────────────────────────┐    │
│  │                                                 │    │
│  │  For power users and large families            │    │
│  │                                                 │    │
│  │  💰 Pricing Breakdown                          │    │
│  │  Base Price:           $34.99 CAD              │    │
│  │  HST (13%):            $4.55 CAD               │    │
│  │  ────────────────────  ─────────               │    │
│  │  Total Monthly:        $39.54 CAD              │    │
│  │                                                 │    │
│  │  ✨ Everything in Family, plus:                │    │
│  │  • Advanced analytics & insights               │    │
│  │  • API access for integrations                 │    │
│  │  • Priority phone support                      │    │
│  │  • Multiple family units                       │    │
│  │  • Business tax receipts                       │    │
│  │                                                 │    │
│  │  ┌─ Start Free Trial ──────────────────────────┐ │    │
│  │  │                                             │ │    │
│  │  └─────────────────────────────────────────────┘ │    │
│  └─────────────────────────────────────────────────┘    │
│                                                        │
│  🔒 Secure billing with Stripe                         │
│  ❌ Cancel anytime, no cancellation fees               │
│  🇨🇦 Canadian customer support available               │
│                                                        │
│  Still have questions? [View FAQ] [Contact Support]    │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default (Ontario Selected)
**Visual Specifications**:
- **Province Selector**: Dropdown button showing current province selection
- **Most Popular Badge**: Diagonal ribbon in `Primary-500` background
- **Plan Cards**: White cards with `Primary-100` border for Family plan
- **Price Breakdown**: Structured table format with aligned pricing
- **Tax Information**: Clearly separated tax line items with percentage indicators
- **Feature Lists**: Bullet points with checkmark icons in `Success-500`
- **CTA Buttons**: Primary buttons with trial messaging
- **Trust Indicators**: Icon-text combinations at bottom in `Neutral-600`
- **Support Links**: Underlined text links in `Primary-600`

**Interaction Elements**:
- **Province Dropdown**: Opens modal with all Canadian provinces
- **Start Trial Buttons**: Initiates trial activation flow
- **FAQ Link**: Opens FAQ modal overlay
- **Contact Support**: Opens support chat or contact form

#### State: Province Selection Modal
**Visual Changes**:
- **Modal Overlay**: Semi-transparent background with centered province list
- **Province List**: Scrollable list of all Canadian provinces and territories
- **Current Selection**: Highlighted with checkmark icon
- **Tax Rate Display**: Shows tax rate next to each province name
- **Apply Button**: Updates pricing calculations and closes modal

#### State: Price Calculation Loading
**Visual Changes**:
- **Price Shimmer**: Animated loading placeholders for price amounts
- **Tax Calculation Message**: "Calculating taxes for [Province]..." text
- **Disabled CTAs**: Trial buttons disabled during calculation
- **Loading Indicator**: Spinner next to price breakdown section

## Trial Experience Screens

### Screen: Trial Activation

#### Purpose
Streamlined trial activation without credit card requirement, building trust.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Start Your Free Trial                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│          🎉 Start Your 14-Day Free Trial                │
│                                                        │
│  Get full access to Family Plan features               │
│  No credit card required • Cancel anytime              │
│                                                        │
│  ┌─ What You Get ─────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ✅ Unlimited family members                      │ │
│  │  ✅ Advanced calendar sync                        │ │
│  │  ✅ Real-time collaboration                       │ │
│  │  ✅ Emergency contact management                  │ │
│  │  ✅ Family communication hub                      │ │
│  │  ✅ Priority Canadian support                     │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Trial Information ─────────────────────────────────┐ │
│  │                                                    │ │
│  │  📅 Trial Period: 14 days                         │ │
│  │  📧 Email: sarah.chen@example.ca                  │ │
│  │  💳 Payment: Not required for trial               │ │
│  │                                                    │ │
│  │  [📧 Change Email]                                │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ What Happens Next ─────────────────────────────────┐ │
│  │                                                    │ │
│  │  1️⃣ Immediate access to all Family Plan features  │ │
│  │  2️⃣ Email reminders about your trial progress     │ │
│  │  3️⃣ Optional upgrade prompt 2 days before expiry  │ │
│  │  4️⃣ Automatic return to free plan if no action    │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Activate Free Trial ─────────────────────────────────┐ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                        │
│  📋 By continuing, you agree to our Terms of Service   │
│      and Privacy Policy                                │
│                                                        │
│  ❓ Questions about the trial? [Contact Support]       │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default
**Visual Specifications**:
- **Celebration Icon**: Large party emoji or celebration icon at top
- **Header Text**: H2 typography in `Primary-600` color
- **Subtitle**: Body Large in `Neutral-600` with key benefit messaging
- **Feature List**: White card with checkmarks in `Success-500`
- **Trial Info Card**: Light blue background (`Primary-50`) with border
- **Process Steps**: Numbered list with emoji indicators
- **CTA Button**: Large primary button, full-width on mobile
- **Legal Text**: Caption in `Neutral-500` with linked terms
- **Support Link**: Underlined text link in `Primary-600`

**Interaction Elements**:
- **Change Email Button**: Opens email editing modal
- **Activate Trial Button**: Processes trial activation with loading state
- **Terms Links**: Open legal document modals
- **Contact Support**: Opens support chat widget

#### State: Email Edit Modal
**Visual Changes**:
- **Modal Overlay**: Centered modal for email address editing
- **Email Input**: Text input with current email pre-filled
- **Validation**: Real-time email format validation
- **Save/Cancel**: Action buttons to update or cancel changes

#### State: Activating Trial
**Visual Changes**:
- **Loading Spinner**: Spinner replaces button content
- **Button Text**: Changes to "Activating Your Trial..."
- **Disabled State**: All other interactive elements disabled
- **Progress Message**: "Setting up your premium features..." text appears

#### State: Activation Success
**Visual Changes**:
- **Success Animation**: Checkmark animation with success colors
- **Confirmation Message**: "Trial activated! Welcome to Family Plan"
- **Next Steps**: Button to continue to trial onboarding
- **Background**: Subtle success color overlay

### Screen: Trial Onboarding

#### Purpose
Guided introduction to premium features during trial period.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [Skip Tour] Welcome to Premium                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🎯 Let's Get You Started with Premium Features        │
│                                                        │
│  Your 14-day trial is active! Here's how to get       │
│  the most value from your Family Plan.                │
│                                                        │
│  ┌─ Step 1 of 4: Add Family Members ─────────────────┐ │
│  │                                                   │ │
│  │         👨‍👩‍👧‍👦 Add Your Family                      │ │
│  │                                                   │ │
│  │  Now you can add unlimited family members!       │ │
│  │  Each person gets their own account and access.  │ │
│  │                                                   │ │
│  │  Family members added: 3                         │ │
│  │  ▓▓▓░░░░░░░ (You can add many more!)             │ │
│  │                                                   │ │
│  │  ┌─ Add Family Member ─┐  ┌─ Skip This Step ─┐   │ │
│  │  │                    │  │                  │   │ │
│  │  └────────────────────┘  └──────────────────┘   │ │
│  │                                                   │ │
│  │  💡 Tip: Add grandparents, babysitters, and      │ │
│  │     other caregivers who help with your kids     │ │
│  │                                                   │ │
│  └───────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Quick Preview: What's Coming Next ────────────────┐ │
│  │                                                    │ │
│  │  📅 Step 2: Advanced Calendar Sync                │ │
│  │  💬 Step 3: Family Communication Setup            │ │
│  │  🆘 Step 4: Emergency Contact Management          │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ⏰ Trial Progress: Day 1 of 14                        │
│  🎁 All premium features unlocked                      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Step 1 - Family Members
**Visual Specifications**:
- **Step Indicator**: Progress indicator showing current step (1 of 4)
- **Feature Icon**: Large family emoji with colorful treatment
- **Benefit Messaging**: Clear explanation of premium feature advantage
- **Progress Visualization**: Progress bar showing current family member count
- **Action Buttons**: Primary action to use feature, secondary to skip
- **Tip Section**: Light background with helpful usage suggestions
- **Preview Card**: Shows upcoming onboarding steps
- **Trial Status**: Progress indicator at bottom with days remaining

**Interaction Elements**:
- **Add Family Member**: Opens family member invitation flow
- **Skip This Step**: Proceeds to next onboarding step
- **Skip Tour**: Exits onboarding to main premium experience

#### State: Step 2 - Calendar Sync
**Visual Changes**:
- **Progress**: Step indicator updates to 2 of 4
- **Feature Focus**: Calendar sync interface and benefits
- **Integration Options**: Shows available calendar service integrations
- **Action Items**: Connect calendar accounts or skip to next step

#### State: Step 3 - Communication
**Visual Changes**:
- **Progress**: Step indicator updates to 3 of 4  
- **Feature Focus**: Family communication hub setup
- **Demo Content**: Shows example family conversations and coordination
- **Action Items**: Send first family message or skip step

#### State: Step 4 - Emergency Contacts
**Visual Changes**:
- **Progress**: Step indicator updates to 4 of 4
- **Feature Focus**: Emergency contact management system
- **Safety Emphasis**: Highlights family safety and preparedness benefits
- **Action Items**: Add emergency contacts or complete onboarding

#### State: Onboarding Complete
**Visual Changes**:
- **Success Celebration**: Completion animation with success messaging
- **Achievement Summary**: Shows features activated during onboarding
- **Next Steps**: Recommendations for continued premium feature exploration
- **CTA**: Button to start using premium features

### Screen: Trial Progress Tracking

#### Purpose
Keep users engaged during trial with progress tracking and value demonstration.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [☰ Menu] Your Premium Trial                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ⏰ Trial Day 8 of 14                                   │
│  ▓▓▓▓▓▓▓▓░░░░░░ 57% Complete                            │
│                                                        │
│  🎯 You're Getting Great Value!                         │
│                                                        │
│  ┌─ Your Trial Statistics ─────────────────────────────┐ │
│  │                                                    │ │
│  │  💫 Premium Features Used                         │ │
│  │  ┌─ Advanced Calendar ─┐  ┌─ Family Chat ───┐     │ │
│  │  │  ✅ 15 syncs       │  │  ✅ 23 messages │     │ │
│  │  │  Saved: 2.5 hrs   │  │  Saved: 1 hr    │     │ │
│  │  └───────────────────┘  └─────────────────┘     │ │
│  │                                                    │ │
│  │  ┌─ Emergency Contacts ┐  ┌─ Family Members ┐     │ │
│  │  │  ✅ 8 contacts     │  │  ✅ 5 members    │     │ │
│  │  │  Peace of mind     │  │  Full coverage   │     │ │
│  │  └───────────────────┘  └─────────────────┘     │ │
│  │                                                    │ │
│  │  🕐 Total Time Saved This Week: 4.5 hours         │ │
│  │  💰 Value Received: $67.50 CAD worth of time      │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Features You Haven't Tried Yet ───────────────────┐ │
│  │                                                    │ │
│  │  📊 Family Analytics                              │ │
│  │  See patterns in your family's schedule           │ │
│  │  [Try Now]                                        │ │
│  │                                                    │ │
│  │  🎯 Smart Conflict Detection                      │ │
│  │  Automatically prevent scheduling conflicts       │ │
│  │  [Try Now]                                        │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ✨ Keep Your Premium Features                         │
│  Continue with Family Plan for $19.99/month CAD       │
│  (Converts automatically in 6 days unless cancelled)  │
│                                                        │
│  ┌─ Continue Premium ─┐  ┌─ Manage Trial ──┐          │
│  │                   │  │                 │          │
│  └───────────────────┘  └─────────────────┘          │
│                                                        │
│  📞 Questions? Chat with our Canadian support team     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Mid-Trial (Day 8)
**Visual Specifications**:
- **Progress Bar**: Visual progress indicator with percentage completion
- **Trial Status**: Clear day count with remaining time emphasis
- **Value Celebration**: Positive messaging about benefits received
- **Statistics Cards**: Grid layout showing feature usage metrics
- **Time Saved Metrics**: Prominent display of quantified time savings
- **Value Calculation**: Monetary value representation of time saved
- **Unused Features**: Encouraging cards for feature discovery
- **Conversion Messaging**: Soft promotion for continuing premium
- **CTA Buttons**: Primary for conversion, secondary for trial management
- **Support Access**: Easy access to Canadian customer support

**Interaction Elements**:
- **Try Now Buttons**: Direct links to unused premium features
- **Continue Premium**: Opens subscription setup flow
- **Manage Trial**: Opens trial settings and cancellation options
- **Support Chat**: Opens live chat with Canadian support team

#### State: Trial Ending Soon (Day 12)
**Visual Changes**:
- **Urgency Indicators**: Progress bar in warning colors, emphasis on remaining time
- **Conversion Focus**: More prominent subscription messaging
- **Value Reinforcement**: Stronger emphasis on benefits gained during trial
- **Action Required**: Clear indication that decision is needed soon

#### State: Trial Expired
**Visual Changes**:
- **Expiration Notice**: Clear messaging that trial has ended
- **Feature Restrictions**: Visual indicators of features now unavailable
- **Upgrade Options**: Prominent upgrade buttons with special offers
- **Free Plan Return**: Explanation of current free plan limitations

## Pricing and Payment Screens

### Screen: Subscription Selection

#### Purpose
Clear subscription tier selection with transparent Canadian pricing.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Choose Your Subscription                       │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🇨🇦 Pricing for British Columbia, Canada              │
│  HST will be calculated at checkout                    │
│                                                        │
│  ┌─ MOST POPULAR ──────────────────────────────────────┐ │
│  │                                                    │ │
│  │         Family Plan - $19.99/month CAD            │ │
│  │                                                    │ │
│  │  Perfect for growing families                     │ │
│  │                                                    │ │
│  │  ✓ Unlimited family members                       │ │
│  │  ✓ Advanced calendar sync                         │ │
│  │  ✓ Real-time collaboration                        │ │
│  │  ✓ Emergency contact management                   │ │
│  │  ✓ Family communication hub                       │ │
│  │  ✓ Priority Canadian support                      │ │
│  │  ✓ Canadian tax receipts                          │ │
│  │                                                    │ │
│  │  Billing Options:                                 │ │
│  │  ◯ Monthly: $19.99/month                          │ │
│  │  ● Yearly: $199.99/year (Save $39.89!)           │ │
│  │                                                    │ │
│  │  ┌─ Select Family Plan ─────────────────────────┐  │ │
│  │  │                                             │  │ │
│  │  └─────────────────────────────────────────────┘  │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Professional Plan - $34.99/month CAD ─────────────┐ │
│  │                                                    │ │
│  │  For power users and large families               │ │
│  │                                                    │ │
│  │  ✓ Everything in Family Plan, plus:               │ │
│  │  ✓ Advanced analytics & insights                  │ │
│  │  ✓ API access for custom integrations             │ │
│  │  ✓ Priority phone support                         │ │
│  │  ✓ Multiple family unit management                │ │
│  │  ✓ Business tax receipts                          │ │
│  │                                                    │ │
│  │  Billing Options:                                 │ │
│  │  ◯ Monthly: $34.99/month                          │ │
│  │  ● Yearly: $349.99/year (Save $69.89!)           │ │
│  │                                                    │ │
│  │  ┌─ Select Professional Plan ──────────────────┐   │ │
│  │  │                                            │   │ │
│  │  └────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  🛡️ All plans include:                                 │
│  • 30-day money-back guarantee                        │
│  • Cancel anytime, no penalties                       │
│  • Secure payment processing by Stripe                │
│  • Canadian customer support                          │
│                                                        │
│  📞 Need help choosing? [Chat with Support]            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Family Plan Selected
**Visual Specifications**:
- **Most Popular Badge**: Prominent ribbon badge on Family Plan card
- **Plan Cards**: White cards with `Primary-200` border for selected plan
- **Pricing Display**: Large, clear CAD pricing with currency emphasis
- **Feature Lists**: Organized with checkmarks in `Success-500` color
- **Billing Toggle**: Radio button selection for monthly vs yearly
- **Savings Callout**: Green highlight for yearly savings amount
- **CTA Buttons**: Primary button for selected plan, secondary for others
- **Trust Elements**: Guarantee and security badges at bottom
- **Support Access**: Prominent support chat access

**Interaction Elements**:
- **Plan Selection**: Clicking plan cards updates selection state
- **Billing Toggle**: Radio buttons change pricing calculations
- **CTA Buttons**: Navigate to payment information screen
- **Support Chat**: Opens live chat for plan selection help

#### State: Yearly Billing Selected
**Visual Changes**:
- **Pricing Update**: Updates to yearly amounts with savings highlighted
- **Savings Badge**: Prominent savings callout in `Success-500` background
- **Payment Frequency**: Updates billing frequency throughout interface

#### State: Professional Plan Selected
**Visual Changes**:
- **Selection Update**: Professional plan card gains selected styling
- **Feature Emphasis**: Professional-specific features highlighted
- **CTA Update**: Primary button moves to Professional plan

### Screen: Payment Information

#### Purpose
Secure payment data collection with Canadian billing requirements.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Payment Information                            │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🔒 Secure Payment Processing                           │
│                                                        │
│  ┌─ Order Summary ──────────────────────────────────────┐ │
│  │                                                    │ │
│  │  Family Plan - Yearly Billing                     │ │
│  │                                                    │ │
│  │  Subtotal:                    $199.99 CAD         │ │
│  │  BC HST (12%):                 $24.00 CAD         │ │
│  │  ─────────────────────────────  ──────────         │ │
│  │  Total Today:                 $223.99 CAD         │ │
│  │                                                    │ │
│  │  Next billing: January 15, 2026                   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Payment Method ──────────────────────────────────────┐ │
│  │                                                    │ │
│  │  💳 Credit/Debit Card                             │ │
│  │                                                    │ │
│  │  Card Number                                       │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │ •••• •••• •••• 1234                       │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │  Expiry Date      Security Code                    │ │
│  │  ┌──────────┐    ┌─────────┐                      │ │
│  │  │ MM / YY  │    │  CVC   │                      │ │
│  │  └──────────┘    └─────────┘                      │ │
│  │                                                    │ │
│  │  Cardholder Name                                   │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │ Sarah Chen                                  │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │  🍁 Alternative Payment Methods:                  │ │
│  │  ◯ Interac Online   ◯ Pre-authorized Debit       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Canadian Billing Address ───────────────────────────┐ │
│  │                                                    │ │
│  │  Required for tax calculation and receipts        │ │
│  │                                                    │ │
│  │  Street Address                                    │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │ 123 Maple Street                           │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │  City            Province        Postal Code       │ │
│  │  ┌─────────────┐ ┌──────────┐   ┌─────────┐       │ │
│  │  │ Vancouver   │ │ BC    ▼  │   │ V6B 1A1 │       │ │
│  │  └─────────────┘ └──────────┘   └─────────┘       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ☑️ I agree to the Terms of Service and Privacy Policy │
│  ☑️ I consent to receive billing emails and receipts   │
│                                                        │
│  ┌─ Complete Purchase ──────────────────────────────────┐ │
│  │           $223.99 CAD                              │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  🔐 Secured by Stripe • Your payment info is encrypted │
│  🇨🇦 Questions? Contact our Canadian support team      │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default Form
**Visual Specifications**:
- **Security Badge**: Prominent security messaging with lock icon
- **Order Summary**: Clear pricing breakdown with tax calculations
- **Payment Form**: Stripe-powered card input with Canadian styling
- **Alternative Payments**: Canadian payment method options
- **Billing Address**: Required Canadian address collection
- **Province Dropdown**: Canadian provinces and territories list
- **Consent Checkboxes**: Required legal agreement checkboxes
- **CTA Button**: Large purchase button with total amount
- **Trust Indicators**: Security and support messaging at bottom

**Interaction Elements**:
- **Card Input**: Real-time validation and formatting
- **Province Selection**: Updates tax calculation when changed
- **Payment Method Toggle**: Switches between card and alternative methods
- **Complete Purchase**: Processes payment with loading states

#### State: Form Validation
**Visual Changes**:
- **Field Errors**: Red border and error text for invalid fields
- **Real-time Validation**: Immediate feedback on card number format
- **Required Indicators**: Red asterisks for required fields
- **Postal Code Validation**: Canadian postal code format validation

#### State: Processing Payment
**Visual Changes**:
- **Loading State**: Spinner on purchase button with "Processing..." text
- **Disabled Form**: All form fields disabled during processing
- **Progress Indicator**: "Securely processing your payment..." message
- **Background Overlay**: Prevents user interaction during payment

#### State: Payment Failed
**Visual Changes**:
- **Error Banner**: Red error message at top of form
- **Error Details**: Specific error message from payment processor
- **Retry Options**: Clear instructions for resolving payment issues
- **Support Access**: Prominent link to payment support

### Screen: Canadian Tax Calculation

#### Purpose
Transparent tax calculation display for all Canadian provinces.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Tax Information                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  📋 Canadian Tax Calculation                            │
│                                                        │
│  Your subscription pricing includes all applicable     │
│  Canadian taxes based on your billing province.       │
│                                                        │
│  ┌─ Current Location: Ontario ─────────────────────────┐ │
│  │                                                    │ │
│  │  📍 Based on postal code: K1A 0A6                 │ │
│  │  🏛️ Tax jurisdiction: Ontario                      │ │
│  │                                                    │ │
│  │  [Change Province/Territory]                       │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Tax Breakdown - Family Plan ───────────────────────┐ │
│  │                                                    │ │
│  │  Plan Pricing                                      │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  Base subscription:           $19.99 CAD          │ │
│  │                                                    │ │
│  │  Canadian Taxes                                    │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  HST (13%):                    $2.60 CAD          │ │
│  │                                                    │ │
│  │  Total Monthly Payment                             │ │
│  │  ─────────────────────────────────────────────────  │ │
│  │  Total:                       $22.59 CAD          │ │
│  │                                                    │ │
│  │  📧 Tax receipts will be emailed monthly           │ │
│  │  📄 Business tax receipts available upon request   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Tax Information by Province ───────────────────────┐ │
│  │                                                    │ │
│  │  Select your province to see applicable taxes:    │ │
│  │                                                    │ │
│  │  Alberta (AB)         - GST: 5%    = $1.00        │ │
│  │  British Columbia     - HST: 12%   = $2.40        │ │
│  │  Manitoba (MB)        - GST+PST: 12% = $2.40      │ │
│  │  New Brunswick (NB)   - HST: 15%   = $3.00        │ │
│  │  Newfoundland (NL)    - HST: 15%   = $3.00        │ │
│  │  Nova Scotia (NS)     - HST: 15%   = $3.00        │ │
│  │  Ontario (ON)         - HST: 13%   = $2.60        │ │
│  │  Prince Edward Is.    - HST: 15%   = $3.00        │ │
│  │  Quebec (QC)          - GST+QST: 15% = $3.00      │ │
│  │  Saskatchewan (SK)    - GST+PST: 11% = $2.20      │ │
│  │  Northwest Terr.      - GST: 5%    = $1.00        │ │
│  │  Nunavut (NU)         - GST: 5%    = $1.00        │ │
│  │  Yukon (YT)           - GST: 5%    = $1.00        │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ℹ️ Tax Information                                     │
│  • Taxes are automatically calculated and collected   │ │
│  • Tax receipts are provided for all payments         │ │
│  • Business users can request detailed tax receipts   │ │
│  • All taxes are remitted to appropriate authorities  │ │
│                                                        │
│  📞 Tax questions? Contact our Canadian support team   │ │
│                                                        │
│  ┌─ Continue to Payment ─────────────────────────────────┐ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Default (Ontario)
**Visual Specifications**:
- **Location Display**: Current province with postal code reference
- **Tax Breakdown**: Clear separation of base price and taxes
- **Province Selector**: Interactive element to change location
- **Tax Table**: Complete breakdown for all Canadian jurisdictions
- **Current Selection**: Highlighted row in tax table for user's province
- **Information Section**: Educational content about tax handling
- **CTA Button**: Continue to payment with current tax calculation

**Interaction Elements**:
- **Change Province**: Opens province selection modal
- **Province Table**: Interactive rows that update calculations
- **Continue Button**: Proceeds to payment with selected tax rate
- **Support Contact**: Opens tax-specific support chat

#### State: Province Selection
**Visual Changes**:
- **Modal Interface**: Overlay with searchable province list
- **Tax Rate Display**: Shows tax rate next to each province option
- **Real-time Update**: Pricing updates immediately upon selection
- **Confirmation**: "Update taxes for [Province]" confirmation button

#### State: Tax Calculation Loading
**Visual Changes**:
- **Loading Spinner**: Animated loading for tax calculation
- **Calculation Message**: "Calculating taxes for [Province]..." text
- **Disabled Interface**: Form elements disabled during calculation
- **Progress Indicator**: Shows tax rate retrieval and calculation status

## Confirmation and Activation Screens

### Screen: Purchase Success

#### Purpose
Celebrate successful subscription activation and guide users to premium features.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [✓] Purchase Successful                                 │
├────────────────────────────────────────────────────────┤
│                                                        │
│          🎉 Welcome to NestSync Premium!                │
│                                                        │
│  Your Family Plan is now active and ready to use!     │
│                                                        │
│  ┌─ Purchase Confirmation ──────────────────────────────┐ │
│  │                                                    │ │
│  │  📧 Receipt sent to: sarah.chen@example.ca        │ │
│  │  💳 Payment method: •••• •••• •••• 1234           │ │
│  │  📅 Next billing: January 15, 2026                │ │
│  │  💰 Amount charged: $223.99 CAD                   │ │
│  │                                                    │ │
│  │  🔗 Transaction ID: sub_1234567890                │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ✨ Your Premium Features Are Now Active               │
│                                                        │
│  ┌─ What's New for You ─────────────────────────────────┐ │
│  │                                                    │ │
│  │  🔓 Unlimited family members                      │ │
│  │  📅 Advanced calendar sync                        │ │
│  │  💬 Family communication hub                      │ │
│  │  🆘 Emergency contact management                  │ │
│  │  📊 Family analytics & insights                   │ │
│  │  🎯 Smart conflict detection                      │ │
│  │  📞 Priority Canadian support                     │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  📱 Next Steps                                         │
│                                                        │
│  1. Explore your new premium features                  │
│  2. Invite more family members                         │
│  3. Set up advanced calendar sync                      │
│  4. Configure emergency contacts                       │
│                                                        │
│  ┌─ Start Using Premium ─┐  ┌─ View Receipt ─┐         │
│  │                      │  │               │         │
│  └──────────────────────┘  └───────────────┘         │
│                                                        │
│  💡 Need help getting started? Our Canadian support    │
│     team is here to help you make the most of your    │
│     premium features.                                  │
│                                                        │
│  📞 [Chat with Support]  📧 [Email Support]            │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Success Confirmation
**Visual Specifications**:
- **Celebration Header**: Party emoji with success messaging in `Success-600`
- **Confirmation Card**: White card with purchase details in organized layout
- **Receipt Information**: Complete transaction details with formatting
- **Feature Activation**: Visual list of newly activated premium features
- **Feature Icons**: Colorful icons representing each premium capability
- **Next Steps**: Numbered checklist for premium feature exploration
- **Action Buttons**: Primary button for feature exploration, secondary for receipt
- **Support Section**: Prominent support access with multiple contact options

**Interaction Elements**:
- **Start Using Premium**: Navigates to premium onboarding experience
- **View Receipt**: Opens detailed receipt modal or downloads PDF
- **Support Buttons**: Open chat widget or email support contact
- **Feature List Items**: Optional links to specific premium feature tutorials

#### State: Receipt Modal
**Visual Changes**:
- **Modal Overlay**: Full-screen receipt display with Canadian formatting
- **Detailed Breakdown**: Complete itemization including taxes and fees
- **Business Information**: Company registration numbers and tax IDs
- **Download Options**: PDF download and email receipt buttons

#### State: Onboarding Transition
**Visual Changes**:
- **Transition Animation**: Smooth transition to premium feature onboarding
- **Welcome Message**: "Let's get you started with your premium features!"
- **Feature Preview**: Quick preview of first premium feature to explore

### Screen: Premium Feature Activation

#### Purpose
Guide users through activating and exploring their new premium features.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [Skip] Premium Feature Setup                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  🚀 Let's Activate Your Premium Features!              │
│                                                        │
│  Take a few minutes to set up your premium features    │
│  and get the most value from your Family Plan.        │
│                                                        │
│  ┌─ Setup Progress: 1 of 4 ─────────────────────────────┐ │
│  │ ▓▓▓░░░░░░░░░░░░░ 25% Complete                      │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ 👥 Add More Family Members ─────────────────────────┐ │
│  │                                                    │ │
│  │  Now you can add unlimited family members!        │ │
│  │                                                    │ │
│  │  Current family members: 3                        │ │
│  │  ┌─ Sarah Chen ────────────┐ ┌─ Parent ─────────┐  │ │
│  │  │ sarah.chen@example.ca  │ │ Account Owner   │  │ │
│  │  └────────────────────────┘ └─────────────────┘  │ │
│  │                                                    │ │
│  │  ┌─ David Chen ────────────┐ ┌─ Parent ─────────┐  │ │
│  │  │ david.chen@example.ca  │ │ Co-Parent       │  │ │
│  │  └────────────────────────┘ └─────────────────┘  │ │
│  │                                                    │ │
│  │  ┌─ Emma Chen ─────────────┐ ┌─ Child ──────────┐  │ │
│  │  │ Age: 12               │ │ Limited Access  │  │ │
│  │  └───────────────────────┘ └─────────────────┘  │ │
│  │                                                    │ │
│  │  Who else helps with your family?                 │ │
│  │                                                    │ │
│  │  ┌─ Add Family Member ──────────────────────────┐   │ │
│  │  │ + Grandparent, Babysitter, or Caregiver    │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  │  ┌─ Continue Setup ─┐  ┌─ Skip This Step ──────┐   │ │
│  │  │                │  │                        │   │ │
│  │  └────────────────┘  └────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  📋 Coming Next:                                       │
│  • Advanced calendar sync setup                       │
│  • Family communication preferences                    │ │
│  • Emergency contact management                        │ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Step 1 - Family Members
**Visual Specifications**:
- **Progress Indicator**: Visual progress bar showing setup completion
- **Step Header**: Large emoji with clear step description
- **Current Members**: Cards showing existing family member information
- **Role Badges**: Color-coded badges indicating family member roles
- **Add Member CTA**: Prominent button for expanding family access
- **Action Buttons**: Primary continue button, secondary skip option
- **Preview Section**: Shows upcoming setup steps

**Interaction Elements**:
- **Add Family Member**: Opens family member invitation interface
- **Continue Setup**: Proceeds to next setup step
- **Skip This Step**: Advances setup without adding members
- **Member Cards**: Optional edit functionality for existing members

#### State: Step 2 - Calendar Integration
**Visual Changes**:
- **Progress Update**: Progress bar updates to 50% completion
- **Calendar Focus**: Interface shows available calendar integration options
- **Service Selection**: Google Calendar, Apple Calendar, Outlook options
- **Sync Settings**: Configuration options for calendar synchronization

#### State: Step 3 - Communication Setup
**Visual Changes**:
- **Progress Update**: Progress bar updates to 75% completion
- **Communication Focus**: Family messaging and notification preferences
- **Notification Settings**: Granular control over family communication
- **Privacy Options**: Configuration of family communication visibility

#### State: Step 4 - Emergency Contacts
**Visual Changes**:
- **Progress Update**: Progress bar updates to 100% completion
- **Safety Focus**: Emergency contact and medical information setup
- **Contact Categories**: Different types of emergency contacts
- **Completion Path**: Final setup completion and success messaging

#### State: Setup Complete
**Visual Changes**:
- **Success Celebration**: Completion animation with achievement messaging
- **Feature Summary**: Overview of activated and configured features
- **Next Actions**: Recommendations for continued premium feature exploration
- **Graduation**: Transition to full premium experience interface

## Account Management Screens

### Screen: Subscription Dashboard

#### Purpose
Central hub for subscription management, billing, and account settings.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Account Settings                               │
├────────────────────────────────────────────────────────┤
│                                                        │
│  👤 Sarah Chen's Account                                │
│  sarah.chen@example.ca                                 │
│                                                        │
│  ┌─ Current Subscription ───────────────────────────────┐ │
│  │                                                    │ │
│  │  🌟 Family Plan - Premium Subscriber              │ │
│  │                                                    │ │
│  │  Status: ✅ Active                                │ │
│  │  Next billing: January 15, 2026                   │ │
│  │  Amount: $223.99 CAD (includes HST)               │ │
│  │  Payment method: •••• •••• •••• 1234              │ │
│  │                                                    │ │
│  │  ┌─ Manage Plan ──┐ ┌─ Update Payment ─┐          │ │
│  │  │              │ │                   │          │ │
│  │  └──────────────┘ └───────────────────┘          │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Family Sharing ──────────────────────────────────────┐ │
│  │                                                    │ │
│  │  👨‍👩‍👧‍👦 5 family members sharing premium features    │ │
│  │                                                    │ │
│  │  ┌─ Sarah Chen ──────────┐ ┌─ Account Owner ────┐   │ │
│  │  │ sarah.chen@...       │ │ Full Access       │   │ │
│  │  └──────────────────────┘ └───────────────────┘   │ │
│  │                                                    │ │
│  │  ┌─ David Chen ──────────┐ ┌─ Co-Parent ─────────┐  │ │
│  │  │ david.chen@...       │ │ Full Access       │  │ │
│  │  └──────────────────────┘ └───────────────────┘  │ │
│  │                                                    │ │
│  │  ┌─ Emma Chen ───────────┐ ┌─ Child (12) ──────┐   │ │
│  │  │ Limited Account      │ │ Limited Access    │   │ │
│  │  └──────────────────────┘ └───────────────────┘   │ │
│  │                                                    │ │
│  │  ┌─ Manage Family Sharing ──────────────────────┐   │ │
│  │  │                                             │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Usage & Analytics ──────────────────────────────────┐ │
│  │                                                    │ │
│  │  📊 This Month's Premium Value                     │ │
│  │                                                    │ │
│  │  ⏰ Time saved: 18.5 hours                        │ │
│  │  💰 Value received: $277.50 CAD worth             │ │
│  │  🎯 Features used: 8 of 12 premium features       │ │
│  │                                                    │ │
│  │  ┌─ View Detailed Analytics ───────────────────┐   │ │
│  │  │                                            │   │ │
│  │  └────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Billing & Receipts ──────────────────────────────────┐ │
│  │                                                    │ │
│  │  📧 Recent Invoices                               │ │
│  │                                                    │ │
│  │  Dec 2025    $223.99 CAD    [View] [Download]     │ │
│  │  Nov 2025    $223.99 CAD    [View] [Download]     │ │
│  │  Oct 2025    $223.99 CAD    [View] [Download]     │ │
│  │                                                    │ │
│  │  ┌─ View All Billing History ──────────────────┐   │ │
│  │  │                                            │   │ │
│  │  └────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Account Actions ─────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ⚙️ [Account Settings]  📞 [Contact Support]      │ │
│  │  💳 [Payment Methods]   📄 [Download Tax Receipt] │ │
│  │  ⬇️ [Downgrade Plan]     ❌ [Cancel Subscription] │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Active Subscription
**Visual Specifications**:
- **Account Header**: User information with email display
- **Subscription Card**: Status, billing date, amount with tax inclusion
- **Payment Display**: Masked card information with update options
- **Family Sharing**: Grid of family members with role indicators
- **Usage Analytics**: Value metrics and feature utilization statistics
- **Billing History**: Recent invoices with view/download options
- **Action Grid**: Organized action buttons for account management

**Interaction Elements**:
- **Manage Plan**: Opens plan change and upgrade options
- **Update Payment**: Accesses payment method management
- **Family Sharing**: Manages family member access and permissions
- **Analytics View**: Opens detailed usage analytics dashboard
- **Billing Actions**: Invoice viewing, downloading, and history access
- **Account Actions**: Various account management and support options

#### State: Payment Update Modal
**Visual Changes**:
- **Modal Interface**: Secure payment method update interface
- **Current Method**: Shows current payment method with masked information
- **New Payment**: Form for adding or updating payment information
- **Verification**: Security verification for payment method changes

#### State: Plan Change Interface
**Visual Changes**:
- **Plan Comparison**: Current plan vs available upgrade/downgrade options
- **Impact Calculation**: Prorated billing calculation for plan changes
- **Effective Date**: Clear indication of when plan change takes effect
- **Confirmation**: Multi-step confirmation for plan modifications

## Error and Edge Case Screens

### Screen: Payment Failure

#### Purpose
Handle payment failures with clear guidance and recovery options.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Payment Issue                                  │
├────────────────────────────────────────────────────────┤
│                                                        │
│          ⚠️ Payment Could Not Be Processed              │
│                                                        │
│  We encountered an issue processing your payment.      │
│  Don't worry - your account is still active and we     │
│  can help you resolve this quickly.                    │
│                                                        │
│  ┌─ Issue Details ──────────────────────────────────────┐ │
│  │                                                    │ │
│  │  ❌ Payment declined                               │ │
│  │                                                    │ │
│  │  Transaction attempted: Today at 2:34 PM           │ │
│  │  Payment method: •••• •••• •••• 1234               │ │
│  │  Amount: $223.99 CAD                               │ │
│  │  Error code: card_declined                         │ │
│  │                                                    │ │
│  │  Reason: Insufficient funds or card limit reached  │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  🛠️ How to Fix This                                    │
│                                                        │
│  ┌─ Option 1: Try Different Payment Method ────────────┐ │
│  │                                                    │ │
│  │  💳 Use a different credit or debit card          │ │
│  │  🏦 Try Interac Online or Pre-authorized Debit    │ │
│  │                                                    │ │
│  │  ┌─ Update Payment Method ────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Option 2: Contact Your Bank ───────────────────────┐ │
│  │                                                    │ │
│  │  📞 Call your card issuer to:                     │ │
│  │  • Verify sufficient funds are available          │ │
│  │  • Confirm the card isn't blocked for online use  │ │
│  │  • Check if there are any spending limits         │ │
│  │                                                    │ │
│  │  Then try the payment again                       │ │
│  │                                                    │ │
│  │  ┌─ Retry Payment ─────────────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ⏰ Your Premium Access                                 │
│                                                        │
│  Your premium features remain active for 3 more days  │
│  while you resolve this payment issue. After that,    │
│  your account will return to the free plan.           │ │
│                                                        │
│  📞 Need Help? Our Canadian support team is here       │
│     to assist with payment issues.                     │
│                                                        │
│  ┌─ Contact Support ──┐  ┌─ Live Chat ────┐           │
│  │                   │  │                │           │
│  └───────────────────┘  └────────────────┘           │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Card Declined
**Visual Specifications**:
- **Warning Header**: Warning icon with clear issue description
- **Reassurance Messaging**: Calming language about account status
- **Issue Details Card**: Technical details in organized format
- **Solution Options**: Clear, actionable steps for resolution
- **Grace Period Info**: Transparent communication about account status
- **Support Access**: Prominent support contact options
- **Action Buttons**: Primary buttons for payment resolution steps

**Interaction Elements**:
- **Update Payment Method**: Opens secure payment method update flow
- **Retry Payment**: Attempts payment with current method again
- **Contact Support**: Opens support chat or phone contact options
- **Live Chat**: Immediate access to payment support specialists

#### State: Network Error
**Visual Changes**:
- **Connection Issue**: Different messaging for network-related failures
- **Retry Options**: Automatic retry mechanism with manual override
- **Offline Mode**: Guidance for handling connectivity issues
- **Status Updates**: Real-time connection status indicators

#### State: Temporary Service Issue
**Visual Changes**:
- **Service Status**: Messaging about temporary payment processing issues
- **Automatic Retry**: Information about automatic payment retry schedules
- **Alternative Actions**: Options to try payment later or contact support
- **Service Updates**: Links to service status page or updates

### Screen: Subscription Cancellation

#### Purpose
Provide clear cancellation process while offering retention options.

#### Layout Structure
```
┌─ Navigation Header ─────────────────────────────────────┐
│ [← Back] Cancel Subscription                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  😔 We're Sorry to See You Go                          │
│                                                        │
│  Before you cancel, let us know if there's anything    │
│  we can do to improve your NestSync experience.        │
│                                                        │
│  ┌─ Why Are You Cancelling? ───────────────────────────┐ │
│  │                                                    │ │
│  │  ◯ Too expensive for my budget                     │ │
│  │  ◯ Not using enough premium features               │ │
│  │  ◯ Found a better alternative                      │ │
│  │  ◯ Technical issues or bugs                        │ │
│  │  ◯ Missing features I need                         │ │
│  │  ◯ Family no longer needs organization tools       │ │
│  │  ◯ Other reason                                    │ │
│  │                                                    │ │
│  │  Additional comments (optional):                   │ │
│  │  ┌─────────────────────────────────────────────┐   │ │
│  │  │                                             │   │ │
│  │  │                                             │   │ │
│  │  └─────────────────────────────────────────────┘   │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  💡 Before You Cancel - Consider These Options         │
│                                                        │
│  ┌─ Option 1: Downgrade to Free Plan ─────────────────┐ │
│  │                                                    │ │
│  │  Keep using NestSync with basic features:         │ │
│  │  ✓ Up to 3 family members                        │ │
│  │  ✓ Basic calendar and task management            │ │
│  │  ✓ Core family organization tools                │ │
│  │                                                    │ │
│  │  ┌─ Switch to Free Plan ──────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ┌─ Option 2: Pause Your Subscription ────────────────┐ │
│  │                                                    │ │
│  │  Take a break and resume later:                   │ │
│  │  • Pause for 1-6 months                          │ │
│  │  • Keep your data and settings                    │ │
│  │  • Resume anytime at the same price              │ │
│  │                                                    │ │
│  │  ┌─ Pause Subscription ───────────────────────────┐ │ │
│  │  │                                              │ │ │
│  │  └──────────────────────────────────────────────┘ │ │
│  │                                                    │ │
│  └────────────────────────────────────────────────────┘ │
│                                                        │
│  ⚠️ If You Still Want to Cancel                        │
│                                                        │
│  • Cancellation is effective immediately              │ │
│  • No refund for remaining subscription period        │ │
│  • Premium features will be disabled immediately      │ │
│  • Your data will be preserved but some may be hidden │ │
│  • You can resubscribe anytime                        │ │
│                                                        │
│  ┌─ Cancel Subscription ─┐  ┌─ Keep Premium ──────────┐ │
│  │                      │  │                        │ │
│  └──────────────────────┘  └────────────────────────┘ │
│                                                        │
│  📞 Questions? Chat with our Canadian support team     │
│                                                        │
└────────────────────────────────────────────────────────┘
```

#### State: Cancellation Reasons
**Visual Specifications**:
- **Empathetic Header**: Sad emoji with understanding messaging
- **Feedback Form**: Radio button selection for cancellation reasons
- **Optional Comments**: Text area for additional feedback
- **Retention Options**: Alternative solutions before cancellation
- **Downgrade Option**: Clear benefits of free plan continuation
- **Pause Option**: Temporary suspension alternative
- **Cancellation Warning**: Clear consequences of cancellation
- **Action Buttons**: Destructive button for cancel, primary for retention
- **Support Access**: Final opportunity for support intervention

**Interaction Elements**:
- **Reason Selection**: Updates available retention offers based on reason
- **Downgrade Option**: Transitions to free plan without cancellation
- **Pause Subscription**: Opens subscription pause configuration
- **Final Cancellation**: Multi-step confirmation process
- **Support Contact**: Last-chance support intervention

#### State: Cancellation Confirmed
**Visual Changes**:
- **Confirmation Messaging**: Clear confirmation that cancellation is processed
- **Effective Date**: When cancellation takes effect and billing stops
- **Data Retention**: Information about data preservation and access
- **Resubscription**: Information about how to resume subscription later
- **Feedback Thanks**: Appreciation for feedback provided

#### State: Pause Configuration
**Visual Changes**:
- **Pause Options**: Duration selection for subscription pause
- **Resume Information**: Clear explanation of how resume process works
- **Billing Impact**: Explanation of billing pause and resume implications
- **Confirmation**: Final confirmation of pause settings and dates

## Responsive Design Specifications

### Mobile Design (320px - 767px)

#### Layout Adaptations
- **Single Column**: All content stacked vertically with full-width elements
- **Simplified Navigation**: Hamburger menu with slide-out navigation panel
- **Touch-Optimized**: Minimum 44px touch targets for all interactive elements
- **Reduced Padding**: 16px container padding for maximum content space
- **Sticky CTAs**: Important action buttons stick to bottom of viewport

#### Typography Adjustments
- **Smaller Headers**: H2 becomes 28px, H3 becomes 22px for mobile readability
- **Line Height**: Increased line height for better mobile reading experience
- **Touch-Friendly**: Larger touch targets for form elements and buttons

#### Component Modifications
- **Stacked Forms**: Form fields stack vertically with full-width inputs
- **Collapsed Cards**: Feature comparison cards become accordion-style
- **Modal Optimization**: Full-screen modals for better mobile experience
- **Progressive Disclosure**: More use of expandable sections to reduce scroll

### Tablet Design (768px - 1023px)

#### Layout Adaptations
- **Two-Column**: Balanced two-column layouts for optimal screen usage
- **Sidebar Navigation**: Persistent sidebar for premium upgrade navigation
- **Mixed Interaction**: Support for both touch and mouse interactions
- **Flexible Grids**: 2-3 column grids that adapt based on content

#### Enhanced Features
- **Split Views**: Side-by-side comparison views for feature analysis
- **Floating Elements**: Floating action buttons and sticky navigation
- **Hover States**: Subtle hover effects for interactive elements
- **Expanded Tooltips**: More detailed tooltip content for feature explanations

### Desktop Design (1024px+)

#### Advanced Layouts
- **Multi-Column**: 3-4 column layouts for comprehensive information display
- **Sidebar + Content**: Persistent navigation with main content areas
- **Overlay Modals**: Traditional modal overlays instead of full-screen
- **Advanced Interactions**: Keyboard shortcuts and advanced mouse interactions

#### Enhanced User Experience
- **Hover Effects**: Rich hover states and micro-interactions
- **Keyboard Navigation**: Full keyboard accessibility and shortcuts
- **Advanced Tooltips**: Rich tooltips with additional information and links
- **Batch Actions**: Advanced selection and bulk action capabilities

### Cross-Platform Considerations

#### Performance Optimization
- **Lazy Loading**: Progressive loading of premium feature information
- **Image Optimization**: Responsive images with appropriate sizing
- **Code Splitting**: Lazy loading of upgrade flow components
- **Caching Strategy**: Intelligent caching of pricing and feature data

#### Accessibility Standards
- **Screen Reader**: Complete screen reader support for all upgrade flows
- **Keyboard Navigation**: Full keyboard navigation for all interactions
- **Color Contrast**: WCAG AA compliance for all color combinations
- **Motion Sensitivity**: Reduced motion options for animations

## Related Documentation

### Design System Integration
- [Button Components](../../design-system/components/buttons.md) - Premium upgrade button specifications
- [Form Components](../../design-system/components/forms.md) - Payment and billing form interfaces
- [Modal Components](../../design-system/components/modals.md) - Upgrade prompt and trial activation modals
- [Color Tokens](../../design-system/tokens/colors.md) - Canadian pricing and success state colors

### Technical Integration
- [Stripe Integration](../../accessibility/stripe-integration.md) - Payment processing implementation
- [Canadian Tax API](../../accessibility/canadian-compliance.md) - Tax calculation and billing compliance
- [Subscription Management](../../accessibility/supabase-schema.md) - Database schema for subscription handling

### User Experience Documentation
- [User Journey Analysis](user-journey.md) - Complete premium upgrade user journey mapping
- [Interaction Patterns](interactions.md) - Detailed interaction and animation specifications
- [Feature Design Brief](README.md) - Comprehensive premium upgrade flow overview

## Implementation Notes

### Developer Handoff Requirements
- **Component Library**: Utilize existing design system components with premium-specific variants
- **Responsive Implementation**: Ensure all screens adapt properly across device breakpoints
- **Accessibility Integration**: Implement complete keyboard navigation and screen reader support
- **Performance Targets**: Optimize for 2-second load times on 3G networks
- **Error Handling**: Robust error handling for payment and subscription management

### Quality Assurance Checklist
- [ ] All screens render correctly across mobile, tablet, and desktop breakpoints
- [ ] Payment processing integrates properly with Stripe SDK for React Native
- [ ] Canadian tax calculations display accurately for all provinces and territories
- [ ] Subscription management flows work correctly with Supabase integration
- [ ] Accessibility standards met including keyboard navigation and screen readers
- [ ] Premium feature gating functions correctly based on subscription status
- [ ] Error states provide clear guidance and recovery options
- [ ] Trial experience guides users effectively through premium feature discovery

## Last Updated

**Date**: January 15, 2025
**Version**: 1.0.0
**Changes**: Initial comprehensive screen state documentation for premium upgrade flow with Canadian focus, transparent pricing, and value-driven conversion approach.

**Next Review**: February 15, 2025
**Assigned Reviewer**: Senior UX Designer, Frontend Developer, Canadian Compliance Specialist