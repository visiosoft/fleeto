import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { brandCss, brandHeaderHtml, brandFooterHtml } from '../../utils/brandTemplate';
import { costService } from '../../services/financeService';
import { vehicleService } from '../../services/vehicleService';
import { contractService } from '../../services/contractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import SearchBar from '../../components/common/SearchBar';
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

// Vehicles are identified by licensePlate; plateNumber does not exist on the
// record, which is why the number never used to appear next to an expense.
type VehicleInfo = { plate: string; name: string; label: string };

const buildVehicleInfo = (v: any): VehicleInfo => {
  const plate = v.licensePlate || v.plateNumber || v.vehicleNumber || '';
  const name = [v.make, v.model].filter((p) => p && p !== 'Unknown').join(' ');
  return { plate, name, label: [plate, name].filter(Boolean).join(' · ') || 'Vehicle' };
};

const CostListScreen = ({ navigation }: any) => {
  const [costs, setCosts] = useState<any[]>([]);
  const [vehicleMap, setVehicleMap] = useState<Record<string, VehicleInfo>>({});
  const [contractByVehicle, setContractByVehicle] = useState<Record<string, string>>({});
  const [timeTab, setTimeTab] = useState('This Month');
  const [filterTab, setFilterTab] = useState('All');
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchCosts = useCallback(async () => {
    try {
      const [res, vRes, cRes] = await Promise.all([
        costService.getAll(),
        vehicleService.getAll().catch(() => null),
        contractService.getAll().catch(() => null),
      ]);
      const data = res.data?.data || res.data || [];
      setCosts(Array.isArray(data) ? data : []);

      const vehicles = vRes?.data?.data || vRes?.data || [];
      if (Array.isArray(vehicles)) {
        const map: Record<string, VehicleInfo> = {};
        vehicles.forEach((v: any) => { map[String(v._id)] = buildVehicleInfo(v); });
        setVehicleMap(map);
      }

      // Expenses carry no contractId, so a contract is reached through the
      // vehicle. Active contracts win when a vehicle has been rented twice.
      const contracts = cRes?.data?.data || cRes?.data || [];
      if (Array.isArray(contracts)) {
        const byVehicle: Record<string, string> = {};
        [...contracts]
          .sort((a: any, b: any) => (a.status === 'Active' ? -1 : 1) - (b.status === 'Active' ? -1 : 1))
          .forEach((c: any) => {
            if (!c.vehicleId) return;
            const key = String(c.vehicleId);
            if (!byVehicle[key]) byVehicle[key] = c.companyName || c.contactPerson || '';
          });
        setContractByVehicle(byVehicle);
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
    // Free-text search across vehicle number, vehicle name, category, contract
    // client and the description.
    const q = search.trim().toLowerCase();
    if (q) {
      data = data.filter((c: any) => {
        const v = vehicleMap[String(c.vehicleId)];
        return [
          v?.plate,
          v?.name,
          c.vehiclePlate,
          c.vehicleName,
          contractByVehicle[String(c.vehicleId)],
          c.expenseType || c.category,
          c.description,
          c.driverName,
        ].some((field) => String(field ?? '').toLowerCase().includes(q));
      });
    }

    const time = (c: any) => new Date(c.date || c.createdAt).getTime();
    const vehicleLabelOf = (c: any) =>
      vehicleMap[String(c.vehicleId)]?.label || c.vehiclePlate || c.vehicleName || '';

    if (filterTab === 'By Vehicle') {
      if (selectedVehicle) {
        data = data.filter((c) => String(c.vehicleId) === selectedVehicle);
      }
      data.sort((a, b) => vehicleLabelOf(a).localeCompare(vehicleLabelOf(b)) || time(b) - time(a));
    } else if (filterTab === 'By Contract') {
      data.sort((a, b) =>
        String(contractByVehicle[String(a.vehicleId)] || '~').localeCompare(
          String(contractByVehicle[String(b.vehicleId)] || '~')) || time(b) - time(a));
    } else if (filterTab === 'By Category') {
      data.sort((a, b) =>
        String(a.expenseType || a.category || 'other').localeCompare(String(b.expenseType || b.category || 'other')) || time(b) - time(a));
    } else {
      data.sort((a, b) => time(b) - time(a));
    }
    return data;
  }, [costs, timeTab, filterTab, selectedVehicle, vehicleMap, contractByVehicle, search]);

  const totalAmount = filtered.reduce((sum, c) => sum + (c.amount || 0), 0);

  // Vehicles that actually have expenses, for the dropdown
  const vehicleOptions = useMemo(() => {
    const seen = new Map<string, string>();
    costs.forEach((c) => {
      if (!c.vehicleId) return;
      const id = String(c.vehicleId);
      const info = vehicleMap[id];
      const contract = contractByVehicle[id];
      const base = info?.label || c.vehiclePlate || c.vehicleName || 'Vehicle';
      seen.set(id, contract ? `${base} — ${contract}` : base);
    });
    const options = Array.from(seen.entries())
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return [{ id: '', label: 'All vehicles' }, ...options];
  }, [costs, vehicleMap, contractByVehicle]);

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

  // Branded expense report PDF of the currently filtered list
  const generateReportHtml = () => {
    const fmtRow = (d: any) => {
      const date = new Date(d);
      return isNaN(date.getTime()) ? '' : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const rows = filtered.map((c: any) => {
      const v = vehicleMap[String(c.vehicleId)];
      return `<tr>
        <td>${fmtRow(c.date || c.createdAt)}</td>
        <td>${(c.description || '').replace(/</g, '&lt;')}</td>
        <td>${v?.plate || c.vehiclePlate || '—'}</td>
        <td>${catName(c)}</td>
        <td class="num">${(c.amount || 0).toLocaleString()}</td>
      </tr>`;
    }).join('');
    const catRows = Object.entries(categorySums)
      .map(([cat, amt]) => `<span class="chip">${cat.charAt(0).toUpperCase() + cat.slice(1)}: AED ${amt.toLocaleString()}</span>`)
      .join('');
    return `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;500;600;700;800&display=swap');
  @page { margin: 0; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Bricolage Grotesque', serif; color: #333; min-height: 100vh; display: flex; flex-direction: column; }
  ${brandCss}
  .body { flex: 1; padding: 30px 40px 16px; }
  .doc-title { font-size: 24px; font-weight: 800; color: #232B38; text-transform: uppercase; }
  .doc-sub { font-size: 12px; color: #666; margin: 4px 0 16px; }
  .chips { margin-bottom: 16px; }
  .chip { display: inline-block; background: #f4f4f6; border-radius: 99px; padding: 5px 12px; font-size: 11px; color: #444; margin: 0 6px 6px 0; }
  table { width: 100%; border-collapse: collapse; }
  thead td { font-size: 11px; font-weight: 700; padding: 8px 6px; border-bottom: 2px solid #333; }
  tbody td { font-size: 11px; padding: 8px 6px; border-bottom: 1px solid #eee; color: #444; }
  td.num, thead td:last-child { text-align: right; }
  .total-row { display: flex; justify-content: space-between; margin-top: 14px; padding: 12px 14px; background: #232B38; color: #fff; border-radius: 8px; }
  .total-row .lbl { font-size: 12px; opacity: 0.8; }
  .total-row .val { font-size: 16px; font-weight: 800; }
</style></head><body>
  ${brandHeaderHtml}
  <div class="body">
    <div class="doc-title">Expense Report</div>
    <div class="doc-sub">${monthName} • ${filtered.length} expense${filtered.length !== 1 ? 's' : ''} • Generated ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
    <div class="chips">${catRows}</div>
    <table>
      <thead><tr><td>Date</td><td>Description</td><td>Vehicle</td><td>Category</td><td>Amount (AED)</td></tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <div class="total-row"><span class="lbl">Total (${filtered.length} expenses)</span><span class="val">AED ${totalAmount.toLocaleString()}</span></div>
  </div>
  ${brandFooterHtml}
</body></html>`;
  };

  const exportReport = async (share = false) => {
    if (filtered.length === 0) {
      if (Platform.OS === 'web') window.alert('No expenses to export for this period.');
      else Alert.alert('Nothing to export', 'No expenses found for this period.');
      return;
    }
    let webWin: any = null;
    if (Platform.OS === 'web') webWin = window.open('', '_blank');
    try {
      const html = generateReportHtml();
      if (Platform.OS === 'web') {
        if (!webWin) { window.alert('Please allow pop-ups to export the report.'); return; }
        webWin.document.write(html);
        webWin.document.close();
        webWin.focus();
        setTimeout(() => webWin.print(), 400);
      } else if (!share) {
        await Print.printAsync({ html });
      } else {
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Share Expense Report', UTI: 'com.adobe.pdf' });
        }
      }
    } catch (err: any) {
      if (webWin) { try { webWin.close(); } catch {} }
      if (Platform.OS === 'web') window.alert(err.message || 'Failed to generate report');
      else Alert.alert('Error', err.message || 'Failed to generate report');
    }
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Expenses</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity style={styles.toolBtn} onPress={() => exportReport(false)}>
            <Icon name="file-pdf-box" size={18} color={ui.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.toolBtn} onPress={() => exportReport(true)}>
            <Icon name="share-variant-outline" size={17} color={ui.purple} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('CostForm')}>
            <Icon name="plus" size={20} color={colors.white} />
          </TouchableOpacity>
        </View>
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

      {/* Vehicle dropdown (shown when filtering by vehicle) */}
      {filterTab === 'By Vehicle' && vehicleOptions.length > 1 && (
        <View style={styles.dropdownWrap}>
          <Dropdown
            style={styles.dropdown}
            containerStyle={styles.dropdownList}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelected}
            itemTextStyle={styles.dropdownItem}
            inputSearchStyle={styles.dropdownSearch}
            data={vehicleOptions}
            labelField="label"
            valueField="id"
            search
            searchPlaceholder="Search vehicle number or name..."
            placeholder="All vehicles"
            value={selectedVehicle ?? ''}
            onChange={(item: any) => setSelectedVehicle(item.id ? item.id : null)}
            renderLeftIcon={() => (
              <Icon name="van-utility" size={16} color={ui.purple} style={{ marginRight: 8 }} />
            )}
          />
        </View>
      )}

      <SearchBar
        value={search}
        onChangeText={setSearch}
        placeholder="Search vehicle, contract or category..."
      />

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
          const info = vehicleMap[String(item.vehicleId)];
          // Vehicle number first - it is what identifies the vehicle at a glance
          const vehicleLabel = info?.label || item.vehiclePlate || item.vehicleName;
          const contractName = contractByVehicle[String(item.vehicleId)];
          const sub = [vehicleLabel, contractName].filter(Boolean).join(' • ') || catName(item);
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
  headerBtns: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  toolBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.lilac, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.15)',
  },
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
  dropdownWrap: { paddingHorizontal: 20, marginTop: 4 },
  dropdown: {
    height: 46, backgroundColor: colors.white,
    borderRadius: 12, paddingHorizontal: 14,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  dropdownList: { borderRadius: 12, borderWidth: 1, borderColor: ui.cardBorder },
  dropdownPlaceholder: { fontSize: 13, fontFamily: fonts.medium, color: ui.muted },
  dropdownSelected: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  dropdownItem: { fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  dropdownSearch: { height: 40, borderRadius: 8, fontSize: 13, fontFamily: fonts.regular },
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
