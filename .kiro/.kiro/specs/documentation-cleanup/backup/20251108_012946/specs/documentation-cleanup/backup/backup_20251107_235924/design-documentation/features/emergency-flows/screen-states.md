# Emergency Flows - Screen States & Wireframe Specifications

## Overview

This document defines all screen states for the Emergency Flows feature, designed for optimal usability during high-stress crisis situations. Each screen follows psychology-based design principles to reduce cognitive load and support parents during emergency situations involving infants and toddlers.

## Screen State Categories

### Crisis Mode States
1. **Emergency Activation** - Initial crisis mode entry
2. **Emergency Dashboard** - Central command during crisis
3. **Critical Information Display** - Essential child data access
4. **Emergency Contact Flow** - Automated contact activation
5. **Healthcare Provider Sharing** - Medical information transmission

### Supporting States
1. **Supply Crisis Management** - Emergency supply calculations
2. **Location Services** - Emergency services mapping
3. **Offline Mode** - Network-compromised functionality
4. **Recovery Mode** - Post-crisis documentation

## Crisis Mode Activation Screens

### Screen: Emergency Activation
**Purpose**: Immediate crisis mode entry with multiple activation methods
**Context**: User needs urgent access to emergency features
**Priority Level**: P0 - Life Critical

#### State: Default Activation
```
Layout Structure:
┌─────────────────────────────────────┐
│ EMERGENCY MODE                   │ <- Header: Red background, white text
├─────────────────────────────────────┤
│                                     │
│     ACTIVATE EMERGENCY           │ <- Large button: 120px height
│                                     │
│   Hold for 3 seconds             │ <- Instruction text
│                                     │
├─────────────────────────────────────┤
│ Alternative Activation Methods:     │
│                                     │
│ Say "Emergency Mode"            │ <- Voice activation
│ Shake phone rapidly             │ <- Gesture activation
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Background**: Emergency Red (#DC2626) with 95% opacity overlay
- **Primary Button**: 
  - Size: 280×120px with 24px border radius
  - Background: White (#FFFFFF)
  - Text: Emergency Red (#DC2626), 24px bold
  - Shadow: 0 8px 24px rgba(220, 38, 38, 0.3)
- **Typography**: 
  - Header: 28px bold, white, letter-spacing 1px
  - Instructions: 16px regular, white, opacity 0.9
  - Alternative methods: 14px regular, white, opacity 0.8

**Interaction Specifications**:
- **Hold Gesture**: 3-second hold with visual progress indicator
- **Voice Activation**: Always-listening "Emergency Mode" trigger phrase
- **Shake Detection**: 3 rapid shakes within 2 seconds
- **Haptic Feedback**: Strong haptic pulse on activation
- **Audio Confirmation**: Brief emergency tone on successful activation

#### State: Activation Progress
```
Layout Structure:
┌─────────────────────────────────────┐
│ ACTIVATING EMERGENCY MODE...     │
├─────────────────────────────────────┤
│                                     │
│    [████████░░] 80%             │ <- Progress indicator
│                                     │
│    Preparing critical information   │ <- Status text
│    Loading emergency contacts       │
│    Enabling crisis mode            │
│                                     │
└─────────────────────────────────────┘
```

**Animation Specifications**:
- **Progress Bar**: Linear fill animation, 3-second duration
- **Status Updates**: Fade in/out transitions, 0.3s each
- **Loading Indicators**: Subtle pulse animation on text elements
- **Background**: Gentle red pulse to maintain urgency without overwhelming

### Screen: Emergency Dashboard
**Purpose**: Central command center during active emergency
**Context**: Crisis mode activated, need for immediate action options
**Priority Level**: P0 - Life Critical

#### State: Medical Emergency
```
Layout Structure:
┌─────────────────────────────────────┐
│ MEDICAL EMERGENCY - [Child Name] │ <- Crisis header
├─────────────────────────────────────┤
│                                     │
│ [📞 CALL 911]    [👨‍⚕️ DOCTOR]     │ <- Primary actions: 50% width each
│                                     │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│                                     │
│ 🏥 Nearest Hospital                │ <- Secondary actions
│ 💊 Medical History                 │
│ 📋 Symptoms Checker                │ <- Each item: Full width, 60px height
│ 👥 Emergency Contacts              │
│                                     │
├─────────────────────────────────────┤
│ 📍 Current Location: [Address]      │ <- Location display
│ 🕐 Emergency started: [Time]        │ <- Time tracking
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Emergency Header**: 
  - Background: Emergency Red (#DC2626)
  - Text: White 20px bold
  - Height: 56px with center alignment
- **Primary Action Buttons**:
  - Size: 160×80px each with 12px gap
  - Background: White with colored borders
  - 911 Button: Red border (#DC2626), red text
  - Doctor Button: Blue border (#3B82F6), blue text
  - Shadow: 0 4px 12px rgba(0, 0, 0, 0.15)
- **Secondary Actions**:
  - Height: 60px each with 8px vertical gaps
  - Background: White with subtle blue left border (4px)
  - Text: 18px regular, dark gray (#374151)
  - Icons: 24×24px, colored (#3B82F6)

**Interaction Specifications**:
- **Primary Buttons**: Immediate action on single tap with haptic feedback
- **Call 911**: Direct dial with location auto-sharing
- **Call Doctor**: Sequential calling through provider list
- **Secondary Actions**: Slide-in detail panels with emergency context
- **Location Services**: Auto-refresh every 30 seconds during emergency

#### State: Supply Emergency
```
Layout Structure:
┌─────────────────────────────────────┐
│ ⚠️ SUPPLY EMERGENCY - [Child Name]  │
├─────────────────────────────────────┤
│                                     │
│ Critical Supplies Needed:           │
│                                     │
│ 🍼 Formula: 2 days remaining       │ <- Supply status with icons
│ 👶 Diapers: 8 hours remaining      │
│ 💊 Medicine: CRITICAL - 1 dose     │
│                                     │
├─────────────────────────────────────┤
│ [🛒 FIND STORES]  [📱 ORDER NOW]   │ <- Action buttons
├─────────────────────────────────────┤
│ Emergency Alternatives:             │
│                                     │
│ • Formula alternatives nearby       │ <- Alternative solutions
│ • Emergency diaper options          │
│ • Pharmacy with medicine in stock   │
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Supply Status Items**:
  - Critical (< 12 hours): Red background (#FEE2E2), red text
  - Warning (< 2 days): Amber background (#FEF3C7), amber text
  - Normal (> 2 days): Green background (#D1FAE5), green text
  - Height: 44px each with 4px vertical spacing
- **Action Buttons**:
  - Size: 160×56px each
  - Find Stores: Blue background (#3B82F6), white text
  - Order Now: Green background (#10B981), white text
  - Border radius: 8px with subtle shadow

#### State: Travel Emergency
```
Layout Structure:
┌─────────────────────────────────────┐
│ 🧳 TRAVEL EMERGENCY - [Location]    │
├─────────────────────────────────────┤
│                                     │
│ Current Location: [City, Province]   │
│ Home Location: [Distance] away      │
│                                     │
├─────────────────────────────────────┤
│ Local Emergency Services:           │
│                                     │
│ 🏥 Nearest Pediatric Hospital      │ <- Local services
│   [Hospital Name] - 1.2km          │
│                                     │
│ 🚑 Emergency Services: 911         │
│   Local dispatch available         │
│                                     │
│ 💊 24-Hour Pharmacy                │
│   [Pharmacy Name] - 0.8km          │
│                                     │
├─────────────────────────────────────┤
│ [📞 LOCAL 911]  [🏠 CALL HOME]     │ <- Action buttons
└─────────────────────────────────────┘
```

## Critical Information Display Screens

### Screen: Medical History Quick Access
**Purpose**: Instant access to critical medical information for emergency responders
**Context**: Healthcare provider or emergency responder needs child's medical history
**Priority Level**: P0 - Life Critical

#### State: Medical Summary
```
Layout Structure:
┌─────────────────────────────────────┐
│ 👶 [Child Name] - DOB: [Date]       │ <- Child identification
├─────────────────────────────────────┤
│ ⚠️ CRITICAL ALERTS                  │ <- Emergency section
│                                     │
│ 🚫 ALLERGIES:                       │
│   • Peanuts (Severe - EpiPen)      │ <- High priority allergies
│   • Penicillin (Rash)              │
│                                     │
│ 💊 CURRENT MEDICATIONS:             │
│   • Ventolin inhaler (2 puffs)     │ <- Current medications
│   • Daily vitamin D drops          │
│                                     │
├─────────────────────────────────────┤
│ 📋 MEDICAL CONDITIONS:              │
│   • Asthma (mild, controlled)      │ <- Medical conditions
│   • Eczema (topical treatment)     │
│                                     │
├─────────────────────────────────────┤
│ 👥 EMERGENCY CONTACTS:              │
│   📞 Mother: [Phone] - Primary     │ <- Emergency contacts
│   📞 Father: [Phone] - Secondary   │
│   👨‍⚕️ Pediatrician: [Phone]        │
│                                     │
├─────────────────────────────────────┤
│ [📤 SHARE] [📞 CALL] [📋 PRINT]    │ <- Action buttons
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Critical Alerts Section**:
  - Background: Light red (#FEE2E2)
  - Border: 2px solid red (#DC2626)
  - Text: Dark red (#991B1B) for high contrast
  - Padding: 16px with 8px border radius
- **Allergy Items**:
  - Severe allergies: Red warning icon and bold text
  - Mild allergies: Yellow warning icon and regular text
  - EpiPen indication: Special red badge "EpiPen Required"
- **Typography Hierarchy**:
  - Section headers: 18px bold, dark gray
  - Item text: 16px regular, readable hierarchy
  - Critical items: 16px bold with appropriate warning colors

#### State: Sharing Mode
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📤 SHARING MEDICAL INFORMATION      │
├─────────────────────────────────────┤
│                                     │
│ Share with:                         │
│                                     │
│ [ ] Emergency Responders (911)     │ <- Sharing options
│ [ ] Hospital Emergency Room        │
│ [✓] Primary Pediatrician          │ <- Pre-selected options
│ [ ] Urgent Care Clinic            │
│                                     │
├─────────────────────────────────────┤
│ Information to Share:               │
│                                     │
│ [✓] Critical allergies             │ <- Information selection
│ [✓] Current medications            │
│ [✓] Medical conditions             │
│ [✓] Emergency contact information  │
│ [ ] Full medical history           │
│ [ ] Insurance information          │
│                                     │
├─────────────────────────────────────┤
│ [🔐 SHARE SECURELY] [❌ CANCEL]     │ <- Action buttons
└─────────────────────────────────────┘
```

**Interaction Specifications**:
- **Sharing Options**: Large checkboxes (24×24px) for easy selection during stress
- **Pre-selection Logic**: Most critical recipients and information auto-selected
- **Security Indicators**: Lock icons and "Secure" badges for privacy assurance
- **Time-Limited Sharing**: Automatic expiration of shared access after emergency

### Screen: Healthcare Provider Communication
**Purpose**: Direct communication channel with healthcare providers during emergency
**Context**: Need for professional medical guidance during crisis
**Priority Level**: P0 - Life Critical

#### State: Provider Selection
```
Layout Structure:
┌─────────────────────────────────────┐
│ 👨‍⚕️ CONTACT HEALTHCARE PROVIDER     │
├─────────────────────────────────────┤
│                                     │
│ Primary Providers:                  │
│                                     │
│ 📞 Dr. Smith (Pediatrician)        │ <- Primary provider
│    Available now • Last seen: 2w   │
│    [CALL NOW] [VIDEO CHAT]         │
│                                     │
│ 📞 Telehealth Ontario              │ <- Telehealth service
│    24/7 Available • Wait: ~5 min   │
│    [CONNECT NOW]                   │
│                                     │
├─────────────────────────────────────┤
│ Emergency Consultation:             │
│                                     │
│ 🚨 Emergency Pediatrician          │ <- Emergency services
│    On-call specialist available    │
│    [EMERGENCY CONSULT]             │
│                                     │
│ 🏥 Hospital Emergency Line         │
│    Direct line to pediatric ER     │
│    [CALL HOSPITAL]                 │
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Provider Cards**:
  - Height: Variable based on content (80-120px)
  - Background: White with subtle blue border (#E5F3FF)
  - Available status: Green indicator dot
  - Unavailable status: Gray indicator with "Next available" time
- **Action Buttons**:
  - Call buttons: Blue background (#3B82F6), white text
  - Video buttons: Purple background (#8B5CF6), white text
  - Emergency buttons: Red background (#DC2626), white text
  - Size: Proportional to urgency and availability

#### State: Active Consultation
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📞 Dr. Smith - Pediatric Emergency  │ <- Active call header
│ 🔴 Recording for medical records    │
├─────────────────────────────────────┤
│                                     │
│ Quick Share Panel:                  │
│                                     │
│ [📋 Medical History]  [📸 Symptoms] │ <- Quick sharing
│ [📊 Vitals]         [📍 Location] │
│                                     │
├─────────────────────────────────────┤
│ Call Controls:                      │
│                                     │
│ [🔇 MUTE]  [📞 HOLD]  [📱 VIDEO]   │ <- Call controls
│                                     │
├─────────────────────────────────────┤
│ Emergency Actions:                  │
│                                     │
│ [🚑 CALL 911]                      │ <- Emergency escalation
│ [🏥 FIND HOSPITAL]                 │
│                                     │
├─────────────────────────────────────┤
│ Call Duration: 03:24               │ <- Call information
│ Next Steps: Follow-up in 2 hours   │
└─────────────────────────────────────┘
```

## Emergency Contact Flow Screens

### Screen: Automated Contact Sequence
**Purpose**: Automated sequential calling of emergency contacts
**Context**: Emergency activated, need to reach responsible adults quickly
**Priority Level**: P0 - Life Critical

#### State: Contact Sequence Active
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📞 CALLING EMERGENCY CONTACTS       │
├─────────────────────────────────────┤
│                                     │
│ Current Call:                       │
│                                     │
│ 📞 Calling Mom (Primary)            │ <- Current call status
│ 📱 [Phone Number]                   │
│ ⏱️ Ringing... 00:15                │
│                                     │
│ [📞 ANSWER] [❌ NO ANSWER]          │ <- Manual control
│                                     │
├─────────────────────────────────────┤
│ Call Queue:                         │
│                                     │
│ ✅ Dad - Connected (00:32)          │ <- Completed calls
│ 🔄 Mom - Calling now               │ <- Current call
│ ⏳ Grandma - Next in queue         │ <- Pending calls
│ ⏳ Emergency Contact - Queued      │
│                                     │
├─────────────────────────────────────┤
│ Emergency Message Sent:             │
│ "Medical emergency with [Child].    │
│ Location: [Address]. Call back      │
│ immediately."                       │
│                                     │
├─────────────────────────────────────┤
│ [🆘 CALL 911] [⏸️ PAUSE CALLS]      │ <- Emergency actions
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Current Call Section**:
  - Background: Light blue (#F0F9FF)
  - Phone icon: Animated ringing animation
  - Timer: Large, prominent display (24px)
  - Status text: Clear, readable (18px)
- **Call Queue Items**:
  - Completed: Green checkmark, success color
  - Active: Blue loading spinner, primary color
  - Pending: Gray clock icon, muted color
  - Failed: Red X icon, error color with retry option
- **Emergency Message Preview**:
  - Background: Light gray (#F9FAFB)
  - Text: 14px regular, preview of automated message
  - Border: Subtle border with rounded corners

#### State: Contact Connected
```
Layout Structure:
┌─────────────────────────────────────┐
│ ✅ CONNECTED TO MOM                 │ <- Success state
├─────────────────────────────────────┤
│                                     │
│ Call Duration: 01:23               │ <- Call information
│ 🔴 Recording for emergency records  │
│                                     │
├─────────────────────────────────────┤
│ Quick Share Options:                │
│                                     │
│ [📍 Share Location]                │ <- Quick actions during call
│ [📸 Send Photos]                   │
│ [📋 Share Medical Info]            │
│                                     │
├─────────────────────────────────────┤
│ Call Controls:                      │
│                                     │
│ [🔇 MUTE]   [🔊 SPEAKER]           │ <- Standard call controls
│ [📞 HOLD]   [➕ ADD CALL]          │
│                                     │
├─────────────────────────────────────┤
│ Continue Emergency Protocol?        │
│                                     │
│ [✅ RESOLVED] [🔄 CONTINUE CALLS]   │ <- Emergency resolution
│                                     │
└─────────────────────────────────────┘
```

## Supply Crisis Management Screens

### Screen: Emergency Supply Calculator
**Purpose**: Real-time calculation of supply needs during crisis
**Context**: Running low on critical supplies, need immediate assessment
**Priority Level**: P1 - Critical

#### State: Supply Assessment
```
Layout Structure:
┌─────────────────────────────────────┐
│ 🛒 EMERGENCY SUPPLY ASSESSMENT      │
├─────────────────────────────────────┤
│                                     │
│ Current Supply Status:              │
│                                     │
│ 🍼 Formula                         │ <- Supply categories
│    ⚠️ 6 hours remaining            │
│    Need: 3 cans for 48 hours      │
│    [FIND STORES] [ORDER NOW]       │
│                                     │
│ 👶 Diapers                         │
│    ✅ 2 days remaining             │
│    Status: Adequate for now        │
│    [SET REMINDER]                  │
│                                     │
│ 💊 Medication                      │
│    🚨 CRITICAL - 1 dose left      │
│    Need: Immediate refill          │
│    [FIND PHARMACY] [CALL DOCTOR]   │
│                                     │
├─────────────────────────────────────┤
│ Emergency Procurement:              │
│                                     │
│ 🏪 Nearest 24h Store: 0.3km       │ <- Location-based solutions
│ 💊 Pharmacy: 0.8km (Open now)     │
│ 🚚 1-hour delivery available      │
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Supply Status Indicators**:
  - Critical (< 12 hours): Red background, white text, urgent icon
  - Warning (< 2 days): Amber background, dark text, warning icon
  - Adequate (> 2 days): Green background, dark text, check icon
  - Each item: 80px height with clear visual hierarchy
- **Action Buttons**:
  - Find/Emergency actions: High contrast, easy to tap during stress
  - Size: Minimum 120×44px for accessibility
  - Colors: Context-appropriate (red for urgent, blue for normal)

#### State: Emergency Alternatives
```
Layout Structure:
┌─────────────────────────────────────┐
│ 🔄 EMERGENCY ALTERNATIVES           │
├─────────────────────────────────────┤
│                                     │
│ Formula Alternatives:               │
│                                     │
│ ✅ Ready-to-feed available at:     │ <- Alternative solutions
│    • Metro Grocery (0.2km)         │
│    • Shoppers Drug Mart (0.5km)    │
│                                     │
│ ⚠️ Different brand options:        │
│    • Enfamil (similar to current)  │ <- Brand alternatives
│    • Similac (check with doctor)   │
│                                     │
│ 🚨 Emergency feeding:              │
│    • Contact lactation consultant  │ <- Emergency options
│    • Emergency formula from ER     │
│                                     │
├─────────────────────────────────────┤
│ Quick Actions:                      │
│                                     │
│ [📞 PEDIATRICIAN]  [🏪 STORES]     │ <- Action buttons
│ [👥 PARENT NETWORK] [ℹ️ MORE INFO] │
│                                     │
└─────────────────────────────────────┘
```

## Location Services Screens

### Screen: Emergency Services Map
**Purpose**: Visual map of nearby emergency services and real-time information
**Context**: Need to locate nearest appropriate emergency care quickly
**Priority Level**: P0 - Life Critical

#### State: Services Overview
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📍 EMERGENCY SERVICES NEARBY        │
├─────────────────────────────────────┤
│                                     │
│ [    MAP VIEW AREA    ]            │ <- Interactive map
│     📍 Your Location               │
│     🏥 Hospital (1.2km)            │ <- Service markers
│     🚑 Ambulance Station (0.8km)   │
│     💊 24h Pharmacy (0.5km)        │
│                                     │
├─────────────────────────────────────┤
│ Nearest Pediatric Care:             │
│                                     │
│ 🏥 Children's Hospital             │ <- Detailed service info
│    📍 1.2 km • 4 min drive         │
│    ⏱️ ER Wait: ~15 min             │
│    ✅ Pediatric specialists        │
│    [GET DIRECTIONS] [CALL NOW]     │
│                                     │
├─────────────────────────────────────┤
│ Alternative Options:                │
│                                     │
│ 🚑 Urgent Care (Pediatric)         │ <- Alternative services
│    📍 2.1 km • 7 min drive         │
│    ⏱️ Wait: ~5 min                 │
│    [DIRECTIONS]                    │
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Map Integration**:
  - Height: 200px interactive map area
  - User location: Blue dot with pulsing animation
  - Service markers: Color-coded by service type
  - Distance rings: Visual indicators for proximity
- **Service Cards**:
  - Height: Variable based on information density
  - Background: White with colored left border (service type)
  - Wait times: Prominent display with real-time updates
  - Action buttons: Contextual based on service type

#### State: Navigation Active
```
Layout Structure:
┌─────────────────────────────────────┐
│ 🧭 NAVIGATING TO CHILDREN'S HOSPITAL │
├─────────────────────────────────────┤
│                                     │
│ [    FULL SCREEN MAP    ]          │ <- Navigation map
│     Turn-by-turn directions         │
│     ETA: 4 minutes                  │
│     Distance remaining: 1.2 km      │
│                                     │
├─────────────────────────────────────┤
│ Next: Turn right on Main St        │ <- Navigation instruction
│ In 200 meters                       │
│                                     │
├─────────────────────────────────────┤
│ Emergency Actions:                  │
│                                     │
│ [📞 CALL HOSPITAL]  [🚑 CALL 911]  │ <- Emergency actions
│                                     │
├─────────────────────────────────────┤
│ 📞 Auto-calling hospital...        │ <- Automated actions
│ Sharing arrival ETA and child info  │
│                                     │
└─────────────────────────────────────┘
```

## Offline Mode Screens

### Screen: Offline Emergency Mode
**Purpose**: Full functionality during network outages or poor connectivity
**Context**: Emergency situation with limited or no network access
**Priority Level**: P0 - Life Critical

#### State: Offline Dashboard
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📶❌ OFFLINE EMERGENCY MODE         │ <- Network status indicator
├─────────────────────────────────────┤
│                                     │
│ Available Offline Functions:        │
│                                     │
│ 📋 Medical Information (Local)      │ <- Cached data available
│ 📞 Emergency Contacts (Cached)     │
│ 🗺️ Offline Maps (Downloaded)      │
│ 💊 Supply Tracking (Local)         │
│                                     │
├─────────────────────────────────────┤
│ Emergency Communications:           │
│                                     │
│ 📞 911 - Voice calls available     │ <- Available services
│ 📱 SMS - Text messages only        │
│ 📻 Emergency broadcasts enabled    │
│                                     │
├─────────────────────────────────────┤
│ Pending Sync Actions:               │
│                                     │
│ • 3 emergency log entries          │ <- Queued actions
│ • 1 medical history update         │
│ • 2 supply level updates           │
│                                     │
│ 🔄 Will sync when connected         │
│                                     │
└─────────────────────────────────────┘
```

**Visual Specifications**:
- **Offline Indicator**:
  - Background: Dark gray (#374151) header
  - Icon: Crossed-out network symbol
  - Text: White with "OFFLINE MODE" clearly visible
- **Available Functions**:
  - Background: Light green (#D1FAE5) for available services
  - Disabled functions: Light gray (#F3F4F6) with reduced opacity
  - Icons: Full color for available, grayscale for unavailable
- **Pending Sync Queue**:
  - Background: Light blue (#F0F9FF)
  - Counter badges: Small numbered indicators
  - Sync indicator: Animated when attempting to connect

#### State: Limited Connectivity
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📶⚠️ LIMITED CONNECTIVITY          │
├─────────────────────────────────────┤
│                                     │
│ Connection Status:                  │
│ Signal: Weak • Data: Limited       │
│                                     │
├─────────────────────────────────────┤
│ Priority Emergency Functions:       │
│                                     │
│ 🚨 911 Emergency (Voice Only)      │ <- High priority services
│ 📱 SMS Emergency Contacts          │
│ 📍 Location Sharing (GPS)          │
│                                     │
├─────────────────────────────────────┤
│ Reduced Functionality:              │
│                                     │
│ ⏸️ Real-time updates paused        │ <- Reduced services
│ 📊 Hospital wait times unavailable │
│ 🔄 Using cached data only          │
│                                     │
├─────────────────────────────────────┤
│ Data Usage: Minimal                 │ <- Data management
│ Emergency mode: Optimized          │
│                                     │
│ [📡 RETRY CONNECTION]              │ <- Connection management
│                                     │
└─────────────────────────────────────┘
```

## Recovery Mode Screens

### Screen: Post-Emergency Documentation
**Purpose**: Capture important information after emergency resolution
**Context**: Emergency resolved, need to document for follow-up care
**Priority Level**: P2 - Important

#### State: Emergency Summary
```
Layout Structure:
┌─────────────────────────────────────┐
│ ✅ EMERGENCY RESOLVED               │
├─────────────────────────────────────┤
│                                     │
│ Emergency Summary:                  │
│                                     │
│ Type: Medical Emergency             │ <- Emergency details
│ Duration: 45 minutes                │
│ Resolved: Hospital visit            │
│ Outcome: Stable, monitoring         │
│                                     │
├─────────────────────────────────────┤
│ Actions Taken:                      │
│                                     │
│ ✅ Called 911 (Response: 8 min)    │ <- Action log
│ ✅ Contacted pediatrician          │
│ ✅ Shared medical history          │
│ ✅ Arrived at hospital             │
│                                     │
├─────────────────────────────────────┤
│ Follow-up Required:                 │
│                                     │
│ 📅 Pediatrician visit: Tomorrow    │ <- Follow-up tasks
│ 💊 Medication adjustment needed    │
│ 📋 Insurance claim filing          │
│                                     │
├─────────────────────────────────────┤
│ [📤 SHARE SUMMARY] [📅 SCHEDULE]   │ <- Actions
│ [💾 SAVE REPORT] [🏠 HOME]         │
│                                     │
└─────────────────────────────────────┘
```

#### State: Feedback Collection
```
Layout Structure:
┌─────────────────────────────────────┐
│ 📝 EMERGENCY RESPONSE FEEDBACK      │
├─────────────────────────────────────┤
│                                     │
│ How was your emergency experience?  │
│                                     │
│ Response Time:                      │
│ ⭐⭐⭐⭐⭐ (Excellent)             │ <- Rating system
│                                     │
│ Information Accuracy:               │
│ ⭐⭐⭐⭐⭐ (Excellent)             │
│                                     │
│ Ease of Use During Crisis:          │
│ ⭐⭐⭐⭐☆ (Very Good)               │
│                                     │
├─────────────────────────────────────┤
│ Additional Comments:                │
│                                     │
│ [Text input area for feedback]      │ <- Feedback text area
│                                     │
├─────────────────────────────────────┤
│ Help Improve Emergency Features:    │
│                                     │
│ [ ] Share anonymized data           │ <- Data sharing options
│ [ ] Participate in research study  │
│ [ ] Beta test new features         │
│                                     │
├─────────────────────────────────────┤
│ [📤 SUBMIT] [⏭️ SKIP] [🏠 HOME]     │ <- Action options
│                                     │
└─────────────────────────────────────┘
```

## Responsive Design Specifications

### Mobile (320-767px)
- **Single Column Layout**: All content stacked vertically
- **Large Touch Targets**: Minimum 60×60px for emergency interactions
- **Simplified Navigation**: Reduced complexity during stress
- **Full-Width Actions**: Emergency buttons span full container width
- **Increased Font Sizes**: Enhanced readability during crisis situations

### Tablet (768-1023px)
- **Two-Column Layout**: Secondary information in sidebar
- **Enhanced Map Views**: Larger interactive map areas
- **Split-Screen Capability**: Multiple emergency functions visible simultaneously
- **Gesture Support**: Swipe navigation between emergency sections
- **Picture-in-Picture**: Video consultations while accessing other emergency features

### Desktop (1024-1439px)
- **Multi-Panel Interface**: Emergency dashboard with multiple information panels
- **Keyboard Shortcuts**: Rapid access via keyboard for power users
- **Enhanced Data Display**: More detailed information visible simultaneously
- **Multi-Window Support**: Separate windows for different emergency functions
- **Advanced Features**: Full feature set available with enhanced workflows

### Wide Screen (1440px+)
- **Command Center Layout**: Comprehensive emergency management interface
- **Multiple Data Streams**: Real-time information from multiple sources
- **Enhanced Collaboration**: Multi-user emergency coordination features
- **Professional Integration**: Healthcare provider collaboration tools
- **Advanced Analytics**: Detailed emergency response analytics and reporting

## Accessibility Specifications

### Visual Accessibility
- **High Contrast Mode**: Enhanced contrast ratios for emergency visibility
- **Large Text Support**: Dynamic scaling up to 200% without layout breaking
- **Color Independence**: No information conveyed by color alone
- **Focus Indicators**: Clear focus indication for keyboard navigation
- **Animation Controls**: Respect for reduced motion preferences

### Motor Accessibility
- **Large Touch Targets**: Minimum 60×60px for all interactive elements
- **Voice Controls**: Complete voice navigation during emergencies
- **Gesture Alternatives**: Multiple input methods for each action
- **Switch Navigation**: Support for assistive input devices
- **Timeout Extensions**: Extended interaction timeouts during emergency stress

### Cognitive Accessibility
- **Simple Language**: Clear, jargon-free emergency instructions
- **Consistent Patterns**: Predictable interaction patterns across all screens
- **Progress Indicators**: Clear indication of emergency response progress
- **Error Prevention**: Safeguards against accidental actions during stress
- **Memory Support**: Visual reminders and progress tracking

### Hearing Accessibility
- **Visual Alerts**: Visual equivalents for all audio emergency alerts
- **Haptic Feedback**: Vibration patterns for critical notifications
- **Text Alternatives**: Complete text alternatives for audio instructions
- **Sign Language Support**: Video calling support for sign language interpretation
- **Transcription**: Real-time transcription for emergency calls when available

This comprehensive screen state documentation ensures that the emergency flows feature maintains optimal usability during high-stress crisis situations while providing complete functionality across all device types and accessibility requirements.