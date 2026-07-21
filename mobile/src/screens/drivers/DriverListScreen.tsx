import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { driverService } from '../../services/driverService';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import FAB from '../../components/common/FAB';
import StatusBadge from '../../components/common/StatusBadge';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const filters = ['All', 'Active', 'On Leave', 'Inactive'];

const DriverListScreen = ({ navigation }: any) => {
  const [drivers, setDrivers] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDrivers = useCallback(async () => {
    try {
      const res = await driverService.getAll();
      const data = res.data?.data || res.data || [];
      setDrivers(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchDrivers(); }, [fetchDrivers]);
  useEffect(() => { const u = navigation.addListener('focus', fetchDrivers); return u; }, [navigation, fetchDrivers]);

  useEffect(() => {
    let data = drivers;
    if (activeFilter !== 'All') {
      data = data.filter((d: any) => d.status?.toLowerCase() === activeFilter.toLowerCase());
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      data = data.filter((d: any) =>
        d.name?.toLowerCase().includes(q) || d.phone?.includes(q) || d.licenseNumber?.toLowerCase().includes(q)
      );
    }
    setFiltered(data);
  }, [search, drivers, activeFilter]);

  const getCount = (f: string) => {
    if (f === 'All') return drivers.length;
    return drivers.filter((d: any) => d.status?.toLowerCase() === f.toLowerCase()).length;
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search drivers..." />
      <View style={styles.filterRow}>
        {filters.map(f => {
          const count = getCount(f);
          const isActive = activeFilter === f;
          return (
            <TouchableOpacity key={f} style={[styles.pill, isActive && styles.pillActive]} onPress={() => setActiveFilter(f)}>
              <Text style={[styles.pillText, isActive && styles.pillTextActive]}>
                {f === 'All' ? `${count} Total` : `${count} ${f}`}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchDrivers(); }} />}
        ListEmptyComponent={<EmptyState icon="account-off" title="No drivers found" />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('DriverDetail', { id: item._id, driver: item })}>
            <View style={styles.cardRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.name || 'D')[0].toUpperCase()}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name || item.firstName || 'Driver'}</Text>
                <Text style={styles.sub}>{item.phone || item.licenseNumber || 'No details'}</Text>
                <View style={styles.chipRow}>
                  {item.status && <StatusBadge status={item.status} />}
                  {item.vehiclePlate && (
                    <View style={styles.chip}>
                      <Icon name="car-outline" size={12} color={colors.textSecondary} />
                      <Text style={styles.chipText}>{item.vehiclePlate}</Text>
                    </View>
                  )}
                </View>
              </View>
              <Icon name="chevron-right" size={20} color={colors.textLight} />
            </View>
          </Card>
        )}
      />
      <FAB onPress={() => navigation.navigate('DriverForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  filterRow: { flexDirection: 'row', paddingHorizontal: spacing.md, marginBottom: spacing.xs, gap: spacing.xs },
  pill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: borderRadius.full, backgroundColor: colors.surface },
  pillActive: { backgroundColor: colors.primary },
  pillText: { fontSize: fontSize.xs, fontFamily: fonts.semiBold, color: colors.textSecondary },
  pillTextActive: { color: colors.white },
  list: { padding: spacing.md, paddingBottom: 80 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.purpleLight, justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.primary },
  info: { flex: 1, marginLeft: spacing.sm + 2 },
  name: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.text },
  sub: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  chipRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.divider, paddingHorizontal: 7, paddingVertical: 2, borderRadius: borderRadius.full },
  chipText: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: 3 },
});

export default DriverListScreen;
