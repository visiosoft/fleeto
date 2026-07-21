import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { borderRadius, fontSize, fonts } from '../../config/theme';

const statusColors: Record<string, { bg: string; text: string }> = {
  active: { bg: '#DCFCE7', text: '#166534' },
  inactive: { bg: '#FEE2E2', text: '#991B1B' },
  pending: { bg: '#FEF3C7', text: '#92400E' },
  completed: { bg: '#DCFCE7', text: '#166534' },
  expired: { bg: '#FEE2E2', text: '#991B1B' },
  paid: { bg: '#DCFCE7', text: '#166534' },
  unpaid: { bg: '#FEE2E2', text: '#991B1B' },
  partial: { bg: '#FEF3C7', text: '#92400E' },
  overdue: { bg: '#FEE2E2', text: '#991B1B' },
  draft: { bg: '#F3F4F6', text: '#374151' },
  cancelled: { bg: '#F3F4F6', text: '#6B7280' },
  approved: { bg: '#DBEAFE', text: '#1E40AF' },
  assigned: { bg: '#DBEAFE', text: '#1E40AF' },
  available: { bg: '#DCFCE7', text: '#166534' },
};

interface Props {
  status: string;
}

const StatusBadge: React.FC<Props> = ({ status }) => {
  const normalized = status?.toLowerCase() || 'pending';
  const color = statusColors[normalized] || { bg: '#F3F4F6', text: '#374151' };
  return (
    <View style={[styles.badge, { backgroundColor: color.bg }]}>
      <Text style={[styles.text, { color: color.text }]}>
        {status?.charAt(0).toUpperCase() + status?.slice(1) || 'Unknown'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: fontSize.xs,
    fontFamily: fonts.semiBold,
  },
});

export default StatusBadge;
