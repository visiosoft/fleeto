import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Platform,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { payrollService } from '../../services/financeService';
import { driverService } from '../../services/driverService';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const driverLabel = (d: any) =>
  d?.name || [d?.firstName, d?.lastName].filter(Boolean).join(' ') || 'Driver';

const money = (n: any) => `AED ${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

const num = (v: string) => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : n;
};

/** The last 12 months as { value: "YYYY-MM", label: "July 2026" } */
const buildMonths = () => {
  const out: Array<{ value: string; label: string }> = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    out.push({ value: `${d.getFullYear()}-${mm}`, label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}` });
  }
  return out;
};

const labelForMonthValue = (value: string) => {
  if (!value) return '';
  const [y, m] = value.split('-');
  const idx = parseInt(m, 10) - 1;
  return idx >= 0 && idx < 12 ? `${MONTH_NAMES[idx]} ${y}` : value;
};

const PayrollFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.entry;
  const isEdit = !!existing;

  const months = useMemo(buildMonths, []);

  const [drivers, setDrivers] = useState<any[]>([]);
  const [driverOpen, setDriverOpen] = useState(false);
  const [monthOpen, setMonthOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    driverId: existing?.driverId ? String(existing.driverId) : '',
    driverName: existing?.driverName || '',
    // The API wants "YYYY-MM"; rebuild it from the stored year + month
    month: existing?.month
      ? `${existing.year}-${String(existing.month).padStart(2, '0')}`
      : months[0].value,
    baseSalary: existing?.baseSalary != null ? String(existing.baseSalary) : '',
    overtimeHours: existing?.overtimeHours != null ? String(existing.overtimeHours) : '',
    overtimeRate: existing?.overtimeRate != null ? String(existing.overtimeRate) : '',
    bonuses: existing?.bonuses != null ? String(existing.bonuses) : '',
    deductions: existing?.deductions != null ? String(existing.deductions) : '',
    notes: existing?.notes || '',
  });

  useEffect(() => {
    driverService.getAll()
      .then(res => {
        const data = res.data?.data || res.data || [];
        setDrivers(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const set = (k: string) => (v: string) => setForm(p => ({ ...p, [k]: v }));

  const pickDriver = (d: any) => {
    setForm(p => ({
      ...p,
      driverId: String(d._id),
      driverName: driverLabel(d),
      // Prefill from the driver record where the numbers are known
      baseSalary: d.salary != null && d.salary !== '' ? String(d.salary) : p.baseSalary,
      overtimeRate: d.overtimeRate != null && d.overtimeRate !== '' ? String(d.overtimeRate) : p.overtimeRate,
    }));
    setDriverOpen(false);
  };

  // Hours the driver logged day by day, for the selected month
  const [loggedHours, setLoggedHours] = useState<number | null>(null);

  useEffect(() => {
    const [y, m] = (form.month || '').split('-');
    if (!form.driverId || !y || !m) { setLoggedHours(null); return; }
    let cancelled = false;
    driverService.getHours(form.driverId, { month: Number(m), year: Number(y) })
      .then((res) => {
        if (cancelled) return;
        const total = (res.data?.data || res.data || {}).totalHours;
        setLoggedHours(typeof total === 'number' ? total : null);
      })
      .catch(() => { if (!cancelled) setLoggedHours(null); });
    return () => { cancelled = true; };
  }, [form.driverId, form.month]);

  // Live totals — mirrors the server: net = base + OT + bonus − deductions − advances
  const base = num(form.baseSalary);
  const hours = num(form.overtimeHours);
  const rate = num(form.overtimeRate);
  const overtimePay = hours * rate;
  const bonuses = num(form.bonuses);
  const deductions = num(form.deductions);
  const advances = Number(existing?.totalAdvances || 0);
  const gross = base + overtimePay + bonuses;
  const netPay = gross - deductions - advances;

  const submit = async () => {
    if (!form.driverId && !form.driverName.trim()) { notify('Error', 'Please select a driver'); return; }
    if (!form.month) { notify('Error', 'Please select a month'); return; }
    if (!(base > 0)) { notify('Error', 'Base salary must be a positive number'); return; }

    setSaving(true);
    try {
      const payload = {
        driverId: form.driverId || undefined,
        driverName: form.driverName,
        month: form.month, // "YYYY-MM" — the model splits on the dash
        baseSalary: base,
        overtimeHours: hours,
        overtimeRate: rate,
        bonuses,
        deductions,
        notes: form.notes,
      };
      if (isEdit) await payrollService.update(existing._id, payload);
      else await payrollService.create(payload);
      navigation.goBack();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to save payslip');
    } finally { setSaving(false); }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scroll}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>{isEdit ? 'Edit Payslip' : 'New Payslip'}</Text>

      {/* Driver */}
      <Text style={styles.sectionLabel}>Driver</Text>
      <TouchableOpacity style={styles.selectorCard} onPress={() => { setDriverOpen(o => !o); setMonthOpen(false); }} activeOpacity={0.8}>
        <View style={styles.selectorIconBox}>
          <Icon name="account-outline" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !form.driverName && { color: ui.muted }]} numberOfLines={1}>
          {form.driverName || 'Select driver...'}
        </Text>
        <Icon name={driverOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
      </TouchableOpacity>
      {driverOpen && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
            {drivers.map((d: any, i: number) => (
              <TouchableOpacity
                key={String(d._id)}
                style={[styles.dropdownItem, i === drivers.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => pickDriver(d)}
              >
                <Text style={[styles.dropdownText, form.driverId === String(d._id) && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                  {driverLabel(d)}
                </Text>
              </TouchableOpacity>
            ))}
            {drivers.length === 0 && (
              <Text style={[styles.dropdownItem, styles.dropdownText, { color: ui.muted }]}>No drivers found</Text>
            )}
          </ScrollView>
          <Text style={styles.dropdownCount}>{drivers.length} driver{drivers.length !== 1 ? 's' : ''}</Text>
        </View>
      )}

      {/* Month */}
      <Text style={styles.sectionLabel}>Month</Text>
      <TouchableOpacity style={styles.selectorCard} onPress={() => { setMonthOpen(o => !o); setDriverOpen(false); }} activeOpacity={0.8}>
        <View style={styles.selectorIconBox}>
          <Icon name="calendar-month-outline" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !form.month && { color: ui.muted }]}>
          {labelForMonthValue(form.month) || 'Select month...'}
        </Text>
        <Icon name={monthOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
      </TouchableOpacity>
      {monthOpen && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
            {months.map((m, i) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.dropdownItem, i === months.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => { setForm(p => ({ ...p, month: m.value })); setMonthOpen(false); }}
              >
                <Text style={[styles.dropdownText, form.month === m.value && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                  {m.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Salary */}
      <Text style={styles.sectionLabel}>Base Salary (AED)</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amountCurrency}>AED</Text>
        <TextInput
          style={styles.amountInput}
          value={form.baseSalary}
          onChangeText={set('baseSalary')}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={ui.muted}
        />
      </View>

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>Overtime Hours</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={form.overtimeHours}
              onChangeText={set('overtimeHours')}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>Rate (AED/hour)</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={form.overtimeRate}
              onChangeText={set('overtimeRate')}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>
        </View>
      </View>

      {/* Pull the hours the driver logged day by day for this month */}
      {loggedHours !== null && loggedHours > 0 && String(loggedHours) !== form.overtimeHours && (
        <TouchableOpacity
          style={styles.loggedHoursBanner}
          onPress={() => setForm(p => ({ ...p, overtimeHours: String(loggedHours) }))}
          activeOpacity={0.8}
        >
          <Icon name="clock-check-outline" size={17} color={ui.purple} />
          <Text style={styles.loggedHoursText}>
            {loggedHours} hours logged this month — tap to use
          </Text>
          <Icon name="chevron-right" size={18} color={ui.purple} />
        </TouchableOpacity>
      )}

      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>Bonuses (AED)</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={form.bonuses}
              onChangeText={set('bonuses')}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.sectionLabel}>Deductions (AED)</Text>
          <View style={styles.fieldCard}>
            <TextInput
              style={styles.fieldInput}
              value={form.deductions}
              onChangeText={set('deductions')}
              keyboardType="numeric"
              placeholder="0"
              placeholderTextColor={ui.muted}
            />
          </View>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
      <View style={[styles.fieldCard, { alignItems: 'flex-start' }]}>
        <TextInput
          style={[styles.fieldInput, { minHeight: 50, textAlignVertical: 'top' }]}
          value={form.notes}
          onChangeText={set('notes')}
          placeholder="Anything worth noting on this payslip"
          placeholderTextColor={ui.muted}
          multiline
        />
      </View>

      {/* Live calculation */}
      <View style={styles.calcCard}>
        <Text style={styles.calcTitle}>Calculation</Text>

        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Base salary</Text>
          <Text style={styles.calcValue}>{money(base)}</Text>
        </View>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel} numberOfLines={1}>
            Overtime · {hours} h × {money(rate)}
          </Text>
          <Text style={styles.calcValue}>{money(overtimePay)}</Text>
        </View>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Bonuses</Text>
          <Text style={styles.calcValue}>{money(bonuses)}</Text>
        </View>
        <View style={styles.calcRow}>
          <Text style={styles.calcLabel}>Deductions</Text>
          <Text style={[styles.calcValue, { color: '#FCA5A5' }]}>− {money(deductions)}</Text>
        </View>
        {advances > 0 && (
          <View style={styles.calcRow}>
            <Text style={styles.calcLabel}>Advances taken</Text>
            <Text style={[styles.calcValue, { color: '#FDBA74' }]}>− {money(advances)}</Text>
          </View>
        )}

        <View style={styles.calcDivider} />
        <View style={styles.calcRow}>
          <Text style={styles.calcTotalLabel}>Net Pay</Text>
          <Text style={styles.calcTotalValue}>{money(netPay)}</Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.submitBtn, saving && { opacity: 0.7 }]}
        onPress={submit}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>
          {saving ? 'Saving...' : isEdit ? 'Update Payslip' : 'Save Payslip'}
        </Text>
      </TouchableOpacity>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  scroll: { padding: 20, paddingTop: spacing.md },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },

  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginBottom: 8, marginTop: 16 },
  optional: { fontFamily: fonts.regular, color: ui.muted },
  row: { flexDirection: 'row', gap: 10 },

  selectorCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  selectorIconBox: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: ui.lilacDark,
    alignItems: 'center', justifyContent: 'center', marginRight: 10,
  },
  selectorText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden', maxHeight: 260,
  },
  dropdownItem: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdownCount: {
    fontSize: 11, fontFamily: fonts.regular, color: ui.muted,
    paddingHorizontal: 12, paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, backgroundColor: ui.bg,
  },

  loggedHoursBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: ui.lilac, borderRadius: 12, padding: 12, marginTop: 12,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.2)',
  },
  loggedHoursText: { flex: 1, fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
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

  calcCard: { backgroundColor: ui.ink, borderRadius: 16, padding: 18, marginTop: 22 },
  calcTitle: {
    fontSize: 11, fontFamily: fonts.semiBold, color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 12,
  },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingVertical: 5 },
  calcLabel: { flex: 1, fontSize: 13, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)' },
  calcValue: { fontSize: 13, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  calcDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 10 },
  calcTotalLabel: { fontSize: 14, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  calcTotalValue: { fontSize: 22, fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: -0.5 },

  submitBtn: {
    marginTop: 28, backgroundColor: ui.purple, borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});

export default PayrollFormScreen;
