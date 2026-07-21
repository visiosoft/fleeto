import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { invoiceService } from '../../services/financeService';
import StatusBadge from '../../components/common/StatusBadge';
import FAB from '../../components/common/FAB';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, fonts, shadows } from '../../config/theme';

const tabs = ['All', 'Draft', 'Sent', 'Paid', 'Overdue'];

const fmt = (d: any) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const InvoiceListScreen = ({ navigation }: any) => {
  const [invoices, setInvoices] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInvoices = useCallback(async () => {
    try {
      const res = await invoiceService.getAll();
      const data = res.data?.data || res.data || [];
      setInvoices(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);
  useEffect(() => { const u = navigation.addListener('focus', fetchInvoices); return u; }, [navigation, fetchInvoices]);

  useEffect(() => {
    let data = invoices;
    if (activeTab !== 'All') {
      data = data.filter((inv: any) => {
        const s = inv.status?.toLowerCase();
        const tab = activeTab.toLowerCase();
        if (tab === 'unpaid') return s !== 'paid' && s !== 'draft';
        return s === tab;
      });
    }
    setFiltered(data);
  }, [invoices, activeTab]);

  const getCount = (tab: string) => {
    if (tab === 'All') return invoices.length;
    return invoices.filter((inv: any) => {
      const s = inv.status?.toLowerCase();
      const t = tab.toLowerCase();
      if (t === 'unpaid') return s !== 'paid' && s !== 'draft';
      return s === t;
    }).length;
  };

  const totalAmount = invoices.reduce((sum, i) => sum + (i.total || i.totalAmount || 0), 0);
  const totalPaid = invoices.reduce((sum, i) => sum + (i.totalPaid || 0), 0);
  const totalOutstanding = totalAmount - totalPaid;

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Invoices</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('InvoiceForm')}>
          <Icon name="plus" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Invoiced</Text>
            <Text style={styles.summaryAmount}>AED {totalAmount.toLocaleString()}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Outstanding</Text>
            <Text style={[styles.summaryAmount, { color: colors.accent }]}>AED {totalOutstanding.toLocaleString()}</Text>
          </View>
        </View>
        <View style={styles.summaryBar}>
          <View style={[styles.summaryBarFill, { flex: totalPaid || 1 }]} />
          <View style={[styles.summaryBarRemain, { flex: totalOutstanding || 0.1 }]} />
        </View>
        <View style={styles.summaryChips}>
          <View style={[styles.summaryChip, { backgroundColor: colors.successLight }]}>
            <Text style={[styles.summaryChipText, { color: colors.success }]}>Paid: {getCount('Paid')}</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: colors.warningLight }]}>
            <Text style={[styles.summaryChipText, { color: '#92400E' }]}>Draft: {getCount('Draft')}</Text>
          </View>
          <View style={[styles.summaryChip, { backgroundColor: colors.errorLight }]}>
            <Text style={[styles.summaryChipText, { color: colors.error }]}>Overdue: {getCount('Overdue')}</Text>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab} ({getCount(tab)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Invoice List */}
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchInvoices(); }} />}
        ListEmptyComponent={<EmptyState icon="receipt" title="No invoices found" actionLabel="Create Invoice" onAction={() => navigation.navigate('InvoiceForm')} />}
        renderItem={({ item }) => {
          const contract = item.contract || {};
          const balance = (item.total || 0) - (item.totalPaid || 0);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('InvoiceDetail', { id: item._id, invoice: item })}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.invoiceNum}>{item.invoiceNumber || 'Invoice'}</Text>
                  <Text style={styles.clientName}>{contract.companyName || item.customerName || 'Client'}</Text>
                </View>
                <StatusBadge status={item.status || 'draft'} />
              </View>

              {/* Amount Row */}
              <View style={styles.amountRow}>
                <View style={styles.amountItem}>
                  <Text style={styles.amountLabel}>Total</Text>
                  <Text style={styles.amountValue}>AED {(item.total || item.totalAmount || 0).toLocaleString()}</Text>
                </View>
                {(item.totalPaid || 0) > 0 && (
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Paid</Text>
                    <Text style={[styles.amountValue, { color: colors.success }]}>AED {(item.totalPaid || 0).toLocaleString()}</Text>
                  </View>
                )}
                {balance > 0 && (
                  <View style={styles.amountItem}>
                    <Text style={styles.amountLabel}>Balance</Text>
                    <Text style={[styles.amountValue, { color: colors.error }]}>AED {balance.toLocaleString()}</Text>
                  </View>
                )}
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.dateSection}>
                  <Icon name="calendar-outline" size={13} color={colors.textLight} />
                  <Text style={styles.dateText}>Due: {fmt(item.dueDate)}</Text>
                </View>
                {item.items && (
                  <Text style={styles.itemCount}>{item.items.length} item{item.items.length !== 1 ? 's' : ''}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: fontSize.xxxl, fontFamily: fonts.extraBold, color: colors.text },
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center',
  },
  summaryCard: {
    backgroundColor: colors.surface, marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg, padding: spacing.md, marginBottom: spacing.sm,
    ...shadows.sm,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1 },
  summaryDivider: { width: 1, height: 36, backgroundColor: colors.divider, marginHorizontal: spacing.sm },
  summaryLabel: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary },
  summaryAmount: { fontSize: fontSize.xl, fontFamily: fonts.extraBold, color: colors.text, marginTop: 2 },
  summaryBar: { flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden', gap: 2, marginTop: spacing.sm },
  summaryBarFill: { backgroundColor: colors.success, borderRadius: 3 },
  summaryBarRemain: { backgroundColor: colors.accent, borderRadius: 3 },
  summaryChips: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  summaryChip: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: borderRadius.full },
  summaryChipText: { fontSize: fontSize.xs, fontFamily: fonts.semiBold },
  tabScroll: { flexGrow: 0, marginBottom: spacing.xs },
  tabRow: { paddingHorizontal: spacing.md, gap: spacing.xs },
  tab: {
    paddingHorizontal: 16, height: 38, justifyContent: 'center',
    borderRadius: borderRadius.full, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 80 },
  card: {
    backgroundColor: colors.surface, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.sm, ...shadows.sm,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.sm },
  invoiceNum: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text },
  clientName: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  amountRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  amountItem: {
    flex: 1, backgroundColor: colors.background, borderRadius: borderRadius.md,
    paddingVertical: spacing.xs + 2, paddingHorizontal: spacing.sm,
  },
  amountLabel: { fontSize: 10, fontFamily: fonts.medium, color: colors.textLight, letterSpacing: 0.3 },
  amountValue: { fontSize: fontSize.sm, fontFamily: fonts.bold, color: colors.text, marginTop: 1 },
  cardFooter: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: colors.divider,
  },
  dateSection: { flexDirection: 'row', alignItems: 'center' },
  dateText: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textLight, marginLeft: 4 },
  itemCount: { fontSize: fontSize.xs, fontFamily: fonts.medium, color: colors.textSecondary },
});

export default InvoiceListScreen;
