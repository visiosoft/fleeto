import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';
import { ui } from '../../config/ui';
import { fonts } from '../../config/theme';

const getInitials = (text?: string) => {
  if (!text) return 'U';
  const parts = text.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
};

const SettingsScreen = ({ navigation }: any) => {
  const { user, companies, selectedCompanyId, selectCompany, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const handleLogout = () => {
    if (Platform.OS === 'web') {
      // eslint-disable-next-line no-alert
      if (window.confirm('Are you sure you want to sign out?')) logout();
      return;
    }
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => logout() },
    ]);
  };

  const menuItems = [
    { icon: 'account-group-outline', label: 'Team Members', onPress: () => navigation.navigate('SettingsUsers') },
    { icon: 'office-building-cog-outline', label: 'Company Settings', onPress: () => navigation.navigate('SettingsCompany') },
    { icon: 'file-document-edit-outline', label: 'Letterheads', onPress: () => navigation.navigate('SettingsLetterheads') },
    { icon: 'message-text-outline', label: 'Message Templates', onPress: () => navigation.navigate('SettingsTemplates') },
    { icon: 'note-text-outline', label: 'General Notes', onPress: () => navigation.navigate('SettingsNotes') },
    { icon: 'gas-station-outline', label: 'Fuel Records', onPress: () => navigation.navigate('SettingsFuelRecords') },
    { icon: 'wrench-outline', label: 'Maintenance', onPress: () => navigation.navigate('SettingsMaintenance') },
    { icon: 'account-cash-outline', label: 'Staff Accounts', onPress: () => navigation.navigate('SettingsStaffAccounts') },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingTop: insets.top + 16 }]}>
      <Text style={styles.title}>Settings</Text>

      {/* Profile card */}
      <TouchableOpacity
        style={styles.profileCard}
        activeOpacity={0.7}
        onPress={() => navigation.navigate('Profile')}
      >
        <LinearGradient colors={['#5B2BC9', '#7C4DFF']} style={styles.avatar}>
          <Text style={styles.avatarText}>{getInitials(user?.name || user?.email)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{user?.name || 'Admin User'}</Text>
          <Text style={styles.email}>{user?.email || ''}</Text>
          <Text style={styles.role}>{user?.role || 'Admin'}</Text>
        </View>
        <Icon name="chevron-right" size={22} color={ui.muted} />
      </TouchableOpacity>

      {/* Companies */}
      <Text style={styles.sectionLabel}>Your Companies</Text>
      <View style={styles.companyList}>
        {companies.map((company) => {
          const id = company._id || (company as any).id;
          const selected = id === selectedCompanyId;
          return (
            <TouchableOpacity
              key={id}
              style={[styles.companyCard, selected ? styles.companyCardSelected : styles.companyCardDefault]}
              activeOpacity={0.7}
              onPress={() => selectCompany(id)}
            >
              <View style={[styles.companyIcon, { backgroundColor: selected ? ui.purple : ui.ink }]}>
                {selected ? (
                  <Icon name="office-building-outline" size={20} color="#fff" />
                ) : (
                  <Text style={styles.companyInitials}>{getInitials(company.name)}</Text>
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.companyName} numberOfLines={1}>{company.name}</Text>
                <Text style={styles.companySub}>{selected ? 'Active company' : 'Tap to switch'}</Text>
              </View>
              {selected ? (
                <View style={styles.checkCircle}>
                  <Icon name="check" size={12} color="#fff" />
                </View>
              ) : (
                <View style={styles.emptyCircle} />
              )}
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity
          style={styles.addCompanyBtn}
          activeOpacity={0.7}
          onPress={() => {
            if (Platform.OS === 'web') {
              // eslint-disable-next-line no-alert
              window.alert('Contact support to add a new company.');
            } else {
              Alert.alert('Add Company', 'Contact support to add a new company.');
            }
          }}
        >
          <Icon name="plus" size={18} color={ui.purple} />
          <Text style={styles.addCompanyText}>Add Company</Text>
        </TouchableOpacity>
      </View>

      {/* Everything else lives in the left drawer; only sign-out remains here */}
      <View style={[styles.menuCard, { marginTop: 20 }]}>
        <TouchableOpacity style={styles.menuRow} activeOpacity={0.7} onPress={handleLogout}>
          <View style={[styles.menuIcon, { backgroundColor: ui.redTint }]}>
            <Icon name="logout" size={16} color={ui.red} />
          </View>
          <Text style={[styles.menuLabel, { color: ui.red }]}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: ui.bg },
  content: { paddingTop: 16, paddingBottom: 40 },
  title: {
    fontSize: 24, fontFamily: fonts.bold, color: ui.ink,
    letterSpacing: -0.48, paddingHorizontal: 20,
  },
  profileCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    margin: 20, backgroundColor: '#fff', borderRadius: 18, padding: 20,
    borderWidth: 1, borderColor: ui.cardBorder,
  },
  avatar: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 20, fontFamily: fonts.bold, color: '#fff' },
  name: { fontSize: 17, fontFamily: fonts.bold, color: ui.ink },
  email: { fontSize: 13, fontFamily: fonts.regular, color: ui.muted },
  role: { fontSize: 12, fontFamily: fonts.semiBold, color: ui.purple, marginTop: 2 },
  sectionLabel: {
    fontSize: 13, fontFamily: fonts.semiBold, color: ui.ink,
    marginHorizontal: 20, marginBottom: 10,
  },
  companyList: { marginHorizontal: 20, gap: 8 },
  companyCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
  },
  companyCardSelected: { borderWidth: 2, borderColor: ui.purple },
  companyCardDefault: { borderWidth: 1, borderColor: ui.cardBorder },
  companyIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
  companyInitials: { fontSize: 14, fontFamily: fonts.bold, color: '#fff' },
  companyName: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.ink },
  companySub: { fontSize: 12, fontFamily: fonts.regular, color: ui.muted },
  checkCircle: {
    width: 20, height: 20, borderRadius: 10, backgroundColor: ui.purple,
    justifyContent: 'center', alignItems: 'center',
  },
  emptyCircle: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 1.5, borderColor: 'rgba(20,8,31,0.15)',
  },
  addCompanyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 14, borderWidth: 2, borderStyle: 'dashed',
    borderColor: 'rgba(91,43,201,0.2)', padding: 14,
  },
  addCompanyText: { fontSize: 14, fontFamily: fonts.semiBold, color: ui.purple },
  menuCard: {
    marginHorizontal: 20, marginBottom: 40,
    backgroundColor: '#fff', borderRadius: 16,
    borderWidth: 1, borderColor: ui.cardBorder, overflow: 'hidden',
  },
  menuRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 14, paddingHorizontal: 16,
  },
  menuRowBorder: { borderBottomWidth: 1, borderBottomColor: ui.hairline },
  menuIcon: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: ui.lilac,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { flex: 1, fontSize: 14, fontFamily: fonts.medium, color: ui.ink },
});

export default SettingsScreen;
