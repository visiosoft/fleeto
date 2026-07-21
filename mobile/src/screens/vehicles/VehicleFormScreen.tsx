import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { vehicleService } from '../../services/vehicleService';
import FormInput from '../../components/common/FormInput';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const VehicleFormScreen = ({ route, navigation }: any) => {
  const existing = route.params?.vehicle;
  const isEdit = !!existing;

  const [form, setForm] = useState({
    plateNumber: existing?.plateNumber || '',
    make: existing?.make || '',
    model: existing?.model || '',
    year: existing?.year?.toString() || '',
    color: existing?.color || '',
    vin: existing?.vin || '',
    fuelType: existing?.fuelType || '',
    currentMileage: existing?.currentMileage?.toString() || '',
    insuranceExpiry: existing?.insuranceExpiry || '',
    registrationExpiry: existing?.registrationExpiry || '',
    notes: existing?.notes || '',
  });
  const [loading, setLoading] = useState(false);

  const update = (field: string) => (value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (!form.plateNumber.trim() || !form.make.trim()) {
      Alert.alert('Error', 'Plate Number and Make are required');
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...form,
        year: form.year ? parseInt(form.year) : undefined,
        currentMileage: form.currentMileage ? parseInt(form.currentMileage) : undefined,
      };
      if (isEdit) {
        await vehicleService.update(existing._id, payload);
      } else {
        await vehicleService.create(payload);
      }
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save vehicle');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <FormInput label="Plate Number" value={form.plateNumber} onChangeText={update('plateNumber')} placeholder="e.g. ABC 1234" required />
      <FormInput label="Make" value={form.make} onChangeText={update('make')} placeholder="e.g. Toyota" required />
      <FormInput label="Model" value={form.model} onChangeText={update('model')} placeholder="e.g. Hilux" />
      <FormInput label="Year" value={form.year} onChangeText={update('year')} placeholder="e.g. 2023" keyboardType="numeric" />
      <FormInput label="Color" value={form.color} onChangeText={update('color')} placeholder="e.g. White" />
      <FormInput label="VIN" value={form.vin} onChangeText={update('vin')} placeholder="Vehicle Identification Number" />
      <FormInput label="Fuel Type" value={form.fuelType} onChangeText={update('fuelType')} placeholder="e.g. Petrol, Diesel" />
      <FormInput label="Current Mileage (km)" value={form.currentMileage} onChangeText={update('currentMileage')} placeholder="e.g. 50000" keyboardType="numeric" />
      <FormInput label="Insurance Expiry" value={form.insuranceExpiry} onChangeText={update('insuranceExpiry')} placeholder="YYYY-MM-DD" />
      <FormInput label="Registration Expiry" value={form.registrationExpiry} onChangeText={update('registrationExpiry')} placeholder="YYYY-MM-DD" />
      <FormInput label="Notes" value={form.notes} onChangeText={update('notes')} placeholder="Additional notes" multiline numberOfLines={3} />

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.7 }]}
        onPress={handleSubmit}
        disabled={loading}
      >
        <Text style={styles.buttonText}>{loading ? 'Saving...' : isEdit ? 'Update Vehicle' : 'Add Vehicle'}</Text>
      </TouchableOpacity>
      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  button: {
    backgroundColor: colors.primary, borderRadius: borderRadius.md,
    paddingVertical: spacing.md - 2, alignItems: 'center',
    marginTop: spacing.md, ...shadows.md,
  },
  buttonText: { color: colors.white, fontSize: fontSize.lg, fontFamily: fonts.bold },
});

export default VehicleFormScreen;
