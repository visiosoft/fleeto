import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { vehicleService } from '../../services/vehicleService';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const VehicleDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [vehicle, setVehicle] = useState<any>(route.params.vehicle || null);
  const [loading, setLoading] = useState(!route.params.vehicle);

  const fetchVehicle = async () => {
    try {
      const res = await vehicleService.getById(id);
      setVehicle(res.data?.data || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchVehicle(); }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Vehicle', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await vehicleService.delete(id); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!vehicle) return <LoadingScreen message="Vehicle not found" />;

  const infoRows = [
    { icon: 'card-text-outline', label: 'Plate Number', value: vehicle.plateNumber },
    { icon: 'car-outline', label: 'Make / Model', value: `${vehicle.make || ''} ${vehicle.model || ''}`.trim() },
    { icon: 'calendar-outline', label: 'Year', value: vehicle.year },
    { icon: 'palette-outline', label: 'Color', value: vehicle.color },
    { icon: 'gas-station-outline', label: 'Fuel Type', value: vehicle.fuelType },
    { icon: 'speedometer', label: 'Mileage', value: vehicle.currentMileage ? `${vehicle.currentMileage.toLocaleString()} km` : null },
    { icon: 'barcode', label: 'VIN', value: vehicle.vin },
    { icon: 'shield-outline', label: 'Insurance Expiry', value: vehicle.insuranceExpiry },
    { icon: 'file-certificate-outline', label: 'Registration Expiry', value: vehicle.registrationExpiry },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={fetchVehicle} />}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="van-utility" size={36} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>{vehicle.make} {vehicle.model}</Text>
        <Text style={styles.headerSub}>{vehicle.plateNumber}</Text>
        {vehicle.status && <StatusBadge status={vehicle.status} />}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('VehicleForm', { vehicle })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Vehicle Information</Text>
        {infoRows.map((row, i) => (
          <View key={i} style={[styles.infoRow, i < infoRows.length - 1 && styles.border]}>
            <View style={styles.infoLeft}>
              <Icon name={row.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>{row.label}</Text>
            </View>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </Card>

      {vehicle.notes && (
        <Card style={{ marginHorizontal: spacing.md }}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.notes}>{vehicle.notes}</Text>
        </Card>
      )}
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
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  headerTitle: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  headerSub: { fontSize: fontSize.md, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.sm },
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
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  infoLeft: { flexDirection: 'row', alignItems: 'center' },
  infoLabel: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  infoValue: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text, maxWidth: '50%', textAlign: 'right' },
  notes: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, lineHeight: 22 },
});

export default VehicleDetailScreen;
