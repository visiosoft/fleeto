import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { payrollService } from '../../services/financeService';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const PayrollDetailScreen = ({ route, navigation }: any) => {
  const entry = route.params?.entry;
  if (!entry) return null;

  const handleDelete = () => Alert.alert('Delete Payroll Entry', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await payrollService.delete(entry._id); navigation.goBack(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  const rows = [
    { label: 'Driver', value: entry.driverName },
    { label: 'Period', value: entry.period || entry.month },
    { label: 'Base Salary', value: entry.salary ? `AED ${entry.salary.toLocaleString()}` : null },
    { label: 'Overtime', value: entry.overtime ? `AED ${entry.overtime.toLocaleString()}` : null },
    { label: 'Deductions', value: entry.deductions ? `AED ${entry.deductions.toLocaleString()}` : null },
    { label: 'Bonus', value: entry.bonus ? `AED ${entry.bonus.toLocaleString()}` : null },
    { label: 'Total', value: entry.totalAmount ? `AED ${entry.totalAmount.toLocaleString()}` : null },
    { label: 'Payment Date', value: entry.paymentDate },
    { label: 'Payment Method', value: entry.paymentMethod },
    { label: 'Notes', value: entry.notes },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.avatarText}>{(entry.driverName || 'D')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{entry.driverName || 'Payroll Entry'}</Text>
        <Text style={styles.amount}>AED {(entry.totalAmount || entry.salary || 0).toLocaleString()}</Text>
        {entry.status && <StatusBadge status={entry.status} />}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('PayrollForm', { entry })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Payroll Breakdown</Text>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.val}>{r.value}</Text>
          </View>
        ))}
      </Card>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  headerIcon: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, fontFamily: fonts.bold, color: colors.white },
  name: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  amount: { fontSize: 24, fontFamily: fonts.extraBold, color: colors.accent, marginTop: 4, marginBottom: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'center', padding: spacing.md, gap: spacing.sm, marginTop: -spacing.md },
  editBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, ...shadows.sm,
  },
  editText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.white, marginLeft: spacing.xs },
  deleteBtn: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm,
    borderRadius: borderRadius.full, ...shadows.sm,
  },
  deleteText: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.error, marginLeft: spacing.xs },
  sectionTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: fontSize.sm, color: colors.textSecondary, fontFamily: fonts.regular },
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, flex: 1, textAlign: 'right' },
});

export default PayrollDetailScreen;
