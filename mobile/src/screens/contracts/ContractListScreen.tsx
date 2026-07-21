import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { contractService } from '../../services/contractService';
import LoadingScreen from '../../components/common/LoadingScreen';
import EmptyState from '../../components/common/EmptyState';
import { colors, spacing, fonts } from '../../config/theme';

// Mockup palette for this screen
const ui = {
  bg: '#FBF8F2',
  ink: '#14081F',
  muted: '#756E80',
  purple: '#5B2BC9',
  purpleTint: '#F7F3FF',
  sandTint: '#F6F0E4',
  border: 'rgba(20,8,31,0.08)',
  cardBorder: 'rgba(20,8,31,0.06)',
  green: '#16a34a',
  greenTint: 'rgba(34,197,94,0.1)',
  amber: '#d97706',
  amberTint: 'rgba(245,158,11,0.1)',
  grayTint: 'rgba(20,8,31,0.06)',
};

const statusStyle = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'active') return { bg: ui.greenTint, color: ui.green, label: 'Active' };
  if (s === 'pending') return { bg: ui.amberTint, color: ui.amber, label: 'Pending Sign' };
  if (s === 'expired') return { bg: ui.grayTint, color: ui.muted, label: 'Expired' };
  return { bg: ui.grayTint, color: ui.muted, label: status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Draft' };
};

const tabs = ['All', 'Active', 'Pending', 'Expired'];

const fmt = (d: any) => {
  if (!d) return '';
  const date = new Date(d);
  if (isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const ContractListScreen = ({ navigation }: any) => {
  const [contracts, setContracts] = useState<any[]>([]);
  const [filtered, setFiltered] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState('All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchContracts = useCallback(async () => {
    try {
      const res = await contractService.getAll();
      const data = res.data?.data || res.data || [];
      setContracts(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); setRefreshing(false); }
  }, []);

  useEffect(() => { fetchContracts(); }, [fetchContracts]);
  useEffect(() => { const u = navigation.addListener('focus', fetchContracts); return u; }, [navigation, fetchContracts]);

  useEffect(() => {
    let data = contracts;
    if (activeTab !== 'All') {
      data = data.filter((c: any) => c.status?.toLowerCase() === activeTab.toLowerCase());
    }
    setFiltered(data);
  }, [contracts, activeTab]);

  const getCount = (tab: string) => {
    if (tab === 'All') return contracts.length;
    return contracts.filter((c: any) => c.status?.toLowerCase() === tab.toLowerCase()).length;
  };

  if (loading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Contracts</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('ContractForm')}>
          <Icon name="plus" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScroll} contentContainerStyle={styles.tabRow}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab} ({getCount(tab)})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchContracts(); }} />}
        ListEmptyComponent={<EmptyState icon="file-document-outline" title="No contracts found" />}
        renderItem={({ item }) => {
          const st = statusStyle(item.status);
          const isExpired = (item.status || '').toLowerCase() === 'expired';
          return (
            <TouchableOpacity
              style={[styles.card, isExpired && { opacity: 0.6 }]}
              onPress={() => navigation.navigate('ContractDetail', { id: item._id, contract: item })}
              activeOpacity={0.7}
            >
              {/* Card Header */}
              <View style={styles.cardHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.companyName}>{item.companyName || item.customerName || 'Client'}</Text>
                  <Text style={styles.contractNum}>Contract #{item.tradeLicenseNo || item.contractNumber || ''}</Text>
                </View>
                <View style={[styles.statusPill, { backgroundColor: st.bg }]}>
                  <Text style={[styles.statusText, { color: st.color }]}>{st.label}</Text>
                </View>
              </View>

              {/* Info Chips */}
              <View style={styles.chipRow}>
                <View style={[styles.infoChip, { backgroundColor: ui.purpleTint }]}>
                  <Text style={styles.chipLabel}>VEHICLES</Text>
                  <Text style={[styles.chipValue, { color: ui.purple }]}>{item.vehicleCount || item.vehicles?.length || 1}</Text>
                </View>
                <View style={[styles.infoChip, { backgroundColor: ui.sandTint }]}>
                  <Text style={styles.chipLabel}>TYPE</Text>
                  <Text style={styles.chipValueSm}>{item.contractType || 'Self-drive'}</Text>
                </View>
                <View style={[styles.infoChip, { backgroundColor: ui.sandTint }]}>
                  <Text style={styles.chipLabel}>MONTHLY</Text>
                  <Text style={styles.chipValue}>{((item.amount || item.value || 0) / 1000).toFixed(0)}K</Text>
                </View>
              </View>

              {/* Footer */}
              <View style={styles.cardFooter}>
                <View style={styles.dateSection}>
                  <Icon name="calendar-range" size={14} color={ui.muted} />
                  <Text style={styles.dateText}>{fmt(item.startDate)} — {fmt(item.endDate)}</Text>
                </View>
                <View style={styles.actionIcons}>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('ContractDetail', { id: item._id, contract: item })}
                  >
                    <Icon name="download-outline" size={15} color={ui.purple} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() => navigation.navigate('ContractDetail', { id: item._id, contract: item })}
                  >
                    <Icon name="share-variant-outline" size={15} color={ui.purple} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: spacing.md, paddingBottom: spacing.sm,
  },
  title: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  tabScroll: { flexGrow: 0, minHeight: 52, marginTop: spacing.xs },
  tabRow: { paddingHorizontal: 20, gap: 8, alignItems: 'center', paddingVertical: 8 },
  tab: {
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: 99, backgroundColor: colors.white,
    borderWidth: 1, borderColor: ui.border,
  },
  tabActive: { backgroundColor: ui.purple, borderColor: ui.purple },
  tabText: { fontSize: 13, fontFamily: fonts.medium, color: ui.ink },
  tabTextActive: { color: colors.white, fontFamily: fonts.semiBold },
  list: { paddingHorizontal: 20, paddingTop: spacing.xs, paddingBottom: 80, gap: 10 },
  card: {
    backgroundColor: colors.white, borderRadius: 16,
    padding: 18, marginBottom: 10,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  companyName: { fontSize: 16, fontFamily: fonts.bold, color: ui.ink },
  contractNum: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginTop: 3 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: fonts.semiBold },
  chipRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  infoChip: { flex: 1, borderRadius: 10, padding: 10 },
  chipLabel: { fontSize: 10, fontFamily: fonts.regular, color: ui.muted, letterSpacing: 0.6, textTransform: 'uppercase' },
  chipValue: { fontSize: 16, fontFamily: fonts.bold, color: ui.ink, marginTop: 2 },
  chipValueSm: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: ui.cardBorder,
  },
  dateSection: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dateText: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted, marginLeft: 8 },
  actionIcons: { flexDirection: 'row', gap: 6 },
  iconBtn: {
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: ui.purpleTint, justifyContent: 'center', alignItems: 'center',
  },
});

export default ContractListScreen;
