import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { costService } from '../../services/financeService';
import { vehicleService } from '../../services/vehicleService';
import { contractService } from '../../services/contractService';
import { staffAccountService } from '../../services/otherServices';
import { uploadService } from '../../services/uploadService';
import LoadingScreen from '../../components/common/LoadingScreen';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

// API enum: fuel, maintenance, insurance, registration, tires, repairs, salary,
// benefits, training, uniform, accommodation, food, office, administrative, marketing, other.
// UI categories map onto allowed values; the UI key is also sent as `category`.
const categories = [
  { key: 'fuel', value: 'fuel', label: 'Fuel', icon: 'gas-station-outline' },
  { key: 'salik', value: 'other', label: 'Salik', icon: 'road-variant', prefix: '[Salik]' },
  { key: 'maintenance', value: 'maintenance', label: 'Maintenance', icon: 'wrench-outline' },
  { key: 'parking', value: 'other', label: 'Parking', icon: 'parking', prefix: '[Parking]' },
  { key: 'fine', value: 'other', label: 'Fines', icon: 'map-marker-alert-outline', prefix: '[Fine]' },
  { key: 'other', value: 'other', label: 'Other', icon: 'dots-horizontal' },
];

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const CostFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.cost;
  const isEdit = !!existing;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [staffOpen, setStaffOpen] = useState(false);
  const [paidByStaffId, setPaidByStaffId] = useState(existing?.paidByStaffId || '');
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [vehicleOpen, setVehicleOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [receipts, setReceipts] = useState<{ uri: string; name: string }[]>([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [addingStaff, setAddingStaff] = useState(false);

  const initialCategory =
    categories.find(c => c.key === existing?.category)?.key ||
    categories.find(c => c.value === (existing?.expenseType || existing?.category))?.key ||
    'other';

  const [form, setForm] = useState({
    description: existing?.description || '',
    amount: existing?.amount?.toString() || '',
    category: initialCategory,
    date: existing?.date || new Date().toISOString().split('T')[0],
    vehicleId: existing?.vehicleId || '',
    contractId: existing?.contractId || '',
    driverId: existing?.driverId || '',
    paymentMethod: existing?.paymentMethod || 'cash',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [vRes, cRes, sRes] = await Promise.allSettled([
        vehicleService.getAll(),
        contractService.getAll(),
        staffAccountService.getAll(),
      ]);
      if (vRes.status === 'fulfilled') setVehicles(vRes.value.data?.data || vRes.value.data || []);
      if (cRes.status === 'fulfilled') setContracts(cRes.value.data?.data || cRes.value.data || []);
      if (sRes.status === 'fulfilled') setStaff(sRes.value.data?.data || sRes.value.data || []);
    } catch (err) { console.error(err); }
    finally { setLoadingVehicles(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const vehicleLabel = (v: any) => {
    const plate = v?.plateNumber || v?.licensePlate || '';
    const name = v?.name || v?.vehicleName || [v?.make, v?.model].filter(Boolean).join(' ') || '';
    if (plate && name) return `${plate} - ${name}`;
    return plate || name || 'Vehicle';
  };
  const contractLabel = (c: any) =>
    c?.contractNumber || c?.clientName || c?.name || c?.title || 'Contract';

  const selectedVehicle = vehicles.find((v: any) => v._id === form.vehicleId);
  const selectedContract = contracts.find((c: any) => c._id === form.contractId);
  const selectedStaff = staff.find((s: any) => s._id === paidByStaffId);
  const selectedCategory = categories.find(c => c.key === form.category) || categories[5];

  const pickReceipts = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        quality: 0.7,
      });
      if (!result.canceled && result.assets?.length) {
        const picked = result.assets.map((a, i) => ({ uri: a.uri, name: a.fileName || `receipt-${i + 1}.jpg` }));
        setReceipts(prev => [...prev, ...picked]);
      }
    } catch (e) {
      notify('Error', 'Could not open image picker');
    }
  };

  const takePhoto = async () => {
    try {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) { notify('Camera', 'Camera permission is required to take a photo.'); return; }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
      if (!result.canceled && result.assets?.[0]) {
        const a = result.assets[0];
        setReceipts(prev => [...prev, { uri: a.uri, name: a.fileName || `receipt-${Date.now()}.jpg` }]);
      }
    } catch (e) {
      notify('Error', 'Could not open the camera');
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        multiple: true,
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets?.length) {
        const picked = result.assets.map((a: any, i: number) => ({
          uri: a.uri,
          name: a.name || `document-${i + 1}.pdf`,
        }));
        setReceipts(prev => [...prev, ...picked]);
      }
    } catch (e) {
      notify('Error', 'Could not open the file picker');
    }
  };

  // Create a staff account without leaving the expense form
  const addStaffInline = async () => {
    const name = newStaffName.trim();
    if (!name) { notify('Error', 'Enter a name first'); return; }
    setAddingStaff(true);
    try {
      const res = await staffAccountService.create({ name });
      const created = res.data?.data || res.data;
      if (created?._id) {
        setStaff(prev => [...prev, created]);
        setPaidByStaffId(created._id);
      }
      setNewStaffName('');
      setStaffOpen(false);
    } catch (err: any) {
      notify('Error', err.response?.data?.message || 'Could not add person');
    } finally { setAddingStaff(false); }
  };

  const removeReceipt = (index: number) => {
    setReceipts(prev => prev.filter((_, i) => i !== index));
  };

  const submit = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { notify('Error', 'Valid amount is required'); return; }
    if (!form.vehicleId) { notify('Error', 'Please select a vehicle'); return; }

    // API requires a description; use notes if given, else derive from category.
    let description = form.notes.trim() || form.description.trim() || `${selectedCategory.label} expense`;
    if (selectedCategory.prefix && !description.startsWith(selectedCategory.prefix)) {
      description = `${selectedCategory.prefix} ${description}`;
    }

    setLoading(true);
    try {
      const uploadedUrls: string[] = [];
      if (receipts.length > 0) {
        const plate = selectedVehicle?.plateNumber || selectedVehicle?.licensePlate || 'unknown';
        const vName = selectedVehicle?.name || selectedVehicle?.vehicleName || [selectedVehicle?.make, selectedVehicle?.model].filter(Boolean).join(' ') || 'vehicle';
        for (const r of receipts) {
          try {
            const res = await uploadService.upload(r.uri, r.name, plate, vName);
            if (res.data?.fileUrl) uploadedUrls.push(res.data.fileUrl);
          } catch (upErr: any) {
            console.error('Upload failed for', r.name, upErr);
          }
        }
        if (uploadedUrls.length === 0 && receipts.length > 0) {
          notify('Upload', 'All receipt uploads failed — the expense will be saved without them.');
        }
      }

      const payload = {
        vehicleId: form.vehicleId,
        driverId: form.driverId,
        contractId: form.contractId || undefined,
        expenseType: selectedCategory.value,
        category: form.category,
        amount: parseFloat(form.amount),
        date: form.date,
        description,
        notes: selectedStaff ? `${form.notes ? form.notes + '\n' : ''}Paid by ${selectedStaff.name}` : form.notes,
        paidByStaffId: paidByStaffId || null,
        paidByStaffName: selectedStaff?.name || null,
        receiptUrl: uploadedUrls[0],
        receiptUrls: uploadedUrls.length > 0 ? uploadedUrls : undefined,
        paymentMethod: form.paymentMethod,
      };
      if (isEdit) await costService.update(existing._id, payload);
      else await costService.create(payload);

      // Paid from a staff member's cash float → deduct it from their balance.
      // Keyed off the id, not the looked-up object, so a slow staff list can't skip it.
      if (paidByStaffId && !isEdit) {
        const staffName = selectedStaff?.name || 'the staff member';
        try {
          const txRes = await staffAccountService.addTransaction(paidByStaffId, {
            type: 'expense',
            amount: parseFloat(form.amount),
            description,
            date: form.date,
            category: form.category,
            vehicleId: form.vehicleId || null,
          });
          const newBalance = txRes.data?.balance;
          notify(
            'Saved',
            newBalance !== undefined
              ? `Expense recorded. ${staffName} now has AED ${Number(newBalance).toLocaleString()} left.`
              : `Expense recorded against ${staffName}.`
          );
        } catch (staffErr: any) {
          console.log('Could not record against staff account:', staffErr?.response?.data || staffErr?.message);
          notify(
            'Partly saved',
            `The expense was saved, but it could not be deducted from ${staffName}'s balance: `
              + (staffErr?.response?.data?.message || staffErr?.message || 'request failed')
          );
        }
      }

      navigation.goBack();
    } catch (e: any) {
      const msg = e.response?.data?.message || e.response?.data?.errors?.join(', ') || e.message || 'Failed to save';
      notify('Error', msg);
    }
    finally { setLoading(false); }
  };

  if (loadingVehicles) return <LoadingScreen message="Loading..." />;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      {/* Category */}
      <Text style={styles.sectionLabel}>Category</Text>
      <View style={styles.categoryGrid}>
        {categories.map(c => {
          const active = form.category === c.key;
          return (
            <TouchableOpacity
              key={c.key}
              style={[styles.categoryCard, active && styles.categoryCardActive]}
              onPress={() => setForm(p => ({ ...p, category: c.key }))}
              activeOpacity={0.8}
            >
              <Icon name={c.icon as any} size={20} color={active ? '#FFFFFF' : ui.muted} />
              <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{c.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Amount */}
      <Text style={styles.sectionLabel}>Amount (AED)</Text>
      <View style={styles.amountCard}>
        <Text style={styles.amountCurrency}>AED</Text>
        <TextInput
          style={styles.amountInput}
          value={form.amount}
          onChangeText={v => setForm(p => ({ ...p, amount: v }))}
          keyboardType="numeric"
          placeholder="0"
          placeholderTextColor={ui.muted}
        />
      </View>

      {/* Vehicle */}
      <Text style={styles.sectionLabel}>Vehicle</Text>
      <TouchableOpacity
        style={styles.selectorCard}
        onPress={() => { setVehicleOpen(o => !o); setContractOpen(false); }}
        activeOpacity={0.8}
      >
        <View style={styles.selectorIconBox}>
          <Icon name="van-utility" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !selectedVehicle && { color: ui.muted }]}>
          {selectedVehicle ? vehicleLabel(selectedVehicle) : 'Select vehicle...'}
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
                onPress={() => { setForm(p => ({ ...p, vehicleId: v._id })); setVehicleOpen(false); }}
              >
                <Text style={[styles.dropdownText, form.vehicleId === v._id && styles.dropdownTextActive]}>
                  {vehicleLabel(v)}
                </Text>
              </TouchableOpacity>
            ))}
            {vehicles.length === 0 && <Text style={[styles.dropdownItem, styles.dropdownText, { color: ui.muted }]}>No vehicles found</Text>}
          </ScrollView>
        </View>
      )}

      {/* Date */}
      <Text style={styles.sectionLabel}>
        Date <Text style={styles.optional}>(defaults to today)</Text>
      </Text>
      {Platform.OS === 'web' ? (
        <View style={styles.selectorCard}>
          <View style={styles.selectorIconBox}>
            <Icon name="calendar-outline" size={16} color={ui.purple} />
          </View>
          <TextInput
            style={styles.selectorText}
            value={form.date}
            onChangeText={v => setForm(p => ({ ...p, date: v }))}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={ui.muted}
          />
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.selectorCard} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
            <View style={styles.selectorIconBox}>
              <Icon name="calendar-outline" size={16} color={ui.purple} />
            </View>
            <Text style={styles.selectorText}>
              {new Date(form.date).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
            </Text>
            <Icon name="chevron-down" size={20} color={ui.muted} />
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={new Date(form.date)}
              mode="date"
              display="default"
              maximumDate={new Date()}
              onChange={(event, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (event.type !== 'dismissed' && selected) {
                  setForm(p => ({ ...p, date: selected.toISOString().split('T')[0] }));
                }
              }}
            />
          )}
        </>
      )}

      {/* Paid by — deducts from that person's cash balance */}
      <Text style={styles.sectionLabel}>
        Paid by <Text style={styles.optional}>(optional)</Text>
      </Text>
      <TouchableOpacity
        style={styles.selectorCard}
        onPress={() => { setStaffOpen(o => !o); setVehicleOpen(false); setContractOpen(false); }}
        activeOpacity={0.8}
      >
        <View style={styles.selectorIconBox}>
          <Icon name="account-cash-outline" size={16} color={ui.purple} />
        </View>
        <Text style={[styles.selectorText, !selectedStaff && { color: ui.muted }]}>
          {selectedStaff ? selectedStaff.name : 'Company (not from staff cash)'}
        </Text>
        <Icon name={staffOpen ? 'chevron-up' : 'chevron-down'} size={20} color={ui.muted} />
      </TouchableOpacity>
      {staffOpen && (
        <View style={styles.dropdown}>
          <ScrollView nestedScrollEnabled showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => { setPaidByStaffId(''); setStaffOpen(false); }}
            >
              <Text style={[styles.dropdownText, { color: ui.muted }]}>Company (not from staff cash)</Text>
            </TouchableOpacity>
            {staff.map((s: any, i: number) => (
              <TouchableOpacity
                key={s._id}
                style={[styles.dropdownItem, i === staff.length - 1 && { borderBottomWidth: 0 }]}
                onPress={() => { setPaidByStaffId(s._id); setStaffOpen(false); }}
              >
                <Text style={[styles.dropdownText, paidByStaffId === s._id && styles.dropdownTextActive]}>
                  {s.name}{s.role ? ` — ${s.role}` : ''}
                </Text>
                <Text style={styles.dropdownSub}>Balance: AED {Number(s.balance || 0).toLocaleString()}</Text>
              </TouchableOpacity>
            ))}
            {staff.length === 0 && (
              <Text style={[styles.dropdownItem, styles.dropdownText, { color: ui.muted }]}>
                No staff accounts yet
              </Text>
            )}
            {/* Quick-add a person without leaving this form */}
            <View style={styles.addStaffRow}>
              <TextInput
                style={styles.addStaffInput}
                value={newStaffName}
                onChangeText={setNewStaffName}
                placeholder="Add new person..."
                placeholderTextColor={ui.muted}
                onSubmitEditing={addStaffInline}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addStaffBtn, (!newStaffName.trim() || addingStaff) && { opacity: 0.5 }]}
                onPress={addStaffInline}
                disabled={!newStaffName.trim() || addingStaff}
              >
                <Icon name={addingStaff ? 'progress-clock' : 'plus'} size={16} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      )}
      {!!selectedStaff && (
        <Text style={styles.staffHint}>
          AED {form.amount || 0} will be deducted from {selectedStaff.name}'s balance
          {' '}(currently AED {Number(selectedStaff.balance || 0).toLocaleString()}).
        </Text>
      )}

      {/* Receipt photos */}
      <Text style={styles.sectionLabel}>
        Receipts <Text style={styles.optional}>(optional)</Text>
      </Text>
      {receipts.length > 0 && (
        <View style={styles.receiptList}>
          {receipts.map((r, i) => (
            <View key={i} style={styles.receiptItem}>
              {/^.+\.pdf$/i.test(r.name) ? (
                <View style={styles.pdfThumb}>
                  <Icon name="file-pdf-box" size={24} color="#c0392b" />
                </View>
              ) : (
                <Image source={{ uri: r.uri }} style={styles.receiptThumb} />
              )}
              <Text style={styles.receiptItemName} numberOfLines={1}>{r.name}</Text>
              <TouchableOpacity onPress={() => removeReceipt(i)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Icon name="close-circle" size={20} color={ui.muted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
      <View style={styles.uploadOptions}>
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.uploadOption} onPress={takePhoto} activeOpacity={0.8}>
            <View style={styles.uploadOptionIcon}>
              <Icon name="camera-outline" size={20} color={ui.purple} />
            </View>
            <Text style={styles.uploadOptionText}>Camera</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={styles.uploadOption} onPress={pickReceipts} activeOpacity={0.8}>
          <View style={styles.uploadOptionIcon}>
            <Icon name="image-multiple-outline" size={20} color={ui.purple} />
          </View>
          <Text style={styles.uploadOptionText}>Gallery</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.uploadOption} onPress={pickDocument} activeOpacity={0.8}>
          <View style={styles.uploadOptionIcon}>
            <Icon name="file-pdf-box" size={20} color={ui.purple} />
          </View>
          <Text style={styles.uploadOptionText}>PDF / File</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.uploadHintRow}>
        {receipts.length > 0
          ? `${receipts.length} file${receipts.length !== 1 ? 's' : ''} attached`
          : 'Attach photos or PDF receipts — you can pick several'}
      </Text>

      {/* Notes */}
      <Text style={styles.sectionLabel}>
        Notes <Text style={styles.optional}>(optional)</Text>
      </Text>
      <View style={styles.notesCard}>
        <TextInput
          style={styles.notesInput}
          value={form.notes}
          onChangeText={v => setForm(p => ({ ...p, notes: v }))}
          placeholder="Full tank refill at ENOC Al Quoz"
          placeholderTextColor={ui.muted}
          multiline
        />
      </View>

      {/* Submit */}
      <TouchableOpacity
        style={[styles.submitBtn, loading && { opacity: 0.7 }]}
        onPress={submit}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.submitText}>
          {loading ? 'Saving...' : isEdit ? 'Update Expense' : 'Submit Expense'}
        </Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl * 2 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { padding: 20 },
  sectionLabel: {
    fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink,
    marginBottom: 10, marginTop: 20,
  },
  optional: { fontFamily: fonts.regular, color: ui.muted },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryCard: {
    width: '31%', flexGrow: 1,
    paddingVertical: 14, paddingHorizontal: 8,
    borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  categoryCardActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  categoryLabel: { fontSize: 12, fontFamily: fonts.medium, color: ui.ink },
  categoryLabelActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },

  amountCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: 'rgba(91,43,201,0.3)',
  },
  amountCurrency: { fontSize: 16, fontFamily: fonts.medium, color: ui.muted, marginRight: 8 },
  amountInput: {
    flex: 1, fontSize: 32, fontFamily: fonts.bold, color: ui.ink,
    padding: 0, ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

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
  dropdownItem: {
    padding: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: ui.border,
  },
  dropdownText: { fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  dropdownSub: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 2 },
  staffHint: { fontSize: 11, fontFamily: fonts.regular, color: ui.orange, marginTop: 8 },
  addStaffRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10,
    borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: ui.border, backgroundColor: ui.bg,
  },
  addStaffInput: {
    flex: 1, fontSize: 13, fontFamily: fonts.regular, color: ui.ink,
    backgroundColor: '#FFFFFF', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8,
    borderWidth: 1, borderColor: ui.border,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },
  addStaffBtn: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: ui.purple,
    alignItems: 'center', justifyContent: 'center',
  },
  dropdownTextActive: { color: ui.purple, fontFamily: fonts.semiBold },

  uploadOptions: { flexDirection: 'row', gap: 8 },
  uploadOption: {
    flex: 1, alignItems: 'center', gap: 6,
    backgroundColor: '#FFFFFF', borderRadius: 14, paddingVertical: 16,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(91,43,201,0.2)',
  },
  uploadOptionIcon: {
    width: 40, height: 40, borderRadius: 12, backgroundColor: ui.lilac,
    alignItems: 'center', justifyContent: 'center',
  },
  uploadOptionText: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
  uploadHintRow: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 8, textAlign: 'center' },
  uploadBox: {
    backgroundColor: '#FFFFFF', borderRadius: 18,
    borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(91,43,201,0.2)',
    padding: 28, alignItems: 'center',
  },
  uploadIconBox: {
    width: 48, height: 48, borderRadius: 14, backgroundColor: ui.lilac,
    alignItems: 'center', justifyContent: 'center', marginBottom: 10,
  },
  receiptThumb: { width: 48, height: 48, borderRadius: 10 },
  pdfThumb: {
    width: 48, height: 48, borderRadius: 10, backgroundColor: '#fdecea',
    alignItems: 'center', justifyContent: 'center',
  },
  receiptList: { marginBottom: 12, gap: 8 },
  receiptItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10,
    borderWidth: 1, borderColor: ui.border,
  },
  receiptItemName: { flex: 1, fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  uploadTitle: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.purple },
  uploadHint: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 4 },

  driveRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 10, paddingHorizontal: 4,
  },
  driveConnectedText: { flex: 1, fontSize: 12, fontFamily: fonts.medium, color: '#16a34a' },
  driveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginTop: 10, backgroundColor: '#1a73e8', borderRadius: 12, padding: 12,
  },
  driveBtnText: { fontSize: 13, fontFamily: fonts.semiBold, color: '#FFFFFF' },

  notesCard: {
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.border,
  },
  notesInput: {
    minHeight: 60, fontSize: 14, fontFamily: fonts.regular, color: ui.ink,
    textAlignVertical: 'top', padding: 0,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as any) : {}),
  },

  submitBtn: {
    marginTop: 28, backgroundColor: ui.purple, borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  submitText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});

export default CostFormScreen;
