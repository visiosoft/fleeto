import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import Card from '../../components/common/Card';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const reports = [
  { key: 'monthly', icon: 'calendar-month-outline', label: 'Monthly Report', desc: 'Monthly financial summary', color: colors.primary, bg: colors.purpleLight, screen: 'MonthlyReport' },
  { key: 'income', icon: 'trending-up', label: 'Net Income Report', desc: 'Revenue vs expenses analysis', color: '#10B981', bg: '#ECFDF5', screen: 'NetIncomeReport' },
  { key: 'contract', icon: 'file-chart-outline', label: 'Contract Cycle', desc: 'Contract lifecycle analysis', color: colors.accent, bg: colors.accentLight, screen: 'ContractCycleReport' },
  { key: 'vehicle', icon: 'car-cog', label: 'Vehicle Costs', desc: 'Cost breakdown by vehicle', color: colors.info, bg: '#EEEDF9', screen: 'VehicleCostReport' },
  { key: 'driver', icon: 'account-details-outline', label: 'Driver Performance', desc: 'Driver activity & expenses', color: '#EC4899', bg: '#FDF2F8', screen: 'DriverReport' },
  { key: 'fines', icon: 'alert-octagon-outline', label: 'RTA Fines', desc: 'Traffic fines summary', color: colors.error, bg: colors.errorLight, screen: 'ReportsRTAFines' },
];

const ReportsScreen = ({ navigation }: any) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <View style={styles.headerCard}>
      <Icon name="chart-box-outline" size={28} color={colors.white} />
      <View style={styles.headerInfo}>
        <Text style={styles.headerTitle}>Reports & Analytics</Text>
        <Text style={styles.headerSub}>Detailed insights for your fleet</Text>
      </View>
    </View>

    {reports.map((r) => (
      <Card key={r.key} onPress={() => navigation.navigate(r.screen)}>
        <View style={styles.row}>
          <View style={[styles.iconBox, { backgroundColor: r.bg }]}>
            <Icon name={r.icon} size={24} color={r.color} />
          </View>
          <View style={styles.info}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.desc}>{r.desc}</Text>
          </View>
          <Icon name="chevron-right" size={20} color={colors.textLight} />
        </View>
      </Card>
    ))}
  </ScrollView>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  headerCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, borderRadius: borderRadius.lg,
    padding: spacing.md, marginBottom: spacing.md,
  },
  headerInfo: { marginLeft: spacing.sm },
  headerTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.white },
  headerSub: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm + 2 },
  label: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  desc: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
});

export default ReportsScreen;
