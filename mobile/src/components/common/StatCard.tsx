import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, shadows, fonts } from '../../config/theme';

interface Props {
  title: string;
  value: string | number;
  icon: string;
  iconColor?: string;
  iconBg?: string;
  trend?: { value: number; isPositive: boolean };
}

const StatCard: React.FC<Props> = ({
  title,
  value,
  icon,
  iconColor = colors.primary,
  iconBg = colors.purpleLight,
  trend,
}) => (
  <View style={styles.card}>
    <View style={styles.header}>
      <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
        <Icon name={icon} size={20} color={iconColor} />
      </View>
      {trend && (
        <View style={[styles.trendBadge, { backgroundColor: trend.isPositive ? colors.successLight : colors.errorLight }]}>
          <Icon
            name={trend.isPositive ? 'trending-up' : 'trending-down'}
            size={12}
            color={trend.isPositive ? colors.success : colors.error}
          />
          <Text style={[styles.trendText, { color: trend.isPositive ? colors.success : colors.error }]}>
            {trend.value}%
          </Text>
        </View>
      )}
    </View>
    <Text style={styles.value}>{typeof value === 'object' ? '-' : value}</Text>
    <Text style={styles.title}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    flex: 1,
    minWidth: '45%',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
  },
  trendText: {
    fontSize: fontSize.xs,
    fontFamily: fonts.semiBold,
    marginLeft: 2,
  },
  value: {
    fontSize: fontSize.xxl,
    fontFamily: fonts.extraBold,
    color: colors.text,
  },
  title: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
    fontFamily: fonts.medium,
  },
});

export default StatCard;
