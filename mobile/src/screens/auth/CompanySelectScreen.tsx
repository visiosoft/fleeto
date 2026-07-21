import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

const CompanySelectScreen = () => {
  const { companies, selectCompany, logout } = useAuth();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Icon name="domain" size={48} color={colors.primary} />
        <Text style={styles.title}>Select Company</Text>
        <Text style={styles.subtitle}>Choose a company to continue</Text>
      </View>

      <FlatList
        data={companies}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.companyCard}
            onPress={() => selectCompany(item._id)}
            activeOpacity={0.7}
          >
            <View style={styles.companyIcon}>
              <Icon name="office-building" size={28} color={colors.primary} />
            </View>
            <View style={styles.companyInfo}>
              <Text style={styles.companyName}>{item.name}</Text>
            </View>
            <Icon name="chevron-right" size={24} color={colors.textLight} />
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Icon name="logout" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    alignItems: 'center',
    paddingTop: spacing.xxl + 20,
    paddingBottom: spacing.xl,
  },
  title: { fontSize: fontSize.xxl, fontFamily: fonts.bold, color: colors.text, marginTop: spacing.md },
  subtitle: { fontSize: fontSize.md, color: colors.textSecondary, marginTop: spacing.xs, fontFamily: fonts.regular },
  list: { padding: spacing.md },
  companyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  companyIcon: {
    width: 50, height: 50, borderRadius: borderRadius.md,
    backgroundColor: '#EBF5FF',
    justifyContent: 'center', alignItems: 'center',
  },
  companyInfo: { flex: 1, marginLeft: spacing.md },
  companyName: { fontSize: fontSize.lg, fontFamily: fonts.semiBold, color: colors.text },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  logoutText: { fontSize: fontSize.md, color: colors.error, fontFamily: fonts.semiBold, marginLeft: spacing.sm },
});

export default CompanySelectScreen;
