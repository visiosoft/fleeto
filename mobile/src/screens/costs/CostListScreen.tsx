import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { costService } from '../../services/financeService';
import { vehicleService } from '../../services/vehicleService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fonts } from '../../config/theme';
import { ui } from '../../config/ui';

const timeTabs = ['This Month', 'Last Month', 'Custom'];
const filterTabs = ['All', 'By Vehicle', 'By Contract', 'By Category'];

const categoryStyles: Record<string, { icon: string; color: string; tint: string }> = {
  fuel: { icon: 'gas-station-outline', color: ui.purple, tint: 'rgba(91,43,201,0.08)' },
  salik: { icon: 'road-variant', color: ui.orange, tint: ui.orangeTint },
  toll: { icon: 'road-variant', color: ui.orange, tint: ui.orangeTint },
  maintenance: { icon: 'wrench-outline', color: ui.blue, tint: ui.blueTint },
  insurance: { icon: 'shield-outline', color: ui.green, tint: ui.greenTint },
  parking: { icon: 'parking', color: '#0891b2', tint: 'rgba(8,145,178,0.08)' },
  other: { icon: 'cash-multiple', color: ui.muted, tint: ui.grayTint },
};

const getCat = (c: any) => categoryStyles[(c.expenseType || c.category || 'other').toLowerCase()] || categoryStyles.other;
const catName = (c: any) => {
  const n = (c.expenseType || c.category || 'other').toLowerCase();
  return n.charAt(0).toUpperCase() + n.slice(1);
};

const dayLabel = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return 'Earlier';
  const today = new Date();
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const sameDay = (a: Date, b: Date) =>
    a.getDate() === b.getDate() && a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
  if (sameDay(date, today)) return 'Today';
  if (sameDay(date, yesterday)) return 'Yesterday';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const CostListScreen = ({ navigation }: any) => {
  const [costs, setCosts] = useState<any[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Record<string, string>>({});
  const [timeTab, setTimeTab] = useState('This Month');
  const [filterTab, setFilterTab] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCosts = useCallback(async () => {
    try {
      const [res, vRes] = await Promise.all([
        costService.getAll(),
        vehicleService.getAll().catch(() => null),
      ]);
      const data = res.data?.data || res.data || [];
      setCosts(Array.isArray(data) ? data : []);
      const vehicles = vRes?.data?.data || vRes?.data || [];
      if (Array.isArray(vehicles)) {
        const map: Record<string, string> = {};
        vehicles.forEach((v: any) => {
          map[String(v._id)] = v.plateNumber || [v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';
        });
        setVehicleMap(map);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchCosts(); }, [fetchCosts]);
  useEffect(() => { const u = navigation.addListener('focus', fetchCosts); return u; }, [navigation, fetchCosts]);

  const filtered = useMemo(() => {
    let data = [...costs];
    const now = new Date();
    if (timeTab === 'This Month') {
      data = data.filter((c: any) => {
        const d = new Date(c.date || c.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      });
    } else if (timeTab === 'Last Month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      data = data.filter((c: any) => {
        const d = new Date(c.date || c.createdAt);
        return d.getMonth() === lm.getMonth() && d.getFullYear() === lm.getFullYear();
      });
    }
    const time = (c: any) => new Date(c.date || c.createdAt).getTime();
    if (filterTab === 'By Vehicle') {
      if (selectedVehicle) {
        data = data.filter((c) => String(c.vehicleId) === selectedVehicle);
      }
      data.sort((a, b) =>
        String(vehicleMap[String(a.vehicleId)] || a.vehiclePlate || '').localeCompare(String(vehicleMap[String(b.vehicleId)] || b.vehiclePlate || '')) || time(b) - time(a));
    } else if (filterTab === 'By Contract') {
      data.sort((a, b) =>
        String(a.contractId || a.contractNumber || '').localeCompare(String(b.contractId || b.contractNumber || '')) || time(b) - time(a));
    } else if (filterTab === 'By Category') {
      data.sort((a, b) =>
        String(a.expenseType || a.category || 'other').localeCompare(String(b.expenseType || b.category || 'other')) || time(b) - time(a));
    } else {
      data.sort((a, b) => time(b) - time(a));
    }
    return data;
  }, [costs, timeTab, filterTab, selectedVehicle, vehicleMap]);

  const totalAmount = filtered.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Vehicles present in the current time window (for the By Vehicle chip row)
  const vehicleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    costs.forEach((c) => {
      if (c.vehicleId) {
        const id = String(c.vehicleId);
        seen.set(id, vehicleMap[id] || c.vehiclePlate || c.vehicleName || 'Vehicle');
      }
    });
    return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
  }, [costs, vehicleMap]);

  const categorySums: Record<string, number> = filtered.reduce((acc: any, c: any) => {
    const cat = (c.expenseType || c.category || 'other').toLowerCase();
    acc[cat] = (acc[cat] || 0) + (c.amount || 0);
    return acc;
  }, {});

  // Interleave day headers into the list ("All" sort only — grouped sorts get one flat list)
  const listData = useMemo(() => {
    const rows: any[] = [];
    let lastDay = '';
    filtered.forEach((c) => {
      if (filterTab === 'All') {
        const day = dayLabel(c.date || c.createdAt);
        if (day !== lastDay) { rows.push({ _type: 'header', _id: `h-${day}`, label: day }); lastDay = day; }
      }
      rows.push({ ...c, _type: 'item' });
    });
    return rows;
  }, [filtered, filterTab]);

  const monthName = (timeTab === 'Last Month'
    ? new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1)
    : new Date()
  ).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CostForm')}>
          <Icon name="plus" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Period Selector (segmented) */}
      <View style={styles.segmentWrap}>
        {timeTabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.segment, timeTab === tab && styles.segmentActive]}
            onPress={() => setTimeTab(tab)}
          >
            <Text style={[styles.segmentText, timeTab === tab && styles.segmentTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Total Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses — {monthName}</Text>
        <Text style={styles.totalAmount}>AED {totalAmount.toLocaleString()}</Text>
        <View style={styles.catChipsRow}>
          {Object.entries(categorySums).map(([cat, amt]) => {
            const c = categoryStyles[cat] || categoryStyles.other;
            return (
              <View key={cat} style={[styles.catChip, { backgroundColor: c.tint }]}>
                <Text style={[styles.catChipText, { color: c.color }]}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}: {amt.toLocaleString()}
                </Text>
              </View>
            );
          })}
        </View>
      </View>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
        {filterTabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.filterTab, filterTab === tab && styles.filterTabActive]}
            onPress={() => { setFilterTab(tab); if (tab !== 'By Vehicle') setSelectedVehicle(null); }}
          >
            <Text style={[styles.filterTabText, filterTab === tab && styles.filterTabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Vehicle picker (shown when filtering by vehicle) */}
      {filterTab === 'By Vehicle' && vehicleOptions.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity
            style={[styles.vehicleChip, !selectedVehicle && styles.vehicleChipActive]}
            onPress={() => setSelectedVehicle(null)}
          >
            <Text style={[styles.vehicleChipText, !selectedVehicle && styles.vehicleChipTextActive]}>All vehicles</Text>
          </TouchableOpacity>
          {vehicleOptions.map(v => (
            <TouchableOpacity
              key={v.id}
              style={[styles.vehicleChip, selectedVehicle === v.id && styles.vehicleChipActive]}
              onPress={() => setSelectedVehicle(selectedVehicle === v.id ? null : v.id)}
            >
              <Icon name="van-utility" size={13} color={selectedVehicle === v.id ? colors.white : ui.purple} />
              <Text style={[styles.vehicleChipText, selectedVehicle === v.id && styles.vehicleChipTextActive]}>{v.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Expense List */}
      <FlatList
        data={listData}
        keyExtractor={(item) => item._type === 'header' ? item._id : item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchCosts(); }} />}
        ListEmptyComponent={<EmptyState icon="cash-remove" title="No expenses found" actionLabel="Add Expense" onAction={() => navigation.navigate('CostForm')} />}
        ListFooterComponent={filtered.length > 0 ? (
          <View style={styles.totalRow}>
            <Text style={styles.totalRowLabel}>Total ({filtered.length} expense{filtered.length !== 1 ? 's' : ''})</Text>
            <Text style={styles.totalRowValue}>AED {totalAmount.toLocaleString()}</Text>
          </View>
        ) : null}
        renderItem={({ item }) => {
          if (item._type === 'header') {
            return <Text style={styles.dayHeader}>{item.label}</Text>;
          }
          const cat = getCat(item);
          const hasReceipt = (item.documents?.length || item.receipts?.length || 0) > 0;
          const vehicleLabel = vehicleMap[String(item.vehicleId)] || item.vehiclePlate || item.vehicleName;
          const sub = [vehicleLabel, item.driverName].filter(Boolean).join(' • ') || catName(item);
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('CostDetail', { id: item._id, cost: item })}
              activeOpacity={0.7}
            >
              <View style={[styles.iconBox, { backgroundColor: cat.tint }]}>
                <Icon name={cat.icon as any} size={20} color={cat.color} />
              </View>
              <View style={styles.info}>
                <Text style={styles.cardTitle} numberOfLines={1}>{item.description || catName(item)}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{sub}</Text>
              </View>
              <View style={styles.amountSection}>
                <Text style={styles.amount}>AED {(item.amount || 0).toLocaleString()}</Text>
                <Text style={[styles.receiptText, !hasReceipt && { color: ui.orange }]}>
                  {hasReceipt ? 'Receipt ✓' : 'No receipt'}
                </Text>
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
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: 4,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  segmentWrap: {
    flexDirection: 'row', marginHorizontal: 20, marginTop: 12,
    backgroundColor: colors.white, borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: ui.purple },
  segmentText: { fontSize: 13, fontFamily: fonts.medium, color: ui.muted },
  segmentTextActive: { color: colors.white, fontFamily: fonts.semiBold },
  totalCard: {
    marginHorizontal: 20, marginTop: 16,
    backgroundColor: colors.white, borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  totalLabel: { fontSize: 12, fontFamily: fonts.medium, color: ui.muted },
  totalAmount: { fontSize: 36, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -1, marginTop: 4 },
  catChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 },
  catChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 99 },
  catChipText: { fontSize: 12, fontFamily: fonts.semiBold },
  filterScroll: { flexGrow: 0, minHeight: 48, marginTop: 8 },
  filterRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 6 },
  filterTab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99, backgroundColor: colors.white,
    borderWidth: 1, borderColor: ui.border,
  },
  filterTabActive: { backgroundColor: ui.ink, borderColor: ui.ink },
  filterTabText: { fontSize: 12, fontFamily: fonts.medium, color: ui.ink },
  filterTabTextActive: { color: colors.white, fontFamily: fonts.semiBold },
  vehicleChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 99, backgroundColor: ui.lilac,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.15)',
  },
  vehicleChipActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  vehicleChipText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
  vehicleChipTextActive: { color: colors.white },
  totalRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: ui.ink, borderRadius: 14, padding: 16, marginTop: 8,
  },
  totalRowLabel: { fontSize: 13, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  totalRowValue: { fontSize: 18, fontFamily: fonts.bold, color: colors.white },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 80 },
  dayHeader: {
    fontSize: 12, fontFamily: fonts.semiBold, color: ui.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, paddingVertical: 4, marginTop: 4,
  },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  amountSection: { alignItems: 'flex-end' },
  amount: { fontSize: 15, fontFamily: fonts.bold, color: ui.ink },
  receiptText: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
});

export default CostListScreen;
