# Dashboard Traffic Light System - Implementation Guide

## Developer Handoff Overview

This guide provides specific implementation instructions for developing the 4-card traffic light dashboard system in React Native with Expo. All specifications integrate seamlessly with the existing NestSync architecture and theme system.

## Project Integration Points

### Existing Architecture Integration
- **Theme System**: Uses existing `contexts/ThemeContext.tsx` for light/dark mode support
- **Color System**: Leverages established `constants/Colors.ts` psychology-driven palette
- **Component Patterns**: Follows existing component architecture and TypeScript standards
- **Navigation**: Integrates with file-based routing system in `app/(tabs)/` directory

### File Structure
```
app/
├── components/
│   ├── cards/
│   │   ├── StatusOverviewCard.tsx          # Core card component
│   │   └── StatusOverviewGrid.tsx          # Grid layout wrapper
│   └── icons/
│       ├── AlertTriangleIcon.tsx           # Critical items icon
│       ├── ClockIcon.tsx                   # Low stock icon  
│       ├── CheckCircleIcon.tsx             # Well stocked icon
│       └── PackageIcon.tsx                 # Pending orders icon
└── (tabs)/
    └── dashboard.tsx                       # Integration point
```

## StatusOverviewCard Component Implementation

### Core Component Structure
```typescript
// app/components/cards/StatusOverviewCard.tsx
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../contexts/ThemeContext';
import { Colors } from '../../../constants/Colors';

export interface StatusOverviewCardProps {
  statusType: 'critical' | 'low' | 'stocked' | 'pending';
  title: string;
  count: number;
  description?: string;
  icon: React.ComponentType<IconProps>;
  borderColor: string;
  onPress?: () => void;
  loading?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  testID?: string;
}

export interface IconProps {
  size?: number;
  color?: string;
  accessibilityLabel?: string;
}

export function StatusOverviewCard({
  statusType,
  title,
  count,
  description,
  icon: IconComponent,
  borderColor,
  onPress,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  testID,
}: StatusOverviewCardProps) {
  const { actualTheme } = useTheme();
  const colors = Colors[actualTheme];
  
  const styles = createStyles(colors, borderColor, disabled, loading);
  
  const handlePress = () => {
    if (!disabled && !loading && onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={handlePress}
      disabled={disabled || loading}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || `${title}: ${count} items`}
      accessibilityHint={accessibilityHint || "Tap for detailed view"}
      testID={testID || `status-card-${statusType}`}
    >
      <View style={styles.header}>
        <IconComponent
          size={20} // Mobile: 20px, Tablet+: 24px via responsive styles
          color={colors.text}
          accessibilityLabel={`${title} status indicator`}
        />
        <Text style={styles.title}>{title}</Text>
      </View>
      
      <Text style={styles.count}>
        {loading ? '–' : count.toString()}
      </Text>
      
      {description && (
        <Text style={styles.description}>
          {description}
        </Text>
      )}
      
      {loading && <View style={styles.loadingOverlay} />}
    </TouchableOpacity>
  );
}
```

### Dynamic Styling Function
```typescript
// Responsive styling with theme integration
const createStyles = (colors: ColorPalette, borderColor: string, disabled: boolean, loading: boolean) => 
  StyleSheet.create({
    card: {
      backgroundColor: disabled ? colors.surface : colors.background,
      borderWidth: 3,
      borderColor: disabled ? colors.border : borderColor,
      borderRadius: 12,
      padding: 16, // Mobile padding - use responsive hook for tablet+
      opacity: loading ? 0.6 : disabled ? 0.3 : 1,
      shadowColor: colors.text,
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 3,
      elevation: 2, // Android shadow
    },
    
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    
    title: {
      fontSize: 14, // Mobile: 14px, Tablet+: 16px via responsive styles
      lineHeight: 20,
      fontWeight: '500',
      color: colors.text,
      marginLeft: 8,
      flex: 1,
    },
    
    count: {
      fontSize: 32, // Mobile: 32px, scales up for tablet/desktop
      lineHeight: 36,
      fontWeight: '700',
      color: colors.textEmphasis,
      letterSpacing: -0.02,
      marginBottom: 4,
    },
    
    description: {
      fontSize: 12, // Mobile: 12px, Tablet+: 14px via responsive styles
      lineHeight: 16,
      fontWeight: '400',
      color: colors.textSecondary,
    },
    
    loadingOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
      borderRadius: 12,
    },
  });
```

## StatusOverviewGrid Layout Component

### Grid Wrapper Implementation
```typescript
// app/components/cards/StatusOverviewGrid.tsx
import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusOverviewCard, StatusOverviewCardProps } from './StatusOverviewCard';

interface StatusOverviewGridProps {
  cards: StatusOverviewCardProps[];
}

export function StatusOverviewGrid({ cards }: StatusOverviewGridProps) {
  const { width } = Dimensions.get('window');
  const isMobile = width < 768;
  const isTablet = width >= 768 && width < 1024;
  
  const styles = createGridStyles(width, isMobile, isTablet);
  
  return (
    <View style={styles.container}>
      {cards.map((cardProps, index) => (
        <View
          key={cardProps.statusType}
          style={[styles.cardWrapper, getCardStyle(index, isMobile)]}
        >
          <StatusOverviewCard {...cardProps} />
        </View>
      ))}
    </View>
  );
}

const createGridStyles = (screenWidth: number, isMobile: boolean, isTablet: boolean) => {
  const horizontalPadding = isMobile ? 16 : isTablet ? 32 : 48;
  const cardGap = isMobile ? 16 : 24;
  
  return StyleSheet.create({
    container: {
      flexDirection: isMobile ? 'row' : 'row',
      flexWrap: isMobile ? 'wrap' : 'nowrap',
      justifyContent: 'space-between',
      paddingHorizontal: horizontalPadding,
      paddingVertical: 16,
      gap: cardGap,
    },
    
    cardWrapper: {
      // Mobile: 2×2 grid, Tablet+: 4×1 horizontal
      width: isMobile ? '47%' : undefined,
      flex: isMobile ? 0 : 1,
      maxWidth: isMobile ? undefined : 200,
      minWidth: isMobile ? undefined : 160,
    },
  });
};

const getCardStyle = (index: number, isMobile: boolean) => {
  if (!isMobile) return {};
  
  // Mobile specific positioning for 2×2 grid
  return {
    marginBottom: index < 2 ? 16 : 0, // Top row cards get bottom margin
  };
};
```

## Icon Components Implementation

### Icon Component Pattern
```typescript
// app/components/icons/AlertTriangleIcon.tsx
import React from 'react';
import { Svg, Path } from 'react-native-svg';
import { IconProps } from '../cards/StatusOverviewCard';

export function AlertTriangleIcon({ 
  size = 24, 
  color = '#6B7280',
  accessibilityLabel = 'Alert' 
}: IconProps) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      accessibilityLabel={accessibilityLabel}
    >
      <Path
        d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 9v4M12 17h.01"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Similar pattern for ClockIcon, CheckCircleIcon, PackageIcon...
```

## Dashboard Integration

### Dashboard Tab Integration
```typescript
// app/(tabs)/dashboard.tsx
import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { StatusOverviewGrid } from '../components/cards/StatusOverviewGrid';
import { AlertTriangleIcon, ClockIcon, CheckCircleIcon, PackageIcon } from '../components/icons';
import { useInventoryStatus } from '../hooks/useInventoryStatus'; // Your GraphQL hook
import { useTheme } from '../contexts/ThemeContext';

export default function DashboardScreen() {
  const { actualTheme } = useTheme();
  const { data, loading, error } = useInventoryStatus();
  
  const cardData = useMemo(() => {
    if (!data) return [];
    
    return [
      {
        statusType: 'critical' as const,
        title: 'Critical Items',
        count: data.criticalCount || 0,
        description: 'Items need attention soon',
        icon: AlertTriangleIcon,
        borderColor: '#DC2626',
        onPress: () => navigateToCriticalItems(),
      },
      {
        statusType: 'low' as const,
        title: 'Low Stock',
        count: data.lowStockCount || 0,
        description: 'Plan to restock these items',
        icon: ClockIcon,
        borderColor: '#D97706',
        onPress: () => navigateToLowStock(),
      },
      {
        statusType: 'stocked' as const,
        title: 'Well Stocked',
        count: data.wellStockedCount || 0,
        description: "You're prepared!",
        icon: CheckCircleIcon,
        borderColor: '#059669',
        onPress: () => navigateToWellStocked(),
      },
      {
        statusType: 'pending' as const,
        title: 'Pending Orders',
        count: data.pendingOrdersCount || 0,
        description: 'Help is on the way',
        icon: PackageIcon,
        borderColor: '#0891B2',
        onPress: () => navigateToPendingOrders(),
      },
    ];
  }, [data]);

  return (
    <ScrollView style={styles.container}>
      <StatusOverviewGrid 
        cards={cardData.map(card => ({
          ...card,
          loading,
          disabled: !!error,
        }))}
      />
      
      {/* Other dashboard content... */}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent', // Let theme handle background
  },
});
```

## Responsive Design Implementation

### Custom Hook for Responsive Styling
```typescript
// app/hooks/useResponsiveStyles.ts
import { useMemo } from 'react';
import { Dimensions } from 'react-native';

export function useResponsiveStyles() {
  const { width } = Dimensions.get('window');
  
  return useMemo(() => {
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;
    
    return {
      isMobile,
      isTablet,
      isDesktop,
      
      // Card dimensions
      cardWidth: isMobile ? '47%' : undefined,
      cardPadding: isMobile ? 16 : 20,
      
      // Typography scaling
      titleFontSize: isMobile ? 14 : 16,
      countFontSize: isMobile ? 32 : isTablet ? 36 : 40,
      descriptionFontSize: isMobile ? 12 : 14,
      
      // Icon sizing
      iconSize: isMobile ? 20 : 24,
      
      // Layout spacing
      containerPadding: isMobile ? 16 : isTablet ? 32 : 48,
      cardGap: isMobile ? 16 : 24,
    };
  }, [width]);
}
```

## Testing Implementation

### Unit Tests Setup
```typescript
// __tests__/components/StatusOverviewCard.test.tsx
import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { StatusOverviewCard } from '../../app/components/cards/StatusOverviewCard';
import { AlertTriangleIcon } from '../../app/components/icons/AlertTriangleIcon';
import { ThemeProvider } from '../../contexts/ThemeContext';

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>{children}</ThemeProvider>
);

describe('StatusOverviewCard', () => {
  const defaultProps = {
    statusType: 'critical' as const,
    title: 'Critical Items',
    count: 5,
    description: 'Items need attention soon',
    icon: AlertTriangleIcon,
    borderColor: '#DC2626',
  };

  it('renders correctly with default props', () => {
    const { getByText, getByLabelText } = render(
      <StatusOverviewCard {...defaultProps} />,
      { wrapper: TestWrapper }
    );
    
    expect(getByText('Critical Items')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
    expect(getByText('Items need attention soon')).toBeTruthy();
    expect(getByLabelText('Critical Items: 5 items')).toBeTruthy();
  });

  it('calls onPress when tapped', () => {
    const onPressMock = jest.fn();
    const { getByLabelText } = render(
      <StatusOverviewCard {...defaultProps} onPress={onPressMock} />,
      { wrapper: TestWrapper }
    );
    
    fireEvent.press(getByLabelText('Critical Items: 5 items'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    const { getByText } = render(
      <StatusOverviewCard {...defaultProps} loading={true} />,
      { wrapper: TestWrapper }
    );
    
    expect(getByText('–')).toBeTruthy(); // Loading placeholder
  });
});
```

## Performance Optimizations

### Memoization Strategy
```typescript
// Optimized component with memoization
export const StatusOverviewCard = React.memo<StatusOverviewCardProps>(
  function StatusOverviewCard(props) {
    // Component implementation...
  },
  (prevProps, nextProps) => {
    // Custom comparison function for complex props
    return (
      prevProps.statusType === nextProps.statusType &&
      prevProps.count === nextProps.count &&
      prevProps.loading === nextProps.loading &&
      prevProps.disabled === nextProps.disabled
    );
  }
);
```

### Animation Performance
```typescript
// Using React Native Reanimated for smooth animations
import Animated, { 
  useSharedValue, 
  withSpring, 
  useAnimatedStyle 
} from 'react-native-reanimated';

function AnimatedStatusCard(props: StatusOverviewCardProps) {
  const scale = useSharedValue(1);
  
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  
  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15 });
  };
  
  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15 });
  };
  
  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        // ... other props
      >
        {/* Card content */}
      </TouchableOpacity>
    </Animated.View>
  );
}
```

## Accessibility Implementation

### Screen Reader Optimization
```typescript
// Enhanced accessibility props
const accessibilityProps = {
  accessible: true,
  accessibilityRole: 'button',
  accessibilityLabel: `${title}: ${count} items. ${description}`,
  accessibilityHint: 'Double tap to view detailed breakdown',
  accessibilityState: {
    disabled: disabled || loading,
  },
  accessibilityValue: {
    text: count.toString(),
  },
};
```

### Color Contrast Verification
```typescript
// Utility function to verify WCAG AAA compliance
export function verifyColorContrast(
  foreground: string, 
  background: string
): boolean {
  // Implement WCAG contrast ratio calculation
  const ratio = calculateContrastRatio(foreground, background);
  return ratio >= 7; // WCAG AAA standard
}
```

## Build & Deployment Considerations

### Bundle Optimization
- **Tree Shaking**: Import icons individually to reduce bundle size
- **Code Splitting**: Lazy load card variants if needed
- **Image Optimization**: Use SVG icons for scalability
- **Memory Management**: Implement proper cleanup for event listeners

### Performance Targets
- **Render Time**: <16ms per card (60fps compliance)
- **Bundle Size**: <10KB for entire card system (gzipped)
- **Memory Usage**: <100KB for complete grid (4 cards)
- **Animation Performance**: Consistent 60fps for all transitions

## Integration Checklist

### Development Phase
- [ ] StatusOverviewCard component implemented with all states
- [ ] Icon components created with proper accessibility
- [ ] Responsive grid system working across all breakpoints
- [ ] Theme integration functioning correctly
- [ ] TypeScript interfaces defined and implemented

### Testing Phase  
- [ ] Unit tests covering all component variants
- [ ] Integration tests for responsive behavior
- [ ] Accessibility testing with screen readers
- [ ] Performance benchmarks meeting targets
- [ ] Visual regression tests passing

### Production Phase
- [ ] Bundle size optimized and verified
- [ ] Performance monitoring implemented
- [ ] Error boundaries in place
- [ ] Analytics tracking configured
- [ ] A/B testing framework ready (if applicable)

## Last Updated
2025-09-10 - Complete implementation guide for developer handoff established