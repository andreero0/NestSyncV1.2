/**
 * Quick Actions Card Component - DEPRECATED
 * This component contained action buttons that violate the analytics-as-passive-viewing principle.
 * Analytics dashboards should focus on insights and data visualization, not actions.
 *
 * Actions like "View Charts", "Export Report", and "Settings" should be:
 * - Navigation-based (different screens/modals)
 * - Menu-based (overflow menu or settings screen)
 * - Context-aware (FAB on relevant tabs)
 *
 * This component has been removed to maintain clean analytics UX.
 */

import React from 'react';

// =============================================================================
// TYPES
// =============================================================================

interface QuickActionsCardProps {
  onViewCharts?: () => void;
  onExportReport?: () => void;
  onSettings?: () => void;
  loading?: boolean;
}

// =============================================================================
// DEPRECATED COMPONENT - RETURNS NULL
// =============================================================================

export function QuickActionsCard({
  onViewCharts,
  onExportReport,
  onSettings,
  loading
}: QuickActionsCardProps) {
  // Component deprecated - analytics should focus on data insights only
  // Actions moved to appropriate navigation contexts
  return null;
}