/**
 * Canadian Dummy Data for Smart Reordering Empty State
 * Psychology-driven UX with realistic Canadian brands, pricing, and context
 * Used for educational purposes until real ML data is available
 */

import { ReorderSuggestion } from '../../stores/reorderStore';

// Generate realistic future dates for predictions
const generatePredictedDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString();
};

// Canadian GST/PST/HST calculations by province (simplified)
const calculateCanadianTaxes = (baseAmount: number, province: string = 'ON') => {
  const rates = {
    ON: { gst: 0, pst: 0, hst: 0.13 }, // Ontario HST
    BC: { gst: 0.05, pst: 0.07, hst: 0 }, // BC GST + PST
    AB: { gst: 0.05, pst: 0, hst: 0 }, // Alberta GST only
    QC: { gst: 0.05, pst: 0.09975, hst: 0 }, // Quebec GST + QST
  };

  const rate = rates[province as keyof typeof rates] || rates.ON;
  const gst = baseAmount * rate.gst;
  const pst = baseAmount * rate.pst;
  const hst = baseAmount * rate.hst;
  const total = gst + pst + hst;

  return { gst, pst, hst, total };
};

/**
 * Educational Dummy Reorder Suggestions
 * Showcases what parents can expect from the ML system
 */
export const CANADIAN_DUMMY_SUGGESTIONS: ReorderSuggestion[] = [
  {
    id: 'dummy-pampers-cruisers-360',
    childId: 'educational-preview',
    productId: 'pampers-cruisers-360-size3',
    product: {
      id: 'pampers-cruisers-360-size3',
      name: 'Cruisers 360° Fit',
      brand: 'Pampers',
      size: '3 (16-28 lbs)',
      category: 'Diapers',
      image: 'https://images.example.com/pampers-cruisers-360-size3.jpg',
      description: 'All-around stretchy waistband for 360° fit',
      features: ['360° Stretchy Waistband', 'Extra Absorb Core', 'Soft Touch Liner'],
    },
    predictedRunOutDate: generatePredictedDate(4),
    confidence: 87,
    priority: 1,
    suggestedQuantity: 2,
    currentInventoryLevel: 8,
    usagePattern: {
      averageDailyUsage: 6.2,
      weeklyTrend: 0.15, // Slight increase (growth pattern)
      seasonalFactors: [1.0, 1.0, 1.0, 1.0], // Neutral seasonal impact
    },
    estimatedCostSavings: {
      amount: 8.50,
      currency: 'CAD',
      comparedToRegularPrice: 15.99,
      comparedToLastPurchase: 12.25,
    },
    availableRetailers: [
      {
        id: 'costco-canada',
        name: 'Costco Canada',
        logo: 'https://logos.example.com/costco-canada.png',
        price: {
          amount: 49.99,
          currency: 'CAD',
          originalPrice: 58.49,
          discountPercentage: 14.5,
          taxes: calculateCanadianTaxes(49.99, 'ON'),
          finalAmount: 56.49,
        },
        deliveryTime: 2,
        inStock: true,
        rating: 4.7,
        freeShipping: true,
        affiliateDisclosure: 'NestSync may earn a commission from qualifying purchases.',
      },
      {
        id: 'amazon-ca',
        name: 'Amazon.ca',
        logo: 'https://logos.example.com/amazon-ca.png',
        price: {
          amount: 52.99,
          currency: 'CAD',
          originalPrice: 52.99,
          discountPercentage: 0,
          taxes: calculateCanadianTaxes(52.99, 'ON'),
          finalAmount: 59.88,
        },
        deliveryTime: 1,
        inStock: true,
        rating: 4.5,
        freeShipping: true,
        affiliateDisclosure: 'NestSync may earn a commission from qualifying purchases.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mlProcessingConsent: true,
    dataRetentionDays: 90,
  },
  {
    id: 'dummy-huggies-little-movers',
    childId: 'educational-preview',
    productId: 'huggies-little-movers-size2',
    product: {
      id: 'huggies-little-movers-size2',
      name: 'Little Movers',
      brand: 'Huggies',
      size: '2 (12-18 lbs)',
      category: 'Diapers',
      image: 'https://images.example.com/huggies-little-movers-size2.jpg',
      description: 'Active baby diapers with Double Grip Strips',
      features: ['Double Grip Strips', '12-Hour Protection', 'Contoured Core'],
    },
    predictedRunOutDate: generatePredictedDate(8),
    confidence: 92,
    priority: 2,
    suggestedQuantity: 1,
    currentInventoryLevel: 15,
    usagePattern: {
      averageDailyUsage: 5.8,
      weeklyTrend: -0.05, // Slight decrease (sizing up soon)
      seasonalFactors: [1.0, 1.0, 1.0, 1.0],
    },
    estimatedCostSavings: {
      amount: 5.75,
      currency: 'CAD',
      comparedToRegularPrice: 46.99,
      comparedToLastPurchase: 44.25,
    },
    availableRetailers: [
      {
        id: 'walmart-canada',
        name: 'Walmart Canada',
        logo: 'https://logos.example.com/walmart-canada.png',
        price: {
          amount: 41.24,
          currency: 'CAD',
          originalPrice: 46.99,
          discountPercentage: 12.2,
          taxes: calculateCanadianTaxes(41.24, 'ON'),
          finalAmount: 46.60,
        },
        deliveryTime: 3,
        inStock: true,
        rating: 4.3,
        freeShipping: false,
        affiliateDisclosure: 'NestSync may earn a commission from qualifying purchases.',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    mlProcessingConsent: true,
    dataRetentionDays: 90,
  },
];

/**
 * Psychology-Driven Empty State Messaging
 * Reduces stress and builds confidence for tired parents
 */
export const EMPTY_STATE_MESSAGING = {
  title: "Here's What You Can Expect",
  subtitle: "Smart predictions powered by machine learning",
  description: "As you log diaper changes, our AI learns your baby's patterns to predict when you'll need supplies. Here are examples of the insights you'll receive:",

  learnMore: {
    title: "How Smart Reordering Works",
    points: [
      "AI analyzes your baby's usage patterns",
      "Predicts when you'll run out of supplies",
      "Finds the best Canadian prices with tax calculations",
      "Suggests optimal ordering timing",
      "All data stays in Canada (PIPEDA compliant)",
    ],
  },

  callToAction: {
    primary: "Log Some Diaper Changes",
    secondary: "Learn More",
    tertiary: "Try Demo Mode",
  },

  confidence: {
    building: "Building confidence... {days} days of data collected",
    ready: "Ready for personalized suggestions!",
    improving: "Predictions improving with each diaper change",
  },

  stressReduction: {
    reassurance: "Never run out of diapers again",
    convenience: "We'll remind you before you're low",
    savings: "Save money with automated price comparisons",
    canadian: "Supporting Canadian families with local pricing",
  },
};

/**
 * Progressive Enhancement States
 */
export type EmptyStateMode = 'educational' | 'learning' | 'ready';

export const getEmptyStateConfig = (
  daysOfData: number,
  hasUsageData: boolean,
  confidenceLevel: number
): { mode: EmptyStateMode; message: string; showDummyData: boolean } => {
  if (daysOfData === 0 || !hasUsageData) {
    return {
      mode: 'educational',
      message: EMPTY_STATE_MESSAGING.description,
      showDummyData: true,
    };
  }

  if (daysOfData < 7 || confidenceLevel < 70) {
    return {
      mode: 'learning',
      message: EMPTY_STATE_MESSAGING.confidence.building.replace('{days}', daysOfData.toString()),
      showDummyData: true,
    };
  }

  return {
    mode: 'ready',
    message: EMPTY_STATE_MESSAGING.confidence.ready,
    showDummyData: false,
  };
};

/**
 * Educational Insights for Empty State
 */
export const EDUCATIONAL_INSIGHTS = [
  {
    icon: 'chart.line.uptrend.xyaxis',
    title: 'Usage Pattern Recognition',
    description: 'AI identifies daily and weekly usage patterns unique to your baby',
    example: 'e.g., "Uses 6.2 diapers/day, increasing 15% weekly"',
  },
  {
    icon: 'clock.arrow.circlepath',
    title: 'Predictive Timing',
    description: 'Smart predictions prevent running out while avoiding overstocking',
    example: 'e.g., "Predicted run-out in 4 days with 87% confidence"',
  },
  {
    icon: 'dollarsign.circle',
    title: 'Canadian Price Intelligence',
    description: 'Real-time price comparison across major Canadian retailers',
    example: 'e.g., "Save $8.50 at Costco vs regular Walmart pricing"',
  },
  {
    icon: 'truck.box',
    title: 'Optimal Ordering',
    description: 'Balance delivery timing with bulk discounts and free shipping',
    example: 'e.g., "Order 2 packs now for free shipping + 12% savings"',
  },
];