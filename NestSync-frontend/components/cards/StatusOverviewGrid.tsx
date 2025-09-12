import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { StatusOverviewCard, StatusOverviewCardProps } from './StatusOverviewCard';

const { width } = Dimensions.get('window');

interface StatusOverviewGridProps {
  cards: StatusOverviewCardProps[];
}

export function StatusOverviewGrid({ cards }: StatusOverviewGridProps) {
  // Device size detection for layout strategy
  const isMobile = width < 768;
  
  return (
    <View style={styles.container}>
      {cards.map((cardProps, index) => (
        <View
          key={cardProps.statusType}
          style={[
            styles.cardWrapper,
            isMobile && index < 2 && styles.topRowMargin // Add margin to top row cards on mobile
          ]}
        >
          <StatusOverviewCard {...cardProps} />
        </View>
      ))}
    </View>
  );
}

// Fixed-size grid styling with consistent 160x120px cards
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20, // Consistent 20px edge padding
    paddingVertical: 16,
    gap: 16, // Fixed 16px gaps between cards
    // Center the grid container
    alignSelf: 'center',
    maxWidth: 400, // Max width to prevent stretching on large screens
  },
  
  cardWrapper: {
    // Fixed card dimensions - 160x120px (4:3 aspect ratio)
    width: 160,
    height: 120,
    // No flex properties - prevents dynamic sizing
  },
  
  topRowMargin: {
    marginBottom: 16, // Add bottom margin to top row cards (indices 0 and 1)
  },
});