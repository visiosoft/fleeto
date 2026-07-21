import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { driverService } from '../../services/driverService';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const DriverFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.driver;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    name: existing?.name || '',
    phone: existing?.phone || '',
    email: existing?.email || '',
    licenseNumber: existing?.licenseNumber || '',
    licenseExpiry: existing?.licenseExpiry || '',
    address: existing?.address || '',
    emergencyContact: existing?.emergencyContact || '',
    dateOfBirth: existing?.dateOfBirth || '',
    joinDate: existing?.joinDate || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const update = (f: string) => (v: string) => setForm(p => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    if (!form.name.trim()) { Alert.alert('Error', 'Name is required'); return; }
    setLoading(true);
    try {
      if (isEdit) await driverService.update(existing._id, form);
      else await driverService.create(form);
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save');
    } finally { setLoading(false); }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormInput label="Full Name" value={form.name} onChangeText={update('name')} placeholder="Driver's full name" required />
      <FormInput label="Phone" value={form.phone} onChangeText={update('phone')} placeholder="Phone number" keyboardType="phone-pad" />
      <FormInput label="Email" value={form.email} onChangeText={update('email')} placeholder="Email address" keyboardType="email-address" autoCapitalize="none" />
      <FormInput label="License Number" value={form.licenseNumber} onChangeText={update('licenseNumber')} placeholder="Driver's license number" />
      <FormInput label="License Expiry" value={form.licenseExpiry} onChangeText={update('licenseExpiry')} placeholder="YYYY-MM-DD" />
      <FormInput label="Address" value={form.address} onChangeText={update('address')} placeholder="Home address" multiline />
      <FormInput label="Emergency Contact" value={form.emergencyContact} onChangeText={update('emergencyContact')} placeholder="Emergency contact info" />
      <FormInput label="Date of Birth" value={form.dateOfBirth} onChangeText={update('dateOfBirth')} placeholder="YYYY-MM-DD" />
      <FormInput label="Join Date" value={form.joinDate} onChangeText={update('joinDate')} placeholder="YYYY-MM-DD" />
      <FormInput label="Notes" value={form.notes} onChangeText={update('notes')} placeholder="Additional notes" multiline numberOfLines={3} />

      <TouchableOpacity style={[styles.btn, loading && { opacity: 0.7 }]} onPress={handleSubmit} disabled={loading}>
        <Text style={styles.btnText}>{loading ? 'Saving...' : isEdit ? 'Update Driver' : 'Add Driver'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  btn: { backgroundColor: colors.primary, borderRadius: borderRadius.md, paddingVertical: spacing.md - 2, alignItems: 'center', marginTop: spacing.md, ...shadows.md },
  btnText: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default DriverFormScreen;
