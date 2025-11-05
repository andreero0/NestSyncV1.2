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
      {cards.map((cardProps) => (
        <View
          key={cardProps.statusType}
          style={styles.cardWrapper}
        >
          <StatusOverviewCard {...cardProps} />
        </View>
      ))}
    </View>
  );
}

// Responsive grid styling with percentage-based width
const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between', // Automatic spacing between cards
    alignItems: 'flex-start',
    paddingHorizontal: 20, // Consistent 20px edge padding
    paddingVertical: 16,
    // No maxWidth - allows responsive scaling across all device sizes
    alignSelf: 'center',
  },

  cardWrapper: {
    // Percentage-based width for responsive layout
    width: '47%', // 47% × 2 = 94% with 6% gap from space-between
    aspectRatio: 4 / 3, // Maintains 4:3 proportions (same as 160:120)
    // Vertical spacing between rows
    marginBottom: 16,
  },
});