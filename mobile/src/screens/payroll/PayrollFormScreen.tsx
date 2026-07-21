import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { payrollService } from '../../services/financeService';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const PayrollFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.entry;
  const isEdit = !!existing;
  const [form, setForm] = useState({
    driverName: existing?.driverName || '',
    period: existing?.period || '',
    salary: existing?.salary?.toString() || '',
    bonus: existing?.bonus?.toString() || '',
    deductions: existing?.deductions?.toString() || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const u = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const submit = async () => {
    if (!form.driverName.trim()) { Alert.alert('Error', 'Driver name is required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        salary: form.salary ? parseFloat(form.salary) : 0,
        bonus: form.bonus ? parseFloat(form.bonus) : 0,
        deductions: form.deductions ? parseFloat(form.deductions) : 0,
      };
      if (isEdit) await payrollService.update(existing._id, payload);
      else await payrollService.create(payload);
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <FormInput label="Driver Name" value={form.driverName} onChangeText={u('driverName')} placeholder="Driver's name" required />
      <FormInput label="Period" value={form.period} onChangeText={u('period')} placeholder="e.g. July 2026" />
      <FormInput label="Salary (AED)" value={form.salary} onChangeText={u('salary')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Bonus (AED)" value={form.bonus} onChangeText={u('bonus')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Deductions (AED)" value={form.deductions} onChangeText={u('deductions')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Notes" value={form.notes} onChangeText={u('notes')} placeholder="Additional notes" multiline />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
        <Text style={styles.btnT}>{loading ? 'Saving...' : isEdit ? 'Update Entry' : 'Add Entry'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.md, ...shadows.md },
  btnT: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default PayrollFormScreen;
