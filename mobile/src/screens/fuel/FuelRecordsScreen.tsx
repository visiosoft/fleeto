import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { fuelService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const FuelRecordsScreen = ({ navigation }: any) => {
  const [records, setRecords] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const res = await fuelService.getAll();
      const data = res.data?.data || res.data || [];
      setRecords(data); setFiltered(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { const u = navigation.addListener('focus', fetchData); return u; }, [navigation, fetchData]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(records); return; }
    const q = search.toLowerCase();
    setFiltered(records.filter((r: any) =>
      r.vehiclePlate?.toLowerCase().includes(q) || r.station?.toLowerCase().includes(q) || r.fuelType?.toLowerCase().includes(q)
    ));
  }, [search, records]);

  const totalFuel = records.reduce((sum, r) => sum + (r.amount || r.cost || 0), 0);

  const handleDelete = (id: string) => Alert.alert('Delete Record', 'Are you sure?', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await fuelService.delete(id); fetchData(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    }},
  ]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Icon name="gas-station-outline" size={24} color={colors.white} />
        <View style={styles.summaryInfo}>
          <Text style={styles.summaryLabel}>Total Fuel Cost</Text>
          <Text style={styles.summaryAmount}>AED {totalFuel.toLocaleString()}</Text>
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{records.length}</Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search fuel records..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchData(); }} />}
        ListEmptyComponent={<EmptyState icon="gas-station" title="No fuel records" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Icon name="gas-station-outline" size={22} color={colors.accent} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.vehiclePlate || 'Vehicle'}</Text>
                <Text style={styles.sub}>{item.date || ''} {item.fuelType ? `· ${item.fuelType}` : ''}</Text>
                {item.liters && <Text style={styles.sub}>{item.liters}L {item.station ? `at ${item.station}` : ''}</Text>}
              </View>
              <View style={styles.right}>
                <Text style={styles.amount}>AED {(item.amount || item.cost || 0).toLocaleString()}</Text>
                <TouchableOpacity onPress={() => handleDelete(item._id)} style={{ marginTop: 4 }}>
                  <Icon name="delete-outline" size={16} color={colors.textLight} />
                </TouchableOpacity>
              </View>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.primary, margin: spacing.md, marginBottom: 0,
    borderRadius: borderRadius.lg, padding: spacing.md,
  },
  summaryInfo: { flex: 1, marginLeft: spacing.sm },
  summaryLabel: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.7)', fontFamily: fonts.regular },
  summaryAmount: { fontSize: fontSize.xl, fontFamily: fonts.extraBold, color: colors.white },
  countBadge: { backgroundColor: colors.accent, paddingHorizontal: 10, paddingVertical: 4, borderRadius: borderRadius.full },
  countText: { fontSize: fontSize.sm, fontFamily: fonts.bold, color: colors.white },
  list: { padding: spacing.md, paddingBottom: 80 },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.accentLight, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm },
  title: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  right: { alignItems: 'flex-end' },
  amount: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.accent },
});

export default FuelRecordsScreen;
