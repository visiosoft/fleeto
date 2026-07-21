import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { receiptService } from '../../services/financeService';
import Card from '../../components/common/Card';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const ReceiptDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [receipt, setReceipt] = useState<any>(route.params.receipt || null);
  const [loading, setLoading] = useState(!route.params.receipt);

  useEffect(() => {
    (async () => {
      try { const r = await receiptService.getById(id); setReceipt(r.data?.data || r.data); }
      catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, [id]);

  const handleDelete = () => Alert.alert('Delete Receipt', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await receiptService.delete(id); navigation.goBack(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  if (loading || !receipt) return <LoadingScreen />;

  const rows = [
    { label: 'Receipt #', value: receipt.receiptNumber },
    { label: 'Description', value: receipt.description },
    { label: 'Amount', value: receipt.amount ? `AED ${receipt.amount.toLocaleString()}` : null },
    { label: 'Date', value: receipt.date },
    { label: 'Paid To', value: receipt.paidTo },
    { label: 'Payment Method', value: receipt.paymentMethod },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="receipt" size={32} color={colors.white} />
        </View>
        <Text style={styles.title}>{receipt.receiptNumber || 'Receipt'}</Text>
        <Text style={styles.amount}>AED {(receipt.amount || 0).toLocaleString()}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('ReceiptForm', { receipt })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Details</Text>
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
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.lg, fontFamily: fonts.semiBold, color: 'rgba(255,255,255,0.8)' },
  amount: { fontSize: 28, fontFamily: fonts.extraBold, color: colors.white, marginTop: 4 },
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
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
});

export default ReceiptDetailScreen;
