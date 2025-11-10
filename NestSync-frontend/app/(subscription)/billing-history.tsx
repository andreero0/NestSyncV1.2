/**
 * Billing History Screen
 * View billing records and download invoices
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { format } from 'date-fns';

import { useNestSyncTheme } from '@/contexts/ThemeContext';
import { Colors, NestSyncColors } from '@/constants/Colors';
import {
  useMyBillingHistory,
  useDownloadInvoice,
} from '@/lib/hooks/useSubscription';
import { IconSymbol } from '@/components/ui/IconSymbol';

export default function BillingHistoryScreen() {
  const theme = useNestSyncTheme();
  const colors = Colors[theme];
  const router = useRouter();

  const [page, setPage] = useState(1);
  const pageSize = 20;

  const { billingHistory, loading, hasMore, loadMore } = useMyBillingHistory(page, pageSize);
  const { downloadInvoice, loading: downloadingInvoice } = useDownloadInvoice();

  const handleDownloadInvoice = async (recordId: string) => {
    try {
      const result = await downloadInvoice(recordId);
      if (result.invoiceUrl) {
        await Linking.openURL(result.invoiceUrl);
      }
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  const getStatusColor = (status: string) => {
    const statusColors: { [key: string]: string } = {
      SUCCEEDED: colors.success || NestSyncColors.semantic.success,
      PENDING: colors.warning || NestSyncColors.accent.amber,
      FAILED: colors.error,
      REFUNDED: colors.info || NestSyncColors.primary.blue,
    };
    return statusColors[status] || colors.textSecondary;
  };

  const getTransactionIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      PAYMENT: 'arrow.down.circle.fill',
      REFUND: 'arrow.up.circle.fill',
      SUBSCRIPTION: 'repeat.circle.fill',
    };
    return icons[type] || 'dollarsign.circle';
  };

  if (loading && !billingHistory) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.tint} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
          Loading billing history...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backButton, { opacity: pressed ? 0.6 : 1 }]}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <IconSymbol name="chevron.left" size={24} color={colors.tint} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            Billing History
          </Text>
        </View>

        {/* Billing Records */}
        {billingHistory && billingHistory.records && billingHistory.records.length > 0 ? (
          <>
            {billingHistory.records.map((record) => (
              <View
                key={record.id}
                style={[styles.recordCard, { backgroundColor: colors.surface }]}
              >
                <View style={styles.recordHeader}>
                  <IconSymbol
                    name={getTransactionIcon(record.transactionType)}
                    size={32}
                    color={colors.tint}
                  />
                  <View style={styles.recordInfo}>
                    <Text style={[styles.recordDescription, { color: colors.text }]}>
                      {record.description}
                    </Text>
                    <Text style={[styles.recordDate, { color: colors.textSecondary }]}>
                      {format(new Date(record.createdAt), 'MMM d, yyyy')}
                    </Text>
                  </View>
                  <View style={styles.recordAmount}>
                    <Text style={[styles.amount, { color: colors.text }]}>
                      ${record.totalAmount.toFixed(2)} {record.currency}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        { backgroundColor: getStatusColor(record.status) + '20' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusColor(record.status) },
                        ]}
                      >
                        {record.status}
                      </Text>
                    </View>
                  </View>
                </View>

                {record.taxBreakdown && (
                  <View style={styles.taxBreakdown}>
                    <Text style={[styles.taxTitle, { color: colors.textSecondary }]}>
                      Tax Breakdown:
                    </Text>
                    {record.taxBreakdown.gst !== null && (
                      <Text style={[styles.taxLine, { color: colors.textSecondary }]}>
                        GST (5%): ${record.taxBreakdown.gst?.toFixed(2)}
                      </Text>
                    )}
                    {record.taxBreakdown.pst !== null && (
                      <Text style={[styles.taxLine, { color: colors.textSecondary }]}>
                        PST: ${record.taxBreakdown.pst?.toFixed(2)}
                      </Text>
                    )}
                    {record.taxBreakdown.hst !== null && (
                      <Text style={[styles.taxLine, { color: colors.textSecondary }]}>
                        HST: ${record.taxBreakdown.hst?.toFixed(2)}
                      </Text>
                    )}
                    {record.taxBreakdown.qst !== null && (
                      <Text style={[styles.taxLine, { color: colors.textSecondary }]}>
                        QST: ${record.taxBreakdown.qst?.toFixed(2)}
                      </Text>
                    )}
                  </View>
                )}

                {record.invoiceUrl && (
                  <Pressable
                    onPress={() => handleDownloadInvoice(record.id)}
                    disabled={downloadingInvoice}
                    style={({ pressed }) => [
                      styles.downloadButton,
                      {
                        backgroundColor: colors.tint + '15',
                        opacity: pressed ? 0.8 : downloadingInvoice ? 0.6 : 1,
                      },
                    ]}
                    accessibilityLabel="Download invoice"
                    accessibilityRole="button"
                  >
                    <IconSymbol name="arrow.down.doc" size={16} color={colors.tint} />
                    <Text style={[styles.downloadText, { color: colors.tint }]}>
                      Download Invoice
                    </Text>
                  </Pressable>
                )}
              </View>
            ))}

            {/* Load More */}
            {hasMore && (
              <Pressable
                onPress={() => setPage(page + 1)}
                disabled={loading}
                style={({ pressed }) => [
                  styles.loadMoreButton,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.tint,
                    borderWidth: 1,
                    opacity: pressed ? 0.8 : loading ? 0.6 : 1,
                  },
                ]}
                accessibilityLabel="Load more records"
                accessibilityRole="button"
              >
                {loading ? (
                  <ActivityIndicator color={colors.tint} />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.tint }]}>
                    Load More
                  </Text>
                )}
              </Pressable>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <IconSymbol name="doc.text" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              No Billing History
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Your billing records will appear here once you subscribe
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '500' }, // 4 × 4px base unit
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 }, // 5 × 4px, 10 × 4px base unit
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 }, // 6 × 4px base unit
  backButton: { 
    padding: 12, // 3 × 4px base unit (updated from 8px)
    marginRight: 12, // 3 × 4px base unit
    minHeight: 48, // WCAG AA minimum touch target
    minWidth: 48, // WCAG AA minimum touch target
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  recordCard: { padding: 16, borderRadius: 12, marginBottom: 12 }, // 4 × 4px, large radius, 3 × 4px base unit
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 }, // 3 × 4px base unit
  recordInfo: { flex: 1 },
  recordDescription: { fontSize: 16, fontWeight: '600' }, // Subtitle size
  recordDate: { fontSize: 14, marginTop: 4 }, // Body size, 1 × 4px base unit
  recordAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { 
    marginTop: 4, // 1 × 4px base unit
    paddingHorizontal: 8, // 2 × 4px base unit
    paddingVertical: 4, // 1 × 4px base unit
    borderRadius: 8, // Medium border radius
  },
  statusText: { fontSize: 11, fontWeight: 'bold' }, // Caption size
  taxBreakdown: { 
    marginTop: 12, // 3 × 4px base unit
    paddingTop: 12, // 3 × 4px base unit
    borderTopWidth: 1, 
    borderTopColor: NestSyncColors.neutral[200], // Design token (updated from hardcoded)
  },
  taxTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 }, // 1 × 4px base unit
  taxLine: { fontSize: 12, marginTop: 2 }, // Small size
  downloadButton: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 8, // 2 × 4px base unit
    marginTop: 12, // 3 × 4px base unit
    padding: 12, // 3 × 4px base unit
    borderRadius: 12, // Large border radius (updated from 8px)
    minHeight: 48, // WCAG AA minimum touch target
  },
  downloadText: { fontSize: 14, fontWeight: '600' }, // Body size
  loadMoreButton: { 
    padding: 16, // 4 × 4px base unit
    borderRadius: 12, // Large border radius
    alignItems: 'center', 
    marginTop: 12, // 3 × 4px base unit
    minHeight: 48, // WCAG AA minimum touch target
  },
  loadMoreText: { fontSize: 16, fontWeight: '600' }, // Subtitle size
  emptyState: { alignItems: 'center', padding: 40 }, // 10 × 4px base unit
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 }, // Title size, 4 × 4px base unit
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' }, // Body size, 2 × 4px base unit
});
