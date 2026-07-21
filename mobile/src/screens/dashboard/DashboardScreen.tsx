import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardService } from '../../services/dashboardService';
import { contractService } from '../../services/contractService';
import { useAuth } from '../../contexts/AuthContext';
import LoadingScreen from '../../components/common/LoadingScreen';
import { colors, spacing, fonts } from '../../config/theme';
import { ui } from '../../config/ui';

const greeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const DashboardScreen = ({ navigation }: any) => {
  const { user, companies, selectedCompanyId } = useAuth();
  const company = companies.find((c: any) => (c as any).id === selectedCompanyId || c._id === selectedCompanyId) || companies[0];
  const [stats, setStats] = useState<any>(null);
  const [contractStats, setContractStats] = useState<any>(null);
  const [invoiceStats, setInvoiceStats] = useState<any>(null);
  const [monthlyExpenses, setMonthlyExpenses] = useState(0);
  const [reminders, setReminders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [countsRes, contractRes, invoiceRes, expenseRes, contractsRes] = await Promise.all([
        dashboardService.getActiveCounts(),
        dashboardService.getContractStats(),
        dashboardService.getInvoiceStats().catch(() => null),
        dashboardService.getExpenseSummary().catch(() => null),
        contractService.getAll().catch(() => null),
      ]);
      const counts = countsRes.data?.data || countsRes.data || {};
      setStats({
        totalVehicles: counts.totalActiveVehicles ?? (Array.isArray(counts.activeVehicles) ? counts.activeVehicles.length : counts.activeVehicles) ?? 0,
        totalDrivers: counts.totalActiveDrivers ?? (Array.isArray(counts.activeDrivers) ? counts.activeDrivers.length : counts.activeDrivers) ?? 0,
      });
      setContractStats(contractRes.data?.data || contractRes.data || {});
      setInvoiceStats(invoiceRes?.data?.data || invoiceRes?.data || {});
      const expData = expenseRes?.data?.data || expenseRes?.data || {};
      setMonthlyExpenses(expData.grandTotal ?? 0);

      // Contract-period reminders: active contracts ending within 30 days
      const allContracts = contractsRes?.data?.data || contractsRes?.data || [];
      if (Array.isArray(allContracts)) {
        const now = new Date();
        const soon = new Date();
        soon.setDate(soon.getDate() + 30);
        const ending = allContracts
          .filter((c: any) => {
            const end = new Date(c.endDate);
            if (isNaN(end.getTime())) return false;
            const status = (c.status || '').toLowerCase();
            return end >= now && end <= soon && status !== 'terminated' && status !== 'expired';
          })
          .sort((a: any, b: any) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
          .slice(0, 4);
        setReminders(ending);
      }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const activeContracts = contractStats?.activeContracts ?? 0;
  const totalRevenue = contractStats?.totalValue ?? 0;
  const invoicesDue = invoiceStats?.totalOutstanding
    ? (invoiceStats.byStatus || []).filter((s: any) => s._id !== 'paid').reduce((sum: number, s: any) => sum + (s.count || 0), 0)
    : 0;

  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();

  const quickActions = [
    { icon: 'file-document-outline', label: 'New Contract', sub: 'Create & send', screen: 'Contracts', color: ui.purple, bg: ui.purpleTint },
    { icon: 'currency-usd', label: 'New Invoice', sub: 'Generate bill', screen: 'Invoices', color: ui.green, bg: ui.greenTint },
    { icon: 'flag-outline', label: 'Add Expense', sub: 'Log cost', screen: 'Costs', color: ui.orange, bg: ui.orangeTint },
    { icon: 'check-circle-outline', label: 'Maintenance', sub: 'Schedule', screen: 'Maintenance', color: ui.blue, bg: ui.blueTint },
  ];

  const fmtEnd = (d: any) => {
    const date = new Date(d);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const daysLeft = (d: any) => {
    const diff = Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
    return diff <= 0 ? 'today' : diff === 1 ? 'tomorrow' : `in ${diff} days`;
  };

  const sendWhatsAppReminder = (c: any) => {
    const phone = String(c.contactPhone || c.phone || '').replace(/[^\d]/g, '');
    const msg = `Dear ${c.contactPerson || c.companyName || 'Customer'},\n\nThis is a friendly reminder that your contract${c.contractNumber ? ` #${c.contractNumber}` : ''} ends on ${fmtEnd(c.endDate)}. Kindly settle your outstanding invoice at your earliest convenience.\n\nThank you,\nEfficient Move`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => {});
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[ui.purple]} />}
    >
      {/* Header */}
      <View style={styles.headerSection}>
        <View>
          <Text style={styles.greeting}>{greeting()}</Text>
          <Text style={styles.companyTitle}>{company?.name || 'My Fleet'}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.bellBtn}>
            <Icon name="bell-outline" size={18} color={ui.purple} />
          </TouchableOpacity>
          <LinearGradient colors={['#5B2BC9', '#7C4DFF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'U')[0].toUpperCase()}</Text>
          </LinearGradient>
        </View>
      </View>

      {/* Company Selector */}
      <View style={styles.companyCard}>
        <View style={styles.companyLeft}>
          <View style={styles.companyIcon}>
            <Icon name="home-outline" size={15} color={colors.white} />
          </View>
          <View>
            <Text style={styles.companyName}>{company?.name || 'My Company'}</Text>
            <Text style={styles.companySub}>Active company</Text>
          </View>
        </View>
        <Icon name="chevron-down" size={18} color={ui.muted} />
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNum, { color: ui.purple }]}>{stats?.totalVehicles ?? 0}</Text>
          <Text style={styles.statLabel}>Active vans</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{stats?.totalDrivers ?? 0}</Text>
          <Text style={styles.statLabel}>Drivers</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNum}>{activeContracts}</Text>
          <Text style={styles.statLabel}>Contracts</Text>
        </View>
      </View>

      {/* Revenue Card */}
      <LinearGradient
        colors={['#1A0B33', '#2D1259', '#4A1FA0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.revenueCard}
      >
        <View style={styles.revenueCircle} />
        <Text style={styles.revenueLabel}>Monthly Revenue</Text>
        <Text style={styles.revenueAmount}>AED {fmtK(totalRevenue)}</Text>
        <View style={styles.revenueBadgeRow}>
          <View style={styles.percentBadge}>
            <Text style={styles.percentText}>↑ 12%</Text>
          </View>
          <Text style={styles.revenueBadgeText}>vs last month</Text>
        </View>
        <View style={styles.revenueStatsRow}>
          <View style={styles.revenueStatBox}>
            <Text style={styles.revenueStatLabel}>Contracts</Text>
            <Text style={styles.revenueStatValue}>{activeContracts}</Text>
          </View>
          <View style={styles.revenueStatBox}>
            <Text style={styles.revenueStatLabel}>Invoices Due</Text>
            <Text style={styles.revenueStatValue}>{invoicesDue}</Text>
          </View>
          <View style={styles.revenueStatBox}>
            <Text style={styles.revenueStatLabel}>Expenses</Text>
            <Text style={styles.revenueStatValue}>{fmtK(monthlyExpenses)}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Quick Actions */}
      <Text style={styles.sectionTitle}>Quick Actions</Text>
      <View style={styles.actionsGrid}>
        {quickActions.map((a) => (
          <TouchableOpacity
            key={a.label}
            style={styles.actionCard}
            onPress={() => navigation.navigate(a.screen)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: a.bg }]}>
              <Icon name={a.icon} size={18} color={a.color} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionLabel}>{a.label}</Text>
              <Text style={styles.actionSub}>{a.sub}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Reminders — contracts ending soon */}
      <Text style={styles.sectionTitle}>Reminders</Text>
      <View style={{ gap: 8 }}>
        {reminders.length === 0 ? (
          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: ui.greenTint }]}>
              <Icon name="check-circle-outline" size={16} color={ui.green} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>All caught up</Text>
              <Text style={styles.activityTime}>No contracts ending in the next 30 days</Text>
            </View>
          </View>
        ) : reminders.map((c, i) => (
          <TouchableOpacity
            key={c._id || i}
            style={styles.activityCard}
            onPress={() => navigation.navigate('ContractDetail', { id: c._id, contract: c })}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIcon, { backgroundColor: ui.amberTint }]}>
              <Icon name="calendar-alert" size={16} color={ui.amber} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText} numberOfLines={1}>
                Contract ending — {c.companyName || c.customerName || 'Client'}
              </Text>
              <Text style={styles.activityTime} numberOfLines={1}>
                Ends {daysLeft(c.endDate)} • {fmtEnd(c.endDate)}
              </Text>
            </View>
            <TouchableOpacity style={styles.waBtn} onPress={() => sendWhatsAppReminder(c)}>
              <Icon name="whatsapp" size={14} color={colors.white} />
              <Text style={styles.waBtnText}>Remind</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xxl }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { padding: 20, paddingTop: spacing.md },

  headerSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 12, fontFamily: fonts.medium, color: ui.muted },
  companyTitle: { fontSize: 24, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.48 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  bellBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: ui.purpleTint, justifyContent: 'center', alignItems: 'center',
  },
  avatar: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 14, fontFamily: fonts.bold, color: colors.white },

  companyCard: {
    marginTop: 16, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12,
    backgroundColor: colors.white, borderWidth: 1, borderColor: ui.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  companyLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  companyIcon: {
    width: 28, height: 28, borderRadius: 7,
    backgroundColor: ui.purple, justifyContent: 'center', alignItems: 'center',
  },
  companyName: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  companySub: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted },

  statsRow: { flexDirection: 'row', gap: 10, marginTop: 18 },
  statCard: {
    flex: 1, backgroundColor: colors.white, borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  statNum: { fontSize: 28, fontFamily: fonts.bold, color: ui.ink, letterSpacing: -0.8 },
  statLabel: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 2 },

  revenueCard: { marginTop: 14, borderRadius: 18, padding: 20, overflow: 'hidden' },
  revenueCircle: {
    position: 'absolute', right: -30, top: -30,
    width: 120, height: 120, borderRadius: 60,
    backgroundColor: 'rgba(124,77,255,0.15)',
  },
  revenueLabel: { fontSize: 12, fontFamily: fonts.medium, color: 'rgba(255,255,255,0.7)' },
  revenueAmount: { fontSize: 36, fontFamily: fonts.bold, color: colors.white, letterSpacing: -1, marginTop: 4 },
  revenueBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  percentBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99,
    backgroundColor: 'rgba(34,197,94,0.2)',
  },
  percentText: { fontSize: 12, fontFamily: fonts.semiBold, color: '#4ade80' },
  revenueBadgeText: { fontSize: 12, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)' },
  revenueStatsRow: { flexDirection: 'row', gap: 8, marginTop: 16 },
  revenueStatBox: {
    flex: 1, backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10, paddingVertical: 10, paddingHorizontal: 12,
  },
  revenueStatLabel: { fontSize: 11, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.6)' },
  revenueStatValue: { fontSize: 16, fontFamily: fonts.bold, color: colors.white, marginTop: 2 },

  sectionTitle: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink, marginTop: 18, marginBottom: 12 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: {
    width: '47%', flexGrow: 1, flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  actionIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  actionInfo: { flex: 1 },
  actionLabel: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  actionSub: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },

  activityCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.white, borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  activityIcon: { width: 36, height: 36, borderRadius: 9, justifyContent: 'center', alignItems: 'center' },
  activityInfo: { flex: 1, minWidth: 0 },
  activityText: { fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink },
  activityTime: { fontSize: 11, fontFamily: fonts.regular, color: ui.muted, marginTop: 1 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: 11, fontFamily: fonts.semiBold },
  waBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: ui.whatsapp, paddingHorizontal: 10, paddingVertical: 6,
    borderRadius: 99,
  },
  waBtnText: { fontSize: 11, fontFamily: fonts.semiBold, color: colors.white },
});

export default DashboardScreen;
