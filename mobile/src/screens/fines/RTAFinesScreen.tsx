import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { rtaFinesService } from '../../services/otherServices';
import Card from '../../components/common/Card';
import SearchBar from '../../components/common/SearchBar';
import StatCard from '../../components/common/StatCard';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fontSize, fonts, borderRadius } from '../../config/theme';
import { sortFinesNewestFirst } from '../../utils/fineDate';

// RTA amounts arrive as strings like "AED 500" / "Pay all AED 1,200"
const parseAmount = (value: any) => {
  if (typeof value === 'number') return value;
  const match = String(value ?? '').match(/([\d,]+(?:\.\d+)?)/);
  return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
};

const RTAFinesScreen = () => {
  const [fines, setFines] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [unmatched, setUnmatched] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    try {
      const [finesRes, totalRes] = await Promise.all([
        rtaFinesService.getWithClients(),
        rtaFinesService.getTotal(),
      ]);
      // Newest fines first, regardless of the order the API returns them in
      const data = sortFinesNewestFirst(finesRes.data?.data?.fines || []);
      setFines(data);
      setFiltered(data);
      setUnmatched(finesRes.data?.data?.unmatchedCount || 0);
      setTotal(parseAmount(totalRes.data?.data?.total_amount));
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    if (!search.trim()) { setFiltered(fines); return; }
    const q = search.toLowerCase();
    setFiltered(fines.filter((f: any) =>
      f.vehicle_info?.toLowerCase().includes(q) ||
      f.number_plate?.toLowerCase().includes(q) ||
      f.client?.companyName?.toLowerCase().includes(q) ||
      f.client?.contactPerson?.toLowerCase().includes(q)
    ));
  }, [search, fines]);

  // Opens WhatsApp with the reminder pre-filled; the user presses send there.
  const remindClient = async (fine: any) => {
    if (!fine.whatsappUrl) return;
    try {
      await Linking.openURL(fine.whatsappUrl);
    } catch {
      Alert.alert('WhatsApp unavailable', 'Could not open WhatsApp. Copy the message and send it another way.');
      return;
    }
    try {
      await rtaFinesService.markReminderSent(fine._id, fine.client?.contactPhone);
      setFines((prev) => prev.map((f) => (f._id === fine._id
        ? { ...f, reminder: { ...f.reminder, lastSentAt: new Date().toISOString(), count: (f.reminder?.count || 0) + 1 } }
        : f)));
    } catch (err) { console.error('Could not record fine reminder:', err); }
  };

  const copyReminder = async (fine: any) => {
    if (!fine.reminderMessage) return;
    await Clipboard.setStringAsync(fine.reminderMessage);
    Alert.alert('Copied', 'Reminder message copied to clipboard.');
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <View style={styles.totalCard}>
        <StatCard title="Total Fines" value={`AED ${total.toLocaleString()}`} icon="alert-circle" iconColor="#EF4444" iconBg="#FEF2F2" />
      </View>
      {unmatched > 0 && (
        <Text style={styles.unmatchedNote}>
          {unmatched} fine{unmatched > 1 ? 's' : ''} could not be matched to a client contract.
        </Text>
      )}
      <SearchBar value={search} onChangeText={setSearch} placeholder="Search by vehicle or client..." />
      <FlatList
        data={filtered}
        keyExtractor={(item, index) => item._id || String(index)}
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
                <Text style={styles.title}>
                  {item.matchedVehicle?.licensePlate || item.displayPlate || 'Vehicle'}
                </Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.vehicle_info || item.source || 'Fine'}
                </Text>
                <Text style={styles.date}>{item.date_time || ''}</Text>
              </View>
              <Text style={styles.amount}>
                AED {parseAmount(item.amountValue ?? item.amount).toLocaleString()}
              </Text>
            </View>

            <View style={styles.clientRow}>
              {item.client ? (
                <View style={{ flex: 1 }}>
                  <Text style={styles.clientName}>
                    {item.client.contactPerson || item.client.companyName}
                  </Text>
                  <Text style={styles.clientPhone}>
                    {item.client.contactPhone || 'No phone on contract'}
                  </Text>
                  {!!item.reminder?.lastSentAt && (
                    <Text style={styles.reminded}>
                      Reminded {new Date(item.reminder.lastSentAt).toLocaleDateString('en-GB')}
                      {item.reminder.count > 1 ? ` (${item.reminder.count}x)` : ''}
                    </Text>
                  )}
                </View>
              ) : (
                <Text style={styles.unmatchedTag}>No matching client contract</Text>
              )}

              <View style={styles.actions}>
                {!!item.reminderMessage && (
                  <TouchableOpacity style={styles.copyBtn} onPress={() => copyReminder(item)}>
                    <Icon name="content-copy" size={16} color={colors.textSecondary} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.remindBtn, !item.whatsappUrl && styles.remindBtnDisabled]}
                  onPress={() => remindClient(item)}
                  disabled={!item.whatsappUrl}
                >
                  <Icon name="whatsapp" size={16} color="#fff" />
                  <Text style={styles.remindText}>Remind</Text>
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
  totalCard: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  unmatchedNote: {
    fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary,
    paddingHorizontal: spacing.md, paddingTop: spacing.xs,
  },
  list: { padding: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center' },
  iconBox: { width: 42, height: 42, borderRadius: 10, backgroundColor: '#FFF7ED', justifyContent: 'center', alignItems: 'center' },
  info: { flex: 1, marginLeft: spacing.sm + 4 },
  title: { fontSize: fontSize.md, fontFamily: fonts.semiBold, color: colors.text },
  sub: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  date: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textLight, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontFamily: fonts.bold, color: '#F97316' },
  clientRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sm, paddingTop: spacing.sm,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  clientName: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
  clientPhone: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textSecondary, marginTop: 1 },
  reminded: { fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.success, marginTop: 2 },
  unmatchedTag: { flex: 1, fontSize: fontSize.xs, fontFamily: fonts.regular, color: colors.textLight },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  copyBtn: { padding: 8 },
  remindBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: '#25D366', paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: borderRadius.full,
  },
  remindBtnDisabled: { backgroundColor: colors.textLight, opacity: 0.5 },
  remindText: { fontSize: fontSize.xs, fontFamily: fonts.bold, color: '#fff' },
});

export default RTAFinesScreen;
