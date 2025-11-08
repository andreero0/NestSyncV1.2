# Emergency Flows - User Journey Analysis

## Overview

This document provides comprehensive user journey mapping for the Emergency Flows feature, covering various crisis scenarios that parents with infants and toddlers may encounter. Each journey is optimized for high-stress situations with psychology-based design principles to support calm decision-making during emergencies.

## User Personas

### Primary Persona: Sarah Chen
- **Profile**: First-time mother with 8-month-old infant
- **Context**: Lives in suburban Toronto, works part-time from home
- **Experience Level**: Anxious parent, moderate technology comfort
- **Key Needs**: Reassurance, clear guidance, rapid access to help
- **Emergency Concerns**: Medical emergencies, feeding issues, childcare backup

### Secondary Persona: Marcus Rodriguez
- **Profile**: Father of toddler twins (18 months), frequent traveler
- **Context**: Business travel requires emergency preparedness away from home
- **Experience Level**: Confident parent, high technology proficiency
- **Key Needs**: Portable emergency resources, travel-specific support
- **Emergency Concerns**: Travel emergencies, medication access, local healthcare

### Tertiary Persona: Jennifer Liu
- **Profile**: Single mother of toddler with chronic asthma
- **Context**: Works full-time, relies on extended family support network
- **Experience Level**: Experienced with medical emergencies, mobile-first user
- **Key Needs**: Medical history management, provider coordination, family network
- **Emergency Concerns**: Respiratory emergencies, medication management, caregiver coordination

## Core Emergency Scenarios

### 1. Medical Emergency Journey
**Scenario**: Child shows concerning symptoms requiring immediate medical assessment
**Persona**: Sarah Chen with 8-month-old showing fever and difficulty breathing
**Priority Level**: P0 - Life Critical
**Duration**: 2-45 minutes depending on severity

#### Pre-Emergency Context
- **Setting**: Home, evening (8:30 PM)
- **Stress Level**: High - first-time mother panic
- **Support Available**: Partner at work, no family nearby
- **Technical Context**: iPhone in hand, good WiFi connection

#### Journey Stage 1: Crisis Recognition (0-30 seconds)
**User State**: Panicked recognition that child needs help
**Emotional State**: High anxiety, tunnel vision, rapid heartbeat

**User Actions**:
1. **Notices concerning symptoms** - Child showing labored breathing and high fever
2. **Initial panic response** - "Something's wrong, I don't know what to do"
3. **Reaches for phone** - Instinctive grab for communication device
4. **Seeks emergency activation** - Looking for fastest way to get help

**System Response**:
- **Emergency detection prompt**: "Are you experiencing an emergency with [Child Name]?"
- **Multiple activation options**: Large emergency button, voice command "Emergency mode", shake gesture
- **Calm visual design**: Reassuring colors, clear instructions, breathing space
- **Immediate availability**: < 500ms load time for emergency mode

**Pain Points Addressed**:
- Overwhelm paralysis through clear single-action activation
- Technology confusion via multiple simple activation methods
- Time pressure through instant emergency mode access
- Isolation fear through immediate connection to help resources

**Success Criteria**:
- Emergency mode activated within 30 seconds of symptom recognition
- User stress visibly reduced through clear interface guidance
- Help resources immediately visible and accessible

#### Journey Stage 2: Emergency Assessment (30 seconds - 2 minutes)
**User State**: In crisis mode, seeking immediate guidance
**Emotional State**: Urgent need for professional assessment

**User Actions**:
1. **Emergency mode activated** - Now in simplified, high-contrast interface
2. **Symptom documentation** - Quick visual symptom checker for infants
3. **Seeks professional guidance** - "Should I call 911 or doctor first?"
4. **Location awareness** - Realizes need to communicate location for help

**System Response**:
- **Pediatric symptom assessment**: Age-appropriate visual symptom checker
- **Severity triage**: "These symptoms require immediate emergency care"
- **Professional guidance**: "Call 911 now, then notify your pediatrician"
- **Auto-location detection**: Current address displayed and ready to share

**Interface Elements**:
```
Emergency Assessment Screen:
┌─────────────────────────────────────┐
│ MEDICAL EMERGENCY - [Child Name] │
├─────────────────────────────────────┤
│ Symptom Quick Check:                │
│ [✓] High fever (>39°C)             │
│ [✓] Difficulty breathing            │
│ [ ] Loss of consciousness           │
│ [ ] Severe allergic reaction        │
├─────────────────────────────────────┤
│ RECOMMENDED ACTION:              │
│ CALL 911 IMMEDIATELY               │
│ These symptoms need emergency care  │
├─────────────────────────────────────┤
│ [CALL 911 NOW]                  │
│ [CALL PEDIATRICIAN]            │
└─────────────────────────────────────┘
```

**Success Criteria**:
- Symptom assessment completed in under 1 minute
- Clear action recommendation provided
- 911 called with location and medical history auto-shared
- Pediatrician notification initiated automatically

#### Journey Stage 3: Emergency Response Coordination (2-15 minutes)
**User State**: Active emergency response, coordinating multiple contacts
**Emotional State**: Focused urgency with systematic support

**User Actions**:
1. **911 call initiated** - Emergency services contacted with auto-shared location
2. **Medical history sharing** - Critical allergies and medications shared with responders
3. **Pediatrician notification** - Doctor alerted to emergency situation
4. **Partner contact** - Emergency message sent to partner at work
5. **Preparation for transport** - Gathering essentials for hospital trip

**System Response**:
- **Emergency services coordination**: Location, child's medical history, symptoms shared
- **Provider notification**: Pediatrician receives emergency alert with symptom details
- **Family network activation**: Automated emergency messages to designated contacts
- **Hospital preparation**: Nearest pediatric emergency room contacted and pre-registered
- **Essential checklist**: Auto-generated list of items to bring to hospital

**Automated Actions**:
```typescript
Emergency Coordination Sequence:
1. 911 Call with Data Package:
   - Child's medical history
   - Current location with GPS coordinates
   - Symptom timeline and severity
   - Emergency contact information

2. Healthcare Provider Alert:
   - Pediatrician emergency notification
   - Medical history shared via secure platform
   - Hospital notification of incoming patient
   - Specialist consultation if needed

3. Family Network Activation:
   - Partner: "Medical emergency with [Child]. Called 911. 
              Current location: [Address]. Come immediately."
   - Emergency contacts: Automated sequence with 30-second intervals
   - Backup childcare: If other children involved
```

**Success Criteria**:
- All critical contacts reached within 5 minutes
- Medical history successfully shared with emergency responders
- Hospital pre-registration completed
- Partner en route to location or hospital

#### Journey Stage 4: Emergency Transport & Hospital (15-30 minutes)
**User State**: In ambulance or en route to hospital
**Emotional State**: Continued anxiety with systematic support

**User Actions**:
1. **Ambulance transport** - Traveling with emergency responders
2. **Continuous monitoring** - Staying connected with partner and pediatrician
3. **Hospital arrival** - Check-in process with pre-shared information
4. **Family coordination** - Managing arrival of partner and family members

**System Response**:
- **Real-time updates**: Live location sharing with family members
- **Hospital coordination**: Pre-registration reduces check-in time
- **Medical continuity**: Complete medical history available to emergency room staff
- **Family communication**: Automated updates to family network about status and location

**Hospital Integration**:
```
Emergency Room Arrival:
┌─────────────────────────────────────┐
│ HOSPITAL CHECK-IN READY          │
├─────────────────────────────────────┤
│ Patient: [Child Name]               │
│ Pre-registered: Complete         │
│ Medical history: Shared          │
│ Insurance: Verified              │
├─────────────────────────────────────┤
│ Family Status:                      │
│ Dad: En route (ETA 12 min)         │
│ Grandma: Contacted, coming         │
│ Pediatrician: Notified, available  │
├─────────────────────────────────────┤
│ [UPDATE FAMILY] [CALL DR]    │
└─────────────────────────────────────┘
```

**Success Criteria**:
- Hospital check-in time reduced to under 5 minutes through pre-registration
- Complete medical history available to emergency room physicians
- Family members successfully notified and en route
- Pediatrician available for consultation if needed

#### Journey Stage 5: Resolution & Recovery (30+ minutes)
**User State**: Emergency resolved, transitioning to normal care
**Emotional State**: Relief with continued vigilance

**User Actions**:
1. **Medical stabilization** - Child's condition stabilized through treatment
2. **Provider consultation** - Pediatrician consulted on treatment plan
3. **Family reunion** - Partner and family members arrive at hospital
4. **Discharge planning** - Preparing for home care or admission

**System Response**:
- **Emergency log completion**: Detailed record of emergency timeline and actions
- **Follow-up scheduling**: Automatic pediatrician follow-up appointment booking
- **Medication management**: Updated medication list and pickup reminders
- **Care plan sharing**: Treatment plan shared with family and regular pediatrician

**Recovery Documentation**:
```
Emergency Resolution Summary:
- Emergency Type: Respiratory distress with fever
- Duration: 42 minutes (symptom recognition to stabilization)
- Outcome: Successful treatment, discharged with medication
- Follow-up: Pediatrician appointment in 24 hours
- Lessons learned: Keep rescue inhaler in emergency kit
- System performance: All contacts reached, medical history accurate
```

**Success Criteria**:
- Child's medical condition stabilized
- Complete emergency documentation for future reference
- Follow-up care scheduled and coordinated
- Family confidence in emergency preparedness increased

### 2. Supply Crisis Emergency Journey
**Scenario**: Running critically low on essential baby supplies during severe weather
**Persona**: Marcus Rodriguez with twins during winter storm
**Priority Level**: P1 - Critical
**Duration**: 1-6 hours depending on availability

#### Pre-Crisis Context
- **Setting**: Home during severe winter storm warning
- **Challenge**: Formula running low, stores may close early
- **Family Size**: Twins requiring double supplies
- **Weather Impact**: Transportation difficult, delivery services limited

#### Journey Stage 1: Supply Alert Recognition (0-15 minutes)
**User State**: Realizes supply shortage during challenging circumstances
**Emotional State**: Concerned planning, weather anxiety

**User Actions**:
1. **Supply level check** - Morning routine reveals low formula supply
2. **Weather assessment** - Checking storm severity and timing
3. **Store availability research** - Finding open stores and delivery options
4. **Emergency calculation** - Determining minimum needs for storm duration

**System Response**:
- **Supply assessment**: Automated calculation based on consumption patterns
- **Weather integration**: Local weather alerts and store closure notifications
- **Emergency procurement options**: 24-hour stores, delivery services, alternatives
- **Backup solution suggestions**: Emergency feeding alternatives, borrowing networks

**Supply Assessment Interface**:
```
Supply Emergency Dashboard:
┌─────────────────────────────────────┐
│ SUPPLY EMERGENCY - Twins         │
├─────────────────────────────────────┤
│ Critical Supply Status:             │
│                                     │
│ Formula: 8 hours remaining       │
│    Need: 6 cans for 48-hour storm  │
│    Status: URGENT procurement needed│
│                                     │
│ Diapers: 18 hours remaining     │
│    Status: Monitor closely          │
│                                     │
│ Weather Impact:                     │
│ Winter storm: Next 36 hours     │
│ Limited delivery available      │
├─────────────────────────────────────┤
│ [FIND STORES] [ORDER NOW]    │
│ [PARENT NETWORK] [ALTERNATIVES]│
└─────────────────────────────────────┘
```

#### Journey Stage 2: Emergency Procurement (15 minutes - 2 hours)
**User State**: Actively securing supplies before weather worsens
**Emotional State**: Urgent efficiency, weather time pressure

**User Actions**:
1. **Store verification** - Confirming store hours and stock availability
2. **Order placement** - Attempting delivery orders with priority timing
3. **Backup planning** - Contacting parent network for emergency sharing
4. **Transportation planning** - Timing store trip before weather peaks

**System Response**:
- **Real-time inventory**: Live store inventory data for formula availability
- **Delivery coordination**: Priority emergency delivery booking
- **Parent network activation**: Connecting with nearby families for emergency sharing
- **Route optimization**: Best travel routes considering weather conditions

**Emergency Procurement Workflow**:
```typescript
Supply Emergency Protocol:
1. Immediate Assessment:
   - Current supply levels vs. emergency duration
   - Weather impact timeline
   - Family consumption patterns (twins = double needs)

2. Procurement Strategy:
   - Priority 1: Emergency delivery (if available)
   - Priority 2: Store pickup before weather peak
   - Priority 3: Community sharing network
   - Priority 4: Emergency alternatives/medical consultation

3. Backup Planning:
   - Alternative formula brands (pediatrician approved)
   - Emergency feeding options
   - Medical emergency protocols if supplies unavailable
```

#### Journey Stage 3: Alternative Solutions (If primary fails)
**User State**: Primary procurement failed, seeking alternatives
**Emotional State**: Increased anxiety, creative problem-solving

**User Actions**:
1. **Community network** - Reaching out to local parent groups for sharing
2. **Alternative products** - Consulting pediatrician about formula alternatives
3. **Emergency services** - Contacting emergency services for supply assistance
4. **Medical consultation** - Professional guidance on emergency feeding

**System Response**:
- **Community coordination**: Automated posts to verified parent networks
- **Medical consultation**: Direct connection to telehealth for feeding guidance
- **Emergency services**: Connection to local emergency supply assistance programs
- **Professional guidance**: Pediatrician consultation on safe alternatives

### 3. Travel Emergency Journey
**Scenario**: Medical emergency while traveling with infant
**Persona**: Sarah Chen traveling with 8-month-old, 2 hours from home
**Priority Level**: P0 - Life Critical
**Duration**: 30 minutes - 4 hours depending on resolution

#### Pre-Emergency Context
- **Location**: Highway travel, 2 hours from home pediatrician
- **Situation**: Visiting grandparents for weekend
- **Medical History**: Child has no major medical issues, current on vaccinations
- **Resources**: Unfamiliar with local healthcare providers

#### Journey Stage 1: Travel Emergency Recognition (0-5 minutes)
**User State**: Child shows concerning symptoms while traveling
**Emotional State**: High anxiety compounded by unfamiliar location

**User Actions**:
1. **Symptom recognition** - Child develops high fever and unusual crying
2. **Location assessment** - Realizes distance from familiar healthcare
3. **Emergency activation** - Activating emergency mode while passenger in car
4. **Decision paralysis** - Uncertain whether to continue to destination or turn back

**System Response**:
- **Location-based emergency services**: Identifying nearest pediatric-capable facilities
- **Travel emergency protocol**: Specialized workflow for away-from-home emergencies
- **Local provider network**: Connecting to regional healthcare providers
- **Decision support**: Clear guidance on whether to continue or seek immediate local care

**Travel Emergency Interface**:
```
Travel Emergency Dashboard:
┌─────────────────────────────────────┐
│ TRAVEL EMERGENCY                 │
│ Current: Highway 401, Belleville │
├─────────────────────────────────────┤
│ Nearest Pediatric Care:             │
│                                     │
│ Belleville General Hospital      │
│    12 km • 15 min drive          │
│    Pediatric emergency available │
│    [GET DIRECTIONS] [CALL AHEAD]    │
│                                     │
│ vs. Continue to Destination:     │
│    Grandparents: 45 min drive    │
│    Kingston Hospital: 50 min     │
├─────────────────────────────────────┤
│ RECOMMENDATION: Stop immediately │
│ Child's symptoms require prompt care │
├─────────────────────────────────────┤
│ [CALL 911] [GO TO HOSPITAL]   │
│ [CALL GRANDPARENTS] [TELEHEALTH]│
└─────────────────────────────────────┘
```

#### Journey Stage 2: Local Emergency Care Access (5-30 minutes)
**User State**: Seeking care at unfamiliar medical facility
**Emotional State**: Anxiety about quality of care, unfamiliar environment

**User Actions**:
1. **Hospital navigation** - Driving to nearest pediatric emergency facility
2. **Grandparent notification** - Alerting destination family about emergency
3. **Medical history preparation** - Ensuring complete medical information available
4. **Insurance verification** - Confirming coverage for out-of-area care

**System Response**:
- **Hospital pre-notification**: Alerting emergency room about incoming patient
- **Medical history sharing**: Complete child medical profile shared with facility
- **Insurance coordination**: Verification of coverage for emergency care
- **Family communication**: Updates to grandparents and home support network

**Local Care Coordination**:
```
Travel Emergency Care Package:
- Complete medical history and immunization records
- Home pediatrician contact information
- Insurance and identification information  
- Emergency contact list with relationships
- Current medications and allergies
- Recent illness history and normal behavior patterns
- Preferred pharmacy for prescription fulfillment
```

#### Journey Stage 3: Care Coordination & Resolution (30 minutes - 4 hours)
**User State**: Receiving care while managing family communications
**Emotional State**: Relief at professional care, continued travel anxiety

**User Actions**:
1. **Medical treatment** - Child receiving appropriate emergency care
2. **Provider coordination** - Local physician consulting with home pediatrician
3. **Family updates** - Keeping grandparents and partner informed
4. **Travel decision making** - Determining whether safe to continue travel

**System Response**:
- **Provider-to-provider communication**: Seamless information sharing between doctors
- **Real-time family updates**: Automated status updates to family network
- **Travel safety assessment**: Medical guidance on continued travel advisability
- **Follow-up coordination**: Scheduling care continuation at destination or home

### 4. Childcare Emergency Journey
**Scenario**: Regular caregiver suddenly unavailable during work day
**Persona**: Jennifer Liu needs immediate backup childcare for toddler with asthma
**Priority Level**: P1 - Critical
**Duration**: 30 minutes - 4 hours

#### Pre-Emergency Context
- **Setting**: Work day, regular babysitter calls in sick
- **Medical Complexity**: Toddler has asthma requiring medication management
- **Work Requirements**: Important meeting cannot be rescheduled
- **Family Network**: Limited local family support

#### Journey Stage 1: Caregiver Emergency Recognition (0-10 minutes)
**User State**: Sudden loss of childcare with work obligations
**Emotional State**: Stress about work commitments, child safety concerns

**User Actions**:
1. **Emergency notification** - Babysitter calls sick 30 minutes before needed
2. **Backup assessment** - Quickly reviewing available childcare options
3. **Work communication** - Notifying employer about potential childcare crisis
4. **Medical consideration** - Ensuring backup caregiver can handle asthma needs

**System Response**:
- **Emergency caregiver network**: Accessing verified backup childcare providers
- **Medical competency matching**: Finding caregivers trained in asthma management
- **Availability confirmation**: Real-time availability of emergency childcare options
- **Quick vetting process**: Expedited background check confirmation for emergency providers

**Emergency Childcare Dashboard**:
```
Childcare Emergency Options:
┌─────────────────────────────────────┐
│ EMERGENCY CHILDCARE NEEDED       │
│ Child: Emma (2y) with asthma        │
├─────────────────────────────────────┤
│ Available Emergency Caregivers:     │
│                                     │
│ Maria Santos                     │
│   Asthma management certified    │
│   10 min away • Available now   │
│   4.9 rating • Background verified     │
│   [BOOK NOW] [VIEW PROFILE]        │
│                                     │
│ Grandma Rose (Agency)           │
│   Medical needs experience       │
│   15 min away • Available 11am  │
│   5.0 rating • Pediatric nurse   │
│   [BOOK NOW] [CALL DIRECTLY]       │
├─────────────────────────────────────┤
│ Medical Information Package Ready:  │
│ Asthma action plan              │
│ Medication instructions         │
│ Emergency contacts              │
│ Pediatrician information        │
└─────────────────────────────────────┘
```

#### Journey Stage 2: Emergency Care Arrangement (10-45 minutes)
**User State**: Securing qualified backup care with medical needs
**Emotional State**: Relief at finding solution, anxiety about new caregiver

**User Actions**:
1. **Caregiver selection** - Choosing provider based on medical competency
2. **Medical briefing** - Sharing asthma management protocols
3. **Emergency preparation** - Setting up medications and action plans
4. **Comfort transition** - Helping toddler adjust to new caregiver

**System Response**:
- **Medical information transfer**: Complete asthma action plan shared with caregiver
- **Emergency protocol setup**: Provider receives all emergency contact information
- **Real-time monitoring**: Check-in reminders and status updates throughout day
- **Pediatrician notification**: Doctor alerted to temporary caregiver arrangement

**Medical Handoff Protocol**:
```
Emergency Caregiver Medical Briefing:
1. Asthma Management:
   - Rescue inhaler location and usage instructions
   - Warning signs requiring immediate medical attention
   - Peak flow meter readings and normal ranges
   - Environmental triggers to avoid

2. Emergency Procedures:
   - Step-by-step asthma emergency protocol
   - When to call 911 vs. pediatrician
   - Parent contact priority and methods
   - Hospital preference and location

3. Comfort and Routine:
   - Normal daily schedule and nap times
   - Comfort items and soothing techniques
   - Food preferences and restrictions
   - Behavioral management strategies
```

## Cross-Journey Pain Points & Solutions

### Common User Pain Points Across All Scenarios

#### Information Paralysis
**Problem**: Users become overwhelmed by too many options during crisis
**Psychology**: High stress reduces cognitive processing ability
**Solution**: 
- Single primary action prominently displayed
- Progressive disclosure of additional options
- Clear visual hierarchy prioritizing most critical actions

#### Technology Barrier During Stress
**Problem**: Normal technology proficiency decreases during crisis
**Psychology**: Fight-or-flight response impairs fine motor skills and complex thinking
**Solution**:
- Large touch targets (minimum 60px)
- Simple gestures (tap and swipe only)
- Voice activation as alternative input method
- Multiple activation methods for same function

#### Trust and Verification Anxiety
**Problem**: Users need reassurance that emergency actions are being taken correctly
**Psychology**: Crisis situations heighten need for control and confirmation
**Solution**:
- Clear confirmation messages for all actions taken
- Visual progress indicators for emergency processes
- Real-time status updates from emergency services and providers
- Professional validation badges and credentials visible

#### Isolation and Communication Breakdown
**Problem**: Users feel alone and disconnected during emergencies
**Psychology**: Social support crucial for stress management and decision-making
**Solution**:
- Automated family network notifications
- Direct professional communication channels
- Community support network integration
- Clear communication of help en route

## Success Metrics by Journey Stage

### Recognition Stage Metrics
- **Time to Emergency Activation**: < 30 seconds from symptom recognition
- **Activation Success Rate**: > 95% successful emergency mode entry
- **Multi-Modal Access**: Users utilize at least 2 different activation methods
- **Stress Reduction Indicators**: Decreased reported anxiety after activation

### Assessment Stage Metrics  
- **Symptom Assessment Completion**: < 2 minutes for complete assessment
- **Triage Accuracy**: > 90% alignment with professional medical assessment
- **Information Completeness**: 100% of critical medical information accessible
- **Decision Confidence**: > 80% user confidence in recommended actions

### Response Coordination Metrics
- **Emergency Service Contact Time**: < 5 minutes to first professional contact
- **Information Sharing Success**: 100% of medical history successfully shared
- **Family Network Activation**: > 90% of emergency contacts reached within 10 minutes
- **Provider Coordination**: 100% pediatrician notification success rate

### Resolution Metrics
- **Emergency Resolution Time**: Measured improvement in total emergency duration
- **Hospital Efficiency**: > 50% reduction in emergency room check-in time
- **Follow-up Completion**: > 85% completion rate for recommended follow-up care
- **System Learning**: Continuous improvement in emergency response based on outcomes

### Long-term Impact Metrics
- **Emergency Preparedness**: Increased family emergency readiness scores
- **Provider Satisfaction**: Positive feedback from healthcare providers on information quality
- **Community Resilience**: Strengthened parent support networks through emergency sharing
- **Outcome Improvement**: Better child health outcomes through coordinated emergency care

## Behavioral Psychology Integration

### Cognitive Load Reduction Strategies
- **Chunking Information**: Maximum 3-4 items per decision point
- **Visual Grouping**: Related actions clustered with clear visual boundaries
- **Progressive Disclosure**: Advanced options hidden until specifically requested
- **Consistent Mental Models**: Same interaction patterns across all emergency types

### Stress Response Optimization
- **Color Psychology**: Calming blues for navigation, urgent reds only for true emergencies
- **Spatial Design**: Generous whitespace prevents visual overwhelm
- **Motion Design**: Subtle animations provide feedback without distraction
- **Haptic Integration**: Tactile confirmation for critical actions

### Decision-Making Support
- **Default Recommendations**: System suggests optimal actions based on situation assessment
- **Confidence Building**: Clear explanations of why specific actions are recommended
- **Expert Validation**: Professional credentials and affiliations prominently displayed
- **Social Proof**: Community usage indicators where appropriate for reassurance

### Recovery and Learning Integration
- **Positive Reinforcement**: Celebration of successful emergency resolution
- **Learning Capture**: Gentle feedback collection for continuous improvement
- **Preparedness Building**: Suggestions for improving future emergency readiness
- **Community Sharing**: Optional sharing of experiences to help other families

This comprehensive user journey analysis ensures that the emergency flows feature supports parents through the complete crisis lifecycle, from initial recognition through full resolution and learning, with psychology-based design principles optimizing for calm decision-making during high-stress situations.