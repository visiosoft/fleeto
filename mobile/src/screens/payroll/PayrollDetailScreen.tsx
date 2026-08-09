import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { payrollService } from '../../services/financeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const confirmThen = (title: string, msg: string, onConfirm: () => void) => {
  if (Platform.OS === 'web') {
    if ((window as any).confirm(`${title}\n\n${msg}`)) onConfirm();
  } else {
    Alert.alert(title, msg, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: onConfirm },
    ]);
  }
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const money = (n: any) => `AED ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
const today = () => new Date().toISOString().split('T')[0];

const fmtDate = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const monthLabel = (entry: any) => {
  const idx = parseInt(String(entry?.month ?? ''), 10) - 1;
  const name = idx >= 0 && idx < 12 ? MONTH_NAMES[idx] : String(entry?.month ?? '');
  return [name, entry?.year].filter(Boolean).join(' ').trim();
};

const statusStyle = (status: string) => {
  switch (String(status || '').toLowerCase()) {
    case 'paid': return { bg: ui.greenTint, color: ui.green, label: 'Paid' };
    case 'partial': return { bg: ui.amberTint, color: ui.amber, label: 'Partial' };
    default: return { bg: ui.grayTint, color: ui.muted, label: 'Pending' };
  }
};

const paymentMethods = [
  { key: 'cash', label: 'Cash' },
  { key: 'bank_transfer', label: 'Bank Transfer' },
  { key: 'cheque', label: 'Cheque' },
];

const PayrollDetailScreen = ({ route, navigation }: any) => {
  const passed = route.params?.entry;
  const id = route.params?.id || passed?._id;

  const [entry, setEntry] = useState<any>(passed || null);
  const [loading, setLoading] = useState(!passed);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [advanceOpen, setAdvanceOpen] = useState(false);
  const [advanceForm, setAdvanceForm] = useState({ amount: '', date: today(), note: '' });

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ amount: '', date: today(), method: 'cash', note: '' });

  // The server recalculates every total, so we always take its response as truth
  const fetchEntry = useCallback(async () => {
    if (!id) { setLoading(false); return; }
    try {
      const res = await payrollService.getById(id);
      const data = res.data?.data || res.data || null;
      if (data) setEntry(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, [id]);

  useEffect(() => { fetchEntry(); }, [fetchEntry]);
  useEffect(() => {
    const u = navigation?.addListener?.('focus', fetchEntry);
    return u;
  }, [navigation, fetchEntry]);

  if (loading && !entry) return <LoadingScreen />;
  if (!entry) return null;

  const advances: any[] = Array.isArray(entry.advances) ? entry.advances : [];
  const payments: any[] = Array.isArray(entry.payments) ? entry.payments : [];
  const balanceDue = Number(entry.balanceDue || 0);
  const settled = balanceDue <= 0;
  const s = statusStyle(entry.status);
  const overtimePay = Number(entry.overtimePay ?? (Number(entry.overtimeHours || 0) * Number(entry.overtimeRate || 0)));

  const saveAdvance = async () => {
    const amount = parseFloat(advanceForm.amount);
    if (!amount || amount <= 0) { notify('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      await payrollService.addAdvance(entry._id, {
        amount,
        date: advanceForm.date || today(),
        note: advanceForm.note.trim(),
      });
      setAdvanceOpen(false);
      setAdvanceForm({ amount: '', date: today(), note: '' });
      await fetchEntry();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to add advance');
    } finally { setSaving(false); }
  };

  const removeAdvance = (row: any) => {
    confirmThen('Delete advance', 'Remove this advance from the payslip?', async () => {
      try {
        await payrollService.deleteAdvance(entry._id, row._id);
        await fetchEntry();
      } catch { notify('Error', 'Failed to delete advance'); }
    });
  };

  const savePayment = async () => {
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) { notify('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      await payrollService.addPayment(entry._id, {
        amount,
        date: paymentForm.date || today(),
        method: paymentForm.method,
        note: paymentForm.note.trim(),
      });
      setPaymentOpen(false);
      setPaymentForm({ amount: '', date: today(), method: 'cash', note: '' });
      await fetchEntry();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to add payment');
    } finally { setSaving(false); }
  };

  const removePayment = (row: any) => {
    confirmThen('Delete payment', 'Remove this payment from the history?', async () => {
      try {
        await payrollService.deletePayment(entry._id, row._id);
        await fetchEntry();
      } catch { notify('Error', 'Failed to delete payment'); }
    });
  };

  const settleFull = () => {
    setAdvanceOpen(false);
    setPaymentForm({ amount: String(balanceDue), date: today(), method: 'cash', note: 'Full settlement' });
    setPaymentOpen(true);
  };

  const deletePayslip = () => {
    confirmThen('Delete payslip', 'Delete this payslip and all its advances and payments?', async () => {
      try {
        await payrollService.delete(entry._id);
        navigation.goBack();
      } catch { notify('Error', 'Failed to delete payslip'); }
    });
  };

  const breakdown = [
    { label: 'Base salary', value: money(entry.baseSalary) },
    {
      label: `Overtime · ${Number(entry.overtimeHours || 0)} h × ${money(entry.overtimeRate)}`,
      value: money(overtimePay),
    },
    { label: 'Bonuses', value: money(entry.bonuses) },
    { label: 'Deductions', value: `− ${money(entry.deductions)}`, color: ui.red },
    { label: 'Advances taken', value: `− ${money(entry.totalAdvances)}`, color: ui.orange },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchEntry(); }} />
      }
    >
      {/* Header */}
      <View style={styles.headerCard}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.driverName} numberOfLines={1}>{entry.driverName || 'Driver'}</Text>
            <Text style={styles.monthText}>{monthLabel(entry)}</Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: s.bg }]}>
            <Text style={[styles.statusText, { color: s.color }]}>{s.label}</Text>
          </View>
        </View>
        <Text style={styles.netLabel}>Net pay</Text>
        <Text style={styles.netValue}>{money(entry.netPay)}</Text>
      </View>

      {/* Payslip actions */}
      <View style={styles.actionRow}>
        <TouchableOpacity
          style={styles.ghostBtn}
          onPress={() => navigation.navigate('PayrollForm', { entry })}
          activeOpacity={0.8}
        >
          <Icon name="pencil-outline" size={16} color={ui.ink} />
          <Text style={styles.ghostBtnText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.dangerBtn} onPress={deletePayslip} activeOpacity={0.8}>
          <Icon name="delete-outline" size={16} color={ui.red} />
          <Text style={styles.dangerBtnText}>Delete</Text>
        </TouchableOpacity>
      </View>

      {/* Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardHeading}>Breakdown</Text>
        {breakdown.map((r, i) => (
          <View key={i} style={styles.breakRow}>
            <Text style={styles.breakLabel} numberOfLines={1}>{r.label}</Text>
            <Text style={[styles.breakValue, r.color ? { color: r.color } : null]}>{r.value}</Text>
          </View>
        ))}

        <View style={styles.divider} />
        <View style={styles.breakRow}>
          <Text style={styles.totalLabel}>Net Pay</Text>
          <Text style={styles.totalValue}>{money(entry.netPay)}</Text>
        </View>

        <View style={styles.breakRow}>
          <Text style={styles.breakLabel}>Paid</Text>
          <Text style={[styles.breakValue, { color: ui.green }]}>{money(entry.totalPaid)}</Text>
        </View>

        <View style={styles.divider} />
        <View style={styles.breakRow}>
          <Text style={styles.totalLabel}>Balance Due</Text>
          <Text style={[styles.totalValue, { color: settled ? ui.green : ui.red }]}>{money(balanceDue)}</Text>
        </View>
      </View>

      {!settled && (
        <TouchableOpacity style={styles.settleBtn} onPress={settleFull} activeOpacity={0.85}>
          <Icon name="check-decagram-outline" size={17} color="#FFFFFF" />
          <Text style={styles.settleText}>Settle full balance · {money(balanceDue)}</Text>
        </TouchableOpacity>
      )}

      {/* Advances */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Advances</Text>
        <TouchableOpacity
          style={styles.addLink}
          onPress={() => { setAdvanceOpen(o => !o); setPaymentOpen(false); }}
          activeOpacity={0.7}
        >
          <Icon name={advanceOpen ? 'close' : 'plus'} size={14} color={ui.purple} />
          <Text style={styles.addLinkText}>{advanceOpen ? 'Cancel' : 'Add advance'}</Text>
        </TouchableOpacity>
      </View>

      {advanceOpen && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New advance</Text>

          <Text style={styles.fieldLabel}>Amount (AED)</Text>
          <View style={styles.amountCard}>
            <Text style={styles.amountCurrency}>AED</Text>
            <TextInput
              style={styles.amountInput}
              value={advanceForm.amount}
              onChangeText={v => setAdvanceForm(p => ({ ...p, amount: v }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>

          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.fieldCard}>
            <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.fieldInput}
              value={advanceForm.date}
              onChangeText={v => setAdvanceForm(p => ({ ...p, date: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={ui.muted}
            />
          </View>

          <Text style={styles.fieldLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={advanceForm.note}
              onChangeText={v => setAdvanceForm(p => ({ ...p, note: v }))}
              placeholder="e.g. Cash before Eid"
              placeholderTextColor={ui.muted}
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setAdvanceOpen(false)} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={saveAdvance}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {advances.length === 0 ? (
        <Text style={styles.emptyLine}>No advances taken this month.</Text>
      ) : (
        advances.map((row: any) => (
          <View key={String(row._id)} style={styles.rowCard}>
            <View style={[styles.iconBox, { backgroundColor: ui.orangeTint }]}>
              <Icon name="cash-fast" size={18} color={ui.orange} />
            </View>
            <View style={styles.rowInfo}>
              <Text style={styles.rowTitle} numberOfLines={1}>{row.note || 'Advance'}</Text>
              <Text style={styles.rowSub}>{fmtDate(row.date)}</Text>
            </View>
            <Text style={[styles.rowAmount, { color: ui.orange }]}>− {money(row.amount)}</Text>
            <TouchableOpacity style={{ padding: 4 }} onPress={() => removeAdvance(row)}>
              <Icon name="delete-outline" size={17} color={ui.muted} />
            </TouchableOpacity>
          </View>
        ))
      )}

      {/* Payments */}
      <View style={styles.sectionHead}>
        <Text style={styles.sectionTitle}>Payment History</Text>
        <TouchableOpacity
          style={styles.addLink}
          onPress={() => { setPaymentOpen(o => !o); setAdvanceOpen(false); }}
          activeOpacity={0.7}
        >
          <Icon name={paymentOpen ? 'close' : 'plus'} size={14} color={ui.purple} />
          <Text style={styles.addLinkText}>{paymentOpen ? 'Cancel' : 'Add payment'}</Text>
        </TouchableOpacity>
      </View>

      {paymentOpen && (
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>New payment</Text>

          <Text style={styles.fieldLabel}>Amount (AED)</Text>
          <View style={styles.amountCard}>
            <Text style={styles.amountCurrency}>AED</Text>
            <TextInput
              style={styles.amountInput}
              value={paymentForm.amount}
              onChangeText={v => setPaymentForm(p => ({ ...p, amount: v }))}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>

          <Text style={styles.fieldLabel}>Method</Text>
          <View style={styles.methodRow}>
            {paymentMethods.map(m => {
              const active = paymentForm.method === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.methodChip, active && styles.methodChipActive]}
                  onPress={() => setPaymentForm(p => ({ ...p, method: m.key }))}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.methodText, active && styles.methodTextActive]}>{m.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.fieldLabel}>Date</Text>
          <View style={styles.fieldCard}>
            <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
            <TextInput
              style={styles.fieldInput}
              value={paymentForm.date}
              onChangeText={v => setPaymentForm(p => ({ ...p, date: v }))}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={ui.muted}
            />
          </View>

          <Text style={styles.fieldLabel}>Note <Text style={styles.optional}>(optional)</Text></Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={paymentForm.note}
              onChangeText={v => setPaymentForm(p => ({ ...p, note: v }))}
              placeholder="e.g. Paid at office"
              placeholderTextColor={ui.muted}
            />
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={() => setPaymentOpen(false)} activeOpacity={0.8}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.saveBtn, saving && { opacity: 0.7 }]}
              onPress={savePayment}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {payments.length === 0 ? (
        <Text style={styles.emptyLine}>Nothing paid yet.</Text>
      ) : (
        payments.map((row: any) => {
          const method = paymentMethods.find(m => m.key === row.method);
          const sub = [fmtDate(row.date), method?.label || row.method].filter(Boolean).join(' • ');
          return (
            <View key={String(row._id)} style={styles.rowCard}>
              <View style={[styles.iconBox, { backgroundColor: ui.greenTint }]}>
                <Icon name="cash-check" size={18} color={ui.green} />
              </View>
              <View style={styles.rowInfo}>
                <Text style={styles.rowTitle} numberOfLines={1}>{row.note || 'Payment'}</Text>
                <Text style={styles.rowSub} numberOfLines={1}>{sub}</Text>
              </View>
              <Text style={[styles.rowAmount, { color: ui.green }]}>{money(row.amount)}</Text>
              <TouchableOpacity style={{ padding: 4 }} onPress={() => removePayment(row)}>
                <Icon name="delete-outline" size={17} color={ui.muted} />
              </TouchableOpacity>
            </View>
          );
        })
      )}

      {!!entry.notes && (
        <View style={[styles.card, { marginTop: 16 }]}>
          <Text style={styles.cardHeading}>Notes</Text>
          <Text style={styles.notesText}>{entry.notes}</Text>
        </View>
      )}

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  scroll: { padding: 20, paddingTop: spacing.md },

  headerCard: { backgroundColor: ui.ink, borderRadius: 16, padding: 18 },
  headerTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  driverName: { fontSize: 18, fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: -0.3 },
  monthText: { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  netLabel: { fontSize: 11, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.55)', marginTop: 16 },
  netValue: { fontSize: 32, fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: -0.9, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 10, fontFamily: fonts.semiBold, textTransform: 'uppercase', letterSpacing: 0.5 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  ghostBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 12,
    borderWidth: 1, borderColor: ui.border,
  },
  ghostBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  dangerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: ui.redTint, borderRadius: 14, paddingVertical: 12,
  },
  dangerBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.red },

  card: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardHeading: {
    fontSize: 11, fontFamily: fonts.semiBold, color: ui.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 10,
  },
  breakRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 6 },
  breakLabel: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: ui.muted },
  breakValue: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  divider: { height: 1, backgroundColor: ui.hairline, marginVertical: 8 },
  totalLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  totalValue: { fontSize: 18, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.4 },
  notesText: { fontSize: 13, fontFamily: fonts.regular, color: ui.ink, lineHeight: 19 },

  settleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 12, backgroundColor: ui.purple, borderRadius: 16, padding: 14,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  settleText: { fontSize: 14, fontFamily: fonts.bold, color: '#FFFFFF' },

  sectionHead: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 24, marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 12, fontFamily: fonts.semiBold, color: ui.muted,
    textTransform: 'uppercase', letterSpacing: 0.7,
  },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 2 },
  addLinkText: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.purple },
  emptyLine: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, paddingVertical: 6 },

  rowCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  iconBox: { width: 38, height: 38, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  rowInfo: { flex: 1 },
  rowTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  rowSub: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  rowAmount: { fontSize: 14, fontFamily: fonts.bold },

  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  formTitle: { fontSize: 15, fontFamily: fonts.bold, color: ui.ink },
  fieldLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginTop: 14, marginBottom: 8 },
  optional: { fontFamily: fonts.regular, color: ui.muted },
  fieldCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  fieldInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.regular, color: ui.ink, padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.3)',
  },
  amountCurrency: { fontSize: 15, fontFamily: fonts.medium, color: ui.muted, marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 28, fontFamily: fonts.bold, color: ui.ink, padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  methodRow: { flexDirection: 'row', gap: 8 },
  methodChip: {
    flex: 1, minHeight: 38, justifyContent: 'center', alignItems: 'center',
    paddingVertical: 9, paddingHorizontal: 8, borderRadius: 99,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  methodChipActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  methodText: { fontSize: 12, fontFamily: fonts.medium, color: ui.ink },
  methodTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  formActions: { flexDirection: 'row', gap: 8, marginTop: 18 },
  cancelBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  cancelBtnText: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.muted },
  saveBtn: {
    flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    backgroundColor: ui.purple,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  saveText: { fontSize: 14, fontFamily: fonts.bold, color: '#FFFFFF' },
});

export default PayrollDetailScreen;
