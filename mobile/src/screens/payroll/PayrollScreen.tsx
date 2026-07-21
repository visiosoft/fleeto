import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { payrollService } from '../../services/financeService';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import FAB from '../../components/common/FAB';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const tabs = ['All', 'Pending', 'Paid'];

const PayrollScreen = ({ navigation }: any) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPayroll = useCallback(async () => {
    try {
      const res = await payrollService.getAll();
      const data = res.data?.data || res.data || [];
      setEntries(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchPayroll(); }, [fetchPayroll]);
  useEffect(() => { const u = navigation.addListener('focus', fetchPayroll); return u; }, [navigation, fetchPayroll]);

  useEffect(() => {
    let data = entries;
    if (activeTab !== 'All') {
      data = data.filter((e: any) => e.status?.toLowerCase() === activeTab.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((e: any) => e.driverName?.toLowerCase().includes(q) || e.period?.toLowerCase().includes(q));
    }
    setFiltered(data);
  }, [search, entries, activeTab]);

  const totalPayroll = filtered.reduce((sum, e) => sum + (e.totalAmount || e.salary || 0), 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Summary */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Payroll</Text>
        <Text style={styles.summaryAmount}>AED {totalPayroll.toLocaleString()}</Text>
        <Text style={styles.summaryCount}>{filtered.length} entries</Text>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search payroll..." />
      <View style={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity key={tab} style={[styles.tab, activeTab === tab && styles.tabActive]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPayroll(); }} />}
        ListEmptyComponent={<EmptyState icon="account-cash-outline" title="No payroll entries" />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('PayrollDetail', { entry: item })}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.driverName || 'D')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.driverName || 'Driver'}</Text>
                <Text style={styles.period}>{item.period || item.month || ''}</Text>
              </View>
              <View style={styles.rightCol}>
                <Text style={styles.amount}>AED {(item.totalAmount || item.salary || 0).toLocaleString()}</Text>
                {item.status && <StatusBadge status={item.status} />}
              </View>
            </View>
          </Card>
        )}
      />
      <FAB onPress={() => navigation.navigate('PayrollForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryCard: {
    backgroundColor: colors.primary, margin: spacing.md, marginBottom: 0,
    borderRadius: borderRadius.lg, padding: spacing.md,
  },
  summaryLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium },
  summaryAmount: { fontSize: 28, fontFamily: fonts.extraBold, color: colors.white, marginTop: 2 },
  summaryCount: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.6)', marginTop: 2, fontFamily: fonts.regular },
  tabRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.xs, gap: spacing.xs },
  tab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  tabActive: { backgroundColor: colors.primary },
  tabText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.textSecondary },
  tabTextActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 80 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.accent },
  info: { flex: 1, marginLeft: spacing.sm },
  name: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  period: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  rightCol: { alignItems: 'flex-end' },
  amount: { fontSize: fontSize.md, fontFamily: fonts.extraBold, color: colors.primary, marginBottom: 4 },
});

export default PayrollScreen;
