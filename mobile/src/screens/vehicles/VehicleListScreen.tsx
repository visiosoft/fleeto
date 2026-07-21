import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, TextInput } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { vehicleService } from '../../services/vehicleService';
import { contractService } from '../../services/contractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { fonts } from '../../config/theme';
import { ui } from '../../config/ui';

type VehicleStatus = 'Active' | 'Idle' | 'Maintenance';

const getStatus = (vehicle: any): VehicleStatus => {
  const s = (vehicle?.status || '').toLowerCase();
  if (s === 'active') return 'Active';
  if (s === 'maintenance' || s === 'in service') return 'Maintenance';
  return 'Idle';
};

const statusStyles: Record<VehicleStatus, { bg: string; text: string }> = {
  Active: { bg: ui.greenTint, text: ui.green },
  Idle: { bg: ui.amberTint, text: ui.amber },
  Maintenance: { bg: ui.redTint, text: ui.red },
};

const VehicleListScreen = ({ navigation }: any) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [contractMap, setContractMap] = useState<Record<string, string>>({});

  const fetchVehicles = useCallback(async () => {
    try {
      const [res, cRes] = await Promise.all([
        vehicleService.getAll(),
        contractService.getAll().catch(() => null),
      ]);
      const data = res.data?.data || res.data || [];
      setVehicles(data);

      // Map vehicleId (and vehicleName as fallback) → client company, from non-expired contracts
      const contracts = cRes?.data?.data || cRes?.data || [];
      if (Array.isArray(contracts)) {
        const map: Record<string, string> = {};
        contracts
          .filter((c: any) => !['expired', 'terminated'].includes((c.status || '').toLowerCase()))
          .forEach((c: any) => {
            const client = c.companyName || c.customerName;
            if (!client) return;
            if (c.vehicleId) map[String(c.vehicleId)] = client;
            if (c.vehicleName) map[String(c.vehicleName).toLowerCase()] = client;
            if (c.vehiclePlate) map[String(c.vehiclePlate).toLowerCase()] = client;
          });
        setContractMap(map);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);
  useEffect(() => { const u = navigation.addListener('focus', fetchVehicles); return u; }, [navigation, fetchVehicles]);

  const filtered = useMemo(() => {
    if (!search.trim()) return vehicles;
    const q = search.toLowerCase();
    return vehicles.filter((v: any) =>
      v.plateNumber?.toLowerCase().includes(q) ||
      v.make?.toLowerCase().includes(q) ||
      v.model?.toLowerCase().includes(q) ||
      v.name?.toLowerCase().includes(q) ||
      v.driverName?.toLowerCase().includes(q)
    );
  }, [search, vehicles]);

  const counts = useMemo(() => {
    const c = { Active: 0, Idle: 0, Maintenance: 0 };
    vehicles.forEach((v: any) => { c[getStatus(v)] += 1; });
    return c;
  }, [vehicles]);

  if (loading) return <LoadingScreen />;

  const renderVehicle = ({ item }: { item: any }) => {
    const status = getStatus(item);
    const pill = statusStyles[status];
    const contractName = item.contractName
      || contractMap[String(item._id)]
      || contractMap[String(item.plateNumber || '').toLowerCase()]
      || contractMap[`${item.make || ''} ${item.model || ''}`.trim().toLowerCase()]
      || contractMap[String(item.name || '').toLowerCase()];
    const gradientColors: [string, string] = status === 'Maintenance'
      ? ['#ef4444', '#f87171']
      : ['#5B2BC9', '#7C4DFF'];
    return (
      <TouchableOpacity
        style={styles.card}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('VehicleDetail', { id: item._id, vehicle: item })}
      >
        <View style={styles.cardTop}>
          <LinearGradient colors={gradientColors} style={styles.vehicleIcon} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Icon name="van-utility" size={22} color="#fff" />
          </LinearGradient>
          <View style={styles.cardInfo}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {item.plateNumber || `${item.make} ${item.model}`}
            </Text>
            <Text style={styles.cardSub} numberOfLines={1}>
              {item.make} {item.model}{item.plateNumber ? ` • ${item.plateNumber}` : ''}
            </Text>
          </View>
          <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
            <Text style={[styles.statusPillText, { color: pill.text }]}>{status}</Text>
          </View>
        </View>
        <View style={styles.cardBottom}>
          <View style={[styles.infoBox, { backgroundColor: ui.lilac }]}>
            <Text style={styles.infoLabel}>Driver</Text>
            <Text style={styles.infoValue} numberOfLines={1}>{item.driverName || 'Unassigned'}</Text>
          </View>
          <View style={[styles.infoBox, { backgroundColor: ui.sand }]}>
            <Text style={styles.infoLabel}>Contract</Text>
            <Text style={[styles.infoValue, !contractName && { color: ui.muted }]} numberOfLines={1}>
              {contractName || 'Unassigned'}
            </Text>
          </View>
          <View style={[styles.infoBox, { backgroundColor: ui.sand }]}>
            <Text style={styles.infoLabel}>Mileage</Text>
            <Text style={styles.infoValue} numberOfLines={1}>
              {item.currentMileage ? `${item.currentMileage.toLocaleString()} km` : '—'}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Fleet</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('VehicleForm')}>
          <Icon name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchBar}>
        <Icon name="magnify" size={16} color={ui.muted} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search by plate, model, driver…"
          placeholderTextColor={ui.muted}
        />
      </View>

      <View style={styles.pillRow}>
        <View style={[styles.countPill, { backgroundColor: ui.greenTint }]}>
          <View style={[styles.pillDot, { backgroundColor: ui.greenBright }]} />
          <Text style={[styles.countPillText, { color: ui.green }]}>{counts.Active} Active</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: ui.amberTint }]}>
          <View style={[styles.pillDot, { backgroundColor: '#f59e0b' }]} />
          <Text style={[styles.countPillText, { color: ui.amber }]}>{counts.Idle} Idle</Text>
        </View>
        <View style={[styles.countPill, { backgroundColor: ui.redTint }]}>
          <View style={[styles.pillDot, { backgroundColor: ui.red }]} />
          <Text style={[styles.countPillText, { color: ui.red }]}>{counts.Maintenance} Maintenance</Text>
        </View>
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchVehicles(); }} />}
        ListEmptyComponent={<EmptyState icon="car-off" title="No vehicles found" />}
        renderItem={renderVehicle}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  headerTitle: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ui.purple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    marginTop: 14,
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: ui.cardBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontFamily: fonts.regular,
    color: ui.ink,
    padding: 0,
  },
  pillRow: { flexDirection: 'row', marginTop: 14, paddingHorizontal: 20, gap: 8 },
  countPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 99,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  countPillText: { fontSize: 12, fontFamily: fonts.semiBold },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 80 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: ui.cardBorder,
    marginBottom: 10,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  vehicleIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  cardInfo: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontFamily: fonts.bold, color: ui.ink },
  cardSub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  statusPill: { borderRadius: 99, paddingVertical: 4, paddingHorizontal: 10, marginLeft: 8 },
  statusPillText: { fontSize: 11, fontFamily: fonts.semiBold },
  cardBottom: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: ui.hairline,
  },
  infoBox: { flex: 1, borderRadius: 8, paddingVertical: 8, paddingHorizontal: 10 },
  infoLabel: { fontSize: 10, fontFamily: fonts.regular, color: ui.muted },
  infoValue: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.ink, marginTop: 2 },
});

export default VehicleListScreen;
