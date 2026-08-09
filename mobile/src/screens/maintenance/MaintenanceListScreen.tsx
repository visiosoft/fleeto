import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, TextInput, Platform, ScrollView, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { maintenanceService } from '../../services/otherServices';
import { costService } from '../../services/financeService';
import { vehicleService } from '../../services/vehicleService';
import { contractService } from '../../services/contractService';
import { syncMaintenanceReminders, cancelRemindersFor } from '../../services/maintenanceReminders';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const serviceTypes = [
  { key: 'Oil Change', icon: 'oil' },
  { key: 'Tyre Change', icon: 'car-tire-alert' },
  { key: 'Brake Service', icon: 'car-brake-alert' },
  { key: 'AC Service', icon: 'air-conditioner' },
  { key: 'Battery', icon: 'car-battery' },
  { key: 'Other', icon: 'wrench-outline' },
];

const recurrenceOptions = [
  { key: 'none', label: 'One-time' },
  { key: 'monthly', label: 'Monthly' },
  { key: 'yearly', label: 'Yearly' },
];

const fmt = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const daysUntil = (d: any) => Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);

const dueLabel = (d: any) => {
  const n = daysUntil(d);
  if (isNaN(n)) return '';
  if (n < 0) return `Overdue by ${Math.abs(n)} day${Math.abs(n) !== 1 ? 's' : ''}`;
  if (n === 0) return 'Due today';
  if (n === 1) return 'Due tomorrow';
  return `Due in ${n} days`;
};

const MaintenanceListScreen = ({ navigation }: any) => {
  const [records, setRecords] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const [tab, setTab] = useState<'Upcoming' | 'History' | 'Expenses'>('Upcoming');

  const [form, setForm] = useState({
    vehicleName: '', service: 'Oil Change',
    dueDate: new Date(),
    recurrence: 'monthly', remindDaysBefore: 3, notes: '',
  });

  const fetchData = useCallback(async () => {
    try {
      const [mRes, eRes, vRes, cRes] = await Promise.all([
        maintenanceService.getAll(),
        costService.getAll().catch(() => null),
        vehicleService.getAll().catch(() => null),
        contractService.getAll().catch(() => null),
      ]);
      const cData = cRes?.data?.data || cRes?.data || [];
      setContracts(Array.isArray(cData) ? cData : []);
      const mData = mRes.data?.data || mRes.data || [];
      const list = Array.isArray(mData) ? mData : [];
      setRecords(list);
      // Keep local reminders in sync with what is still open
      syncMaintenanceReminders(list);
      // Any expense marked as maintenance shows up here too
      const eData = eRes?.data?.data || eRes?.data || [];
      setExpenses(Array.isArray(eData)
        ? eData.filter((e: any) => (e.expenseType || e.category || '').toLowerCase() === 'maintenance')
        : []);
      const vData = vRes?.data?.data || vRes?.data || [];
      setVehicles(Array.isArray(vData) ? vData : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const u = navigation?.addListener?.('focus', fetchData); return u; }, [navigation, fetchData]);

  // Plate number plus the vehicle name, e.g. "DXB 12345 — Toyota HiAce"
  const vehicleLabel = (v: any) => {
    const plate = v?.licensePlate || v?.plateNumber || v?.vehicleNumber || '';
    const name = [v?.make, v?.model].filter((p: any) => p && p !== 'Unknown').join(' ') || v?.name || '';
    if (plate && name) return `${plate} — ${name}`;
    return plate || name || 'Vehicle';
  };

  const upcoming = useMemo(() =>
    records
      .filter((r: any) => ['Scheduled', 'Pending', 'In Progress'].includes(r.status))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()),
  [records]);

  const history = useMemo(() =>
    records
      .filter((r: any) => ['Completed', 'Cancelled'].includes(r.status))
      .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
  [records]);

  const expensesSorted = useMemo(() =>
    [...expenses].sort((a: any, b: any) =>
      new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime()),
  [expenses]);

  const expenseTotal = expenses.reduce((s: number, e: any) => s + (e.amount || 0), 0);

  const saveSchedule = async () => {
    if (!form.vehicleName) { notify('Error', 'Please select a vehicle'); return; }
    setSaving(true);
    try {
      await maintenanceService.create({
        vehicleName: form.vehicleName,
        service: form.service,
        date: form.dueDate.toISOString(),
        status: 'Scheduled',
        recurrence: form.recurrence,
        remindDaysBefore: form.remindDaysBefore,
        notes: form.notes,
        mileage: 0,
        cost: 0,
      });
      setShowForm(false);
      setForm({ vehicleName: '', service: 'Oil Change', dueDate: new Date(), recurrence: 'monthly', remindDaysBefore: 3, notes: '' });
      fetchData();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to schedule maintenance');
    } finally { setSaving(false); }
  };

  const markDone = async (record: any) => {
    try {
      await maintenanceService.updateStatus(record._id, 'Completed');
      await cancelRemindersFor(record._id);
      await fetchData();
      if (record.recurrence && record.recurrence !== 'none') {
        notify('Scheduled', `Next ${String(record.service).toLowerCase()} auto-scheduled (${record.recurrence}).`);
      }
    } catch { notify('Error', 'Failed to update status'); }
  };

  // The client renting this vehicle, found through the active contract
  const clientForRecord = (record: any) => {
    const plate = String(record.vehicleName || '').split('—')[0].trim().toLowerCase();
    if (!plate) return null;
    const vehicle = vehicles.find((v: any) =>
      String(v.licensePlate || v.plateNumber || '').trim().toLowerCase() === plate);
    if (!vehicle) return null;
    const matches = contracts.filter((c: any) => String(c.vehicleId) === String(vehicle._id));
    return matches.find((c: any) => (c.status || '').toLowerCase() === 'active') || matches[0] || null;
  };

  const notifyClient = (record: any) => {
    const client = clientForRecord(record);
    const phone = String(client?.contactPhone || '').replace(/[^\d]/g, '');
    const msg = `Dear ${client?.contactPerson || client?.companyName || 'Customer'},\n\n`
      + `This is a reminder that the ${String(record.service).toLowerCase()} for vehicle ${record.vehicleName} `
      + `is due on ${fmt(record.date)}.\n\n`
      + `Please contact the company to arrange it, or bring the vehicle to our garage at your convenience.\n\n`
      + `Thank you,\nEfficient Move`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => notify('WhatsApp', 'Could not open WhatsApp.'));
  };

  const deleteRecord = (id: string) => {
    const doDelete = async () => {
      try { await maintenanceService.delete(id); fetchData(); }
      catch { notify('Error', 'Failed to delete'); }
    };
    if (Platform.OS === 'web') { if ((window as any).confirm('Delete this record?')) doDelete(); }
    else Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: doDelete },
    ]);
  };

  if (loading) return <LoadingScreen />;

  const tabs: Array<'Upcoming' | 'History' | 'Expenses'> = ['Upcoming', 'History', 'Expenses'];
  const listData = tab === 'Upcoming' ? upcoming : tab === 'History' ? history : expensesSorted;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Maintenance</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowForm(s => !s)}>
          <Icon name={showForm ? 'close' : 'plus'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showForm ? (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <Text style={styles.sectionLabel}>Vehicle</Text>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setVehicleOpen(o => !o)} activeOpacity={0.8}>
            <View style={styles.selectorIconBox}>
              <Icon name="van-utility" size={16} color={ui.purple} />
            </View>
            <Text style={[styles.selectorText, !form.vehicleName && { color: ui.muted }]}>
              {form.vehicleName || 'Select vehicle...'}
            </Text>
            <Icon name={vehicleOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
          </TouchableOpacity>
          {vehicleOpen && (
            <View style={styles.dropdown}>
              <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                {vehicles.map((v: any, i: number) => (
                  <TouchableOpacity
                    key={v._id}
                    style={[styles.dropdownItem, i === vehicles.length - 1 && { borderBottomWidth: 0 }]}
                    onPress={() => { setForm(p => ({ ...p, vehicleName: vehicleLabel(v) })); setVehicleOpen(false); }}
                  >
                    <Text style={[styles.dropdownText, form.vehicleName === vehicleLabel(v) && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                      {vehicleLabel(v)}
                    </Text>
                  </TouchableOpacity>
                ))}
                {vehicles.length === 0 && <Text style={[styles.dropdownItem, styles.dropdownText, { color: ui.muted }]}>No vehicles found</Text>}
              </ScrollView>
              <Text style={styles.dropdownCount}>{vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</Text>
            </View>
          )}

          <Text style={styles.sectionLabel}>Service</Text>
          <View style={styles.serviceGrid}>
            {serviceTypes.map(s => {
              const active = form.service === s.key;
              return (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.serviceCard, active && styles.serviceCardActive]}
                  onPress={() => setForm(p => ({ ...p, service: s.key }))}
                  activeOpacity={0.8}
                >
                  <Icon name={s.icon as any} size={19} color={active ? '#FFFFFF' : ui.muted} />
                  <Text style={[styles.serviceLabel, active && styles.serviceLabelActive]}>{s.key}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.sectionLabel}>Due Date</Text>
          {Platform.OS === 'web' ? (
            <View style={styles.fieldCard}>
              <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
              <TextInput
                style={styles.fieldInput}
                value={form.dueDate.toISOString().split('T')[0]}
                onChangeText={v => {
                  const d = new Date(v);
                  if (!isNaN(d.getTime())) setForm(p => ({ ...p, dueDate: d }));
                }}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={ui.muted}
              />
            </View>
          ) : (
            <>
              <TouchableOpacity style={styles.fieldCard} onPress={() => setShowPicker(true)} activeOpacity={0.8}>
                <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
                <Text style={styles.fieldValue}>
                  {form.dueDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                </Text>
                <Icon name="chevron-down" size={20} color={ui.muted} />
              </TouchableOpacity>
              {showPicker && (
                <DateTimePicker
                  value={form.dueDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event, selected) => {
                    setShowPicker(Platform.OS === 'ios');
                    if (event.type !== 'dismissed' && selected) {
                      setForm(p => ({ ...p, dueDate: selected }));
                    }
                  }}
                />
              )}
            </>
          )}

          <Text style={styles.sectionLabel}>Remind me before</Text>
          <View style={styles.recurrenceRow}>
            {[1, 3, 7].map(d => {
              const active = form.remindDaysBefore === d;
              return (
                <TouchableOpacity
                  key={d}
                  style={[styles.recurrencePill, active && styles.recurrencePillActive]}
                  onPress={() => setForm(p => ({ ...p, remindDaysBefore: d }))}
                >
                  <Text style={[styles.recurrenceText, active && styles.recurrenceTextActive]}>
                    {d} day{d !== 1 ? 's' : ''}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.recurrenceHint}>
            You'll be reminded {form.remindDaysBefore} days before, on the due date, then daily until you mark it done.
          </Text>

          <Text style={styles.sectionLabel}>Repeat</Text>
          <View style={styles.recurrenceRow}>
            {recurrenceOptions.map(r => {
              const active = form.recurrence === r.key;
              return (
                <TouchableOpacity
                  key={r.key}
                  style={[styles.recurrencePill, active && styles.recurrencePillActive]}
                  onPress={() => setForm(p => ({ ...p, recurrence: r.key }))}
                >
                  <Text style={[styles.recurrenceText, active && styles.recurrenceTextActive]}>{r.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <Text style={styles.recurrenceHint}>
            {form.recurrence === 'none'
              ? 'A single reminder on the due date.'
              : `When marked done, the next ${form.recurrence} ${String(form.service).toLowerCase()} is scheduled automatically.`}
          </Text>

          <Text style={styles.sectionLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
          <View style={[styles.fieldCard, { alignItems: 'flex-start' }]}>
            <TextInput
              style={[styles.fieldInput, { minHeight: 50, textAlignVertical: 'top' }]}
              value={form.notes}
              onChangeText={v => setForm(p => ({ ...p, notes: v }))}
              placeholder="e.g. Use synthetic oil 5W-30"
              placeholderTextColor={ui.muted}
              multiline
            />
          </View>

          <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={saveSchedule} disabled={saving}>
            <Icon name="calendar-check-outline" size={18} color="#FFFFFF" />
            <Text style={styles.saveText}>{saving ? 'Scheduling...' : 'Schedule Maintenance'}</Text>
          </TouchableOpacity>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      ) : (
        <>
          {/* Tabs */}
          <View style={styles.segmentWrap}>
            {tabs.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.segment, tab === t && styles.segmentActive]}
                onPress={() => setTab(t)}
              >
                <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
                  {t}{t === 'Upcoming' && upcoming.length > 0 ? ` (${upcoming.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {tab === 'Expenses' && (
            <View style={styles.expenseTotalCard}>
              <Text style={styles.expenseTotalLabel}>Total maintenance spend</Text>
              <Text style={styles.expenseTotalValue}>AED {expenseTotal.toLocaleString()}</Text>
            </View>
          )}

          <FlatList
            data={listData}
            keyExtractor={(item: any) => item._id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
            ListEmptyComponent={
              tab === 'Upcoming'
                ? <EmptyState icon="calendar-check-outline" title="Nothing scheduled" actionLabel="Schedule Maintenance" onAction={() => setShowForm(true)} />
                : tab === 'History'
                  ? <EmptyState icon="history" title="No completed maintenance yet" />
                  : <EmptyState icon="cash-remove" title="No maintenance expenses" />
            }
            renderItem={({ item }) => {
              if (tab === 'Expenses') {
                return (
                  <TouchableOpacity
                    style={styles.card}
                    onPress={() => navigation.navigate('CostDetail', { id: item._id, cost: item })}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconBox, { backgroundColor: ui.blueTint }]}>
                      <Icon name="wrench-outline" size={19} color={ui.blue} />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.description || 'Maintenance expense'}</Text>
                      <Text style={styles.cardSub} numberOfLines={1}>{fmt(item.date || item.createdAt)}</Text>
                    </View>
                    <Text style={styles.expAmount}>AED {(item.amount || 0).toLocaleString()}</Text>
                  </TouchableOpacity>
                );
              }
              const overdue = tab === 'Upcoming' && daysUntil(item.date) < 0;
              const done = item.status === 'Completed';
              const client = tab === 'Upcoming' ? clientForRecord(item) : null;
              return (
                <View style={styles.cardWrap}>
                  <View style={styles.cardRow}>
                    <View style={[styles.iconBox, { backgroundColor: done ? ui.greenTint : overdue ? ui.redTint : ui.amberTint }]}>
                      <Icon
                        name={done ? 'check-circle-outline' : 'calendar-clock'}
                        size={19}
                        color={done ? ui.green : overdue ? ui.red : ui.amber}
                      />
                    </View>
                    <View style={styles.info}>
                      <Text style={styles.cardTitle} numberOfLines={1}>
                        {item.service} — {item.vehicleName}
                      </Text>
                      <Text style={[styles.cardSub, overdue && { color: ui.red, fontFamily: fonts.semiBold }]} numberOfLines={1}>
                        {tab === 'Upcoming' ? `${dueLabel(item.date)} • ${fmt(item.date)}` : `${item.status} • ${fmt(item.date)}`}
                        {item.recurrence && item.recurrence !== 'none' ? ` • ${item.recurrence}` : ''}
                      </Text>
                    </View>
                    {tab === 'Upcoming' ? (
                      <View style={styles.rowActions}>
                        <TouchableOpacity style={styles.doneBtn} onPress={() => markDone(item)}>
                          <Icon name="check" size={14} color="#FFFFFF" />
                          <Text style={styles.doneBtnText}>Done</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={{ padding: 4 }} onPress={() => deleteRecord(item._id)}>
                          <Icon name="delete-outline" size={17} color={ui.muted} />
                        </TouchableOpacity>
                      </View>
                    ) : (
                      <TouchableOpacity style={{ padding: 4 }} onPress={() => deleteRecord(item._id)}>
                        <Icon name="delete-outline" size={17} color={ui.muted} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Client contact + WhatsApp reminder */}
                  {tab === 'Upcoming' && (
                    <View style={styles.clientRow}>
                      <Icon name="account-outline" size={14} color={ui.muted} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.clientName} numberOfLines={1}>
                          {client ? (client.contactPerson || client.companyName) : 'No client on contract'}
                        </Text>
                        {!!client?.contactPhone && (
                          <Text style={styles.clientPhone} numberOfLines={1}>{client.contactPhone}</Text>
                        )}
                      </View>
                      {!!client?.contactPhone && (
                        <TouchableOpacity style={styles.callBtn} onPress={() => Linking.openURL(`tel:${client.contactPhone}`)}>
                          <Icon name="phone-outline" size={15} color={ui.purple} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.waBtn} onPress={() => notifyClient(item)}>
                        <Icon name="whatsapp" size={14} color="#FFFFFF" />
                        <Text style={styles.waBtnText}>Notify</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  segmentWrap: {
    flexDirection: 'row', marginHorizontal: 20, marginBottom: 12,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 4,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  segment: { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center' },
  segmentActive: { backgroundColor: ui.purple },
  segmentText: { fontSize: 13, fontFamily: fonts.medium, color: ui.muted },
  segmentTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  expenseTotalCard: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginHorizontal: 20, marginBottom: 12, backgroundColor: ui.ink,
    borderRadius: 14, padding: 16,
  },
  expenseTotalLabel: { fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  expenseTotalValue: { fontSize: 17, fontFamily: fonts.bold, color: '#FFFFFF' },
  list: { paddingHorizontal: 20, paddingBottom: 80 },
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardWrap: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  clientRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: ui.hairline,
  },
  clientName: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.ink },
  clientPhone: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  callBtn: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: ui.lilac,
    justifyContent: 'center', alignItems: 'center',
  },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: '#25D366', borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7,
  },
  waBtnText: { fontSize: 11, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  iconBox: { width: 42, height: 42, borderRadius: 11, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  expAmount: { fontSize: 14, fontFamily: fonts.bold, color: ui.ink },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  doneBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: ui.green, borderRadius: 99, paddingHorizontal: 12, paddingVertical: 7,
  },
  doneBtnText: { fontSize: 12, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  formScroll: { padding: 20, paddingTop: 4 },
  sectionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginBottom: 8, marginTop: 16 },
  optional: { fontFamily: fonts.regular, color: ui.muted },
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
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden', maxHeight: 280,
  },
  dropdownItem: { padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdownCount: {
    fontSize: 11, fontFamily: fonts.regular, color: ui.muted,
    paddingHorizontal: 12, paddingVertical: 7,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, backgroundColor: ui.bg,
  },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceCard: {
    width: '31%', flexGrow: 1, paddingVertical: 13, paddingHorizontal: 6,
    borderRadius: 14, alignItems: 'center', gap: 5,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  serviceCardActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  serviceLabel: { fontSize: 11, fontFamily: fonts.medium, color: ui.ink, textAlign: 'center' },
  serviceLabelActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  fieldCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  fieldInput: {
    flex: 1, fontSize: 14, fontFamily: fonts.regular, color: ui.ink, padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  fieldValue: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  recurrenceRow: { flexDirection: 'row', gap: 8 },
  recurrencePill: {
    flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  recurrencePillActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  recurrenceText: { fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  recurrenceTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  recurrenceHint: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 8 },
  saveBtn: {
    marginTop: 24, backgroundColor: ui.purple, borderRadius: 16,
    padding: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  saveText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },
});

export default MaintenanceListScreen;
