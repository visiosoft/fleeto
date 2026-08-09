import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity,
  TextInput, Alert, Platform, ScrollView,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { staffAccountService } from '../../services/otherServices';
import { vehicleService } from '../../services/vehicleService';
import { costService } from '../../services/financeService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
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

const today = () => new Date().toISOString().split('T')[0];

const fmtDate = (d: any) => {
  const date = new Date(d);
  if (isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const money = (n: any) => `AED ${Number(n || 0).toLocaleString()}`;

type TxType = 'advance' | 'expense' | 'return';

const txStyles: Record<TxType, { icon: string; color: string; tint: string; label: string; sign: string }> = {
  advance: { icon: 'arrow-down-bold-circle-outline', color: ui.green, tint: ui.greenTint, label: 'Money given', sign: '+' },
  expense: { icon: 'cart-outline', color: ui.orange, tint: ui.orangeTint, label: 'Expense', sign: '−' },
  return: { icon: 'arrow-up-bold-circle-outline', color: ui.blue, tint: ui.blueTint, label: 'Money returned', sign: '−' },
};

const formTitles: Record<TxType, string> = {
  advance: 'Give Money',
  expense: 'Add Expense',
  return: 'Return Money',
};

const balanceColor = (b: number) => (b > 0 ? ui.green : b < 0 ? ui.red : ui.muted);

const StaffAccountsScreen = ({ navigation }: any) => {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // list mode
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPerson, setNewPerson] = useState({ name: '', role: '', phone: '', notes: '' });

  // detail mode
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailRefreshing, setDetailRefreshing] = useState(false);
  const [txType, setTxType] = useState<TxType | null>(null);
  const [txForm, setTxForm] = useState({ amount: '', description: '', date: today(), vehicleId: '' });
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [vehicleOpen, setVehicleOpen] = useState(false);

  const vehicleLabel = (v: any) => {
    const plate = v?.licensePlate || v?.plateNumber || '';
    const name = [v?.make, v?.model].filter((p: any) => p && p !== 'Unknown').join(' ');
    if (plate && name) return `${plate} — ${name}`;
    return plate || name || 'Vehicle';
  };

  useEffect(() => {
    vehicleService.getAll()
      .then((res) => {
        const data = res.data?.data || res.data || [];
        setVehicles(Array.isArray(data) ? data : []);
      })
      .catch(() => {});
  }, []);

  const fetchPeople = useCallback(async () => {
    try {
      const res = await staffAccountService.getAll();
      const data = res.data?.data || res.data || [];
      setPeople(Array.isArray(data) ? data : []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  const fetchDetail = useCallback(async (id: string) => {
    try {
      const res = await staffAccountService.getById(id);
      const data = res.data?.data || res.data || null;
      setDetail(data);
    } catch (err) { console.error(err); }
    finally { setDetailLoading(false); setDetailRefreshing(false); }
  }, []);

  useEffect(() => { fetchPeople(); }, [fetchPeople]);

  useEffect(() => {
    const u = navigation?.addListener?.('focus', () => {
      fetchPeople();
      if (selectedId) fetchDetail(selectedId);
    });
    return u;
  }, [navigation, fetchPeople, fetchDetail, selectedId]);

  const openPerson = (id: string) => {
    setSelectedId(id);
    setDetail(null);
    setTxType(null);
    setDetailLoading(true);
    fetchDetail(id);
  };

  const closePerson = () => {
    setSelectedId(null);
    setDetail(null);
    setTxType(null);
  };

  const totalWithStaff = useMemo(
    () => people.reduce((s: number, p: any) => s + Number(p.balance || 0), 0),
    [people],
  );

  const addPerson = async () => {
    if (!newPerson.name.trim()) { notify('Error', 'Name is required'); return; }
    setSaving(true);
    try {
      await staffAccountService.create({
        name: newPerson.name.trim(),
        role: newPerson.role.trim(),
        phone: newPerson.phone.trim(),
        notes: newPerson.notes.trim(),
      });
      setNewPerson({ name: '', role: '', phone: '', notes: '' });
      setShowAdd(false);
      await fetchPeople();
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to add person');
    } finally { setSaving(false); }
  };

  const deletePerson = (person: any) => {
    confirmThen('Delete person', `Remove ${person?.name || 'this person'} and all their transactions?`, async () => {
      try {
        await staffAccountService.delete(person._id);
        closePerson();
        await fetchPeople();
      } catch { notify('Error', 'Failed to delete person'); }
    });
  };

  const openTxForm = (type: TxType) => {
    setTxType(type);
    setVehicleOpen(false);
    setTxForm({ amount: '', description: '', date: today(), vehicleId: '' });
  };

  const saveTransaction = async () => {
    if (!txType || !selectedId) return;
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0) { notify('Error', 'Enter a valid amount'); return; }
    setSaving(true);
    try {
      const selectedVehicle = vehicles.find((v: any) => v._id === txForm.vehicleId);
      const description = txForm.description.trim();

      await staffAccountService.addTransaction(selectedId, {
        type: txType,
        amount,
        description,
        date: txForm.date || today(),
        category: txType,
        vehicleId: txForm.vehicleId || null,
      });

      // An expense tied to a vehicle is also recorded on the Expenses page
      if (txType === 'expense' && selectedVehicle) {
        try {
          await costService.create({
            vehicleId: selectedVehicle._id,
            expenseType: 'other',
            category: 'other',
            amount,
            date: txForm.date || today(),
            description: description || `Purchase by ${detail?.name || 'staff'}`,
            notes: `Paid by ${detail?.name || 'staff member'} from company cash`,
            paymentMethod: 'cash',
          });
        } catch (e) {
          console.log('Could not mirror expense to Expenses page:', e);
          notify('Saved', 'Recorded against the staff account, but it could not be added to the Expenses page.');
        }
      }

      setTxType(null);
      setVehicleOpen(false);
      setTxForm({ amount: '', description: '', date: today(), vehicleId: '' });
      await Promise.all([fetchDetail(selectedId), fetchPeople()]);
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Failed to save transaction');
    } finally { setSaving(false); }
  };

  const deleteTransaction = (tx: any) => {
    if (!selectedId) return;
    confirmThen('Delete entry', 'Remove this transaction?', async () => {
      try {
        await staffAccountService.deleteTransaction(selectedId, tx._id);
        await Promise.all([fetchDetail(selectedId), fetchPeople()]);
      } catch { notify('Error', 'Failed to delete transaction'); }
    });
  };

  if (loading) return <LoadingScreen />;

  // ---------------------------------------------------------------- DETAIL --
  if (selectedId) {
    if (detailLoading && !detail) return <LoadingScreen />;

    const person = detail || people.find((p: any) => String(p._id) === String(selectedId)) || {};
    const balance = Number(person.balance || 0);
    const transactions: any[] = Array.isArray(detail?.transactions)
      ? [...detail.transactions].sort((a, b) =>
          new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime())
      : [];

    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={closePerson} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="chevron-left" size={26} color={ui.ink} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.title} numberOfLines={1}>{person.name || 'Staff member'}</Text>
            {!!(person.role || person.phone) && (
              <Text style={styles.headerSub} numberOfLines={1}>
                {[person.role, person.phone].filter(Boolean).join(' • ')}
              </Text>
            )}
          </View>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePerson(person)}>
            <Icon name="delete-outline" size={18} color={ui.red} />
          </TouchableOpacity>
        </View>

        <FlatList
          data={transactions}
          keyExtractor={(item: any) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={detailRefreshing}
              onRefresh={() => { setDetailRefreshing(true); fetchDetail(selectedId); fetchPeople(); }}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Balance bar */}
              <View style={styles.balanceBar}>
                <Text style={styles.balanceBarLabel} numberOfLines={1}>
                  Balance left with {person.name || 'staff'}
                </Text>
                <Text style={styles.balanceBarValue}>{money(balance)}</Text>
              </View>

              {/* Stats */}
              <View style={styles.statRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Advanced</Text>
                  <Text style={[styles.statValue, { color: ui.purple }]}>{money(person.advanced)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Spent</Text>
                  <Text style={[styles.statValue, { color: ui.orange }]}>{money(person.spent)}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Balance</Text>
                  <Text style={[styles.statValue, { color: balance < 0 ? ui.red : ui.green }]}>{money(balance)}</Text>
                </View>
              </View>

              {/* Actions */}
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnPrimary, txType === 'advance' && styles.actionBtnPrimaryActive]}
                  onPress={() => (txType === 'advance' ? setTxType(null) : openTxForm('advance'))}
                  activeOpacity={0.85}
                >
                  <Icon name="plus-circle-outline" size={17} color="#FFFFFF" />
                  <Text style={styles.actionBtnPrimaryText}>Give Money</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.actionBtnGhost, txType === 'expense' && styles.actionBtnGhostActive]}
                  onPress={() => (txType === 'expense' ? setTxType(null) : openTxForm('expense'))}
                  activeOpacity={0.85}
                >
                  <Icon name="cart-outline" size={17} color={ui.ink} />
                  <Text style={styles.actionBtnGhostText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.returnBtn}
                onPress={() => (txType === 'return' ? setTxType(null) : openTxForm('return'))}
                activeOpacity={0.7}
              >
                <Icon name="arrow-up-bold-circle-outline" size={15} color={ui.blue} />
                <Text style={styles.returnBtnText}>Return Money</Text>
              </TouchableOpacity>

              {/* Inline transaction form */}
              {txType && (
                <View style={styles.formCard}>
                  <Text style={styles.formTitle}>{formTitles[txType]}</Text>

                  <Text style={styles.fieldLabel}>Amount (AED)</Text>
                  <View style={styles.amountCard}>
                    <Text style={styles.amountCurrency}>AED</Text>
                    <TextInput
                      style={styles.amountInput}
                      value={txForm.amount}
                      onChangeText={v => setTxForm(p => ({ ...p, amount: v }))}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor={ui.muted}
                    />
                  </View>

                  <Text style={styles.fieldLabel}>Description</Text>
                  <View style={styles.fieldCard}>
                    <TextInput
                      style={styles.fieldInput}
                      value={txForm.description}
                      onChangeText={v => setTxForm(p => ({ ...p, description: v }))}
                      placeholder={txType === 'expense' ? 'e.g. Spare parts from Al Quoz' : 'e.g. Cash handover'}
                      placeholderTextColor={ui.muted}
                    />
                  </View>

                  {/* Vehicle is optional; picking one also files it under Expenses */}
                  {txType === 'expense' && (
                    <>
                      <Text style={styles.fieldLabel}>
                        Vehicle <Text style={{ fontFamily: fonts.regular, color: ui.muted }}>(optional)</Text>
                      </Text>
                      <TouchableOpacity
                        style={styles.fieldCard}
                        onPress={() => setVehicleOpen(o => !o)}
                        activeOpacity={0.8}
                      >
                        <Icon name="van-utility" size={16} color={ui.purple} style={{ marginRight: 10 }} />
                        <Text style={[styles.fieldInput, !txForm.vehicleId && { color: ui.muted }]} numberOfLines={1}>
                          {txForm.vehicleId
                            ? vehicleLabel(vehicles.find((v: any) => v._id === txForm.vehicleId))
                            : 'No vehicle'}
                        </Text>
                        <Icon name={vehicleOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
                      </TouchableOpacity>
                      {vehicleOpen && (
                        <View style={styles.vehicleDropdown}>
                          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
                            <TouchableOpacity
                              style={styles.vehicleItem}
                              onPress={() => { setTxForm(p => ({ ...p, vehicleId: '' })); setVehicleOpen(false); }}
                            >
                              <Text style={[styles.vehicleItemText, { color: ui.muted }]}>No vehicle</Text>
                            </TouchableOpacity>
                            {vehicles.map((v: any, i: number) => (
                              <TouchableOpacity
                                key={v._id}
                                style={[styles.vehicleItem, i === vehicles.length - 1 && { borderBottomWidth: 0 }]}
                                onPress={() => { setTxForm(p => ({ ...p, vehicleId: v._id })); setVehicleOpen(false); }}
                              >
                                <Text style={[styles.vehicleItemText, txForm.vehicleId === v._id && { color: ui.purple, fontFamily: fonts.semiBold }]}>
                                  {vehicleLabel(v)}
                                </Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {!!txForm.vehicleId && (
                        <Text style={styles.mirrorHint}>
                          This purchase will also appear on the Expenses page for this vehicle.
                        </Text>
                      )}
                    </>
                  )}

                  <Text style={styles.fieldLabel}>Date</Text>
                  <View style={styles.fieldCard}>
                    <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
                    <TextInput
                      style={styles.fieldInput}
                      value={txForm.date}
                      onChangeText={v => setTxForm(p => ({ ...p, date: v }))}
                      placeholder="YYYY-MM-DD"
                      placeholderTextColor={ui.muted}
                    />
                  </View>

                  <View style={styles.formActions}>
                    <TouchableOpacity style={styles.cancelBtn} onPress={() => setTxType(null)} activeOpacity={0.8}>
                      <Text style={styles.cancelBtnText}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.saveBtn, saving && { opacity: 0.7 }]}
                      onPress={saveTransaction}
                      disabled={saving}
                      activeOpacity={0.85}
                    >
                      <Text style={styles.saveText}>{saving ? 'Saving...' : 'Save'}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <Text style={styles.sectionHeader}>History</Text>
            </View>
          }
          ListEmptyComponent={<EmptyState icon="cash-clock" title="No transactions yet" subtitle="Give money or record an expense to get started." />}
          renderItem={({ item }) => {
            const type: TxType = (['advance', 'expense', 'return'].includes(item.type) ? item.type : 'expense') as TxType;
            const s = txStyles[type];
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.7}
                onLongPress={() => deleteTransaction(item)}
              >
                <View style={[styles.iconBox, { backgroundColor: s.tint }]}>
                  <Icon name={s.icon as any} size={19} color={s.color} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.description || s.label}</Text>
                  <Text style={styles.cardSub} numberOfLines={1}>{fmtDate(item.date || item.createdAt)}</Text>
                </View>
                <Text style={[styles.txAmount, { color: s.color }]}>
                  {s.sign}{Number(item.amount || 0).toLocaleString()}
                </Text>
                <TouchableOpacity style={{ padding: 4 }} onPress={() => deleteTransaction(item)}>
                  <Icon name="delete-outline" size={17} color={ui.muted} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    );
  }

  // ------------------------------------------------------------------ LIST --
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Staff Accounts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowAdd(s => !s)}>
          <Icon name={showAdd ? 'close' : 'plus'} size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {showAdd ? (
        <ScrollView contentContainerStyle={styles.formScroll} keyboardShouldPersistTaps="handled">
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>New person</Text>

            <Text style={styles.fieldLabel}>Name</Text>
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.fieldInput}
                value={newPerson.name}
                onChangeText={v => setNewPerson(p => ({ ...p, name: v }))}
                placeholder="e.g. Ahmed Khan"
                placeholderTextColor={ui.muted}
              />
            </View>

            <Text style={styles.fieldLabel}>Role</Text>
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.fieldInput}
                value={newPerson.role}
                onChangeText={v => setNewPerson(p => ({ ...p, role: v }))}
                placeholder="e.g. Maintenance Manager"
                placeholderTextColor={ui.muted}
              />
            </View>

            <Text style={styles.fieldLabel}>Phone</Text>
            <View style={styles.fieldCard}>
              <TextInput
                style={styles.fieldInput}
                value={newPerson.phone}
                onChangeText={v => setNewPerson(p => ({ ...p, phone: v }))}
                placeholder="05X XXX XXXX"
                placeholderTextColor={ui.muted}
                keyboardType="phone-pad"
              />
            </View>

            <Text style={styles.fieldLabel}>Notes <Text style={styles.optional}>(optional)</Text></Text>
            <View style={[styles.fieldCard, { alignItems: 'flex-start' }]}>
              <TextInput
                style={[styles.fieldInput, { minHeight: 50, textAlignVertical: 'top' }]}
                value={newPerson.notes}
                onChangeText={v => setNewPerson(p => ({ ...p, notes: v }))}
                placeholder="Anything worth remembering"
                placeholderTextColor={ui.muted}
                multiline
              />
            </View>

            <TouchableOpacity
              style={[styles.submitBtn, saving && { opacity: 0.7 }]}
              onPress={addPerson}
              disabled={saving}
              activeOpacity={0.85}
            >
              <Icon name="account-plus-outline" size={18} color="#FFFFFF" />
              <Text style={styles.submitText}>{saving ? 'Adding...' : 'Add Person'}</Text>
            </TouchableOpacity>
          </View>
          <View style={{ height: spacing.xxl }} />
        </ScrollView>
      ) : (
        <FlatList
          data={people}
          keyExtractor={(item: any) => String(item._id)}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchPeople(); }} />}
          ListHeaderComponent={
            <View style={styles.summaryCard}>
              <Text style={styles.summaryLabel}>Total cash with staff</Text>
              <Text style={styles.summaryValue}>{money(totalWithStaff)}</Text>
            </View>
          }
          ListEmptyComponent={
            <EmptyState
              icon="account-cash-outline"
              title="No staff accounts yet"
              subtitle="Track cash handed to your team and what they spend it on."
              actionLabel="Add Person"
              onAction={() => setShowAdd(true)}
            />
          }
          renderItem={({ item }) => {
            const balance = Number(item.balance || 0);
            const sub = [item.role, item.phone].filter(Boolean).join(' • ');
            return (
              <TouchableOpacity style={styles.card} activeOpacity={0.7} onPress={() => openPerson(item._id)}>
                <View style={[styles.iconBox, { backgroundColor: ui.lilac }]}>
                  <Icon name="account-outline" size={20} color={ui.purple} />
                </View>
                <View style={styles.info}>
                  <Text style={styles.cardTitle} numberOfLines={1}>{item.name || 'Staff member'}</Text>
                  {!!sub && <Text style={styles.cardSub} numberOfLines={1}>{sub}</Text>}
                </View>
                <View style={styles.balanceSection}>
                  <Text style={[styles.balanceValue, { color: balanceColor(balance) }]}>
                    {Number(balance).toLocaleString()}
                  </Text>
                  <Text style={styles.balanceHint}>with him</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8,
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  headerSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  backBtn: { marginLeft: -6, marginRight: 2 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  deleteBtn: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: ui.redTint,
    justifyContent: 'center', alignItems: 'center',
  },

  list: { paddingHorizontal: 20, paddingBottom: 80 },

  summaryCard: {
    backgroundColor: ui.ink, borderRadius: 14, padding: 18, marginBottom: 14,
  },
  summaryLabel: { fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  summaryValue: { fontSize: 30, fontFamily: fonts.bold, color: '#FFFFFF', letterSpacing: -0.8, marginTop: 4 },

  balanceBar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12,
    backgroundColor: ui.ink, borderRadius: 14, padding: 16, marginBottom: 12,
  },
  balanceBarLabel: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  balanceBarValue: { fontSize: 18, fontFamily: fonts.bold, color: '#FFFFFF' },

  statRow: { flexDirection: 'row', gap: 8 },
  statBox: {
    flex: 1, backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 10,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  statLabel: {
    fontSize: 10, fontFamily: fonts.semiBold, color: ui.muted,
    textTransform: 'uppercase', letterSpacing: 0.6,
  },
  statValue: { fontSize: 14, fontFamily: fonts.bold, marginTop: 5 },

  actionRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    borderRadius: 14, paddingVertical: 13,
  },
  actionBtnPrimary: {
    backgroundColor: ui.purple,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  actionBtnPrimaryActive: { opacity: 0.85 },
  actionBtnPrimaryText: { fontSize: 14, fontFamily: fonts.semiBold, color: '#FFFFFF' },
  actionBtnGhost: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border },
  actionBtnGhostActive: { borderColor: ui.purple },
  actionBtnGhostText: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  returnBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginTop: 8, paddingVertical: 11, borderRadius: 12,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.cardBorder,
  },
  returnBtnText: { fontSize: 13, fontFamily: fonts.medium, color: ui.blue },

  sectionHeader: {
    fontSize: 12, fontFamily: fonts.semiBold, color: ui.muted,
    textTransform: 'uppercase', letterSpacing: 0.7, marginTop: 20, marginBottom: 8,
  },

  formScroll: { padding: 20, paddingTop: 4 },
  formCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 16, marginTop: 14,
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
  vehicleDropdown: {
    backgroundColor: '#FFFFFF', borderRadius: 14, marginTop: 6,
    borderWidth: 1, borderColor: ui.border, overflow: 'hidden', maxHeight: 220,
  },
  vehicleItem: {
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border,
  },
  vehicleItemText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  mirrorHint: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 6 },
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
  submitBtn: {
    marginTop: 24, backgroundColor: ui.purple, borderRadius: 16,
    padding: 15, alignItems: 'center', justifyContent: 'center',
    flexDirection: 'row', gap: 8,
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  submitText: { color: '#FFFFFF', fontSize: 15, fontFamily: fonts.bold },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 8,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  iconBox: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  balanceSection: { alignItems: 'flex-end' },
  balanceValue: { fontSize: 18, fontFamily: fonts.bold, letterSpacing: -0.4 },
  balanceHint: { fontSize: 10, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  txAmount: { fontSize: 15, fontFamily: fonts.bold },
});

export default StaffAccountsScreen;
