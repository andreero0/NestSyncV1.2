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
import { Colors } from '@/constants/Colors';
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
      SUCCEEDED: colors.success || '#10B981',
      PENDING: colors.warning || '#F59E0B',
      FAILED: colors.error,
      REFUNDED: colors.info || '#3B82F6',
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
  loadingText: { marginTop: 16, fontSize: 16, fontWeight: '500' },
  scrollView: { flex: 1 },
  contentContainer: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 8, marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  recordCard: { padding: 16, borderRadius: 12, marginBottom: 12 },
  recordHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  recordInfo: { flex: 1 },
  recordDescription: { fontSize: 16, fontWeight: '600' },
  recordDate: { fontSize: 14, marginTop: 4 },
  recordAmount: { alignItems: 'flex-end' },
  amount: { fontSize: 18, fontWeight: 'bold' },
  statusBadge: { marginTop: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  taxBreakdown: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  taxTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  taxLine: { fontSize: 12, marginTop: 2 },
  downloadButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, padding: 12, borderRadius: 8 },
  downloadText: { fontSize: 14, fontWeight: '600' },
  loadMoreButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  loadMoreText: { fontSize: 16, fontWeight: '600' },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', marginTop: 16 },
  emptySubtitle: { fontSize: 14, marginTop: 8, textAlign: 'center' },
});
