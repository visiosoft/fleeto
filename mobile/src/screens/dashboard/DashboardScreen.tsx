import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, Linking, DeviceEventEmitter, Modal, FlatList,
} from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { dashboardService } from '../../services/dashboardService';
import { contractService } from '../../services/contractService';
import { rtaFinesService, letterService, maintenanceService, staffAccountService } from '../../services/otherServices';
import { sortFinesNewestFirst } from '../../utils/fineDate';
import { invoiceService } from '../../services/financeService';
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
  const [recentFines, setRecentFines] = useState<any[]>([]);
  const [recentLetters, setRecentLetters] = useState<any[]>([]);
  const [dueMaintenance, setDueMaintenance] = useState<any[]>([]);
  const [staffCash, setStaffCash] = useState(0);
  const [upcomingInvoices, setUpcomingInvoices] = useState<any[]>([]);
  const [unpaidInvoices, setUnpaidInvoices] = useState<any[]>([]);
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [countsRes, contractRes, invoiceRes, expenseRes, contractsRes, upcomingRes, finesRes] = await Promise.all([
        dashboardService.getActiveCounts(),
        dashboardService.getContractStats(),
        dashboardService.getInvoiceStats().catch(() => null),
        dashboardService.getExpenseSummary().catch(() => null),
        contractService.getAll().catch(() => null),
        invoiceService.getUpcoming().catch(() => null),
        rtaFinesService.getWithClients().catch(() => null),
      ]);
      const lettersRes = await letterService.getAll().catch(() => null);

      // Total company cash currently held by staff
      const staffRes = await staffAccountService.getAll().catch(() => null);
      const staffList = staffRes?.data?.data || staffRes?.data || [];
      if (Array.isArray(staffList)) {
        setStaffCash(staffList.reduce((sum: number, s: any) => sum + (Number(s.balance) || 0), 0));
      }

      // Scheduled maintenance that is due soon or overdue
      const maintRes = await maintenanceService.getAll().catch(() => null);
      const maintList = maintRes?.data?.data || maintRes?.data || [];
      if (Array.isArray(maintList)) {
        const soon = new Date();
        soon.setDate(soon.getDate() + 7);
        setDueMaintenance(
          maintList
            .filter((m: any) => ['Scheduled', 'Pending', 'In Progress'].includes(m.status) && new Date(m.date) <= soon)
            .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 4)
        );
      }

      const allFines = sortFinesNewestFirst(finesRes?.data?.data?.fines || []);
      setRecentFines(allFines.slice(0, 3));

      const allLetters = lettersRes?.data?.data || lettersRes?.data || [];
      setRecentLetters(Array.isArray(allLetters) ? allLetters.slice(0, 3) : []);
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

      // Upcoming invoices
      const upcomingData = upcomingRes?.data?.data || upcomingRes?.data || [];
      setUpcomingInvoices(Array.isArray(upcomingData) ? upcomingData.slice(0, 5) : []);

      // Unpaid invoices from this month onwards
      try {
        const invRes = await invoiceService.getAll();
        const allInvoices = invRes.data?.data || invRes.data || [];
        const now = new Date();
        const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const unpaid = allInvoices.filter((inv: any) => {
          const s = (inv.status || '').toLowerCase();
          if (s === 'paid' || s === 'draft') return false;
          const invDate = new Date(inv.issueDate || inv.createdAt);
          return invDate >= thisMonth;
        });
        setUnpaidInvoices(unpaid);
      } catch { }
    } catch (error) {
      console.error('Dashboard fetch error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Top-bar bell opens the reminders modal
  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('openReminders', () => setShowRemindersModal(true));
    return () => sub.remove();
  }, []);
  useEffect(() => { const unsub = navigation.addListener('focus', fetchData); return unsub; }, [navigation, fetchData]);
  const onRefresh = () => { setRefreshing(true); fetchData(); };

  if (loading) return <LoadingScreen message="Loading dashboard..." />;

  const activeContracts = contractStats?.activeContracts ?? 0;
  const totalRevenue = contractStats?.totalValue ?? 0;
  const invoicesDue = invoiceStats?.totalOutstanding
    ? (invoiceStats.byStatus || []).filter((s: any) => s._id !== 'paid').reduce((sum: number, s: any) => sum + (s.count || 0), 0)
    : 0;

  const fmtK = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toLocaleString();

  const quickActions = [
    // These open list screens, so they are named for where they go rather than
    // for an action they do not perform.
    { icon: 'file-document-outline', label: 'Contracts', sub: 'View all', screen: 'Contracts', color: ui.purple, bg: ui.purpleTint },
    { icon: 'currency-usd', label: 'Invoices', sub: 'View all', screen: 'Invoices', color: ui.green, bg: ui.greenTint },
    { icon: 'flag-outline', label: 'Expenses', sub: 'View all', screen: 'Costs', color: ui.orange, bg: ui.orangeTint },
    { icon: 'check-circle-outline', label: 'Maintenance', sub: 'View all', screen: 'Maintenance', color: ui.blue, bg: ui.blueTint },
    { icon: 'email-edit-outline', label: 'Letterhead', sub: 'Write letter', screen: 'Letterheads', color: ui.purple, bg: ui.lilac },
    { icon: 'account-cash-outline', label: 'Accounts', sub: 'Staff cash', screen: 'StaffAccounts', color: '#0891b2', bg: 'rgba(8,145,178,0.08)' },
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
    Linking.openURL(url).catch(() => { });
  };

  const sendInvoiceWhatsApp = (item: any) => {
    const phone = String(item.contactPhone || '').replace(/[^\d]/g, '');
    const msg = `Dear ${item.contactPerson || item.companyName || 'Client'},\n\nYour invoice for ${item.month} (AED ${item.amount?.toLocaleString()}) is due. Please arrange payment.\n\nThank you,\nEfficient Move`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => { });
  };

  const sendInvoiceReminder = (item: any) => {
    const phone = String(item.contactPhone || '').replace(/[^\d]/g, '');
    const msg = `Dear ${item.contactPerson || item.companyName || 'Client'},\n\nFriendly reminder: your invoice for ${item.month} (AED ${item.amount?.toLocaleString()}) is still pending. Kindly arrange payment.\n\nThank you,\nEfficient Move`;
    const url = phone
      ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    Linking.openURL(url).catch(() => { });
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
          <TouchableOpacity style={styles.revenueStatBox} onPress={() => navigation.navigate('Contracts')} activeOpacity={0.7}>
            <Text style={styles.revenueStatLabel}>Contracts</Text>
            <Text style={styles.revenueStatValue}>{activeContracts}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.revenueStatBox} onPress={() => navigation.navigate('StaffAccounts')} activeOpacity={0.7}>
            <Text style={styles.revenueStatLabel}>Cash with Staff</Text>
            <Text style={styles.revenueStatValue}>{fmtK(staffCash)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.revenueStatBox} onPress={() => navigation.navigate('CostForm')} activeOpacity={0.7}>
            <Text style={styles.revenueStatLabel}>Expenses</Text>
            <Text style={styles.revenueStatValue}>{fmtK(monthlyExpenses)}</Text>
          </TouchableOpacity>
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

      {/* Upcoming Invoices */}
      <Text style={styles.sectionTitle}>Upcoming Invoices</Text>
      <View style={{ gap: 8 }}>
        {upcomingInvoices.length === 0 ? (
          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: ui.greenTint }]}>
              <Icon name="check-circle-outline" size={16} color={ui.green} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>No upcoming invoices</Text>
              <Text style={styles.activityTime}>All invoices are up to date</Text>
            </View>
          </View>
        ) : upcomingInvoices.map((item, i) => {
          const isPaid = item.invoiceStatus === 'paid';
          const isSent = item.invoiceStatus === 'sent';
          const isGenerated = item.invoiceExists && !isSent && !isPaid;
          const statusLabel = isPaid ? 'Paid' : isSent ? 'Sent' : isGenerated ? 'Invoice Generated' : 'Pending';
          const iconBg = isPaid ? ui.greenTint : isSent ? ui.blueTint : isGenerated ? '#e0f2fe' : ui.amberTint;
          const iconColor = isPaid ? ui.green : isSent ? ui.blue : isGenerated ? '#0284c7' : ui.amber;
          const iconName = isPaid ? 'check-circle' : isSent ? 'send-check' : isGenerated ? 'file-document-check-outline' : 'file-clock-outline';

          return (
            <TouchableOpacity
              key={`${item.contractId}-${i}`}
              style={[styles.activityCard, isGenerated && { borderColor: '#bae6fd', borderWidth: 1 }]}
              onPress={() => item.invoiceId
                ? navigation.navigate('InvoiceDetail', { id: item.invoiceId })
                : navigation.navigate('InvoiceForm', { contractId: item.contractId })
              }
              activeOpacity={0.7}
            >
              <View style={[styles.activityIcon, { backgroundColor: iconBg }]}>
                <Icon name={iconName} size={16} color={iconColor} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText} numberOfLines={1}>
                  {item.companyName} — {item.month}
                </Text>
                <Text style={styles.activityTime} numberOfLines={1}>
                  AED {item.amount?.toLocaleString()} • Due {new Date(item.dueDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} • {statusLabel}
                </Text>
              </View>
              {isPaid ? (
                <View style={[styles.activityIcon, { backgroundColor: ui.greenTint }]}>
                  <Icon name="check" size={18} color={ui.green} />
                </View>
              ) : !item.invoiceExists ? (
                <View style={[styles.activityIcon, { backgroundColor: ui.purpleTint }]}>
                  <Icon name="plus-circle-outline" size={18} color={ui.purple} />
                </View>
              ) : (
                <View style={[styles.activityIcon, { backgroundColor: ui.blueTint }]}>
                  <Icon name="eye-outline" size={18} color={ui.blue} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Reminders — contracts ending soon */}
      <Text style={styles.sectionTitle}>Contract Expiry Reminders</Text>
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

      {/* Recent Fines */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Recent Fines</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RTAFines')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ gap: 8 }}>
        {recentFines.length === 0 ? (
          <View style={styles.activityCard}>
            <View style={[styles.activityIcon, { backgroundColor: ui.greenTint }]}>
              <Icon name="check-circle-outline" size={16} color={ui.green} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>No fines</Text>
              <Text style={styles.activityTime}>All clear — no RTA fines recorded</Text>
            </View>
          </View>
        ) : recentFines.map((f: any, i: number) => (
          <TouchableOpacity
            key={f._id || i}
            style={styles.activityCard}
            onPress={() => navigation.navigate('RTAFines')}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIcon, { backgroundColor: ui.redTint }]}>
              <Icon name="car-emergency" size={16} color={ui.red} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText} numberOfLines={1}>
                {f.matchedVehicle?.licensePlate || f.displayPlate || f.number_plate || 'Vehicle'}
              </Text>
              <Text style={styles.activityTime} numberOfLines={1}>
                {[f.vehicle_info || f.source, f.date_time].filter(Boolean).join(' • ') || 'RTA fine'}
              </Text>
            </View>
            <Text style={styles.fineAmount}>
              AED {(() => { const m = String(f.amountValue ?? f.amount ?? '').match(/([\d,]+(?:\.\d+)?)/); return m ? parseFloat(m[1].replace(/,/g, '')).toLocaleString() : '0'; })()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Scheduled Maintenance alerts */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Scheduled Tasks</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Maintenance')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ gap: 8 }}>
        {dueMaintenance.length === 0 ? (
          <TouchableOpacity style={styles.activityCard} onPress={() => navigation.navigate('Maintenance')} activeOpacity={0.7}>
            <View style={[styles.activityIcon, { backgroundColor: ui.greenTint }]}>
              <Icon name="check-circle-outline" size={16} color={ui.green} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>No tasks due</Text>
              <Text style={styles.activityTime}>Nothing scheduled in the next 7 days</Text>
            </View>
          </TouchableOpacity>
        ) : dueMaintenance.map((m: any, i: number) => {
          const days = Math.ceil((new Date(m.date).getTime() - Date.now()) / 86400000);
          const late = days < 0;
          return (
            <TouchableOpacity
              key={m._id || i}
              style={styles.activityCard}
              onPress={() => navigation.navigate('Maintenance')}
              activeOpacity={0.7}
            >
              <View style={[styles.activityIcon, { backgroundColor: late ? ui.redTint : ui.amberTint }]}>
                <Icon name="wrench-clock" size={16} color={late ? ui.red : ui.amber} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText} numberOfLines={1}>{m.service} — {m.vehicleName}</Text>
                <Text style={[styles.activityTime, late && { color: ui.red }]} numberOfLines={1}>
                  {late
                    ? `Overdue by ${Math.abs(days)} day${Math.abs(days) !== 1 ? 's' : ''}`
                    : days === 0 ? 'Due today' : `Due in ${days} day${days !== 1 ? 's' : ''}`}
                  {' • '}{fmtEnd(m.date)}
                </Text>
              </View>
              <View style={[styles.statusPill, { backgroundColor: late ? ui.redTint : ui.amberTint }]}>
                <Text style={[styles.statusText, { color: late ? ui.red : ui.amber }]}>
                  {late ? 'Overdue' : 'Due'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Recent Letters */}
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { marginTop: 0, marginBottom: 0 }]}>Recent Letters</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Letterheads')}>
          <Text style={styles.seeAll}>See all</Text>
        </TouchableOpacity>
      </View>
      <View style={{ gap: 8 }}>
        {recentLetters.length === 0 ? (
          <TouchableOpacity style={styles.activityCard} onPress={() => navigation.navigate('Letterheads')} activeOpacity={0.7}>
            <View style={[styles.activityIcon, { backgroundColor: ui.lilac }]}>
              <Icon name="email-edit-outline" size={16} color={ui.purple} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText}>No letters yet</Text>
              <Text style={styles.activityTime}>Tap to write a letter on your letterhead</Text>
            </View>
          </TouchableOpacity>
        ) : recentLetters.map((l: any, i: number) => (
          <TouchableOpacity
            key={l._id || i}
            style={styles.activityCard}
            onPress={() => navigation.navigate('Letterheads')}
            activeOpacity={0.7}
          >
            <View style={[styles.activityIcon, { backgroundColor: ui.lilac }]}>
              <Icon name="email-outline" size={16} color={ui.purple} />
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityText} numberOfLines={1}>{l.subject || 'Letter'}</Text>
              <Text style={styles.activityTime} numberOfLines={1}>
                {[l.recipient?.companyName, fmtEnd(l.letterDate || l.createdAt)].filter(Boolean).join(' • ')}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ height: spacing.xxl }} />

      {/* Reminders Modal */}
      <Modal visible={showRemindersModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Pending Reminders</Text>
              <TouchableOpacity onPress={() => setShowRemindersModal(false)}>
                <Icon name="close" size={24} color={ui.ink} />
              </TouchableOpacity>
            </View>

            {/* Unpaid invoices from this month */}
            {unpaidInvoices.length > 0 && (
              <Text style={styles.modalSectionTitle}>Unpaid Invoices</Text>
            )}
            {unpaidInvoices.map((inv, i) => {
              const invContract = inv.contract || {};
              const invBalance = (inv.total || 0) - (inv.totalPaid || 0);
              const phone = String(invContract.contactPhone || '').replace(/[^\d]/g, '');
              return (
                <TouchableOpacity
                  key={`unpaid-${i}`}
                  style={styles.reminderItem}
                  onPress={() => { setShowRemindersModal(false); navigation.navigate('InvoiceDetail', { id: inv._id }); }}
                >
                  <View style={[styles.reminderDot, { backgroundColor: inv.status === 'partial' ? '#d97706' : new Date(inv.dueDate) < new Date() ? '#dc2626' : ui.blue }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.reminderText}>{invContract.companyName || inv.customerName || `#${inv.invoiceNumber}`}</Text>
                    <Text style={styles.reminderSub}>AED {invBalance.toLocaleString()} due • {inv.status === 'partial' ? 'Partially paid' : new Date(inv.dueDate) < new Date() ? 'Overdue' : 'Sent'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => {
                    const msg = `Dear ${invContract.contactPerson || invContract.companyName || 'Client'},\n\nReminder: Invoice #${inv.invoiceNumber}\nBalance Due: AED ${invBalance.toLocaleString()}\n\nPlease arrange payment.\n\nThank you,\nEfficient Move`;
                    const url = phone ? `https://wa.me/${phone}?text=${encodeURIComponent(msg)}` : `https://wa.me/?text=${encodeURIComponent(msg)}`;
                    Linking.openURL(url).catch(() => { });
                    setShowRemindersModal(false);
                  }}>
                    <Icon name="whatsapp" size={22} color={ui.whatsapp} />
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}

            {/* Contract expiry */}
            {reminders.length > 0 && (
              <Text style={[styles.modalSectionTitle, { marginTop: 16 }]}>Contracts Expiring</Text>
            )}
            {reminders.map((c, i) => (
              <TouchableOpacity
                key={`con-${i}`}
                style={styles.reminderItem}
                onPress={() => { setShowRemindersModal(false); navigation.navigate('ContractDetail', { id: c._id, contract: c }); }}
              >
                <View style={[styles.reminderDot, { backgroundColor: '#f59e0b' }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.reminderText}>{c.companyName || 'Client'}</Text>
                  <Text style={styles.reminderSub}>Ends {daysLeft(c.endDate)} • {fmtEnd(c.endDate)}</Text>
                </View>
                <TouchableOpacity onPress={() => { setShowRemindersModal(false); sendWhatsAppReminder(c); }}>
                  <Icon name="whatsapp" size={22} color={ui.whatsapp} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}

            {unpaidInvoices.length === 0 && reminders.length === 0 && (
              <View style={{ alignItems: 'center', paddingVertical: 30 }}>
                <Icon name="check-circle-outline" size={40} color={ui.green} />
                <Text style={{ marginTop: 10, fontFamily: fonts.semiBold, color: ui.muted }}>All caught up!</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
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
  sectionRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 18, marginBottom: 12,
  },
  seeAll: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple },
  fineAmount: { fontSize: 14, fontFamily: fonts.bold, color: ui.red },
  bellBadge: {
    position: 'absolute', top: -4, right: -4,
    width: 16, height: 16, borderRadius: 8, backgroundColor: '#ef4444',
    alignItems: 'center', justifyContent: 'center',
  },
  bellBadgeText: { fontSize: 9, fontFamily: fonts.bold, color: '#fff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20,
    padding: 20, maxHeight: '75%',
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontFamily: fonts.bold, color: ui.ink },
  modalSectionTitle: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.muted, textTransform: 'uppercase', marginBottom: 8 },
  reminderItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: ui.border,
  },
  reminderDot: { width: 10, height: 10, borderRadius: 5 },
  reminderText: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  reminderSub: { fontSize: 12, color: ui.muted, fontFamily: fonts.regular, marginTop: 2 },
});

export default DashboardScreen;
