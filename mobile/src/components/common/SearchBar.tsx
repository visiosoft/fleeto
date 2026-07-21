import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons as Icon } from '@expo/vector-icons';
import { colors, spacing, borderRadius, fontSize, fonts } from '../../config/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

const SearchBar: React.FC<Props> = ({ value, onChangeText, placeholder = 'Search...' }) => (
  <View style={styles.container}>
    <Icon name="magnify" size={22} color={colors.textSecondary} style={styles.icon} />
    <TextInput
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textLight}
    />
    {value.length > 0 && (
      <TouchableOpacity onPress={() => onChangeText('')}>
        <Icon name="close-circle" size={20} color={colors.textLight} />
      </TouchableOpacity>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: borderRadius.xl,
    paddingHorizontal: spacing.md,
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    height: 46,
    borderWidth: 0,
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  icon: { marginRight: spacing.sm },
  input: {
    flex: 1,
    fontSize: fontSize.md,
    fontFamily: fonts.regular,
    color: colors.text,
    paddingVertical: 0,
  },
});

export default SearchBar;
