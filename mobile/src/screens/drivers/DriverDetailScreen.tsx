import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { driverService } from '../../services/driverService';
import Card from '../../components/common/Card';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const DriverDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [driver, setDriver] = useState<any>(route.params.driver || null);
  const [loading, setLoading] = useState(!route.params.driver);

  const fetchDriver = async () => {
    try {
      const res = await driverService.getById(id);
      setDriver(res.data?.data || res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDriver(); }, [id]);

  const handleDelete = () => {
    Alert.alert('Delete Driver', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try { await driverService.delete(id); navigation.goBack(); }
        catch { Alert.alert('Error', 'Failed to delete'); }
      }},
    ]);
  };

  if (loading) return <LoadingScreen />;
  if (!driver) return <LoadingScreen message="Driver not found" />;

  const infoRows = [
    { icon: 'phone-outline', label: 'Phone', value: driver.phone },
    { icon: 'email-outline', label: 'Email', value: driver.email },
    { icon: 'card-account-details-outline', label: 'License Number', value: driver.licenseNumber },
    { icon: 'calendar-clock-outline', label: 'License Expiry', value: driver.licenseExpiry },
    { icon: 'map-marker-outline', label: 'Address', value: driver.address },
    { icon: 'account-alert-outline', label: 'Emergency Contact', value: driver.emergencyContact },
    { icon: 'calendar-outline', label: 'Date of Birth', value: driver.dateOfBirth },
    { icon: 'briefcase-outline', label: 'Join Date', value: driver.joinDate },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={false} onRefresh={fetchDriver} />}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(driver.name || 'D')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{driver.name}</Text>
        {driver.phone && <Text style={styles.sub}>{driver.phone}</Text>}
        {driver.status && <StatusBadge status={driver.status} />}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('DriverForm', { driver })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>

      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Driver Information</Text>
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
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 32, fontFamily: fonts.bold, color: colors.white },
  name: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  sub: { fontSize: fontSize.md, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2, marginBottom: spacing.sm },
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
});

export default DriverDetailScreen;
