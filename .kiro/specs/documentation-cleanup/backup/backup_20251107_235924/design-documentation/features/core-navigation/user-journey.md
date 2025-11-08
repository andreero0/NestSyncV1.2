# Core Navigation User Journey Mapping

Complete user journey analysis for the three-screen + FAB navigation system, optimized for the emotional and cognitive needs of Canadian parents managing diaper planning workflows.

---
title: Core Navigation User Journey Mapping
description: Comprehensive journey analysis for Home, Planner, Settings screens with context-aware FAB
feature: Core Navigation
last-updated: 2025-01-21
version: 1.0.0
related-files: 
  - README.md
  - screen-states.md
  - interactions.md
dependencies:
  - React Navigation v6
  - NativeBase components
  - Canadian parent psychology research
status: approved
---

## Journey Mapping Overview

### User Psychology Foundation

**Core Emotional States for New Parents**:
- **Overwhelm**: Information overload, decision fatigue, anxiety about "doing it right"
- **Time Pressure**: Constant time scarcity, need for immediate actionability
- **Cognitive Load**: Mental bandwidth depleted by sleep deprivation and stress
- **Control Seeking**: Desire for predictability and management in chaos
- **Validation Seeking**: Need for reassurance that everything is "normal" and manageable

**Design Response Strategy**:
- **Immediate Clarity**: Essential information visible within 3 seconds
- **Reduced Decision Points**: Maximum 3 primary options at any decision junction
- **Progressive Disclosure**: Advanced features available but not overwhelming
- **Contextual Intelligence**: System anticipates needs based on current state
- **Emotional Reassurance**: Visual and textual cues that "everything is okay"

---

## Primary User Personas & Journey Goals

### Sarah - Overwhelmed New Mom (Primary Persona)
**Demographics**: 28, first-time mother, on maternity leave, lives in Toronto
**Mental State**: Anxious, sleep-deprived, learning as she goes
**Technology Comfort**: Moderate, prefers simple, intuitive interfaces
**Primary Goal**: Quick status checks to reduce anxiety about running out of diapers

### Mike - Efficiency Dad (Secondary Persona)  
**Demographics**: 32, father of one, engineer, lives in Vancouver
**Mental State**: Analytical, efficiency-focused, planning-oriented
**Technology Comfort**: High, appreciates data and optimization features
**Primary Goal**: Comprehensive planning and cost optimization

### Lisa - Professional Caregiver (Tertiary Persona)
**Demographics**: 45, daycare provider, manages multiple children
**Mental State**: Experienced but time-pressured, needs quick documentation
**Technology Comfort**: Moderate, values speed and accuracy
**Primary Goal**: Efficient logging and communication with parents

### Emma - Eco-Conscious Parent (Quaternary Persona)
**Demographics**: 30, environmentally conscious, works part-time
**Mental State**: Values-driven, seeks sustainable options
**Technology Comfort**: High, appreciates detailed information and alternatives
**Primary Goal**: Environmentally responsible purchasing decisions with cost awareness

---

## Journey Flow 1: Quick Status Check (Sarah - Overwhelmed New Mom)

### Context & Emotional State
- **Trigger**: Baby crying, diaper bag feels light, panic setting in
- **Emotional State**: Anxiety level 7/10, time pressure high
- **Success Criteria**: Confidence restored, clear action path identified
- **Time Budget**: 30-60 seconds maximum

### Step-by-Step Journey

#### Step 1: App Launch & Immediate Orientation
**Screen**: Home Screen - Default State
**Duration**: 3-5 seconds
**Sarah's Mental State**: "Please tell me I don't need to panic"

**What Sarah Sees**:
```
NestSync Home Screen
├── "3 days of cover remaining"  ← INSTANT RELIEF
├── Green/orange status indicator  ← Visual reassurance
├── "Reorder Soon" (not "EMERGENCY")  ← Manageable urgency
└── Recent activity shows normalcy  ← Pattern validation
```

**Psychological Process**:
1. **Visual Scan** (0-1 second): Eyes immediately drawn to large "3 days" text
2. **Threat Assessment** (1-2 seconds): Orange warning acknowledged but not alarming
3. **Pattern Recognition** (2-3 seconds): Recent activity confirms normal usage
4. **Relief Response** (3-4 seconds): Anxiety drops from 7/10 to 4/10

**Sarah's Internal Monologue**: 
- "Okay, 3 days... that's not immediate panic"
- "I need to order soon but not right this second"  
- "The app would tell me if it was urgent"

**Decision Points**:
- **Continue** → Check when to order (15% of users)
- **Exit satisfied** → Anxiety reduced, return to baby (75% of users)
- **Take action now** → Use FAB to log recent change (10% of users)

#### Step 2A: Satisfied Exit (Most Common Path)
**Action**: Close app
**Duration**: 1 second
**Outcome**: **SUCCESS** - Anxiety managed, confidence restored

**Success Metrics**:
- Time to confidence: <5 seconds
- Anxiety reduction: 7/10 → 4/10
- Action clarity: High (knows to check back tomorrow)

#### Step 2B: Quick Action Path (FAB Usage)
**Trigger**: Sarah realizes she forgot to log last diaper change
**Action**: Tap FAB
**Duration**: 8-12 seconds total

**Quick Logging Flow**:
```
FAB Tap → Modal Opens → Time Selection → Type Selection → Save
  1s    →    0.5s     →     3s       →      3s        → 2s
```

**Sarah's Experience**:
1. **FAB Recognition** (1s): "Oh, I can log that change from 2 hours ago"
2. **Modal Comfort** (0.5s): Familiar, simple interface
3. **Time Selection** (3s): "2h" chip selected, no typing needed
4. **Type Selection** (3s): Visual icons make decision easy
5. **Completion** (2s): Haptic feedback confirms success

**Psychological Validation**: 
- **Control Restored**: "I'm staying on top of this"
- **Data Confidence**: "My tracking is accurate"
- **System Trust**: "This app helps me be a good parent"

---

## Journey Flow 2: Comprehensive Planning Session (Mike - Efficiency Dad)

### Context & Emotional State
- **Trigger**: Sunday evening planning routine, optimization mindset
- **Emotional State**: Analytical, focused, time available
- **Success Criteria**: Data-driven purchase decisions, cost optimization identified
- **Time Budget**: 10-15 minutes for thorough analysis

### Step-by-Step Journey

#### Step 1: Home Screen Rapid Assessment
**Screen**: Home Screen - Default State
**Duration**: 5-10 seconds
**Mike's Mental State**: "Let me get the current situation first"

**What Mike Processes**:
- **Status Overview**: "3 days remaining" - understood immediately
- **Usage Patterns**: Scans recent activity for abnormalities
- **Recommendations**: Notes quick action suggestion
- **Data Quality**: Assesses if tracking is comprehensive

**Decision**: Navigate to Planner for detailed analysis

#### Step 2: Navigation to Planner Screen
**Action**: Tap "Planner" tab
**Duration**: 1 second + 300ms transition
**Animation**: Smooth tab switch with content preservation

**Mike's Experience**:
- **Spatial Continuity**: Smooth transition maintains context
- **No Loading**: Instant content display (pre-loaded screen)
- **Focus Shift**: From status to planning mindset

#### Step 3: Planner Screen Deep Analysis
**Screen**: Planner Screen - Default State
**Duration**: 3-5 minutes exploration
**Mike's Mental State**: "Show me the data and patterns"

**Information Processing Sequence**:
1. **Usage Timeline** (30 seconds): Reviews daily change patterns
   - Identifies peak usage times
   - Compares to averages
   - Notes any irregularities

2. **Predictions Section** (60 seconds): Analyzes upcoming needs
   - "Size change likely Jan 20-25" - noted for planning
   - Stock timeline validation
   - Growth pattern assessment

3. **Cost Analysis** (90 seconds): Evaluates financial optimization
   - Current spending rate review
   - Bulk purchase opportunities
   - Price comparison across retailers

4. **Inventory Status** (60 seconds): Physical stock verification
   - Confirms app data matches reality
   - Reviews brand distribution
   - Plans next purchase timing

**Key Decision Points**:
- **Size Transition Planning**: Should he order Size 3 now or wait?
- **Bulk Purchase Timing**: Is the bulk opportunity worth the upfront cost?
- **Brand Optimization**: Are current brands performing well?

#### Step 4: Advanced Analytics (Premium Feature)
**Trigger**: Tap "Chart" view toggle
**Duration**: 2-3 minutes deep dive
**Mike's Mental State**: "Let me see the real patterns"

**Analytics Consumption**:
1. **Trend Analysis**: 30-day usage patterns
2. **Efficiency Metrics**: Cost per change, brand performance
3. **Predictive Modeling**: Future size needs, optimal reorder points
4. **Optimization Opportunities**: Bulk savings, better brands, timing

#### Step 5: Action Planning & Context-Aware FAB
**Screen**: Still in Planner
**Duration**: 1-2 minutes decision making
**FAB Context**: Now shows "Add Inventory" icon

**Mike's Decision Process**:
- **Immediate Action**: Use FAB to plan bulk purchase
- **Future Scheduling**: Set reminders for size transition
- **Cost Optimization**: Compare retailer options

**FAB Interaction**:
```
Mike taps FAB → Inventory Modal → Bulk Purchase Planning
     1s      →     0.5s       →        60s
```

**Success Outcome**:
- **Plan Formulated**: Specific purchase decision made
- **Cost Optimized**: 15% savings identified through bulk buying
- **Timeline Set**: Reorder scheduled for optimal timing
- **Confidence High**: Data-driven decision reduces uncertainty

---

## Journey Flow 3: Multi-Child Management (Lisa - Professional Caregiver)

### Context & Emotional State
- **Trigger**: End of daycare day, needs to update all parents
- **Emotional State**: Efficient, time-pressured, detail-oriented
- **Success Criteria**: All children logged, parents informed, minimal time spent
- **Time Budget**: 2-3 minutes for multiple children

### Premium Multi-Child Journey

#### Step 1: Family Overview Assessment
**Screen**: Home Screen - Multi-Child State
**Duration**: 10-15 seconds rapid scan
**Lisa's Mental State**: "Who needs attention today?"

**Information Hierarchy Processing**:
```
Family Status Dashboard
├── Emma (8w): 3 days [WARNING] ← Needs parent notification
├── Alex (18m): 8 days ✅ ← Stable
├── Sam (3y): 12 days ✅ ← Stable
└── Bulk recommendations ← Efficiency opportunity
```

**Decision Logic**:
- **Priority Identification**: Emma needs parent contact
- **Efficiency Recognition**: Bulk purchase recommendation noted
- **Action Planning**: Multiple children need logging

#### Step 2: Rapid Multi-Child Logging
**Process**: Sequential FAB usage for each child
**Duration**: 6-8 minutes total (2-3 min per child)

**Child Selection Flow**:
```
FAB Tap → Child Selector → Quick Log → Repeat
  1s    →      2s        →    10s    → Next child
```

**Lisa's Efficiency Adaptations**:
- **Muscle Memory**: Familiar UI reduces cognitive load
- **Pattern Recognition**: Similar logging flow for each child
- **Batch Processing**: Completes all logging before moving to communication

#### Step 3: Parent Communication Integration
**Screen**: Settings Screen via tab navigation
**Duration**: 60 seconds per critical update
**FAB Context**: Shows "Share" function

**Communication Workflow**:
1. **Urgent Updates**: Emma's low supply → immediate parent text
2. **Daily Summaries**: Standard update for all parents
3. **Bulk Recommendations**: Share cost savings opportunity

---

## Journey Flow 4: Purchase Decision Making (Emma - Eco-Conscious Parent)

### Context & Emotional State
- **Trigger**: Reorder notification received, values-driven decision needed
- **Emotional State**: Thoughtful, research-oriented, time available
- **Success Criteria**: Environmentally responsible choice made without overspending
- **Time Budget**: 15-20 minutes for thorough research

### Sustainable Purchase Journey

#### Step 1: Alert Response & Context Gathering
**Screen**: Home Screen - Critical Alert State
**Duration**: 30 seconds initial assessment
**Emma's Mental State**: "What are my responsible options?"

**Values-Based Information Processing**:
- **Urgency Recognition**: "Order today" understood but not panic-inducing
- **Solution Evaluation**: Multiple retailer options considered
- **Values Integration**: Environmental impact factors into decision

#### Step 2: Planner Screen Research Phase
**Navigation**: Move to Planner for detailed analysis
**Duration**: 5-7 minutes comprehensive review
**Focus**: Brand impact, bulk opportunities, cost-per-use optimization

**Research Priorities**:
1. **Brand Sustainability**: Which options have better environmental profiles?
2. **Bulk Efficiency**: Can she reduce packaging through larger purchases?
3. **Cost-Benefit Analysis**: Long-term value vs. immediate cost
4. **Usage Optimization**: Are there ways to extend diaper life?

#### Step 3: External Research Integration
**Process**: Uses app data to inform external research
**Duration**: 8-10 minutes outside app
**Return**: Back to app with informed decision parameters

#### Step 4: Purchase Execution via Recommendations
**Screen**: Return to Home Screen recommendations
**Action**: Select optimized retailer based on values + cost
**Outcome**: Sustainable choice made with confidence

---

## Context-Aware FAB Journey Patterns

### FAB State Intelligence System

**Context Detection Logic**:
```
Current Screen + User Type + Data State + Time Context = FAB Action

Examples:
- Home + New Parent + Low Stock + Evening = "Quick Log"
- Planner + Efficiency Dad + Planning Mode + Weekend = "Add Inventory"  
- Settings + Caregiver + Multi-Child + End of day = "Share Update"
```

### FAB Usage Patterns by Screen

#### Home Screen FAB: "Log Change" 
**Primary Users**: All parents, caregivers
**Usage Context**: Immediate logging needs
**Success Pattern**: <10 seconds from tap to completion

**Psychological Design**:
- **Availability Heuristic**: Always visible = always possible to log
- **Reduced Friction**: No navigation required for primary action
- **Immediate Feedback**: Haptic + visual confirmation

#### Planner Screen FAB: "Add Inventory"
**Primary Users**: Efficiency-focused parents, bulk purchasers  
**Usage Context**: Planning and optimization sessions
**Success Pattern**: Direct path from analysis to action

**Psychological Design**:
- **Context Continuity**: Action matches screen purpose
- **Planning Momentum**: Maintains flow from analysis to action
- **Efficiency Reinforcement**: Streamlines planning-to-purchase workflow

#### Settings Screen FAB: "Add/Share"
**Primary Users**: Premium users, caregivers, family managers
**Usage Context**: Account management, collaboration setup
**Success Pattern**: Family/caregiver onboarding

**Psychological Design**:
- **Administrative Efficiency**: Management actions in management context
- **Collaboration Support**: Easy sharing and family setup
- **Premium Value**: Advanced features for paying users

---

## Decision Points & Mental Models

### Critical User Decision Junctions

#### 1. App Launch Decision: "Check Status vs. Take Action"
**Context**: User opens app with specific intent
**Decision Time**: 3-5 seconds
**Factors**:
- **Urgency Level**: How critical is the current situation?
- **Available Time**: Quick check vs. detailed review
- **Confidence Level**: Trust in current tracking accuracy

**Design Response**:
- **Immediate Status**: Large, clear status display
- **Action Accessibility**: FAB always available
- **Progressive Disclosure**: Details available without overwhelming

#### 2. Navigation Decision: "Stay Home vs. Explore Features"
**Context**: Status understood, deciding on next action
**Decision Time**: 5-10 seconds
**Factors**:
- **Satisfaction Level**: Is current information sufficient?
- **Available Time**: Can user invest in deeper exploration?
- **Goal Complexity**: Simple check vs. planning session

**Design Response**:
- **Tab Clarity**: Clear labeling of each screen purpose
- **Visual Cues**: Badges and indicators guide attention
- **Return Confidence**: Home always accessible

#### 3. Action Decision: "Log Now vs. Remember Later"
**Context**: User realizes they have unlocked change to record
**Decision Time**: 2-5 seconds
**Factors**:
- **Memory Confidence**: Will they remember to log later?
- **Current Focus**: Is baby requiring immediate attention?
- **Logging Friction**: How easy is it to complete the action?

**Design Response**:
- **Instant Access**: FAB eliminates navigation friction
- **Speed Optimization**: <10 second logging goal
- **Memory Aids**: Recent activity validates logging habits

---

## Pain Points & Psychological Considerations

### Common User Frustrations & Design Solutions

#### Pain Point 1: Information Overload
**User Experience**: "I just want to know if I need to buy diapers"
**Psychological Impact**: Decision paralysis, increased anxiety
**Design Solution**: 
- Primary status prominently displayed
- Secondary information progressive
- Clear visual hierarchy guides attention

#### Pain Point 2: Time Pressure During Crisis
**User Experience**: "The baby is crying, I need answers NOW"
**Psychological Impact**: Panic, abandonment of app
**Design Solution**:
- 3-second rule for critical information
- Offline functionality for basic features
- Emergency contact/retailer information readily available

#### Pain Point 3: Tracking Confidence Issues
**User Experience**: "Did I log that change? Am I being a good parent?"
**Psychological Impact**: Self-doubt, data anxiety
**Design Solution**:
- Recent activity clearly displayed
- Forgiving logging (easy to add/edit)
- Positive reinforcement for tracking habits

#### Pain Point 4: Planning vs. Execution Gap
**User Experience**: "I know I need to order, but when exactly?"
**Psychological Impact**: Analysis paralysis, delayed action
**Design Solution**:
- Clear action recommendations
- Specific timing guidance
- One-tap purchase pathways

---

## Success Criteria & Completion Metrics

### Journey Success Measurement

#### Sarah (Overwhelmed New Mom) Success Metrics:
- **Time to Confidence**: <5 seconds from launch to anxiety reduction
- **Completion Rate**: 90% of status checks result in satisfied exit
- **Return Behavior**: Regular checking indicates system trust
- **Stress Reduction**: Post-interaction anxiety levels measured

#### Mike (Efficiency Dad) Success Metrics:
- **Analysis Depth**: Time spent in Planner screen indicates value
- **Optimization Discovery**: Savings opportunities identified per session
- **Decision Confidence**: Purchase decisions made based on app data
- **Premium Engagement**: Advanced features regularly utilized

#### Lisa (Professional Caregiver) Success Metrics:
- **Logging Speed**: Average time per child logged
- **Multi-Child Efficiency**: Batch operations completed successfully
- **Communication Success**: Parent updates sent with app-generated data
- **Error Reduction**: Accuracy of logged information maintained

#### Emma (Eco-Conscious Parent) Success Metrics:
- **Research Integration**: App data used to inform external research
- **Values Alignment**: Sustainable choices supported by app recommendations
- **Cost-Benefit Balance**: Environmental and financial optimization achieved
- **Long-term Engagement**: Continued use despite complexity tolerance

---

## Edge Cases & Error Recovery Flows

### Offline Usage Scenarios

#### Limited Connectivity User Journey:
1. **App Launch**: Offline indicator displayed subtly
2. **Status Check**: Last-known data displayed with timestamp
3. **Logging Attempt**: Offline logging enabled with sync indicator
4. **Recovery**: Automatic sync when connectivity restored

### Data Inconsistency Recovery

#### Tracking Gaps Journey:
1. **Gap Detection**: System identifies missing logs
2. **User Notification**: Gentle prompt for missing information
3. **Quick Recovery**: Batch logging options for catch-up
4. **Pattern Restoration**: System adapts recommendations based on corrected data

### Emergency Scenarios

#### Critical Stock Alert Journey:
1. **Alert Delivery**: Push notification + in-app prominence
2. **Immediate Options**: Emergency retailer information
3. **Action Facilitation**: Direct links to purchase options
4. **Follow-up**: Confirmation of resolution, pattern analysis

---

This comprehensive user journey mapping ensures that the core navigation system serves the complex emotional and practical needs of Canadian parents across all usage scenarios, from quick anxiety-reducing status checks to comprehensive planning sessions, while maintaining the psychological safety and efficiency that stressed parents require.