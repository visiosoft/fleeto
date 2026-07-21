import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { receiptService } from '../../services/financeService';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const ReceiptFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.receipt;
  const isEdit = !!existing;
  const [form, setForm] = useState({
    receiptNumber: existing?.receiptNumber || '',
    description: existing?.description || '',
    amount: existing?.amount?.toString() || '',
    date: existing?.date || '',
    paidTo: existing?.paidTo || '',
    paymentMethod: existing?.paymentMethod || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const u = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const submit = async () => {
    if (!form.receiptNumber.trim()) { Alert.alert('Error', 'Receipt number is required'); return; }
    setLoading(true);
    try {
      const payload = { ...form, amount: form.amount ? parseFloat(form.amount) : 0 };
      if (isEdit) await receiptService.update(existing._id, payload);
      else await receiptService.create(payload);
      navigation.goBack();
    } catch (e: any) { Alert.alert('Error', e.message || 'Failed to save'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: spacing.md }} keyboardShouldPersistTaps="handled">
      <FormInput label="Receipt Number" value={form.receiptNumber} onChangeText={u('receiptNumber')} placeholder="e.g. RCT-001" required />
      <FormInput label="Description" value={form.description} onChangeText={u('description')} placeholder="Receipt description" />
      <FormInput label="Amount (AED)" value={form.amount} onChangeText={u('amount')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Date" value={form.date} onChangeText={u('date')} placeholder="YYYY-MM-DD" />
      <FormInput label="Paid To" value={form.paidTo} onChangeText={u('paidTo')} placeholder="Payee name" />
      <FormInput label="Payment Method" value={form.paymentMethod} onChangeText={u('paymentMethod')} placeholder="e.g. Cash, Card" />
      <FormInput label="Notes" value={form.notes} onChangeText={u('notes')} placeholder="Additional notes" multiline />
      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={submit} disabled={loading}>
        <Text style={styles.btnT}>{loading ? 'Saving...' : isEdit ? 'Update Receipt' : 'Create Receipt'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.md, ...shadows.md },
  btnT: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default ReceiptFormScreen;
