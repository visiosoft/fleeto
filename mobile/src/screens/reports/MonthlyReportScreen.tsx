import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { dashboardService } from '../../services/dashboardService';
import { costService } from '../../services/financeService';
import Card from '../../components/common/Card';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const MonthlyReportScreen = () => {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchReport = async () => {
    try {
      const [countsRes, fuelRes, maintenanceRes, costsRes] = await Promise.all([
        dashboardService.getActiveCounts(),
        dashboardService.getCurrentMonthFuel(),
        dashboardService.getCurrentMonthMaintenance(),
        costService.getCurrentMonth(),
      ]);
      const counts = countsRes.data?.data || countsRes.data || {};
      const fuel = fuelRes.data?.data?.total ?? fuelRes.data?.total ?? 0;
      const maintenance = maintenanceRes.data?.data?.total ?? maintenanceRes.data?.total ?? 0;
      setData({
        totalVehicles: counts.totalActiveVehicles ?? (Array.isArray(counts.activeVehicles) ? counts.activeVehicles.length : 0),
        totalDrivers: counts.totalActiveDrivers ?? (Array.isArray(counts.activeDrivers) ? counts.activeDrivers.length : 0),
        activeContracts: counts.activeContracts ?? 0,
        monthlyFuel: fuel,
        monthlyMaintenance: maintenance,
        totalExpenses: fuel + maintenance,
      });
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchReport(); }, []);

  if (loading) return <LoadingScreen message="Generating report..." />;

  const statItems = [
    { icon: 'gas-station-outline', label: 'Fuel Costs', value: `AED ${(data?.monthlyFuel || 0).toLocaleString()}`, color: colors.accent, bg: colors.accentLight },
    { icon: 'wrench-outline', label: 'Maintenance', value: `AED ${(data?.monthlyMaintenance || 0).toLocaleString()}`, color: colors.error, bg: colors.errorLight },
  ];

  const summaryRows = [
    { label: 'Active Vehicles', value: data?.totalVehicles || 0, icon: 'car-outline' },
    { label: 'Active Drivers', value: data?.totalDrivers || 0, icon: 'account-outline' },
    { label: 'Active Contracts', value: data?.activeContracts || 0, icon: 'file-document-outline' },
    { label: 'Total Monthly Costs', value: `AED ${(data?.totalExpenses || 0).toLocaleString()}`, icon: 'cash-multiple' },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={fetchReport} />}>

      {/* Total Card */}
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Expenses This Month</Text>
        <Text style={styles.totalAmount}>AED {(data?.totalExpenses || 0).toLocaleString()}</Text>
      </View>

      {/* Stat Pills */}
      <View style={styles.statRow}>
        {statItems.map(s => (
          <View key={s.label} style={[styles.statPill, { backgroundColor: s.bg }]}>
            <Icon name={s.icon} size={20} color={s.color} />
            <Text style={[styles.statValue, { color: s.color }]}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Summary Card */}
      <Card>
        <Text style={styles.sectionTitle}>Summary</Text>
        {summaryRows.map((r, i) => (
          <View key={i} style={[styles.row, i < summaryRows.length - 1 && styles.rowBorder]}>
            <View style={styles.rowLeft}>
              <Icon name={r.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.rowLabel}>{r.label}</Text>
            </View>
            <Text style={styles.rowVal}>{typeof r.value === 'object' ? '-' : r.value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  totalCard: {
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  totalLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.medium },
  totalAmount: { fontSize: 28, fontFamily: fonts.extraBold, color: colors.white, marginTop: 4 },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statPill: { flex: 1, borderRadius: borderRadius.lg, padding: spacing.sm + 2, alignItems: 'center' },
  statValue: { fontSize: fontSize.md, fontFamily: fonts.extraBold, marginTop: 4 },
  statLabel: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  rowLeft: { flexDirection: 'row', alignItems: 'center' },
  rowLabel: { fontSize: fontSize.md, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  rowVal: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
});

export default MonthlyReportScreen;
