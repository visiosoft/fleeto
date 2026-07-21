import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import Card from '../../components/common/Card';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

const ProfileScreen = () => {
  const { user } = useAuth();

  const rows = [
    { icon: 'account-outline', label: 'Name', value: user?.name },
    { icon: 'email-outline', label: 'Email', value: user?.email },
    { icon: 'shield-account-outline', label: 'Role', value: user?.role },
  ].filter(r => r.value);

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.name || user?.email || 'U')[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.name || 'User'}</Text>
        <Text style={styles.email}>{user?.email || ''}</Text>
      </View>
      <Card style={{ marginHorizontal: spacing.md }}>
        <Text style={styles.section}>Account Details</Text>
        {rows.map((r, i) => (
          <View key={i} style={[styles.row, i < rows.length - 1 && styles.border]}>
            <View style={styles.left}>
              <Icon name={r.icon} size={18} color={colors.textSecondary} />
              <Text style={styles.label}>{r.label}</Text>
            </View>
            <Text style={styles.val}>{r.value}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center', paddingVertical: spacing.xl, paddingBottom: spacing.lg,
    backgroundColor: colors.primary,
  },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(255,255,255,0.15)', justifyContent: 'center', alignItems: 'center',
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 36, fontFamily: fonts.bold, color: colors.white },
  name: { fontSize: fontSize.xl, fontFamily: fonts.bold, color: colors.white },
  email: { fontSize: fontSize.md, fontFamily: fonts.regular, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  section: { fontSize: fontSize.lg, fontFamily: fonts.bold, color: colors.text, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.sm + 2 },
  border: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  left: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: fontSize.sm, fontFamily: fonts.regular, color: colors.textSecondary, marginLeft: spacing.sm },
  val: { fontSize: fontSize.sm, fontFamily: fonts.semiBold, color: colors.text },
});

export default ProfileScreen;
