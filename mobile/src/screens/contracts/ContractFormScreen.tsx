import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { contractService } from '../../services/contractService';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const ContractFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.contract;
  const isEdit = !!existing;
  const [form, setForm] = useState({
    contractNumber: existing?.contractNumber || '',
    customerName: existing?.customerName || '',
    vehiclePlate: existing?.vehiclePlate || '',
    startDate: existing?.startDate || '',
    endDate: existing?.endDate || '',
    monthlyRate: existing?.monthlyRate?.toString() || '',
    totalValue: existing?.totalValue?.toString() || '',
    paymentMethod: existing?.paymentMethod || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const u = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const submit = async () => {
    if (!form.contractNumber.trim()) { Alert.alert('Error', 'Contract number is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, monthlyRate: form.monthlyRate ? parseFloat(form.monthlyRate) : undefined, totalValue: form.totalValue ? parseFloat(form.totalValue) : undefined };
      if (isEdit) await contractService.update(existing._id, payload);
      else await contractService.create(payload);
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.c} contentContainerStyle={styles.p} keyboardShouldPersistTaps="handled">
      <FormInput label="Contract Number" value={form.contractNumber} onChangeText={u('contractNumber')} placeholder="e.g. CTR-001" required />
      <FormInput label="Customer Name" value={form.customerName} onChangeText={u('customerName')} placeholder="Customer name" />
      <FormInput label="Vehicle Plate" value={form.vehiclePlate} onChangeText={u('vehiclePlate')} placeholder="Vehicle plate number" />
      <FormInput label="Start Date" value={form.startDate} onChangeText={u('startDate')} placeholder="YYYY-MM-DD" />
      <FormInput label="End Date" value={form.endDate} onChangeText={u('endDate')} placeholder="YYYY-MM-DD" />
      <FormInput label="Monthly Rate (AED)" value={form.monthlyRate} onChangeText={u('monthlyRate')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Total Value (AED)" value={form.totalValue} onChangeText={u('totalValue')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Payment Method" value={form.paymentMethod} onChangeText={u('paymentMethod')} placeholder="e.g. Bank Transfer" />
      <FormInput label="Notes" value={form.notes} onChangeText={u('notes')} placeholder="Additional notes" multiline numberOfLines={3} />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
        <Text style={styles.btnT}>{loading ? 'Saving...' : isEdit ? 'Update Contract' : 'Add Contract'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  c: { flex: 1, backgroundColor: colors.background },
  p: { padding: spacing.md },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.md, ...shadows.md },
  btnT: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default ContractFormScreen;
