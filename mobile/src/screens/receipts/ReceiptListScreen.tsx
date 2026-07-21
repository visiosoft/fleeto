import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { receiptService } from '../../services/financeService';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import FAB from '../../components/common/FAB';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const ReceiptListScreen = ({ navigation }: any) => {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchReceipts = useCallback(async () => {
    try {
      const res = await receiptService.getAll();
      const data = res.data?.data || res.data || [];
      setReceipts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchReceipts(); }, [fetchReceipts]);
  useEffect(() => { const u = navigation.addListener('focus', fetchReceipts); return u; }, [navigation, fetchReceipts]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(receipts); return; }
    const q = search.toLowerCase();
    setFiltered(receipts.filter((r: any) => r.receiptNumber?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)));
  }, [search, receipts]);

  const totalAmount = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.summaryRow}>
        <View style={styles.summaryCard}>
          <Icon name="receipt" size={20} color={colors.primary} />
          <Text style={styles.summaryVal}>{receipts.length}</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: colors.accentLight }]}>
          <Icon name="cash" size={20} color={colors.accent} />
          <Text style={[styles.summaryVal, { color: colors.accent }]}>AED {totalAmount.toLocaleString()}</Text>
          <Text style={styles.summaryLabel}>Amount</Text>
        </View>
      </View>

      <SearchBar value={search} onChangeText={setSearch} placeholder="Search receipts..." />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchReceipts(); }} />}
        ListEmptyComponent={<EmptyState icon="receipt" title="No receipts found" />}
        renderItem={({ item }) => (
          <Card onPress={() => navigation.navigate('ReceiptDetail', { id: item._id, receipt: item })}>
            <View style={styles.cardRow}>
              <View style={styles.iconBox}>
                <Icon name="receipt" size={20} color={colors.primary} />
              </View>
              <View style={styles.info}>
                <Text style={styles.title}>{item.receiptNumber || item.description || 'Receipt'}</Text>
                <Text style={styles.sub}>{item.date || ''}</Text>
              </View>
              <Text style={styles.amount}>AED {(item.amount || 0).toLocaleString()}</Text>
            </View>
          </Card>
        )}
      />
      <FAB onPress={() => navigation.navigate('ReceiptForm')} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  summaryRow: { flexDirection: 'row', padding: spacing.md, paddingBottom: 0, gap: spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: colors.purpleLight, borderRadius: borderRadius.lg,
    padding: spacing.sm + 2, alignItems: 'center',
  },
  summaryVal: { fontSize: fontSize.lg, fontFamily: fonts.extraBold, color: colors.primary, marginTop: 4 },
  summaryLabel: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  list: { padding: spacing.md, paddingBottom: 80 },
  cardRow: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 12, backgroundColor: colors.purpleLight, justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm },
  title: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  sub: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 1, fontFamily: fonts.regular },
  amount: { fontSize: fontSize.md, fontFamily: fonts.bold, color: colors.primary },
});

export default ReceiptListScreen;
