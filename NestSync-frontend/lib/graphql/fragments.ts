/**
 * GraphQL Fragments for NestSync Application
 * Shared fragments to avoid circular dependencies between queries and mutations
 */

import { gql } from '@apollo/client';

// =============================================================================
// USER PROFILE FRAGMENTS
// =============================================================================

export const USER_PROFILE_FRAGMENT = gql`
  fragment UserProfileFragment on UserProfile {
    id
    email
    firstName
    lastName
    displayName
    timezone
    language
    currency
    province
    status
    emailVerified
    onboardingCompleted
    createdAt
  }
`;

export const USER_SESSION_FRAGMENT = gql`
  fragment UserSessionFragment on UserSession {
    accessToken
    refreshToken
    expiresIn
  }
`;

export const USER_CONSENT_FRAGMENT = gql`
  fragment UserConsentFragment on UserConsent {
    consentType
    status
    grantedAt
    withdrawnAt
    expiresAt
    consentVersion
  }
`;

// =============================================================================
// CHILD PROFILE FRAGMENTS
// =============================================================================

export const CHILD_PROFILE_FRAGMENT = gql`
  fragment ChildProfileFragment on ChildProfile {
    id
    name
    dateOfBirth
    gender
    currentDiaperSize
    currentWeightKg
    currentHeightCm
    dailyUsageCount
    hasSensitiveSkin
    hasAllergies
    allergiesNotes
    onboardingCompleted
    province
    createdAt
    ageInDays
    ageInMonths
    weeklyUsage
    monthlyUsage
  }
`;

// =============================================================================
// USAGE AND INVENTORY FRAGMENTS
// =============================================================================

export const USAGE_LOG_FRAGMENT = gql`
  fragment UsageLogFragment on UsageLog {
    id
    childId
    inventoryItemId
    usageType
    loggedAt
    quantityUsed
    context
    caregiverName
    wasWet
    wasSoiled
    diaperCondition
    hadLeakage
    productRating
    timeSinceLastChange
    changeDuration
    notes
    healthNotes
    createdAt
  }
`;

export const INVENTORY_ITEM_FRAGMENT = gql`
  fragment InventoryItemFragment on InventoryItem {
    id
    childId
    productType
    brand
    productName
    size
    quantityTotal
    quantityRemaining
    quantityReserved
    purchaseDate
    costCad
    expiryDate
    storageLocation
    isOpened
    openedDate
    notes
    qualityRating
    wouldRebuy
    createdAt
    quantityAvailable
    usagePercentage
    isExpired
    daysUntilExpiry
  }
`;

export const DASHBOARD_STATS_FRAGMENT = gql`
  fragment DashboardStatsFragment on DashboardStats {
    daysRemaining
    diapersLeft
    lastChange
    todayChanges
    currentSize
  }
`;

// =============================================================================
// NOTIFICATION FRAGMENTS
// =============================================================================

export const NOTIFICATION_PREFERENCES_FRAGMENT = gql`
  fragment NotificationPreferencesFragment on NotificationPreferences {
    id
    userId
    notificationsEnabled
    criticalNotifications
    importantNotifications
    optionalNotifications
    pushNotifications
    emailNotifications
    smsNotifications
    quietHoursEnabled
    quietHoursStart
    quietHoursEnd
    stockAlertEnabled
    stockAlertThreshold
    changeReminderEnabled
    changeReminderIntervalHours
    expiryWarningEnabled
    expiryWarningDays
    healthTipsEnabled
    marketingEnabled
    deviceTokens {
      deviceToken
      platform
    }
    userTimezone
    dailyNotificationLimit
    notificationConsentGranted
    notificationConsentDate
    marketingConsentGranted
    marketingConsentDate
    createdAt
    updatedAt
  }
`;

export const NOTIFICATION_DELIVERY_LOG_FRAGMENT = gql`
  fragment NotificationDeliveryLogFragment on NotificationDeliveryLog {
    id
    userId
    queueItemId
    preferencesId
    notificationType
    priority
    channel
    title
    message
    deliveryStatus
    sentAt
    deliveredAt
    externalId
    externalResponse
    errorCode
    errorMessage
    processingTimeMs
    dataRetentionDate
    openedAt
    clickedAt
    dismissedAt
    createdAt
  }
`;

// =============================================================================
// ANALYTICS FRAGMENTS
// =============================================================================

export const USAGE_ANALYTICS_FRAGMENT = gql`
  fragment UsageAnalyticsFragment on UsageAnalyticsType {
    totalChanges
    weeklyAverage
    dailyAverage
    peakHour
    averageTimeBetweenChanges
    currentStreak
    longestStreak
    weekdayVsWeekend {
      weekday
      weekend
    }
    hourlyDistribution {
      hour
      count
    }
    qualityMetrics {
      averageRating
      improvementTrend
    }
  }
`;

export const WEEKLY_TRENDS_FRAGMENT = gql`
  fragment WeeklyTrendsFragment on WeeklyTrendsType {
    weeklyData {
      week
      totalChanges
      averageRating
      leakageCount
      nightChanges
    }
    trendAnalysis {
      changesTrend
      qualityTrend
      efficiencyTrend
    }
    predictions {
      nextWeekChanges
      confidence
    }
  }
`;

export const DAILY_SUMMARY_FRAGMENT = gql`
  fragment DailySummaryFragment on DailySummaryType {
    date
    totalChanges
    hourlyBreakdown {
      hour
      changes
      efficiency
    }
    caregiverStats {
      caregiver
      changes
      averageTime
    }
    insights {
      message
      type
      priority
    }
  }
`;

export const USAGE_PATTERN_FRAGMENT = gql`
  fragment UsagePatternFragment on UsagePatternType {
    patternType
    frequency
    timeRange {
      start
      end
    }
    confidence
    recommendations {
      message
      actionType
      estimatedImpact
    }
  }
`;

export const INVENTORY_INSIGHT_FRAGMENT = gql`
  fragment InventoryInsightFragment on InventoryInsightType {
    currentStock {
      size
      quantity
      daysRemaining
    }
    consumptionRate {
      size
      dailyAverage
      weeklyAverage
      trend
    }
    predictions {
      size
      predictedRunOut
      reorderRecommendation
      confidence
    }
    costAnalysis {
      monthlySpend
      costPerChange
      savingOpportunities {
        type
        estimatedSavings
        description
      }
    }
  }
`;

export const ANALYTICS_OVERVIEW_FRAGMENT = gql`
  fragment AnalyticsOverviewFragment on AnalyticsOverviewType {
    totalChanges
    averageChangesPerDay
    efficiencyScore
    costPerMonth
    timeframe {
      start
      end
    }
    trends {
      usage
      quality
      efficiency
    }
    recommendations {
      type
      message
      priority
    }
  }
`;

