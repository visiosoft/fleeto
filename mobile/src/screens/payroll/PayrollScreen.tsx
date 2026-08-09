import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { payrollService } from '../../services/financeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const money = (n: any) => `AED ${Number(n || 0).toLocaleString()}`;

/** "07" + 2026 → "July 2026" */
const monthLabel = (entry: any) => {
  const idx = parseInt(String(entry?.month ?? ''), 10) - 1;
  const name = idx >= 0 && idx < 12 ? MONTH_NAMES[idx] : String(entry?.month ?? '');
  return [name, entry?.year].filter(Boolean).join(' ').trim();
};

/** Short pill label, e.g. "Jul 2026" */
const shortMonthLabel = (entry: any) => {
  const idx = parseInt(String(entry?.month ?? ''), 10) - 1;
  const name = idx >= 0 && idx < 12 ? MONTH_NAMES[idx].slice(0, 3) : String(entry?.month ?? '');
  return [name, entry?.year].filter(Boolean).join(' ').trim();
};

const statusStyle = (status: string) => {
  switch (String(status || '').toLowerCase()) {
    case 'paid': return { bg: ui.greenTint, color: ui.green, label: 'Paid' };
    case 'partial': return { bg: ui.amberTint, color: ui.amber, label: 'Partial' };
    default: return { bg: ui.grayTint, color: ui.muted, label: 'Pending' };
  }
};

const PayrollScreen = ({ navigation }: any) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [monthFilter, setMonthFilter] = useState('All');

  const fetchPayroll = useCallback(async () => {
    try {
      const res = await payrollService.getAll();
      const data = res.data?.data || res.data || [];
      setEntries(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);
  useEffect(() => {
    const u = navigation?.addListener?.('focus', fetchPayroll);
    return u;
  }, [navigation, fetchPayroll]);

  // Distinct "Mon YYYY" values present in the data, newest first
  const monthOptions = useMemo(() => {
    const seen = new Map<string, number>();
    entries.forEach((e: any) => {
      const label = shortMonthLabel(e);
      if (!label) return;
      const sortKey = Number(e.year || 0) * 100 + Number(e.month || 0);
      if (!seen.has(label)) seen.set(label, sortKey);
    });
    return Array.from(seen.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label]) => label);
  }, [entries]);

  const filtered = useMemo(() => {
    const list = monthFilter === 'All'
      ? entries
      : entries.filter((e: any) => shortMonthLabel(e) === monthFilter);
    return [...list].sort((a: any, b: any) =>
      (Number(b.year || 0) * 100 + Number(b.month || 0)) - (Number(a.year || 0) * 100 + Number(a.month || 0)));
  }, [entries, monthFilter]);

  // Everything still owed on payslips that are not fully settled
  const totalPayable = useMemo(
    () => filtered
      .filter((e: any) => ['pending', 'partial'].includes(String(e.status || 'pending').toLowerCase()))
      .reduce((s: number, e: any) => s + Number(e.balanceDue || 0), 0),
    [filtered],
  );

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Payroll</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('PayrollForm')}>
          <Icon name="plus" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {monthOptions.length > 0 && (
        <View style={styles.pillBar}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pillRow}
            keyboardShouldPersistTaps="handled"
          >
            {['All', ...monthOptions].map(m => {
              const active = monthFilter === m;
              return (
                <TouchableOpacity
                  key={m}
                  style={[styles.pill, active && styles.pillActive]}
                  onPress={() => setMonthFilter(m)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.pillText, active && styles.pillTextActive]}>{m}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <FlatList
        data={filtered}
        keyExtractor={(item: any) => String(item._id)}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayroll(); }} />
        }
        ListHeaderComponent={
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total payable this month</Text>
            <Text style={styles.summaryValue}>{money(totalPayable)}</Text>
            <Text style={styles.summaryCount}>
              {filtered.length} payslip{filtered.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={
          <EmptyState
            icon="account-cash-outline"
            title="No payslips yet"
            subtitle="Create a payslip to track salary, overtime and advances."
            actionLabel="Add Payslip"
            onAction={() => navigation.navigate('PayrollForm')}
          />
        }
        renderItem={({ item }) => {
          const balance = Number(item.balanceDue || 0);
          const settled = balance <= 0;
          const s = statusStyle(item.status);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('PayrollDetail', { id: item._id, entry: item })}
            >
              <View style={[styles.iconBox, { backgroundColor: ui.lilac }]}>
                <Icon name="account-cash-outline" size={20} color={ui.purple} />
              </View>
              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.driverName || 'Driver'}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>
                  {monthLabel(item)} • Net {money(item.netPay)}
                </Text>
              </View>
              <View style={styles.rightCol}>
                <Text style={[styles.balanceValue, { color: settled ? ui.green : ui.ink }]}>
                  {money(balance)}
                </Text>
                <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
                  <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },

  pillBar: { marginBottom: 4 },
  pillRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center' },
  pill: {
    minHeight: 34, justifyContent: 'center',
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  pillActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  pillText: { fontSize: 12, fontFamily: fonts.medium, color: ui.muted },
  pillTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },

  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 80 },
  summaryCard: { backgroundColor: ui.ink, borderRadius: 16, padding: 18, marginBottom: 14 },
  summaryLabel: { fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  summaryValue: { fontSize: 30, fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: -0.8, marginTop: 4 },
  summaryCount: { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.55)', marginTop: 4 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 2 },
  rightCol: { alignItems: 'flex-end', gap: 5 },
  balanceValue: { fontSize: 15, fontFamily: fonts.bold, letterSpacing: -0.3 },
  statusPill: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 10, fontFamily: fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },
});

export default PayrollScreen;
