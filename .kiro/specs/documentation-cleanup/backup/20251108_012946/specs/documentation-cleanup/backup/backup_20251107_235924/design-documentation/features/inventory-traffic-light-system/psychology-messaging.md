---
title: Psychology-Driven Messaging Framework
description: Comprehensive messaging system designed for stress reduction and confidence building in Canadian parents
feature: inventory-traffic-light-system
last-updated: 2025-01-22
version: 1.0.0
related-files:
  - README.md
  - accessibility.md
  - screen-states.md
dependencies:
  - Canadian cultural context research
  - Parent stress psychology studies
  - PIPEDA compliance messaging
status: draft
---

# Psychology-Driven Messaging Framework

## Overview

This document provides comprehensive messaging specifications designed to transform inventory status updates from warehouse alerts into supportive, stress-reducing communications for Canadian parents managing diaper planning during challenging periods of child-rearing.

## Table of Contents

1. [Messaging Philosophy](#messaging-philosophy)
2. [Canadian Cultural Context](#canadian-cultural-context)
3. [Status-Specific Messaging](#status-specific-messaging)
4. [Microcopy Guidelines](#microcopy-guidelines)
5. [Accessibility Language](#accessibility-language)
6. [Implementation Specifications](#implementation-specifications)

## Messaging Philosophy

### Core Principles

#### 1. Stress Reduction Over Information Density
- **Goal**: Reduce cognitive load for sleep-deprived parents
- **Method**: Supportive language that builds confidence
- **Example**: "You're all set!" vs "Good stock levels detected"

#### 2. Action Guidance Over Status Reporting
- **Goal**: Help parents know what to do next
- **Method**: Clear, actionable next steps
- **Example**: "Add to your shopping list" vs "Critical stock levels"

#### 3. Canadian Politeness and Cultural Sensitivity
- **Goal**: Respect Canadian cultural norms of politeness
- **Method**: Suggestions rather than demands
- **Example**: "Plan your next trip" vs "Reorder immediately"

#### 4. Hope and Support During Transitions
- **Goal**: Maintain parental confidence during inventory changes
- **Method**: Reassuring language about incoming help
- **Example**: "Help is coming" vs "Pending orders: 2"

## Canadian Cultural Context

### Cultural Values Integration

#### Politeness and Non-Aggression
- **Avoid**: Urgent demands, aggressive calls-to-action
- **Use**: Gentle suggestions, polite reminders
- **Language Pattern**: "You might want to..." vs "You must..."

#### Community Support and Mutual Aid
- **Concept**: Framing system as helpful neighbor
- **Language Pattern**: "Let's help you stay prepared"
- **Trust Building**: "We're here to support your family"

#### Privacy and PIPEDA Compliance
- **Respect**: Personal family data sensitivity
- **Language**: Acknowledge data protection
- **Trust Indicators**: "Your family data stays in Canada"

#### Practical Problem-Solving
- **Approach**: Solution-focused messaging
- **Style**: Practical, helpful guidance
- **Example**: "Perfect time to plan your shopping trip"

## Status-Specific Messaging

### Critical Status (Red) - Supportive Urgency

#### Primary Display
```
"3 days left"
"Time to restock soon"
```

#### Psychology Framework
- **Emotion Target**: Alert without panic
- **Action Motivation**: Proactive planning
- **Confidence Level**: "You can handle this"

#### Messaging Variations
```
Short-term (1-2 days):
- Primary: "1 day left" / "2 days left"
- Message: "Add to today's list"
- Subtext: "Quick trip needed"

Medium-term (3-4 days):
- Primary: "3 days left" / "4 days left"
- Message: "Time to restock soon"
- Subtext: "Plan your next trip"
```

#### Accessibility Language
```
Screen Reader: "You have [X] days of diapers remaining. Consider adding diapers to your shopping list for your next convenient trip to the store."

Voice Assistant: "Your diaper supply is running low. You have about [X] days left. Would you like me to add diapers to your shopping list?"
```

### Low Status (Amber) - Proactive Planning

#### Primary Display
```
"6 days left"
"Plan your next trip"
```

#### Psychology Framework
- **Emotion Target**: Preparation confidence
- **Action Motivation**: Strategic planning
- **Confidence Level**: "You're being smart about this"

#### Messaging Variations
```
Planning window (5-7 days):
- Primary: "5 days left" / "6 days left" / "7 days left"
- Message: "Plan your next trip"
- Subtext: "Perfect timing for restocking"

Weekend planning:
- Message: "Great time for a weekend shop"
- Subtext: "Stock up when convenient"
```

#### Accessibility Language
```
Screen Reader: "You have [X] days of diapers remaining. This is a great time to plan your next shopping trip and stock up on diapers when it's convenient for you."

Voice Assistant: "Your diaper supply is in good shape with [X] days remaining. Perfect time to plan your next shopping trip."
```

### Good Status (Green) - Confidence Building

#### Primary Display
```
"12 days left"
"You're all set!"
```

#### Psychology Framework
- **Emotion Target**: Peace of mind
- **Action Motivation**: Relaxation, confidence
- **Confidence Level**: "You're prepared and doing great"

#### Messaging Variations
```
Well-stocked (8-14 days):
- Primary: "12 days left"
- Message: "You're all set!"
- Subtext: "Relax, you're prepared"

Very well-stocked (15+ days):
- Primary: "15+ days left"
- Message: "Beautifully prepared!"
- Subtext: "Enjoy the peace of mind"
```

#### Accessibility Language
```
Screen Reader: "You have [X] days of diapers remaining. You're beautifully prepared! You can relax knowing your family's diaper needs are well taken care of."

Voice Assistant: "Great news! You have [X] days of diapers. You're all set and can enjoy some peace of mind."
```

### Pending Status (Blue) - Hope and Support

#### Primary Display
```
"Help coming"
"Order on the way"
```

#### Psychology Framework
- **Emotion Target**: Hope and reassurance
- **Action Motivation**: Patience and confidence
- **Confidence Level**: "Support is coming"

#### Messaging Variations
```
Recent order:
- Primary: "Help coming"
- Message: "Order on the way"
- Subtext: "Delivery expected soon"

Multiple orders:
- Primary: "Help coming"
- Message: "Multiple orders arriving"
- Subtext: "You'll be well stocked"
```

#### Accessibility Language
```
Screen Reader: "You have diapers on the way. Help is coming! Your order is expected to arrive soon, so you can relax knowing more supplies are on their way."

Voice Assistant: "Good news! You have a diaper order on the way. Help is coming soon."
```

## Microcopy Guidelines

### Button and Link Text
```
Critical Actions:
- "Add to Shopping List" (not "Buy Now")
- "Plan Shopping Trip" (not "Purchase")
- "View Details" (not "Manage Inventory")

Secondary Actions:
- "See All Diapers" (not "View Inventory")
- "Update Usage" (not "Modify Consumption")
- "Track Delivery" (not "Order Status")
```

### Error Messages
```
Network Issues:
"We're having trouble getting your latest inventory. Don't worry - we'll keep trying and update you soon."

Data Loading:
"Getting your latest diaper status... This usually takes just a moment."

Calculation Issues:
"We're working on your diaper timeline. In the meantime, you can see your current quantities."
```

### Success Messages
```
Inventory Updated:
"Your diaper status is now up to date. Looking good!"

Order Placed:
"Order confirmed! Help is on the way. We'll track your delivery for you."

Settings Saved:
"Your preferences are saved. We'll use these to give you better planning help."
```

## Accessibility Language

### Screen Reader Optimization

#### Comprehensive Status Announcements
```
Critical Status Full Description:
"Diaper inventory status: Critical. You have [X] days of diapers remaining with [Y] diapers in stock. This is a good time to add diapers to your shopping list for your next convenient trip to the store. Tap this card to view detailed breakdown and planning options."

Low Status Full Description:
"Diaper inventory status: Low stock. You have [X] days of diapers remaining with [Y] diapers in stock. Perfect time to plan your next shopping trip and stock up when convenient. Tap this card to view detailed inventory and shopping guidance."

Good Status Full Description:
"Diaper inventory status: Well stocked. You have [X] days of diapers remaining with [Y] diapers in stock. You're beautifully prepared and can relax knowing your family's diaper needs are taken care of. Tap this card to view your current inventory details."

Pending Status Full Description:
"Diaper inventory status: Orders pending. You have diaper orders on the way with delivery expected soon. Help is coming! Tap this card to track your incoming orders and delivery timeline."
```

#### Context-Aware Hints
```
Time-Based Hints:
Morning: "Good morning! Here's your diaper status to help plan your day."
Evening: "Here's your current diaper status. Perfect time to plan tomorrow's activities."
Weekend: "Weekend planning: Here's your diaper status for the days ahead."
```

### Voice Assistant Integration

#### Natural Language Patterns
```
Status Queries:
User: "How are we doing on diapers?"
Response: "[Status] - You have [X] days left. [Psychology message]. [Action guidance if needed]."

Planning Queries:
User: "When should I buy more diapers?"
Response: "[Timeframe recommendation based on status]. [Supportive reasoning]. Would you like me to add diapers to your shopping list?"

Anxiety Queries:
User: "Are we going to run out of diapers?"
Response: "[Reassuring status]. [Specific timeline]. [Confidence building]. You're [prepared/handling this well/doing great]."
```

## Implementation Specifications

### Message Priority System
```
1. Status-specific primary message (required)
2. Time-based context (required)
3. Action guidance (conditional on status)
4. Supportive subtext (optional, space permitting)
5. Canadian cultural markers (as appropriate)
```

### Responsive Messaging
```
Large Screens (tablets, wide phones):
- Full message hierarchy with all elements
- Extended accessibility descriptions
- Additional context and support text

Standard Screens (most phones):
- Core message hierarchy
- Standard accessibility descriptions
- Essential context only

Small Screens (compact phones):
- Abbreviated but complete core messages
- Shorter accessibility descriptions
- Critical information prioritized
```

### Localization Considerations
```
Canadian English:
- "Colour" vs "Color" (follow Canadian spelling)
- "Centre" vs "Center"
- Metric measurements where appropriate
- Canadian cultural references and politeness patterns

French Canadian (future consideration):
- Cultural adaptation for Quebec market
- Formal vs informal address patterns
- Regional cultural sensitivity
```

## Quality Assurance

### Psychology Testing Criteria
- [ ] Messages reduce stress rather than create anxiety
- [ ] Language builds parental confidence
- [ ] Cultural sensitivity respected throughout
- [ ] Action guidance clear and helpful

### User Experience Validation
- [ ] Parents understand next steps immediately
- [ ] Messaging feels supportive and helpful
- [ ] Canadian cultural context feels natural
- [ ] Accessibility needs fully addressed

### Technical Implementation
- [ ] All message variations properly implemented
- [ ] Screen reader content tested and optimized
- [ ] Voice assistant integration functional
- [ ] Responsive behavior verified across devices

## Last Updated

2025-01-22 - Comprehensive psychology-driven messaging framework with Canadian cultural context and accessibility optimization