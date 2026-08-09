import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform, Image, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { costService } from '../../services/financeService';
import { vehicleService } from '../../services/vehicleService';
import Card from '../../components/common/Card';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';
import { API_BASE_URL } from '../../config/api';

const CostDetailScreen = ({ route, navigation }: any) => {
  const { id } = route.params;
  const [cost, setCost] = useState<any>(route.params.cost || null);
  const [vehicleName, setVehicleName] = useState<string | null>(null);
  const [loading, setLoading] = useState(!route.params.cost);

  const fetchCost = async () => {
    try {
      const res = await costService.getById(id);
      setCost(res.data?.data || res.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!route.params.cost) fetchCost();
  }, []);

  useEffect(() => {
    const unsub = navigation.addListener('focus', () => {
      if (route.params.cost) fetchCost();
    });
    return unsub;
  }, [navigation]);

  useEffect(() => {
    if (!cost?.vehicleId) return;
    if (cost.vehicleName || cost.vehiclePlate) {
      setVehicleName(cost.vehicleName || cost.vehiclePlate);
      return;
    }
    vehicleService.getById(cost.vehicleId).then((res: any) => {
      const v = res.data?.data || res.data;
      if (v) {
        const plate = v.plateNumber || v.licensePlate || '';
        const name = v.name || v.vehicleName || [v.make, v.model].filter(Boolean).join(' ') || '';
        setVehicleName(plate && name ? `${plate} - ${name}` : plate || name || 'Vehicle');
      }
    }).catch(() => { });
  }, [cost]);

  const handleDelete = () => {
    const doDelete = async () => {
      try { await costService.delete(id); navigation.goBack(); }
      catch {
        if (Platform.OS === 'web') window.alert('Failed to delete');
        else Alert.alert('Error', 'Failed to delete');
      }
    };
    if (Platform.OS === 'web') {
      if (window.confirm('Delete this expense?')) doDelete();
    } else {
      Alert.alert('Delete Cost', 'Are you sure?', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: doDelete },
      ]);
    }
  };

  if (loading || !cost) return <LoadingScreen />;

  const rows = [
    { label: 'Description', value: cost.description },
    { label: 'Amount', value: cost.amount ? `AED ${cost.amount.toLocaleString()}` : null },
    { label: 'Category', value: cost.category },
    { label: 'Date', value: cost.date },
    { label: 'Payment Method', value: cost.paymentMethod },
    { label: 'Vehicle', value: vehicleName },
    { label: 'Driver', value: cost.driverName || (cost.driverId ? undefined : null) },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="cash-multiple" size={32} color={colors.white} />
        </View>
        <Text style={styles.title}>{cost.description || cost.category || 'Expense'}</Text>
        <Text style={styles.amount}>AED {(cost.amount || 0).toLocaleString()}</Text>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => navigation.navigate('CostForm', { cost })}>
          <Icon name="pencil-outline" size={18} color={colors.white} />
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Icon name="delete-outline" size={18} color={colors.error} />
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.sectionTitle}>Details</Text>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.val}>{r.value}</Text>
          </View>
        ))}
      </Card>

      {/* Receipts / Attachments */}
      {(cost.receipts?.length > 0 || cost.receiptUrl) && (
        <Card style={{ marginHorizontal: spacing.md, marginTop: spacing.md }}>
          <Text style={styles.sectionTitle}>Receipts</Text>
          <View style={styles.receiptGrid}>
            {cost.receipts?.map((r: any, i: number) => {
              const imgUrl = r.url?.startsWith('http') ? r.url : `${API_BASE_URL.replace('/api', '')}${r.url}`;
              return (
                <TouchableOpacity key={i} onPress={() => Linking.openURL(imgUrl)} activeOpacity={0.8}>
                  <Image source={{ uri: imgUrl }} style={styles.receiptImg} />
                  {r.fileName && <Text style={styles.receiptName} numberOfLines={1}>{r.fileName}</Text>}
                </TouchableOpacity>
              );
            })}
            {!cost.receipts?.length && cost.receiptUrl && (() => {
              const imgUrl = cost.receiptUrl.startsWith('http') ? cost.receiptUrl : `${API_BASE_URL.replace('/api', '')}${cost.receiptUrl}`;
              return (
                <TouchableOpacity onPress={() => Linking.openURL(imgUrl)} activeOpacity={0.8}>
                  <Image source={{ uri: imgUrl }} style={styles.receiptImg} />
                </TouchableOpacity>
              );
            })()}
          </View>
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
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: { fontSize: fontSize.lg, fontFamily: fonts.semiBold, color: 'rgba(255,255,255,0.8)' },
  amount: { fontSize: 28, fontFamily: fonts.extraBold, color: colors.white, marginTop: 4 },
  actions: { flexDirection: 'row', justifyContent: 'center', padding: spacing.md, gap: spacing.sm, marginTop: spacing.md, marginBottom: spacing.sm },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  label: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary },
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
  receiptGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  receiptImg: { width: 100, height: 100, borderRadius: borderRadius.md, backgroundColor: colors.divider },
  receiptName: { fontSize: 11, fontFamily: fonts.regular, color: colors.textSecondary, width: 100, marginTop: 4 },
});

export default CostDetailScreen;
