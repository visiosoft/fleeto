import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { contractService } from '../../services/contractService';
import { vehicleService } from '../../services/vehicleService';
import FormInput from '../../components/common/FormInput';
import DatePickerField from '../../components/common/DatePickerField';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import {
  RATE_UNITS, RateUnit, normaliseRateUnit, rateLabel,
  CONTRACT_TYPES, ContractType, normaliseContractType,
} from '../../utils/contractTerm';

const ContractFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.contract;
  const isEdit = !!existing;

  const [vehicles, setVehicles] = useState<any[]>([]);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);

  const [form, setForm] = useState({
    companyName: existing?.companyName || '',
    tradeLicenseNo: existing?.tradeLicenseNo || '',
    vehicleId: existing?.vehicleId || '',
    vehicleName: existing?.vehicleName || '',
    // Legacy contracts stored this as free text; infer the closest match
    contractType: normaliseContractType(existing?.contractType) as ContractType,
    startDate: existing?.startDate?.split('T')[0] || '',
    endDate: existing?.endDate?.split('T')[0] || '',
    amount: existing?.amount?.toString() || '',
    rateUnit: normaliseRateUnit(existing?.rateUnit) as RateUnit,
    securityDeposit: existing?.securityDeposit?.toString() || '',
    contactPerson: existing?.contactPerson || '',
    contactPhone: existing?.contactPhone || '',
    notes: existing?.notes || '',
  });
  // Extra contacts beyond the primary one above - e.g. the driver, a site
  // manager - so maintenance/invoice reminders can be sent to whoever
  // actually needs them.
  const [contacts, setContacts] = useState<Array<{ name: string; phone: string; role: string }>>(
    Array.isArray(existing?.contacts) ? existing.contacts.map((c: any) => ({ name: c.name || '', phone: c.phone || '', role: c.role || '' })) : []
  );
  const [loading, setLoading] = useState(false);
  const u = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const addContact = () => setContacts(p => [...p, { name: '', phone: '', role: '' }]);
  const removeContact = (i: number) => setContacts(p => p.filter((_, idx) => idx !== i));
  const updateContact = (i: number, field: 'name' | 'phone' | 'role', v: string) =>
    setContacts(p => p.map((c, idx) => (idx === i ? { ...c, [field]: v } : c)));

  useEffect(() => {
    vehicleService.getAll().then((res: any) => {
      setVehicles(res.data?.data || res.data || []);
    }).catch(() => { });
  }, []);

  const vehicleLabel = (v: any) => {
    const plate = v?.plateNumber || v?.licensePlate || '';
    const name = v?.name || v?.vehicleName || [v?.make, v?.model].filter(Boolean).join(' ') || '';
    return plate && name ? `${plate} - ${name}` : plate || name || 'Vehicle';
  };

  const selectedVehicle = vehicles.find(v => v._id === form.vehicleId);

  const selectVehicle = (v: any) => {
    const name = v.name || v.vehicleName || [v.make, v.model].filter(Boolean).join(' ') || '';
    setForm(p => ({ ...p, vehicleId: v._id, vehicleName: name || vehicleLabel(v) }));
    setShowVehiclePicker(false);
  };

  const submit = async () => {
    if (!form.companyName.trim()) { Alert.alert('Error', 'Company name is required'); return; }
    if (!form.tradeLicenseNo.trim()) { Alert.alert('Error', 'Trade license number is required'); return; }
    if (!form.startDate || !form.endDate) { Alert.alert('Error', 'Start and end dates are required'); return; }
    setLoading(true);
    try {
      const payload = {
        ...form,
        amount: form.amount ? parseFloat(form.amount) : 0,
        securityDeposit: form.securityDeposit ? parseFloat(form.securityDeposit) : 0,
        contacts: contacts.filter(c => c.name.trim() || c.phone.trim()),
      };
      let savedContract;
      if (isEdit) {
        const res = await contractService.update(existing._id, payload);
        savedContract = res.data?.data || res.data;
      } else {
        const res = await contractService.create(payload);
        savedContract = res.data?.data || res.data;
      }
      if (savedContract?._id && !isEdit) {
        navigation.replace('ContractDetail', { id: savedContract._id, contract: savedContract });
      } else {
        navigation.goBack();
      }
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Failed to save';
      Alert.alert('Error', msg);
    }
    finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.c} contentContainerStyle={styles.p} keyboardShouldPersistTaps="handled">
      <FormInput label="Company Name" value={form.companyName} onChangeText={u('companyName')} placeholder="Client company name" required />
      <FormInput label="Trade License No." value={form.tradeLicenseNo} onChangeText={u('tradeLicenseNo')} placeholder="e.g. 123456" required />
      <FormInput label="Contact Person" value={form.contactPerson} onChangeText={u('contactPerson')} placeholder="Contact person name" />
      <FormInput label="Contact Phone" value={form.contactPhone} onChangeText={u('contactPhone')} placeholder="+971 XX XXX XXXX" keyboardType="phone-pad" />

      {/* Additional contacts (driver, site manager, etc.) - so maintenance
          and invoice reminders can be routed to whoever is relevant, not
          always the primary contact above. */}
      <View style={styles.contactsHeader}>
        <Text style={styles.label}>Additional Contacts</Text>
        <TouchableOpacity style={styles.addContactBtn} onPress={addContact}>
          <Icon name="plus" size={14} color={colors.primary} />
          <Text style={styles.addContactText}>Add Contact</Text>
        </TouchableOpacity>
      </View>
      {contacts.map((c, i) => (
        <View key={i} style={styles.contactCard}>
          <View style={styles.contactCardHeader}>
            <Text style={styles.contactCardTitle}>Contact {i + 1}</Text>
            <TouchableOpacity onPress={() => removeContact(i)}>
              <Icon name="close-circle-outline" size={20} color={colors.error || '#ef4444'} />
            </TouchableOpacity>
          </View>
          <FormInput label="Name" value={c.name} onChangeText={(v: string) => updateContact(i, 'name', v)} placeholder="e.g. Driver name" />
          <FormInput label="Phone" value={c.phone} onChangeText={(v: string) => updateContact(i, 'phone', v)} placeholder="+971 XX XXX XXXX" keyboardType="phone-pad" />
          <FormInput label="Role (optional)" value={c.role} onChangeText={(v: string) => updateContact(i, 'role', v)} placeholder="e.g. Driver, Manager" />
        </View>
      ))}

      {/* Vehicle Picker */}
      <Text style={styles.label}>Vehicle</Text>
      <TouchableOpacity style={styles.picker} onPress={() => setShowVehiclePicker(true)} activeOpacity={0.7}>
        <Icon name="car-outline" size={18} color={colors.primary} />
        <Text style={[styles.pickerText, !selectedVehicle && styles.pickerPlaceholder]}>
          {selectedVehicle ? vehicleLabel(selectedVehicle) : form.vehicleName || 'Select vehicle'}
        </Text>
        <Icon name="chevron-down" size={18} color={colors.textLight} />
      </TouchableOpacity>

      <Modal visible={showVehiclePicker} transparent animationType="slide" onRequestClose={() => setShowVehiclePicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle</Text>
              <TouchableOpacity onPress={() => setShowVehiclePicker(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={vehicles}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.modalItem} onPress={() => selectVehicle(item)}>
                  <Icon name="car" size={20} color={item._id === form.vehicleId ? colors.primary : colors.textLight} />
                  <Text style={[styles.modalItemText, item._id === form.vehicleId && { color: colors.primary, fontFamily: fonts.bold }]}>
                    {vehicleLabel(item)}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>No vehicles found</Text>}
            />
          </View>
        </View>
      </Modal>

      <View style={styles.dateRow}>
        <View style={{ flex: 1 }}>
          <DatePickerField label="Start Date" value={form.startDate} onChange={u('startDate')} placeholder="Select start date" />
        </View>
        <View style={{ width: spacing.sm }} />
        <View style={{ flex: 1 }}>
          <DatePickerField label="End Date" value={form.endDate} onChange={u('endDate')} placeholder="Select end date" />
        </View>
      </View>

      {/* Rate period - contracts are not always monthly */}
      <Text style={styles.label}>Billing Period</Text>
      <View style={styles.unitRow}>
        {RATE_UNITS.map((unit) => (
          <TouchableOpacity
            key={unit}
            style={[styles.unitBtn, form.rateUnit === unit && styles.unitBtnActive]}
            onPress={() => setForm(p => ({ ...p, rateUnit: unit }))}
          >
            <Text style={[styles.unitText, form.rateUnit === unit && styles.unitTextActive]}>
              Per {unit}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FormInput label={`${rateLabel(form.rateUnit)} (AED)`} value={form.amount} onChangeText={u('amount')} placeholder="0.00" keyboardType="numeric" />
      <FormInput label="Security Deposit (AED)" value={form.securityDeposit} onChangeText={u('securityDeposit')} placeholder="0.00" keyboardType="numeric" />

      {/* Contract type is the driver arrangement; the billing period above
          covers what this field used to be used for. */}
      <Text style={styles.label}>Contract Type</Text>
      <View style={styles.unitRow}>
        {CONTRACT_TYPES.map((type) => (
          <TouchableOpacity
            key={type}
            style={[styles.typeBtn, form.contractType === type && styles.unitBtnActive]}
            onPress={() => setForm(p => ({ ...p, contractType: type }))}
          >
            <Icon
              name={type === 'With Driver' ? 'account-tie' : 'steering'}
              size={16}
              color={form.contractType === type ? colors.white : colors.textSecondary}
            />
            <Text style={[styles.unitText, form.contractType === type && styles.unitTextActive]}>
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
  label: { fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.textSecondary, marginBottom: 6, textTransform: 'uppercase' },
  picker: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md, paddingVertical: 14,
    borderWidth: 1, borderColor: colors.divider, marginBottom: spacing.sm,
  },
  contactsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addContactBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 4, paddingHorizontal: 8 },
  addContactText: { fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.primary },
  contactCard: {
    backgroundColor: colors.surface, borderRadius: borderRadius.md,
    borderWidth: 1, borderColor: colors.divider, padding: spacing.sm, marginBottom: spacing.sm,
  },
  contactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  contactCardTitle: { fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.textSecondary, textTransform: 'uppercase' },
  pickerText: { flex: 1, fontSize: fontSize.sm, fontFamily: fonts.medium, color: colors.text },
  pickerPlaceholder: { color: colors.textLight },
  dateRow: { flexDirection: 'row', marginBottom: spacing.xs },
  unitRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  unitBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 11,
    borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.divider,
  },
  typeBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: borderRadius.md, backgroundColor: colors.surface,
    borderWidth: 1, borderColor: colors.divider,
  },
  unitBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  unitText: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: colors.textSecondary },
  unitTextActive: { color: colors.white, fontFamily: fonts.bold },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '60%', padding: spacing.md },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  modalTitle: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text },
  modalItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.divider },
  modalItemText: { fontSize: fontSize.sm, fontFamily: fonts.medium, color: colors.text },
  emptyText: { textAlign: 'center', padding: spacing.lg, color: colors.textLight, fontFamily: fonts.regular },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.md, ...shadows.md },
  btnT: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default ContractFormScreen;
