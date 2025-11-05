import { useState, useEffect } from 'react';
import { Dimensions } from 'react-native';

export interface CardDimensions {
  cardWidth: number;
  cardHeight: number;
  padding: number;
  edgePadding: number;
  gap: number;
  containerMaxWidth: number;
  fontSize: {
    count: number;
    title: number;
    icon: number;
  };
}

/**
 * Hook to provide responsive card dimensions based on viewport width
 * Implements design specification breakpoints for StatusOverviewGrid cards
 *
 * Breakpoints:
 * - Small Mobile (<360px): 140×120px cards, 12px padding
 * - Mobile (360-767px): 156×120px cards, 16px padding
 * - Tablet (768-1023px): 180×120px cards, 20px padding, larger typography
 * - Desktop (1024px+): 200×140px cards, 20px padding, largest typography
 */
export const useResponsiveCardDimensions = (): CardDimensions => {
  const [dimensions, setDimensions] = useState<CardDimensions>(getCardDimensions());

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getCardDimensions());
    });

    return () => {
      subscription?.remove();
    };
  }, []);

  return dimensions;
};

/**
 * Calculate card dimensions based on current window width
 * Per component-specifications.md dated 2025-09-10
 */
function getCardDimensions(): CardDimensions {
  const { width } = Dimensions.get('window');

  // Small Mobile: <360px (iPhone SE, older devices)
  if (width < 360) {
    return {
      cardWidth: 140,
      cardHeight: 120,
      padding: 12,
      edgePadding: 12,
      gap: 16,
      containerMaxWidth: 320, // (2 × 140) + 16 + (2 × 12) = 320px
      fontSize: {
        count: 32,
        title: 14,
        icon: 20,
      },
    };
  }

  // Mobile: 360-767px
  if (width < 768) {
    return {
      cardWidth: 156,
      cardHeight: 120,
      padding: 16,
      edgePadding: 16,
      gap: 16,
      containerMaxWidth: 360, // (2 × 156) + 16 + (2 × 16) = 360px
      fontSize: {
        count: 32,
        title: 14,
        icon: 20,
      },
    };
  }

  // Tablet: 768-1023px
  if (width < 1024) {
    return {
      cardWidth: 180,
      cardHeight: 120,
      padding: 20,
      edgePadding: 24,
      gap: 24,
      containerMaxWidth: 432, // (2 × 180) + 24 + (2 × 24) = 432px
      fontSize: {
        count: 36,
        title: 16,
        icon: 24,
      },
    };
  }

  // Desktop: 1024px+
  return {
    cardWidth: 200,
    cardHeight: 140,
    padding: 20,
    edgePadding: 32,
    gap: 24,
    containerMaxWidth: 488, // (2 × 200) + 24 + (2 × 32) = 488px
    fontSize: {
      count: 40,
      title: 16,
      icon: 24,
    },
  };
}
