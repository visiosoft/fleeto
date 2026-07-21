import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, Alert } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { rtaFinesService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, fonts } from '../../config/theme';

const RTAFinesScreen = () => {
  const [fines, setFines] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [finesRes, totalRes] = await Promise.all([
        rtaFinesService.getAll(),
        rtaFinesService.getTotal(),
      ]);
      const data = finesRes.data?.data || finesRes.data || [];
      setFines(data); setFiltered(data);
      setTotal(totalRes.data?.total || totalRes.data?.data?.total || 0);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(fines); return; }
    const q = search.toLowerCase();
    setFiltered(fines.filter((f: any) =>
      f.vehiclePlate?.toLowerCase().includes(q) || f.description?.toLowerCase().includes(q)
    ));
  }, [search, fines]);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <StatCard title="Total Fines" value={`AED ${total.toLocaleString()}`} icon="alert-circle" iconColor="#EF4444" iconBg="#FEF2F2" />
      </View>
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by vehicle..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetch(); }} />}
        ListEmptyComponent={<EmptyState icon="check-circle" title="No fines found" subtitle="All clear!" />}
        renderItem={({ item }) => (
          <Card>
            <View style={styles.row}>
              <View style={styles.iconBox}>
                <Icon name="car-emergency" size={22} color="#F97316" />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.vehiclePlate || item.vehicleInfo || 'Vehicle'}</Text>
                <Text style={styles.sub}>{item.description || item.fineType || 'Fine'}</Text>
                <Text style={styles.date}>{item.date || ''}</Text>
              </View>
              <Text style={styles.amount}>AED {(item.amount || 0).toLocaleString()}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  totalCard: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm + 4 },
  title: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  sub: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  date: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textLight, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontFamily: fonts.bold, color: '#F97316' },
});

export default RTAFinesScreen;
