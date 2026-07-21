import React from 'react';
import { TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, shadows } from '../../config/theme';

interface Props {
  icon?: string;
  onPress: () => void;
}

const FAB: React.FC<Props> = ({ icon = 'plus', onPress }) => (
  <TouchableOpacity style={styles.fab} onPress={onPress} activeOpacity={0.8}>
    <Icon name={icon} size={28} color={colors.white} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
});

export default FAB;
