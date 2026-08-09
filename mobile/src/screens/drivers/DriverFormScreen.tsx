import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { driverService } from '../../services/driverService';
import FormInput from '../../components/common/FormInput';
import { fonts, spacing } from '../../config/theme';
import { ui } from '../../config/ui';

const notify = (title: string, msg: string) => {
  if (Platform.OS === 'web') (window as any).alert(`${title}: ${msg}`);
  else Alert.alert(title, msg);
};

const statuses = ['Active', 'Inactive', 'On Leave'];

// The API stores names split and contact details nested, so an existing record
// has to be flattened back into the form's shape.
const splitName = (existing: any) => {
  if (existing?.firstName || existing?.lastName) {
    return { firstName: existing.firstName || '', lastName: existing.lastName || '' };
  }
  const parts = String(existing?.name || '').trim().split(/\s+/);
  return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || '' };
};

const DriverFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.driver;
  const isEdit = !!existing;
  const initialName = splitName(existing);

  const [form, setForm] = useState({
    firstName: initialName.firstName,
    lastName: initialName.lastName,
    licenseNumber: existing?.licenseNumber || '',
    licenseExpiry: existing?.licenseExpiry ? String(existing.licenseExpiry).split('T')[0] : '',
    phone: existing?.contact?.phone || existing?.phone || '',
    email: existing?.contact?.email || existing?.email || '',
    address: existing?.contact?.address || existing?.address || '',
    status: existing?.status || 'Active',
    employeeId: existing?.employeeId || '',
    hireDate: existing?.hireDate ? String(existing.hireDate).split('T')[0] : '',
    emergencyName: existing?.emergencyContact?.name || '',
    emergencyPhone: existing?.emergencyContact?.phone || '',
    salary: existing?.salary != null ? String(existing.salary) : '',
    overtimeRate: existing?.overtimeRate != null ? String(existing.overtimeRate) : '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);
  const [picker, setPicker] = useState<null | 'licenseExpiry' | 'hireDate'>(null);

  const update = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    if (!form.firstName.trim()) { notify('Error', 'First name is required'); return; }
    if (!form.lastName.trim()) { notify('Error', 'Last name is required'); return; }
    if (!form.licenseNumber.trim()) { notify('Error', 'License number is required'); return; }

    setLoading(true);
    try {
      // Shape the payload the way the API validates and stores it
      const payload: any = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        name: `${form.firstName.trim()} ${form.lastName.trim()}`.trim(),
        licenseNumber: form.licenseNumber.trim(),
        status: form.status,
        contact: {
          phone: form.phone.trim(),
          email: form.email.trim(),
          address: form.address.trim(),
        },
        // Kept flat as well so older screens reading driver.phone still work
        phone: form.phone.trim(),
        email: form.email.trim(),
        notes: form.notes,
      };
      if (form.salary.trim()) payload.salary = parseFloat(form.salary) || 0;
      if (form.overtimeRate.trim()) payload.overtimeRate = parseFloat(form.overtimeRate) || 0;
      if (form.licenseExpiry) payload.licenseExpiry = form.licenseExpiry;
      if (form.hireDate) payload.hireDate = form.hireDate;
      if (form.employeeId.trim()) payload.employeeId = form.employeeId.trim();
      if (form.emergencyName.trim() || form.emergencyPhone.trim()) {
        payload.emergencyContact = { name: form.emergencyName.trim(), phone: form.emergencyPhone.trim() };
      }

      if (isEdit) await driverService.update(existing._id, payload);
      else await driverService.create(payload);
      navigation.goBack();
    } catch (err: any) {
      // Surface the API's real reason instead of a generic message
      const data = err.response?.data;
      const msg = data?.errors?.join('\n') || data?.message || err.message || 'Failed to save driver';
      notify('Could not save', msg);
    } finally { setLoading(false); }
  };

  const dateRow = (field: 'licenseExpiry' | 'hireDate', label: string) => (
    <>
      <Text style={styles.label}>{label}</Text>
      {Platform.OS === 'web' ? (
        <View style={styles.dateCard}>
          <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
          <FormInput
            label=""
            value={form[field]}
            onChangeText={update(field)}
            placeholder="YYYY-MM-DD"
            containerStyle={{ flex: 1, marginBottom: 0 }}
          />
        </View>
      ) : (
        <TouchableOpacity style={styles.dateCard} onPress={() => setPicker(field)} activeOpacity={0.8}>
          <Icon name="calendar-outline" size={16} color={ui.purple} style={{ marginRight: 10 }} />
          <Text style={[styles.dateText, !form[field] && { color: ui.muted }]}>
            {form[field]
              ? new Date(form[field]).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
              : 'Select date'}
          </Text>
          <Icon name="chevron-down" size={20} color={ui.muted} />
        </TouchableOpacity>
      )}
    </>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormInput label="First Name" value={form.firstName} onChangeText={update('firstName')} placeholder="e.g. Mohammad" required />
      <FormInput label="Last Name" value={form.lastName} onChangeText={update('lastName')} placeholder="e.g. Salim" required />
      <FormInput label="License Number" value={form.licenseNumber} onChangeText={update('licenseNumber')} placeholder="Driving licence number" required />

      {dateRow('licenseExpiry', 'License Expiry')}

      <Text style={styles.label}>Status</Text>
      <View style={styles.statusRow}>
        {statuses.map(s => {
          const active = form.status === s;
          return (
            <TouchableOpacity
              key={s}
              style={[styles.statusPill, active && styles.statusPillActive]}
              onPress={() => setForm(p => ({ ...p, status: s }))}
            >
              <Text style={[styles.statusText, active && styles.statusTextActive]}>{s}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <FormInput label="Phone" value={form.phone} onChangeText={update('phone')} placeholder="Phone number" keyboardType="phone-pad" />
      <FormInput label="Email" value={form.email} onChangeText={update('email')} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      <FormInput label="Address" value={form.address} onChangeText={update('address')} placeholder="Home address" multiline />
      <FormInput label="Employee ID" value={form.employeeId} onChangeText={update('employeeId')} placeholder="Optional staff number" />
      <FormInput label="Monthly Salary (AED)" value={form.salary} onChangeText={update('salary')} placeholder="e.g. 3000" keyboardType="numeric" />
      <FormInput label="Overtime Rate (AED / hour)" value={form.overtimeRate} onChangeText={update('overtimeRate')} placeholder="e.g. 15" keyboardType="numeric" />

      {dateRow('hireDate', 'Hire Date')}

      <FormInput label="Emergency Contact Name" value={form.emergencyName} onChangeText={update('emergencyName')} placeholder="Who to call" />
      <FormInput label="Emergency Contact Phone" value={form.emergencyPhone} onChangeText={update('emergencyPhone')} placeholder="Their phone number" keyboardType="phone-pad" />
      <FormInput label="Notes" value={form.notes} onChangeText={update('notes')} placeholder="Additional notes" multiline numberOfLines={3} />

      {picker && (
        <DateTimePicker
          value={form[picker] ? new Date(form[picker]) : new Date()}
          mode="date"
          display="default"
          onChange={(event, selected) => {
            const field = picker;
            setPicker(Platform.OS === 'ios' ? picker : null);
            if (event.type !== 'dismissed' && selected && field) {
              setForm(p => ({ ...p, [field]: selected.toISOString().split('T')[0] }));
              if (Platform.OS === 'ios') setPicker(null);
            }
          }}
        />
      )}

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Saving...' : isEdit ? 'Update Driver' : 'Add Driver'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { padding: 20 },
  label: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginBottom: 8 },
  dateCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#FFFFFF', borderRadius: 14, padding: 14, marginBottom: 16,
    borderWidth: 1, borderColor: ui.border,
  },
  dateText: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
  statusRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statusPill: {
    flex: 1, paddingVertical: 10, borderRadius: 99, alignItems: 'center',
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: ui.border,
  },
  statusPillActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  statusText: { fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  statusTextActive: { color: '#FFFFFF', fontFamily: fonts.semiBold },
  btn: {
    marginTop: 12, backgroundColor: ui.purple, borderRadius: 16,
    padding: 16, alignItems: 'center',
    shadowColor: '#5B2BC9', shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3, shadowRadius: 24, elevation: 6,
  },
  btnText: { color: '#FFFFFF', fontSize: 16, fontFamily: fonts.bold },
});

export default DriverFormScreen;
