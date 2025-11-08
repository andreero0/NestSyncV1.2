# NestSync Three-Screen + Context-Aware FAB Navigation Architecture

## Executive Summary

### Project Overview
NestSync requires an enhanced navigation system featuring three primary screens (Home, Planner, Settings) plus a context-aware Floating Action Button (FAB) to improve the user experience for diaper tracking and planning. This architecture builds upon the existing Expo Router foundation while adding advanced navigation patterns optimized for stressed parents managing child care logistics.

### Key Architectural Decisions
- **Enhanced Expo Router Integration**: Leverage existing file-based routing with React Navigation components already installed
- **Context-Aware FAB System**: Portal-based overlay FAB that changes function based on current screen context
- **Psychology-Driven Design**: Screen organization focused on reducing cognitive load for stressed parents
- **Canadian Compliance**: Maintain PIPEDA compliance and Canadian data residency requirements
- **Cross-Platform Compatibility**: Ensure consistent experience across iOS, Android, and Web

### Technology Stack Summary
- **Navigation Framework**: Expo Router with React Navigation Bottom Tabs (already installed)
- **State Management**: React Context for FAB state + existing Zustand for app state
- **UI Components**: Existing IconSymbol system with SF Symbols
- **Theme Integration**: Current useColorScheme and Colors system
- **Animation**: React Native Reanimated (already installed)

### System Component Overview
```
┌─────────────────────────────────────────────────┐
│                 FAB Provider                    │
│  ┌─────────────────────────────────────────┐   │
│  │            Tab Navigator                │   │
│  │  ┌─────┐  ┌─────────┐  ┌─────────┐    │   │
│  │  │Home │  │Planner  │  │Settings │    │   │
│  │  │ FAB │  │   FAB   │  │   FAB   │    │   │
│  │  └─────┘  └─────────┘  └─────────┘    │   │
│  └─────────────────────────────────────────┘   │
│                    ┌─────┐                     │
│                    │ FAB │ (Portal Overlay)    │
│                    └─────┘                     │
└─────────────────────────────────────────────────┘
```

### Critical Technical Constraints
- Must preserve existing authentication and onboarding flows
- Maintain current GraphQL client integration
- Ensure 60fps performance across all platforms
- WCAG AA accessibility compliance required
- Canadian data residency and PIPEDA compliance

## Current System Analysis

### Strengths of Existing Architecture
1. **Solid Foundation**: Expo Router with file-based routing provides clean, maintainable structure
2. **Dependencies Ready**: React Navigation packages (@react-navigation/bottom-tabs@^7.3.10, @react-navigation/native@^7.1.6) already installed
3. **Theme System**: Well-implemented useColorScheme hook with Colors constants
4. **Icon System**: IconSymbol component using SF Symbols provides consistent iconography
5. **Authentication Integration**: Existing Supabase auth with Zustand state management

### Current File Structure Analysis
```
NestSync-frontend/app/(tabs)/
├── _layout.tsx     # Tab navigator (2 tabs currently)
├── index.tsx       # Home screen (basic demo content)
└── explore.tsx     # Explore screen (demo content)
```

### Limitations Identified
1. **Limited Functionality**: Current screens contain only demo content
2. **Missing Third Screen**: Only two tabs (Home, Explore) vs required three screens
3. **No FAB Integration**: Missing context-aware primary action button
4. **Static Content**: No dynamic dashboard or diaper tracking functionality

### Integration Compatibility Assessment
- **Expo Router + React Navigation**: Excellent compatibility (Expo Router built on React Navigation)
- **Portal Pattern Support**: React Native supports Portal patterns for overlay components
- **Theme Integration**: Existing color scheme system can be extended to FAB components
- **Performance Impact**: Minimal - additive changes, not architectural overhauls

## Three-Screen Navigation Architecture

### Home Screen: Dashboard & Quick Access
**Purpose**: Primary landing screen optimized for quick glance and immediate action

**Key Components**:
- **Recent Activity Feed**: Last 5 diaper logs with time stamps
- **Quick Stats Widget**: Changes today, time since last change
- **Inventory Alerts**: Low supply warnings with visual indicators
- **Child Selector**: Multi-child support with profile switching
- **Quick Action Cards**: Shortcuts to common tasks (feeding, sleep logs)

**FAB Function**: "Quick Log Diaper"
- Opens modal with time chip interface (Now, 1h ago, 2h ago, Custom)
- Pre-filled with most recent diaper type based on patterns
- Single-tap logging to minimize interaction time

**Psychology Focus**: 
- Reduce cognitive load with glanceable information
- Immediate access to most common action (diaper logging)
- Calming color palette (blues/greens) to reduce stress

### Planner Screen: Timeline & Proactive Management
**Purpose**: Future-oriented planning and pattern recognition interface

**Key Components**:
- **Timeline View**: Daily/weekly schedule with diaper predictions
- **Inventory Dashboard**: Current supplies with reorder suggestions
- **Pattern Analysis**: Feeding/sleep correlations with diaper changes
- **Schedule Recommendations**: ML-driven suggestions for optimization
- **Supply Planning**: Automated reorder reminders based on usage patterns

**FAB Function**: "Add Schedule" or "Quick Inventory"
- Context-aware: Shows "Add Schedule" when viewing timeline
- Shows "Add Inventory" when viewing supply management
- Opens appropriate modal for selected action

**Psychology Focus**:
- Proactive planning reduces parental anxiety
- Visual timeline helps with predictability
- Gentle nudges rather than demanding alerts

### Settings Screen: Control & Privacy Management
**Purpose**: Account management with strong focus on Canadian privacy compliance

**Key Components**:
- **Profile Management**: User account and child profiles
- **Privacy Controls**: Granular consent management (PIPEDA compliant)
- **Notification Preferences**: Customizable alert settings
- **Theme Selection**: Light/dark/system preferences
- **Data Management**: Export, backup, and deletion options
- **Canadian Trust Indicators**: "Data stored in Canada" badges

**FAB Function**: "Help & Support" or Hidden
- Context-sensitive help system
- Direct access to Canadian-compliant support
- May be hidden on settings screen to reduce visual clutter

**Psychology Focus**:
- Transparency builds trust with stressed parents
- Clear control over personal data reduces privacy anxiety
- Canadian context messaging reinforces local compliance

### Screen Transition Design
- **Smooth Animations**: 60fps transitions with React Native Reanimated
- **Haptic Feedback**: Subtle feedback on tab switches (iOS)
- **Loading States**: Skeleton screens for data loading
- **Error Handling**: Graceful degradation with offline support

## Context-Aware FAB Architecture

### FAB State Management System

**React Context Implementation**:
```typescript
interface FABContextType {
  currentScreen: 'home' | 'planner' | 'settings';
  fabConfig: {
    action: () => void;
    icon: string; // SF Symbol name
    label: string;
    isVisible: boolean;
    backgroundColor: string;
  };
  updateFABConfig: (config: Partial<FABConfig>) => void;
}
```

**Provider Structure**:
- FABProvider wraps the entire tab navigator
- Uses usePathname() from expo-router to detect current screen
- Automatically updates FAB configuration on navigation
- Provides context to all child components

### Screen-Specific FAB Configurations

**Home Screen FAB**:
- **Icon**: "plus.circle.fill" (SF Symbol)
- **Label**: "Quick Log"
- **Action**: Opens QuickLogModal with time chips
- **Color**: Primary blue (#0891B2)

**Planner Screen FAB**:
- **Icon**: "calendar.badge.plus" (SF Symbol) 
- **Label**: "Add Schedule" / "Add Inventory" (context-aware)
- **Action**: Opens ScheduleModal or InventoryModal
- **Color**: Secondary teal (#14B8A6)

**Settings Screen FAB**:
- **Icon**: "questionmark.circle" (SF Symbol)
- **Label**: "Help"
- **Action**: Opens support modal or help system
- **Color**: Neutral gray (#6B7280)
- **Visibility**: May be hidden for cleaner settings interface

### Technical Implementation Details

**Portal-Based Overlay**:
```typescript
// Component renders outside normal hierarchy
<Portal>
  <Animated.View style={[styles.fab, animatedStyle]}>
    <Pressable onPress={fabConfig.action}>
      <IconSymbol name={fabConfig.icon} color="white" size={24} />
    </Pressable>
  </Animated.View>
</Portal>
```

**Positioning Strategy**:
- **Absolute Positioning**: `position: 'absolute', bottom: 90, right: 16`
- **Safe Area Aware**: Adjusts for iOS safe area and Android navigation
- **Tab Bar Clearance**: Positioned above tab bar without interference
- **Z-Index Management**: High z-index ensures visibility above all content

**Animation System**:
- **Fade Transitions**: When FAB content changes between screens
- **Scale Animation**: Subtle bounce effect on tap
- **Color Transitions**: Smooth color changes when screen context updates
- **Entry/Exit**: Slide up from bottom on app launch

### Integration Points

**Navigation Integration**:
- usePathname() hook detects current route
- useEffect updates FAB context on route changes
- No interference with existing tab navigation logic

**Theme Integration**:
- Inherits from current Colors constants
- Respects light/dark mode preferences
- Consistent with existing IconSymbol styling

**Accessibility Integration**:
- Proper accessibility labels and roles
- Screen reader announcements for context changes
- Keyboard navigation support for web platform

## Component Architecture & File Structure

### Enhanced File Structure
```
NestSync-frontend/
├── app/(tabs)/
│   ├── _layout.tsx           # Enhanced with FAB context provider
│   ├── index.tsx            # Home Dashboard (redesigned)
│   ├── planner.tsx          # New - Timeline & Inventory
│   └── settings.tsx         # New - Account & Privacy
├── contexts/
│   └── FABContext.tsx       # Context-aware FAB state management
├── components/
│   ├── navigation/
│   │   ├── ContextAwareFAB.tsx      # Main FAB component
│   │   ├── FABProvider.tsx          # Context provider wrapper
│   │   └── TabBarBackground.tsx     # Existing component
│   ├── screens/
│   │   ├── dashboard/               # Home screen components
│   │   │   ├── RecentActivity.tsx
│   │   │   ├── QuickStats.tsx
│   │   │   ├── InventoryAlerts.tsx
│   │   │   └── ChildSelector.tsx
│   │   ├── planner/                 # Planner screen components
│   │   │   ├── Timeline.tsx
│   │   │   ├── InventoryDashboard.tsx
│   │   │   ├── PatternAnalysis.tsx
│   │   │   └── ScheduleRecommendations.tsx
│   │   └── settings/                # Settings screen components
│   │       ├── ProfileManagement.tsx
│   │       ├── PrivacyControls.tsx
│   │       ├── NotificationPrefs.tsx
│   │       └── DataManagement.tsx
│   └── modals/
│       ├── QuickLogModal.tsx        # FAB-triggered from Home
│       ├── ScheduleModal.tsx        # FAB-triggered from Planner
│       ├── InventoryModal.tsx       # FAB-triggered from Planner
│       └── SupportModal.tsx         # FAB-triggered from Settings
└── hooks/
    ├── useFABContext.tsx           # Custom hook for FAB state
    └── useScreenDetection.tsx      # Screen detection utilities
```

### Component Design Specifications

**ContextAwareFAB Component**:
```typescript
interface ContextAwareFABProps {
  size?: number;
  style?: ViewStyle;
}

export const ContextAwareFAB: React.FC<ContextAwareFABProps> = ({
  size = 56,
  style
}) => {
  const { fabConfig } = useFABContext();
  const { colors } = useTheme();
  
  return (
    <Portal>
      <Animated.View style={[styles.container, style]}>
        <Pressable 
          style={[styles.fab, { backgroundColor: fabConfig.backgroundColor }]}
          onPress={fabConfig.action}
          accessibilityLabel={fabConfig.label}
          accessibilityRole="button"
        >
          <IconSymbol 
            name={fabConfig.icon} 
            color="white" 
            size={24} 
          />
        </Pressable>
      </Animated.View>
    </Portal>
  );
};
```

**FABProvider Context**:
```typescript
export const FABProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  const pathname = usePathname();
  const [fabConfig, setFabConfig] = useState<FABConfig>(defaultConfig);
  
  useEffect(() => {
    const config = getFABConfigForScreen(pathname);
    setFabConfig(config);
  }, [pathname]);
  
  return (
    <FABContext.Provider value={{ fabConfig, updateFABConfig: setFabConfig }}>
      {children}
      <ContextAwareFAB />
    </FABContext.Provider>
  );
};
```

### Integration Strategy & Migration Path

**Phase 1: Foundation Setup (Week 1)**
- Add third tab (settings) to existing _layout.tsx
- Create basic Settings screen with placeholder content
- Ensure existing Home and Explore tabs continue working
- Test cross-platform compatibility

**Phase 2: FAB Context Implementation (Week 2)**
- Implement FABContext and FABProvider
- Add ContextAwareFAB component with basic functionality
- Integrate with existing tab navigation
- Test Portal overlay positioning across platforms

**Phase 3: Screen Enhancement (Week 3-4)**
- Replace demo content in Home screen with Dashboard components
- Build Planner screen with Timeline and Inventory features
- Enhance Settings screen with privacy and profile management
- Implement screen-specific FAB actions

**Phase 4: Context-Aware Functionality (Week 5)**
- Connect FAB actions to appropriate modals
- Implement time chip interface for quick logging
- Add schedule and inventory management modals
- Polish animations and transitions

**Phase 5: Testing & Accessibility (Week 6)**
- Comprehensive accessibility testing
- Performance optimization for 60fps
- Cross-platform consistency verification
- Canadian compliance audit

### Risk Mitigation Strategies

**Technical Risks**:
- **Portal Rendering Issues**: Fallback to absolute positioning if Portal fails
- **Animation Performance**: Use native driver and optimize re-renders
- **Navigation Conflicts**: Comprehensive testing of edge cases
- **Memory Leaks**: Proper cleanup of listeners and contexts

**Compatibility Risks**:
- **Expo Router Updates**: Pin to stable versions, test upgrades carefully
- **React Navigation Changes**: Monitor breaking changes, maintain compatibility
- **Platform Differences**: Extensive testing on iOS, Android, and Web

**User Experience Risks**:
- **Cognitive Overload**: Conduct user testing with stressed parent personas
- **Accessibility Barriers**: Screen reader testing and keyboard navigation
- **Performance Degradation**: Monitor bundle size and render performance

## Team Handoff Specifications

### For Frontend Engineers

**Component Implementation Priorities**:
1. **ContextAwareFAB**: Core component with Portal overlay and animations
2. **Dashboard Components**: RecentActivity, QuickStats, InventoryAlerts
3. **Planner Components**: Timeline, InventoryDashboard, PatternAnalysis
4. **Modal Components**: QuickLogModal with time chips interface

**API Integration Patterns**:
```typescript
// Existing GraphQL client patterns to follow
const { data, loading, error } = useQuery(GET_RECENT_LOGS, {
  variables: { childId: currentChild.id },
  fetchPolicy: 'cache-first'
});

// FAB action example
const handleQuickLog = async (timeOffset: number) => {
  await createDiaperLogMutation({
    variables: {
      childId: currentChild.id,
      timestamp: new Date(Date.now() - timeOffset),
      type: predictedType
    }
  });
};
```

**State Management Integration**:
- Use existing Zustand authStore for user state
- Leverage Apollo Client for server state
- FABContext only manages FAB-specific UI state
- Follow established error handling patterns

**Performance Optimization Requirements**:
- Implement React.memo for expensive components
- Use FlatList for any long lists (activity feeds)
- Optimize images with expo-image
- Debounce user interactions and API calls

### For QA Engineers

**Testing Strategy**:

**Functional Testing**:
- Verify FAB changes context appropriately on tab switches
- Test all modal interactions triggered by FAB
- Validate time chip functionality in QuickLogModal
- Confirm data persistence across navigation

**Cross-Platform Testing**:
- iOS: Test with various safe area configurations
- Android: Verify navigation bar interactions
- Web: Keyboard navigation and accessibility
- Test on multiple screen sizes and orientations

**Performance Testing**:
- Monitor navigation transition smoothness (60fps target)
- Test with large datasets (100+ diaper logs)
- Memory usage monitoring during extended sessions
- Battery usage impact assessment

**Accessibility Testing**:
- Screen reader compatibility (TalkBack, VoiceOver)
- Keyboard navigation support
- Color contrast verification (WCAG AA)
- Focus management during modal presentations

**Edge Case Testing**:
- Network connectivity loss during FAB actions
- Rapid tab switching and FAB interactions
- Background/foreground app state changes
- Various device orientations and screen densities

### For Security Analysts

**Privacy Architecture Review**:

**Canadian Compliance Verification**:
- Audit data flow to ensure Canadian residency
- Verify PIPEDA consent management implementation
- Review privacy control granularity in Settings screen
- Confirm data export/deletion functionality

**Authentication Integration Security**:
- Verify existing Supabase auth flows remain secure
- Test JWT token refresh during navigation
- Confirm secure storage usage (Expo SecureStore)
- Review session management during FAB interactions

**Data Protection Measures**:
- Encrypt sensitive data in transit and at rest
- Implement proper input validation for all forms
- Secure API endpoints against unauthorized access
- Regular security audit of dependencies

**Trust Indicator Implementation**:
- "Data stored in Canada" messaging accuracy
- Privacy policy accessibility and clarity
- Consent flow user experience optimization
- Audit trail for user privacy choices

### Implementation Timeline & Milestones

**Week 1: Foundation**
- [ ] Add third tab to navigation
- [ ] Basic Settings screen implementation
- [ ] FAB context provider setup
- [ ] Cross-platform testing of navigation changes

**Week 2: FAB System**
- [ ] ContextAwareFAB component implementation
- [ ] Portal overlay positioning
- [ ] Basic FAB animations
- [ ] Screen detection and context switching

**Week 3: Dashboard Development**
- [ ] Home screen dashboard components
- [ ] Recent activity feed with GraphQL integration
- [ ] Quick stats widget with real-time data
- [ ] Inventory alerts system

**Week 4: Planner Features**
- [ ] Timeline view implementation
- [ ] Inventory dashboard with supply tracking
- [ ] Pattern analysis components
- [ ] Schedule recommendations engine

**Week 5: Modal Integration**
- [ ] QuickLogModal with time chips
- [ ] ScheduleModal for planner actions
- [ ] InventoryModal for supply management
- [ ] SupportModal for settings help

**Week 6: Polish & Testing**
- [ ] Animation optimization and smoothness
- [ ] Comprehensive accessibility testing
- [ ] Performance optimization
- [ ] Canadian compliance audit
- [ ] User acceptance testing

**Success Criteria**:
- All navigation transitions maintain 60fps performance
- FAB context changes smoothly without glitches
- Accessibility score of AA or higher across all screens
- Zero breaking changes to existing authentication flows
- Canadian compliance verification complete
- Positive user feedback from stressed parent test group

This architecture provides a comprehensive foundation for implementing the three-screen + context-aware FAB navigation system while maintaining the high-quality, psychology-driven user experience that NestSync requires.